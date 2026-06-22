import React, { useState } from "react";
import "./departmentManagement.css";
import AppButton from "../components/AppButton";

function DepartmentManagement() {
  /* ===============================
     Multi School Safe State
  =============================== */

  const schoolId =
    localStorage.getItem("schoolId") ||
    "SCH001";

  /* ===============================
     Future Linked Data
     Later replace with API data
  =============================== */

  const usedDepartmentReferences = [
    {
      id: 1,
      schoolId: "SCH001",
      departmentId: 1,
      usedIn: "Position Management",
    },
    {
      id: 2,
      schoolId: "SCH001",
      departmentId: 1,
      usedIn: "Staff Management",
    },
  ];

  /* ===============================
     States
  =============================== */

  const [showForm, setShowForm] =
    useState(false);

  const [selectedIds, setSelectedIds] =
    useState([]);

  const [editId, setEditId] =
    useState(null);

  const [departments, setDepartments] =
    useState([
      {
        id: 1,
        schoolId: "SCH001",
        departmentName: "Teaching",
      },

      {
        id: 2,
        schoolId: "SCH001",
        departmentName: "Accounts",
      },
    ]);

  const [formData, setFormData] =
    useState({
      departmentName: "",
    });

  /* ===============================
     Multi School Filter
  =============================== */

  const schoolDepartments =
    departments.filter(
      (item) =>
        item.schoolId === schoolId
    );

  /* ===============================
     Check Department Usage
  =============================== */

  const isDepartmentUsed = (
    departmentId
  ) => {
    return usedDepartmentReferences.some(
      (item) =>
        item.schoolId === schoolId &&
        item.departmentId === departmentId
    );
  };

  /* ===============================
     Reset Form
  =============================== */

  const resetForm = () => {
    setFormData({
      departmentName: "",
    });

    setEditId(null);
  };

  /* ===============================
     Handle Change
  =============================== */

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value,
    });
  };

  /* ===============================
     Save Department
  =============================== */

  const handleSave = () => {
    if (
      !formData.departmentName.trim()
    ) {
      alert(
        "Please enter department name"
      );

      return;
    }

    const alreadyExists =
      schoolDepartments.some(
        (item) =>
          item.departmentName
            .toLowerCase()
            .trim() ===
            formData.departmentName
              .toLowerCase()
              .trim() &&
          item.id !== editId
      );

    if (alreadyExists) {
      alert(
        "Department already exists"
      );

      return;
    }

    if (editId) {
      if (isDepartmentUsed(editId)) {
        alert(
          "This department is already linked with another module and cannot be edited."
        );

        return;
      }

      setDepartments(
        departments.map((item) =>
          item.id === editId
            ? {
                ...item,
                departmentName:
                  formData.departmentName,
              }
            : item
        )
      );

      alert(
        "Department updated successfully"
      );
    } else {
      const newDepartment = {
        id: Date.now(),
        schoolId,
        departmentName:
          formData.departmentName,
      };

      setDepartments([
        ...departments,
        newDepartment,
      ]);

      alert(
        "Department added successfully"
      );
    }

    resetForm();

    setShowForm(false);
  };

  /* ===============================
     Edit Department
  =============================== */

  const handleEdit = (item) => {
    if (!item) return;

    if (isDepartmentUsed(item.id)) {
      alert(
        "This department is already linked with another module and cannot be edited."
      );

      return;
    }

    setEditId(item.id);

    setFormData({
      departmentName:
        item.departmentName,
    });

    setShowForm(true);
  };

  /* ===============================
     Delete Department
  =============================== */

  const handleDelete = () => {
    if (selectedIds.length === 0) {
      alert("Select department");

      return;
    }

    const departmentInUse =
      selectedIds.some((departmentId) =>
        isDepartmentUsed(departmentId)
      );

    if (departmentInUse) {
      alert(
        "Selected department is already linked with another module and cannot be deleted."
      );

      return;
    }

    const ok = window.confirm(
      "Delete selected department?"
    );

    if (!ok) return;

    setDepartments(
      departments.filter(
        (item) =>
          !selectedIds.includes(
            item.id
          )
      )
    );

    setSelectedIds([]);

    alert(
      "Department deleted successfully"
    );
  };

  return (
    <div className="department-management-page">
      {/* ===============================
          Header
      =============================== */}

      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => {
            if (showForm) {
              resetForm();

              setShowForm(false);
            } else {
              window.location.href =
                "/staff-control";
            }
          }}
        >
          ←
        </AppButton>

        <div>
          <h1>
            {showForm
              ? "Add / Edit Department"
              : "Department Management"}
          </h1>

          <p>
            Add and manage school
            departments
          </p>
        </div>
      </div>

      {/* ===============================
          List View
      =============================== */}

      {!showForm && (
        <>
          <div className="top-action-bar">
            <AppButton
              type="primary"
              onClick={() =>
                setShowForm(true)
              }
            >
              + Add Department
            </AppButton>
          </div>

          <div className="common-card">
            <div className="list-header">
              <h2>
                Department List
              </h2>

              <div className="list-action-buttons">
                <AppButton
                  type="primary"
                  onClick={() => {
                    if (
                      selectedIds.length !==
                      1
                    ) {
                      alert(
                        "Select one department"
                      );

                      return;
                    }

                    const selected =
                      schoolDepartments.find(
                        (item) =>
                          item.id ===
                          selectedIds[0]
                      );

                    handleEdit(selected);
                  }}
                >
                  Edit
                </AppButton>

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

            {/* ===============================
                Table
            =============================== */}

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={
                          schoolDepartments.length >
                            0 &&
                          selectedIds.length ===
                            schoolDepartments.length
                        }
                        onChange={(e) => {
                          if (
                            e.target.checked
                          ) {
                            setSelectedIds(
                              schoolDepartments.map(
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

                    <th>S.No</th>

                    <th>
                      Department Name
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {schoolDepartments.length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan="3"
                        className="empty-row"
                      >
                        No department found
                      </td>
                    </tr>
                  ) : (
                    schoolDepartments.map(
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
                                  (prev) =>
                                    prev.includes(
                                      item.id
                                    )
                                      ? prev.filter(
                                          (id) =>
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
                            {
                              item.departmentName
                            }
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

      {/* ===============================
          Form View
      =============================== */}

      {showForm && (
        <div className="common-card">
          <div className="department-form-grid">
            <div className="form-group">
              <label>
                Department Name *
              </label>

              <input
                type="text"
                name="departmentName"
                value={
                  formData.departmentName
                }
                onChange={
                  handleChange
                }
                placeholder="Enter department name"
              />
            </div>
          </div>

          <div className="form-actions">
            <AppButton
              type="primary"
              onClick={handleSave}
            >
              {editId
                ? "Update"
                : "Save"}
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

export default DepartmentManagement;