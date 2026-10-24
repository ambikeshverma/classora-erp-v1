import React, { useState } from "react";
import "./userManagement.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";

function UserManagement() {
  const [loading, setLoading] = useState(false);

  /* ===============================
     Multi School Safe
  =============================== */

  const schoolId =
    localStorage.getItem("schoolId") ||
    "SCH001";

  /* ===============================
     Demo Roles
     (Future Super Admin Dynamic)
  =============================== */

  const userRoles = [
    "Teacher",
    "Coordinator",
    "School Admin",
    "Accountant",
    "Receptionist",
  ];

  /* ===============================
     Demo Sessions
  =============================== */

  const sessions = [
    {
      id: 1,
      sessionName: "2024-2025",
    },

    {
      id: 2,
      sessionName: "2025-2026",
    },

    {
      id: 3,
      sessionName: "2026-2027",
    },
  ];

  /* ===============================
     Demo Staff Data
  =============================== */

  const staffList = [

    {
      id: 1,
      schoolId: "SCH001",
      employeeName: "Amit Kumar",
      mobile: "9876543210",
      email: "amit@gmail.com",
      teachingStaff: "Yes",
      department: "Teaching",
      position: "Teacher",
    },

    {
      id: 2,
      schoolId: "SCH001",
      employeeName: "Rahul Verma",
      mobile: "9876500000",
      email: "rahul@gmail.com",
      teachingStaff: "No",
      department: "Accounts",
      position: "Accountant",
    },

    {
      id: 3,
      schoolId: "SCH001",
      employeeName: "Priya Singh",
      mobile: "9123456789",
      email: "priya@gmail.com",
      teachingStaff: "No",
      department: "Administration",
      position: "Receptionist",
    },

  ];

  /* ===============================
     User List
  =============================== */

  const [users, setUsers] =
    useState([

      {
        id: 1,
        schoolId: "SCH001",

        userType: "Teacher",

        userName: "amit001",

        displayName: "Amit Sir",

        mobile: "9876543210",

        email: "amit@gmail.com",

        defaultSession:
          "2026-2027",

        employeeId: 1,

        employeeName:
          "Amit Kumar",

        isActive: true,
      },

    ]);

  /* ===============================
     States
  =============================== */

  const [showForm, setShowForm] =
    useState(false);

  const [viewMode, setViewMode] =
    useState(false);

  const [editId, setEditId] =
    useState(null);

  const [selectedIds, setSelectedIds] =
    useState([]);

  const [filterData, setFilterData] =
    useState({

      userType: "",

      status: "Active Users",

    });

  const emptyForm = {

    userType: "",

    userName: "",

    displayName: "",

    mobile: "",

    email: "",

    defaultSession: "",

    employeeId: "",

    employeeName: "",

    isActive: true,

  };

  const [formData, setFormData] =
    useState(emptyForm);

  /* ===============================
     School Users
  =============================== */

  const schoolUsers =
    users.filter(
      (item) =>
        item.schoolId === schoolId
    );

  /* ===============================
     Filtered Users
  =============================== */

  const filteredUsers =
    schoolUsers.filter(
      (item) => {

        const roleMatch =
          filterData.userType
            ? item.userType ===
              filterData.userType
            : true;

        const statusMatch =

          filterData.status ===
          "Active Users"

            ? item.isActive

            : filterData.status ===
              "Inactive Users"

            ? !item.isActive

            : true;

        return (
          roleMatch &&
          statusMatch
        );
      }
    );

  /* ===============================
     Filter Staff By Role
  =============================== */

  const filteredEmployees =
    staffList.filter((item) => {

      if (
        formData.userType ===
        "Teacher"
      ) {

        return (
          item.teachingStaff ===
          "Yes"
        );
      }

      if (
        formData.userType ===
        "Accountant"
      ) {

        return (
          item.department ===
          "Accounts"
        );
      }

      if (
        formData.userType ===
        "Receptionist"
      ) {

        return (
          item.position ===
          "Receptionist"
        );
      }

      return true;
    });

  /* ===============================
     Reset Form
  =============================== */

  const resetForm = () => {

    setFormData(emptyForm);

    setEditId(null);

    setViewMode(false);

  };

  /* ===============================
     Handle Change
  =============================== */

  const handleChange = (e) => {

    const { name, value } =
      e.target;

    if (name === "employeeId") {

      const selectedEmployee =
        staffList.find(
          (item) =>
            item.id ===
            Number(value)
        );

      setFormData({

        ...formData,

        employeeId: value,

        employeeName:
          selectedEmployee?.employeeName ||
          "",

        displayName:
          selectedEmployee?.employeeName ||
          "",

        mobile:
          selectedEmployee?.mobile ||
          "",

        email:
          selectedEmployee?.email ||
          "",

      });

      return;
    }

    setFormData({

      ...formData,

      [name]: value,

    });
  };

  /* ===============================
     Save User
  =============================== */

  const handleSave = () => {

    if (

      !formData.userType ||

      !formData.userName.trim() ||

      !formData.displayName.trim() ||

      !formData.defaultSession ||

      !formData.employeeId

    ) {

      alert(
        "Please fill all required fields"
      );

      return;

    }

    const duplicateUser =
      schoolUsers.some(
        (item) =>

          item.userName
            .toLowerCase()
            .trim() ===
            formData.userName
              .toLowerCase()
              .trim() &&

          item.id !== editId
      );

    if (duplicateUser) {

      alert(
        "Username already exists"
      );

      return;

    }

    if (editId) {

      setUsers(

        users.map((item) =>

          item.id === editId

            ? {
                ...item,
                ...formData,
              }

            : item
        )
      );

      alert(
        "User updated successfully"
      );

    } else {

      const newUser = {

        id: Date.now(),

        schoolId,

        ...formData,

      };

      setUsers([
        ...users,
        newUser,
      ]);

      alert(
        "User added successfully"
      );
    }

    resetForm();

    setShowForm(false);

  };
  /* ===============================
     View User
  =============================== */

  const handleView = () => {

    if (selectedIds.length !== 1) {

      alert(
        "Select one user"
      );

      return;
    }

    const selected =
      schoolUsers.find(
        (item) =>
          item.id === selectedIds[0]
      );

    if (!selected) return;

    setFormData({
      ...emptyForm,
      ...selected,
    });

    setEditId(selected.id);

    setViewMode(true);

    setShowForm(true);

  };

  /* ===============================
     Edit User
  =============================== */

  const handleEdit = () => {

    if (selectedIds.length !== 1) {

      alert(
        "Select one user"
      );

      return;
    }

    const selected =
      schoolUsers.find(
        (item) =>
          item.id === selectedIds[0]
      );

    if (!selected) return;

    setFormData({
      ...emptyForm,
      ...selected,
    });

    setEditId(selected.id);

    setViewMode(false);

    setShowForm(true);

  };

  /* ===============================
     Reset Password
  =============================== */

  const handleResetPassword =
    (user) => {

      if (!user.email) {

        alert(
          "Email not found. Please add email before sending reset link."
        );

        return;
      }

      const ok =
        window.confirm(
          "Send password reset link to registered email?"
        );

      if (!ok) return;

      alert(
        "Password reset link sent successfully to registered email."
      );

    };

  return (

    <div className="user-management-page">

      <div className="common-page-header">

        <AppButton
          type="back"
          onClick={() => {

            if (showForm) {

              resetForm();

              setShowForm(false);

            } else {

              window.location.href =
                "/user-control";

            }

          }}
        >
          ←
        </AppButton>

        <div>

          <h1>
            {showForm
              ? viewMode
                ? "View User"
                : editId
                ? "Edit User"
                : "Add User"
              : "User Management"}
          </h1>

          <p>
            Manage login users and role based access
          </p>

        </div>

      </div>

      {!showForm && (

        <>

          <div className="common-card">

            <div className="user-filter-grid">

              <div className="form-group">

                <label>
                  User Type
                </label>

                <select
                  value={
                    filterData.userType
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    setLoading(true);
                    setFilterData({
                      ...filterData,
                      userType: val,
                    });
                    setTimeout(() => setLoading(false), 250);
                  }}
                >
                  <option value="">
                    All Users
                  </option>

                  {userRoles.map(
                    (role) => (

                      <option
                        key={role}
                        value={role}
                      >
                        {role}
                      </option>

                    )
                  )}

                </select>

              </div>

              <div className="form-group">

                <label>
                  Status
                </label>

                <select
                  value={
                    filterData.status
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    setLoading(true);
                    setFilterData({
                      ...filterData,
                      status: val,
                    });
                    setTimeout(() => setLoading(false), 250);
                  }}
                >
                  <option>
                    Active Users
                  </option>

                  <option>
                    Inactive Users
                  </option>

                  <option>
                    All Users
                  </option>

                </select>

              </div>

            </div>

          </div>

          <div className="user-security-note">

            <p>
              <strong>NOTE:</strong>{" "}
              As per DPDP Act and security guidelines,
              passwords are never visible or stored in readable format.
              Users can securely reset their password only through the
              registered email using the password reset link.
            </p>

            <button
              onClick={() =>
                window.open(
                  "https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf",
                  "_blank"
                )
              }
            >
              📄 View Guidelines
            </button>

          </div>

          <div className="common-card">

            <div className="list-header">

              <h2>
                User List
              </h2>

              <div className="list-action-buttons">

                <AppButton
                  type="primary"
                  onClick={handleView}
                >
                  View
                </AppButton>

                <AppButton
                  type="primary"
                  onClick={handleEdit}
                >
                  Edit
                </AppButton>

                <AppButton
                  type="primary"
                  onClick={() => {

                    resetForm();

                    setShowForm(true);

                  }}
                >
                  + Add User
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
                          filteredUsers.length >
                            0 &&
                          selectedIds.length ===
                            filteredUsers.length
                        }
                        onChange={(e) => {

                          if (e.target.checked) {

                            setSelectedIds(
                              filteredUsers.map(
                                (item) =>
                                  item.id
                              )
                            );

                          } else {

                            setSelectedIds([]);

                          }

                        }}
                      />

                    </th>

                    <th>
                      S.No
                    </th>

                    <th>
                      User Type
                    </th>

                    <th>
                      User Name
                    </th>

                    <th>
                      Display Name
                    </th>

                    <th>
                      Mobile
                    </th>

                    <th>
                      Email
                    </th>

                    <th>
                      Default Session
                    </th>

                    <th>
                      Employee Name
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Reset Password
                    </th>

                  </tr>

                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="11" style={{ padding: "4px 0", border: "none" }}>
                        <SkeletonTable rows={5} columns={11} />
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (

                    <tr>

                      <td
                        colSpan="11"
                        className="empty-row"
                      >
                        No user found
                      </td>

                    </tr>

                  ) : (

                    filteredUsers.map(
                      (
                        item,
                        index
                      ) => (

                        <tr key={item.id}>

                          <td>

                            <input
                              type="checkbox"
                              checked={selectedIds.includes(
                                item.id
                              )}
                              onChange={() => {

                                setSelectedIds(
                                  (
                                    prev
                                  ) =>

                                    prev.includes(
                                      item.id
                                    )

                                      ? prev.filter(
                                          (
                                            id
                                          ) =>
                                            id !==
                                            item.id
                                        )

                                      : [
                                          ...prev,
                                          item.id,
                                        ]
                                );

                              }}
                            />

                          </td>

                          <td>
                            {index + 1}
                          </td>

                          <td>
                            {item.userType}
                          </td>

                          <td>
                            {item.userName}
                          </td>

                          <td>
                            {item.displayName}
                          </td>

                          <td>
                            {item.mobile || "-"}
                          </td>

                          <td>
                            {item.email || "-"}
                          </td>

                          <td>
                            {item.defaultSession}
                          </td>

                          <td>
                            {item.employeeName}
                          </td>

                          <td>
                            {item.isActive
                              ? "Active"
                              : "Inactive"}
                          </td>

                          <td>

                            <button
                              className="reset-icon-btn"
                              onClick={() =>
                                handleResetPassword(
                                  item
                                )
                              }
                              title="Reset Password"
                            >
                              ⚙
                            </button>

                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

          </div>

        </>

      )}

      {showForm && (

        <div className="common-card">

          <div className="user-form-grid">

            <div className="form-group">

              <label>
                User Type *
              </label>

              <select
                name="userType"
                value={formData.userType}
                disabled={viewMode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    userType:
                      e.target.value,
                    employeeId: "",
                    employeeName: "",
                    displayName: "",
                    mobile: "",
                    email: "",
                  })
                }
              >
                <option value="">
                  Select User Type
                </option>

                {userRoles.map(
                  (role) => (

                    <option
                      key={role}
                      value={role}
                    >
                      {role}
                    </option>

                  )
                )}

              </select>

            </div>

            <div className="form-group">

              <label>
                Employee *
              </label>

              <select
                name="employeeId"
                value={
                  formData.employeeId
                }
                disabled={
                  viewMode ||
                  !formData.userType
                }
                onChange={handleChange}
              >
                <option value="">
                  Select Employee
                </option>

                {filteredEmployees.map(
                  (employee) => (

                    <option
                      key={employee.id}
                      value={employee.id}
                    >
                      {employee.employeeName}
                    </option>

                  )
                )}

              </select>

            </div>

            <div className="form-group">

              <label>
                User Name *
              </label>

              <input
                name="userName"
                value={
                  formData.userName
                }
                disabled={viewMode}
                onChange={handleChange}
                placeholder="Enter username"
              />

            </div>

            <div className="form-group">

              <label>
                Display Name *
              </label>

              <input
                name="displayName"
                value={
                  formData.displayName
                }
                disabled={viewMode}
                onChange={handleChange}
                placeholder="Enter display name"
              />

            </div>

            <div className="form-group">

              <label>
                Mobile No
              </label>

              <input
                name="mobile"
                value={
                  formData.mobile
                }
                disabled
              />

            </div>

            <div className="form-group">

              <label>
                Email
              </label>

              <input
                name="email"
                value={
                  formData.email
                }
                disabled
              />

            </div>

            <div className="form-group">

              <label>
                Default Session *
              </label>

              <select
                name="defaultSession"
                value={
                  formData.defaultSession
                }
                disabled={viewMode}
                onChange={handleChange}
              >
                <option value="">
                  Select Session
                </option>

                {sessions.map(
                  (session) => (

                    <option
                      key={session.id}
                      value={
                        session.sessionName
                      }
                    >
                      {
                        session.sessionName
                      }
                    </option>

                  )
                )}

              </select>

            </div>

            <div className="form-group">

              <label>
                Status
              </label>

              <label className="active-checkbox-row">

                <input
                  type="checkbox"
                  checked={
                    formData.isActive
                  }
                  disabled={viewMode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isActive:
                        e.target.checked,
                    })
                  }
                />

                <span>
                  Active
                </span>

              </label>

            </div>

          </div>

          <div className="form-actions">

            {!viewMode && (

              <AppButton
                type="primary"
                onClick={handleSave}
              >
                {editId
                  ? "Update"
                  : "Save"}
              </AppButton>

            )}

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

export default UserManagement;