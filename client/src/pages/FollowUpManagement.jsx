import React, { useState, useEffect, useCallback } from "react";
import "./followUpManagement.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { receptionService } from "../services/api";

const followUpTypes = ["Call", "WhatsApp", "Visit", "SMS", "Meeting"];
const followUpStatuses = ["Interested", "Call Back Later", "No Response", "Not Interested", "Admission Confirmed"];

function FollowUpManagement() {
  const [showForm, setShowForm] = useState(false);
  const [followUps, setFollowUps] = useState([]);
  const [activeEnquiries, setActiveEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [toast, setToast] = useState("");

  const [formData, setFormData] = useState({
    enquiryId: "",
    studentName: "",
    mobileNumber: "",
    classInterested: "",
    followUpDate: new Date().toISOString().split("T")[0],
    followUpType: "",
    discussionNotes: "",
    nextFollowUpDate: "",
    followUpStatus: "Interested",
  });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [fuRes, metaRes] = await Promise.all([
        receptionService.getFollowUps(),
        receptionService.getMeta(),
      ]);
      setFollowUps(fuRes.data?.data || []);
      setActiveEnquiries(metaRes.data?.data?.activeEnquiries || []);
    } catch {
      showToast("Failed to load follow-up data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetForm = () => {
    setFormData({
      enquiryId: "", studentName: "", mobileNumber: "", classInterested: "",
      followUpDate: new Date().toISOString().split("T")[0],
      followUpType: "", discussionNotes: "", nextFollowUpDate: "", followUpStatus: "Interested",
    });
    setEditId(null);
  };

  const handleEnquirySelect = (e) => {
    const enq = activeEnquiries.find((item) => String(item._id) === String(e.target.value));
    if (!enq) { resetForm(); return; }
    setFormData((prev) => ({
      ...prev,
      enquiryId: enq._id,
      studentName: enq.studentName,
      mobileNumber: enq.mobileNumber,
      classInterested: enq.classInterested,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.enquiryId || !formData.followUpDate || !formData.followUpType || !formData.followUpStatus) {
      showToast("Please fill all required fields");
      return;
    }
    if (["Interested", "Call Back Later", "No Response"].includes(formData.followUpStatus) && !formData.nextFollowUpDate) {
      showToast("Please select next follow-up date");
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await receptionService.updateFollowUp(editId, formData);
        showToast("Follow-up updated successfully");
      } else {
        await receptionService.createFollowUp(formData);
        showToast(formData.followUpStatus === "Admission Confirmed" ? "Admission confirmed successfully" : "Follow-up saved successfully");
      }
      resetForm();
      setShowForm(false);
      setSelectedIds([]);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save follow-up");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditId(item._id);
    setFormData({
      enquiryId: item.enquiryId,
      studentName: item.studentName,
      mobileNumber: item.mobileNumber,
      classInterested: item.classInterested,
      followUpDate: item.followUpDate,
      followUpType: item.followUpType,
      discussionNotes: item.discussionNotes || "",
      nextFollowUpDate: item.nextFollowUpDate || "",
      followUpStatus: item.followUpStatus,
    });
    setShowForm(true);
  };

  const handleDelete = async (ids) => {
    if (!window.confirm("Delete selected follow-up(s)?")) return;
    try {
      await Promise.all(ids.map((id) => receptionService.deleteFollowUp(id)));
      showToast("Follow-up(s) deleted successfully");
      setSelectedIds([]);
      fetchData();
    } catch {
      showToast("Failed to delete follow-up");
    }
  };

  const selectedSingle = followUps.filter((item) => selectedIds.includes(item._id));
  const singleItem = selectedSingle.length === 1 ? selectedSingle[0] : null;

  return (
    <div className="follow-up-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => {
            if (showForm) { resetForm(); setShowForm(false); }
            else window.location.href = "/reception-desk";
          }}
        >
          ←
        </AppButton>
        <div>
          <h1>{showForm ? "Add / Edit Follow-up" : "Follow-up Management"}</h1>
          <p>Manage enquiry follow-ups and admission conversion</p>
        </div>
      </div>

      {!showForm && (
        <div className="common-card">
          <div className="list-header">
            <h2>Follow-up List</h2>
            <div className="list-action-buttons">
              <AppButton type="primary" onClick={() => { resetForm(); setShowForm(true); }}>
                + Add Follow-up
              </AppButton>
              <AppButton type="view" onClick={() => { if (!singleItem) { showToast("Select one follow-up to view"); return; } setViewData(singleItem); }}>
                View
              </AppButton>
              <AppButton type="primary" onClick={() => { if (!singleItem) { showToast("Select one follow-up to edit"); return; } handleEdit(singleItem); }}>
                Edit
              </AppButton>
              <AppButton type="delete" onClick={() => { if (selectedIds.length === 0) { showToast("Select follow-up(s) to delete"); return; } handleDelete(selectedIds); }}>
                Delete
              </AppButton>
            </div>
          </div>

          <div className="table-wrap">
            {loading ? (
              <SkeletonTable columns={7} rows={5} />
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={followUps.length > 0 && selectedIds.length === followUps.length}
                        onChange={(e) => setSelectedIds(e.target.checked ? followUps.map((f) => f._id) : [])}
                      />
                    </th>
                    <th>S.No</th>
                    <th>Student</th>
                    <th>Mobile</th>
                    <th>Class</th>
                    <th>Status</th>
                    <th>Next Date</th>
                  </tr>
                </thead>
                <tbody>
                  {followUps.length === 0 ? (
                    <tr><td colSpan="7" className="empty-row">No follow-up found</td></tr>
                  ) : (
                    followUps.map((item, index) => (
                      <tr key={item._id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item._id)}
                            onChange={() =>
                              setSelectedIds((prev) =>
                                prev.includes(item._id)
                                  ? prev.filter((id) => id !== item._id)
                                  : [...prev, item._id]
                              )
                            }
                          />
                        </td>
                        <td>{index + 1}</td>
                        <td>{item.studentName}</td>
                        <td>{item.mobileNumber}</td>
                        <td>{item.classInterested}</td>
                        <td>{item.followUpStatus}</td>
                        <td>{item.nextFollowUpDate || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <div className="common-card">
          <div className="enquiry-form-grid">
            <div className="form-group">
              <label>Select Enquiry *</label>
              <select value={formData.enquiryId} onChange={handleEnquirySelect} disabled={!!editId}>
                <option value="">Select Enquiry</option>
                {activeEnquiries.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.studentName} - {item.classInterested}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Student Name</label>
              <input value={formData.studentName} readOnly />
            </div>
            <div className="form-group">
              <label>Mobile Number</label>
              <input value={formData.mobileNumber} readOnly />
            </div>
            <div className="form-group">
              <label>Class</label>
              <input value={formData.classInterested} readOnly />
            </div>
            <div className="form-group">
              <label>Follow-up Date *</label>
              <input type="date" name="followUpDate" value={formData.followUpDate} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Follow-up Type *</label>
              <select name="followUpType" value={formData.followUpType} onChange={handleChange}>
                <option value="">Select Type</option>
                {followUpTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Next Follow-up Date</label>
              <input type="date" name="nextFollowUpDate" value={formData.nextFollowUpDate} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Follow-up Status *</label>
              <select name="followUpStatus" value={formData.followUpStatus} onChange={handleChange}>
                {followUpStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <div className="form-group full-width">
              <label>Discussion Notes</label>
              <textarea name="discussionNotes" value={formData.discussionNotes} onChange={handleChange} />
            </div>
          </div>

          <div className="form-actions">
            <AppButton type="primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editId ? "Update" : "Save"}
            </AppButton>
            <AppButton type="secondary" onClick={() => { resetForm(); setShowForm(false); }}>
              Go Back
            </AppButton>
          </div>
        </div>
      )}

      {viewData && (
        <div className="popup-overlay">
          <div className="view-popup">
            <div className="popup-head">
              <h2>Follow-up Details</h2>
              <button className="popup-close-btn" onClick={() => setViewData(null)}>×</button>
            </div>
            <div className="view-grid">
              <p><strong>Student:</strong> {viewData.studentName}</p>
              <p><strong>Mobile:</strong> {viewData.mobileNumber}</p>
              <p><strong>Class:</strong> {viewData.classInterested}</p>
              <p><strong>Follow-up Date:</strong> {viewData.followUpDate}</p>
              <p><strong>Follow-up Type:</strong> {viewData.followUpType}</p>
              <p><strong>Next Follow-up:</strong> {viewData.nextFollowUpDate || "-"}</p>
              <p><strong>Status:</strong> {viewData.followUpStatus}</p>
              <p><strong>Discussion Notes:</strong> {viewData.discussionNotes || "-"}</p>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="submodule-toast-banner">{toast}</div>}
    </div>
  );
}

export default FollowUpManagement;

