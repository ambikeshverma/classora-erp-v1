import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./houseManagement.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { studentHubService } from "../services/api";

function HouseManagement() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [houses, setHouses] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewData, setViewData] = useState(null);
  const [editId, setEditId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    houseName: "",
    houseCode: "",
    color: "#4f46e5",
    captain: "",
    status: "Active",
  });

  const loadHouses = async () => {
    try {
      setLoading(true);
      const res = await studentHubService.getHouses();
      if (res.data?.success) {
        setHouses(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load houses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHouses();
  }, []);

  const resetForm = () => {
    setFormData({
      houseName: "",
      houseCode: "",
      color: "#4f46e5",
      captain: "",
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
    if (!formData.houseName) {
      alert("Please fill required fields (House Name)");
      return;
    }

    try {
      setSaving(true);
      if (editId) {
        const res = await studentHubService.updateHouse(editId, formData);
        if (res.data?.success) {
          alert("House updated successfully");
          resetForm();
          setShowForm(false);
          loadHouses();
          setSelectedIds([]);
        }
      } else {
        const res = await studentHubService.createHouse(formData);
        if (res.data?.success) {
          alert("House added successfully");
          resetForm();
          setShowForm(false);
          loadHouses();
          setSelectedIds([]);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save house");
    } finally {
      setSaving(false);
    }
  };

  const filteredHouses = houses.filter((item) => {
    if (!searchText.trim()) return true;
    const q = searchText.toLowerCase();
    return (
      item.houseName?.toLowerCase().includes(q) ||
      item.houseCode?.toLowerCase().includes(q) ||
      item.captain?.toLowerCase().includes(q)
    );
  });

  const selectedHouses = houses.filter((item) =>
    selectedIds.includes(item._id || item.id)
  );
  const selectedSingle = selectedHouses.length === 1 ? selectedHouses[0] : null;

  const handleEdit = () => {
    if (!selectedSingle) {
      alert("Please select exactly one house to edit");
      return;
    }

    setEditId(selectedSingle._id || selectedSingle.id);
    setFormData({
      houseName: selectedSingle.houseName,
      houseCode: selectedSingle.houseCode || "",
      color: selectedSingle.color || "#4f46e5",
      captain: selectedSingle.captain || "",
      status: selectedSingle.status || (selectedSingle.isActive ? "Active" : "Inactive"),
    });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one house to delete");
      return;
    }

    const ok = window.confirm(`Delete ${selectedIds.length} selected house(s)?`);
    if (!ok) return;

    try {
      for (const id of selectedIds) {
        await studentHubService.deleteHouse(id);
      }
      alert("House(s) deleted successfully");
      setSelectedIds([]);
      loadHouses();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete house");
    }
  };

  return (
    <div className="house-page">
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
          <h1>House Management</h1>
          <p>Manage student houses, color codes, and house leadership</p>
        </div>
      </div>

      {!showForm && (
        <>
          <div className="common-card">
            <div className="filter-grid">
              <div className="form-group">
                <label>Search House</label>
                <input
                  type="text"
                  placeholder="Filter by house name, code or captain..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="common-card">
            <div className="list-header">
              <h2>House List ({filteredHouses.length})</h2>

              <div className="list-action-buttons">
                <AppButton type="primary" onClick={() => setShowForm(true)}>
                  + Add House
                </AppButton>

                <AppButton
                  type="view"
                  onClick={() => {
                    if (!selectedSingle) {
                      alert("Please select one house to view");
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
                <SkeletonTable rows={5} columns={5} />
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: "40px" }}>
                        <input
                          type="checkbox"
                          checked={
                            filteredHouses.length > 0 &&
                            selectedIds.length === filteredHouses.length
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds(
                                filteredHouses.map((item) => item._id || item.id)
                              );
                            } else {
                              setSelectedIds([]);
                            }
                          }}
                        />
                      </th>
                      <th>S.No</th>
                      <th>House Name</th>
                      <th>House Code</th>
                      <th>Color</th>
                      <th>Captain</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredHouses.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="empty-row">
                          {searchText ? "No house found matching your search" : "No houses available. Click '+ Add House' to create one."}
                        </td>
                      </tr>
                    ) : (
                      filteredHouses.map((item, index) => {
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
                            <td>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                                {item.color && (
                                  <span
                                    style={{
                                      width: "14px",
                                      height: "14px",
                                      borderRadius: "50%",
                                      backgroundColor: item.color,
                                      display: "inline-block",
                                      border: "1px solid rgba(0,0,0,0.15)",
                                    }}
                                  />
                                )}
                                <strong>{item.houseName}</strong>
                              </span>
                            </td>
                            <td><span className="badge-code">{item.houseCode || "—"}</span></td>
                            <td>{item.color || "—"}</td>
                            <td>{item.captain || "—"}</td>
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
              <label>House Name *</label>
              <input
                type="text"
                name="houseName"
                placeholder="Example: Red House, Shivaji House"
                value={formData.houseName}
                onChange={handleChange}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>House Code</label>
              <input
                type="text"
                name="houseCode"
                placeholder="Example: RED, SHIV"
                value={formData.houseCode}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Theme Color</label>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <input
                  type="color"
                  name="color"
                  value={formData.color || "#4f46e5"}
                  onChange={handleChange}
                  style={{ width: "50px", height: "40px", padding: "2px", cursor: "pointer" }}
                />
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  placeholder="#4f46e5"
                />
              </div>
            </div>

            <div className="form-group">
              <label>House Captain (Optional)</label>
              <input
                type="text"
                name="captain"
                placeholder="Student name"
                value={formData.captain}
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
              <h2>House Details</h2>
              <button
                className="popup-close-btn"
                onClick={() => setViewData(null)}
              >
                ×
              </button>
            </div>

            <div className="view-grid">
              <p>
                <strong>House Name:</strong> {viewData.houseName}
              </p>
              <p>
                <strong>House Code:</strong> {viewData.houseCode || "—"}
              </p>
              <p>
                <strong>Color:</strong>{" "}
                {viewData.color ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <span
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        backgroundColor: viewData.color,
                        display: "inline-block",
                      }}
                    />
                    {viewData.color}
                  </span>
                ) : (
                  "—"
                )}
              </p>
              <p>
                <strong>Captain:</strong> {viewData.captain || "—"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HouseManagement;