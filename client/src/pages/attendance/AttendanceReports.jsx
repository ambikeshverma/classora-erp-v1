import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import MasterReport from "../../components/reports/MasterReport";
import { SkeletonStats, SkeletonTable } from "../../components/Skeleton";
import { attendanceService, schoolService } from "../../services/api";

const months = [
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
];

const isSunday = (date) => new Date(date).getDay() === 0;

const getDatesBetween = (fromDate, toDate) => {
  if (!fromDate || !toDate) return [];
  const dates = [];
  const current = new Date(fromDate);
  const end = new Date(toDate);

  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

const getMonthDates = (month) => {
  const currentYear = new Date().getFullYear();
  const year = ["01", "02", "03"].includes(month)
    ? String(currentYear + 1)
    : String(currentYear);

  const totalDays = new Date(Number(year), Number(month), 0).getDate();

  return Array.from({ length: totalDays }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
};

const getAttendancePercent = (present, leave, workingDays) => {
  if (!workingDays || workingDays <= 0) return 0;
  return Number((((present + leave) / workingDays) * 100).toFixed(2));
};

function AttendanceReports() {
  const [loading, setLoading] = useState(true);

  // Dynamic entities from DB
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [students, setStudents] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [studentAttendance, setStudentAttendance] = useState([]);
  const [staffAttendance, setStaffAttendance] = useState([]);

  // School profile from DB
  const [schoolProfile, setSchoolProfile] = useState({
    schoolId: localStorage.getItem("schoolId") || localStorage.getItem("campusId") || "",
    schoolName: localStorage.getItem("userName") || "School Admin",
    address: "",
    email: "",
    website: "",
    phone: "",
    logo: "",
  });

  const currentUser = {
    name: localStorage.getItem("userName") || "School Admin",
  };

  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchReportsData = async () => {
      try {
        setLoading(true);

        const [reportsRes, profRes] = await Promise.allSettled([
          attendanceService.getReportsData(),
          schoolService.getProfile(),
        ]);

        if (reportsRes.status === "fulfilled" && reportsRes.value.data?.success) {
          const d = reportsRes.value.data.data;
          setClasses(d.classes || []);
          setSections(d.sections || []);
          setDepartments(d.departments || []);
          setPositions(d.positions || []);
          setStudents(d.students || []);
          setStaffList(d.staffList || []);
          setHolidays(d.holidays || []);
          setStudentAttendance(d.studentAttendance || []);
          setStaffAttendance(d.staffAttendance || []);
        }

        if (profRes.status === "fulfilled" && profRes.value.data?.success) {
          const p = profRes.value.data.school || profRes.value.data.data || {};
          setSchoolProfile((prev) => ({
            ...prev,
            schoolId: p.campusId || p._id || prev.schoolId,
            schoolName: p.schoolName || prev.schoolName,
            address: p.address || "",
            email: p.email || "",
            website: p.website || "",
            phone: p.contactNo || "",
            logo: p.schoolLogo || "",
          }));
        }
      } catch (err) {
        console.error("Failed to load attendance reports data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportsData();
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");

  const getClassName = useCallback(
    (classId) =>
      classes.find((item) => String(item.classId) === String(classId))?.className || "-",
    [classes]
  );

  const getSectionName = useCallback(
    (sectionId) =>
      sections.find((item) => String(item.sectionId) === String(sectionId))?.sectionName || "-",
    [sections]
  );

  const getDepartmentName = useCallback(
    (departmentId) =>
      departments.find((item) => String(item.departmentId) === String(departmentId))
        ?.departmentName || "-",
    [departments]
  );

  const getPositionName = useCallback(
    (positionId) =>
      positions.find((item) => String(item.positionId) === String(positionId))
        ?.positionName || "-",
    [positions]
  );

  const isHoliday = useCallback(
    (date) => holidays.some((item) => item.date === date),
    [holidays]
  );

  const getStudentStatus = useCallback(
    (studentId, date) => {
      if (isHoliday(date)) return "H";
      if (isSunday(date)) return "W";

      const found = studentAttendance.find(
        (item) => String(item.studentId) === String(studentId) && item.date === date
      );
      return found ? found.status : "-";
    },
    [holidays, isHoliday, studentAttendance]
  );

  const getStaffStatus = useCallback(
    (employeeId, date) => {
      if (isHoliday(date)) return "H";
      if (isSunday(date)) return "W";

      const found = staffAttendance.find(
        (item) =>
          (String(item.employeeId) === String(employeeId) ||
            String(item.staffId) === String(employeeId)) &&
          item.date === date
      );

      if (found) {
        if (found.status === "Present") return "P";
        if (found.status === "Absent") return "A";
        if (found.status?.startsWith("Leave")) return "L";
        return found.status || "-";
      }

      return "-";
    },
    [holidays, isHoliday, staffAttendance]
  );

  const classOptions = useMemo(
    () =>
      classes.map((item) => ({
        value: item.classId,
        label: item.className,
      })),
    [classes]
  );

  const sectionOptions = useMemo(
    () =>
      sections.map((item) => ({
        value: item.sectionId,
        label: `${item.className ? item.className + " - " : ""}${item.sectionName}`,
      })),
    [sections]
  );

  const departmentOptions = useMemo(
    () =>
      departments.map((item) => ({
        value: item.departmentId,
        label: item.departmentName,
      })),
    [departments]
  );

  const positionOptions = useMemo(
    () =>
      positions.map((item) => ({
        value: item.positionId,
        label: item.positionName,
      })),
    [positions]
  );

  const commonStudentFilters = useMemo(
    () => [
      {
        name: "classId",
        label: "Class",
        type: "select",
        placeholder: "All Class",
        options: classOptions,
      },
      {
        name: "sectionId",
        label: "Section",
        type: "select",
        placeholder: "All Section",
        options: sectionOptions,
      },
    ],
    [classOptions, sectionOptions]
  );

  const commonStaffFilters = useMemo(
    () => [
      {
        name: "departmentId",
        label: "Department",
        type: "select",
        placeholder: "All Department",
        options: departmentOptions,
      },
      {
        name: "positionId",
        label: "Position",
        type: "select",
        placeholder: "All Position",
        options: positionOptions,
      },
    ],
    [departmentOptions, positionOptions]
  );

  const dayColumns = useMemo(
    () =>
      getMonthDates(currentMonth).map((date) => ({
        key: date,
        label: date.split("-")[2],
        render: (row) => row[date] || "-",
      })),
    [currentMonth]
  );

  const reports = useMemo(() => {
    const sId = schoolProfile.schoolId;

    return [
      /* ===================================================
         1. STUDENT ATTENDANCE SUMMARY REPORT
      =================================================== */
      {
        id: "student-attendance-summary-report",
        title: "Student Attendance Summary Report",
        description: "View class or section wise student attendance summary",
        icon: "🎓",
        defaultFilters: {
          classId: "",
          sectionId: "",
          attendanceDate: today,
        },
        filters: [
          ...commonStudentFilters,
          {
            name: "attendanceDate",
            label: "Date",
            type: "date",
          },
        ],
        columns: [
          { key: "sno", label: "S.No", render: (_, index) => index + 1 },
          { key: "groupName", label: "Class / Section" },
          { key: "total", label: "Total" },
          { key: "present", label: "Present" },
          { key: "absent", label: "Absent" },
          { key: "leave", label: "Leave" },
          { key: "percentage", label: "% Presence" },
        ],
        getData: ({ filters }) => {
          const date = filters.attendanceDate || today;

          const filteredStudents = students.filter(
            (item) =>
              (!filters.classId || String(item.classId) === String(filters.classId)) &&
              (!filters.sectionId || String(item.sectionId) === String(filters.sectionId))
          );

          const groups = {};

          filteredStudents.forEach((student) => {
            let groupKey = student.classId;
            let groupName = getClassName(student.classId);

            if (filters.classId && !filters.sectionId) {
              groupKey = student.sectionId;
              groupName = getSectionName(student.sectionId);
            }

            if (filters.classId && filters.sectionId) {
              groupKey = `${student.classId}-${student.sectionId}`;
              groupName = `${getClassName(student.classId)} (${getSectionName(
                student.sectionId
              )})`;
            }

            if (!groups[groupKey]) {
              groups[groupKey] = {
                schoolId: sId,
                groupName,
                total: 0,
                present: 0,
                absent: 0,
                leave: 0,
              };
            }

            groups[groupKey].total += 1;

            const status = getStudentStatus(student.id || student.studentId, date);
            if (status === "P") groups[groupKey].present += 1;
            if (status === "A") groups[groupKey].absent += 1;
            if (status === "L") groups[groupKey].leave += 1;
          });

          return Object.values(groups).map((group) => ({
            ...group,
            percentage: `${getAttendancePercent(
              group.present,
              group.leave,
              group.total
            )}%`,
          }));
        },
      },

      /* ===================================================
         2. DAILY STUDENT ATTENDANCE REPORT
      =================================================== */
      {
        id: "daily-student-attendance-report",
        title: "Daily Student Attendance Report",
        description: "View student wise daily attendance status",
        icon: "📅",
        defaultFilters: {
          classId: "",
          sectionId: "",
          attendanceStatus: "",
          attendanceDate: today,
        },
        filters: [
          ...commonStudentFilters,
          {
            name: "attendanceStatus",
            label: "Attendance Status",
            type: "select",
            placeholder: "All Status",
            options: [
              { value: "P", label: "Present" },
              { value: "A", label: "Absent" },
              { value: "L", label: "Leave" },
              { value: "W", label: "Weekly Off" },
              { value: "H", label: "Holiday" },
            ],
          },
          {
            name: "attendanceDate",
            label: "Attendance Date",
            type: "date",
          },
        ],
        columns: [
          { key: "sno", label: "S.No", render: (_, index) => index + 1 },
          { key: "rollNo", label: "Roll No" },
          { key: "studentName", label: "Student Name" },
          { key: "fatherName", label: "Father Name" },
          { key: "className", label: "Class" },
          { key: "sectionName", label: "Section" },
          { key: "status", label: "Status" },
          { key: "mobile", label: "Mobile" },
        ],
        getData: ({ filters }) => {
          const date = filters.attendanceDate || today;

          return students
            .filter(
              (item) =>
                (!filters.classId || String(item.classId) === String(filters.classId)) &&
                (!filters.sectionId || String(item.sectionId) === String(filters.sectionId))
            )
            .map((student) => ({
              schoolId: sId,
              rollNo: student.rollNo,
              studentName: student.studentName,
              fatherName: student.fatherName,
              className: getClassName(student.classId),
              sectionName: getSectionName(student.sectionId),
              mobile: student.mobile,
              status: getStudentStatus(student.id || student.studentId, date),
            }))
            .filter((item) =>
              filters.attendanceStatus
                ? item.status === filters.attendanceStatus
                : true
            );
        },
      },

      /* ===================================================
         3. MONTHLY STUDENT ATTENDANCE REPORT
      =================================================== */
      {
        id: "monthly-student-attendance-report",
        title: "Monthly Student Attendance Report",
        description: "View student wise full month attendance register",
        icon: "🗓️",
        defaultFilters: {
          classId: classes[0]?.classId || "",
          sectionId: sections[0]?.sectionId || "",
          month: currentMonth,
        },
        filters: [
          ...commonStudentFilters,
          {
            name: "month",
            label: "Month",
            type: "select",
            placeholder: "Select Month",
            options: months,
          },
        ],
        columns: [
          { key: "sno", label: "S.No", render: (_, index) => index + 1 },
          { key: "rollNo", label: "Roll No" },
          { key: "studentName", label: "Student Name" },
          ...dayColumns,
          { key: "present", label: "Present" },
          { key: "absent", label: "Absent" },
          { key: "leave", label: "Leave" },
          { key: "percentage", label: "%" },
        ],
        getData: ({ filters }) => {
          const month = filters.month || currentMonth;
          const dates = getMonthDates(month);

          return students
            .filter(
              (item) =>
                (!filters.classId || String(item.classId) === String(filters.classId)) &&
                (!filters.sectionId || String(item.sectionId) === String(filters.sectionId))
            )
            .map((student) => {
              let present = 0;
              let absent = 0;
              let leave = 0;
              let holiday = 0;
              let weeklyOff = 0;

              const row = {
                schoolId: sId,
                rollNo: student.rollNo,
                studentName: student.studentName,
              };

              dates.forEach((date) => {
                const status = getStudentStatus(student.id || student.studentId, date);
                row[date] = status;

                if (status === "P") present += 1;
                if (status === "A") absent += 1;
                if (status === "L") leave += 1;
                if (status === "H") holiday += 1;
                if (status === "W") weeklyOff += 1;
              });

              const workingDays = dates.length - holiday - weeklyOff;

              return {
                ...row,
                present,
                absent,
                leave,
                percentage: `${getAttendancePercent(present, leave, workingDays)}%`,
              };
            });
        },
      },

      /* ===================================================
         4. STUDENT LONG ABSENCE REPORT
      =================================================== */
      {
        id: "student-long-absence-report",
        title: "Student Long Absence Report",
        description: "View students with continuous absence for selected days",
        icon: "⚠️",
        defaultFilters: {
          classId: "",
          sectionId: "",
          fromDate: today,
          toDate: today,
          minDays: "3",
        },
        filters: [
          ...commonStudentFilters,
          {
            name: "fromDate",
            label: "From Date",
            type: "date",
          },
          {
            name: "toDate",
            label: "To Date",
            type: "date",
          },
          {
            name: "minDays",
            label: "Min Days",
            type: "select",
            placeholder: "Select Days",
            options: [
              { value: "2", label: "2 Days" },
              { value: "3", label: "3 Days" },
              { value: "5", label: "5 Days" },
              { value: "7", label: "7 Days" },
            ],
          },
        ],
        columns: [
          { key: "sno", label: "S.No", render: (_, index) => index + 1 },
          { key: "rollNo", label: "Roll No" },
          { key: "studentName", label: "Student Name" },
          { key: "fatherName", label: "Father Name" },
          { key: "className", label: "Class" },
          { key: "sectionName", label: "Section" },
          { key: "absentDays", label: "Absent Days" },
          { key: "lastPresentDate", label: "Last Present Date" },
          { key: "mobile", label: "Mobile" },
        ],
        getData: ({ filters }) => {
          const fromDate = filters.fromDate || today;
          const toDate = filters.toDate || today;
          const minDays = Number(filters.minDays || 3);
          const dates = getDatesBetween(fromDate, toDate);

          return students
            .filter(
              (item) =>
                (!filters.classId || String(item.classId) === String(filters.classId)) &&
                (!filters.sectionId || String(item.sectionId) === String(filters.sectionId))
            )
            .map((student) => {
              let absentDays = 0;
              let lastPresentDate = "-";

              dates.forEach((date) => {
                const status = getStudentStatus(student.id || student.studentId, date);
                if (status === "A") {
                  absentDays += 1;
                }
                if (status === "P") {
                  lastPresentDate = date;
                }
              });

              return {
                schoolId: sId,
                rollNo: student.rollNo,
                studentName: student.studentName,
                fatherName: student.fatherName,
                className: getClassName(student.classId),
                sectionName: getSectionName(student.sectionId),
                mobile: student.mobile,
                absentDays,
                lastPresentDate,
              };
            })
            .filter((item) => item.absentDays >= minDays);
        },
      },

      /* ===================================================
         5. STUDENT ATTENDANCE PERCENTAGE REPORT
      =================================================== */
      {
        id: "student-attendance-percentage-report",
        title: "Student Attendance Percentage Report",
        description: "View student attendance percentage for given date range",
        icon: "📊",
        defaultFilters: {
          classId: "",
          sectionId: "",
          fromDate: today,
          toDate: today,
          operator: "All",
          percentage: "75",
        },
        filters: [
          ...commonStudentFilters,
          {
            name: "fromDate",
            label: "From Date",
            type: "date",
          },
          {
            name: "toDate",
            label: "To Date",
            type: "date",
          },
          {
            name: "operator",
            label: "Criteria",
            type: "select",
            placeholder: "All",
            options: [
              { value: "All", label: "All" },
              { value: "LessThan", label: "Less Than" },
              { value: "GreaterThan", label: "Greater Than" },
            ],
          },
          {
            name: "percentage",
            label: "% Value",
            type: "select",
            placeholder: "Select %",
            options: [
              { value: "50", label: "50%" },
              { value: "60", label: "60%" },
              { value: "75", label: "75%" },
              { value: "85", label: "85%" },
            ],
          },
        ],
        columns: [
          { key: "sno", label: "S.No", render: (_, index) => index + 1 },
          { key: "rollNo", label: "Roll No" },
          { key: "studentName", label: "Student Name" },
          { key: "className", label: "Class" },
          { key: "sectionName", label: "Section" },
          { key: "workingDays", label: "Working Days" },
          { key: "presentDays", label: "Present Days" },
          { key: "leaveDays", label: "Leave Days" },
          { key: "percentage", label: "% Presence" },
          { key: "mobile", label: "Mobile" },
        ],
        getData: ({ filters }) => {
          const fromDate = filters.fromDate || today;
          const toDate = filters.toDate || today;
          const targetPercent = Number(filters.percentage || 75);
          const operator = filters.operator || "All";
          const dates = getDatesBetween(fromDate, toDate);

          return students
            .filter(
              (item) =>
                (!filters.classId || String(item.classId) === String(filters.classId)) &&
                (!filters.sectionId || String(item.sectionId) === String(filters.sectionId))
            )
            .map((student) => {
              let presentDays = 0;
              let leaveDays = 0;
              let holidayDays = 0;
              let weeklyOffDays = 0;

              dates.forEach((date) => {
                const status = getStudentStatus(student.id || student.studentId, date);
                if (status === "P") presentDays += 1;
                if (status === "L") leaveDays += 1;
                if (status === "H") holidayDays += 1;
                if (status === "W") weeklyOffDays += 1;
              });

              const workingDays = dates.length - holidayDays - weeklyOffDays;
              const percentValue = getAttendancePercent(
                presentDays,
                leaveDays,
                workingDays
              );

              return {
                schoolId: sId,
                rollNo: student.rollNo,
                studentName: student.studentName,
                className: getClassName(student.classId),
                sectionName: getSectionName(student.sectionId),
                workingDays,
                presentDays,
                leaveDays,
                percentValue,
                percentage: `${percentValue}%`,
                mobile: student.mobile,
              };
            })
            .filter((item) => {
              if (operator === "LessThan") return item.percentValue < targetPercent;
              if (operator === "GreaterThan") return item.percentValue > targetPercent;
              return true;
            });
        },
      },

      /* ===================================================
         6. STAFF ATTENDANCE SUMMARY REPORT
      =================================================== */
      {
        id: "staff-attendance-summary-report",
        title: "Staff Attendance Summary Report",
        description: "View department or position wise staff attendance summary",
        icon: "👨‍🏫",
        defaultFilters: {
          departmentId: "",
          positionId: "",
          attendanceDate: today,
        },
        filters: [
          ...commonStaffFilters,
          {
            name: "attendanceDate",
            label: "Date",
            type: "date",
          },
        ],
        columns: [
          { key: "sno", label: "S.No", render: (_, index) => index + 1 },
          { key: "groupName", label: "Department / Position" },
          { key: "total", label: "Total Staff" },
          { key: "present", label: "Present" },
          { key: "absent", label: "Absent" },
          { key: "leave", label: "Leave" },
          { key: "percentage", label: "% Presence" },
        ],
        getData: ({ filters }) => {
          const date = filters.attendanceDate || today;

          const filteredStaff = staffList.filter(
            (item) =>
              item.isActive &&
              (!filters.departmentId ||
                String(item.departmentId) === String(filters.departmentId)) &&
              (!filters.positionId ||
                String(item.positionId) === String(filters.positionId))
          );

          const groups = {};

          filteredStaff.forEach((staff) => {
            let groupKey = staff.departmentId;
            let groupName = getDepartmentName(staff.departmentId);

            if (filters.departmentId && !filters.positionId) {
              groupKey = staff.positionId;
              groupName = getPositionName(staff.positionId);
            }

            if (filters.departmentId && filters.positionId) {
              groupKey = `${staff.departmentId}-${staff.positionId}`;
              groupName = `${getDepartmentName(staff.departmentId)} (${getPositionName(
                staff.positionId
              )})`;
            }

            if (!groups[groupKey]) {
              groups[groupKey] = {
                schoolId: sId,
                groupName,
                total: 0,
                present: 0,
                absent: 0,
                leave: 0,
              };
            }

            groups[groupKey].total += 1;

            const status = getStaffStatus(staff.id || staff.staffId, date);
            if (status === "P") groups[groupKey].present += 1;
            if (status === "A") groups[groupKey].absent += 1;
            if (status === "L") groups[groupKey].leave += 1;
          });

          return Object.values(groups).map((group) => ({
            ...group,
            percentage: `${getAttendancePercent(
              group.present,
              group.leave,
              group.total
            )}%`,
          }));
        },
      },

      /* ===================================================
         7. DAILY STAFF ATTENDANCE REPORT
      =================================================== */
      {
        id: "daily-staff-attendance-report",
        title: "Daily Staff Attendance Report",
        description: "View staff wise daily attendance and check-in time",
        icon: "🕒",
        defaultFilters: {
          departmentId: "",
          positionId: "",
          attendanceStatus: "",
          attendanceDate: today,
        },
        filters: [
          ...commonStaffFilters,
          {
            name: "attendanceStatus",
            label: "Attendance Status",
            type: "select",
            placeholder: "All Status",
            options: [
              { value: "P", label: "Present" },
              { value: "A", label: "Absent" },
              { value: "L", label: "Leave" },
              { value: "W", label: "Weekly Off" },
              { value: "H", label: "Holiday" },
            ],
          },
          {
            name: "attendanceDate",
            label: "Attendance Date",
            type: "date",
          },
        ],
        columns: [
          { key: "sno", label: "S.No", render: (_, index) => index + 1 },
          { key: "employeeCode", label: "Employee Code" },
          { key: "employeeName", label: "Employee Name" },
          { key: "departmentName", label: "Department" },
          { key: "positionName", label: "Position" },
          { key: "status", label: "Status" },
          { key: "checkInTime", label: "Check In Time" },
          { key: "mobile", label: "Mobile" },
        ],
        getData: ({ filters }) => {
          const date = filters.attendanceDate || today;

          return staffList
            .filter(
              (item) =>
                item.isActive &&
                (!filters.departmentId ||
                  String(item.departmentId) === String(filters.departmentId)) &&
                (!filters.positionId ||
                  String(item.positionId) === String(filters.positionId))
            )
            .map((staff) => {
              const att = staffAttendance.find(
                (item) =>
                  (String(item.employeeId) === String(staff.id || staff.staffId) ||
                    String(item.staffId) === String(staff.id || staff.staffId)) &&
                  item.date === date
              );

              return {
                schoolId: sId,
                employeeCode: staff.employeeCode,
                employeeName: staff.employeeName,
                departmentName: getDepartmentName(staff.departmentId),
                positionName: getPositionName(staff.positionId),
                status: getStaffStatus(staff.id || staff.staffId, date),
                checkInTime: att ? att.checkInTime || "--" : "--",
                mobile: staff.mobile,
              };
            })
            .filter((item) =>
              filters.attendanceStatus
                ? item.status === filters.attendanceStatus
                : true
            );
        },
      },

      /* ===================================================
         8. MONTHLY STAFF ATTENDANCE REPORT
      =================================================== */
      {
        id: "monthly-staff-attendance-report",
        title: "Monthly Staff Attendance Report",
        description: "View staff full month attendance register and paid days",
        icon: "📋",
        defaultFilters: {
          departmentId: departments[0]?.departmentId || "",
          positionId: positions[0]?.positionId || "",
          month: currentMonth,
        },
        filters: [
          ...commonStaffFilters,
          {
            name: "month",
            label: "Month",
            type: "select",
            placeholder: "Select Month",
            options: months,
          },
        ],
        columns: [
          { key: "sno", label: "S.No", render: (_, index) => index + 1 },
          { key: "employeeCode", label: "Employee Code" },
          { key: "employeeName", label: "Employee Name" },
          ...dayColumns,
          { key: "present", label: "Present" },
          { key: "absent", label: "Absent" },
          { key: "leave", label: "Leave" },
          { key: "paidDays", label: "Paid Days" },
          { key: "percentage", label: "%" },
        ],
        getData: ({ filters }) => {
          const month = filters.month || currentMonth;
          const dates = getMonthDates(month);

          return staffList
            .filter(
              (item) =>
                item.isActive &&
                (!filters.departmentId ||
                  String(item.departmentId) === String(filters.departmentId)) &&
                (!filters.positionId ||
                  String(item.positionId) === String(filters.positionId))
            )
            .map((staff) => {
              let present = 0;
              let absent = 0;
              let leave = 0;
              let holiday = 0;
              let weeklyOff = 0;

              const row = {
                schoolId: sId,
                employeeCode: staff.employeeCode,
                employeeName: staff.employeeName,
              };

              dates.forEach((date) => {
                const status = getStaffStatus(staff.id || staff.staffId, date);
                row[date] = status;

                if (status === "P") present += 1;
                if (status === "A") absent += 1;
                if (status === "L") leave += 1;
                if (status === "H") holiday += 1;
                if (status === "W") weeklyOff += 1;
              });

              const workingDays = dates.length - holiday - weeklyOff;
              const paidDays = present + leave + holiday + weeklyOff;

              return {
                ...row,
                present,
                absent,
                leave,
                paidDays,
                percentage: `${getAttendancePercent(
                  present,
                  leave,
                  workingDays
                )}%`,
              };
            });
        },
      },
    ];
  }, [
    schoolProfile,
    classes,
    sections,
    departments,
    positions,
    students,
    staffList,
    holidays,
    studentAttendance,
    staffAttendance,
    today,
    currentMonth,
    commonStudentFilters,
    commonStaffFilters,
    dayColumns,
    getClassName,
    getDepartmentName,
    getPositionName,
    getSectionName,
    getStaffStatus,
    getStudentStatus,
  ]);

  if (loading) {
    return (
      <div style={{ padding: "24px" }}>
        <SkeletonStats count={4} />
        <div style={{ marginTop: "24px" }}>
          <SkeletonTable rows={6} columns={6} />
        </div>
      </div>
    );
  }

  return (
    <MasterReport
      moduleTitle="Attendance Analytics & Reports"
      reports={reports}
      schoolProfiles={[schoolProfile]}
      currentUser={currentUser}
    />
  );
}

export default AttendanceReports;
