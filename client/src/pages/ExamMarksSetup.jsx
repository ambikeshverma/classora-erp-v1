import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./examMarksSetup.css";
import AppButton from "../components/AppButton";
import { Skeleton, SkeletonTable } from "../components/Skeleton";
import { examService } from "../services/api";

const EMPTY_FILTERS = { examId: "", className: "", sectionName: "", subjectName: "" };
const EMPTY_FORM = { examId: "", className: "", sectionName: "", subjects: [] };

const groupKeyOf = (item) => `${item.examId}|${item.className}|${item.sectionName || ""}`;

function ExamMarksSetup() {
  const navigate = useNavigate();

  const [meta, setMeta] = useState({ exams: [], classes: [] });
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const [filterData, setFilterData] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [applicable, setApplicable] = useState(true);

  const loadGroups = useCallback(async () => {
    try {
      setLoading(true);

      const params = {};
      Object.entries(appliedFilters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });

      const res = await examService.getMarksSetups(params);
      setGroups(res.data?.data || []);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load marks setups");
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    let active = true;

    examService
      .getMeta()
      .then((res) => {
        if (active) setMeta(res.data?.data || { exams: [], classes: [] });
      })
      .catch((err) => {
        console.error("Failed to load exam meta", err);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const sectionsOf = (className) => meta.classes.find((item) => item.className === className)?.sections || [];

  const filterSubjects = filterData.className
    ? meta.classes.find((item) => item.className === filterData.className)?.subjects || []
    : [...new Set(meta.classes.flatMap((item) => item.subjects))];

  const formExam = meta.exams.find((item) => item._id === formData.examId);
  const formClasses = formExam ? meta.classes.filter((item) => formExam.applicableClasses.includes(item.className)) : meta.classes;

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setApplicable(true);
  };

  // Subjects come from the class's subject mapping, merged with marks already saved
  const loadSubjects = async (examId, className, sectionName) => {
    if (!examId || !className) {
      setFormData((prev) => ({ ...prev, subjects: [] }));
      return;
    }

    try {
      setSubjectsLoading(true);
      const res = await examService.getMarksSetupDetail({ examId, className, sectionName });
      setApplicable(res.data?.data?.applicable !== false);
      setFormData((prev) => ({ ...prev, subjects: res.data?.data?.subjects || [] }));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load subjects");
      setFormData((prev) => ({ ...prev, subjects: [] }));
    } finally {
      setSubjectsLoading(false);
    }
  };

  const handleFormMainChange = (name, value) => {
    const updated = { ...formData, [name]: value };

    if (name === "examId") updated.className = "";
    if (name === "examId" || name === "className") updated.sectionName = "";

    setFormData({ ...updated, subjects: [] });
    loadSubjects(updated.examId, updated.className, updated.sectionName);
  };

  const handleSubjectMarksChange = (index, field, value) => {
    const updatedSubjects = [...formData.subjects];
    updatedSubjects[index] = { ...updatedSubjects[index], [field]: value };
    setFormData({ ...formData, subjects: updatedSubjects });
  };

  const handleSave = async () => {
    if (!formData.examId || !formData.className) {
      alert("Please select exam and class");
      return;
    }

    if (formData.subjects.length === 0) {
      alert("No subject mapped with selected class");
      return;
    }

    if (formData.subjects.some((item) => !Number(item.maximumMarks))) {
      alert("Please fill maximum marks for all subjects");
      return;
    }

    if (
      formData.subjects.some(
        (item) => item.passingMarks !== "" && Number(item.passingMarks) > Number(item.maximumMarks)
      )
    ) {
      alert("Passing marks cannot exceed maximum marks");
      return;
    }

    try {
      setSaving(true);
      await examService.saveMarksSetup({
        examId: formData.examId,
        className: formData.className,
        sectionName: formData.sectionName,
        subjects: formData.subjects.map((item) => ({
          subjectName: item.subjectName,
          maximumMarks: Number(item.maximumMarks),
          passingMarks: item.passingMarks,
        })),
      });

      alert("Marks setup saved successfully");
      resetForm();
      setShowForm(false);
      await loadGroups();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save marks setup");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    if (selectedIds.length !== 1) {
      alert("Select one setup");
      return;
    }

    const selected = groups.find((item) => groupKeyOf(item) === selectedIds[0]);
    if (!selected) return;

    setFormData({
      examId: selected.examId,
      className: selected.className,
      sectionName: selected.sectionName || "",
      subjects: [],
    });
    setShowForm(true);
    loadSubjects(selected.examId, selected.className, selected.sectionName || "");
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      alert("Select setup");
      return;
    }

    const selectedGroups = groups.filter((item) => selectedIds.includes(groupKeyOf(item)));

    if (selectedGroups.some((item) => item.marksEntryStarted || item.resultGenerated)) {
      alert("Marks entry/result already exists. Setup cannot be deleted.");
      return;
    }

    if (!window.confirm("Delete selected marks setup?")) return;

    try {
      setSaving(true);
      await Promise.all(
        selectedGroups.map((item) =>
          examService.deleteMarksSetup({
            examId: item.examId,
            className: item.className,
            sectionName: item.sectionName || "",
          })
        )
      );
      setSelectedIds([]);
      alert("Marks setup deleted successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete marks setup");
    } finally {
      setSaving(false);
      await loadGroups();
    }
  };

  return (
    <div className="exam-marks-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => {
            if (showForm) {
              resetForm();
              setShowForm(false);
            } else {
              navigate("/exam-tools");
            }
          }}
        >
          ←
        </AppButton>

        <div>
          <h1>{showForm ? "Add / Edit Marks Setup" : "Exam Marks Setup"}</h1>
          <p>Manage exam wise maximum marks</p>
        </div>
      </div>

      {!showForm && (
        <>
          <div className="common-card">
            <div className="filter-grid">
              <div className="form-group">
                <label>Exam</label>

                <select value={filterData.examId} onChange={(e) => setFilterData({ ...filterData, examId: e.target.value })}>
                  <option value="">All Exams</option>

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
                  onChange={(e) =>
                    setFilterData({ ...filterData, className: e.target.value, sectionName: "", subjectName: "" })
                  }
                >
                  <option value="">All Classes</option>

                  {meta.classes.map((item) => (
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
                  onChange={(e) => setFilterData({ ...filterData, sectionName: e.target.value })}
                >
                  <option value="">All Sections</option>

                  {sectionsOf(filterData.className).map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Subject Filter</label>

                <select
                  value={filterData.subjectName}
                  onChange={(e) => setFilterData({ ...filterData, subjectName: e.target.value })}
                >
                  <option value="">All Subjects</option>

                  {filterSubjects.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-actions">
              <AppButton
                type="primary"
                onClick={() => {
                  setAppliedFilters(filterData);
                  setSelectedIds([]);
                }}
              >
                Search
              </AppButton>
            </div>
          </div>

          <div className="common-card">
            <div className="list-header">
              <h2>Marks Setup List</h2>

              <div className="list-action-buttons">
                <AppButton
                  type="primary"
                  onClick={() => {
                    resetForm();
                    setShowForm(true);
                  }}
                >
                  + Add Marks Setup
                </AppButton>

                <AppButton type="primary" onClick={handleEdit} disabled={saving}>
                  Edit
                </AppButton>

                <AppButton type="delete" onClick={handleDelete} disabled={saving}>
                  Delete
                </AppButton>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={groups.length > 0 && selectedIds.length === groups.length}
                        onChange={(e) => setSelectedIds(e.target.checked ? groups.map(groupKeyOf) : [])}
                      />
                    </th>

                    <th>S.No</th>
                    <th>Exam</th>
                    <th>Class</th>
                    <th>Section</th>
                    <th>Subjects Count</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" style={{ padding: "4px 0", border: "none" }}>
                        <SkeletonTable rows={4} columns={6} />
                      </td>
                    </tr>
                  ) : groups.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-row">
                        No marks setup found
                      </td>
                    </tr>
                  ) : (
                    groups.map((item, index) => (
                      <tr key={groupKeyOf(item)}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(groupKeyOf(item))}
                            onChange={() =>
                              setSelectedIds((prev) =>
                                prev.includes(groupKeyOf(item))
                                  ? prev.filter((id) => id !== groupKeyOf(item))
                                  : [...prev, groupKeyOf(item)]
                              )
                            }
                          />
                        </td>

                        <td>{index + 1}</td>
                        <td>{item.examName}</td>
                        <td>{item.className}</td>
                        <td>{item.sectionName || "All"}</td>
                        <td>{item.subjectCount}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showForm && (
        <div className="common-card">
          <div className="exam-marks-form-grid">
            <div className="form-group">
              <label>Exam *</label>

              <select value={formData.examId} onChange={(e) => handleFormMainChange("examId", e.target.value)}>
                <option value="">{meta.exams.length === 0 ? "No exam available" : "Select Exam"}</option>

                {meta.exams.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.examName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Class *</label>

              <select value={formData.className} onChange={(e) => handleFormMainChange("className", e.target.value)}>
                <option value="">Select Class</option>

                {formClasses.map((item) => (
                  <option key={item.className} value={item.className}>
                    {item.className}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Section</label>

              <select value={formData.sectionName} onChange={(e) => handleFormMainChange("sectionName", e.target.value)}>
                <option value="">All Sections</option>

                {sectionsOf(formData.className).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="subject-marks-box">
            <h2>Subject Marks Setup</h2>

            {subjectsLoading ? (
              <Skeleton variant="rectangular" height={44} count={3} />
            ) : !formData.examId || !formData.className ? (
              <p className="empty-row">Select exam and class to load subjects</p>
            ) : !applicable ? (
              <p className="empty-row">This exam is not applicable to the selected class</p>
            ) : formData.subjects.length === 0 ? (
              <p className="empty-row">
                No subject mapped with selected class. Map subjects in Academic Zone → Class Subject Mapping first.
              </p>
            ) : (
              <div className="subject-marks-list">
                {formData.subjects.map((subject, index) => (
                  <div className="subject-marks-row" key={subject.subjectName}>
                    <div className="subject-name-box">{subject.subjectName}</div>

                    <div className="form-group">
                      <label>Maximum Marks *</label>

                      <input
                        type="number"
                        min="1"
                        value={subject.maximumMarks}
                        disabled={subject.marksEntryStarted}
                        onChange={(e) => handleSubjectMarksChange(index, "maximumMarks", e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>Passing Marks</label>

                      <input
                        type="number"
                        min="0"
                        value={subject.passingMarks}
                        onChange={(e) => handleSubjectMarksChange(index, "passingMarks", e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <AppButton type="primary" onClick={handleSave} disabled={saving || subjectsLoading || !applicable}>
              {saving ? "Saving..." : "Save All"}
            </AppButton>

            <AppButton
              type="secondary"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
            >
              Go Back
            </AppButton>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExamMarksSetup;
