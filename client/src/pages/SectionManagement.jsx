import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./sectionManagement.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { studentHubService } from "../services/api";

function SectionManagement() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewData, setViewData] = useState(null);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [classFilter, setClassFilter] = useState("");

  const [formData, setFormData] = useState({
    className: "",
    sectionName: "",
    capacity: 40,
    status: "Active",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [clsRes, secRes] = await Promise.all([
        studentHubService.getClasses(),
        studentHubService.getSections(),
      ]);

      if (clsRes.data?.success) {
        setClasses(clsRes.data.data || []);
      }
      if (secRes.data?.success) {
        setSections(secRes.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load sections data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setFormData({
      className: "",
      sectionName: "",
      capacity: 40,
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
    if (!formData.className || !formData.sectionName) {
      alert("Please select Class and enter Section Name");
      return;
    }

    try {
      setSaving(true);
      const selectedClassObj = classes.find((c) => c.className === formData.className);
      const payload = {
        ...formData,
        classId: selectedClassObj?._id || null,
      };

      if (editId) {
        const res = await studentHubService.updateSection(editId, payload);
        if (res.data?.success) {
          alert("Section updated successfully");
          resetForm();
          setShowForm(false);
          loadData();
          setSelectedIds([]);
        }
      } else {
        const res = await studentHubService.createSection(payload);
        if (res.data?.success) {
          alert("Section added successfully");
          resetForm();
          setShowForm(false);
          loadData();
          setSelectedIds([]);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save section");
    } finally {
      setSaving(false);
    }
  };

  const filteredSections = sections.filter((item) => {
    const classMatch = classFilter ? item.className === classFilter : true;
    const searchMatch = searchText.trim()
      ? item.sectionName?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.className?.toLowerCase().includes(searchText.toLowerCase())
      : true;
    return classMatch && searchMatch;
  });

  const selectedSections = sections.filter((item) =>
    selectedIds.includes(item._id || item.id)
  );
  const selectedSingle = selectedSections.length === 1 ? selectedSections[0] : null;

  const handleEdit = () => {
    if (!selectedSingle) {
      alert("Please select exactly one section to edit");
      return;
    }

    setEditId(selectedSingle._id || selectedSingle.id);
    setFormData({
      className: selectedSingle.className,
      sectionName: selectedSingle.sectionName,
      capacity: selectedSingle.capacity || 40,
      status: selectedSingle.status || (selectedSingle.isActive ? "Active" : "Inactive"),
    });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one section to delete");
      return;
    }

    const ok = window.confirm(`Delete ${selectedIds.length} selected section(s)?`);
    if (!ok) return;

    try {
      for (const id of selectedIds) {
        await studentHubService.deleteSection(id);
      }
      alert("Section(s) deleted successfully");
      setSelectedIds([]);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete section");
    }
  };

  return (
    <div className="section-page">
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
          <h1>Section Management</h1>
          <p>Manage and map class sections</p>
        </div>
      </div>

      {!showForm && (
        <>
          <div className="common-card">
            <div className="filter-grid">
              <div className="form-group">
                <label>Filter by Class</label>
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                >
                  <option value="">All Classes</option>
                  {classes.map((item) => (
                    <option key={item._id || item.className} value={item.className}>
                      {item.className}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Search</label>
                <input
                  type="text"
                  placeholder="Filter by section or class name..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="common-card">
            <div className="list-header">
              <h2>Section List ({filteredSections.length})</h2>

              <div className="list-action-buttons">
                <AppButton type="primary" onClick={() => setShowForm(true)}>
                  + Add Section
                </AppButton>

                <AppButton
                  type="view"
                  onClick={() => {
                    if (!selectedSingle) {
                      alert("Please select one section to view");
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
                            filteredSections.length > 0 &&
                            selectedIds.length === filteredSections.length
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds(
                                filteredSections.map((item) => item._id || item.id)
                              );
                            } else {
                              setSelectedIds([]);
                            }
                          }}
                        />
                      </th>
                      <th>S.No</th>
                      <th>Class</th>
                      <th>Section</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredSections.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="empty-row">
                          {classes.length === 0
                            ? "No classes found. Please add classes in Class Management first."
                            : searchText || classFilter
                            ? "No section found matching your search filter"
                            : "No sections available. Click '+ Add Section' to create one."}
                        </td>
                      </tr>
                    ) : (
                      filteredSections.map((item, index) => {
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
                            <td><span className="badge-code">Section {item.sectionName}</span></td>
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
              <label>Class *</label>
              <select
                name="className"
                value={formData.className}
                onChange={handleChange}
                autoFocus
              >
                <option value="">Select Class</option>
                {classes.map((item) => (
                  <option key={item._id || item.className} value={item.className}>
                    {item.className}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Section Name *</label>
              <input
                type="text"
                name="sectionName"
                placeholder="Example: A, B, Rose, Lotus"
                value={formData.sectionName}
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
              <h2>Section Details</h2>
              <button
                className="popup-close-btn"
                onClick={() => setViewData(null)}
              >
                ×
              </button>
            </div>

            <div className="view-grid">
              <p>
                <strong>Class:</strong> {viewData.className}
              </p>
              <p>
                <strong>Section:</strong> {viewData.sectionName}
              </p>
              <p>
                <strong>Capacity:</strong> {viewData.capacity || "Not specified"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SectionManagement;