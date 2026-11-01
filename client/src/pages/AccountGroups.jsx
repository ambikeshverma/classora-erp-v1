import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./accountGroups.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { financeService } from "../services/api";

import { notifyAlert, confirmDialog } from "../utils/toast";
function AccountGroups() {
  const navigate = useNavigate();

  const [groupName, setGroupName] = useState("");
  const [groupType, setGroupType] = useState("");
  const [groupList, setGroupList] = useState([]);
  const [editId, setEditId] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadGroups = useCallback(async () => {
    try {
      setLoading(true);
      const res = await financeService.getGroups();
      setGroupList(res.data?.data || []);
    } catch (err) {
      notifyAlert(err.response?.data?.message || "Failed to load account groups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const resetForm = () => {
    setGroupName("");
    setGroupType("");
    setEditId(null);
    setSelectedRows([]);
  };

  const handleSave = async () => {
    if (!groupName.trim() || !groupType) {
      notifyAlert("Please fill all fields");
      return;
    }

    try {
      setSaving(true);

      if (editId) {
        await financeService.updateGroup(editId, { groupName, groupType });
        notifyAlert("Group updated successfully");
      } else {
        await financeService.createGroup({ groupName, groupType });
        notifyAlert("Group created successfully");
      }

      resetForm();
      await loadGroups();
    } catch (err) {
      notifyAlert(err.response?.data?.message || "Failed to save group");
    } finally {
      setSaving(false);
    }
  };

  const handleRowSelect = (id) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleSelectAll = (e) => {
    setSelectedRows(e.target.checked ? groupList.map((item) => item._id) : []);
  };

  const handleEdit = () => {
    if (selectedRows.length !== 1) {
      notifyAlert("Please select one group to edit");
      return;
    }

    const selectedGroup = groupList.find((item) => item._id === selectedRows[0]);
    if (!selectedGroup) return;

    if (selectedGroup.isSystem) {
      notifyAlert("This group is created by the system and cannot be edited");
      return;
    }

    setEditId(selectedGroup._id);
    setGroupName(selectedGroup.groupName);
    setGroupType(selectedGroup.groupType);
  };

  const handleDelete = async () => {
    if (selectedRows.length === 0) {
      notifyAlert("Please select group");
      return;
    }

    if (!await confirmDialog("Delete selected groups?")) return;

    try {
      setSaving(true);
      for (const id of selectedRows) {
        await financeService.deleteGroup(id);
      }
      notifyAlert("Group deleted successfully");
    } catch (err) {
      notifyAlert(err.response?.data?.message || "Failed to delete group");
    } finally {
      setSaving(false);
      setSelectedRows([]);
      await loadGroups();
    }
  };

  return (
    <div className="account-group-page">
      <div className="common-page-header">
        <AppButton type="back" onClick={() => navigate("/finance-manager")}>
          ←
        </AppButton>

        <div>
          <h1>Account Groups</h1>
          <p>Create and manage income and expense groups</p>
        </div>
      </div>

      <div className="common-card">
        <div className="card-top-header">
          <h2>{editId ? "Edit Group" : "Create Group"}</h2>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Group Name</label>

            <input
              type="text"
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Group Type</label>

            <select value={groupType} onChange={(e) => setGroupType(e.target.value)}>
              <option value="">Select Type</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <AppButton type="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : editId ? "Update Group" : "Save Group"}
          </AppButton>

          {editId && (
            <AppButton type="cancel" onClick={resetForm}>
              Cancel
            </AppButton>
          )}
        </div>
      </div>

      <div className="common-card">
        <div className="table-top-header">
          <div>
            <h2>Group List</h2>
          </div>

          <div className="top-action-buttons">
            <AppButton type="primary" onClick={handleEdit} disabled={saving}>
              Edit
            </AppButton>

            <AppButton type="delete" onClick={handleDelete} disabled={saving}>
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
                    checked={groupList.length > 0 && selectedRows.length === groupList.length}
                    onChange={handleSelectAll}
                  />
                </th>

                <th>S.No</th>
                <th>Group Name</th>
                <th>Type</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" style={{ padding: "4px 0", border: "none" }}>
                    <SkeletonTable rows={4} columns={4} />
                  </td>
                </tr>
              ) : groupList.length === 0 ? (
                <tr>
                  <td colSpan="4" className="empty-row">
                    No account group created yet
                  </td>
                </tr>
              ) : (
                groupList.map((item, index) => (
                  <tr key={item._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(item._id)}
                        onChange={() => handleRowSelect(item._id)}
                      />
                    </td>

                    <td>{index + 1}</td>
                    <td>
                      {item.groupName}
                      {item.isSystem ? " (System)" : ""}
                    </td>
                    <td>{item.groupType}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AccountGroups;
