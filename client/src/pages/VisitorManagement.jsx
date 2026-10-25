import React, { useState, useEffect, useCallback } from "react";
import "./visitorManagement.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { receptionService } from "../services/api";

const visitorStatuses = ["Waiting", "Inside Campus", "Exited", "Cancelled"];
const visitorTypes = ["Walk-In Visitor", "Appointment Visitor"];

function VisitorManagement() {
  const [showForm, setShowForm] = useState(false);
  const [visitors, setVisitors] = useState([]);
  const [approvedAppointments, setApprovedAppointments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewData, setViewData] = useState(null);
  const [toast, setToast] = useState("");

  const [visitDate, setVisitDate] = useState(new Date().toISOString().split("T")[0]);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [searchText, setSearchText] = useState("");
  const [isSearched, setIsSearched] = useState(false);

  const [formData, setFormData] = useState({
    visitorType: "Walk-In Visitor",
    appointmentRef: "",
    visitorName: "",
    mobile: "",
    address: "",
    purpose: "",
    whomToMeet: "",
    department: "",
    idProof: "",
    remarks: "",
    visitDate: new Date().toISOString().split("T")[0],
    status: "Waiting",
  });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fetchMeta = useCallback(async () => {
    try {
      const [metaRes, apptRes] = await Promise.all([
        receptionService.getMeta(),
        receptionService.getApprovedAppointments(),
      ]);
      setDepartments(metaRes.data?.data?.departments || []);
      setStaff(metaRes.data?.data?.staff || []);
      setApprovedAppointments(apptRes.data?.data || []);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { fetchMeta(); }, [fetchMeta]);

  const fetchVisitors = useCallback(async () => {
    if (!isSearched) return;
    setLoading(true);
    try {
      const params = {};
      if (visitDate) params.visitDate = visitDate;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.visitorType = typeFilter;
      if (searchText) params.search = searchText;
      const res = await receptionService.getVisitors(params);
      setVisitors(res.data?.data || []);
    } catch {
      showToast("Failed to load visitors");
    } finally {
      setLoading(false);
    }
  }, [visitDate, statusFilter, typeFilter, searchText, isSearched]);

  useEffect(() => { fetchVisitors(); }, [fetchVisitors]);

  const handleSearch = () => { setIsSearched(true); fetchVisitors(); setSelectedIds([]); };

  const resetForm = () => {
    setFormData({
      visitorType: "Walk-In Visitor", appointmentRef: "",
      visitorName: "", mobile: "", address: "", purpose: "",
      whomToMeet: "", department: "", idProof: "", remarks: "",
      visitDate: new Date().toISOString().split("T")[0], status: "Waiting",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "department" ? { whomToMeet: "" } : {}),
      ...(name === "visitorType" && value === "Walk-In Visitor" ? {
        appointmentRef: "", visitorName: "", mobile: "", purpose: "", whomToMeet: "", department: "",
      } : {}),
    }));
  };

  const handleAppointmentSelect = (e) => {
    const apt = approvedAppointments.find((a) => a._id === e.target.value);
    if (!apt) return;
    setFormData((prev) => ({
      ...prev,
      appointmentRef: apt._id,
      visitorName: apt.visitorName,
      mobile: apt.mobile,
      purpose: apt.purpose || "",
      whomToMeet: apt.personToMeet || "",
      department: apt.department || "",
    }));
  };

  const filteredStaff = staff.filter((s) => {
    const dept = departments.find((d) => d.departmentName === formData.department);
    return dept ? String(s.departmentId) === String(dept._id) : false;
  });

  const handleSave = async () => {
    if (!formData.visitorName || !formData.mobile || !formData.visitDate) {
      showToast("Visitor name, mobile and visit date are required");
      return;
    }
    setSaving(true);
    try {
      await receptionService.createVisitor(formData);
      showToast("Visitor added successfully");
      resetForm();
      setShowForm(false);
      setIsSearched(true);
      fetchVisitors();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add visitor");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (item, status, extraData = {}) => {
    try {
      await receptionService.updateVisitorStatus(item._id, { status, ...extraData });
      showToast(`Visitor ${status === "Inside Campus" ? "checked in" : "checked out"} successfully`);
      setSelectedIds([]);
      fetchVisitors();
    } catch {
      showToast("Failed to update visitor status");
    }
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) { showToast("Select visitor(s) to delete"); return; }
    if (!window.confirm("Delete selected visitor(s)?")) return;
    try {
      await Promise.all(selectedIds.map((id) => receptionService.deleteVisitor(id)));
      showToast("Visitor(s) deleted successfully");
      setSelectedIds([]);
      fetchVisitors();
    } catch {
      showToast("Failed to delete visitor");
    }
  };

  const selectedList = visitors.filter((v) => selectedIds.includes(v._id));
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
          <h1>Visitor Management</h1>
          <p>Manage visitor entry, check-in and check-out</p>
        </div>
      </div>

      {!showForm && (
        <>
          <div className="common-card">
            <div className="filter-grid">
              <div className="form-group">
                <label>Visit Date</label>
                <input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Visitor Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All</option>
                  {visitorStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Visitor Type</label>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                  <option value="">All</option>
                  {visitorTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Search</label>
                <input type="text" placeholder="Name or mobile" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
              </div>
            </div>
            <div className="search-btn-row">
              <AppButton type="primary" onClick={handleSearch}>Search</AppButton>
            </div>
          </div>

          <div className="common-card">
            <div className="list-header">
              <h2>Visitor List</h2>
              <div className="list-action-buttons">
                <AppButton type="primary" onClick={() => { resetForm(); setShowForm(true); }}>
                  + Add Visitor
                </AppButton>
                <AppButton type="view" onClick={() => { if (!singleItem) { showToast("Select one visitor to view"); return; } setViewData(singleItem); }}>
                  View
                </AppButton>
                {singleItem?.status === "Waiting" && (
                  <AppButton type="primary" onClick={() => handleStatusUpdate(singleItem, "Inside Campus", { inTime: new Date().toLocaleTimeString() })}>
                    Check-In
                  </AppButton>
                )}
                {singleItem?.status === "Inside Campus" && (
                  <AppButton type="primary" onClick={() => handleStatusUpdate(singleItem, "Exited", { outTime: new Date().toLocaleTimeString() })}>
                    Check-Out
                  </AppButton>
                )}
                <AppButton type="delete" onClick={handleDelete}>Delete</AppButton>
              </div>
            </div>

            <div className="table-wrap">
              {!isSearched ? (
                <table><tbody><tr><td colSpan="10" className="empty-row">Click Search to view visitors</td></tr></tbody></table>
              ) : loading ? (
                <SkeletonTable columns={10} rows={5} />
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={visitors.length > 0 && selectedIds.length === visitors.length}
                          onChange={(e) => setSelectedIds(e.target.checked ? visitors.map((v) => v._id) : [])}
                        />
                      </th>
                      <th>S.No</th>
                      <th>Visitor</th>
                      <th>Mobile</th>
                      <th>Purpose</th>
                      <th>Whom To Meet</th>
                      <th>In Time</th>
                      <th>Out Time</th>
                      <th>Status</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visitors.length === 0 ? (
                      <tr><td colSpan="10" className="empty-row">No visitor found</td></tr>
                    ) : (
                      visitors.map((item, index) => (
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
                          <td>{item.visitorName}</td>
                          <td>{item.mobile}</td>
                          <td>{item.purpose || "-"}</td>
                          <td>{item.whomToMeet || "-"}</td>
                          <td>{item.inTime || "-"}</td>
                          <td>{item.outTime || "-"}</td>
                          <td>{item.status}</td>
                          <td>{item.visitorType}</td>
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
              <label>Visitor Type</label>
              <select name="visitorType" value={formData.visitorType} onChange={handleChange}>
                {visitorTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {formData.visitorType === "Appointment Visitor" && (
              <div className="form-group">
                <label>Select Appointment</label>
                <select onChange={handleAppointmentSelect} value={formData.appointmentRef}>
                  <option value="">Select Appointment</option>
                  {approvedAppointments.map((apt) => (
                    <option key={apt._id} value={apt._id}>
                      {apt.visitorName} - {apt.personToMeet || "Staff"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Visitor Name *</label>
              <input type="text" name="visitorName" value={formData.visitorName} onChange={handleChange} readOnly={formData.visitorType === "Appointment Visitor"} />
            </div>
            <div className="form-group">
              <label>Mobile *</label>
              <input type="text" name="mobile" value={formData.mobile} onChange={handleChange} readOnly={formData.visitorType === "Appointment Visitor"} />
            </div>
            <div className="form-group">
              <label>Purpose</label>
              <input type="text" name="purpose" value={formData.purpose} onChange={handleChange} readOnly={formData.visitorType === "Appointment Visitor"} />
            </div>

            {formData.visitorType === "Walk-In Visitor" ? (
              <>
                <div className="form-group">
                  <label>Department</label>
                  <select name="department" value={formData.department} onChange={handleChange}>
                    <option value="">Select Department</option>
                    {departments.map((d) => <option key={d._id} value={d.departmentName}>{d.departmentName}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Whom To Meet</label>
                  <select name="whomToMeet" value={formData.whomToMeet} onChange={handleChange} disabled={!formData.department}>
                    <option value="">Select Person</option>
                    {filteredStaff.map((s) => <option key={s._id} value={s.fullName}>{s.fullName}</option>)}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>Whom To Meet</label>
                  <input type="text" value={formData.whomToMeet} readOnly />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <input type="text" value={formData.department} readOnly />
                </div>
              </>
            )}

            <div className="form-group">
              <label>Address</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>ID Proof</label>
              <input type="text" name="idProof" value={formData.idProof} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Visit Date *</label>
              <input type="date" name="visitDate" value={formData.visitDate} onChange={handleChange} />
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
              <h2>Visitor Details</h2>
              <button className="popup-close-btn" onClick={() => setViewData(null)}>×</button>
            </div>
            <div className="view-grid">
              <p><strong>Visitor:</strong> {viewData.visitorName}</p>
              <p><strong>Mobile:</strong> {viewData.mobile}</p>
              <p><strong>Purpose:</strong> {viewData.purpose || "-"}</p>
              <p><strong>Whom To Meet:</strong> {viewData.whomToMeet || "-"}</p>
              <p><strong>Department:</strong> {viewData.department || "-"}</p>
              <p><strong>Address:</strong> {viewData.address || "-"}</p>
              <p><strong>ID Proof:</strong> {viewData.idProof || "-"}</p>
              <p><strong>Visit Date:</strong> {viewData.visitDate}</p>
              <p><strong>In Time:</strong> {viewData.inTime || "-"}</p>
              <p><strong>Out Time:</strong> {viewData.outTime || "-"}</p>
              <p><strong>Status:</strong> {viewData.status}</p>
              <p><strong>Visitor Type:</strong> {viewData.visitorType}</p>
              <p className="full-width"><strong>Remarks:</strong> {viewData.remarks || "-"}</p>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="submodule-toast-banner">{toast}</div>}
    </div>
  );
}

export default VisitorManagement;

