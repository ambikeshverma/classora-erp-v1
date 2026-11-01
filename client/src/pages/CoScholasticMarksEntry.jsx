import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./coScholasticMarksEntry.css";
import AppButton from "../components/AppButton";
import { Skeleton } from "../components/Skeleton";
import { reportCardService } from "../services/api";

import { notifyAlert } from "../utils/toast";
const VALID_GRADES = ["A+", "A", "B+", "B", "C", "D"];
const EMPTY_FILTERS = { examId: "", className: "", sectionName: "", subjectFilter: "All Subjects" };

function CoScholasticMarksEntry() {
  const navigate = useNavigate();

  const [meta, setMeta] = useState({ exams: [], classes: [] });
  const [metaLoading, setMetaLoading] = useState(true);

  const [filterData, setFilterData] = useState(EMPTY_FILTERS);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [entry, setEntry] = useState({ students: [], subjectOptions: [], locked: false });
  const [gradeData, setGradeData] = useState({});

  useEffect(() => {
    let active = true;

    reportCardService
      .getMeta()
      .then((res) => {
        if (active) setMeta(res.data?.data || { exams: [], classes: [] });
      })
      .catch((err) => {
        console.error("Failed to load report card meta", err);
      })
      .finally(() => {
        if (active) setMetaLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Only exams that allow co-scholastic entry are offered
  const coExams = meta.exams.filter((item) => item.allowCoScholastic);
  const selectedExam = coExams.find((item) => item._id === filterData.examId);

  const classOptions = selectedExam
    ? meta.classes.filter((item) => selectedExam.applicableClasses.includes(item.className))
    : [];

  const sectionOptions = meta.classes.find((item) => item.className === filterData.className)?.sections || [];

  const visibleStudents = useMemo(
    () =>
      entry.students.map((student) => ({
        ...student,
        subjects:
          filterData.subjectFilter === "All Subjects"
            ? student.subjects
            : student.subjects.filter((subject) => subject.subjectName === filterData.subjectFilter),
      })),
    [entry.students, filterData.subjectFilter]
  );

  const keyOf = (studentId, subjectName) => `${studentId}_${subjectName}`;

  const handleSearch = async () => {
    if (!filterData.examId || !filterData.className || !filterData.sectionName) {
      notifyAlert("Please select exam, class and section");
      return;
    }

    try {
      setLoading(true);
      setSearched(true);

      const res = await reportCardService.getCoScholasticEntry({
        examId: filterData.examId,
        className: filterData.className,
        sectionName: filterData.sectionName,
      });

      const data = res.data?.data || { students: [], subjectOptions: [], locked: false };
      setEntry(data);

      const saved = {};
      data.students.forEach((student) =>
        student.subjects.forEach((subject) => {
          saved[keyOf(student._id, subject.subjectName)] = subject.grade;
        })
      );
      setGradeData(saved);
    } catch (err) {
      setEntry({ students: [], subjectOptions: [], locked: false });
      notifyAlert(err.response?.data?.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (studentId, subjectName, value) => {
    if (entry.locked) return;

    const upperValue = value.toUpperCase();
    if (upperValue !== "" && !VALID_GRADES.includes(upperValue)) return;

    setGradeData((prev) => ({ ...prev, [keyOf(studentId, subjectName)]: upperValue }));
  };

  const handleSave = async () => {
    if (entry.locked) {
      notifyAlert("Result is locked. Grades cannot be edited.");
      return;
    }

    const grades = [];
    entry.students.forEach((student) =>
      student.subjects.forEach((subject) =>
        grades.push({
          studentId: student._id,
          subjectName: subject.subjectName,
          grade: gradeData[keyOf(student._id, subject.subjectName)] ?? "",
        })
      )
    );

    try {
      setSaving(true);
      await reportCardService.saveCoScholasticEntry({
        examId: filterData.examId,
        className: filterData.className,
        sectionName: filterData.sectionName,
        grades,
      });

      notifyAlert("Co-Scholastic grades saved successfully");
    } catch (err) {
      notifyAlert(err.response?.data?.message || "Failed to save grades");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="co-scholastic-page">
      <div className="common-page-header">
        <AppButton type="back" onClick={() => navigate("/report-card-management")}>
          ←
        </AppButton>

        <div>
          <h1>Co-Scholastic Marks Entry</h1>
          <p>Enter and manage co-scholastic grades</p>
        </div>
      </div>

      <div className="common-card">
        <h2>Filter Records</h2>

        <div className="filter-grid">
          <div className="form-group">
            <label>Exam</label>

            <select
              value={filterData.examId}
              disabled={metaLoading}
              onChange={(e) => {
                setFilterData({ ...EMPTY_FILTERS, examId: e.target.value });
                setSearched(false);
              }}
            >
              <option value="">
                {metaLoading ? "Loading..." : coExams.length === 0 ? "No exam allows co-scholastic" : "Select Exam"}
              </option>

              {coExams.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.examName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Class</label>

            <select
              value={filterData.className}
              onChange={(e) => {
                setFilterData({ ...filterData, className: e.target.value, sectionName: "", subjectFilter: "All Subjects" });
                setSearched(false);
              }}
            >
              <option value="">Select Class</option>

              {classOptions.map((item) => (
                <option key={item.className} value={item.className}>
                  {item.className}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Section</label>

            <select
              value={filterData.sectionName}
              onChange={(e) => {
                setFilterData({ ...filterData, sectionName: e.target.value, subjectFilter: "All Subjects" });
                setSearched(false);
              }}
            >
              <option value="">Select Section</option>

              {sectionOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Subject Filter</label>

            <select
              value={filterData.subjectFilter}
              onChange={(e) => setFilterData({ ...filterData, subjectFilter: e.target.value })}
            >
              <option value="All Subjects">All Subjects</option>

              {entry.subjectOptions.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-actions">
          <AppButton type="primary" onClick={handleSearch} disabled={loading}>
            {loading ? "Loading..." : "Search"}
          </AppButton>
        </div>
      </div>

      <div className="grade-notice">
        Note: Allowed Grades → A+, A, B+, B, C, D | Blank = Pending | Invalid grade not allowed
      </div>

      {searched && entry.locked && (
        <div className="lock-warning-card">
          <p>Result is locked. Grades cannot be edited.</p>
        </div>
      )}

      {searched && (
        <div className="common-card">
          <div className="list-header">
            <h2>Grade Entry List</h2>
          </div>

          <div className="grade-entry-list">
            {loading ? (
              <Skeleton variant="rectangular" height={110} count={3} />
            ) : visibleStudents.length === 0 ? (
              <div className="empty-row">No students found</div>
            ) : (
              visibleStudents.map((student) => (
                <div className="student-grade-card" key={student._id}>
                  <div className="student-top">
                    <div>
                      <span className="student-roll">Roll No: {student.rollNo || "-"}</span>

                      <h3>{student.studentName}</h3>
                    </div>

                    <div className="scholastic-total-box">
                      Scholastic Total
                      <strong>
                        {student.scholasticTotal.obtained} / {student.scholasticTotal.maximum}
                      </strong>
                    </div>
                  </div>

                  {student.subjects.length === 0 ? (
                    <p className="empty-message">No co-scholastic subjects mapped for this student.</p>
                  ) : (
                    <div className="subject-entry-grid">
                      {student.subjects.map((subject) => (
                        <div className="subject-input-box" key={subject.subjectName}>
                          <label>{subject.subjectName}</label>

                          <input
                            type="text"
                            value={gradeData[keyOf(student._id, subject.subjectName)] ?? ""}
                            disabled={entry.locked}
                            onChange={(e) => handleGradeChange(student._id, subject.subjectName, e.target.value)}
                            placeholder="A+ / A / B+ / B / C / D"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {!loading && entry.students.length > 0 && (
            <div className="form-actions">
              <AppButton type="primary" onClick={handleSave} disabled={saving || entry.locked}>
                {saving ? "Saving..." : "Save Grades"}
              </AppButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CoScholasticMarksEntry;
