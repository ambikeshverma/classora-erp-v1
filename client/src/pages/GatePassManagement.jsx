import React, { useState, useEffect, useCallback } from "react";
import "./visitorManagement.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { receptionService } from "../services/api";

const visitorStatuses = ["Waiting", "Inside Campus", "Exited", "Cancelled"];
const visitorTypes = ["Walk-In Visitor", "Appointment Visitor"];

function GatePassManagement() {
  const [showForm, setShowForm] = useState(false);
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewData, setViewData] = useState(null);
  const [toast, setToast] = useState("");

  const [passDate, setPassDate] = useState(new Date().toISOString().split("T")[0]);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchText, setSearchText] = useState("");
  const [isSearched, setIsSearched] = useState(false);

  const [formData, setFormData] = useState({
    studentName: "",
    className: "",
    section: "",
    rollNumber: "",
    guardianName: "",
    mobile: "",
    reason: "",
    outTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    passDate: new Date().toISOString().split("T")[0],
    remarks: "",
  });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fetchPasses = useCallback(async () => {
    if (!isSearched) return;
    setLoading(true);
    try {
      const params = {};
      if (passDate) params.passDate = passDate;
      if (statusFilter) params.status = statusFilter;
      if (searchText) params.search = searchText;
      const res = await receptionService.getGatePasses(params);
      setPasses(res.data?.data || []);
    } catch {
      showToast("Failed to load gate passes");
    } finally {
      setLoading(false);
    }
  }, [passDate, statusFilter, searchText, isSearched]);

  useEffect(() => { fetchPasses(); }, [fetchPasses]);

  const handleSearch = () => { setIsSearched(true); fetchPasses(); setSelectedIds([]); };

  const resetForm = () => {
    setFormData({
      studentName: "", className: "", section: "", rollNumber: "", guardianName: "", mobile: "",
      reason: "", outTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      passDate: new Date().toISOString().split("T")[0], remarks: "",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.studentName || !formData.reason || !formData.passDate) {
      showToast("Student name, reason and pass date are required");
      return;
    }
    setSaving(true);
    try {
      await receptionService.createGatePass(formData);
      showToast("Gate pass issued successfully");
      resetForm();
      setShowForm(false);
      setIsSearched(true);
      fetchPasses();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to issue gate pass");
    } finally {
      setSaving(false);
    }
  };

  const handleReturn = async (item) => {
    try {
      await receptionService.updateGatePassStatus(item._id, {
        status: "Returned",
        inTime: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      });
      showToast("Gate pass marked as returned");
      fetchPasses();
      setSelectedIds([]);
    } catch {
      showToast("Failed to update gate pass");
    }
  };

  const handleCancel = async (item) => {
    if (!window.confirm("Cancel this gate pass?")) return;
    try {
      await receptionService.updateGatePassStatus(item._id, { status: "Cancelled" });
      showToast("Gate pass cancelled");
      fetchPasses();
      setSelectedIds([]);
    } catch {
      showToast("Failed to cancel gate pass");
    }
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) { showToast("Select at least one pass to delete"); return; }
    if (!window.confirm("Delete selected gate pass(es)?")) return;
    try {
      await Promise.all(selectedIds.map((id) => receptionService.deleteGatePass(id)));
      showToast("Gate pass(es) deleted");
      setSelectedIds([]);
      fetchPasses();
    } catch {
      showToast("Failed to delete gate pass");
    }
  };

  const selectedList = passes.filter((p) => selectedIds.includes(p._id));
  const singleItem = selectedList.length === 1 ? selectedList[0] : null;

  return (
    <div className="visitor-page">
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
          <h1>Gate Pass Management</h1>
          <p>Manage student gate passes and entry/exit records</p>
        </div>
      </div>

      {!showForm && (
        <>
          <div className="common-card">
            <div className="filter-grid">
              <div className="form-group">
                <label>Pass Date</label>
                <input type="date" value={passDate} onChange={(e) => setPassDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All</option>
                  <option value="Issued">Issued</option>
                  <option value="Returned">Returned</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="form-group">
                <label>Search</label>
                <input type="text" placeholder="Name or pass number" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
              </div>
            </div>
            <div className="search-btn-row">
              <AppButton type="primary" onClick={handleSearch}>Search</AppButton>
            </div>
          </div>

          <div className="common-card">
            <div className="list-header">
              <h2>Gate Pass List</h2>
              <div className="list-action-buttons">
                <AppButton type="primary" onClick={() => { resetForm(); setShowForm(true); }}>
                  + Issue Pass
                </AppButton>
                <AppButton type="view" onClick={() => { if (!singleItem) { showToast("Select one pass to view"); return; } setViewData(singleItem); }}>
                  View
                </AppButton>
                {singleItem?.status === "Issued" && (
                  <>
                    <AppButton type="primary" onClick={() => handleReturn(singleItem)}>Return</AppButton>
                    <AppButton type="delete" onClick={() => handleCancel(singleItem)}>Cancel Pass</AppButton>
                  </>
                )}
                <AppButton type="delete" onClick={handleDelete}>Delete</AppButton>
              </div>
            </div>

            <div className="table-wrap">
              {!isSearched ? (
                <table><tbody><tr><td colSpan="9" className="empty-row">Click Search to view gate passes</td></tr></tbody></table>
              ) : loading ? (
                <SkeletonTable columns={9} rows={5} />
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={passes.length > 0 && selectedIds.length === passes.length}
                          onChange={(e) => setSelectedIds(e.target.checked ? passes.map((p) => p._id) : [])}
                        />
                      </th>
                      <th>S.No</th>
                      <th>Pass No</th>
                      <th>Student</th>
                      <th>Class</th>
                      <th>Guardian</th>
                      <th>Reason</th>
                      <th>Out Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {passes.length === 0 ? (
                      <tr><td colSpan="9" className="empty-row">No gate pass found</td></tr>
                    ) : (
                      passes.map((item, index) => (
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
                          <td>{item.passNumber}</td>
                          <td>{item.studentName}</td>
                          <td>{item.className || "-"}</td>
                          <td>{item.guardianName || "-"}</td>
                          <td>{item.reason}</td>
                          <td>{item.outTime || "-"}</td>
                          <td>
                            <span className={`status-badge status-${item.status?.toLowerCase().replace(" ", "-")}`}>
                              {item.status}
                            </span>
                          </td>
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
              <label>Student Name *</label>
              <input type="text" name="studentName" value={formData.studentName} onChange={handleChange} placeholder="Enter student name" />
            </div>
            <div className="form-group">
              <label>Class</label>
              <input type="text" name="className" value={formData.className} onChange={handleChange} placeholder="e.g. Class 8" />
            </div>
            <div className="form-group">
              <label>Section</label>
              <input type="text" name="section" value={formData.section} onChange={handleChange} placeholder="e.g. A" />
            </div>
            <div className="form-group">
              <label>Roll Number</label>
              <input type="text" name="rollNumber" value={formData.rollNumber} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Guardian Name</label>
              <input type="text" name="guardianName" value={formData.guardianName} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Mobile</label>
              <input type="text" name="mobile" value={formData.mobile} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Pass Date *</label>
              <input type="date" name="passDate" value={formData.passDate} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Out Time</label>
              <input type="time" name="outTime" value={formData.outTime} onChange={handleChange} />
            </div>
            <div className="form-group full-width">
              <label>Reason *</label>
              <input type="text" name="reason" value={formData.reason} onChange={handleChange} placeholder="Reason for gate pass" />
            </div>
            <div className="form-group full-width">
              <label>Remarks</label>
              <textarea name="remarks" value={formData.remarks} onChange={handleChange} />
            </div>
          </div>
          <div className="form-actions">
            <AppButton type="primary" onClick={handleSave} disabled={saving}>
              {saving ? "Issuing..." : "Issue Pass"}
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
              <h2>Gate Pass Details</h2>
              <button className="popup-close-btn" onClick={() => setViewData(null)}>×</button>
            </div>
            <div className="view-grid">
              <p><strong>Pass No:</strong> {viewData.passNumber}</p>
              <p><strong>Student:</strong> {viewData.studentName}</p>
              <p><strong>Class:</strong> {viewData.className || "-"}</p>
              <p><strong>Section:</strong> {viewData.section || "-"}</p>
              <p><strong>Roll No:</strong> {viewData.rollNumber || "-"}</p>
              <p><strong>Guardian:</strong> {viewData.guardianName || "-"}</p>
              <p><strong>Mobile:</strong> {viewData.mobile || "-"}</p>
              <p><strong>Pass Date:</strong> {viewData.passDate}</p>
              <p><strong>Out Time:</strong> {viewData.outTime || "-"}</p>
              <p><strong>In Time:</strong> {viewData.inTime || "-"}</p>
              <p><strong>Status:</strong> {viewData.status}</p>
              <p className="full-width"><strong>Reason:</strong> {viewData.reason}</p>
              <p className="full-width"><strong>Remarks:</strong> {viewData.remarks || "-"}</p>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="submodule-toast-banner">{toast}</div>}
    </div>
  );
}

export default GatePassManagement;


