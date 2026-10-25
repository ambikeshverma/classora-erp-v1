import React, { useState, useEffect, useCallback } from "react";
import "./supportComplaint.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { receptionService } from "../services/api";

const complaintStatuses = ["Open", "In Progress", "Resolved", "Closed", "Rejected"];
const complaintCategories = ["Fee Issue", "Transport", "Teacher Behaviour", "Academic", "App/ERP Issue", "Examination", "Result", "Admission", "Discipline", "Other"];
const priorities = ["Low", "Medium", "High", "Urgent"];

function SupportComplaint() {
  const [showForm, setShowForm] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewData, setViewData] = useState(null);
  const [toast, setToast] = useState("");

  const [complaintDate, setComplaintDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [searchText, setSearchText] = useState("");
  const [isSearched, setIsSearched] = useState(false);

  const [formData, setFormData] = useState({
    guardianName: "", studentName: "", className: "", mobile: "",
    category: "", priority: "Medium", department: "", assignedUser: "",
    complaintDate: new Date().toISOString().split("T")[0],
    complaintDetails: "", remarks: "", status: "Open",
  });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fetchMeta = useCallback(async () => {
    try {
      const res = await receptionService.getMeta();
      setDepartments(res.data?.data?.departments || []);
      setStaff(res.data?.data?.staff || []);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { fetchMeta(); }, [fetchMeta]);

  const fetchComplaints = useCallback(async () => {
    if (!isSearched) return;
    setLoading(true);
    try {
      const params = {};
      if (complaintDate) params.complaintDate = complaintDate;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (searchText) params.search = searchText;
      const res = await receptionService.getComplaints(params);
      setComplaints(res.data?.data || []);
    } catch {
      showToast("Failed to load complaints");
    } finally {
      setLoading(false);
    }
  }, [complaintDate, statusFilter, priorityFilter, searchText, isSearched]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const handleSearch = () => { setIsSearched(true); fetchComplaints(); setSelectedIds([]); };

  const resetForm = () => {
    setFormData({
      guardianName: "", studentName: "", className: "", mobile: "",
      category: "", priority: "Medium", department: "", assignedUser: "",
      complaintDate: new Date().toISOString().split("T")[0],
      complaintDetails: "", remarks: "", status: "Open",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "department" ? { assignedUser: "" } : {}),
    }));
  };

  const filteredStaff = staff.filter((s) => {
    const dept = departments.find((d) => d.departmentName === formData.department);
    return dept ? String(s.departmentId) === String(dept._id) : false;
  });

  const handleSave = async () => {
    if (!formData.guardianName || !formData.studentName || !formData.mobile || !formData.category || !formData.complaintDetails) {
      showToast("Please fill all required fields");
      return;
    }
    setSaving(true);
    try {
      await receptionService.createComplaint(formData);
      showToast("Complaint created successfully");
      resetForm();
      setShowForm(false);
      setIsSearched(true);
      fetchComplaints();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create complaint");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (status) => {
    if (!singleItem) { showToast("Select one complaint"); return; }
    try {
      await receptionService.updateComplaintStatus(singleItem._id, { status });
      showToast(`Complaint ${status.toLowerCase()} successfully`);
      setSelectedIds([]);
      fetchComplaints();
    } catch {
      showToast("Failed to update complaint status");
    }
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) { showToast("Select complaint(s) to delete"); return; }
    if (!window.confirm("Delete selected complaint(s)?")) return;
    try {
      await Promise.all(selectedIds.map((id) => receptionService.deleteComplaint(id)));
      showToast("Complaint(s) deleted successfully");
      setSelectedIds([]);
      fetchComplaints();
    } catch {
      showToast("Failed to delete complaint");
    }
  };

  const selectedList = complaints.filter((c) => selectedIds.includes(c._id));
  const singleItem = selectedList.length === 1 ? selectedList[0] : null;

  return (
    <div className="support-page">
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
          <h1>Support & Complaint</h1>
          <p>Manage guardian complaints and support tickets</p>
        </div>
      </div>

      {!showForm && (
        <>
          <div className="common-card">
            <div className="filter-grid">
              <div className="form-group">
                <label>Complaint Date</label>
                <input type="date" value={complaintDate} onChange={(e) => setComplaintDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All</option>
                  {complaintStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                  <option value="">All</option>
                  {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Search</label>
                <input type="text" placeholder="Name, mobile or complaint ID" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
              </div>
            </div>
            <div className="search-btn-row">
              <AppButton type="primary" onClick={handleSearch}>Search</AppButton>
            </div>
          </div>

          <div className="common-card">
            <div className="list-header">
              <h2>Complaint List</h2>
              <div className="list-action-buttons">
                <AppButton type="primary" onClick={() => { resetForm(); setShowForm(true); }}>
                  + Add Complaint
                </AppButton>
                <AppButton type="view" onClick={() => { if (!singleItem) { showToast("Select one complaint to view"); return; } setViewData(singleItem); }}>
                  View
                </AppButton>
                {singleItem?.status === "Open" && (
                  <AppButton type="primary" onClick={() => handleStatusUpdate("In Progress")}>Assign</AppButton>
                )}
                {singleItem?.status === "In Progress" && (
                  <AppButton type="primary" onClick={() => handleStatusUpdate("Resolved")}>Resolve</AppButton>
                )}
                {singleItem?.status === "Resolved" && (
                  <AppButton type="primary" onClick={() => handleStatusUpdate("Closed")}>Close</AppButton>
                )}
                {singleItem?.status === "Closed" && (
                  <AppButton type="primary" onClick={() => handleStatusUpdate("Open")}>Reopen</AppButton>
                )}
                <AppButton type="delete" onClick={handleDelete}>Delete</AppButton>
              </div>
            </div>

            <div className="table-wrap">
              {!isSearched ? (
                <table><tbody><tr><td colSpan="10" className="empty-row">Click Search to view complaints</td></tr></tbody></table>
              ) : loading ? (
                <SkeletonTable columns={10} rows={5} />
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={complaints.length > 0 && selectedIds.length === complaints.length}
                          onChange={(e) => setSelectedIds(e.target.checked ? complaints.map((c) => c._id) : [])}
                        />
                      </th>
                      <th>S.No</th>
                      <th>Complaint ID</th>
                      <th>Guardian</th>
                      <th>Student</th>
                      <th>Mobile</th>
                      <th>Category</th>
                      <th>Priority</th>
                      <th>Assigned User</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.length === 0 ? (
                      <tr><td colSpan="10" className="empty-row">No complaint found</td></tr>
                    ) : (
                      complaints.map((item, index) => (
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
                          <td>{item.complaintId}</td>
                          <td>{item.guardianName}</td>
                          <td>{item.studentName}</td>
                          <td>{item.mobile}</td>
                          <td>{item.category}</td>
                          <td>{item.priority}</td>
                          <td>{item.assignedUser || "-"}</td>
                          <td>{item.status}</td>
                        </tr>
                      ))
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
              <input type="text" name="guardianName" value={formData.guardianName} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Student Name *</label>
              <input type="text" name="studentName" value={formData.studentName} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Class</label>
              <input type="text" name="className" value={formData.className} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Mobile *</label>
              <input type="text" name="mobile" value={formData.mobile} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Category *</label>
              <select name="category" value={formData.category} onChange={handleChange}>
                <option value="">Select Category</option>
                {complaintCategories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select name="priority" value={formData.priority} onChange={handleChange}>
                {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Department</label>
              <select name="department" value={formData.department} onChange={handleChange}>
                <option value="">Select Department</option>
                {departments.map((d) => <option key={d._id} value={d.departmentName}>{d.departmentName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Assigned User</label>
              <select name="assignedUser" value={formData.assignedUser} onChange={handleChange} disabled={!formData.department}>
                <option value="">Select User</option>
                {filteredStaff.map((s) => <option key={s._id} value={s.fullName}>{s.fullName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Complaint Date</label>
              <input type="date" name="complaintDate" value={formData.complaintDate} onChange={handleChange} />
            </div>
            <div className="form-group full-width">
              <label>Complaint Details *</label>
              <textarea name="complaintDetails" value={formData.complaintDetails} onChange={handleChange} />
            </div>
            <div className="form-group full-width">
              <label>Remarks</label>
              <textarea name="remarks" value={formData.remarks} onChange={handleChange} />
            </div>
          </div>
          <div className="form-actions">
            <AppButton type="primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </AppButton>
            <AppButton type="secondary" onClick={() => { resetForm(); setShowForm(false); }}>Go Back</AppButton>
          </div>
        </div>
      )}

      {viewData && (
        <div className="popup-overlay">
          <div className="view-popup">
            <div className="popup-head">
              <h2>Complaint Details</h2>
              <button className="popup-close-btn" onClick={() => setViewData(null)}>×</button>
            </div>
            <div className="view-grid">
              <p><strong>Complaint ID:</strong> {viewData.complaintId}</p>
              <p><strong>Guardian:</strong> {viewData.guardianName}</p>
              <p><strong>Student:</strong> {viewData.studentName}</p>
              <p><strong>Class:</strong> {viewData.className || "-"}</p>
              <p><strong>Mobile:</strong> {viewData.mobile}</p>
              <p><strong>Category:</strong> {viewData.category}</p>
              <p><strong>Priority:</strong> {viewData.priority}</p>
              <p><strong>Department:</strong> {viewData.department || "-"}</p>
              <p><strong>Assigned User:</strong> {viewData.assignedUser || "-"}</p>
              <p><strong>Date:</strong> {viewData.complaintDate}</p>
              <p><strong>Resolution Date:</strong> {viewData.resolutionDate || "-"}</p>
              <p><strong>Status:</strong> {viewData.status}</p>
              <p className="full-width"><strong>Complaint Details:</strong> {viewData.complaintDetails}</p>
              <p className="full-width"><strong>Remarks:</strong> {viewData.remarks || "-"}</p>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="submodule-toast-banner">{toast}</div>}
    </div>
  );
}

export default SupportComplaint;

