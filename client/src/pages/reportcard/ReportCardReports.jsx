import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppButton from "../../components/AppButton";
import MasterReport from "../../components/reports/MasterReport";
import { SkeletonList } from "../../components/Skeleton";
import { reportCardService } from "../../services/api";

const SNO_COLUMN = { key: "sno", label: "S.No", render: (_, index) => index + 1 };

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

function ReportCardReports() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    reportCardService
      .getAnalytics()
      .then((res) => {
        if (active) setData(res.data?.data || null);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || "Failed to load report card analytics");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const schoolProfiles = useMemo(
    () => [{ schoolId: localStorage.getItem("schoolId") || "SCH001", ...(data?.schoolInfo || {}) }],
    [data]
  );

  const currentUser = useMemo(() => ({ name: data?.schoolInfo?.schoolName || "" }), [data]);

  const reports = useMemo(() => {
    if (!data) return [];

    const { classes, exams, results, subjects, progress } = data;

    const classOptions = classes.map((item) => item.className);
    const sectionOptions = [...new Set(classes.flatMap((item) => item.sections))];

    const classFilter = { name: "className", label: "Class", type: "select", placeholder: "All Class", options: classOptions };
    const sectionFilter = { name: "sectionName", label: "Section", type: "select", placeholder: "All Section", options: sectionOptions };
    const examFilter = { name: "examName", label: "Exam", type: "select", placeholder: "All Exam", options: exams };

    const matchesClass = (item, filters) =>
      (!filters.className || item.className === filters.className) &&
      (!filters.sectionName || item.sectionName === filters.sectionName);

    return [
      {
        id: "result-report",
        title: "Result Report",
        description: "Student wise generated results with rank and division",
        icon: "🏅",
        defaultFilters: { className: "", sectionName: "", result: "", division: "" },
        filters: [
          classFilter,
          sectionFilter,
          { name: "result", label: "Result", type: "select", placeholder: "All Result", options: ["PASS", "FAIL", "NA"] },
          { name: "division", label: "Division", type: "select", placeholder: "All Division", options: ["First", "Second", "Third", "Fail"] },
        ],
        columns: [
          SNO_COLUMN,
          { key: "classLabel", label: "Class" },
          { key: "rollNo", label: "Roll No" },
          { key: "studentName", label: "Student Name" },
          { key: "fatherName", label: "Father Name" },
          { key: "marksLabel", label: "Marks" },
          { key: "percentage", label: "Percentage" },
          { key: "division", label: "Division" },
          { key: "rank", label: "Rank" },
          { key: "result", label: "Result" },
          { key: "liveLabel", label: "Live" },
        ],
        getData: ({ filters }) =>
          results
            .filter((item) => matchesClass(item, filters))
            .filter((item) => !filters.result || item.result === filters.result)
            .filter((item) => !filters.division || item.division === filters.division)
            .map((item) => ({
              ...item,
              classLabel: `${item.className} - ${item.sectionName}`,
              marksLabel: `${item.totalMarks} / ${item.maximumMarks}`,
              rank: item.rank ?? "-",
              liveLabel: item.isLive ? "Yes" : "No",
            }))
            .sort(
              (a, b) =>
                a.classLabel.localeCompare(b.classLabel) ||
                (Number(a.rank) || Infinity) - (Number(b.rank) || Infinity) ||
                a.studentName.localeCompare(b.studentName)
            ),
      },

      {
        id: "class-result-summary",
        title: "Class Result Summary",
        description: "Pass, fail and average percentage for each class section",
        icon: "📊",
        defaultFilters: { className: "" },
        filters: [classFilter],
        columns: [
          SNO_COLUMN,
          { key: "classLabel", label: "Class / Section" },
          { key: "students", label: "Students" },
          { key: "passed", label: "Passed" },
          { key: "failed", label: "Failed" },
          { key: "passPercent", label: "Pass %" },
          { key: "average", label: "Average %" },
          { key: "highest", label: "Highest %" },
        ],
        getData: ({ filters }) => {
          const groups = new Map();

          results
            .filter((item) => item.result !== "NA")
            .filter((item) => !filters.className || item.className === filters.className)
            .forEach((item) => {
              const key = `${item.className} - ${item.sectionName}`;
              if (!groups.has(key)) groups.set(key, { classLabel: key, students: 0, passed: 0, failed: 0, sum: 0, highest: 0 });
              const group = groups.get(key);
              group.students += 1;
              group.sum += item.percentage;
              group.highest = Math.max(group.highest, item.percentage);
              if (item.result === "PASS") group.passed += 1;
              else group.failed += 1;
            });

          return [...groups.values()]
            .sort((a, b) => a.classLabel.localeCompare(b.classLabel))
            .map((group) => ({
              ...group,
              passPercent: `${round2((group.passed / group.students) * 100)}%`,
              average: round2(group.sum / group.students),
            }));
        },
      },

      {
        id: "topper-list",
        title: "Topper List",
        description: "Top ranked students of a class section",
        icon: "🥇",
        defaultFilters: { className: "", sectionName: "", top: "10" },
        filters: [classFilter, sectionFilter, { name: "top", label: "Show Top", type: "number", placeholder: "10" }],
        columns: [
          SNO_COLUMN,
          { key: "rank", label: "Rank" },
          { key: "classLabel", label: "Class" },
          { key: "studentName", label: "Student Name" },
          { key: "fatherName", label: "Father Name" },
          { key: "marksLabel", label: "Marks" },
          { key: "percentage", label: "Percentage" },
        ],
        getData: ({ filters }) => {
          const limit = Number(filters.top) > 0 ? Number(filters.top) : 10;

          return results
            .filter((item) => item.result === "PASS" && item.rank != null)
            .filter((item) => matchesClass(item, filters))
            .filter((item) => item.rank <= limit)
            .map((item) => ({
              ...item,
              classLabel: `${item.className} - ${item.sectionName}`,
              marksLabel: `${item.totalMarks} / ${item.maximumMarks}`,
            }))
            .sort((a, b) => a.classLabel.localeCompare(b.classLabel) || a.rank - b.rank);
        },
      },

      {
        id: "subject-performance",
        title: "Subject Performance Report",
        description: "Average, highest and lowest marks of each subject in an exam",
        icon: "📚",
        defaultFilters: { examName: "", className: "", sectionName: "" },
        filters: [examFilter, classFilter, sectionFilter],
        columns: [
          SNO_COLUMN,
          { key: "examName", label: "Exam" },
          { key: "classLabel", label: "Class" },
          { key: "subjectName", label: "Subject" },
          { key: "maximumMarks", label: "Max Marks" },
          { key: "entered", label: "Students" },
          { key: "absent", label: "Absent" },
          { key: "average", label: "Average" },
          { key: "averagePercent", label: "Average %" },
          { key: "highest", label: "Highest" },
          { key: "lowest", label: "Lowest" },
        ],
        getData: ({ filters }) =>
          subjects
            .filter((item) => !filters.examName || item.examName === filters.examName)
            .filter((item) => matchesClass(item, filters))
            .map((item) => ({
              ...item,
              classLabel: `${item.className} - ${item.sectionName}`,
              maximumMarks: item.maximumMarks ?? "-",
              averagePercent: item.averagePercent == null ? "-" : `${item.averagePercent}%`,
            }))
            .sort(
              (a, b) =>
                a.examName.localeCompare(b.examName) ||
                a.classLabel.localeCompare(b.classLabel) ||
                a.subjectName.localeCompare(b.subjectName)
            ),
      },

      {
        id: "marks-entry-progress",
        title: "Marks Entry Progress",
        description: "How many students have marks entered for each exam",
        icon: "✍️",
        defaultFilters: { examName: "", className: "" },
        filters: [examFilter, classFilter],
        columns: [
          SNO_COLUMN,
          { key: "examName", label: "Exam" },
          { key: "classLabel", label: "Class" },
          { key: "students", label: "Students" },
          { key: "studentsWithMarks", label: "Marks Entered" },
          { key: "pending", label: "Pending" },
        ],
        getData: ({ filters }) =>
          progress
            .filter((item) => !filters.examName || item.examName === filters.examName)
            .filter((item) => !filters.className || item.className === filters.className)
            .map((item) => ({
              ...item,
              classLabel: `${item.className} - ${item.sectionName}`,
              pending: Math.max(item.students - item.studentsWithMarks, 0),
            }))
            .sort((a, b) => a.examName.localeCompare(b.examName) || a.classLabel.localeCompare(b.classLabel)),
      },
    ];
  }, [data]);

  if (loading) {
    return (
      <div style={{ padding: "20px" }}>
        <SkeletonList count={5} />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: "20px" }}>
        <AppButton type="back" onClick={() => navigate("/report-card-management")}>
          ←
        </AppButton>

        <p>{error || "Report card analytics are not available"}</p>
      </div>
    );
  }

  return (
    <MasterReport
      moduleTitle="Report Card Analytics & Reports"
      reports={reports}
      schoolProfiles={schoolProfiles}
      currentUser={currentUser}
    />
  );
}

export default ReportCardReports;
