import React, { useState } from "react";
import "./supportComplaint.css";
import AppButton from "../components/AppButton";

function SupportComplaint() {
  const complaintStatuses = [
    "Open",
    "In Progress",
    "Resolved",
    "Closed",
    "Rejected",
  ];

  const complaintCategories = [
    "Fee Issue",
    "Transport",
    "Teacher Behaviour",
    "Academic",
    "App/ERP Issue",
    "Examination",
    "Result",
    "Admission",
    "Discipline",
    "Other",
  ];

  const priorities = ["Low", "Medium", "High", "Urgent"];

  const departments = [
    { id: 1, departmentName: "Administration" },
    { id: 2, departmentName: "Accounts" },
    { id: 3, departmentName: "Transport" },
    { id: 4, departmentName: "Academic" },
  ];

  const employees = [
    { id: 1, employeeName: "Principal", department: "Administration" },
    { id: 2, employeeName: "Accountant", department: "Accounts" },
    { id: 3, employeeName: "Transport Incharge", department: "Transport" },
    { id: 4, employeeName: "Class Teacher", department: "Academic" },
    { id: 5, employeeName: "Subject Teacher", department: "Academic" },
  ];

  const [showForm, setShowForm] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewData, setViewData] = useState(null);

  const [complaintDate, setComplaintDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [searchText, setSearchText] = useState("");

  const [isSearched, setIsSearched] = useState(false);

  const [appliedFilters, setAppliedFilters] = useState({
    complaintDate: "",
    statusFilter: "",
    priorityFilter: "",
    searchText: "",
  });

  const [formData, setFormData] = useState({
    guardianName: "",
    studentName: "",
    className: "",
    mobile: "",
    category: "",
    priority: "Medium",
    department: "",
    assignedUser: "",
    complaintDate: new Date().toISOString().split("T")[0],
    complaintDetails: "",
    remarks: "",
    resolutionNotes: "",
    resolutionDate: "",
    status: "Open",
  });

  const filteredEmployees = employees.filter(
    (item) => item.department === formData.department
  );

  const resetForm = () => {
    setFormData({
      guardianName: "",
      studentName: "",
      className: "",
      mobile: "",
      category: "",
      priority: "Medium",
      department: "",
      assignedUser: "",
      complaintDate: new Date().toISOString().split("T")[0],
      complaintDetails: "",
      remarks: "",
      resolutionNotes: "",
      resolutionDate: "",
      status: "Open",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
      ...(name === "department" ? { assignedUser: "" } : {}),
    });
  };

  const handleSave = () => {
    if (
      !formData.guardianName ||
      !formData.studentName ||
      !formData.mobile ||
      !formData.category ||
      !formData.complaintDetails
    ) {
      alert("Please fill required fields");
      return;
    }

    const newComplaint = {
      id: Date.now(),
      complaintId: "CMP" + Date.now(),
      schoolId: "SCH001",
      ...formData,
    };

    setComplaints([...complaints, newComplaint]);

    alert("Complaint created successfully");

    resetForm();
    setShowForm(false);
    setIsSearched(true);
  };

  const handleSearch = () => {
    const filters = {
      complaintDate,
      statusFilter,
      priorityFilter,
      searchText,
    };

    setAppliedFilters(filters);

    const result = complaints.filter((item) => {
      const dateMatch = filters.complaintDate
        ? item.complaintDate === filters.complaintDate
        : true;

      const statusMatch = filters.statusFilter
        ? item.status === filters.statusFilter
        : true;

      const priorityMatch = filters.priorityFilter
        ? item.priority === filters.priorityFilter
        : true;

      const searchMatch = filters.searchText
        ? item.guardianName
            .toLowerCase()
            .includes(filters.searchText.toLowerCase()) ||
          item.studentName
            .toLowerCase()
            .includes(filters.searchText.toLowerCase()) ||
          item.mobile.includes(filters.searchText) ||
          item.complaintId
            .toLowerCase()
            .includes(filters.searchText.toLowerCase())
        : true;

      return dateMatch && statusMatch && priorityMatch && searchMatch;
    });

    if (result.length === 0) {
      alert("No complaint found");
    }

    setIsSearched(true);
    setSelectedIds([]);
  };

  const filteredComplaints = complaints.filter((item) => {
    const dateMatch = appliedFilters.complaintDate
      ? item.complaintDate === appliedFilters.complaintDate
      : true;

    const statusMatch = appliedFilters.statusFilter
      ? item.status === appliedFilters.statusFilter
      : true;

    const priorityMatch = appliedFilters.priorityFilter
      ? item.priority === appliedFilters.priorityFilter
      : true;

    const searchMatch = appliedFilters.searchText
      ? item.guardianName
          .toLowerCase()
          .includes(appliedFilters.searchText.toLowerCase()) ||
        item.studentName
          .toLowerCase()
          .includes(appliedFilters.searchText.toLowerCase()) ||
        item.mobile.includes(appliedFilters.searchText) ||
        item.complaintId
          .toLowerCase()
          .includes(appliedFilters.searchText.toLowerCase())
      : true;

    return dateMatch && statusMatch && priorityMatch && searchMatch;
  });

  const selectedComplaints = complaints.filter((item) =>
    selectedIds.includes(item.id)
  );

  const selectedSingle =
    selectedComplaints.length === 1 ? selectedComplaints[0] : null;

  const updateComplaintStatus = (status) => {
    if (!selectedSingle) {
      alert("Select one complaint");
      return;
    }

    setComplaints(
      complaints.map((item) =>
        item.id === selectedSingle.id
          ? {
              ...item,
              status,
              ...(status === "Resolved"
                ? { resolutionDate: new Date().toISOString().split("T")[0] }
                : {}),
            }
          : item
      )
    );

    setSelectedIds([]);
  };

  const handleAssign = () => updateComplaintStatus("In Progress");
  const handleResolve = () => updateComplaintStatus("Resolved");
  const handleClose = () => updateComplaintStatus("Closed");
  const handleReopen = () => updateComplaintStatus("Open");

  const handleDelete = () => {
    if (selectedIds.length === 0) {
      alert("Select complaint");
      return;
    }

    const ok = window.confirm("Delete selected complaint?");
    if (!ok) return;

    setComplaints(
      complaints.filter((item) => !selectedIds.includes(item.id))
    );

    setSelectedIds([]);
  };

  return (
    <div className="support-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => {
            if (showForm) {
              resetForm();
              setShowForm(false);
            } else {
              window.location.href = "/reception-desk";
            }
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
                <input
                  type="date"
                  value={complaintDate}
                  onChange={(e) => setComplaintDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All</option>
                  {complaintStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="">All</option>
                  {priorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Search</label>
                <input
                  type="text"
                  placeholder="Name, mobile or complaint ID"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
            </div>

            <div className="search-btn-row">
              <AppButton type="primary" onClick={handleSearch}>
                Search
              </AppButton>
            </div>
          </div>

          <div className="common-card">
            <div className="list-header">
              <h2>Complaint List</h2>

              <div className="list-action-buttons">
                <AppButton type="primary" onClick={() => setShowForm(true)}>
                  + Add Complaint
                </AppButton>

                <AppButton
                  type="view"
                  onClick={() => {
                    if (!selectedSingle) {
                      alert("Select one complaint");
                      return;
                    }

                    setViewData(selectedSingle);
                  }}
                >
                  View
                </AppButton>

                {selectedSingle?.status === "Open" && (
                  <AppButton type="primary" onClick={handleAssign}>
                    Assign
                  </AppButton>
                )}

                {selectedSingle?.status === "In Progress" && (
                  <AppButton type="primary" onClick={handleResolve}>
                    Resolve
                  </AppButton>
                )}

                {selectedSingle?.status === "Resolved" && (
                  <AppButton type="primary" onClick={handleClose}>
                    Close
                  </AppButton>
                )}

                {selectedSingle?.status === "Closed" && (
                  <AppButton type="primary" onClick={handleReopen}>
                    Reopen
                  </AppButton>
                )}

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
                          filteredComplaints.length > 0 &&
                          selectedIds.length === filteredComplaints.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(
                              filteredComplaints.map((item) => item.id)
                            );
                          } else {
                            setSelectedIds([]);
                          }
                        }}
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
                  {!isSearched ? (
                    <tr>
                      <td colSpan="10" className="empty-row">
                        Click Search to view complaints
                      </td>
                    </tr>
                  ) : filteredComplaints.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="empty-row">
                        No complaint found
                      </td>
                    </tr>
                  ) : (
                    filteredComplaints.map((item, index) => (
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
            </div>
          </div>
        </>
      )}

      {showForm && (
        <div className="common-card">
          <div className="enquiry-form-grid">
            <div className="form-group">
              <label>Guardian Name</label>
              <input
                type="text"
                name="guardianName"
                value={formData.guardianName}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Student Name</label>
              <input
                type="text"
                name="studentName"
                value={formData.studentName}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Class</label>
              <input
                type="text"
                name="className"
                value={formData.className}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Mobile</label>
              <input
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">Select Category</option>
                {complaintCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
              >
                {priorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Department</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
              >
                <option value="">Select Department</option>

                {departments.map((department) => (
                  <option
                    key={department.id}
                    value={department.departmentName}
                  >
                    {department.departmentName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Assigned User</label>
              <select
                name="assignedUser"
                value={formData.assignedUser}
                onChange={handleChange}
                disabled={!formData.department}
              >
                <option value="">Select User</option>

                {filteredEmployees.map((employee) => (
                  <option key={employee.id} value={employee.employeeName}>
                    {employee.employeeName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Complaint Date</label>
              <input
                type="date"
                name="complaintDate"
                value={formData.complaintDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group full-width">
              <label>Complaint Details</label>
              <textarea
                name="complaintDetails"
                value={formData.complaintDetails}
                onChange={handleChange}
              ></textarea>
            </div>

            <div className="form-group full-width">
              <label>Remarks</label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
              ></textarea>
            </div>
          </div>

          <div className="form-actions">
            <AppButton type="primary" onClick={handleSave}>
              Save
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
              <h2>Complaint Details</h2>

              <button
                className="popup-close-btn"
                onClick={() => setViewData(null)}
              >
                ×
              </button>
            </div>

            <div className="view-grid">
              <p>
                <strong>Complaint ID:</strong> {viewData.complaintId}
              </p>

              <p>
                <strong>Guardian:</strong> {viewData.guardianName}
              </p>

              <p>
                <strong>Student:</strong> {viewData.studentName}
              </p>

              <p>
                <strong>Class:</strong> {viewData.className || "-"}
              </p>

              <p>
                <strong>Mobile:</strong> {viewData.mobile}
              </p>

              <p>
                <strong>Category:</strong> {viewData.category}
              </p>

              <p>
                <strong>Priority:</strong> {viewData.priority}
              </p>

              <p>
                <strong>Department:</strong> {viewData.department || "-"}
              </p>

              <p>
                <strong>Assigned User:</strong> {viewData.assignedUser || "-"}
              </p>

              <p>
                <strong>Date:</strong> {viewData.complaintDate}
              </p>

              <p>
                <strong>Resolution Date:</strong>{" "}
                {viewData.resolutionDate || "-"}
              </p>

              <p>
                <strong>Status:</strong> {viewData.status}
              </p>

              <p className="full-width">
                <strong>Complaint Details:</strong>{" "}
                {viewData.complaintDetails}
              </p>

              <p className="full-width">
                <strong>Remarks:</strong> {viewData.remarks || "-"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupportComplaint;