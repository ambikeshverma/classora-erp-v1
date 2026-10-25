import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./mediumManagement.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { studentHubService } from "../services/api";

function MediumManagement() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [mediums, setMediums] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewData, setViewData] = useState(null);
  const [editId, setEditId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    mediumName: "",
    mediumCode: "",
    status: "Active",
  });

  const loadMediums = async () => {
    try {
      setLoading(true);
      const res = await studentHubService.getMediums();
      if (res.data?.success) {
        setMediums(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load mediums:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMediums();
  }, []);

  const resetForm = () => {
    setFormData({
      mediumName: "",
      mediumCode: "",
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
    if (!formData.mediumName || !formData.mediumCode) {
      alert("Please fill required fields (Medium Name & Medium Code)");
      return;
    }

    try {
      setSaving(true);
      if (editId) {
        const res = await studentHubService.updateMedium(editId, formData);
        if (res.data?.success) {
          alert("Medium updated successfully");
          resetForm();
          setShowForm(false);
          loadMediums();
          setSelectedIds([]);
        }
      } else {
        const res = await studentHubService.createMedium(formData);
        if (res.data?.success) {
          alert("Medium added successfully");
          resetForm();
          setShowForm(false);
          loadMediums();
          setSelectedIds([]);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save medium");
    } finally {
      setSaving(false);
    }
  };

  const filteredMediums = mediums.filter((item) => {
    if (!searchText.trim()) return true;
    const q = searchText.toLowerCase();
    return (
      item.mediumName?.toLowerCase().includes(q) ||
      item.mediumCode?.toLowerCase().includes(q)
    );
  });

  const selectedMediums = mediums.filter((item) =>
    selectedIds.includes(item._id || item.id)
  );
  const selectedSingle = selectedMediums.length === 1 ? selectedMediums[0] : null;

  const handleEdit = () => {
    if (!selectedSingle) {
      alert("Please select exactly one medium to edit");
      return;
    }

    setEditId(selectedSingle._id || selectedSingle.id);
    setFormData({
      mediumName: selectedSingle.mediumName,
      mediumCode: selectedSingle.mediumCode,
      status: selectedSingle.status || "Active",
    });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one medium to delete");
      return;
    }

    const ok = window.confirm(`Delete ${selectedIds.length} selected medium(s)?`);
    if (!ok) return;

    try {
      for (const id of selectedIds) {
        await studentHubService.deleteMedium(id);
      }
      alert("Medium(s) deleted successfully");
      setSelectedIds([]);
      loadMediums();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete medium");
    }
  };

  return (
    <div className="medium-page">
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
          <h1>Medium Management</h1>
          <p>Manage instruction mediums (e.g. English, Hindi, Bilingual)</p>
        </div>
      </div>

      {!showForm && (
        <>
          <div className="common-card">
            <div className="filter-grid">
              <div className="form-group">
                <label>Search Medium</label>
                <input
                  type="text"
                  placeholder="Filter by medium name or code..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="common-card">
            <div className="list-header">
              <h2>Medium List ({filteredMediums.length})</h2>

              <div className="list-action-buttons">
                <AppButton type="primary" onClick={() => setShowForm(true)}>
                  + Add Medium
                </AppButton>

                <AppButton
                  type="view"
                  onClick={() => {
                    if (!selectedSingle) {
                      alert("Please select one medium to view");
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
                            filteredMediums.length > 0 &&
                            selectedIds.length === filteredMediums.length
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds(
                                filteredMediums.map((item) => item._id || item.id)
                              );
                            } else {
                              setSelectedIds([]);
                            }
                          }}
                        />
                      </th>
                      <th>S.No</th>
                      <th>Medium Name</th>
                      <th>Medium Code</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredMediums.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="empty-row">
                          {searchText ? "No medium found matching your search" : "No mediums available. Click '+ Add Medium' to create one."}
                        </td>
                      </tr>
                    ) : (
                      filteredMediums.map((item, index) => {
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
                            <td><strong>{item.mediumName}</strong></td>
                            <td><span className="badge-code">{item.mediumCode}</span></td>
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
              <label>Medium Name *</label>
              <input
                type="text"
                name="mediumName"
                placeholder="Example: English Medium"
                value={formData.mediumName}
                onChange={handleChange}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Medium Code *</label>
              <input
                type="text"
                name="mediumCode"
                placeholder="Example: ENG"
                value={formData.mediumCode}
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
              <h2>Medium Details</h2>
              <button
                className="popup-close-btn"
                onClick={() => setViewData(null)}
              >
                ×
              </button>
            </div>

            <div className="view-grid">
              <p>
                <strong>Medium Name:</strong> {viewData.mediumName}
              </p>
              <p>
                <strong>Medium Code:</strong> {viewData.mediumCode}
              </p>
              <p>
                <strong>Status:</strong> {viewData.status || "Active"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MediumManagement;