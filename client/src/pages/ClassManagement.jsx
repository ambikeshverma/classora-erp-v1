import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./classManagement.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { studentHubService } from "../services/api";

function ClassManagement() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [classes, setClasses] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewData, setViewData] = useState(null);
  const [editId, setEditId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    className: "",
    classCode: "",
    status: "Active",
  });

  const loadClasses = async () => {
    try {
      setLoading(true);
      const res = await studentHubService.getClasses();
      if (res.data?.success) {
        setClasses(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load classes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const resetForm = () => {
    setFormData({
      className: "",
      classCode: "",
      status: "Active",
    });
    setEditId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSave = async () => {
    if (!formData.className || !formData.classCode) {
      alert("Please fill required fields (Class Name & Class Code)");
      return;
    }

    try {
      setSaving(true);
      if (editId) {
        const res = await studentHubService.updateClass(editId, formData);
        if (res.data?.success) {
          alert("Class updated successfully");
          resetForm();
          setShowForm(false);
          loadClasses();
          setSelectedIds([]);
        }
      } else {
        const res = await studentHubService.createClass(formData);
        if (res.data?.success) {
          alert("Class added successfully");
          resetForm();
          setShowForm(false);
          loadClasses();
          setSelectedIds([]);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save class");
    } finally {
      setSaving(false);
    }
  };

  const filteredClasses = classes.filter((item) => {
    if (!searchText.trim()) return true;
    const q = searchText.toLowerCase();
    return (
      item.className?.toLowerCase().includes(q) ||
      item.classCode?.toLowerCase().includes(q)
    );
  });

  const selectedClasses = classes.filter((item) =>
    selectedIds.includes(item._id || item.id)
  );
  const selectedSingle = selectedClasses.length === 1 ? selectedClasses[0] : null;

  const handleEdit = () => {
    if (!selectedSingle) {
      alert("Please select exactly one class to edit");
      return;
    }

    setEditId(selectedSingle._id || selectedSingle.id);
    setFormData({
      className: selectedSingle.className,
      classCode: selectedSingle.classCode,
      status: selectedSingle.status || "Active",
    });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one class to delete");
      return;
    }

    const ok = window.confirm(`Delete ${selectedIds.length} selected class(es)?`);
    if (!ok) return;

    try {
      for (const id of selectedIds) {
        await studentHubService.deleteClass(id);
      }
      alert("Class(es) deleted successfully");
      setSelectedIds([]);
      loadClasses();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete class");
    }
  };

  return (
    <div className="class-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => {
            if (showForm) {
              resetForm();
              setShowForm(false);
            } else {
              navigate("/student-hub");
            }
          }}
        >
          ←
        </AppButton>

        <div>
          <h1>Class Management</h1>
          <p>Manage school classes and academic levels</p>
        </div>
      </div>

      {!showForm && (
        <>
          <div className="common-card">
            <div className="filter-grid">
              <div className="form-group">
                <label>Search Class</label>
                <input
                  type="text"
                  placeholder="Filter by class name or code..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="common-card">
            <div className="list-header">
              <h2>Class List ({filteredClasses.length})</h2>

              <div className="list-action-buttons">
                <AppButton type="primary" onClick={() => setShowForm(true)}>
                  + Add Class
                </AppButton>

                <AppButton
                  type="view"
                  onClick={() => {
                    if (!selectedSingle) {
                      alert("Please select one class to view");
                      return;
                    }
                    setViewData(selectedSingle);
                  }}
                >
                  View
                </AppButton>

                <AppButton type="primary" onClick={handleEdit}>
                  Edit
                </AppButton>

                <AppButton type="delete" onClick={handleDelete}>
                  Delete
                </AppButton>
              </div>
            </div>

            <div className="table-wrap">
              {loading ? (
                <SkeletonTable rows={5} columns={4} />
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: "40px" }}>
                        <input
                          type="checkbox"
                          checked={
                            filteredClasses.length > 0 &&
                            selectedIds.length === filteredClasses.length
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds(
                                filteredClasses.map((item) => item._id || item.id)
                              );
                            } else {
                              setSelectedIds([]);
                            }
                          }}
                        />
                      </th>
                      <th>S.No</th>
                      <th>Class Name</th>
                      <th>Class Code</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredClasses.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="empty-row">
                          {searchText ? "No class found matching your search" : "No classes available. Click '+ Add Class' to create one."}
                        </td>
                      </tr>
                    ) : (
                      filteredClasses.map((item, index) => {
                        const itemId = item._id || item.id;
                        return (
                          <tr key={itemId}>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(itemId)}
                                onChange={() => {
                                  setSelectedIds((prev) =>
                                    prev.includes(itemId)
                                      ? prev.filter((id) => id !== itemId)
                                      : [...prev, itemId]
                                  );
                                }}
                              />
                            </td>
                            <td>{index + 1}</td>
                            <td><strong>{item.className}</strong></td>
                            <td><span className="badge-code">{item.classCode}</span></td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {showForm && (
        <div className="common-card">
          <div className="enquiry-form-grid">
            <div className="form-group">
              <label>Class Name *</label>
              <input
                type="text"
                name="className"
                placeholder="Example: Class 8"
                value={formData.className}
                onChange={handleChange}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Class Code *</label>
              <input
                type="text"
                name="classCode"
                placeholder="Example: VIII"
                value={formData.classCode}
                onChange={handleChange}
              />
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

      {viewData && (
        <div className="popup-overlay">
          <div className="view-popup">
            <div className="popup-head">
              <h2>Class Details</h2>
              <button
                className="popup-close-btn"
                onClick={() => setViewData(null)}
              >
                ×
              </button>
            </div>

            <div className="view-grid">
              <p>
                <strong>Class Name:</strong> {viewData.className}
              </p>
              <p>
                <strong>Class Code:</strong> {viewData.classCode}
              </p>
              <p>
                <strong>Sections:</strong>{" "}
                {viewData.sections && viewData.sections.length > 0
                  ? viewData.sections.map((s) => s.sectionName || s).join(", ")
                  : "None configured"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClassManagement;