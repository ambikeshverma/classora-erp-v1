import React, { useState, useEffect } from "react";
import "./admissionEnquiries.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { admissionService } from "../services/api";

function AdmissionEnquiries() {
  const [sources, setSources] = useState(["Walk-in", "WhatsApp", "Facebook", "Instagram", "Reference", "Website"]);
  const [classOptions, setClassOptions] = useState([
    "Nursery", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
    "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"
  ]);
  const statuses = ["NEW", "FOLLOW-UP", "CLOSED", "CONVERTED"];

  const [selectedIds, setSelectedIds] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [enquiries, setEnquiries] = useState([]);
  const [editId, setEditId] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    studentName: "",
    mobileNumber: "",
    classInterested: "",
    fatherName: "",
    address: "",
    source: "Walk-in",
    status: "NEW",
    enquiryDate: new Date().toISOString().split("T")[0],
    remarks: "",
  });

  useEffect(() => {
    loadEnquiriesAndMeta();
  }, []);

  const loadEnquiriesAndMeta = async () => {
    try {
      setLoading(true);
      const [enqRes, metaRes] = await Promise.all([
        admissionService.getEnquiries(),
        admissionService.getMeta(),
      ]);

      if (enqRes.data?.data) {
        setEnquiries(
          enqRes.data.data.map((item) => ({
            id: item._id,
            ...item,
          }))
        );
      }

      if (metaRes.data?.data) {
        const { classes, enquirySources } = metaRes.data.data;
        if (classes && classes.length > 0) {
          setClassOptions(classes.map((c) => c.className));
        }
        if (enquirySources && enquirySources.length > 0) {
          setSources(enquirySources);
        }
      }
    } catch (err) {
      console.error("Failed to load enquiries", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      studentName: "",
      mobileNumber: "",
      classInterested: "",
      fatherName: "",
      address: "",
      source: "Walk-in",
      status: "NEW",
      enquiryDate: new Date().toISOString().split("T")[0],
      remarks: "",
    });
    setEditId(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!formData.studentName.trim() || !formData.mobileNumber.trim() || !formData.classInterested || !formData.source) {
      alert("Please fill all required fields marked with *");
      return;
    }

    try {
      setSaving(true);
      if (editId) {
        await admissionService.updateEnquiry(editId, formData);
        alert("Enquiry updated successfully");
      } else {
        await admissionService.createEnquiry(formData);
        alert("Enquiry added successfully");
      }
      resetForm();
      setShowForm(false);
      loadEnquiriesAndMeta();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save enquiry");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditId(item.id);
    setFormData({
      studentName: item.studentName || "",
      mobileNumber: item.mobileNumber || "",
      classInterested: item.classInterested || "",
      fatherName: item.fatherName || "",
      address: item.address || "",
      source: item.source || "Walk-in",
      status: item.status || "NEW",
      enquiryDate: item.enquiryDate || new Date().toISOString().split("T")[0],
      remarks: item.remarks || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this enquiry?");
    if (!ok) return;

    try {
      setSaving(true);
      await admissionService.deleteEnquiry(id);
      setSelectedIds([]);
      alert("Enquiry deleted successfully");
      loadEnquiriesAndMeta();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete enquiry");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await admissionService.updateEnquiryStatus(id, newStatus);
      setEnquiries((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  const activeEnquiries = enquiries.filter(
    (item) => item.status !== "CLOSED" && item.status !== "CONVERTED"
  );

  return (
    <div className="enquiry-management-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => {
            if (showForm) {
              resetForm();
              setShowForm(false);
            } else {
              window.location.href = "/admissions";
            }
          }}
        >
          ←
        </AppButton>

        <div>
          <h1>{showForm ? "Add / Edit Enquiry" : "Admission Enquiries"}</h1>
          <p>Manage student admission enquiries</p>
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
              + New Enquiry
            </AppButton>
          </div>

          <div className="common-card">
            <div className="list-header">
              <h2>Active Enquiry List ({activeEnquiries.length})</h2>

              <div className="list-action-buttons">
                <AppButton
                  type="view"
                  disabled={selectedIds.length !== 1 || loading}
                  onClick={() => {
                    if (selectedIds.length !== 1) {
                      alert("Select one enquiry");
                      return;
                    }
                    const selected = enquiries.find((item) => item.id === selectedIds[0]);
                    setViewData(selected);
                  }}
                >
                  View
                </AppButton>

                <AppButton
                  type="edit"
                  disabled={selectedIds.length !== 1 || loading}
                  onClick={() => {
                    if (selectedIds.length !== 1) {
                      alert("Select one enquiry");
                      return;
                    }
                    const selected = enquiries.find((item) => item.id === selectedIds[0]);
                    handleEdit(selected);
                  }}
                >
                  Edit
                </AppButton>

                <AppButton
                  type="delete"
                  disabled={selectedIds.length === 0 || loading}
                  onClick={() => {
                    if (selectedIds.length === 0) {
                      alert("Select enquiry");
                      return;
                    }
                    handleDelete(selectedIds[0]);
                  }}
                >
                  Delete
                </AppButton>
              </div>
            </div>

            {loading ? (
              <SkeletonTable rows={5} columns={6} />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={
                            activeEnquiries.length > 0 &&
                            selectedIds.length === activeEnquiries.length
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds(activeEnquiries.map((item) => item.id));
                            } else {
                              setSelectedIds([]);
                            }
                          }}
                        />
                      </th>
                      <th>S.No</th>
                      <th>Enquiry No</th>
                      <th>Student</th>
                      <th>Mobile</th>
                      <th>Class</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {activeEnquiries.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="empty-row">
                          No active enquiry found
                        </td>
                      </tr>
                    ) : (
                      activeEnquiries.map((item, index) => (
                        <tr key={item.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(item.id)}
                              onChange={() => {
                                setSelectedIds((prev) =>
                                  prev.includes(item.id)
                                    ? prev.filter((id) => id !== item.id)
                                    : [...prev, item.id]
                                );
                              }}
                            />
                          </td>
                          <td>{index + 1}</td>
                          <td>
                            <strong>{item.enquiryNo || "-"}</strong>
                          </td>
                          <td>{item.studentName}</td>
                          <td>{item.mobileNumber}</td>
                          <td>{item.classInterested}</td>
                          <td>
                            <select
                              value={item.status}
                              className={`status-badge status-${item.status.toLowerCase()}`}
                              style={{ border: "none", cursor: "pointer", background: "transparent" }}
                              onChange={(e) => handleStatusUpdate(item.id, e.target.value)}
                            >
                              {statuses.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>{item.enquiryDate}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {showForm && (
        <div className="common-card">
          <div className="enquiry-form-grid">
            <div className="form-group">
              <label>Student Name *</label>
              <input
                type="text"
                name="studentName"
                placeholder="Enter student name"
                value={formData.studentName}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label>Mobile Number *</label>
              <input
                type="tel"
                name="mobileNumber"
                placeholder="Enter 10-digit mobile number"
                value={formData.mobileNumber}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label>Class Interested *</label>
              <select
                name="classInterested"
                value={formData.classInterested}
                onChange={handleChange}
                disabled={saving}
              >
                <option value="">Select Class</option>
                {classOptions.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Father's Name</label>
              <input
                type="text"
                name="fatherName"
                placeholder="Enter father's name"
                value={formData.fatherName}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label>Enquiry Source *</label>
              <select
                name="source"
                value={formData.source}
                onChange={handleChange}
                disabled={saving}
              >
                {sources.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={saving}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Enquiry Date</label>
              <input
                type="date"
                name="enquiryDate"
                value={formData.enquiryDate}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div className="form-group full-width">
              <label>Address</label>
              <input
                type="text"
                name="address"
                placeholder="Enter local address / locality"
                value={formData.address}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div className="form-group full-width">
              <label>Remarks</label>
              <textarea
                name="remarks"
                rows="3"
                placeholder="Any special remarks or follow-up notes"
                value={formData.remarks}
                onChange={handleChange}
                disabled={saving}
              />
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
            <AppButton type="primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editId ? "Update Enquiry" : "Save Enquiry"}
            </AppButton>
            <AppButton
              type="secondary"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              disabled={saving}
            >
              Cancel
            </AppButton>
          </div>
        </div>
      )}

      {viewData && (
        <div className="popup-overlay">
          <div className="view-popup">
            <div className="popup-head">
              <h2>Enquiry Details</h2>
              <button
                className="popup-close-btn"
                onClick={() => setViewData(null)}
              >
                ×
              </button>
            </div>

            <div className="view-grid">
              <div className="view-item">
                <span className="view-label">Enquiry No:</span>
                <span className="view-value">{viewData.enquiryNo}</span>
              </div>
              <div className="view-item">
                <span className="view-label">Student Name:</span>
                <span className="view-value">{viewData.studentName}</span>
              </div>
              <div className="view-item">
                <span className="view-label">Mobile Number:</span>
                <span className="view-value">{viewData.mobileNumber}</span>
              </div>
              <div className="view-item">
                <span className="view-label">Class Interested:</span>
                <span className="view-value">{viewData.classInterested}</span>
              </div>
              <div className="view-item">
                <span className="view-label">Father's Name:</span>
                <span className="view-value">{viewData.fatherName || "-"}</span>
              </div>
              <div className="view-item">
                <span className="view-label">Source:</span>
                <span className="view-value">{viewData.source}</span>
              </div>
              <div className="view-item">
                <span className="view-label">Status:</span>
                <span className="view-value">{viewData.status}</span>
              </div>
              <div className="view-item">
                <span className="view-label">Date:</span>
                <span className="view-value">{viewData.enquiryDate}</span>
              </div>
              <div className="view-item full-width">
                <span className="view-label">Address:</span>
                <span className="view-value">{viewData.address || "-"}</span>
              </div>
              <div className="view-item full-width">
                <span className="view-label">Remarks:</span>
                <span className="view-value">{viewData.remarks || "-"}</span>
              </div>
            </div>

            <div className="popup-actions" style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
              <AppButton type="secondary" onClick={() => setViewData(null)}>
                Close
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdmissionEnquiries;