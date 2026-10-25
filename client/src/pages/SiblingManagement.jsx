import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./siblingManagement.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { studentHubService } from "../services/api";

function SiblingManagement() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [groups, setGroups] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewData, setViewData] = useState(null);
  const [editId, setEditId] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [guardianMobileFilter, setGuardianMobileFilter] = useState("");

  const [formData, setFormData] = useState({
    guardianName: "",
    guardianMobile: "",
    students: [],
  });

  const [studentForm, setStudentForm] = useState({
    studentId: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [grpRes, stuRes] = await Promise.all([
        studentHubService.getSiblingGroups(),
        studentHubService.searchStudents({}),
      ]);

      if (grpRes.data?.success) {
        setGroups(grpRes.data.data || []);
      }
      if (stuRes.data?.success) {
        setStudentsList(stuRes.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load sibling groups:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setFormData({
      guardianName: "",
      guardianMobile: "",
      students: [],
    });
    setStudentForm({ studentId: "" });
    setEditId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleAddStudentToGroup = () => {
    if (!studentForm.studentId) {
      alert("Please select a student");
      return;
    }

    const selectedStudent = studentsList.find(
      (item) => (item._id || item.id) === studentForm.studentId
    );

    if (!selectedStudent) return;

    const selectedId = selectedStudent._id || selectedStudent.id;

    const alreadyAdded = formData.students.some(
      (item) => (item.studentId || item._id || item.id) === selectedId
    );

    if (alreadyAdded) {
      alert("This student is already added in this group");
      return;
    }

    setFormData({
      ...formData,
      students: [
        ...formData.students,
        {
          studentId: selectedId,
          studentName: selectedStudent.studentName,
          admissionNo: selectedStudent.admissionNo || selectedStudent.srNo || "",
          className: selectedStudent.className,
          section: selectedStudent.section,
        },
      ],
    });

    setStudentForm({ studentId: "" });
  };

  const handleRemoveStudentFromForm = (idToRemove) => {
    setFormData({
      ...formData,
      students: formData.students.filter(
        (s) => (s.studentId || s._id || s.id) !== idToRemove
      ),
    });
  };

  const handleSave = async () => {
    if (!formData.guardianName || !formData.guardianMobile) {
      alert("Please enter Guardian Name and Guardian Mobile");
      return;
    }

    if (formData.students.length < 2) {
      const proceed = window.confirm(
        "A sibling group usually has at least 2 students. Do you want to save with current selection?"
      );
      if (!proceed) return;
    }

    try {
      setSaving(true);
      const payload = {
        guardianName: formData.guardianName,
        guardianMobile: formData.guardianMobile,
        guardianMobileNo: formData.guardianMobile,
        students: formData.students,
      };

      if (editId) {
        const res = await studentHubService.updateSiblingGroup(editId, payload);
        if (res.data?.success) {
          alert("Sibling group updated successfully");
          resetForm();
          setShowForm(false);
          loadData();
          setSelectedIds([]);
        }
      } else {
        const res = await studentHubService.createSiblingGroup(payload);
        if (res.data?.success) {
          alert("Sibling group created successfully");
          resetForm();
          setShowForm(false);
          loadData();
          setSelectedIds([]);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save sibling group");
    } finally {
      setSaving(false);
    }
  };

  const filteredGroups = groups.filter((item) => {
    const mob = item.guardianMobileNo || item.guardianMobile || "";
    const searchMatch = searchText.trim()
      ? item.guardianName?.toLowerCase().includes(searchText.toLowerCase()) ||
        mob.includes(searchText) ||
        item.students?.some((s) => s.studentName?.toLowerCase().includes(searchText.toLowerCase()))
      : true;

    const mobMatch = guardianMobileFilter.trim()
      ? mob.includes(guardianMobileFilter.trim())
      : true;

    return searchMatch && mobMatch;
  });

  const selectedGroups = groups.filter((item) =>
    selectedIds.includes(item._id || item.id)
  );
  const selectedSingle = selectedGroups.length === 1 ? selectedGroups[0] : null;

  const handleEdit = () => {
    if (!selectedSingle) {
      alert("Please select exactly one sibling group to edit");
      return;
    }

    setEditId(selectedSingle._id || selectedSingle.id);
    setFormData({
      guardianName: selectedSingle.guardianName,
      guardianMobile: selectedSingle.guardianMobileNo || selectedSingle.guardianMobile || "",
      students: selectedSingle.students || [],
    });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one sibling group to delete");
      return;
    }

    const ok = window.confirm(`Delete ${selectedIds.length} selected sibling group(s)?`);
    if (!ok) return;

    try {
      for (const id of selectedIds) {
        await studentHubService.deleteSiblingGroup(id);
      }
      alert("Sibling group(s) deleted successfully");
      setSelectedIds([]);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete sibling group");
    }
  };

  return (
    <div className="sibling-page">
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
          <h1>Sibling Management</h1>
          <p>Group siblings under a common parent/guardian for discount schemes and communication</p>
        </div>
      </div>

      {!showForm && (
        <>
          <div className="common-card">
            <div className="filter-grid">
              <div className="form-group">
                <label>Search</label>
                <input
                  type="text"
                  placeholder="Guardian name, mobile, or student name..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Guardian Mobile</label>
                <input
                  type="text"
                  placeholder="Filter by mobile number..."
                  value={guardianMobileFilter}
                  onChange={(e) => setGuardianMobileFilter(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="common-card">
            <div className="list-header">
              <h2>Sibling Groups ({filteredGroups.length})</h2>

              <div className="list-action-buttons">
                <AppButton type="primary" onClick={() => setShowForm(true)}>
                  + Add Sibling Group
                </AppButton>

                <AppButton
                  type="view"
                  onClick={() => {
                    if (!selectedSingle) {
                      alert("Please select one group to view");
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
                            filteredGroups.length > 0 &&
                            selectedIds.length === filteredGroups.length
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds(
                                filteredGroups.map((item) => item._id || item.id)
                              );
                            } else {
                              setSelectedIds([]);
                            }
                          }}
                        />
                      </th>
                      <th>S.No</th>
                      <th>Guardian Name</th>
                      <th>Guardian Mobile</th>
                      <th>Linked Siblings</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredGroups.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="empty-row">
                          {searchText || guardianMobileFilter
                            ? "No sibling groups match your filter"
                            : "No sibling groups available. Click '+ Add Sibling Group' to create one."}
                        </td>
                      </tr>
                    ) : (
                      filteredGroups.map((item, index) => {
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
                            <td><strong>{item.guardianName}</strong></td>
                            <td>{item.guardianMobileNo || item.guardianMobile}</td>
                            <td>
                              {item.students && item.students.length > 0 ? (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                  {item.students.map((s, i) => (
                                    <span
                                      key={i}
                                      style={{
                                        padding: "2px 8px",
                                        borderRadius: "6px",
                                        backgroundColor: "#f3f4f6",
                                        fontSize: "12px",
                                        border: "1px solid #e5e7eb",
                                      }}
                                    >
                                      {s.studentName} {s.className ? `(${s.className})` : ""}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span style={{ color: "#9ca3af" }}>0 students</span>
                              )}
                            </td>
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
              <label>Guardian Name *</label>
              <input
                type="text"
                name="guardianName"
                placeholder="Father or Guardian Name"
                value={formData.guardianName}
                onChange={handleChange}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Guardian Mobile *</label>
              <input
                type="text"
                name="guardianMobile"
                placeholder="10-digit mobile number"
                value={formData.guardianMobile}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ marginTop: "20px", borderTop: "1px solid #f3f4f6", paddingTop: "15px" }}>
            <h3>Link Students to this Sibling Group</h3>
            <div style={{ display: "flex", gap: "10px", marginTop: "10px", alignItems: "flex-end" }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Select Student to Link</label>
                <select
                  name="studentId"
                  value={studentForm.studentId}
                  onChange={(e) => setStudentForm({ studentId: e.target.value })}
                >
                  <option value="">— Choose Student —</option>
                  {studentsList.map((s) => (
                    <option key={s._id || s.id} value={s._id || s.id}>
                      {s.studentName} — {s.className} {s.section ? `(${s.section})` : ""} [{s.admissionNo || s.srNo}]
                    </option>
                  ))}
                </select>
              </div>

              <AppButton type="primary" onClick={handleAddStudentToGroup}>
                + Add to Group
              </AppButton>
            </div>

            {formData.students.length > 0 && (
              <div style={{ marginTop: "15px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                      <th style={{ padding: "8px" }}>Student Name</th>
                      <th style={{ padding: "8px" }}>Class</th>
                      <th style={{ padding: "8px" }}>Admission No</th>
                      <th style={{ padding: "8px", width: "80px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.students.map((st) => {
                      const sid = st.studentId || st._id || st.id;
                      return (
                        <tr key={sid} style={{ borderBottom: "1px solid #f3f4f6" }}>
                          <td style={{ padding: "8px" }}><strong>{st.studentName}</strong></td>
                          <td style={{ padding: "8px" }}>{st.className} {st.section ? `(${st.section})` : ""}</td>
                          <td style={{ padding: "8px" }}>{st.admissionNo || "—"}</td>
                          <td style={{ padding: "8px" }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveStudentFromForm(sid)}
                              style={{
                                color: "#ef4444",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontWeight: "600",
                              }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="form-actions" style={{ marginTop: "25px" }}>
            <AppButton type="primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editId ? "Update Group" : "Save Group"}
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
              <h2>Sibling Group Details</h2>
              <button
                className="popup-close-btn"
                onClick={() => setViewData(null)}
              >
                ×
              </button>
            </div>

            <div className="view-grid">
              <p>
                <strong>Guardian Name:</strong> {viewData.guardianName}
              </p>
              <p>
                <strong>Guardian Mobile:</strong> {viewData.guardianMobileNo || viewData.guardianMobile}
              </p>
              <div>
                <strong>Siblings in Group:</strong>
                <ul style={{ marginTop: "6px", paddingLeft: "20px" }}>
                  {viewData.students && viewData.students.length > 0 ? (
                    viewData.students.map((s, idx) => (
                      <li key={idx}>
                        {s.studentName} — {s.className} [{s.admissionNo || s.srNo || "—"}]
                      </li>
                    ))
                  ) : (
                    <li>No students linked</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SiblingManagement;