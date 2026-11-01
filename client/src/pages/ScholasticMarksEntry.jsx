import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./scholasticMarksEntry.css";
import AppButton from "../components/AppButton";
import { Skeleton } from "../components/Skeleton";
import { reportCardService } from "../services/api";

import { notifyAlert } from "../utils/toast";
const EMPTY_FILTERS = { examId: "", className: "", sectionName: "", subjectFilter: "All Subjects" };

function ScholasticMarksEntry() {
  const navigate = useNavigate();

  const [meta, setMeta] = useState({ exams: [], classes: [] });
  const [metaLoading, setMetaLoading] = useState(true);

  const [filterData, setFilterData] = useState(EMPTY_FILTERS);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [entry, setEntry] = useState({ students: [], subjectOptions: [], setupMissing: false, locked: false });
  const [marksData, setMarksData] = useState({});

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

  const selectedExam = meta.exams.find((item) => item._id === filterData.examId);

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

  const calculateTotal = (student) => {
    let obtained = 0;
    let maximum = 0;

    student.subjects.forEach((subject) => {
      const value = marksData[keyOf(student._id, subject.subjectName)] ?? "";
      maximum += Number(subject.maximumMarks);

      if (value !== "" && value !== "AB" && value !== "ML" && !Number.isNaN(Number(value))) {
        obtained += Number(value);
      }
    });

    return { obtained, maximum };
  };

  const handleSearch = async () => {
    if (!filterData.examId || !filterData.className || !filterData.sectionName) {
      notifyAlert("Please select exam, class and section");
      return;
    }

    try {
      setLoading(true);
      setSearched(true);

      const res = await reportCardService.getMarksEntry({
        examId: filterData.examId,
        className: filterData.className,
        sectionName: filterData.sectionName,
      });

      const data = res.data?.data || { students: [], subjectOptions: [], setupMissing: false, locked: false };
      setEntry(data);

      const saved = {};
      data.students.forEach((student) =>
        student.subjects.forEach((subject) => {
          saved[keyOf(student._id, subject.subjectName)] = subject.marks;
        })
      );
      setMarksData(saved);
    } catch (err) {
      setEntry({ students: [], subjectOptions: [], setupMissing: false, locked: false });
      notifyAlert(err.response?.data?.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handleMarksChange = (student, subject, value) => {
    if (entry.locked) return;

    const upperValue = value.toUpperCase();

    if (upperValue !== "" && upperValue !== "AB" && upperValue !== "ML") {
      if (Number.isNaN(Number(upperValue)) || Number(upperValue) < 0) return;

      if (Number(upperValue) > subject.maximumMarks) {
        notifyAlert(`Maximum marks for ${subject.subjectName} is ${subject.maximumMarks}`);
        return;
      }
    }

    setMarksData((prev) => ({ ...prev, [keyOf(student._id, subject.subjectName)]: upperValue }));
  };

  const handleSave = async () => {
    if (entry.locked) {
      notifyAlert("Result is locked. Marks cannot be edited.");
      return;
    }

    const marks = [];
    entry.students.forEach((student) =>
      student.subjects.forEach((subject) =>
        marks.push({
          studentId: student._id,
          subjectName: subject.subjectName,
          marks: marksData[keyOf(student._id, subject.subjectName)] ?? "",
        })
      )
    );

    try {
      setSaving(true);
      await reportCardService.saveMarksEntry({
        examId: filterData.examId,
        className: filterData.className,
        sectionName: filterData.sectionName,
        marks,
      });

      notifyAlert("Scholastic marks saved successfully");
    } catch (err) {
      notifyAlert(err.response?.data?.message || "Failed to save marks");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="scholastic-page">
      <div className="common-page-header">
        <AppButton type="back" onClick={() => navigate("/report-card-management")}>
          ←
        </AppButton>

        <div>
          <h1>Scholastic Marks Entry</h1>
          <p>Enter and manage subject wise scholastic marks</p>
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
              <option value="">{metaLoading ? "Loading..." : meta.exams.length === 0 ? "No exam available" : "Select Exam"}</option>

              {meta.exams.map((item) => (
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

      <div className="marks-notice">
        NOTE: AB = Absent | ML = Medical Leave | Only numbers, AB and ML allowed | Invalid value not allowed
      </div>

      {searched && entry.locked && (
        <div className="lock-warning-card">
          <p>Result is locked. Marks cannot be edited.</p>
        </div>
      )}

      {searched && (
        <div className="common-card">
          <div className="list-header">
            <h2>Marks Entry List</h2>
          </div>

          <div className="marks-entry-list">
            {loading ? (
              <Skeleton variant="rectangular" height={120} count={3} />
            ) : entry.setupMissing ? (
              <div className="empty-row">
                Marks are not set up for this exam and class. Set them in Exam Tools → Exam Marks Setup first.
              </div>
            ) : visibleStudents.length === 0 ? (
              <div className="empty-row">No students found</div>
            ) : (
              visibleStudents.map((student) => {
                const total = calculateTotal(student);

                return (
                  <div className="student-marks-card" key={student._id}>
                    <div className="student-top">
                      <div>
                        <span className="student-roll">Roll No: {student.rollNo || "-"}</span>

                        <h3>{student.studentName}</h3>
                      </div>

                      <div className="live-total-box">
                        Live Total
                        <strong>
                          {total.obtained} / {total.maximum}
                        </strong>
                      </div>
                    </div>

                    {student.subjects.length === 0 ? (
                      <p className="empty-message">No scholastic subjects assigned for this student.</p>
                    ) : (
                      <div className="subject-entry-grid">
                        {student.subjects.map((subject) => (
                          <div className="subject-input-box" key={subject.subjectName}>
                            <label>
                              {subject.subjectName} ({subject.maximumMarks})
                            </label>

                            <input
                              type="text"
                              value={marksData[keyOf(student._id, subject.subjectName)] ?? ""}
                              disabled={entry.locked}
                              onChange={(e) => handleMarksChange(student, subject, e.target.value)}
                              placeholder="Enter Marks / AB / ML"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {!loading && !entry.setupMissing && entry.students.length > 0 && (
            <div className="form-actions">
              <AppButton type="primary" onClick={handleSave} disabled={saving || entry.locked}>
                {saving ? "Saving..." : "Save Marks"}
              </AppButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ScholasticMarksEntry;
