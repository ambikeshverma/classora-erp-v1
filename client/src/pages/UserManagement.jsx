import React, { useState, useEffect, useCallback } from "react";
import "./userManagement.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { userControlService } from "../services/api";

function UserManagement() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const userRoles = [
    "Teacher",
    "Coordinator",
    "School Admin",
    "Accountant",
    "Receptionist",
  ];

  const sessions = [
    { id: 1, sessionName: "2024-2025" },
    { id: 2, sessionName: "2025-2026" },
    { id: 3, sessionName: "2026-2027" },
  ];

  const [filterData, setFilterData] = useState({
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

  const [formData, setFormData] = useState(emptyForm);

  /* ===============================
     Fetch Meta (Staff for dropdowns) - once on mount
  =============================== */
  const fetchMeta = async () => {
    try {
      const res = await userControlService.getMeta();
      if (res.data?.success) {
        setStaffList(res.data.data.allStaff || []);
      }
    } catch (err) {
      console.error("Failed to load user management meta:", err);
    }
  };

  /* ===============================
     Fetch Users (Filtered)
  =============================== */
  const fetchUsers = useCallback(async (filters) => {
    try {
      setLoading(true);
      const params = {};
      if (filters.userType) params.userType = filters.userType;
      if (filters.status) params.status = filters.status;

      const res = await userControlService.getUsers(params);
      if (res.data?.success) {
        setUsers(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchUsers(filterData);
  }, [fetchUsers, filterData]);

  /* ===============================
     Filter Staff By Role
  =============================== */
  const filteredEmployees = staffList.filter((item) => {
    if (formData.userType === "Teacher") {
      return item.teachingStaff === "Yes";
    }
    if (formData.userType === "Accountant") {
      const deptName =
        item.departmentId?.departmentName || item.departmentName || "";
      return deptName.toLowerCase().includes("account");
    }
    if (formData.userType === "Receptionist") {
      const posName =
        item.positionId?.positionName || item.positionName || "";
      return posName.toLowerCase().includes("reception");
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
    const { name, value } = e.target;

    if (name === "employeeId") {
      const selectedEmployee = staffList.find(
        (item) => (item._id || item.id) === value
      );

      setFormData({
        ...formData,
        employeeId: value,
        employeeName: selectedEmployee?.employeeName || "",
        displayName: selectedEmployee?.employeeName || "",
        mobile: selectedEmployee?.mobile || "",
        email: selectedEmployee?.email || "",
      });
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  /* ===============================
     Save User (Create / Update)
  =============================== */
  const handleSave = async () => {
    if (
      !formData.userType ||
      !formData.userName.trim() ||
      !formData.displayName.trim() ||
      !formData.defaultSession ||
      !formData.employeeId
    ) {
      alert("Please fill all required fields");
      return;
    }

    try {
      if (editId) {
        const res = await userControlService.updateUser(editId, formData);
        if (res.data?.success) {
          alert("User updated successfully");
          setUsers((prev) =>
            prev.map((item) =>
              (item._id || item.id) === editId ? res.data.data : item
            )
          );
        }
      } else {
        const res = await userControlService.createUser(formData);
        if (res.data?.success) {
          alert("User added successfully");
          setUsers((prev) => [res.data.data, ...prev]);
        }
      }

      resetForm();
      setShowForm(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save user");
    }
  };

  /* ===============================
     View User
  =============================== */
  const handleView = () => {
    if (selectedIds.length !== 1) {
      alert("Select one user");
      return;
    }

    const selected = users.find(
      (item) => (item._id || item.id) === selectedIds[0]
    );
    if (!selected) return;

    setFormData({
      ...emptyForm,
      ...selected,
      employeeId: selected.employeeId?._id || selected.employeeId || "",
    });
    setEditId(selected._id || selected.id);
    setViewMode(true);
    setShowForm(true);
  };

  /* ===============================
     Edit User
  =============================== */
  const handleEdit = () => {
    if (selectedIds.length !== 1) {
      alert("Select one user");
      return;
    }

    const selected = users.find(
      (item) => (item._id || item.id) === selectedIds[0]
    );
    if (!selected) return;

    setFormData({
      ...emptyForm,
      ...selected,
      employeeId: selected.employeeId?._id || selected.employeeId || "",
    });
    setEditId(selected._id || selected.id);
    setViewMode(false);
    setShowForm(true);
  };

  /* ===============================
     Delete User
  =============================== */
  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      alert("Select user to delete");
      return;
    }

    const ok = window.confirm(
      `Delete ${selectedIds.length} selected user(s)?`
    );
    if (!ok) return;

    try {
      for (const id of selectedIds) {
        await userControlService.deleteUser(id);
      }
      setUsers((prev) =>
        prev.filter((item) => !selectedIds.includes(item._id || item.id))
      );
      setSelectedIds([]);
      alert("User deleted successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete user");
    }
  };

  /* ===============================
     Reset Password
  =============================== */
  const handleResetPassword = async (user) => {
    if (!user.email) {
      alert("Email not found. Please add email before sending reset link.");
      return;
    }

    const ok = window.confirm(
      `Send password reset link to registered email (${user.email})?`
    );
    if (!ok) return;

    try {
      const res = await userControlService.resetUserPassword(
        user._id || user.id
      );
      alert(res.data?.message || "Password reset link sent successfully.");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reset password.");
    }
  };

  /* ===============================
     Toggle User Status
  =============================== */
  const handleToggleStatus = async (user) => {
    const userId = user._id || user.id;
    try {
      const res = await userControlService.toggleUserStatus(userId);
      if (res.data?.success) {
        setUsers((prev) =>
          prev.map((item) =>
            (item._id || item.id) === userId
              ? { ...item, isActive: res.data.isActive }
              : item
          )
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to toggle status");
    }
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
              window.location.href = "/user-control";
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
          <p>Manage login users and role based access</p>
        </div>
      </div>

      {!showForm && (
        <>
          <div className="common-card">
            <div className="user-filter-grid">
              <div className="form-group">
                <label>User Type</label>
                <select
                  value={filterData.userType}
                  onChange={(e) =>
                    setFilterData({
                      ...filterData,
                      userType: e.target.value,
                    })
                  }
                >
                  <option value="">All Users</option>
                  {userRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={filterData.status}
                  onChange={(e) =>
                    setFilterData({
                      ...filterData,
                      status: e.target.value,
                    })
                  }
                >
                  <option>Active Users</option>
                  <option>Inactive Users</option>
                  <option>All Users</option>
                </select>
              </div>
            </div>
          </div>

          <div className="user-security-note">
            <p>
              <strong>NOTE:</strong> As per DPDP Act and security guidelines,
              passwords are never visible or stored in readable format. Users
              can securely reset their password only through the registered
              email using the password reset link.
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
              <h2>User List</h2>

              <div className="list-action-buttons">
                <AppButton type="primary" onClick={handleView}>
                  View
                </AppButton>

                <AppButton type="primary" onClick={handleEdit}>
                  Edit
                </AppButton>

                <AppButton type="delete" onClick={handleDelete}>
                  Delete
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
                          users.length > 0 &&
                          selectedIds.length === users.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(
                              users.map((item) => item._id || item.id)
                            );
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                      />
                    </th>
                    <th>S.No</th>
                    <th>User Type</th>
                    <th>User Name</th>
                    <th>Display Name</th>
                    <th>Mobile</th>
                    <th>Email</th>
                    <th>Default Session</th>
                    <th>Employee Name</th>
                    <th>Status</th>
                    <th>Reset Password</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan="11"
                        style={{ padding: "4px 0", border: "none" }}
                      >
                        <SkeletonTable rows={5} columns={11} />
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="empty-row">
                        No user found
                      </td>
                    </tr>
                  ) : (
                    users.map((item, index) => {
                      const itemId = item._id || item.id;
                      return (
                        <tr key={itemId}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(itemId)}
                              onChange={() => {
                                setSelectedIds((prev) =>
                                  prev.includes(itemId)
                                    ? prev.filter((id) => id !== itemId)
                                    : [...prev, itemId]
                                );
                              }}
                            />
                          </td>
                          <td>{index + 1}</td>
                          <td>{item.userType}</td>
                          <td>{item.userName}</td>
                          <td>{item.displayName}</td>
                          <td>{item.mobile || "-"}</td>
                          <td>{item.email || "-"}</td>
                          <td>{item.defaultSession}</td>
                          <td>
                            {item.employeeId?.employeeName ||
                              item.employeeName ||
                              "-"}
                          </td>
                          <td>
                            <span
                              onClick={() => handleToggleStatus(item)}
                              style={{
                                cursor: "pointer",
                                padding: "2px 8px",
                                borderRadius: "4px",
                                fontSize: "12px",
                                fontWeight: "600",
                                background: item.isActive
                                  ? "#e6f4ea"
                                  : "#fce8e6",
                                color: item.isActive ? "#137333" : "#c5221f",
                              }}
                              title="Click to toggle status"
                            >
                              {item.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td>
                            <button
                              className="reset-icon-btn"
                              onClick={() => handleResetPassword(item)}
                              title="Reset Password"
                            >
                              ⚙
                            </button>
                          </td>
                        </tr>
                      );
                    })
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
              <label>User Type *</label>
              <select
                name="userType"
                value={formData.userType}
                disabled={viewMode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    userType: e.target.value,
                    employeeId: "",
                    employeeName: "",
                    displayName: "",
                    mobile: "",
                    email: "",
                  })
                }
              >
                <option value="">Select User Type</option>
                {userRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Employee *</label>
              <select
                name="employeeId"
                value={formData.employeeId}
                disabled={viewMode || !formData.userType}
                onChange={handleChange}
              >
                <option value="">Select Employee</option>
                {filteredEmployees.map((employee) => {
                  const empId = employee._id || employee.id;
                  return (
                    <option key={empId} value={empId}>
                      {employee.employeeName} ({employee.employeeCode || "EMP"})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-group">
              <label>User Name *</label>
              <input
                name="userName"
                value={formData.userName}
                disabled={viewMode}
                onChange={handleChange}
                placeholder="Enter username"
              />
            </div>

            <div className="form-group">
              <label>Display Name *</label>
              <input
                name="displayName"
                value={formData.displayName}
                disabled={viewMode}
                onChange={handleChange}
                placeholder="Enter display name"
              />
            </div>

            <div className="form-group">
              <label>Mobile No</label>
              <input name="mobile" value={formData.mobile} disabled />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input name="email" value={formData.email} disabled />
            </div>

            <div className="form-group">
              <label>Default Session *</label>
              <select
                name="defaultSession"
                value={formData.defaultSession}
                disabled={viewMode}
                onChange={handleChange}
              >
                <option value="">Select Session</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.sessionName}>
                    {session.sessionName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <label className="active-checkbox-row">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  disabled={viewMode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isActive: e.target.checked,
                    })
                  }
                />
                <span>Active</span>
              </label>
            </div>
          </div>

          <div className="form-actions">
            {!viewMode && (
              <AppButton type="primary" onClick={handleSave}>
                {editId ? "Update" : "Save"}
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