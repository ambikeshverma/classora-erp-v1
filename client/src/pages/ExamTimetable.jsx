import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./examTimetable.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { examService } from "../services/api";

const EMPTY_FILTERS = { examId: "", className: "", sectionName: "" };

const EMPTY_FORM = {
  mode: "Single",
  examId: "",
  className: "",
  sectionName: "",
  selectedClassSections: [],
  subjectName: "",
  examDate: "",
  startTime: "",
  endTime: "",
};

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

const formatDate = (value) => (value ? String(value).split("-").reverse().join("-") : "-");

const formatTime = (start, end) => `${start} - ${end}`;

function ExamTimetable() {
  const navigate = useNavigate();

  const [meta, setMeta] = useState({ exams: [], classes: [], schoolInfo: {} });
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const [filterData, setFilterData] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const loadTimetable = useCallback(async () => {
    try {
      setLoading(true);

      const params = {};
      Object.entries(appliedFilters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });

      const res = await examService.getTimetables(params);
      setTimetable(res.data?.data || []);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load timetable");
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    let active = true;

    examService
      .getMeta()
      .then((res) => {
        if (active) setMeta(res.data?.data || { exams: [], classes: [], schoolInfo: {} });
      })
      .catch((err) => {
        console.error("Failed to load exam meta", err);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    loadTimetable();
  }, [loadTimetable]);

  const classInfo = (className) => meta.classes.find((item) => item.className === className);

  const formExam = meta.exams.find((item) => item._id === formData.examId);

  // Only classes the chosen exam applies to can be scheduled
  const formClasses = formExam
    ? meta.classes.filter((item) => formExam.applicableClasses.includes(item.className))
    : meta.classes;

  const classSectionOptions = formClasses.flatMap((item) =>
    item.sections.map((sectionName) => ({ className: item.className, sectionName }))
  );

  const formSubjects =
    formData.mode === "Single"
      ? classInfo(formData.className)?.subjects || []
      : (() => {
          const chosen = formData.selectedClassSections.map((value) => value.split("|")[0]);
          const lists = [...new Set(chosen)].map((name) => classInfo(name)?.subjects || []);
          // Multiple classes: only subjects every selected class has
          return lists.length === 0 ? [] : lists.reduce((common, list) => common.filter((name) => list.includes(name)));
        })();

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditId(null);
  };

  const handleSearch = () => {
    setAppliedFilters(filterData);
    setSelectedIds([]);
  };

  const handleSave = async () => {
    if (
      !formData.examId ||
      !formData.subjectName ||
      !formData.examDate ||
      !formData.startTime ||
      !formData.endTime
    ) {
      alert("Please fill all required fields");
      return;
    }

    if (formData.mode === "Single" && (!formData.className || !formData.sectionName)) {
      alert("Please select class and section");
      return;
    }

    if (formData.mode === "Multiple" && formData.selectedClassSections.length === 0) {
      alert("Please select class sections");
      return;
    }

    if (formData.endTime <= formData.startTime) {
      alert("End time cannot be before start time");
      return;
    }

    const base = {
      examId: formData.examId,
      subjectName: formData.subjectName,
      examDate: formData.examDate,
      startTime: formData.startTime,
      endTime: formData.endTime,
    };

    try {
      setSaving(true);

      if (editId) {
        await examService.updateTimetable(editId, {
          ...base,
          className: formData.className,
          sectionName: formData.sectionName,
        });
        alert("Timetable updated successfully");
      } else {
        const targets =
          formData.mode === "Single"
            ? [{ className: formData.className, sectionName: formData.sectionName }]
            : formData.selectedClassSections.map((value) => {
                const [className, sectionName] = value.split("|");
                return { className, sectionName };
              });

        const res = await examService.createTimetable({ ...base, targets });
        alert(res.data?.message || "Timetable added successfully");
      }

      resetForm();
      setShowForm(false);
      setSelectedIds([]);
      await loadTimetable();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save timetable");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    if (selectedIds.length !== 1) {
      alert("Please select one timetable");
      return;
    }

    const selected = timetable.find((item) => item._id === selectedIds[0]);
    if (!selected) return;

    setEditId(selected._id);
    setFormData({
      mode: "Single",
      examId: String(selected.examId),
      className: selected.className,
      sectionName: selected.sectionName,
      selectedClassSections: [],
      subjectName: selected.subjectName,
      examDate: selected.examDate,
      startTime: selected.startTime,
      endTime: selected.endTime,
    });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      alert("Please select timetable");
      return;
    }

    if (!window.confirm("Delete selected timetable?")) return;

    try {
      setSaving(true);
      await examService.deleteTimetables(selectedIds);
      setSelectedIds([]);
      alert("Timetable deleted successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete timetable");
    } finally {
      setSaving(false);
      await loadTimetable();
    }
  };

  const handlePrint = () => {
    if (selectedIds.length === 0) {
      alert("Please select timetable rows");
      return;
    }

    const schoolDetails = meta.schoolInfo || {};
    const selectedRows = timetable.filter((item) => selectedIds.includes(item._id));

    // Same paper for several sections of a class is printed as one row
    const groupedRows = [];
    selectedRows.forEach((item) => {
      const existing = groupedRows.find(
        (row) =>
          row.examName === item.examName &&
          row.className === item.className &&
          row.subjectName === item.subjectName &&
          row.examDate === item.examDate &&
          row.startTime === item.startTime &&
          row.endTime === item.endTime
      );

      if (existing) existing.sections.push(item.sectionName);
      else groupedRows.push({ ...item, sections: [item.sectionName] });
    });

    const rowsHtml = groupedRows
      .map(
        (item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(item.className)} (${escapeHtml(item.sections.join(", "))})</td>
            <td>${escapeHtml(item.subjectName)}</td>
            <td>${escapeHtml(formatDate(item.examDate))}</td>
            <td>${escapeHtml(formatTime(item.startTime, item.endTime))}</td>
          </tr>
        `
      )
      .join("");

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to print the timetable");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Exam Timetable</title>
          <style>
            @page { size: A4 landscape; margin: 12mm; }
            body { font-family: Arial, sans-serif; color: #111827; }
            .print-header { text-align: center; border-bottom: 2px solid #111827; padding-bottom: 10px; margin-bottom: 16px; }
            .print-header h1 { margin: 0; font-size: 22px; }
            .print-header p { margin: 4px 0; font-size: 13px; }
            .exam-title { text-align: center; margin: 12px 0; font-size: 18px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #111827; padding: 8px; text-align: center; }
            th { background: #f1f5f9; }
          </style>
        </head>

        <body>
          <div class="print-header">
            <h1>${escapeHtml(schoolDetails.schoolName)}</h1>
            <p>${escapeHtml(schoolDetails.address)}</p>
            <p>${schoolDetails.phone ? `Contact: ${escapeHtml(schoolDetails.phone)}` : ""}</p>
          </div>

          <div class="exam-title">${escapeHtml(groupedRows[0]?.examName || "Exam Timetable")}</div>

          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Class</th>
                <th>Subject</th>
                <th>Exam Date</th>
                <th>Time</th>
              </tr>
            </thead>

            <tbody>${rowsHtml}</tbody>
          </table>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  const handleClassSectionToggle = (value) => {
    setFormData((prev) => ({
      ...prev,
      subjectName: "",
      selectedClassSections: prev.selectedClassSections.includes(value)
        ? prev.selectedClassSections.filter((item) => item !== value)
        : [...prev.selectedClassSections, value],
    }));
  };

  return (
    <div className="exam-timetable-page">
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
          <h1>{showForm ? "Add / Edit Timetable" : "Exam Timetable"}</h1>
          <p>Create and manage exam schedules</p>
        </div>
      </div>

      {!showForm && (
        <>
          <div className="common-card">
            <div className="exam-filter-grid">
              <div className="form-group">
                <label>Exam Name</label>

                <select value={filterData.examId} onChange={(e) => setFilterData({ ...filterData, examId: e.target.value })}>
                  <option value="">All Exam</option>

                  {meta.exams.map((exam) => (
                    <option key={exam._id} value={exam._id}>
                      {exam.examName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Class</label>

                <select
                  value={filterData.className}
                  onChange={(e) => setFilterData({ ...filterData, className: e.target.value, sectionName: "" })}
                >
                  <option value="">All Class</option>

                  {meta.classes.map((cls) => (
                    <option key={cls.className} value={cls.className}>
                      {cls.className}
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
                  <option value="">All Section</option>

                  {(classInfo(filterData.className)?.sections || []).map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-actions search-action-row">
              <AppButton type="primary" onClick={handleSearch}>
                Search
              </AppButton>
            </div>
          </div>

          <div className="top-action-bar">
            <AppButton
              type="primary"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              + Add Timetable
            </AppButton>
          </div>

          <div className="common-card">
            <div className="list-header">
              <h2>Timetable List</h2>

              <div className="list-action-buttons">
                <AppButton type="primary" onClick={handlePrint}>
                  Print
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
                        checked={timetable.length > 0 && selectedIds.length === timetable.length}
                        onChange={(e) => setSelectedIds(e.target.checked ? timetable.map((item) => item._id) : [])}
                      />
                    </th>

                    <th>S.No</th>
                    <th>Exam Name</th>
                    <th>Class</th>
                    <th>Section</th>
                    <th>Subject</th>
                    <th>Exam Date</th>
                    <th>Time</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" style={{ padding: "4px 0", border: "none" }}>
                        <SkeletonTable rows={5} columns={8} />
                      </td>
                    </tr>
                  ) : timetable.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="empty-row">
                        No timetable found
                      </td>
                    </tr>
                  ) : (
                    timetable.map((item, index) => (
                      <tr key={item._id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item._id)}
                            onChange={() =>
                              setSelectedIds((prev) =>
                                prev.includes(item._id) ? prev.filter((id) => id !== item._id) : [...prev, item._id]
                              )
                            }
                          />
                        </td>

                        <td>{index + 1}</td>
                        <td>{item.examName}</td>
                        <td>{item.className}</td>
                        <td>{item.sectionName}</td>
                        <td>{item.subjectName}</td>
                        <td>{formatDate(item.examDate)}</td>
                        <td>{formatTime(item.startTime, item.endTime)}</td>
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
          {!editId && (
            <div className="mode-selection">
              <label>
                <input
                  type="radio"
                  name="mode"
                  value="Single"
                  checked={formData.mode === "Single"}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value, subjectName: "" })}
                />
                Single Class
              </label>

              <label>
                <input
                  type="radio"
                  name="mode"
                  value="Multiple"
                  checked={formData.mode === "Multiple"}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value, subjectName: "" })}
                />
                Multiple Classes
              </label>
            </div>
          )}

          <div className="exam-form-grid">
            <div className="form-group">
              <label>Exam Name *</label>

              <select
                value={formData.examId}
                disabled={Boolean(editId)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    examId: e.target.value,
                    className: "",
                    sectionName: "",
                    selectedClassSections: [],
                    subjectName: "",
                  })
                }
              >
                <option value="">{meta.exams.length === 0 ? "No exam available" : "Select Exam"}</option>

                {meta.exams.map((exam) => (
                  <option key={exam._id} value={exam._id}>
                    {exam.examName}
                  </option>
                ))}
              </select>
            </div>

            {formData.mode === "Single" ? (
              <>
                <div className="form-group">
                  <label>Class *</label>

                  <select
                    value={formData.className}
                    disabled={Boolean(editId)}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value, sectionName: "", subjectName: "" })}
                  >
                    <option value="">Select Class</option>

                    {formClasses.map((cls) => (
                      <option key={cls.className} value={cls.className}>
                        {cls.className}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Section *</label>

                  <select
                    value={formData.sectionName}
                    disabled={Boolean(editId)}
                    onChange={(e) => setFormData({ ...formData, sectionName: e.target.value })}
                  >
                    <option value="">Select Section</option>

                    {(classInfo(formData.className)?.sections || []).map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <div className="multi-class-box">
                <label>Select Class & Sections *</label>

                <div className="multi-class-grid">
                  {!formData.examId ? (
                    <p className="empty-row">Select exam first</p>
                  ) : classSectionOptions.length === 0 ? (
                    <p className="empty-row">No class section found for this exam</p>
                  ) : (
                    classSectionOptions.map((item) => {
                      const value = `${item.className}|${item.sectionName}`;

                      return (
                        <label key={value} className="multi-checkbox">
                          <input
                            type="checkbox"
                            checked={formData.selectedClassSections.includes(value)}
                            onChange={() => handleClassSectionToggle(value)}
                          />
                          {item.className}
                          {" - "}
                          {item.sectionName}
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Subject *</label>

              <select value={formData.subjectName} onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}>
                <option value="">Select Subject</option>

                {formSubjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Exam Date *</label>

              <input type="date" value={formData.examDate} onChange={(e) => setFormData({ ...formData, examDate: e.target.value })} />
            </div>

            <div className="form-group">
              <label>Start Time *</label>

              <input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} />
            </div>

            <div className="form-group">
              <label>End Time *</label>

              <input type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} />
            </div>
          </div>

          <div className="form-actions">
            <AppButton type="primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editId ? "Update" : "Save"}
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

export default ExamTimetable;
