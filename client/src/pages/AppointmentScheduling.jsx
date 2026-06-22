import React, { useState } from "react";
import "./appointmentScheduling.css";
import AppButton from "../components/AppButton";

function AppointmentScheduling() {

const appointmentStatuses = [
"Pending",
"Approved",
"Rejected",
"Completed",
"Cancelled",
];

const departments = [
  { id: 1, schoolId: "SCH001", departmentName: "Administration" },
  { id: 2, schoolId: "SCH001", departmentName: "Teaching" },
  { id: 3, schoolId: "SCH001", departmentName: "Accounts" },
  { id: 4, schoolId: "SCH001", departmentName: "Transport" },
];

const staffMembers = [
  { id: 1, schoolId: "SCH001", departmentId: 1, staffName: "Principal" },
  { id: 2, schoolId: "SCH001", departmentId: 2, staffName: "Ankit Verma" },
  { id: 3, schoolId: "SCH001", departmentId: 3, staffName: "Account Office" },
  { id: 4, schoolId: "SCH001", departmentId: 4, staffName: "Transport Incharge" },
];

const [showForm, setShowForm] =
useState(false);

const [appointments, setAppointments] =
useState([]);

const [selectedIds, setSelectedIds] =
useState([]);

const [viewData, setViewData] =
useState(null);

const [appointmentDate, setAppointmentDate] =
useState("");

const [statusFilter, setStatusFilter] =
useState("");

const [searchText, setSearchText] =
useState("");

const [isSearched, setIsSearched] =
useState(false);

const [appliedFilters, setAppliedFilters] =
useState({
appointmentDate: "",
statusFilter: "",
searchText: "",
});

const [formData, setFormData] =
useState({
visitorName: "",
mobile: "",
departmentId: "",
personToMeetId: "",
appointmentDate:
new Date()
.toISOString()
.split("T")[0],
timeSlot: "",
purpose: "",
remarks: "",
status: "Pending",
});

const resetForm = () => {

setFormData({
visitorName: "",
mobile: "",
departmentId: "",
personToMeetId: "",
appointmentDate:
new Date()
.toISOString()
.split("T")[0],
timeSlot: "",
purpose: "",
remarks: "",
status: "Pending",
});

};

const handleChange = (e) => {

const { name, value } = e.target;

setFormData({
...formData,
[name]: value,
...(name === "departmentId"
  ? { personToMeetId: "" }
  : {}),
});

};

const filteredStaff = staffMembers.filter(
  (item) =>
    formData.departmentId &&
    item.departmentId === Number(formData.departmentId)
);

const getDepartmentName = (id) =>
  departments.find(
    (item) => item.id === Number(id)
  )?.departmentName || "-";

const getStaffName = (id) =>
  staffMembers.find(
    (item) => item.id === Number(id)
  )?.staffName || "-";

const handleSave = () => {

if (
!formData.visitorName ||
!formData.mobile ||
!formData.departmentId ||
!formData.personToMeetId ||
!formData.timeSlot
) {
alert(
"Please fill required fields"
);
return;
}

const newAppointment = {
id: Date.now(),
appointmentId:
"APT" + Date.now(),
schoolId: "SCH001",
...formData,
};

setAppointments([
...appointments,
newAppointment,
]);

alert(
"Appointment created successfully"
);

resetForm();
setShowForm(false);
setIsSearched(true);

};

const handleSearch = () => {

  const filters = {
    appointmentDate,
    statusFilter,
    searchText,
  };

  setAppliedFilters(filters);

  const result =
    appointments.filter((item) => {

      const dateMatch =
        filters.appointmentDate
          ? item.appointmentDate ===
            filters.appointmentDate
          : true;

      const statusMatch =
        filters.statusFilter
          ? item.status ===
            filters.statusFilter
          : true;

      const searchMatch =
        filters.searchText
          ? item.visitorName
              .toLowerCase()
              .includes(
                filters.searchText.toLowerCase()
              ) ||
            item.mobile.includes(
              filters.searchText
            )
          : true;

      return (
        dateMatch &&
        statusMatch &&
        searchMatch
      );

    });

  if (result.length === 0) {

    alert(
      "No appointment found"
    );

  }

  setIsSearched(true);

};

const filteredAppointments =
appointments.filter((item) => {

const dateMatch =
appliedFilters.appointmentDate
? item.appointmentDate ===
appliedFilters.appointmentDate
: true;

const statusMatch =
appliedFilters.statusFilter
? item.status ===
appliedFilters.statusFilter
: true;

const searchMatch =
    appliedFilters.searchText
      ? item.visitorName
          .toLowerCase()
          .includes(
            appliedFilters.searchText.toLowerCase()
          ) ||
        item.mobile.includes(
          appliedFilters.searchText
        )
      : true;

  return (
    dateMatch &&
    statusMatch &&
    searchMatch
  );

});

const selectedAppointments =
  appointments.filter((item) =>
    selectedIds.includes(item.id)
  );

const selectedSingle =
  selectedAppointments.length === 1
    ? selectedAppointments[0]
    : null;

const handleApprove = () => {

  if (!selectedSingle) {
    alert(
      "Select one appointment"
    );
    return;
  }

  setAppointments(
    appointments.map((item) =>
      item.id === selectedSingle.id
        ? {
            ...item,
            status: "Approved",
          }
        : item
    )
  );

  setSelectedIds([]);

};

const handleReject = () => {

  if (!selectedSingle) {
    alert(
      "Select one appointment"
    );
    return;
  }

  setAppointments(
    appointments.map((item) =>
      item.id === selectedSingle.id
        ? {
            ...item,
            status: "Rejected",
          }
        : item
    )
  );

  setSelectedIds([]);

};

const handleComplete = () => {

  if (!selectedSingle) {
    alert(
      "Select one appointment"
    );
    return;
  }

  setAppointments(
    appointments.map((item) =>
      item.id === selectedSingle.id
        ? {
            ...item,
            status: "Completed",
          }
        : item
    )
  );

  setSelectedIds([]);

};

const handleCancel = () => {

  if (!selectedSingle) {
    alert(
      "Select one appointment"
    );
    return;
  }

  setAppointments(
    appointments.map((item) =>
      item.id === selectedSingle.id
        ? {
            ...item,
            status: "Cancelled",
          }
        : item
    )
  );

  setSelectedIds([]);

};

const handleDelete = () => {

  if (selectedIds.length === 0) {
    alert(
      "Select appointment"
    );
    return;
  }

  const ok = window.confirm(
    "Delete selected appointment?"
  );

  if (!ok) return;

  setAppointments(
    appointments.filter(
      (item) =>
        !selectedIds.includes(
          item.id
        )
    )
  );

  setSelectedIds([]);

};

return (<div className="appointment-page">

  <div className="common-page-header">

    <AppButton
      type="back"
      onClick={() => {

        if (showForm) {

          resetForm();
          setShowForm(false);

        } else {

          window.location.href =
            "/reception-desk";

        }

      }}
    >
      ←
    </AppButton>

    <div>

      <h1>
        Appointment Scheduling
      </h1>

      <p>
        Manage visitor appointments
      </p>

    </div>

  </div>

  {!showForm && (

    <>

      <div className="common-card">

        <div className="filter-grid">

          <div className="form-group">

            <label>
              Appointment Date
            </label>

            <input
              type="date"
              value={appointmentDate}
              onChange={(e) =>
                setAppointmentDate(
                  e.target.value
                )
              }
            />

          </div>

          <div className="form-group">

            <label>
              Status
            </label>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
            >

              <option value="">
                All
              </option>

              {appointmentStatuses.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                )
              )}

            </select>

          </div>

          <div className="form-group">

            <label>
              Search
            </label>

            <input
              type="text"
              placeholder="Name or mobile"
              value={searchText}
              onChange={(e) =>
                setSearchText(
                  e.target.value
                )
              }
            />

          </div>

        </div>

        <div className="search-btn-row">

          <AppButton
            type="primary"
            onClick={handleSearch}
          >
            Search
          </AppButton>

        </div>

      </div>

      <div className="common-card">

        <div className="list-header">

          <h2>
            Appointment List
          </h2>

          <div className="list-action-buttons">

            <AppButton
              type="primary"
              onClick={() =>
                setShowForm(true)
              }
            >
              + Add Appointment
            </AppButton>

            <AppButton
              type="view"
              onClick={() => {

                if (!selectedSingle) {

                  alert(
                    "Select one appointment"
                  );

                  return;

                }

                setViewData(
                  selectedSingle
                );

              }}
            >
              View
            </AppButton>

            {selectedSingle?.status ===
              "Pending" && (

              <>

                <AppButton
                  type="primary"
                  onClick={
                    handleApprove
                  }
                >
                  Approve
                </AppButton>

                <AppButton
                  type="delete"
                  onClick={
                    handleReject
                  }
                >
                  Reject
                </AppButton>

              </>

            )}

            {selectedSingle?.status ===
              "Approved" && (

              <>

                <AppButton
                  type="primary"
                  onClick={
                    handleComplete
                  }
                >
                  Complete
                </AppButton>

                <AppButton
                  type="delete"
                  onClick={
                    handleCancel
                  }
                >
                  Cancel
                </AppButton>

              </>

            )}

            <AppButton
              type="delete"
              onClick={
                handleDelete
              }
            >
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
                      filteredAppointments.length >
                        0 &&
                      selectedIds.length ===
                        filteredAppointments.length
                    }
                    onChange={(e) => {

                      if (
                        e.target.checked
                      ) {

                        setSelectedIds(
                          filteredAppointments.map(
                            (item) =>
                              item.id
                          )
                        );

                      } else {

                        setSelectedIds(
                          []
                        );

                      }

                    }}
                  />

                </th>

                <th>
                  S.No
                </th>

                <th>
                  Appointment ID
                </th>

                <th>
                  Visitor
                </th>

                <th>
                  Mobile
                </th>

                <th>
                  Person To Meet
                </th>

                <th>
                  Department
                </th>

                <th>
                  Date
                </th>

                <th>
                  Time Slot
                </th>

                <th>
                  Status
                </th>

              </tr>

            </thead>

           <tbody>

  {!isSearched ? (

    <tr>
      <td colSpan="10" className="empty-row">
        Click Search to view appointments
      </td>
    </tr>

  ) : filteredAppointments.length === 0 ? (

    <tr>
      <td colSpan="10" className="empty-row">
        No appointment found
      </td>
    </tr>

  ) : (

    filteredAppointments.map((item, index) => (

      <tr key={item.id}>

        <td>

          <input
            type="checkbox"
            checked={selectedIds.includes(item.id)}
            onChange={() => {

              setSelectedIds((prev) =>

                prev.includes(item.id)
                  ? prev.filter(
                      (id) => id !== item.id
                    )
                  : [...prev, item.id]

              );

            }}
          />

        </td>

        <td>{index + 1}</td>

        <td>{item.appointmentId}</td>

        <td>{item.visitorName}</td>

        <td>{item.mobile}</td>

        <td>
          {getStaffName(item.personToMeetId)}
        </td>

        <td>
          {getDepartmentName(item.departmentId)}
        </td>

        <td>{item.appointmentDate}</td>

        <td>{item.timeSlot}</td>

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

          <label>
            Visitor Name
          </label>

          <input
            type="text"
            name="visitorName"
            value={
              formData.visitorName
            }
            onChange={handleChange}
          />

        </div>

        <div className="form-group">

          <label>
            Mobile
          </label>

          <input
            type="text"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
          />

        </div>

        <div className="form-group">

          <label>
            Department
          </label>

          <select
            name="departmentId"
            value={formData.departmentId}
            onChange={handleChange}
          >

            <option value="">
              Select Department
            </option>

            {departments.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.departmentName}
              </option>
            ))}

          </select>

        </div>

        <div className="form-group">

          <label>
            Person To Meet
          </label>

          <select
            name="personToMeetId"
            value={formData.personToMeetId}
            onChange={handleChange}
            disabled={!formData.departmentId}
          >

            <option value="">
              Select Person
            </option>

            {filteredStaff.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.staffName}
              </option>
            ))}

          </select>

        </div>

        <div className="form-group">

          <label>
            Appointment Date
          </label>

          <input
            type="date"
            name="appointmentDate"
            value={
              formData.appointmentDate
            }
            onChange={handleChange}
          />

        </div>

        <div className="form-group">

          <label>
            Time Slot
          </label>

          <input
            type="text"
            name="timeSlot"
            placeholder="10:00 AM"
            value={
              formData.timeSlot
            }
            onChange={handleChange}
          />

        </div>

        <div className="form-group full-width">

          <label>
            Purpose
          </label>

          <textarea
            name="purpose"
            value={formData.purpose}
            onChange={handleChange}
          ></textarea>

        </div>

        <div className="form-group full-width">

          <label>
            Remarks
          </label>

          <textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
          ></textarea>

        </div>

      </div>

      <div className="form-actions">

        <AppButton
          type="primary"
          onClick={handleSave}
        >
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

          <h2>
            Appointment Details
          </h2>

          <button
            className="popup-close-btn"
            onClick={() =>
              setViewData(null)
            }
          >
            ×
          </button>

        </div>

        <div className="view-grid">

          <p>

            <strong>
              Appointment ID:
            </strong>

            {" "}

            {
              viewData.appointmentId
            }

          </p>

          <p>

            <strong>
              Visitor:
            </strong>

            {" "}

            {
              viewData.visitorName
            }

          </p>

          <p>

            <strong>
              Mobile:
            </strong>

            {" "}

            {
              viewData.mobile
            }

          </p>

          <p>

            <strong>
              Person To Meet:
            </strong>

            {" "}

            {
              getStaffName(viewData.personToMeetId)
            }

          </p>

          <p>

            <strong>
              Department:
            </strong>

            {" "}

            {
              getDepartmentName(viewData.departmentId)
            }

          </p>

          <p>

            <strong>
              Appointment Date:
            </strong>

            {" "}

            {
              viewData.appointmentDate
            }

          </p>

          <p>

            <strong>
              Time Slot:
            </strong>

            {" "}

            {
              viewData.timeSlot
            }

          </p>

          <p>

            <strong>
              Status:
            </strong>

            {" "}

            {
              viewData.status
            }

          </p>

          <p className="full-width">

            <strong>
              Purpose:
            </strong>

            {" "}

            {
              viewData.purpose ||
              "-"
            }

          </p>

          <p className="full-width">

            <strong>
              Remarks:
            </strong>

            {" "}

            {
              viewData.remarks ||
              "-"
            }

          </p>

        </div>

      </div>

    </div>

  )}

</div>

);

}

export default AppointmentScheduling;