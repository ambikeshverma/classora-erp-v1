import React, { useState, useEffect } from "react";
import "./departmentManagement.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { hrService } from "../services/api";

function DepartmentManagement() {
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editId, setEditId] = useState(null);
  const [departments, setDepartments] = useState([]);

  const [formData, setFormData] = useState({
    departmentName: "",
  });

  /* ===============================
     Fetch Departments (Optimized: once on mount)
  =============================== */
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await hrService.getDepartments();
      if (res.data?.success) {
        setDepartments(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load departments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  /* ===============================
     Reset Form
  =============================== */
  const resetForm = () => {
    setFormData({
      departmentName: "",
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
     Save Department (Create / Update)
  =============================== */
  const handleSave = async () => {
    const name = formData.departmentName.trim();
    if (!name) {
      alert("Please enter department name");
      return;
    }

    const alreadyExists = departments.some(
      (item) =>
        item.departmentName.toLowerCase().trim() === name.toLowerCase() &&
        (item._id || item.id) !== editId
    );

    if (alreadyExists) {
      alert("Department already exists");
      return;
    }

    try {
      if (editId) {
        const res = await hrService.updateDepartment(editId, { departmentName: name });
        if (res.data?.success) {
          alert("Department updated successfully");
          setDepartments((prev) =>
            prev.map((item) => ((item._id || item.id) === editId ? res.data.data : item))
          );
        }
      } else {
        const res = await hrService.createDepartment({ departmentName: name });
        if (res.data?.success) {
          alert("Department added successfully");
          setDepartments((prev) => [...prev, res.data.data]);
        }
      }

      resetForm();
      setShowForm(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save department");
    }
  };

  /* ===============================
     Edit Department
  =============================== */
  const handleEdit = (item) => {
    if (!item) return;
    const itemId = item._id || item.id;
    setEditId(itemId);
    setFormData({
      departmentName: item.departmentName,
    });
    setShowForm(true);
  };

  /* ===============================
     Delete Department
  =============================== */
  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      alert("Select department");
      return;
    }

    const ok = window.confirm(`Delete ${selectedIds.length} selected department(s)?`);
    if (!ok) return;

    try {
      for (const id of selectedIds) {
        await hrService.deleteDepartment(id);
      }
      setDepartments((prev) =>
        prev.filter((item) => !selectedIds.includes(item._id || item.id))
      );
      setSelectedIds([]);
      alert("Department deleted successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete department");
    }
  };

  return (
    <div className="department-management-page">
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
                ? "Edit Department"
                : "Add Department"
              : "Department Management"}
          </h1>
          <p>Add and manage school departments</p>
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
              + Add Department
            </AppButton>
          </div>

          <div className="common-card">
            <div className="list-header">
              <h2>Department List</h2>

              <div className="list-action-buttons">
                <AppButton
                  type="primary"
                  onClick={() => {
                    if (selectedIds.length !== 1) {
                      alert("Select one department");
                      return;
                    }
                    const selected = departments.find(
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
                          departments.length > 0 &&
                          selectedIds.length === departments.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(
                              departments.map((item) => item._id || item.id)
                            );
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                      />
                    </th>
                    <th>S.No</th>
                    <th>Department Name</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="3" style={{ padding: "4px 0", border: "none" }}>
                        <SkeletonTable rows={4} columns={3} />
                      </td>
                    </tr>
                  ) : departments.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="empty-row">
                        No department found
                      </td>
                    </tr>
                  ) : (
                    departments.map((item, index) => {
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
                          <td>{item.departmentName}</td>
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
          <div className="department-form-grid">
            <div className="form-group">
              <label>Department Name *</label>
              <input
                name="departmentName"
                value={formData.departmentName}
                onChange={handleChange}
                placeholder="Enter department name"
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

export default DepartmentManagement;