import React, { useState } from "react";
import "./leaveManagement.css";
import AppButton from "../components/AppButton";

function LeaveManagement() {
  const schoolId = localStorage.getItem("schoolId") || "SCH001";

  const leaveTypes = [
    "Paid Leave",
    "Casual Leave",
    "Sick Leave",
    "Unpaid Leave",
    "Emergency Leave",
    "Maternity Leave",
    "Paternity Leave",
    "Other",
  ];

  const departments = [
    { id: 1, schoolId: "SCH001", departmentId: 1 },
    { id: 2, schoolId: "SCH001", departmentId: 1 },
    { id: 3, schoolId: "SCH001", departmentId: 1 },
  ];

  const positions = [
    {
      id: 1,
      schoolId: "SCH001",
      departmentId: 1,
      positionId: 1,
    },
    {
      id: 2,
      schoolId: "SCH001",
      departmentId: 1,
      positionId: 1,
    },
    {
      id: 3,
      schoolId: "SCH001",
      departmentId: 1,
      positionId: 1,
    },
    {
      id: 4,
      schoolId: "SCH001",
      department: "Transport",
      positionName: "Driver",
    },
  ];

  const staffList = [
    {
      id: 1,
      schoolId: "SCH001",
      employeeCode: "SCH001-EMP-0001",
      employeeName: "Amit Kumar",
      department: "Teaching",
      position: "Teacher",
      mobile: "9876543210",
      lastWorkingDate: "",
      isActive: true,
    },
    {
      id: 2,
      schoolId: "SCH001",
      employeeCode: "SCH001-EMP-0002",
      employeeName: "Rahul Verma",
      department: "Accounts",
      position: "Accountant",
      mobile: "9876543211",
      lastWorkingDate: "",
      isActive: true,
    },
    {
      id: 3,
      schoolId: "SCH001",
      employeeCode: "SCH001-EMP-0003",
      employeeName: "Old Staff",
      department: "Teaching",
      position: "Teacher",
      mobile: "9876543212",
      lastWorkingDate: "2026-04-30",
      isActive: false,
    },
  ];

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const [selectedLeaveIds, setSelectedLeaveIds] = useState([]);
  const [selectedRequestIds, setSelectedRequestIds] = useState([]);

  const [filterData, setFilterData] = useState({
    department: "",
    position: "",
    employeeId: "",
  });

  const [appliedFilters, setAppliedFilters] = useState({
    department: "",
    position: "",
    employeeId: "",
  });

  const emptyForm = {
    employeeId: "",
    leaveType: "",
    fromDate: "",
    toDate: "",
    reason: "",
  };

  const [formData, setFormData] = useState(emptyForm);

  const [approvedLeaves, setApprovedLeaves] = useState([
    {
      id: 1,
      schoolId: "SCH001",
      employeeId: 1,
      employeeCode: "SCH001-EMP-0001",
      employeeName: "Amit Kumar",
      department: "Teaching",
      position: "Teacher",
      leaveType: "Sick Leave",
      fromDate: "2026-05-10",
      toDate: "2026-05-11",
      days: 2,
      reason: "Health issue",
      source: "Manual",
    },
  ]);

  const [pendingRequests, setPendingRequests] = useState([
    {
      id: 101,
      schoolId: "SCH001",
      employeeId: 1,
      employeeCode: "SCH001-EMP-0001",
      employeeName: "Amit Kumar",
      department: "Teaching",
      position: "Teacher",
      leaveType: "Casual Leave",
      fromDate: "2026-05-20",
      toDate: "2026-05-20",
      days: 1,
      reason: "Personal work",
      source: "Class Teacher Dashboard",
    },
  ]);

  const schoolDepartments = departments.filter(
    (item) => item.schoolId === schoolId
  );

  const activeStaff = staffList.filter(
    (item) =>
      item.schoolId === schoolId &&
      item.isActive &&
      !item.lastWorkingDate
  );

  const filterPositions = positions.filter(
    (item) =>
      item.schoolId === schoolId &&
      (!filterData.department || item.department === filterData.department)
  );

  const filterEmployees = activeStaff.filter(
    (item) =>
      (!filterData.department || item.department === filterData.department) &&
      (!filterData.position || item.position === filterData.position)
  );

  

  const filteredApprovedLeaves = approvedLeaves.filter(
    (item) =>
      item.schoolId === schoolId &&
      (!appliedFilters.department ||
        item.department === appliedFilters.department) &&
      (!appliedFilters.position ||
        item.position === appliedFilters.position) &&
      (!appliedFilters.employeeId ||
        item.employeeId === Number(appliedFilters.employeeId))
  );

  const calculateDays = (fromDate, toDate) => {
    if (!fromDate || !toDate) return 0;

    const from = new Date(fromDate);
    const to = new Date(toDate);

    if (to < from) return 0;

    const diffTime = to.getTime() - from.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditId(null);
  };
  const handleFormChange = (e) => {
    const { name, value } = e.target;

    if (name === "employeeId") {
      const selectedEmployee = activeStaff.find(
        (staff) => staff.id === Number(value)
      );

      setFormData({
        ...formData,
        employeeId: value,
        department: selectedEmployee?.department || "",
        position: selectedEmployee?.position || "",
      });

      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSearch = () => {
    setAppliedFilters(filterData);
    setSelectedLeaveIds([]);
  };

  const handleSave = () => {
    if (
      !formData.employeeId ||
      !formData.leaveType ||
      !formData.fromDate ||
      !formData.toDate
    ) {
      alert("Please fill all required fields");
      return;
    }

    const days = calculateDays(formData.fromDate, formData.toDate);

    if (days <= 0) {
      alert("To Date cannot be before From Date");
      return;
    }

    const selectedEmployee = activeStaff.find(
      (staff) => staff.id === Number(formData.employeeId)
    );

    if (!selectedEmployee) {
      alert("Employee not found");
      return;
    }

    if (editId) {
      setApprovedLeaves(
        approvedLeaves.map((item) =>
          item.id === editId
            ? {
                ...item,
                employeeId: selectedEmployee.id,
                employeeCode: selectedEmployee.employeeCode,
                employeeName: selectedEmployee.employeeName,
                department: selectedEmployee.department,
                position: selectedEmployee.position,
                leaveType: formData.leaveType,
                fromDate: formData.fromDate,
                toDate: formData.toDate,
                days,
                reason: formData.reason,
              }
            : item
        )
      );

      alert("Leave updated successfully");
    } else {
      const newLeave = {
        id: Date.now(),
        schoolId,
        employeeId: selectedEmployee.id,
        employeeCode: selectedEmployee.employeeCode,
        employeeName: selectedEmployee.employeeName,
        department: selectedEmployee.department,
        position: selectedEmployee.position,
        leaveType: formData.leaveType,
        fromDate: formData.fromDate,
        toDate: formData.toDate,
        days,
        reason: formData.reason,
        source: "Manual",
      };

      setApprovedLeaves([...approvedLeaves, newLeave]);

      alert("Leave added successfully");
    }

    resetForm();
    setShowForm(false);
  };

  const handleEdit = () => {
    if (selectedLeaveIds.length !== 1) {
      alert("Select one leave");
      return;
    }

    const selected = approvedLeaves.find(
      (item) => item.id === selectedLeaveIds[0]
    );

    if (!selected) return;

    setEditId(selected.id);

    setFormData({
      employeeId: String(selected.employeeId),
      leaveType: selected.leaveType,
      fromDate: selected.fromDate,
      toDate: selected.toDate,
      reason: selected.reason,
    });

    setShowForm(true);
  };

  const handleDelete = () => {
    if (selectedLeaveIds.length === 0) {
      alert("Select leave");
      return;
    }

    const ok = window.confirm("Delete selected leave?");
    if (!ok) return;

    setApprovedLeaves(
      approvedLeaves.filter((item) => !selectedLeaveIds.includes(item.id))
    );

    setSelectedLeaveIds([]);

    alert("Leave deleted successfully");
  };

  const handleAcceptRequest = () => {
    if (selectedRequestIds.length === 0) {
      alert("Select leave request");
      return;
    }

    const acceptedRequests = pendingRequests.filter((item) =>
      selectedRequestIds.includes(item.id)
    );

    const convertedLeaves = acceptedRequests.map((item) => ({
      ...item,
      id: Date.now() + Math.random(),
      source: "Approved Request",
    }));

    setApprovedLeaves([...approvedLeaves, ...convertedLeaves]);

    setPendingRequests(
      pendingRequests.filter((item) => !selectedRequestIds.includes(item.id))
    );

    setSelectedRequestIds([]);

    alert("Leave request accepted successfully");
  };

  const handleRejectRequest = () => {
    if (selectedRequestIds.length === 0) {
      alert("Select leave request");
      return;
    }

    const ok = window.confirm("Reject selected leave request?");
    if (!ok) return;

    setPendingRequests(
      pendingRequests.filter((item) => !selectedRequestIds.includes(item.id))
    );

    setSelectedRequestIds([]);

    alert("Leave request rejected");
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
              window.location.href = "/staff-control";
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
                  value={filterData.department}
                  onChange={(e) =>
                    setFilterData({
                      ...filterData,
                      department: e.target.value,
                      position: "",
                      employeeId: "",
                    })
                  }
                >
                  <option value="">All Department</option>

                  {schoolDepartments.map((item) => (
                    <option key={item.id} value={item.departmentName}>
                      {item.departmentName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Position</label>

                <select
                  value={filterData.position}
                  onChange={(e) =>
                    setFilterData({
                      ...filterData,
                      position: e.target.value,
                      employeeId: "",
                    })
                  }
                >
                  <option value="">All Position</option>

                  {filterPositions.map((item) => (
                    <option key={item.id} value={item.positionName}>
                      {item.positionName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Employee</label>

                <select
                  value={filterData.employeeId}
                  onChange={(e) =>
                    setFilterData({
                      ...filterData,
                      employeeId: e.target.value,
                    })
                  }
                >
                  <option value="">All Employee</option>

                  {filterEmployees.map((staff) => (
                    <option key={staff.id} value={staff.id}>
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
                <AppButton
                  type="primary"
                  onClick={handleAcceptRequest}
                >
                  Accept
                </AppButton>

                <AppButton
                  type="delete"
                  onClick={handleRejectRequest}
                >
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
                        checked={
                          pendingRequests.length > 0 &&
                          selectedRequestIds.length === pendingRequests.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRequestIds(
                              pendingRequests.map((item) => item.id)
                            );
                          } else {
                            setSelectedRequestIds([]);
                          }
                        }}
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
                  {pendingRequests.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="empty-row">
                        No pending leave request
                      </td>
                    </tr>
                  ) : (
                    pendingRequests.map((item, index) => (
                      <tr key={item.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedRequestIds.includes(item.id)}
                            onChange={() => {
                              setSelectedRequestIds((prev) =>
                                prev.includes(item.id)
                                  ? prev.filter((id) => id !== item.id)
                                  : [...prev, item.id]
                              );
                            }}
                          />
                        </td>

                        <td>{index + 1}</td>
                        <td>{item.employeeName}</td>
                        <td>{item.department}</td>
                        <td>{item.leaveType}</td>
                        <td>{item.fromDate}</td>
                        <td>{item.toDate}</td>
                        <td>{item.days}</td>
                        <td>{item.reason}</td>
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
                <AppButton type="primary" onClick={handleEdit}>
                  Edit
                </AppButton>

                <AppButton type="delete" onClick={handleDelete}>
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
                          selectedLeaveIds.length ===
                            filteredApprovedLeaves.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLeaveIds(
                              filteredApprovedLeaves.map((item) => item.id)
                            );
                          } else {
                            setSelectedLeaveIds([]);
                          }
                        }}
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
                  {filteredApprovedLeaves.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="empty-row">
                        No approved leave found
                      </td>
                    </tr>
                  ) : (
                    filteredApprovedLeaves.map((item, index) => (
                      <tr key={item.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedLeaveIds.includes(item.id)}
                            onChange={() => {
                              setSelectedLeaveIds((prev) =>
                                prev.includes(item.id)
                                  ? prev.filter((id) => id !== item.id)
                                  : [...prev, item.id]
                              );
                            }}
                          />
                        </td>

                        <td>{index + 1}</td>
                        <td>{item.employeeCode}</td>
                        <td>{item.employeeName}</td>
                        <td>{item.department}</td>
                        <td>{item.leaveType}</td>
                        <td>{item.fromDate}</td>
                        <td>{item.toDate}</td>
                        <td>{item.days}</td>
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
              >
                <option value="">Select Employee</option>

                {activeStaff.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.employeeName} - {staff.employeeCode}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Leave Type *</label>

              <select
                name="leaveType"
                value={formData.leaveType}
                onChange={handleFormChange}
              >
                <option value="">Select Leave Type</option>

                {leaveTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>From Date *</label>

              <input
                type="date"
                name="fromDate"
                value={formData.fromDate}
                onChange={handleFormChange}
              />
            </div>

            <div className="form-group">
              <label>To Date *</label>

              <input
                type="date"
                name="toDate"
                value={formData.toDate}
                onChange={handleFormChange}
              />
            </div>

            <div className="form-group">
              <label>Days</label>

              <input
                value={calculateDays(formData.fromDate, formData.toDate)}
                readOnly
              />
            </div>

            <div className="form-group full-width">
              <label>Reason</label>

              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleFormChange}
              ></textarea>
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

export default LeaveManagement;