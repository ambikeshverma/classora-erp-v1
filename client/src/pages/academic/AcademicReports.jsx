import React, { useState, useEffect } from "react";
import MasterReport from "../../components/reports/MasterReport";
import { SkeletonStats, SkeletonTable } from "../../components/Skeleton";
import { academicService, schoolService } from "../../services/api";

function AcademicReports() {
  const [loading, setLoading] = useState(true);
  const [scholasticSubjects, setScholasticSubjects] = useState([]);
  const [coScholasticSubjects, setCoScholasticSubjects] = useState([]);
  const [classSubjectMappings, setClassSubjectMappings] = useState([]);
  const [studentSubjectMappings, setStudentSubjectMappings] = useState([]);
  const [classes, setClasses] = useState([]);

  const [schoolProfile, setSchoolProfile] = useState({
    schoolId: localStorage.getItem("schoolId") || "",
    schoolName: localStorage.getItem("userName") || "School Admin",
    address: "",
    email: "",
    phone: "",
    website: "",
    logo: "",
  });

  const currentUser = {
    name: localStorage.getItem("userName") || "School Admin",
  };

  /* ===============================
     Fetch Real Academic Data
  =============================== */
  const hasFetched = React.useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchReportData = async () => {
      try {
        setLoading(true);

        const [reportsRes, metaRes, profRes] = await Promise.allSettled([
          academicService.getReportsData(),
          academicService.getMeta(),
          schoolService.getProfile(),
        ]);

        if (reportsRes.status === "fulfilled" && reportsRes.value.data?.success) {
          const d = reportsRes.value.data.data;
          setScholasticSubjects(d.scholasticSubjects || []);
          setCoScholasticSubjects(d.coScholasticSubjects || []);
          setClassSubjectMappings(d.classSubjectMappings || []);
          setStudentSubjectMappings(d.studentSubjectMappings || []);
        }

        if (metaRes.status === "fulfilled" && metaRes.value.data?.success) {
          setClasses(metaRes.value.data.data.classes || []);
        }

        if (profRes.status === "fulfilled" && profRes.value.data?.success) {
          const p = profRes.value.data.school || profRes.value.data.data || {};
          setSchoolProfile({
            schoolId: localStorage.getItem("schoolId") || p.campusId || p._id || "",
            schoolName: p.schoolName || localStorage.getItem("userName") || "School Admin",
            address: p.address || "",
            email: p.email || "",
            phone: p.phone || p.mobile || "",
            website: p.website || "",
            logo: p.logo || "",
          });
        }
      } catch (err) {
        console.error("Failed to load academic reports data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  // Dynamic filter options derived from real database records
  const classOptions = classes.map((c) => c.className).filter(Boolean);
  const sectionOptions = Array.from(
    new Set(
      classes.flatMap((c) =>
        (c.sections || []).map((s) => s.sectionName || s)
      )
    )
  ).filter(Boolean);

  const subjectTypeOptions = Array.from(
    new Set(
      scholasticSubjects
        .map((s) => s.subjectType)
        .filter(Boolean)
    )
  );
  if (subjectTypeOptions.length === 0) {
    subjectTypeOptions.push("Theory", "Practical", "Scholastic");
  }

  /* ===============================
     Report Definitions
  =============================== */
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
          placeholder: "All Types",
          options: subjectTypeOptions,
        },
      ],
      columns: [
        { key: "sno", label: "S.No", render: (_, index) => index + 1 },
        { key: "subjectName", label: "Subject Name" },
        { key: "subjectCode", label: "Subject Code", render: (row) => row.subjectCode || "-" },
        { key: "subjectType", label: "Subject Type", render: (row) => row.subjectType || "Theory" },
      ],
      getData: ({ filters }) =>
        scholasticSubjects
          .filter((item) =>
            filters.subjectName
              ? (item.subjectName || "")
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
      icon: "🧩",
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
        { key: "subjectCode", label: "Subject Code", render: (row) => row.subjectCode || "-" },
      ],
      getData: ({ filters }) =>
        coScholasticSubjects
          .filter((item) =>
            filters.subjectName
              ? (item.subjectName || "")
                  .toLowerCase()
                  .includes(filters.subjectName.toLowerCase())
              : true
          )
          .filter((item) =>
            filters.subjectCode
              ? (item.subjectCode || "")
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
          placeholder: "All Classes",
          options: classOptions,
        },
        {
          name: "subjectType",
          label: "Subject Type",
          type: "select",
          placeholder: "All Types",
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
          render: (row) =>
            row.scholasticSubjects && row.scholasticSubjects.length > 0
              ? row.scholasticSubjects.join(", ")
              : "-",
        },
        {
          key: "coScholasticSubjects",
          label: "Co-Scholastic Subjects",
          render: (row) =>
            row.coScholasticSubjects && row.coScholasticSubjects.length > 0
              ? row.coScholasticSubjects.join(", ")
              : "-",
        },
        {
          key: "totalScholasticSubjects",
          label: "Total Scholastic",
          render: (row) => (row.scholasticSubjects || []).length,
        },
        {
          key: "totalCoScholasticSubjects",
          label: "Total Co-Scholastic",
          render: (row) => (row.coScholasticSubjects || []).length,
        },
        {
          key: "totalSubjects",
          label: "Total Subjects",
          render: (row) =>
            (row.scholasticSubjects || []).length + (row.coScholasticSubjects || []).length,
        },
      ],
      defaultColumns: [
        { key: "sno", label: "S.No", render: (_, index) => index + 1 },
        { key: "className", label: "Class" },
        {
          key: "scholasticSubjects",
          label: "Scholastic Subjects",
          render: (row) =>
            row.scholasticSubjects && row.scholasticSubjects.length > 0
              ? row.scholasticSubjects.join(", ")
              : "-",
        },
        {
          key: "coScholasticSubjects",
          label: "Co-Scholastic Subjects",
          render: (row) =>
            row.coScholasticSubjects && row.coScholasticSubjects.length > 0
              ? row.coScholasticSubjects.join(", ")
              : "-",
        },
      ],
      getData: ({ filters }) =>
        classSubjectMappings
          .filter((item) =>
            filters.className ? item.className === filters.className : true
          )
          .filter((item) => {
            if (!filters.subjectName) return true;

            const search = filters.subjectName.toLowerCase();

            if (filters.subjectType === "Scholastic") {
              return (item.scholasticSubjects || []).some((sub) =>
                sub.toLowerCase().includes(search)
              );
            }

            if (filters.subjectType === "Co-Scholastic") {
              return (item.coScholasticSubjects || []).some((sub) =>
                sub.toLowerCase().includes(search)
              );
            }

            return [
              ...(item.scholasticSubjects || []),
              ...(item.coScholasticSubjects || []),
            ].some((sub) => sub.toLowerCase().includes(search));
          }),
    },

    {
      id: "student-subject-mapping-report",
      title: "Student Subject Mapping Report",
      description: "View student-wise assigned subjects",
      icon: "🎓",
      filters: [
        {
          name: "className",
          label: "Class",
          type: "select",
          placeholder: "All Classes",
          options: classOptions,
        },
        {
          name: "section",
          label: "Section",
          type: "select",
          placeholder: "All Sections",
          options: sectionOptions,
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
          placeholder: "All Types",
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
        { key: "rollNo", label: "Roll No", render: (row) => row.rollNo || "-" },
        {
          key: "scholasticSubjects",
          label: "Scholastic Subjects",
          render: (row) =>
            row.scholasticSubjects && row.scholasticSubjects.length > 0
              ? row.scholasticSubjects.join(", ")
              : "-",
        },
        {
          key: "coScholasticSubjects",
          label: "Co-Scholastic Subjects",
          render: (row) =>
            row.coScholasticSubjects && row.coScholasticSubjects.length > 0
              ? row.coScholasticSubjects.join(", ")
              : "-",
        },
        {
          key: "totalSubjects",
          label: "Total Subjects",
          render: (row) =>
            (row.scholasticSubjects || []).length + (row.coScholasticSubjects || []).length,
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
          render: (row) =>
            row.scholasticSubjects && row.scholasticSubjects.length > 0
              ? row.scholasticSubjects.join(", ")
              : "-",
        },
        {
          key: "coScholasticSubjects",
          label: "Co-Scholastic Subjects",
          render: (row) =>
            row.coScholasticSubjects && row.coScholasticSubjects.length > 0
              ? row.coScholasticSubjects.join(", ")
              : "-",
        },
      ],
      getData: ({ filters }) =>
        studentSubjectMappings
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
              (item.studentName || "").toLowerCase().includes(search) ||
              (item.admissionNo || "").toLowerCase().includes(search)
            );
          })
          .filter((item) => {
            if (!filters.subjectName) return true;

            const search = filters.subjectName.toLowerCase();

            if (filters.subjectType === "Scholastic") {
              return (item.scholasticSubjects || []).some((sub) =>
                sub.toLowerCase().includes(search)
              );
            }

            if (filters.subjectType === "Co-Scholastic") {
              return (item.coScholasticSubjects || []).some((sub) =>
                sub.toLowerCase().includes(search)
              );
            }

            return [
              ...(item.scholasticSubjects || []),
              ...(item.coScholasticSubjects || []),
            ].some((sub) => sub.toLowerCase().includes(search));
          }),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: "24px" }}>
        <SkeletonStats count={4} />
        <div style={{ marginTop: "24px" }}>
          <SkeletonTable rows={6} columns={5} />
        </div>
      </div>
    );
  }

  return (
    <MasterReport
      moduleTitle="Academic Analytics & Reports"
      reports={reports}
      schoolProfiles={[schoolProfile]}
      currentUser={currentUser}
    />
  );
}

export default AcademicReports;