import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./accountHeads.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { financeService } from "../services/api";

import { notifyAlert, confirmDialog } from "../utils/toast";
function AccountHeads() {
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [heads, setHeads] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [headName, setHeadName] = useState("");
  const [editId, setEditId] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [groupRes, headRes] = await Promise.all([financeService.getGroups(), financeService.getHeads()]);
      setGroups(groupRes.data?.data || []);
      setHeads(headRes.data?.data || []);
    } catch (err) {
      notifyAlert(err.response?.data?.message || "Failed to load account heads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedGroup = groups.find((group) => group._id === selectedGroupId);

  const resetForm = () => {
    setSelectedGroupId("");
    setHeadName("");
    setEditId(null);
    setSelectedRows([]);
  };

  const handleSave = async () => {
    if (!selectedGroupId || !headName.trim()) {
      notifyAlert("Please select group and enter head name");
      return;
    }

    try {
      setSaving(true);

      if (editId) {
        await financeService.updateHead(editId, { groupId: selectedGroupId, headName });
        notifyAlert("Account head updated successfully");
      } else {
        await financeService.createHead({ groupId: selectedGroupId, headName });
        notifyAlert("Account head created successfully");
      }

      resetForm();
      await loadData();
    } catch (err) {
      notifyAlert(err.response?.data?.message || "Failed to save account head");
    } finally {
      setSaving(false);
    }
  };

  const handleRowSelect = (id) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleSelectAll = (e) => {
    setSelectedRows(e.target.checked ? heads.map((item) => item._id) : []);
  };

  const handleEdit = () => {
    if (selectedRows.length === 0) {
      notifyAlert("Please select one account head");
      return;
    }

    if (selectedRows.length > 1) {
      notifyAlert("Please select only one account head");
      return;
    }

    const selectedHead = heads.find((item) => item._id === selectedRows[0]);
    if (!selectedHead) return;

    if (selectedHead.isSystem) {
      notifyAlert("This account head is created by the system and cannot be edited");
      return;
    }

    setEditId(selectedHead._id);
    setHeadName(selectedHead.headName);
    setSelectedGroupId(selectedHead.groupId);
  };

  const handleDelete = async () => {
    if (selectedRows.length === 0) {
      notifyAlert("Please select account head");
      return;
    }

    if (!await confirmDialog("Delete selected account heads?")) return;

    try {
      setSaving(true);
      for (const id of selectedRows) {
        await financeService.deleteHead(id);
      }
      notifyAlert("Account head deleted successfully");
    } catch (err) {
      notifyAlert(err.response?.data?.message || "Failed to delete account head");
    } finally {
      setSaving(false);
      setSelectedRows([]);
      await loadData();
    }
  };

  return (
    <div className="account-head-page">
      <div className="common-page-header">
        <AppButton type="back" onClick={() => navigate("/finance-manager")}>
          ←
        </AppButton>

        <div>
          <h1>Account Heads</h1>
          <p>Create heads under account groups for income and expense entries</p>
        </div>
      </div>

      <div className="common-card">
        <div className="card-top-header">
          <h2>{editId ? "Edit Account Head" : "Create Account Head"}</h2>
        </div>

        <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          <div className="form-group">
            <label>Account Group</label>

            <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)}>
              <option value="">{loading ? "Loading..." : "Select Group"}</option>

              {groups
                .filter((group) => !group.isSystem)
                .map((group) => (
                  <option key={group._id} value={group._id}>
                    {group.groupName}
                  </option>
                ))}
            </select>
          </div>

          <div className="form-group">
            <label>Group Type</label>

            <input
              type="text"
              value={selectedGroup ? selectedGroup.groupType : ""}
              readOnly
              placeholder="Auto show group type"
            />
          </div>

          <div className="form-group">
            <label>Account Head Name</label>

            <input
              type="text"
              value={headName}
              onChange={(e) => setHeadName(e.target.value)}
              placeholder="Enter account head name"
            />
          </div>
        </div>

        {!loading && groups.filter((group) => !group.isSystem).length === 0 && (
          <p className="empty-row">No account group available. Create a group in Account Groups first.</p>
        )}

        <div className="form-actions">
          <AppButton type="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : editId ? "Update Head" : "Save Head"}
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
            <h2>Account Head List</h2>
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
                    checked={heads.length > 0 && selectedRows.length === heads.length}
                    onChange={handleSelectAll}
                  />
                </th>

                <th>S.No</th>
                <th>Account Head Name</th>
                <th>Account Group</th>
                <th>Group Type</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ padding: "4px 0", border: "none" }}>
                    <SkeletonTable rows={4} columns={5} />
                  </td>
                </tr>
              ) : heads.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-row">
                    No account head created yet
                  </td>
                </tr>
              ) : (
                heads.map((item, index) => (
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
                      {item.headName}
                      {item.isSystem ? " (System)" : ""}
                    </td>
                    <td>{item.groupName}</td>
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

export default AccountHeads;
