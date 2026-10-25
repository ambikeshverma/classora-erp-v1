import React, { useState, useEffect, useCallback } from "react";
import "./appointmentScheduling.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { receptionService } from "../services/api";

const appointmentStatuses = ["Pending", "Approved", "Rejected", "Completed", "Cancelled"];

function AppointmentScheduling() {
  const [showForm, setShowForm] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewData, setViewData] = useState(null);
  const [toast, setToast] = useState("");

  const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().split("T")[0]);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchText, setSearchText] = useState("");
  const [isSearched, setIsSearched] = useState(false);

  const [formData, setFormData] = useState({
    visitorName: "",
    mobile: "",
    departmentId: "",
    departmentName: "",
    personToMeetId: "",
    personToMeet: "",
    appointmentDate: new Date().toISOString().split("T")[0],
    timeSlot: "",
    purpose: "",
    remarks: "",
    status: "Pending",
  });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fetchMeta = useCallback(async () => {
    try {
      const res = await receptionService.getMeta();
      setDepartments(res.data?.data?.departments || []);
      setStaff(res.data?.data?.staff || []);
    } catch { /* meta failure is non-critical */ }
  }, []);

  useEffect(() => { fetchMeta(); }, [fetchMeta]);

  const fetchAppointments = useCallback(async () => {
    if (!isSearched) return;
    setLoading(true);
    try {
      const params = {};
      if (appointmentDate) params.appointmentDate = appointmentDate;
      if (statusFilter) params.status = statusFilter;
      if (searchText) params.search = searchText;
      const res = await receptionService.getAppointments(params);
      setAppointments(res.data?.data || []);
    } catch {
      showToast("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, [appointmentDate, statusFilter, searchText, isSearched]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const handleSearch = () => { setIsSearched(true); fetchAppointments(); setSelectedIds([]); };

  const resetForm = () => {
    setFormData({
      visitorName: "", mobile: "", departmentId: "", departmentName: "",
      personToMeetId: "", personToMeet: "",
      appointmentDate: new Date().toISOString().split("T")[0],
      timeSlot: "", purpose: "", remarks: "", status: "Pending",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "departmentId" ? {
        departmentName: departments.find((d) => String(d._id) === value)?.departmentName || "",
        personToMeetId: "",
        personToMeet: "",
      } : {}),
      ...(name === "personToMeetId" ? {
        personToMeet: staff.find((s) => String(s._id) === value)?.fullName || "",
      } : {}),
    }));
  };

  const filteredStaff = staff.filter((s) => String(s.departmentId) === String(formData.departmentId));

  const handleSave = async () => {
    if (!formData.visitorName || !formData.mobile || !formData.appointmentDate || !formData.timeSlot) {
      showToast("Please fill required fields");
      return;
    }
    setSaving(true);
    try {
      await receptionService.createAppointment(formData);
      showToast("Appointment created successfully");
      resetForm();
      setShowForm(false);
      setIsSearched(true);
      fetchAppointments();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create appointment");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await receptionService.updateAppointmentStatus(id, status);
      showToast(`Appointment ${status.toLowerCase()} successfully`);
      setSelectedIds([]);
      fetchAppointments();
    } catch {
      showToast("Failed to update appointment status");
    }
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) { showToast("Select appointment(s) to delete"); return; }
    if (!window.confirm("Delete selected appointment(s)?")) return;
    try {
      await Promise.all(selectedIds.map((id) => receptionService.deleteAppointment(id)));
      showToast("Appointment(s) deleted successfully");
      setSelectedIds([]);
      fetchAppointments();
    } catch {
      showToast("Failed to delete appointment");
    }
  };

  const selectedList = appointments.filter((a) => selectedIds.includes(a._id));
  const singleItem = selectedList.length === 1 ? selectedList[0] : null;

  return (
    <div className="appointment-page">
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
          <h1>Appointment Scheduling</h1>
          <p>Manage visitor appointments</p>
        </div>
      </div>

      {!showForm && (
        <>
          <div className="common-card">
            <div className="filter-grid">
              <div className="form-group">
                <label>Appointment Date</label>
                <input type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All</option>
                  {appointmentStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
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
              <h2>Appointment List</h2>
              <div className="list-action-buttons">
                <AppButton type="primary" onClick={() => { resetForm(); setShowForm(true); }}>
                  + Add Appointment
                </AppButton>
                <AppButton type="view" onClick={() => { if (!singleItem) { showToast("Select one appointment to view"); return; } setViewData(singleItem); }}>
                  View
                </AppButton>
                {singleItem?.status === "Pending" && (
                  <>
                    <AppButton type="primary" onClick={() => handleStatusUpdate(singleItem._id, "Approved")}>Approve</AppButton>
                    <AppButton type="delete" onClick={() => handleStatusUpdate(singleItem._id, "Rejected")}>Reject</AppButton>
                  </>
                )}
                {singleItem?.status === "Approved" && (
                  <>
                    <AppButton type="primary" onClick={() => handleStatusUpdate(singleItem._id, "Completed")}>Complete</AppButton>
                    <AppButton type="delete" onClick={() => handleStatusUpdate(singleItem._id, "Cancelled")}>Cancel</AppButton>
                  </>
                )}
                <AppButton type="delete" onClick={handleDelete}>Delete</AppButton>
              </div>
            </div>

            <div className="table-wrap">
              {!isSearched ? (
                <table><tbody><tr><td colSpan="10" className="empty-row">Click Search to view appointments</td></tr></tbody></table>
              ) : loading ? (
                <SkeletonTable columns={10} rows={5} />
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={appointments.length > 0 && selectedIds.length === appointments.length}
                          onChange={(e) => setSelectedIds(e.target.checked ? appointments.map((a) => a._id) : [])}
                        />
                      </th>
                      <th>S.No</th>
                      <th>Appt. ID</th>
                      <th>Visitor</th>
                      <th>Mobile</th>
                      <th>Person To Meet</th>
                      <th>Department</th>
                      <th>Date</th>
                      <th>Time Slot</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.length === 0 ? (
                      <tr><td colSpan="10" className="empty-row">No appointment found</td></tr>
                    ) : (
                      appointments.map((item, index) => (
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
                          <td>{item.appointmentId}</td>
                          <td>{item.visitorName}</td>
                          <td>{item.mobile}</td>
                          <td>{item.personToMeet || "-"}</td>
                          <td>{item.departmentName || "-"}</td>
                          <td>{item.appointmentDate}</td>
                          <td>{item.timeSlot}</td>
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
              <label>Visitor Name *</label>
              <input type="text" name="visitorName" value={formData.visitorName} onChange={handleChange} placeholder="Enter visitor name" />
            </div>
            <div className="form-group">
              <label>Mobile *</label>
              <input type="text" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="Enter mobile number" />
            </div>
            <div className="form-group">
              <label>Department</label>
              <select name="departmentId" value={formData.departmentId} onChange={handleChange}>
                <option value="">Select Department</option>
                {departments.map((d) => <option key={d._id} value={d._id}>{d.departmentName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Person To Meet</label>
              <select name="personToMeetId" value={formData.personToMeetId} onChange={handleChange} disabled={!formData.departmentId}>
                <option value="">Select Person</option>
                {filteredStaff.map((s) => <option key={s._id} value={s._id}>{s.fullName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Appointment Date *</label>
              <input type="date" name="appointmentDate" value={formData.appointmentDate} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Time Slot *</label>
              <input type="time" name="timeSlot" value={formData.timeSlot} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Purpose</label>
              <input type="text" name="purpose" value={formData.purpose} onChange={handleChange} placeholder="Purpose of visit" />
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
              <h2>Appointment Details</h2>
              <button className="popup-close-btn" onClick={() => setViewData(null)}>×</button>
            </div>
            <div className="view-grid">
              <p><strong>Appointment ID:</strong> {viewData.appointmentId}</p>
              <p><strong>Visitor:</strong> {viewData.visitorName}</p>
              <p><strong>Mobile:</strong> {viewData.mobile}</p>
              <p><strong>Person To Meet:</strong> {viewData.personToMeet || "-"}</p>
              <p><strong>Department:</strong> {viewData.departmentName || "-"}</p>
              <p><strong>Date:</strong> {viewData.appointmentDate}</p>
              <p><strong>Time Slot:</strong> {viewData.timeSlot}</p>
              <p><strong>Status:</strong> {viewData.status}</p>
              <p className="full-width"><strong>Purpose:</strong> {viewData.purpose || "-"}</p>
              <p className="full-width"><strong>Remarks:</strong> {viewData.remarks || "-"}</p>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="submodule-toast-banner">{toast}</div>}
    </div>
  );
}

export default AppointmentScheduling;

