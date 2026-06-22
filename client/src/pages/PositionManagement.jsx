import React, { useState } from "react";
import "./positionManagement.css";
import AppButton from "../components/AppButton";

function PositionManagement() {
  /* ===============================
     Multi School Safe
  =============================== */

  const schoolId =
    localStorage.getItem("schoolId") ||
    "SCH001";

  /* ===============================
     Demo Department Data
     Future Backend/API Ready
  =============================== */

  const departments = [
    {
      id: 1,
      departmentId: "DEP001",
      schoolId: "SCH001",
      departmentName: "Teaching",
    },

    {
      id: 2,
      departmentId: "DEP002",
      schoolId: "SCH001",
      departmentName: "Accounts",
    },

    {
      id: 3,
      departmentId: "DEP003",
      schoolId: "SCH001",
      departmentName: "Transport",
    },
  ];

  /* ===============================
     Future Linked Staff Data
     Later replace with Staff API data
  =============================== */

  const usedPositionReferences = [
    {
      id: 1,
      schoolId: "SCH001",
      positionId: 1,
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

  const [positions, setPositions] =
    useState([
      {
        id: 1,
        schoolId: "SCH001",
        departmentId: "DEP001",
        positionName: "Teacher",
      },

      {
        id: 2,
        schoolId: "SCH001",
        departmentId: "DEP002",
        positionName: "Accountant",
      },
    ]);

  const [formData, setFormData] =
    useState({
      departmentId: "",
      positionName: "",
    });

  /* ===============================
     School Wise Filters
  =============================== */

  const schoolDepartments =
    departments.filter(
      (item) =>
        item.schoolId === schoolId
    );

  const schoolPositions =
    positions.filter(
      (item) =>
        item.schoolId === schoolId
    );

  /* ===============================
     Check Position Usage
  =============================== */

  const isPositionUsed = (
    positionId
  ) => {
    return usedPositionReferences.some(
      (item) =>
        item.schoolId === schoolId &&
        item.positionId === positionId
    );
  };

  /* ===============================
     Reset Form
  =============================== */

  const resetForm = () => {
    setFormData({
      departmentId: "",
      positionName: "",
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
     Save Position
  =============================== */

  const handleSave = () => {
    if (
      !formData.departmentId ||
      !formData.positionName.trim()
    ) {
      alert(
        "Please fill all required fields"
      );

      return;
    }

    const alreadyExists =
      schoolPositions.some(
        (item) =>
          item.departmentId ===
            formData.departmentId &&
          item.positionName
            .toLowerCase()
            .trim() ===
            formData.positionName
              .toLowerCase()
              .trim() &&
          item.id !== editId
      );

    if (alreadyExists) {
      alert(
        "Position already exists"
      );

      return;
    }

    if (editId) {
      if (isPositionUsed(editId)) {
        alert(
          "This position is already linked with staff records and cannot be edited."
        );

        return;
      }

      setPositions(
        positions.map((item) =>
          item.id === editId
            ? {
                ...item,
                departmentId:
                  formData.departmentId,
                positionName:
                  formData.positionName,
              }
            : item
        )
      );

      alert(
        "Position updated successfully"
      );
    } else {
      const newPosition = {
        id: Date.now(),
        schoolId,
        departmentId:
          formData.departmentId,
        positionName:
          formData.positionName,
      };

      setPositions([
        ...positions,
        newPosition,
      ]);

      alert(
        "Position added successfully"
      );
    }

    resetForm();

    setShowForm(false);
  };

  /* ===============================
     Edit Position
  =============================== */

  const handleEdit = (item) => {
    if (!item) return;

    if (isPositionUsed(item.id)) {
      alert(
        "This position is already linked with staff records and cannot be edited."
      );

      return;
    }

    setEditId(item.id);

    setFormData({
      departmentId:
        item.departmentId,
      positionName:
        item.positionName,
    });

    setShowForm(true);
  };

  /* ===============================
     Delete Position
  =============================== */

  const handleDelete = () => {
    if (selectedIds.length === 0) {
      alert(
        "Select position"
      );

      return;
    }

    const positionInUse =
      selectedIds.some((positionId) =>
        isPositionUsed(positionId)
      );

    if (positionInUse) {
      alert(
        "Selected position is already linked with staff records and cannot be deleted."
      );

      return;
    }

    const ok = window.confirm(
      "Delete selected position?"
    );

    if (!ok) return;

    setPositions(
      positions.filter(
        (item) =>
          !selectedIds.includes(
            item.id
          )
      )
    );

    setSelectedIds([]);

    alert(
      "Position deleted successfully"
    );
  };

  return (
    <div className="position-management-page">
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
              ? "Add / Edit Position"
              : "Position Management"}
          </h1>

          <p>
            Add and manage staff
            positions
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
              + Add Position
            </AppButton>
          </div>

          <div className="common-card">
            <div className="list-header">
              <h2>
                Position List
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
                        "Select one position"
                      );

                      return;
                    }

                    const selected =
                      schoolPositions.find(
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
                          schoolPositions.length >
                            0 &&
                          selectedIds.length ===
                            schoolPositions.length
                        }
                        onChange={(e) => {
                          if (
                            e.target.checked
                          ) {
                            setSelectedIds(
                              schoolPositions.map(
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
                      Department
                    </th>

                    <th>
                      Position Name
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {schoolPositions.length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="empty-row"
                      >
                        No position found
                      </td>
                    </tr>
                  ) : (
                    schoolPositions.map(
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
                            {schoolDepartments.find(
                              (dept) =>
                                dept.departmentId ===
                                item.departmentId
                            )?.departmentName ||
                              "-"}
                          </td>

                          <td>
                            {
                              item.positionName
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
          <div className="position-form-grid">
            <div className="form-group">
              <label>
                Department *
              </label>

              <select
                name="departmentId"
                value={
                  formData.departmentId
                }
                onChange={handleChange}
              >
                <option value="">
                  Select Department
                </option>

                {schoolDepartments.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={
                        item.departmentId
                      }
                    >
                      {
                        item.departmentName
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="form-group">
              <label>
                Position Name *
              </label>

              <input
                type="text"
                name="positionName"
                value={
                  formData.positionName
                }
                onChange={
                  handleChange
                }
                placeholder="Enter position name"
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

export default PositionManagement;