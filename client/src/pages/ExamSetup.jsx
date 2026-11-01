import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./examSetup.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { examService } from "../services/api";

import { notifyAlert, confirmDialog } from "../utils/toast";
const EMPTY_FORM = { examName: "", applicableClasses: [], allowCoScholastic: false };

function ExamSetup() {
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editId, setEditId] = useState(null);
  const [showClassPopup, setShowClassPopup] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [examRes, metaRes] = await Promise.all([examService.getExams(), examService.getMeta()]);

      setExams(examRes.data?.data || []);
      setClassOptions((metaRes.data?.data?.classes || []).map((item) => item.className));
    } catch (err) {
      notifyAlert(err.response?.data?.message || "Failed to load exams");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditId(null);
    setShowClassPopup(false);
  };

  const handleSave = async () => {
    if (!formData.examName.trim()) {
      notifyAlert("Please enter exam name");
      return;
    }

    if (formData.applicableClasses.length === 0) {
      notifyAlert("Please select applicable classes");
      return;
    }

    try {
      setSaving(true);

      if (editId) {
        await examService.updateExam(editId, formData);
        notifyAlert("Exam updated successfully");
      } else {
        await examService.createExam(formData);
        notifyAlert("Exam added successfully");
      }

      resetForm();
      setShowForm(false);
      setSelectedIds([]);
      await loadData();
    } catch (err) {
      notifyAlert(err.response?.data?.message || "Failed to save exam");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    if (selectedIds.length !== 1) {
      notifyAlert("Select one exam");
      return;
    }

    const selected = exams.find((item) => item._id === selectedIds[0]);
    if (!selected) return;

    if (selected.isUsed) {
      notifyAlert("This exam is already used in other records. You cannot edit or delete it.");
      return;
    }

    setEditId(selected._id);
    setFormData({
      examName: selected.examName,
      applicableClasses: selected.applicableClasses || [],
      allowCoScholastic: selected.allowCoScholastic || false,
    });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      notifyAlert("Select exam");
      return;
    }

    if (exams.some((item) => selectedIds.includes(item._id) && item.isUsed)) {
      notifyAlert("This exam is already used in other records. You cannot edit or delete it.");
      return;
    }

    if (!await confirmDialog("Delete selected exam?")) return;

    try {
      setSaving(true);
      await Promise.all(selectedIds.map((id) => examService.deleteExam(id)));
      setSelectedIds([]);
      notifyAlert("Exam deleted successfully");
    } catch (err) {
      notifyAlert(err.response?.data?.message || "Failed to delete exam");
    } finally {
      setSaving(false);
      await loadData();
    }
  };

  return (
    <div className="exam-setup-page">
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
          <h1>{showForm ? "Add / Edit Exam" : "Exam Setup"}</h1>
          <p>Create and manage exams</p>
        </div>
      </div>

      {!showForm && (
        <>
          <div className="top-action-bar">
            <AppButton
              type="primary"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              + Add Exam
            </AppButton>
          </div>

          <div className="common-card">
            <div className="list-header">
              <h2>Exam List</h2>

              <div className="list-action-buttons">
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
                        checked={exams.length > 0 && selectedIds.length === exams.length}
                        onChange={(e) => setSelectedIds(e.target.checked ? exams.map((item) => item._id) : [])}
                      />
                    </th>

                    <th>S.No</th>
                    <th>Exam Name</th>
                    <th className="classes-cell">Applicable Classes</th>
                    <th>Co-Scholastic</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" style={{ padding: "4px 0", border: "none" }}>
                        <SkeletonTable rows={4} columns={5} />
                      </td>
                    </tr>
                  ) : exams.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-row">
                        No exam found
                      </td>
                    </tr>
                  ) : (
                    exams.map((item, index) => (
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
                        <td className="classes-cell">
                          {item.applicableClasses?.length > 0 ? item.applicableClasses.join(", ") : "-"}
                        </td>
                        <td>{item.allowCoScholastic ? "Yes" : "No"}</td>
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
          <div className="exam-form-grid">
            <div className="form-group">
              <label>Exam Name *</label>

              <input
                type="text"
                name="examName"
                value={formData.examName}
                onChange={(e) => setFormData({ ...formData, examName: e.target.value })}
                placeholder="Enter exam name"
              />
            </div>

            <div className="form-group">
              <label>Applicable Classes *</label>

              <div className="applicable-class-box">
                <div className="selected-class-text">
                  {formData.applicableClasses.length > 0 ? formData.applicableClasses.join(", ") : "No class selected"}
                </div>

                <AppButton type="secondary" onClick={() => setShowClassPopup(true)}>
                  Select Classes
                </AppButton>
              </div>
            </div>

            <div className="form-group">
              <label>Co-Scholastic Entry</label>

              <label className="exam-checkbox-row">
                <input
                  type="checkbox"
                  checked={formData.allowCoScholastic}
                  onChange={(e) => setFormData({ ...formData, allowCoScholastic: e.target.checked })}
                />

                <span>Allow Co-Scholastic Entry</span>
              </label>
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

      {showClassPopup && (
        <div className="popup-overlay">
          <div className="class-popup">
            <div className="popup-head">
              <h2>Select Applicable Classes</h2>

              <button className="popup-close-btn" onClick={() => setShowClassPopup(false)}>
                ×
              </button>
            </div>

            <div className="class-checkbox-list">
              {classOptions.length === 0 ? (
                <p className="empty-row">No class found. Create classes in Student Hub → Class Management first.</p>
              ) : (
                classOptions.map((className) => (
                  <label key={className} className="class-checkbox-item">
                    <input
                      type="checkbox"
                      checked={formData.applicableClasses.includes(className)}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          applicableClasses: prev.applicableClasses.includes(className)
                            ? prev.applicableClasses.filter((item) => item !== className)
                            : [...prev.applicableClasses, className],
                        }))
                      }
                    />

                    <span>{className}</span>
                  </label>
                ))
              )}
            </div>

            <div className="popup-actions">
              <AppButton type="primary" onClick={() => setShowClassPopup(false)}>
                Apply Classes
              </AppButton>

              <AppButton type="secondary" onClick={() => setShowClassPopup(false)}>
                Cancel
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExamSetup;
