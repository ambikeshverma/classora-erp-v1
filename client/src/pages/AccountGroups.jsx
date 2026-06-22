import React, { useState } from "react";
import "./accountGroups.css";
import AppButton from "../components/AppButton";

function AccountGroups() {

  const [groupName, setGroupName] =
    useState("");

  const [groupType, setGroupType] =
    useState("");

  const [groupList, setGroupList] =
    useState([]);

  const [editId, setEditId] =
    useState(null);

  const [selectedRows, setSelectedRows] =
    useState([]);

  const schoolId =
    localStorage.getItem("schoolId") ||
    "SCH001";

  /* Account Head dependency example */

  const usedGroups = [
    "Transport Income",
  ];

  const visibleGroups =
    groupList.filter(
      (item) =>
        item.schoolId === schoolId
    );

  const handleSave = () => {

    if (
      !groupName.trim() ||
      !groupType
    ) {

      alert(
        "Please fill all fields"
      );

      return;

    }

    const duplicate =
      groupList.find(
        (item) =>
          item.schoolId ===
            schoolId &&
          item.groupName.toLowerCase() ===
            groupName.toLowerCase() &&
          item.id !== editId
      );

    if (duplicate) {

      alert(
        "Group already exists"
      );

      return;

    }

    if (editId) {

      const updated =
        groupList.map(
          (item) =>
            item.id === editId
              ? {
                  ...item,
                  groupName,
                  groupType,
                }
              : item
        );

      setGroupList(updated);

      alert(
        "Group updated successfully"
      );

    } else {

      const newGroup = {

        id: Date.now(),

        schoolId,

        groupName,

        groupType,

      };

      setGroupList([
        ...groupList,
        newGroup,
      ]);

      alert(
        "Group created successfully"
      );

    }

    resetForm();

  };

  const resetForm = () => {

    setGroupName("");

    setGroupType("");

    setEditId(null);

    setSelectedRows([]);

  };

  const handleRowSelect = (id) => {

    if (
      selectedRows.includes(id)
    ) {

      setSelectedRows(
        selectedRows.filter(
          (item) =>
            item !== id
        )
      );

    } else {

      setSelectedRows([
        ...selectedRows,
        id,
      ]);

    }

  };

  const handleSelectAll = (
    e
  ) => {

    if (
      e.target.checked
    ) {

      setSelectedRows(
        visibleGroups.map(
          (item) =>
            item.id
        )
      );

    } else {

      setSelectedRows([]);

    }

  };

  const handleEdit = () => {

    if (
      selectedRows.length !== 1
    ) {

      alert(
        "Please select one group to edit"
      );

      return;

    }

    const selectedGroup =
      visibleGroups.find(
        (item) =>
          item.id ===
          selectedRows[0]
      );

    if (!selectedGroup)
      return;

    setEditId(
      selectedGroup.id
    );

    setGroupName(
      selectedGroup.groupName
    );

    setGroupType(
      selectedGroup.groupType
    );

  };
const handleDelete = () => {

  if (
    selectedRows.length === 0
  ) {

    alert(
      "Please select group"
    );

    return;

  }

  const blockedGroup =
    visibleGroups.find(
      (item) =>
        selectedRows.includes(
          item.id
        ) &&
        usedGroups.includes(
          item.groupName
        )
    );

  if (blockedGroup) {

    alert(
      "Group already in use. Cannot delete."
    );

    return;

  }

  const ok =
    window.confirm(
      "Delete selected groups?"
    );

  if (!ok) return;

  setGroupList(
    groupList.filter(
      (item) =>
        !selectedRows.includes(
          item.id
        )
    )
  );

  setSelectedRows([]);

};

return (

  <div className="account-group-page">

    <div className="common-page-header">

      <AppButton
        type="back"
        onClick={() =>
          (
            window.location.href =
            "/finance-manager"
          )
        }
      >
        ←
      </AppButton>

      <div>

        <h1>
          Account Groups
        </h1>

        <p>
          Create and manage income and expense groups
        </p>

      </div>

    </div>

    <div className="common-card">

      <div className="card-top-header">

        <h2>
          {editId
            ? "Edit Group"
            : "Create Group"}
        </h2>

      </div>

      <div className="form-grid">

        <div className="form-group">

          <label>
            Group Name
          </label>

          <input
            type="text"
            placeholder="Enter group name"
            value={groupName}
            onChange={(e) =>
              setGroupName(
                e.target.value
              )
            }
          />

        </div>

        <div className="form-group">

          <label>
            Group Type
          </label>

          <select
            value={groupType}
            onChange={(e) =>
              setGroupType(
                e.target.value
              )
            }
          >

            <option value="">
              Select Type
            </option>

            <option value="INCOME">
              Income
            </option>

            <option value="EXPENSE">
              Expense
            </option>

          </select>

        </div>

      </div>

      <div className="form-actions">

        <AppButton
          type="primary"
          onClick={handleSave}
        >
          {editId
            ? "Update Group"
            : "Save Group"}
        </AppButton>

        {editId && (

          <AppButton
            type="cancel"
            onClick={resetForm}
          >
            Cancel
          </AppButton>

        )}

      </div>

    </div>

    <div className="common-card">

      <div className="table-top-header">

        <div>

          <h2>
            Group List
          </h2>

        </div>

        <div className="top-action-buttons">

          <AppButton
            type="primary"
            onClick={handleEdit}
          >
            Edit
          </AppButton>

          <AppButton
            type="delete"
            onClick={handleDelete}
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
                    visibleGroups.length > 0 &&
                    selectedRows.length ===
                      visibleGroups.length
                  }
                  onChange={
                    handleSelectAll
                  }
                />

              </th>

              <th>
                S.No
              </th>

              <th>
                Group Name
              </th>

              <th>
                Type
              </th>

            </tr>

          </thead>

          <tbody>

            {visibleGroups.length === 0 ? (

              <tr>

                <td
                  colSpan="4"
                  className="empty-row"
                >
                  No account group created yet
                </td>

              </tr>

            ) : (

              visibleGroups.map(
                (
                  item,
                  index
                ) => (

                  <tr
                    key={item.id}
                  >

                    <td>

                      <input
                        type="checkbox"
                        checked={selectedRows.includes(
                          item.id
                        )}
                        onChange={() =>
                          handleRowSelect(
                            item.id
                          )
                        }
                      />

                    </td>

                    <td>
                      {index + 1}
                    </td>

                    <td>
                      {item.groupName}
                    </td>

                    <td>
                      {item.groupType}
                    </td>

                  </tr>

                )
              )

            )}

          </tbody>

        </table>

      </div>

    </div>

  </div>

);

}

export default AccountGroups;