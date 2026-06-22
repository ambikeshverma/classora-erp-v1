import React, { useState } from "react";
import "./visitorManagement.css";
import AppButton from "../components/AppButton";

function VisitorManagement() {
  const demoAppointments = [
    {
      id: 1,
      appointmentId: "APT001",
      visitorName: "Ramesh Kumar",
      mobile: "9876543210",
      purpose: "Admission enquiry",
      whomToMeet: "Principal",
      department: "Admin",
      status: "Approved",
    },
    {
      id: 2,
      appointmentId: "APT002",
      visitorName: "Sunita Devi",
      mobile: "9876543211",
      purpose: "Fee discussion",
      whomToMeet: "Account Office",
      department: "Finance",
      status: "Approved",
    },
  ];

  const departmentOptions = {
    Admin: ["Principal", "Vice Principal"],
    Finance: ["Account Office", "Accountant"],
    Academic: ["Coordinator", "Teacher"],
    Transport: ["Transport Incharge", "Driver"],
  };

  const visitorStatuses = ["Waiting", "Inside Campus", "Exited", "Cancelled"];
  const visitorTypes = ["Walk-In Visitor", "Appointment Visitor"];

  const [showForm, setShowForm] = useState(false);
  const [visitors, setVisitors] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewData, setViewData] = useState(null);

  const [visitDate, setVisitDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [searchText, setSearchText] = useState("");

  const [isSearched, setIsSearched] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({
    visitDate: "",
    statusFilter: "",
    typeFilter: "",
    searchText: "",
  });

  const [formData, setFormData] = useState({
    visitorType: "Walk-In Visitor",
    appointmentId: "",
    visitorName: "",
    mobile: "",
    address: "",
    purpose: "",
    whomToMeet: "",
    department: "",
    idProof: "",
    remarks: "",
    visitDate: new Date().toISOString().split("T")[0],
    inTime: "",
    outTime: "",
    status: "Waiting",
  });

  const selectedVisitors = visitors.filter((item) =>
    selectedIds.includes(item.id)
  );

  const selectedSingle =
    selectedVisitors.length === 1 ? selectedVisitors[0] : null;

  const handleCheckIn = () => {
    if (!selectedSingle) {
      alert("Select one visitor");
      return;
    }

    setVisitors(
      visitors.map((item) =>
        item.id === selectedSingle.id
          ? {
              ...item,
              status: "Inside Campus",
              inTime: new Date().toLocaleTimeString(),
            }
          : item
      )
    );

   setSelectedIds([]);
  };

  const handleCheckOut = () => {
    if (!selectedSingle) {
      alert("Select one visitor");
      return;
    }

    setVisitors(
      visitors.map((item) =>
        item.id === selectedSingle.id
          ? {
              ...item,
              status: "Exited",
              outTime: new Date().toLocaleTimeString(),
            }
          : item
      )
    );

    setSelectedIds([]);
  };
const handlePrintPass = () => {
  if (!selectedSingle) {
    alert("Select one visitor");
    return;
  }

  alert("Visitor pass printed successfully");
};

const handleReprintPass = () => {
  if (!selectedSingle) {
    alert("Select one visitor");
    return;
  }

  alert("Visitor pass reprinted successfully");
};
  const handleDelete = () => {
    if (selectedIds.length === 0) {
      alert("Select visitor");
      return;
    }

    const ok = window.confirm("Delete selected visitor?");
    if (!ok) return;

    setVisitors(visitors.filter((item) => !selectedIds.includes(item.id)));

    setSelectedIds([]);
  };

  const filteredVisitors = visitors.filter((item) => {
    const dateMatch = appliedFilters.visitDate
      ? item.visitDate === appliedFilters.visitDate
      : true;

    const statusMatch = appliedFilters.statusFilter
      ? item.status === appliedFilters.statusFilter
      : true;

    const typeMatch = appliedFilters.typeFilter
      ? item.visitorType === appliedFilters.typeFilter
      : true;

    const searchMatch = appliedFilters.searchText
      ? item.visitorName
          .toLowerCase()
          .includes(appliedFilters.searchText.toLowerCase()) ||
        item.mobile.includes(appliedFilters.searchText)
      : true;

    return dateMatch && statusMatch && typeMatch && searchMatch;
  });

  const handleSearch = () => {
    setAppliedFilters({
      visitDate,
      statusFilter,
      typeFilter,
      searchText,
    });

    setIsSearched(true);
    setSelectedIds([]);

    const result = visitors.filter((item) => {
      const dateMatch = visitDate ? item.visitDate === visitDate : true;
      const statusMatch = statusFilter ? item.status === statusFilter : true;
      const typeMatch = typeFilter ? item.visitorType === typeFilter : true;

      const searchMatch = searchText
        ? item.visitorName.toLowerCase().includes(searchText.toLowerCase()) ||
          item.mobile.includes(searchText)
        : true;

      return dateMatch && statusMatch && typeMatch && searchMatch;
    });

    if (result.length === 0) {
      alert("No visitor found");
    }
  };

  const resetForm = () => {
    setFormData({
      visitorType: "Walk-In Visitor",
      appointmentId: "",
      visitorName: "",
      mobile: "",
      address: "",
      purpose: "",
      whomToMeet: "",
      department: "",
      idProof: "",
      remarks: "",
      visitDate: new Date().toISOString().split("T")[0],
      inTime: "",
      outTime: "",
      status: "Waiting",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "department" ? { whomToMeet: "" } : {}),
    }));
  };

  const handleAppointmentSelect = (e) => {
    const appointment = demoAppointments.find(
      (item) => item.appointmentId === e.target.value
    );

    if (!appointment) return;

    setFormData((prev) => ({
      ...prev,
      visitorType: "Appointment Visitor",
      appointmentId: appointment.appointmentId,
      visitorName: appointment.visitorName,
      mobile: appointment.mobile,
      purpose: appointment.purpose,
      whomToMeet: appointment.whomToMeet,
      department: appointment.department,
      status: "Waiting",
    }));
  };

  const handleSave = () => {
    if (!formData.visitorName || !formData.mobile) {
      alert("Visitor name and mobile are required");
      return;
    }

    if (
      formData.visitorType === "Appointment Visitor" &&
      visitors.some((item) => item.appointmentId === formData.appointmentId)
    ) {
      alert("This appointment visitor is already checked in.");
      return;
    }

    const newVisitor = {
      ...formData,
      id: Date.now(),
    };

    setVisitors((prev) => [...prev, newVisitor]);

    resetForm();
    setShowForm(false);
    setIsSearched(false);
  };

  return (
    <div className="visitor-page">
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
          <h1>Visitor Management</h1>

          <p>
            Manage visitor entry,
            check-in and check-out
          </p>
        </div>
      </div>

      {!showForm && (
        <>
          <div className="common-card">
            <div className="filter-grid">
              <div className="form-group">
                <label>Visit Date</label>

                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => {
                    setVisitDate(e.target.value);
                  }}
                />
              </div>

              <div className="form-group">
                <label>Visitor Status</label>

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                  }}
                >
                  <option value="">All</option>

                  {visitorStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Visitor Type</label>

                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                  }}
                >
                  <option value="">All</option>

                  {visitorTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Search</label>

                <input
                  type="text"
                  placeholder="Name or mobile"
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value);
                  }}
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
              <h2>Visitor List</h2>

              <div className="list-action-buttons">
                <AppButton type="primary" onClick={() => setShowForm(true)}>
                  + Add Visitor
                </AppButton>

                <AppButton
                  type="view"
                  onClick={() => {
                    if (!selectedSingle) {
                      alert("Select one visitor");
                      return;
                    }

                    setViewData(selectedSingle);
                  }}
                >
                  View
                </AppButton>

                {selectedSingle?.status === "Waiting" ? (
  <AppButton type="primary" onClick={handleCheckIn}>
    Check-In
  </AppButton>
) : selectedSingle?.status === "Inside Campus" ? (
  <>
    <AppButton type="primary" onClick={handlePrintPass}>
      Print Pass
    </AppButton>

    <AppButton type="primary" onClick={handleCheckOut}>
      Check-Out
    </AppButton>
  </>
) : selectedSingle?.status === "Exited" ? (
  <AppButton type="primary" onClick={handleReprintPass}>
    Reprint Pass
  </AppButton>
) : null}

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
                          filteredVisitors.length > 0 &&
                          selectedIds.length === filteredVisitors.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(
                              filteredVisitors.map((item) => item.id)
                            );
                          } else {
                            setSelectedIds([]);
                          }
                        }}
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
                  {!isSearched ? (
                    <tr>
                      <td colSpan="10" className="empty-row">
                        Click Search to view visitors
                      </td>
                    </tr>
                  ) : filteredVisitors.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="empty-row">
                        No visitor found
                      </td>
                    </tr>
                  ) : (
                    filteredVisitors.map((item, index) => (
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
                        <td>{item.visitorName}</td>
                        <td>{item.mobile}</td>
                        <td>{item.purpose}</td>
                        <td>{item.whomToMeet}</td>
                        <td>{item.inTime || "-"}</td>
                        <td>{item.outTime || "-"}</td>
                        <td>{item.status}</td>
                        <td>{item.visitorType}</td>
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
              <label>Visitor Type</label>

              <select
                name="visitorType"
                value={formData.visitorType}
                onChange={handleChange}
              >
                {visitorTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {formData.visitorType === "Appointment Visitor" && (
              <div className="form-group">
                <label>Select Appointment</label>

                <select onChange={handleAppointmentSelect}>
                  <option value="">Select Appointment</option>

                  {demoAppointments
                    .filter((item) => item.status === "Approved")
                    .map((item) => (
                      <option key={item.id} value={item.appointmentId}>
                        {item.visitorName}
                        {" - "}
                        {item.whomToMeet}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Visitor Name</label>

              <input
                type="text"
                name="visitorName"
                value={formData.visitorName}
                onChange={handleChange}
                readOnly={formData.visitorType === "Appointment Visitor"}
              />
            </div>

            <div className="form-group">
              <label>Mobile</label>

              <input
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                readOnly={formData.visitorType === "Appointment Visitor"}
              />
            </div>

            <div className="form-group">
              <label>Purpose</label>

              <input
                type="text"
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                readOnly={formData.visitorType === "Appointment Visitor"}
              />
            </div>

            {formData.visitorType === "Walk-In Visitor" ? (
              <>
                <div className="form-group">
                  <label>Department</label>

                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                  >
                    <option value="">Select Department</option>

                    {Object.keys(departmentOptions).map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Whom To Meet</label>

                  <select
                    name="whomToMeet"
                    value={formData.whomToMeet}
                    onChange={handleChange}
                    disabled={!formData.department}
                  >
                    <option value="">Select Person</option>

                    {(departmentOptions[formData.department] || []).map(
                      (person) => (
                        <option key={person} value={person}>
                          {person}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>Whom To Meet</label>

                  <input
                    type="text"
                    name="whomToMeet"
                    value={formData.whomToMeet}
                    onChange={handleChange}
                    readOnly
                  />
                </div>

                <div className="form-group">
                  <label>Department</label>

                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    readOnly
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label>Address</label>

              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>ID Proof</label>

              <input
                type="text"
                name="idProof"
                value={formData.idProof}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Visit Date</label>

              <input
                type="date"
                name="visitDate"
                value={formData.visitDate}
                onChange={handleChange}
              />
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
              <h2>Visitor Details</h2>

              <button
                className="popup-close-btn"
                onClick={() => setViewData(null)}
              >
                ×
              </button>
            </div>

            <div className="view-grid">
              <p>
                <strong>Visitor:</strong> {viewData.visitorName}
              </p>

              <p>
                <strong>Mobile:</strong> {viewData.mobile}
              </p>

              <p>
                <strong>Purpose:</strong> {viewData.purpose}
              </p>

              <p>
                <strong>Whom To Meet:</strong> {viewData.whomToMeet}
              </p>

              <p>
                <strong>Department:</strong> {viewData.department}
              </p>

              <p>
                <strong>Address:</strong> {viewData.address}
              </p>

              <p>
                <strong>ID Proof:</strong> {viewData.idProof}
              </p>

              <p>
                <strong>Visit Date:</strong> {viewData.visitDate}
              </p>

              <p>
                <strong>In Time:</strong> {viewData.inTime || "-"}
              </p>

              <p>
                <strong>Out Time:</strong> {viewData.outTime || "-"}
              </p>

              <p>
                <strong>Status:</strong> {viewData.status}
              </p>

              <p>
                <strong>Visitor Type:</strong> {viewData.visitorType}
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

export default VisitorManagement;