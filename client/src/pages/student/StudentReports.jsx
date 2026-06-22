import React from "react";
import MasterReport from "../../components/reports/MasterReport";

function StudentReports() {
  const schoolId = localStorage.getItem("schoolId") || "SCH001";

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

  const classOptions = [
    "NUR", "LKG", "UKG",
    "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6",
    "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12",
  ];

  const sectionOptions = ["A", "B", "C", "D"];
  const feePlanOptions = ["Regular Fee", "RTE", "Staff Child"];
  const concessionOptions = ["Sibling Concession", "Staff Concession", "Scholarship"];
  const houseOptions = ["Red House", "Blue House", "Green House", "Yellow House"];

  const students = [
    {
      id: 1,
      schoolId: "SCH001",
      srNo: "SR001",
      schoolAdmissionNo: "ADM001",
      admissionDate: "12/04/2026",
      joiningSession: "2026-2027",
      studentName: "Rahul Kumar",
      fatherName: "Sunil Kumar",
      motherName: "Sita Devi",
      className: "Class 6",
      section: "A",
      classSection: "6(A)",
      rollNo: "6A-001",
      gender: "Male",
      dobFull: "2014-07-18",
      dob: "18/07/2014",
      mobileNumber: "9876543210",
      alternateMobileNumber: "9876543211",
      status: "Active",
      promotionType: "Promote",
      feePlan: "Regular Fee",
      concessionPlan: "",
      transportAssigned: true,
      house: "Red House",
      religion: "Hindu",
      community: "OBC",
      caste: "Verma",
      bloodGroup: "O+",
      heightCm: "145",
      weightKg: "38",
      medium: "English",
      udisePenNo: "PEN001",
      apaarId: "APAAR001",
      hostelRoomNo: "-",
      localAddress: "Rasouli, Barabanki",
      permanentAddress: "Rasouli, Barabanki",
      assignedSubjects: "English, Hindi, Maths, Science, SST",
      studentType: "New",
      photo: "",
    },
    {
      id: 2,
      schoolId: "SCH001",
      srNo: "SR002",
      schoolAdmissionNo: "ADM002",
      admissionDate: "15/04/2026",
      joiningSession: "2026-2027",
      studentName: "Priya Singh",
      fatherName: "Dinesh Singh",
      motherName: "Radha Singh",
      className: "Class 6",
      section: "A",
      classSection: "6(A)",
      rollNo: "6A-002",
      gender: "Female",
      dobFull: "2015-08-21",
      dob: "21/08/2015",
      mobileNumber: "9876543212",
      alternateMobileNumber: "",
      status: "Active",
      promotionType: "Detain",
      feePlan: "Regular Fee",
      concessionPlan: "Sibling Concession",
      transportAssigned: false,
      house: "Blue House",
      religion: "Hindu",
      community: "General",
      caste: "Singh",
      bloodGroup: "B+",
      heightCm: "142",
      weightKg: "35",
      medium: "Hindi",
      udisePenNo: "PEN002",
      apaarId: "APAAR002",
      hostelRoomNo: "-",
      localAddress: "Barabanki",
      permanentAddress: "Barabanki",
      assignedSubjects: "English, Hindi, Maths, Science",
      studentType: "Promoted",
      photo: "",
    },
    {
      id: 3,
      schoolId: "SCH001",
      srNo: "SR003",
      schoolAdmissionNo: "ADM003",
      admissionDate: "20/04/2026",
      joiningSession: "2026-2027",
      studentName: "Aman Verma",
      fatherName: "Rakesh Verma",
      motherName: "Geeta Verma",
      className: "Class 7",
      section: "B",
      classSection: "7(B)",
      rollNo: "7B-001",
      gender: "Male",
      dobFull: "2013-07-25",
      dob: "25/07/2013",
      mobileNumber: "9876543213",
      alternateMobileNumber: "",
      status: "Inactive",
      promotionType: "Not Updated",
      feePlan: "RTE",
      concessionPlan: "",
      transportAssigned: true,
      house: "Red House",
      religion: "Hindu",
      community: "OBC",
      caste: "Verma",
      bloodGroup: "A+",
      heightCm: "150",
      weightKg: "42",
      medium: "English",
      udisePenNo: "PEN003",
      apaarId: "APAAR003",
      hostelRoomNo: "-",
      localAddress: "Lucknow",
      permanentAddress: "Barabanki",
      assignedSubjects: "English, Hindi, Maths, Science, SST, Computer",
      studentType: "New",
      photo: "",
    },
  ];

  const alumniStudents = [
    {
      id: 101,
      schoolId: "SCH001",
      schoolAdmissionNo: "ADM101",
      admissionDate: "10/04/2020",
      rollNo: "12A-001",
      studentName: "Rohit Kumar",
      fatherName: "Mahesh Kumar",
      motherName: "Sunita Devi",
      passedOutSession: "2025-2026",
      lastClass: "Class 12",
      lastSection: "A",
      mobileNumber: "9876543299",
      dobFull: "2008-07-30",
    },
  ];

  const getClassRank = (className) => {
    const clean = className?.replace("Class ", "");
    return classOptions.findIndex((item) => item.replace("Class ", "") === clean);
  };

  const sortStudents = (a, b) => {
    const classDiff = getClassRank(a.className) - getClassRank(b.className);
    if (classDiff !== 0) return classDiff;

    const sectionDiff = String(a.section).localeCompare(String(b.section));
    if (sectionDiff !== 0) return sectionDiff;

    const rollDiff = String(a.rollNo || "").localeCompare(String(b.rollNo || ""));
    if (rollDiff !== 0) return rollDiff;

    return a.studentName.localeCompare(b.studentName);
  };

  const filterStudentReport = (list, filters) =>
    list
      .filter((item) => (filters.feePlan ? item.feePlan === filters.feePlan : true))
      .filter((item) => (filters.className ? item.className === filters.className : true))
      .filter((item) => (filters.section ? item.section === filters.section : true))
      .filter((item) =>
        filters.concessionPlan ? item.concessionPlan === filters.concessionPlan : true
      )
      .filter((item) => (filters.status ? item.status === filters.status : true))
      .filter((item) =>
        filters.promotionType ? item.promotionType === filters.promotionType : true
      )
      .filter((item) => (filters.gender ? item.gender === filters.gender : true))
      .filter((item) => (filters.transportAssigned ? item.transportAssigned : true));

  const getBirthdayLabel = (dateString) => {
    if (!dateString) return "--";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "long" });
  };

  const getAge = (dateString) => {
    if (!dateString) return "--";
    const dob = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();

    const hasBirthdayPassed =
      today.getMonth() > dob.getMonth() ||
      (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());

    if (!hasBirthdayPassed) age -= 1;

    return `${age} Years`;
  };

  const isBirthdayInRange = (dobFull, fromDate, toDate) => {
    if (!dobFull || !fromDate || !toDate) return true;

    const dob = new Date(dobFull);
    const from = new Date(fromDate);
    const to = new Date(toDate);

    const year = new Date().getFullYear();
    const birthdayThisYear = new Date(year, dob.getMonth(), dob.getDate());

    return birthdayThisYear >= from && birthdayThisYear <= to;
  };

  const makeSummaryRows = (type) => {
    const activeStudents = students.filter(
      (item) => item.schoolId === schoolId && item.status === "Active"
    );

    let groups = [];

    if (type === "by-class") {
      groups = classOptions.map((className) => ({
        label: className,
        rows: activeStudents.filter((item) => item.className === className),
      }));
    }

    if (type === "by-section") {
      groups = classOptions.flatMap((className) =>
        sectionOptions.map((section) => ({
          label: `${className.replace("Class ", "")}(${section})`,
          rows: activeStudents.filter(
            (item) => item.className === className && item.section === section
          ),
        }))
      );
    }

    if (type === "by-fee-plan") {
      groups = feePlanOptions.map((feePlan) => ({
        label: feePlan,
        rows: activeStudents.filter((item) => item.feePlan === feePlan),
      }));
    }

    return groups
      .filter((group) => group.rows.length > 0)
      .map((group, index) => ({
        id: index + 1,
        name: group.label,
        total: group.rows.length,
        boys: group.rows.filter((s) => s.gender === "Male").length,
        girls: group.rows.filter((s) => s.gender === "Female").length,
        transgender: group.rows.filter((s) => s.gender === "Transgender").length,
        promoted: group.rows.filter((s) => s.promotionType === "Promote").length,
        detained: group.rows.filter((s) => s.promotionType === "Detain").length,
        transferred: group.rows.filter((s) => s.promotionType === "Transfer").length,
        newCount: group.rows.filter((s) => s.studentType === "New").length,
      }));
  };

  const reports = [
    {
      id: "student-summary-report",
      title: "Student Summary Report",
      description: "View student summary by class, section or fee plan",
      icon: "👥",
      defaultFilters: { reportType: "by-class" },
      filters: [
        {
          name: "reportType",
          label: "Report Type",
          type: "select",
          showAllOption: false,
          options: [
            { label: "By Class", value: "by-class" },
            { label: "By Section", value: "by-section" },
            { label: "By Fee Plan", value: "by-fee-plan" },
          ],
        },
      ],
      columns: [
        { key: "sno", label: "S.No", render: (_, index) => index + 1 },
        { key: "name", label: "Name" },
        { key: "total", label: "Total" },
        { key: "boys", label: "Boys" },
        { key: "girls", label: "Girls" },
        { key: "transgender", label: "Transgender" },
        { key: "promoted", label: "Promoted" },
        { key: "detained", label: "Detained" },
        { key: "transferred", label: "Transferred" },
        { key: "newCount", label: "New" },
      ],
      getData: ({ filters }) => makeSummaryRows(filters.reportType || "by-class"),
    },

    {
      id: "student-report",
      title: "Student Report",
      description: "View detailed student list",
      icon: "👥",
      filters: [
        { name: "feePlan", label: "Fee Plan", type: "select", options: feePlanOptions },
        { name: "className", label: "Class", type: "select", options: classOptions },
        { name: "section", label: "Section", type: "select", options: sectionOptions },
        {
          name: "concessionPlan",
          label: "Concession Plan",
          type: "select",
          options: concessionOptions,
        },
        { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] },
        {
          name: "promotionType",
          label: "Promotion Type",
          type: "select",
          options: ["Promote", "Detain", "Transfer"],
        },
        {
          name: "gender",
          label: "Gender",
          type: "select",
          options: ["Male", "Female", "Transgender"],
        },
        {
          name: "transportAssigned",
          label: "Transport Assigned",
          type: "checkbox",
          checkboxLabel: "Transport Assigned",
        },
      ],
      columns: [
        { key: "sno", label: "S.No", render: (_, index) => index + 1 },
        { key: "srNo", label: "SR No" },
        { key: "admissionDate", label: "Admission Date" },
        { key: "schoolAdmissionNo", label: "School Admission No" },
        { key: "className", label: "Class" },
        { key: "section", label: "Section" },
        { key: "studentName", label: "Student Name" },
        { key: "fatherName", label: "Father Name" },
        { key: "gender", label: "Gender" },
        { key: "dob", label: "DOB" },
        { key: "mobileNumber", label: "Mobile Number" },
      ],
      getData: ({ schoolId, filters }) =>
        filterStudentReport(
          students.filter((item) => item.schoolId === schoolId),
          filters
        ).sort(sortStudents),
    },

    {
      id: "student-report-with-photo",
      title: "Student Report With Photo",
      description: "View student profile cards with photo",
      icon: "👥",
      viewType: "card",
      filters: [
        { name: "feePlan", label: "Fee Plan", type: "select", options: feePlanOptions },
        { name: "className", label: "Class", type: "select", options: classOptions },
        { name: "section", label: "Section", type: "select", options: sectionOptions },
        {
          name: "concessionPlan",
          label: "Concession Plan",
          type: "select",
          options: concessionOptions,
        },
        { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] },
        {
          name: "promotionType",
          label: "Promotion Type",
          type: "select",
          options: ["Promote", "Detain", "Transfer"],
        },
        {
          name: "gender",
          label: "Gender",
          type: "select",
          options: ["Male", "Female", "Transgender"],
        },
        {
          name: "transportAssigned",
          label: "Transport Assigned",
          type: "checkbox",
          checkboxLabel: "Transport Assigned",
        },
      ],
      columns: [{ key: "studentName", label: "Student Name" }],
      getData: ({ schoolId, filters }) =>
        filterStudentReport(
          students.filter((item) => item.schoolId === schoolId),
          filters
        ).sort(sortStudents),
    },

    {
      id: "house-report",
      title: "House Report",
      description: "View house-wise student list",
      icon: "🏠",
      filters: [{ name: "house", label: "House", type: "select", options: houseOptions }],
      columns: [
        { key: "sno", label: "S.No", render: (_, index) => index + 1 },
        { key: "srNo", label: "SR No" },
        { key: "schoolAdmissionNo", label: "School Admission No" },
        { key: "admissionDate", label: "Admission Date" },
        { key: "classSection", label: "Class" },
        { key: "dob", label: "DOB" },
        { key: "studentName", label: "Student Name" },
        { key: "fatherName", label: "Father Name" },
        { key: "motherName", label: "Mother Name" },
        { key: "house", label: "House" },
      ],
      getData: ({ schoolId, filters }) =>
        students
          .filter((item) => item.schoolId === schoolId && item.status === "Active")
          .filter((item) => (filters.house ? item.house === filters.house : true))
          .sort(sortStudents),
    },

    {
      id: "student-birthday-report",
      title: "Student Birthday Report",
      description: "View birthdays by selected date range",
      icon: "🎂",
      filters: [
        { name: "fromDate", label: "From Date", type: "date" },
        { name: "toDate", label: "To Date", type: "date" },
      ],
      columns: [
        { key: "sno", label: "S.No", render: (_, index) => index + 1 },
        { key: "studentName", label: "Student Name" },
        { key: "fatherName", label: "Father Name" },
        { key: "motherName", label: "Mother Name" },
        {
          key: "birthdayOn",
          label: "Birthday On",
          render: (row) => getBirthdayLabel(row.dobFull),
        },
        { key: "age", label: "Age", render: (row) => getAge(row.dobFull) },
        { key: "mobileNumber", label: "Mobile Number" },
      ],
      getData: ({ schoolId, filters }) =>
        [...students, ...alumniStudents]
          .filter((item) => item.schoolId === schoolId)
          .filter((item) => isBirthdayInRange(item.dobFull, filters.fromDate, filters.toDate))
          .sort((a, b) => new Date(a.dobFull).getMonth() - new Date(b.dobFull).getMonth()),
    },

    {
      id: "unpromoted-student-report",
      title: "Unpromoted Student Report",
      description: "View students whose promotion status is not updated",
      icon: "⬆️",
      filters: [
        { name: "className", label: "Class", type: "select", options: classOptions },
        { name: "section", label: "Section", type: "select", options: sectionOptions },
      ],
      columns: [
        { key: "sno", label: "S.No", render: (_, index) => index + 1 },
        { key: "schoolAdmissionNo", label: "School Admission No" },
        { key: "admissionDate", label: "Admission Date" },
        { key: "studentName", label: "Student Name" },
        { key: "fatherName", label: "Father Name" },
        { key: "className", label: "Class" },
        { key: "section", label: "Section" },
      ],
      getData: ({ schoolId, filters }) =>
        students
          .filter((item) => item.schoolId === schoolId)
          .filter((item) => item.status === "Active")
          .filter((item) => item.promotionType === "Not Updated")
          .filter((item) => (filters.className ? item.className === filters.className : true))
          .filter((item) => (filters.section ? item.section === filters.section : true))
          .sort(sortStudents),
    },

    {
      id: "alumni-report",
      title: "Alumni Report",
      description: "View alumni student records",
      icon: "🎓",
      filters: [
        {
          name: "passedOutSession",
          label: "Passed Out Session",
          type: "select",
          options: ["2024-2025", "2025-2026", "2026-2027"],
        },
        { name: "lastClass", label: "Last Class", type: "select", options: classOptions },
        { name: "lastSection", label: "Last Section", type: "select", options: sectionOptions },
        {
          name: "search",
          label: "Search",
          type: "text",
          placeholder: "Student name or admission no",
        },
      ],
      columns: [
        { key: "sno", label: "S.No", render: (_, index) => index + 1 },
        { key: "schoolAdmissionNo", label: "School Admission No" },
        { key: "admissionDate", label: "Admission Date" },
        { key: "studentName", label: "Student Name" },
        { key: "fatherName", label: "Father Name" },
        { key: "passedOutSession", label: "Passed Out Session" },
        { key: "lastClass", label: "Last Class" },
        { key: "lastSection", label: "Last Section" },
        { key: "mobileNumber", label: "Mobile Number" },
      ],
      getData: ({ schoolId, filters }) =>
        alumniStudents
          .filter((item) => item.schoolId === schoolId)
          .filter((item) =>
            filters.passedOutSession
              ? item.passedOutSession === filters.passedOutSession
              : true
          )
          .filter((item) => (filters.lastClass ? item.lastClass === filters.lastClass : true))
          .filter((item) =>
            filters.lastSection ? item.lastSection === filters.lastSection : true
          )
          .filter((item) => {
            if (!filters.search) return true;
            const search = filters.search.toLowerCase();
            return (
              item.studentName.toLowerCase().includes(search) ||
              item.schoolAdmissionNo.toLowerCase().includes(search)
            );
          }),
    },

    {
      id: "concession-summary-report",
      title: "Concession Summary Report",
      description: "View concession summary by class and section",
      icon: "🎁",
      filters: [
        {
          name: "concessionPlan",
          label: "Concession Plan",
          type: "select",
          options: [
            { label: "No Concession Plan", value: "__NO_CONCESSION__" },
            ...concessionOptions,
          ],
        },
      ],
      columns: [
        { key: "sno", label: "S.No", render: (_, index) => index + 1 },
        { key: "className", label: "Class" },
        { key: "section", label: "Section" },
        { key: "count", label: "Count" },
      ],
      getData: ({ schoolId, filters }) => {
        const activeStudents = students.filter(
          (item) => item.schoolId === schoolId && item.status === "Active"
        );

        const filtered = activeStudents.filter((item) => {
          if (filters.concessionPlan === "__NO_CONCESSION__") {
            return !item.concessionPlan;
          }

          if (filters.concessionPlan) {
            return item.concessionPlan === filters.concessionPlan;
          }

          return true;
        });

        const rows = [];

        classOptions.forEach((className) => {
          sectionOptions.forEach((section) => {
            const count = filtered.filter(
              (item) => item.className === className && item.section === section
            ).length;

            if (count > 0) {
              rows.push({
                id: `${className}-${section}`,
                className,
                section,
                count,
              });
            }
          });
        });

        const total = rows.reduce((sum, row) => sum + row.count, 0);

        return [
          ...rows,
          {
            id: "total-row",
            className: "Total",
            section: "",
            count: total,
          },
        ];
      },
    },
  ];

  return (
    <MasterReport
      moduleTitle="Student Hub Analytics & Reports"
      reports={reports}
      schoolProfiles={schoolProfiles}
      currentUser={currentUser}
    />
  );
}

export default StudentReports;