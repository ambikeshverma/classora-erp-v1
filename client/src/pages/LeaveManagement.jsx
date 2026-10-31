import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./leaveManagement.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { hrService } from "../services/api";

const LEAVE_TYPES = [
  "Paid Leave",
  "Casual Leave",
  "Sick Leave",
  "Unpaid Leave",
  "Emergency Leave",
  "Maternity Leave",
  "Paternity Leave",
  "Other",
];

const EMPTY_FILTERS = { departmentId: "", positionId: "", employeeId: "" };
const EMPTY_FORM = { employeeId: "", leaveType: "", fromDate: "", toDate: "", reason: "" };

const idOf = (value) => String(value?._id || value || "");

const calculateDays = (fromDate, toDate) => {
  if (!fromDate || !toDate) return 0;

  const from = new Date(fromDate);
  const to = new Date(toDate);
  if (to < from) return 0;

  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
};

const formatDate = (value) => (value ? String(value).split("-").reverse().join("-") : "-");

function LeaveManagement() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [leaves, setLeaves] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const [selectedLeaveIds, setSelectedLeaveIds] = useState([]);
  const [selectedRequestIds, setSelectedRequestIds] = useState([]);

  const [filterData, setFilterData] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [metaRes, leaveRes] = await Promise.all([hrService.getMeta(), hrService.getLeaves()]);

      const meta = metaRes.data?.data || {};
      setDepartments(meta.departments || []);
      setPositions(meta.positions || []);
      setStaffList(meta.staff || []);
      setLeaves(leaveRes.data?.data || []);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load leave data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const departmentName = useCallback(
    (id) => departments.find((item) => idOf(item) === idOf(id))?.departmentName || "",
    [departments]
  );

  const filterPositions = positions.filter(
    (item) => !filterData.departmentId || idOf(item.departmentId) === filterData.departmentId
  );

  const filterEmployees = staffList.filter(
    (item) =>
      (!filterData.departmentId || idOf(item.departmentId) === filterData.departmentId) &&
      (!filterData.positionId || idOf(item.positionId) === filterData.positionId)
  );

  const pendingRequests = useMemo(() => leaves.filter((item) => item.status === "Pending"), [leaves]);

  const filteredApprovedLeaves = useMemo(() => {
    const positionName = positions.find((item) => idOf(item) === appliedFilters.positionId)?.positionName;
    const deptName = departmentName(appliedFilters.departmentId);

    return leaves.filter(
      (item) =>
        item.status === "Approved" &&
        (!appliedFilters.departmentId || item.department === deptName) &&
        (!appliedFilters.positionId || item.position === positionName) &&
        (!appliedFilters.employeeId || idOf(item.staffId) === appliedFilters.employeeId)
    );
  }, [leaves, positions, appliedFilters, departmentName]);

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditId(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSearch = () => {
    setAppliedFilters(filterData);
    setSelectedLeaveIds([]);
  };

  const handleSave = async () => {
    if (!formData.employeeId || !formData.leaveType || !formData.fromDate || !formData.toDate) {
      alert("Please fill all required fields");
      return;
    }

    if (calculateDays(formData.fromDate, formData.toDate) <= 0) {
      alert("To Date cannot be before From Date");
      return;
    }

    try {
      setSaving(true);

      if (editId) {
        await hrService.updateLeave(editId, {
          leaveType: formData.leaveType,
          fromDate: formData.fromDate,
          toDate: formData.toDate,
          reason: formData.reason,
        });
        alert("Leave updated successfully");
      } else {
        await hrService.createLeave({
          staffId: formData.employeeId,
          leaveType: formData.leaveType,
          fromDate: formData.fromDate,
          toDate: formData.toDate,
          reason: formData.reason,
          status: "Approved",
        });
        alert("Leave added successfully");
      }

      resetForm();
      setShowForm(false);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save leave");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    if (selectedLeaveIds.length !== 1) {
      alert("Select one leave");
      return;
    }

    const selected = leaves.find((item) => item._id === selectedLeaveIds[0]);
    if (!selected) return;

    setEditId(selected._id);
    setFormData({
      employeeId: idOf(selected.staffId),
      leaveType: selected.leaveType,
      fromDate: selected.fromDate,
      toDate: selected.toDate,
      reason: selected.reason || "",
    });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (selectedLeaveIds.length === 0) {
      alert("Select leave");
      return;
    }

    if (!window.confirm("Delete selected leave?")) return;

    try {
      setSaving(true);
      await Promise.all(selectedLeaveIds.map((id) => hrService.deleteLeave(id)));
      setSelectedLeaveIds([]);
      alert("Leave deleted successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete leave");
    } finally {
      setSaving(false);
      await loadData();
    }
  };

  const reviewRequests = async (status) => {
    try {
      setSaving(true);
      await Promise.all(selectedRequestIds.map((id) => hrService.updateLeaveStatus(id, status)));
      setSelectedRequestIds([]);
      alert(status === "Approved" ? "Leave request accepted successfully" : "Leave request rejected");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update leave request");
    } finally {
      setSaving(false);
      await loadData();
    }
  };

  const handleAcceptRequest = () => {
    if (selectedRequestIds.length === 0) {
      alert("Select leave request");
      return;
    }

    reviewRequests("Approved");
  };

  const handleRejectRequest = () => {
    if (selectedRequestIds.length === 0) {
      alert("Select leave request");
      return;
    }

    if (!window.confirm("Reject selected leave request?")) return;

    reviewRequests("Rejected");
  };

  return (
    <div className="leave-management-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => {
            if (showForm) {
              resetForm();
              setShowForm(false);
            } else {
              navigate("/staff-control");
            }
          }}
        >
          ←
        </AppButton>

        <div>
          <h1>{showForm ? "Add / Edit Leave" : "Leave Management"}</h1>
          <p>Add and manage staff leaves</p>
        </div>
      </div>

      {!showForm && (
        <>
          <div className="common-card">
            <div className="leave-filter-grid">
              <div className="form-group">
                <label>Department</label>

                <select
                  value={filterData.departmentId}
                  onChange={(e) =>
                    setFilterData({ departmentId: e.target.value, positionId: "", employeeId: "" })
                  }
                >
                  <option value="">All Department</option>

                  {departments.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.departmentName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Position</label>

                <select
                  value={filterData.positionId}
                  onChange={(e) => setFilterData({ ...filterData, positionId: e.target.value, employeeId: "" })}
                >
                  <option value="">All Position</option>

                  {filterPositions.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.positionName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Employee</label>

                <select
                  value={filterData.employeeId}
                  onChange={(e) => setFilterData({ ...filterData, employeeId: e.target.value })}
                >
                  <option value="">All Employee</option>

                  {filterEmployees.map((staff) => (
                    <option key={staff._id} value={staff._id}>
                      {staff.employeeName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-actions">
              <AppButton type="primary" onClick={handleSearch}>
                Search
              </AppButton>

              <AppButton
                type="primary"
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
              >
                + Add Leave
              </AppButton>
            </div>
          </div>

          <div className="common-card">
            <div className="list-header">
              <h2>Pending Leave Requests</h2>

              <div className="list-action-buttons">
                <AppButton type="primary" onClick={handleAcceptRequest} disabled={saving}>
                  Accept
                </AppButton>

                <AppButton type="delete" onClick={handleRejectRequest} disabled={saving}>
                  Reject
                </AppButton>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={pendingRequests.length > 0 && selectedRequestIds.length === pendingRequests.length}
                        onChange={(e) =>
                          setSelectedRequestIds(e.target.checked ? pendingRequests.map((item) => item._id) : [])
                        }
                      />
                    </th>

                    <th>S.No</th>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Leave Type</th>
                    <th>From Date</th>
                    <th>To Date</th>
                    <th>Days</th>
                    <th>Reason</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="9" style={{ padding: "4px 0", border: "none" }}>
                        <SkeletonTable rows={3} columns={9} />
                      </td>
                    </tr>
                  ) : pendingRequests.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="empty-row">
                        No pending leave request
                      </td>
                    </tr>
                  ) : (
                    pendingRequests.map((item, index) => (
                      <tr key={item._id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedRequestIds.includes(item._id)}
                            onChange={() =>
                              setSelectedRequestIds((prev) =>
                                prev.includes(item._id) ? prev.filter((id) => id !== item._id) : [...prev, item._id]
                              )
                            }
                          />
                        </td>

                        <td>{index + 1}</td>
                        <td>{item.employeeName}</td>
                        <td>{item.department}</td>
                        <td>{item.leaveType}</td>
                        <td>{formatDate(item.fromDate)}</td>
                        <td>{formatDate(item.toDate)}</td>
                        <td>{calculateDays(item.fromDate, item.toDate)}</td>
                        <td>{item.reason || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="common-card">
            <div className="list-header">
              <h2>Approved Leave List</h2>

              <div className="list-action-buttons">
                <AppButton type="primary" onClick={handleEdit} disabled={saving}>
                  Edit
                </AppButton>

                <AppButton type="delete" onClick={handleDelete} disabled={saving}>
                  Delete
                </AppButton>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={
                          filteredApprovedLeaves.length > 0 &&
                          selectedLeaveIds.length === filteredApprovedLeaves.length
                        }
                        onChange={(e) =>
                          setSelectedLeaveIds(e.target.checked ? filteredApprovedLeaves.map((item) => item._id) : [])
                        }
                      />
                    </th>

                    <th>S.No</th>
                    <th>Employee Code</th>
                    <th>Employee Name</th>
                    <th>Department</th>
                    <th>Leave Type</th>
                    <th>From Date</th>
                    <th>To Date</th>
                    <th>Days</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="9" style={{ padding: "4px 0", border: "none" }}>
                        <SkeletonTable rows={5} columns={9} />
                      </td>
                    </tr>
                  ) : filteredApprovedLeaves.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="empty-row">
                        No approved leave found
                      </td>
                    </tr>
                  ) : (
                    filteredApprovedLeaves.map((item, index) => (
                      <tr key={item._id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedLeaveIds.includes(item._id)}
                            onChange={() =>
                              setSelectedLeaveIds((prev) =>
                                prev.includes(item._id) ? prev.filter((id) => id !== item._id) : [...prev, item._id]
                              )
                            }
                          />
                        </td>

                        <td>{index + 1}</td>
                        <td>{item.employeeCode}</td>
                        <td>{item.employeeName}</td>
                        <td>{item.department}</td>
                        <td>{item.leaveType}</td>
                        <td>{formatDate(item.fromDate)}</td>
                        <td>{formatDate(item.toDate)}</td>
                        <td>{calculateDays(item.fromDate, item.toDate)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showForm && (
        <div className="common-card">
          <div className="leave-form-grid">
            <div className="form-group">
              <label>Employee *</label>

              <select
                name="employeeId"
                value={formData.employeeId}
                onChange={handleFormChange}
                disabled={Boolean(editId)}
              >
                <option value="">Select Employee</option>

                {staffList.map((staff) => (
                  <option key={staff._id} value={staff._id}>
                    {staff.employeeName} - {staff.employeeCode}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Leave Type *</label>

              <select name="leaveType" value={formData.leaveType} onChange={handleFormChange}>
                <option value="">Select Leave Type</option>

                {LEAVE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>From Date *</label>

              <input type="date" name="fromDate" value={formData.fromDate} onChange={handleFormChange} />
            </div>

            <div className="form-group">
              <label>To Date *</label>

              <input type="date" name="toDate" value={formData.toDate} onChange={handleFormChange} />
            </div>

            <div className="form-group">
              <label>Days</label>

              <input value={calculateDays(formData.fromDate, formData.toDate)} readOnly />
            </div>

            <div className="form-group full-width">
              <label>Reason</label>

              <textarea name="reason" value={formData.reason} onChange={handleFormChange}></textarea>
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
    </div>
  );
}

export default LeaveManagement;
