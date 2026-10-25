import React, { useState, useEffect } from "react";
import "./positionManagement.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { hrService } from "../services/api";

function PositionManagement() {
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editId, setEditId] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);

  const [formData, setFormData] = useState({
    departmentId: "",
    positionName: "",
  });

  /* ===============================
     Fetch Data (Optimized: single initial load)
  =============================== */
  const fetchData = async () => {
    try {
      setLoading(true);
      const [depRes, posRes] = await Promise.all([
        hrService.getDepartments(),
        hrService.getPositions(),
      ]);

      if (depRes.data?.success) {
        setDepartments(depRes.data.data || []);
      }
      if (posRes.data?.success) {
        setPositions(posRes.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load positions data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ===============================
     Reset Form
  =============================== */
  const resetForm = () => {
    setFormData({
      departmentId: "",
      positionName: "",
    });
    setEditId(null);
  };

  /* ===============================
     Handle Change
  =============================== */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  /* ===============================
     Save Position (Create / Update)
  =============================== */
  const handleSave = async () => {
    const { departmentId, positionName } = formData;
    if (!departmentId || !positionName.trim()) {
      alert("Please fill all required fields");
      return;
    }

    const cleanName = positionName.trim();

    const alreadyExists = positions.some(
      (item) =>
        (item.departmentId?._id || item.departmentId) === departmentId &&
        item.positionName.toLowerCase().trim() === cleanName.toLowerCase() &&
        (item._id || item.id) !== editId
    );

    if (alreadyExists) {
      alert("Position already exists in this department");
      return;
    }

    try {
      if (editId) {
        const res = await hrService.updatePosition(editId, {
          departmentId,
          positionName: cleanName,
        });
        if (res.data?.success) {
          alert("Position updated successfully");
          setPositions((prev) =>
            prev.map((item) => ((item._id || item.id) === editId ? res.data.data : item))
          );
        }
      } else {
        const res = await hrService.createPosition({
          departmentId,
          positionName: cleanName,
        });
        if (res.data?.success) {
          alert("Position added successfully");
          setPositions((prev) => [...prev, res.data.data]);
        }
      }

      resetForm();
      setShowForm(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save position");
    }
  };

  /* ===============================
     Edit Position
  =============================== */
  const handleEdit = (item) => {
    if (!item) return;
    const itemId = item._id || item.id;
    setEditId(itemId);
    setFormData({
      departmentId: item.departmentId?._id || item.departmentId || "",
      positionName: item.positionName,
    });
    setShowForm(true);
  };

  /* ===============================
     Delete Position
  =============================== */
  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      alert("Select position");
      return;
    }

    const ok = window.confirm(`Delete ${selectedIds.length} selected position(s)?`);
    if (!ok) return;

    try {
      for (const id of selectedIds) {
        await hrService.deletePosition(id);
      }
      setPositions((prev) =>
        prev.filter((item) => !selectedIds.includes(item._id || item.id))
      );
      setSelectedIds([]);
      alert("Position deleted successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete position");
    }
  };

  return (
    <div className="position-management-page">
      {/* Header */}
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => {
            if (showForm) {
              resetForm();
              setShowForm(false);
            } else {
              window.location.href = "/staff-control";
            }
          }}
        >
          ←
        </AppButton>

        <div>
          <h1>
            {showForm
              ? editId
                ? "Edit Position"
                : "Add Position"
              : "Position Management"}
          </h1>
          <p>Add and manage school staff positions</p>
        </div>
      </div>

      {/* List View */}
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
              + Add Position
            </AppButton>
          </div>

          <div className="common-card">
            <div className="list-header">
              <h2>Position List</h2>

              <div className="list-action-buttons">
                <AppButton
                  type="primary"
                  onClick={() => {
                    if (selectedIds.length !== 1) {
                      alert("Select one position");
                      return;
                    }
                    const selected = positions.find(
                      (item) => (item._id || item.id) === selectedIds[0]
                    );
                    handleEdit(selected);
                  }}
                >
                  Edit
                </AppButton>

                <AppButton type="delete" onClick={handleDelete}>
                  Delete
                </AppButton>
              </div>
            </div>

            {/* Table with Shimmer */}
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={
                          positions.length > 0 &&
                          selectedIds.length === positions.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(
                              positions.map((item) => item._id || item.id)
                            );
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                      />
                    </th>
                    <th>S.No</th>
                    <th>Department</th>
                    <th>Position Name</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="4" style={{ padding: "4px 0", border: "none" }}>
                        <SkeletonTable rows={4} columns={4} />
                      </td>
                    </tr>
                  ) : positions.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="empty-row">
                        No position found
                      </td>
                    </tr>
                  ) : (
                    positions.map((item, index) => {
                      const itemId = item._id || item.id;
                      const deptName =
                        item.departmentId?.departmentName ||
                        departments.find(
                          (d) => (d._id || d.id) === item.departmentId
                        )?.departmentName ||
                        "-";

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
                          <td>{deptName}</td>
                          <td>{item.positionName}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Form View */}
      {showForm && (
        <div className="common-card">
          <div className="position-form-grid">
            <div className="form-group">
              <label>Department *</label>
              <select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
              >
                <option value="">Select Department</option>
                {departments.map((dept) => {
                  const dId = dept._id || dept.id;
                  return (
                    <option key={dId} value={dId}>
                      {dept.departmentName}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-group">
              <label>Position Name *</label>
              <input
                name="positionName"
                value={formData.positionName}
                onChange={handleChange}
                placeholder="Enter position name"
              />
            </div>
          </div>

          <div className="form-actions">
            <AppButton type="primary" onClick={handleSave}>
              {editId ? "Update" : "Save"}
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

export default PositionManagement;