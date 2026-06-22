import React from "react";
import MasterReport from "../../components/reports/MasterReport";

function AttendanceReports() {
 

  const schoolProfiles = [
    {
      schoolId: "SCH001",
      schoolName: "Chandra Shekhar Azad Inter College",
      address: "Azad Nagar, Barabanki",
      email: "school@gmail.com",
      website: "www.school.com",
      phone: "9876543210",
      logo: "",
    },
  ];

  const currentUser = {
    name: localStorage.getItem("userName") || "School Admin",
  };

  const classes = [
    { classId: "CLS001", className: "Class 3" },
    { classId: "CLS002", className: "Class 10" },
  ];

  const sections = [
    { sectionId: "SEC001", classId: "CLS001", sectionName: "A" },
    { sectionId: "SEC002", classId: "CLS001", sectionName: "B" },
    { sectionId: "SEC003", classId: "CLS002", sectionName: "A" },
  ];

  const departments = [
    { departmentId: "DEP001", departmentName: "Teaching" },
    { departmentId: "DEP002", departmentName: "Accounts" },
  ];

  const positions = [
    {
      positionId: "POS001",
      departmentId: "DEP001",
      positionName: "Teacher",
    },
    {
      positionId: "POS002",
      departmentId: "DEP001",
      positionName: "Coordinator",
    },
    {
      positionId: "POS003",
      departmentId: "DEP002",
      positionName: "Accountant",
    },
  ];

  const students = [
    {
      id: 1,
      schoolId: "SCH001",
      classId: "CLS001",
      sectionId: "SEC001",
      rollNo: "001",
      studentName: "Aman Kumar",
      fatherName: "Rajesh Kumar",
      mobile: "9876543210",
    },
    {
      id: 2,
      schoolId: "SCH001",
      classId: "CLS001",
      sectionId: "SEC001",
      rollNo: "002",
      studentName: "Riya Sharma",
      fatherName: "Manoj Sharma",
      mobile: "9876543211",
    },
    {
      id: 3,
      schoolId: "SCH001",
      classId: "CLS002",
      sectionId: "SEC003",
      rollNo: "001",
      studentName: "Rahul Singh",
      fatherName: "Suresh Singh",
      mobile: "9876543212",
    },
  ];

  const staffList = [
    {
      id: 1,
      schoolId: "SCH001",
      employeeCode: "SCH001-EMP-0001",
      employeeName: "Amit Kumar",
      departmentId: "DEP001",
      positionId: "POS001",
      mobile: "9876543210",
      isActive: true,
      lastWorkingDate: "",
    },
    {
      id: 2,
      schoolId: "SCH001",
      employeeCode: "SCH001-EMP-0002",
      employeeName: "Rahul Verma",
      departmentId: "DEP002",
      positionId: "POS003",
      mobile: "9876543211",
      isActive: true,
      lastWorkingDate: "",
    },
  ];

  const holidays = [
    {
      date: "2026-05-15",
      reason: "Holiday",
    },
  ];

  const studentAttendance = [
    {
      schoolId: "SCH001",
      studentId: 1,
      date: "2026-05-01",
      status: "P",
    },
    {
      schoolId: "SCH001",
      studentId: 2,
      date: "2026-05-01",
      status: "A",
    },
    {
      schoolId: "SCH001",
      studentId: 3,
      date: "2026-05-01",
      status: "P",
    },
    {
      schoolId: "SCH001",
      studentId: 1,
      date: "2026-05-02",
      status: "P",
    },
    {
      schoolId: "SCH001",
      studentId: 2,
      date: "2026-05-02",
      status: "L",
    },
    {
      schoolId: "SCH001",
      studentId: 3,
      date: "2026-05-02",
      status: "A",
    },
  ];

  const staffAttendance = [
    {
      schoolId: "SCH001",
      employeeId: 1,
      date: "2026-05-01",
      status: "P",
      checkInTime: "08:05 AM",
    },
    {
      schoolId: "SCH001",
      employeeId: 2,
      date: "2026-05-01",
      status: "A",
      checkInTime: "--",
    },
  ];

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

  const today = new Date().toISOString().split("T")[0];

  const getClassName = (classId) =>
    classes.find((item) => item.classId === classId)?.className || "-";

  const getSectionName = (sectionId) =>
    sections.find((item) => item.sectionId === sectionId)?.sectionName || "-";

  const getDepartmentName = (departmentId) =>
    departments.find((item) => item.departmentId === departmentId)
      ?.departmentName || "-";

  const getPositionName = (positionId) =>
    positions.find((item) => item.positionId === positionId)?.positionName ||
    "-";

  const isSunday = (date) => new Date(date).getDay() === 0;

  const isHoliday = (date) => holidays.some((item) => item.date === date);

  const getStudentStatus = (studentId, date) => {
    if (isHoliday(date)) return "H";
    if (isSunday(date)) return "W";

    return (
      studentAttendance.find(
        (item) => item.studentId === studentId && item.date === date
      )?.status || "-"
    );
  };

  const getStaffStatus = (employeeId, date) => {
    if (isHoliday(date)) return "H";
    if (isSunday(date)) return "W";

    return (
      staffAttendance.find(
        (item) => item.employeeId === employeeId && item.date === date
      )?.status || "-"
    );
  };
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
    const year = ["01", "02", "03"].includes(month)
      ? "2027"
      : "2026";

    const totalDays = new Date(
      Number(year),
      Number(month),
      0
    ).getDate();

    return Array.from(
      { length: totalDays },
      (_, index) => {
        const day = String(index + 1).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
    );
  };

  const getAttendancePercent = (
    present,
    leave,
    workingDays
  ) => {
    if (!workingDays) return 0;

    return Number(
      (
        ((present + leave) / workingDays) *
        100
      ).toFixed(2)
    );
  };

  const classOptions = classes.map((item) => ({
    value: item.classId,
    label: item.className,
  }));

  const sectionOptions = sections.map((item) => ({
    value: item.sectionId,
    label: item.sectionName,
  }));

  const departmentOptions = departments.map(
    (item) => ({
      value: item.departmentId,
      label: item.departmentName,
    })
  );

  const positionOptions = positions.map((item) => ({
    value: item.positionId,
    label: item.positionName,
  }));

  const commonStudentFilters = [
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
  ];

  const commonStaffFilters = [
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
  ];

  const dayColumns = getMonthDates("05").map(
    (date) => ({
      key: date,
      label: date.split("-")[2],
      render: (row) => row[date] || "-",
    })
  );

  const reports = [

/* ===================================================
   1. STUDENT ATTENDANCE SUMMARY REPORT
=================================================== */

{
  id: "student-attendance-summary-report",
  title: "Student Attendance Summary Report",
  description:
    "View class or section wise student attendance summary",
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
    {
      key: "sno",
      label: "S.No",
      render: (_, index) => index + 1,
    },
    {
      key: "groupName",
      label: "Class / Section",
    },
    {
      key: "total",
      label: "Total",
    },
    {
      key: "present",
      label: "Present",
    },
    {
      key: "absent",
      label: "Absent",
    },
    {
      key: "leave",
      label: "Leave",
    },
    {
      key: "percentage",
      label: "% Presence",
    },
  ],

  getData: ({ schoolId, filters }) => {
    const date =
      filters.attendanceDate || today;

    const filteredStudents =
      students.filter(
        (item) =>
          item.schoolId === schoolId &&
          (!filters.classId ||
            item.classId ===
              filters.classId) &&
          (!filters.sectionId ||
            item.sectionId ===
              filters.sectionId)
      );

    const groups = {};

    filteredStudents.forEach(
      (student) => {
        let groupKey =
          student.classId;

        let groupName =
          getClassName(
            student.classId
          );

        if (
          filters.classId &&
          !filters.sectionId
        ) {
          groupKey =
            student.sectionId;

          groupName =
            getSectionName(
              student.sectionId
            );
        }

        if (
          filters.classId &&
          filters.sectionId
        ) {
          groupKey =
            `${student.classId}-${student.sectionId}`;

          groupName =
            `${getClassName(
              student.classId
            )} - ${getSectionName(
              student.sectionId
            )}`;
        }

        if (!groups[groupKey]) {
          groups[groupKey] = {
            schoolId,
            groupName,
            total: 0,
            present: 0,
            absent: 0,
            leave: 0,
          };
        }

        const status =
          getStudentStatus(
            student.id,
            date
          );

        groups[groupKey].total += 1;

        if (status === "P")
          groups[groupKey].present += 1;

        if (status === "A")
          groups[groupKey].absent += 1;

        if (status === "L")
          groups[groupKey].leave += 1;
      }
    );

    return Object.values(
      groups
    ).map((item) => ({
      ...item,
      percentage: item.total
        ? `${Math.round(
            (item.present /
              item.total) *
              100
          )}%`
        : "0%",
    }));
  },
},

/* ===================================================
   2. DAILY STUDENT ATTENDANCE REPORT
=================================================== */

{
  id: "daily-student-attendance-report",

  title:
    "Daily Student Attendance Report",

  description:
    "View student wise attendance for selected date",

  icon: "🎓",

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
      label: "Student Status",
      type: "select",
      placeholder: "All Status",

      options: [
        {
          value: "P",
          label: "Present",
        },
        {
          value: "A",
          label: "Absent",
        },
        {
          value: "L",
          label: "Leave",
        },
      ],
    },

    {
      name: "attendanceDate",
      label: "Date",
      type: "date",
    },
  ],

  columns: [
    {
      key: "sno",
      label: "S.No",
      render: (_, index) => index + 1,
    },
    {
      key: "rollNo",
      label: "Roll No",
    },
    {
      key: "studentName",
      label: "Student Name",
    },
    {
      key: "fatherName",
      label: "Father Name",
    },
    {
      key: "className",
      label: "Class",
    },
    {
      key: "sectionName",
      label: "Section",
    },
    {
      key: "attendanceStatus",
      label: "Attendance Status",
    },
  ],
  getData: ({ schoolId, filters }) => {
    const date =
      filters.attendanceDate || today;

    return students
      .filter(
        (item) =>
          item.schoolId === schoolId &&
          (!filters.classId ||
            item.classId ===
              filters.classId) &&
          (!filters.sectionId ||
            item.sectionId ===
              filters.sectionId)
      )
      .map((student) => ({
        ...student,
        className: getClassName(
          student.classId
        ),
        sectionName: getSectionName(
          student.sectionId
        ),
        attendanceStatus:
          getStudentStatus(
            student.id,
            date
          ),
      }))
      .filter((item) =>
        filters.attendanceStatus
          ? item.attendanceStatus ===
            filters.attendanceStatus
          : true
      );
  },
},

/* ===================================================
   3. MONTHLY STUDENT ATTENDANCE REPORT
=================================================== */

{
  id: "monthly-student-attendance-report",

  title:
    "Monthly Student Attendance Report",

  description:
    "View monthly student attendance register",

  icon: "🎓",

  defaultFilters: {
    classId: "CLS001",
    sectionId: "SEC001",
    month: "05",
  },

  filters: [
    {
      name: "classId",
      label: "Class *",
      type: "select",
      placeholder: "Select Class",
      options: classOptions,
    },
    {
      name: "sectionId",
      label: "Section *",
      type: "select",
      placeholder: "Select Section",
      options: sectionOptions,
    },
    {
      name: "month",
      label: "Month",
      type: "select",
      placeholder: "Select Month",
      options: months,
    },
  ],

  columns: [
    {
      key: "rollNo",
      label: "Roll No",
    },
    {
      key: "studentName",
      label: "Student Name",
    },
    ...dayColumns,
    {
      key: "present",
      label: "P",
    },
    {
      key: "absent",
      label: "A",
    },
    {
      key: "leave",
      label: "L",
    },
  ],

  getData: ({ schoolId, filters }) => {
    const month =
      filters.month || "05";

    const dates =
      getMonthDates(month);

    return students
      .filter(
        (item) =>
          item.schoolId === schoolId &&
          item.classId ===
            filters.classId &&
          item.sectionId ===
            filters.sectionId
      )
      .map((student) => {
        let present = 0;
        let absent = 0;
        let leave = 0;

        const row = {
          schoolId,
          rollNo: student.rollNo,
          studentName:
            student.studentName,
        };

        dates.forEach((date) => {
          const status =
            getStudentStatus(
              student.id,
              date
            );

          row[date] = status;

          if (status === "P")
            present += 1;

          if (status === "A")
            absent += 1;

          if (status === "L")
            leave += 1;
        });

        return {
          ...row,
          present,
          absent,
          leave,
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

  description:
    "View students continuously absent for selected date range",

  icon: "🎓",

  defaultFilters: {
    classId: "",
    sectionId: "",
    fromDate: today,
    toDate: today,
    minimumAbsentDays: "3",
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
      name: "minimumAbsentDays",
      label: "Minimum Absent Days",
      type: "number",
      placeholder: "Enter days",
    },
  ],

  columns: [
    {
      key: "sno",
      label: "S.No",
      render: (_, index) => index + 1,
    },
    {
      key: "rollNo",
      label: "Roll No",
    },
    {
      key: "studentName",
      label: "Student Name",
    },
    {
      key: "fatherName",
      label: "Father Name",
    },
    {
      key: "className",
      label: "Class",
    },
    {
      key: "sectionName",
      label: "Section",
    },
    {
      key: "absentDays",
      label: "Absent Days",
    },
    {
      key: "fromDate",
      label: "From Date",
    },
    {
      key: "toDate",
      label: "To Date",
    },
  ],

  getData: ({ schoolId, filters }) => {
    const dates =
      getDatesBetween(
        filters.fromDate,
        filters.toDate
      );

    const minDays = Number(
      filters.minimumAbsentDays || 1
    );

    return students
      .filter(
        (item) =>
          item.schoolId === schoolId &&
          (!filters.classId ||
            item.classId ===
              filters.classId) &&
          (!filters.sectionId ||
            item.sectionId ===
              filters.sectionId)
      )
      .map((student) => {
        const absentDates =
          dates.filter(
            (date) =>
              getStudentStatus(
                student.id,
                date
              ) === "A"
          );

        return {
          ...student,
          className: getClassName(
            student.classId
          ),
          sectionName: getSectionName(
            student.sectionId
          ),
          absentDays:
            absentDates.length,
          fromDate:
            absentDates[0] || "-",
          toDate:
            absentDates[
              absentDates.length - 1
            ] || "-",
        };
      })
      .filter(
        (item) =>
          item.absentDays >= minDays
      );
  },
},

/* ===================================================
   5. STUDENT ATTENDANCE PERCENTAGE REPORT
=================================================== */

{
  id: "student-attendance-percentage-report",

  title:
    "Student Attendance Percentage Report",

  description:
    "View student attendance percentage between selected range",

  icon: "🎓",

  defaultFilters: {
    classId: "",
    sectionId: "",
    fromDate: today,
    toDate: today,
    fromPercent: "1",
    toPercent: "100",
    sortBy: "rollNo",
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
      name: "fromPercent",
      label: "From %",
      type: "number",
    },
    {
      name: "toPercent",
      label: "To %",
      type: "number",
    },
    {
      name: "sortBy",
      label: "Sort By",
      type: "select",
      showAllOption: false,
      options: [
        {
          value: "rollNo",
          label:
            "Roll Number",
        },
        {
          value: "percentage",
          label:
            "Attendance %",
        },
      ],
    },
  ],

  columns: [
    {
      key: "sno",
      label: "S.No",
      render: (_, index) => index + 1,
    },
    {
      key: "rollNo",
      label: "Roll No",
    },
    {
      key: "studentName",
      label: "Student Name",
    },
    {
      key: "className",
      label: "Class",
    },
    {
      key: "sectionName",
      label: "Section",
    },
    {
      key: "workingDays",
      label: "Working Days",
    },
    {
      key: "present",
      label: "Present",
    },
    {
      key: "absent",
      label: "Absent",
    },
    {
      key: "leave",
      label: "Leave",
    },
    {
      key: "percentage",
      label: "Attendance %",
    },
  ],

  getData: ({ schoolId, filters }) => {
    const dates =
      getDatesBetween(
        filters.fromDate,
        filters.toDate
      );

    let data = students
      .filter(
        (item) =>
          item.schoolId === schoolId &&
          (!filters.classId ||
            item.classId ===
              filters.classId) &&
          (!filters.sectionId ||
            item.sectionId ===
              filters.sectionId)
      )
      .map((student) => {
        let workingDays = 0;
        let present = 0;
        let absent = 0;
        let leave = 0;

        dates.forEach((date) => {
          const status =
            getStudentStatus(
              student.id,
              date
            );

          if (
            status !== "H" &&
            status !== "W"
          ) {
            workingDays += 1;
          }

          if (status === "P")
            present += 1;

          if (status === "A")
            absent += 1;

          if (status === "L")
            leave += 1;
        });

        const percentage =
          getAttendancePercent(
            present,
            leave,
            workingDays
          );

        return {
          ...student,
          className: getClassName(
            student.classId
          ),
          sectionName: getSectionName(
            student.sectionId
          ),
          workingDays,
          present,
          absent,
          leave,
          percentage,
        };
      });

    const fromPercent = Number(
      filters.fromPercent || 1
    );

    const toPercent = Number(
      filters.toPercent || 100
    );

    data = data.filter(
      (item) =>
        item.percentage >=
          fromPercent &&
        item.percentage <= toPercent
    );

    if (filters.sortBy === "percentage") {
      data.sort(
        (a, b) =>
          b.percentage -
          a.percentage
      );
    } else {
      data.sort(
        (a, b) =>
          Number(a.rollNo) -
          Number(b.rollNo)
      );
    }

    return data;
  },
},
/* ===================================================
   6. STAFF ATTENDANCE SUMMARY REPORT
=================================================== */

{
  id: "staff-attendance-summary-report",

  title: "Staff Attendance Summary Report",

  description:
    "View department or position wise staff attendance summary",

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
    {
      key: "sno",
      label: "S.No",
      render: (_, index) => index + 1,
    },
    {
      key: "groupName",
      label: "Department / Position",
    },
    {
      key: "total",
      label: "Total Staff",
    },
    {
      key: "present",
      label: "Present",
    },
    {
      key: "absent",
      label: "Absent",
    },
    {
      key: "leave",
      label: "Leave",
    },
    {
      key: "percentage",
      label: "% Presence",
    },
  ],

  getData: ({ schoolId, filters }) => {
    const date =
      filters.attendanceDate || today;

    const activeStaff =
      staffList.filter(
        (item) =>
          item.schoolId === schoolId &&
          item.isActive &&
          !item.lastWorkingDate &&
          (!filters.departmentId ||
            item.departmentId ===
              filters.departmentId) &&
          (!filters.positionId ||
            item.positionId ===
              filters.positionId)
      );

    const groups = {};

    activeStaff.forEach((staff) => {
      let groupKey =
        staff.departmentId;

      let groupName =
        getDepartmentName(
          staff.departmentId
        );

      if (
        filters.departmentId &&
        !filters.positionId
      ) {
        groupKey =
          staff.positionId;

        groupName =
          getPositionName(
            staff.positionId
          );
      }

      if (
        filters.departmentId &&
        filters.positionId
      ) {
        groupKey =
          `${staff.departmentId}-${staff.positionId}`;

        groupName =
          `${getDepartmentName(
            staff.departmentId
          )} - ${getPositionName(
            staff.positionId
          )}`;
      }

      if (!groups[groupKey]) {
        groups[groupKey] = {
          schoolId,
          groupName,
          total: 0,
          present: 0,
          absent: 0,
          leave: 0,
        };
      }

      const status =
        getStaffStatus(
          staff.id,
          date
        );

      groups[groupKey].total += 1;

      if (status === "P")
        groups[groupKey].present += 1;

      if (status === "A")
        groups[groupKey].absent += 1;

      if (status === "L")
        groups[groupKey].leave += 1;
    });

    return Object.values(groups).map(
      (item) => ({
        ...item,
        percentage: item.total
          ? `${Math.round(
              (item.present /
                item.total) *
                100
            )}%`
          : "0%",
      })
    );
  },
},

/* ===================================================
   7. DAILY STAFF ATTENDANCE REPORT
=================================================== */

{
  id: "daily-staff-attendance-report",

  title: "Daily Staff Attendance Report",

  description:
    "View daily staff attendance details",

  icon: "👨‍🏫",

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
        {
          value: "P",
          label: "Present",
        },
        {
          value: "A",
          label: "Absent",
        },
        {
          value: "L",
          label: "Leave",
        },
        {
          value: "-",
          label: "Not Marked",
        },
      ],
    },

    {
      name: "attendanceDate",
      label: "Date",
      type: "date",
    },
  ],

  columns: [
    {
      key: "sno",
      label: "S.No",
      render: (_, index) => index + 1,
    },
    {
      key: "employeeCode",
      label: "Employee Code",
    },
    {
      key: "employeeName",
      label: "Employee Name",
    },
    {
      key: "departmentName",
      label: "Department",
    },
    {
      key: "positionName",
      label: "Position",
    },
    {
      key: "mobile",
      label: "Mobile",
    },
    {
      key: "attendanceStatus",
      label: "Attendance Status",
    },
    {
      key: "checkInTime",
      label: "Check-In Time",
    },
  ],

  getData: ({ schoolId, filters }) => {
    const date =
      filters.attendanceDate || today;

    return staffList
      .filter(
        (item) =>
          item.schoolId === schoolId &&
          item.isActive &&
          !item.lastWorkingDate &&
          (!filters.departmentId ||
            item.departmentId ===
              filters.departmentId) &&
          (!filters.positionId ||
            item.positionId ===
              filters.positionId)
      )
      .map((staff) => {
        const record =
          staffAttendance.find(
            (item) =>
              item.employeeId ===
                staff.id &&
              item.date === date
          );

        return {
          ...staff,
          departmentName:
            getDepartmentName(
              staff.departmentId
            ),
          positionName:
            getPositionName(
              staff.positionId
            ),
          attendanceStatus:
            getStaffStatus(
              staff.id,
              date
            ),
          checkInTime:
            record?.checkInTime || "--",
        };
      })
      .filter((item) =>
        filters.attendanceStatus
          ? item.attendanceStatus ===
            filters.attendanceStatus
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

  description:
    "View monthly staff attendance register",

  icon: "👨‍🏫",

  defaultFilters: {
    departmentId: "DEP001",
    positionId: "POS001",
    month: "05",
  },

  filters: [
    {
      name: "departmentId",
      label: "Department *",
      type: "select",
      placeholder: "Select Department",
      options: departmentOptions,
    },
    {
      name: "positionId",
      label: "Position *",
      type: "select",
      placeholder: "Select Position",
      options: positionOptions,
    },
    {
      name: "month",
      label: "Month",
      type: "select",
      placeholder: "Select Month",
      options: months,
    },
  ],

  columns: [
    {
      key: "employeeCode",
      label: "Employee Code",
    },
    {
      key: "employeeName",
      label: "Employee Name",
    },
    ...dayColumns,
    {
      key: "present",
      label: "P",
    },
    {
      key: "absent",
      label: "A",
    },
    {
      key: "leave",
      label: "L",
    },
    {
      key: "paidDays",
      label: "Paid Days",
    },
    {
      key: "percentage",
      label: "Attendance %",
    },
  ],

  getData: ({ schoolId, filters }) => {
    const month =
      filters.month || "05";

    const dates =
      getMonthDates(month);

    return staffList
      .filter(
        (item) =>
          item.schoolId === schoolId &&
          item.isActive &&
          !item.lastWorkingDate &&
          item.departmentId ===
            filters.departmentId &&
          item.positionId ===
            filters.positionId
      )
      .map((staff) => {
        let present = 0;
        let absent = 0;
        let leave = 0;
        let holiday = 0;
        let weeklyOff = 0;

        const row = {
          schoolId,
          employeeCode:
            staff.employeeCode,
          employeeName:
            staff.employeeName,
        };

        dates.forEach((date) => {
          const status =
            getStaffStatus(
              staff.id,
              date
            );

          row[date] = status;

          if (status === "P")
            present += 1;

          if (status === "A")
            absent += 1;

          if (status === "L")
            leave += 1;

          if (status === "H")
            holiday += 1;

          if (status === "W")
            weeklyOff += 1;
        });

        const workingDays =
          dates.length -
          holiday -
          weeklyOff;

        const paidDays =
          present +
          leave +
          holiday +
          weeklyOff;

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

  return (
    <MasterReport
      moduleTitle="Attendance Analytics & Reports"
      reports={reports}
      schoolProfiles={schoolProfiles}
      currentUser={currentUser}
    />
  );
}

export default AttendanceReports;