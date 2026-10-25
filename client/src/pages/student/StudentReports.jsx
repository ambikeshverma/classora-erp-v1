import React, { useState, useEffect } from "react";
import MasterReport from "../../components/reports/MasterReport";
import { SkeletonStats } from "../../components/Skeleton";
import { studentHubService, schoolService } from "../../services/api";

function StudentReports() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [houses, setHouses] = useState([]);
  const [schoolProfile, setSchoolProfile] = useState({
    schoolId: localStorage.getItem("schoolId") || "SCH001",
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

  useEffect(() => {
    const loadReportData = async () => {
      try {
        setLoading(true);
        const [metaRes, studRes, profRes] = await Promise.allSettled([
          studentHubService.getMeta(),
          studentHubService.getDataExport({}),
          schoolService.getProfile(),
        ]);

        if (metaRes.status === "fulfilled" && metaRes.value.data?.success) {
          setClasses(metaRes.value.data.data.classes || []);
          setSections(metaRes.value.data.data.sections || []);
          setHouses(metaRes.value.data.data.houses || []);
        }

        if (studRes.status === "fulfilled" && studRes.value.data?.success) {
          setStudents(studRes.value.data.data || []);
        }

        if (profRes.status === "fulfilled" && profRes.value.data?.success) {
          const p = profRes.value.data.school || profRes.value.data.data || {};
          setSchoolProfile({
            schoolId: localStorage.getItem("schoolId") || p._id || "SCH001",
            schoolName: p.schoolName || localStorage.getItem("userName") || "School Admin",
            address: p.address || "",
            email: p.email || "",
            phone: p.phone || p.mobile || "",
            website: p.website || "",
            logo: p.logo || "",
          });
        }
      } catch (err) {
        console.error("Failed to load student reports data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, []);

  const classOptions = classes.map((c) => c.className);
  const sectionOptions = Array.from(new Set(sections.map((s) => s.sectionName)));
  const houseOptions = houses.map((h) => h.houseName);

  const sortStudents = (a, b) => {
    const classDiff = (a.className || "").localeCompare(b.className || "");
    if (classDiff !== 0) return classDiff;

    const sectionDiff = String(a.section || "").localeCompare(String(b.section || ""));
    if (sectionDiff !== 0) return sectionDiff;

    const rollDiff = String(a.rollNo || a.rollNumber || "").localeCompare(
      String(b.rollNo || b.rollNumber || "")
    );
    if (rollDiff !== 0) return rollDiff;

    return (a.studentName || "").localeCompare(b.studentName || "");
  };

  const filterStudentReport = (list, filters) =>
    list
      .filter((item) => (filters.feePlan ? item.feePlan === filters.feePlan : true))
      .filter((item) => (filters.className ? item.className === filters.className : true))
      .filter((item) => (filters.section ? item.section === filters.section : true))
      .filter((item) => (filters.gender ? item.gender === filters.gender : true))
      .filter((item) => (filters.status ? item.status === filters.status : true))
      .filter((item) => (filters.house ? item.house === filters.house : true))
      .filter((item) => {
        if (!filters.search) return true;
        const search = filters.search.toLowerCase();
        return (
          item.studentName?.toLowerCase().includes(search) ||
          item.admissionNo?.toLowerCase().includes(search) ||
          item.srNo?.toLowerCase().includes(search) ||
          item.fatherName?.toLowerCase().includes(search) ||
          item.mobile?.includes(search)
        );
      });

  const reports = [
    {
      id: "student-strength-report",
      title: "Student Strength Report",
      description: "Class-wise and Section-wise head count of active students",
      icon: "👥",
      filters: [
        { name: "className", label: "Class", type: "select", options: classOptions },
        { name: "section", label: "Section", type: "select", options: sectionOptions },
      ],
      columns: [
        { key: "sno", label: "S.No", render: (_, index) => index + 1 },
        { key: "className", label: "Class" },
        { key: "section", label: "Section" },
        { key: "boys", label: "Boys" },
        { key: "girls", label: "Girls" },
        { key: "total", label: "Total Students" },
      ],
      getData: ({ filters }) => {
        const activeStudents = students.filter((s) => s.status === "Active");
        const grouped = {};

        activeStudents.forEach((st) => {
          if (filters.className && st.className !== filters.className) return;
          if (filters.section && st.section !== filters.section) return;

          const key = `${st.className || "Unassigned"}-${st.section || "A"}`;
          if (!grouped[key]) {
            grouped[key] = {
              id: key,
              className: st.className || "Unassigned",
              section: st.section || "A",
              boys: 0,
              girls: 0,
              total: 0,
            };
          }

          if (st.gender?.toLowerCase() === "female" || st.gender?.toLowerCase() === "girl") {
            grouped[key].girls += 1;
          } else {
            grouped[key].boys += 1;
          }
          grouped[key].total += 1;
        });

        const rows = Object.values(grouped).sort((a, b) =>
          a.className.localeCompare(b.className)
        );

        const totalBoys = rows.reduce((s, r) => s + r.boys, 0);
        const totalGirls = rows.reduce((s, r) => s + r.girls, 0);
        const grandTotal = rows.reduce((s, r) => s + r.total, 0);

        if (rows.length === 0) return [];

        return [
          ...rows,
          {
            id: "total-row",
            className: "Grand Total",
            section: "—",
            boys: totalBoys,
            girls: totalGirls,
            total: grandTotal,
          },
        ];
      },
    },

    {
      id: "student-list-report",
      title: "Master Student List",
      description: "Full student directory with demographic and academic mapping",
      icon: "📋",
      filters: [
        { name: "className", label: "Class", type: "select", options: classOptions },
        { name: "section", label: "Section", type: "select", options: sectionOptions },
        { name: "house", label: "House", type: "select", options: houseOptions },
        { name: "gender", label: "Gender", type: "select", options: ["Male", "Female", "Other"] },
        { name: "search", label: "Search", type: "text", placeholder: "Search student..." },
      ],
      columns: [
        { key: "sno", label: "S.No", render: (_, index) => index + 1 },
        { key: "admissionNo", label: "Admission No" },
        { key: "studentName", label: "Student Name" },
        { key: "fatherName", label: "Father Name" },
        { key: "className", label: "Class" },
        { key: "section", label: "Section" },
        { key: "rollNo", label: "Roll No" },
        { key: "gender", label: "Gender" },
        { key: "mobile", label: "Mobile" },
        { key: "house", label: "House" },
      ],
      getData: ({ filters }) => {
        const activeStudents = students.filter((s) => s.status === "Active");
        return filterStudentReport(activeStudents, filters).sort(sortStudents);
      },
    },

    {
      id: "inactive-student-report",
      title: "Inactive Students Report",
      description: "Audit list of students marked inactive or withdrawn",
      icon: "🚫",
      filters: [
        { name: "className", label: "Class", type: "select", options: classOptions },
        { name: "search", label: "Search", type: "text", placeholder: "Search..." },
      ],
      columns: [
        { key: "sno", label: "S.No", render: (_, index) => index + 1 },
        { key: "admissionNo", label: "Admission No" },
        { key: "studentName", label: "Student Name" },
        { key: "fatherName", label: "Father Name" },
        { key: "className", label: "Class" },
        { key: "section", label: "Section" },
        { key: "inactiveReason", label: "Reason for Inactivation" },
        { key: "mobile", label: "Contact" },
      ],
      getData: ({ filters }) => {
        const inactiveList = students.filter((s) => s.status === "Inactive");
        return filterStudentReport(inactiveList, filters);
      },
    },

    {
      id: "alumni-student-report",
      title: "Alumni Students Report",
      description: "Graduated and passed out alumni directory",
      icon: "🎓",
      filters: [
        { name: "passYear", label: "Passing Year", type: "select", options: ["2026", "2025", "2024", "2023", "2022"] },
        { name: "search", label: "Search", type: "text", placeholder: "Search alumni..." },
      ],
      columns: [
        { key: "sno", label: "S.No", render: (_, index) => index + 1 },
        { key: "admissionNo", label: "Admission No" },
        { key: "studentName", label: "Student Name" },
        { key: "fatherName", label: "Father Name" },
        { key: "className", label: "Last Class" },
        { key: "passYear", label: "Passing Year" },
        { key: "mobile", label: "Contact" },
      ],
      getData: ({ filters }) => {
        const alumniList = students.filter((s) => s.status === "Alumni");
        return alumniList.filter((item) => {
          if (filters.passYear && item.passYear !== filters.passYear) return false;
          if (filters.search) {
            const q = filters.search.toLowerCase();
            return (
              item.studentName?.toLowerCase().includes(q) ||
              item.admissionNo?.toLowerCase().includes(q)
            );
          }
          return true;
        });
      },
    },

    {
      id: "house-allocation-report",
      title: "House Allocation Summary",
      description: "House-wise breakdown and student distribution",
      icon: "🏠",
      filters: [
        { name: "house", label: "House", type: "select", options: houseOptions },
        { name: "className", label: "Class", type: "select", options: classOptions },
      ],
      columns: [
        { key: "sno", label: "S.No", render: (_, index) => index + 1 },
        { key: "house", label: "House" },
        { key: "className", label: "Class" },
        { key: "section", label: "Section" },
        { key: "count", label: "Allocated Students" },
      ],
      getData: ({ filters }) => {
        const activeStudents = students.filter((s) => s.status === "Active" && s.house);
        const map = {};

        activeStudents.forEach((st) => {
          if (filters.house && st.house !== filters.house) return;
          if (filters.className && st.className !== filters.className) return;

          const key = `${st.house}__${st.className}__${st.section || "A"}`;
          if (!map[key]) {
            map[key] = {
              id: key,
              house: st.house,
              className: st.className,
              section: st.section || "A",
              count: 0,
            };
          }
          map[key].count += 1;
        });

        const rows = Object.values(map).sort((a, b) => a.house.localeCompare(b.house));
        const total = rows.reduce((acc, r) => acc + r.count, 0);

        if (rows.length === 0) return [];

        return [
          ...rows,
          {
            id: "total-row",
            house: "Total Allocated",
            className: "—",
            section: "—",
            count: total,
          },
        ];
      },
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: "20px" }}>
        <h2 style={{ marginBottom: "15px" }}>Loading Student Hub Reports...</h2>
        <SkeletonStats count={4} />
      </div>
    );
  }

  return (
    <MasterReport
      moduleTitle="Student Hub Analytics & Reports"
      reports={reports}
      schoolProfiles={[schoolProfile]}
      currentUser={currentUser}
    />
  );
}

export default StudentReports;