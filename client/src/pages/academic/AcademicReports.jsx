import React from "react";
import MasterReport from "../../components/reports/MasterReport";

function AcademicReports() {
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

  const subjects = [
    {
      id: 1,
      schoolId: "SCH001",
      subjectName: "Hindi",
      subjectCode: "HIN",
      subjectType: "Theory",
    },
    {
      id: 2,
      schoolId: "SCH001",
      subjectName: "Science",
      subjectCode: "SCI",
      subjectType: "Practical",
    },
  ];

  const coScholasticSubjects = [
    {
      id: 1,
      schoolId: "SCH001",
      subjectName: "Discipline",
      subjectCode: "DIS",
    },
    {
      id: 2,
      schoolId: "SCH001",
      subjectName: "Sports",
      subjectCode: "SPT",
    },
  ];

  const classSubjectMappings = [
    {
      id: 1,
      schoolId: "SCH001",
      className: "Class 9",
      scholasticSubjects: ["Hindi", "English", "Math"],
      coScholasticSubjects: ["Discipline", "Sports"],
    },
    {
      id: 2,
      schoolId: "SCH001",
      className: "Class 10",
      scholasticSubjects: ["Hindi", "English", "Science", "SST"],
      coScholasticSubjects: ["Discipline"],
    },
  ];

  const studentSubjectMappings = [
    {
      id: 1,
      schoolId: "SCH001",
      admissionNo: "ADM001",
      studentName: "Aman Kumar",
      className: "Class 9",
      section: "A",
      scholasticSubjects: ["Hindi", "English", "Math"],
      coScholasticSubjects: ["Discipline"],
    },
    {
      id: 2,
      schoolId: "SCH001",
      admissionNo: "ADM002",
      studentName: "Riya Sharma",
      className: "Class 9",
      section: "A",
      scholasticSubjects: ["Hindi", "Math"],
      coScholasticSubjects: ["Sports"],
    },
  ];

  const reports = [
    {
      id: "subject-setup-report",
      title: "Subject Setup Report",
      description: "View scholastic subject setup details",
      icon: "📘",
      filters: [
        {
          name: "subjectName",
          label: "Subject Name",
          type: "text",
          placeholder: "Type subject name",
        },
        {
          name: "subjectType",
          label: "Subject Type",
          type: "select",
          placeholder: "All Type",
          options: ["Theory", "Practical"],
        },
      ],
      columns: [
        { key: "sno", label: "S.No", render: (_, index) => index + 1 },
        { key: "subjectName", label: "Subject Name" },
        { key: "subjectCode", label: "Subject Code" },
        { key: "subjectType", label: "Subject Type" },
      ],
      getData: ({ schoolId, filters }) =>
        subjects
          .filter((item) => item.schoolId === schoolId)
          .filter((item) =>
            filters.subjectName
              ? item.subjectName
                  .toLowerCase()
                  .includes(filters.subjectName.toLowerCase())
              : true
          )
          .filter((item) =>
            filters.subjectType ? item.subjectType === filters.subjectType : true
          ),
    },

    {
      id: "co-scholastic-subject-report",
      title: "Co-Scholastic Subject Setup Report",
      description: "View co-scholastic subject setup details",
      icon: "🎨",
      filters: [
        {
          name: "subjectName",
          label: "Subject Name",
          type: "text",
          placeholder: "Type subject name",
        },
        {
          name: "subjectCode",
          label: "Subject Code",
          type: "text",
          placeholder: "Type subject code",
        },
      ],
      columns: [
        { key: "sno", label: "S.No", render: (_, index) => index + 1 },
        { key: "subjectName", label: "Subject Name" },
        { key: "subjectCode", label: "Subject Code" },
      ],
      getData: ({ schoolId, filters }) =>
        coScholasticSubjects
          .filter((item) => item.schoolId === schoolId)
          .filter((item) =>
            filters.subjectName
              ? item.subjectName
                  .toLowerCase()
                  .includes(filters.subjectName.toLowerCase())
              : true
          )
          .filter((item) =>
            filters.subjectCode
              ? item.subjectCode
                  .toLowerCase()
                  .includes(filters.subjectCode.toLowerCase())
              : true
          ),
    },

    {
      id: "class-subject-mapping-report",
      title: "Class Subject Mapping Report",
      description: "View class-wise scholastic and co-scholastic subject mapping",
      icon: "🏫",
      filters: [
        {
          name: "className",
          label: "Class",
          type: "select",
          placeholder: "All Class",
          options: ["Class 9", "Class 10", "Class 11", "Class 12"],
        },
        {
          name: "subjectType",
          label: "Subject Type",
          type: "select",
          placeholder: "All Type",
          options: ["Scholastic", "Co-Scholastic"],
        },
        {
          name: "subjectName",
          label: "Subject Name",
          type: "text",
          placeholder: "Type subject name",
        },
      ],
      columns: [
        { key: "sno", label: "S.No", render: (_, index) => index + 1 },
        { key: "className", label: "Class" },
        {
          key: "scholasticSubjects",
          label: "Scholastic Subjects",
          render: (row) => row.scholasticSubjects.join(", "),
        },
        {
          key: "coScholasticSubjects",
          label: "Co-Scholastic Subjects",
          render: (row) => row.coScholasticSubjects.join(", "),
        },
        {
          key: "totalScholasticSubjects",
          label: "Total Scholastic Subjects",
          render: (row) => row.scholasticSubjects.length,
        },
        {
          key: "totalCoScholasticSubjects",
          label: "Total Co-Scholastic Subjects",
          render: (row) => row.coScholasticSubjects.length,
        },
        {
          key: "totalSubjects",
          label: "Total Subjects",
          render: (row) =>
            row.scholasticSubjects.length + row.coScholasticSubjects.length,
        },
      ],
      defaultColumns: [
        { key: "sno", label: "S.No", render: (_, index) => index + 1 },
        { key: "className", label: "Class" },
        {
          key: "scholasticSubjects",
          label: "Scholastic Subjects",
          render: (row) => row.scholasticSubjects.join(", "),
        },
        {
          key: "coScholasticSubjects",
          label: "Co-Scholastic Subjects",
          render: (row) => row.coScholasticSubjects.join(", "),
        },
      ],
      getData: ({ schoolId, filters }) =>
        classSubjectMappings
          .filter((item) => item.schoolId === schoolId)
          .filter((item) =>
            filters.className ? item.className === filters.className : true
          )
          .filter((item) => {
            if (!filters.subjectName) return true;

            const search = filters.subjectName.toLowerCase();

            if (filters.subjectType === "Scholastic") {
              return item.scholasticSubjects.some((sub) =>
                sub.toLowerCase().includes(search)
              );
            }

            if (filters.subjectType === "Co-Scholastic") {
              return item.coScholasticSubjects.some((sub) =>
                sub.toLowerCase().includes(search)
              );
            }

            return [...item.scholasticSubjects, ...item.coScholasticSubjects].some(
              (sub) => sub.toLowerCase().includes(search)
            );
          }),
    },

    {
      id: "student-subject-mapping-report",
      title: "Student Subject Mapping Report",
      description: "View student-wise assigned subjects",
      icon: "👨‍🎓",
      filters: [
        {
          name: "className",
          label: "Class",
          type: "select",
          placeholder: "All Class",
          options: ["Class 9", "Class 10", "Class 11", "Class 12"],
        },
        {
          name: "section",
          label: "Section",
          type: "select",
          placeholder: "All Section",
          options: ["A", "B"],
        },
        {
          name: "studentSearch",
          label: "Student Name / Admission No",
          type: "text",
          placeholder: "Type student name or admission no",
        },
        {
          name: "subjectType",
          label: "Subject Type",
          type: "select",
          placeholder: "All Type",
          options: ["Scholastic", "Co-Scholastic"],
        },
        {
          name: "subjectName",
          label: "Subject Name",
          type: "text",
          placeholder: "Type subject name",
        },
      ],
      columns: [
        { key: "sno", label: "S.No", render: (_, index) => index + 1 },
        { key: "admissionNo", label: "Admission No" },
        { key: "studentName", label: "Student Name" },
        { key: "className", label: "Class" },
        { key: "section", label: "Section" },
        {
          key: "scholasticSubjects",
          label: "Scholastic Subjects",
          render: (row) => row.scholasticSubjects.join(", "),
        },
        {
          key: "coScholasticSubjects",
          label: "Co-Scholastic Subjects",
          render: (row) => row.coScholasticSubjects.join(", "),
        },
        {
          key: "totalScholasticSubjects",
          label: "Total Scholastic Subjects",
          render: (row) => row.scholasticSubjects.length,
        },
        {
          key: "totalCoScholasticSubjects",
          label: "Total Co-Scholastic Subjects",
          render: (row) => row.coScholasticSubjects.length,
        },
        {
          key: "totalSubjects",
          label: "Total Subjects",
          render: (row) =>
            row.scholasticSubjects.length + row.coScholasticSubjects.length,
        },
      ],
      defaultColumns: [
        { key: "sno", label: "S.No", render: (_, index) => index + 1 },
        { key: "admissionNo", label: "Admission No" },
        { key: "studentName", label: "Student Name" },
        { key: "className", label: "Class" },
        { key: "section", label: "Section" },
        {
          key: "scholasticSubjects",
          label: "Scholastic Subjects",
          render: (row) => row.scholasticSubjects.join(", "),
        },
        {
          key: "coScholasticSubjects",
          label: "Co-Scholastic Subjects",
          render: (row) => row.coScholasticSubjects.join(", "),
        },
      ],
      getData: ({ schoolId, filters }) =>
        studentSubjectMappings
          .filter((item) => item.schoolId === schoolId)
          .filter((item) =>
            filters.className ? item.className === filters.className : true
          )
          .filter((item) =>
            filters.section ? item.section === filters.section : true
          )
          .filter((item) => {
            if (!filters.studentSearch) return true;

            const search = filters.studentSearch.toLowerCase();

            return (
              item.studentName.toLowerCase().includes(search) ||
              item.admissionNo.toLowerCase().includes(search)
            );
          })
          .filter((item) => {
            if (!filters.subjectName) return true;

            const search = filters.subjectName.toLowerCase();

            if (filters.subjectType === "Scholastic") {
              return item.scholasticSubjects.some((sub) =>
                sub.toLowerCase().includes(search)
              );
            }

            if (filters.subjectType === "Co-Scholastic") {
              return item.coScholasticSubjects.some((sub) =>
                sub.toLowerCase().includes(search)
              );
            }

            return [...item.scholasticSubjects, ...item.coScholasticSubjects].some(
              (sub) => sub.toLowerCase().includes(search)
            );
          }),
    },
  ];

  return (
    <MasterReport
      moduleTitle="Academic Analytics & Reports"
      reports={reports}
      schoolProfiles={schoolProfiles}
      currentUser={currentUser}
    />
  );
}

export default AcademicReports;