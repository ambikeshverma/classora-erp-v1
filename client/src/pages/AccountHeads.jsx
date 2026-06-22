import React, { useState } from "react";
import "./accountHeads.css";
import AppButton from "../components/AppButton";

function AccountHeads() {

  const schoolId =
    localStorage.getItem("schoolId") ||
    "SCH001";

  const demoGroups = [
    {
      id: 1,
      schoolId: "SCH001",
      groupName: "Fees Income",
      groupType: "INCOME",
    },
    {
      id: 2,
      schoolId: "SCH001",
      groupName: "Transport Income",
      groupType: "INCOME",
    },
    {
      id: 3,
      schoolId: "SCH001",
      groupName: "Salary Expense",
      groupType: "EXPENSE",
    },
    {
      id: 4,
      schoolId: "SCH001",
      groupName: "Office Expense",
      groupType: "EXPENSE",
    },
  ];

  const usedHeads = [
    "Admission Fee",
  ];

  const [selectedGroupId, setSelectedGroupId] =
    useState("");

  const [headName, setHeadName] =
    useState("");

  const [heads, setHeads] =
    useState([]);

  const [editId, setEditId] =
    useState(null);

  const [selectedRows, setSelectedRows] =
    useState([]);

  const selectedGroup =
    demoGroups.find(
      (group) =>
        String(group.id) ===
        String(selectedGroupId)
    );

  const visibleHeads =
    heads.filter(
      (item) =>
        item.schoolId === schoolId
    );

  const resetForm = () => {

    setSelectedGroupId("");

    setHeadName("");

    setEditId(null);

    setSelectedRows([]);

  };

  const handleSave = () => {

    if (
      !selectedGroupId ||
      !headName.trim()
    ) {

      alert(
        "Please select group and enter head name"
      );

      return;

    }

    const duplicate =
      visibleHeads.find(
        (item) =>
          item.headName
            .toLowerCase()
            .trim() ===
            headName
              .toLowerCase()
              .trim() &&
          String(item.groupId) ===
            String(
              selectedGroupId
            ) &&
          item.id !== editId
      );

    if (duplicate) {

      alert(
        "This account head already exists in selected group"
      );

      return;

    }

    if (editId) {

      setHeads(
        heads.map((item) =>
          item.id === editId
            ? {
                ...item,
                headName,
                groupId:
                  selectedGroup.id,
                groupName:
                  selectedGroup.groupName,
                groupType:
                  selectedGroup.groupType,
              }
            : item
        )
      );

      alert(
        "Account head updated successfully"
      );

    } else {

      const newHead = {

        id: Date.now(),

        schoolId,

        headName,

        groupId:
          selectedGroup.id,

        groupName:
          selectedGroup.groupName,

        groupType:
          selectedGroup.groupType,

      };

      setHeads([
        ...heads,
        newHead,
      ]);

      alert(
        "Account head created successfully"
      );

    }

    resetForm();

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
        visibleHeads.map(
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
      selectedRows.length === 0
    ) {

      alert(
        "Please select one account head"
      );

      return;

    }

    if (
      selectedRows.length > 1
    ) {

      alert(
        "Please select only one account head"
      );

      return;

    }

    const selectedHead =
      visibleHeads.find(
        (item) =>
          item.id ===
          selectedRows[0]
      );

    if (!selectedHead)
      return;

    setEditId(
      selectedHead.id
    );

    setHeadName(
      selectedHead.headName
    );

    setSelectedGroupId(
      selectedHead.groupId
    );

  };

  const handleDelete = () => {

    if (
      selectedRows.length === 0
    ) {

      alert(
        "Please select account head"
      );

      return;

    }

    const blockedHead =
      visibleHeads.find(
        (item) =>
          selectedRows.includes(
            item.id
          ) &&
          usedHeads.includes(
            item.headName
          )
      );

    if (blockedHead) {

      alert(
        "Account Head is already in use. Cannot delete."
      );

      return;

    }

    const ok =
      window.confirm(
        "Delete selected account heads?"
      );

    if (!ok) return;

    setHeads(
      heads.filter(
        (item) =>
          !selectedRows.includes(
            item.id
          )
      )
    );

    setSelectedRows([]);

  };

  return (

    <div className="account-head-page">

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
            Account Heads
          </h1>

          <p>
            Create heads under account groups
            for income and expense entries
          </p>

        </div>

      </div>

      <div className="common-card">

        <div className="card-top-header">

          <h2>
            {editId
              ? "Edit Account Head"
              : "Create Account Head"}
          </h2>

        </div>

        <div
          className="form-grid"
          style={{
            gridTemplateColumns:
              "1fr 1fr 1fr",
          }}
        >

          <div className="form-group">

            <label>
              Account Group
            </label>

            <select
              value={
                selectedGroupId
              }
              onChange={(e) =>
                setSelectedGroupId(
                  e.target.value
                )
              }
            >

              <option value="">
                Select Group
              </option>

              {demoGroups
                .filter(
                  (group) =>
                    group.schoolId ===
                    schoolId
                )
                .map((group) => (

                  <option
                    key={group.id}
                    value={group.id}
                  >
                    {group.groupName}
                  </option>

                ))}

            </select>

          </div>

          <div className="form-group">

            <label>
              Group Type
            </label>

            <input
              type="text"
              value={
                selectedGroup
                  ? selectedGroup.groupType
                  : ""
              }
              readOnly
              placeholder="Auto show group type"
            />

          </div>

          <div className="form-group">

            <label>
              Account Head Name
            </label>

            <input
              type="text"
              value={headName}
              onChange={(e) =>
                setHeadName(
                  e.target.value
                )
              }
              placeholder="Enter account head name"
            />

          </div>

        </div>

        <div className="form-actions">

          <AppButton
            type="primary"
            onClick={handleSave}
          >
            {editId
              ? "Update Head"
              : "Save Head"}
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
            <h2>Account Head List</h2>
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
                      visibleHeads.length > 0 &&
                      selectedRows.length ===
                        visibleHeads.length
                    }
                    onChange={
                      handleSelectAll
                    }
                  />
                </th>

                <th>S.No</th>

                <th>
                  Account Head Name
                </th>

                <th>
                  Account Group
                </th>

                <th>
                  Group Type
                </th>

              </tr>

            </thead>

            <tbody>

              {visibleHeads.length === 0 ? (

                <tr>

                  <td
                    colSpan="5"
                    className="empty-row"
                  >
                    No account head created yet
                  </td>

                </tr>

              ) : (

                visibleHeads.map(
                  (
                    item,
                    index
                  ) => (

                    <tr key={item.id}>

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
                        {item.headName}
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

export default AccountHeads;