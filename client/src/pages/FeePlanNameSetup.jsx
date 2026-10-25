import React, { useState, useEffect } from "react";
import "./feePlanNameSetup.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { adminPanelService } from "../services/api";

function FeePlanNameSetup() {
  const [setupList, setSetupList] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [feePlanName, setFeePlanName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFeePlanNames();
  }, []);

  const fetchFeePlanNames = async () => {
    try {
      setLoading(true);
      const res = await adminPanelService.getFeePlanNames();
      if (res.data?.data) {
        setSetupList(
          res.data.data.map((item) => ({
            id: item._id,
            feePlanName: item.feePlanName,
            isUsed: Boolean(item.isUsed),
          }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch fee plan names", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFeePlanName("");
    setEditingId(null);
    setIsEditMode(false);
  };

  const visibleSetupList = [...setupList].sort((a, b) =>
    a.feePlanName.localeCompare(b.feePlanName)
  );

  const handleSave = async () => {
    if (isLocked) {
      alert("Setup locked by super admin");
      return;
    }

    if (!feePlanName.trim()) {
      alert("Enter fee plan name");
      return;
    }

    const alreadyExists = setupList.some(
      (item) =>
        item.feePlanName.trim().toLowerCase() ===
          feePlanName.trim().toLowerCase() &&
        item.id !== editingId
    );

    if (alreadyExists) {
      alert("Fee plan name already exists");
      return;
    }

    try {
      setSaving(true);
      if (isEditMode) {
        await adminPanelService.updateFeePlanName(editingId, {
          feePlanName: feePlanName.trim(),
        });
        alert("Setup updated successfully");
      } else {
        await adminPanelService.createFeePlanName({
          feePlanName: feePlanName.trim(),
        });
        alert("Setup added successfully");
      }
      resetForm();
      fetchFeePlanNames();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save fee plan name");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    if (isLocked) {
      alert("Setup locked by super admin");
      return;
    }

    if (selectedIds.length !== 1) {
      alert("Select one setup");
      return;
    }

    const selectedItem = setupList.find(
      (item) => item.id === selectedIds[0]
    );

    if (!selectedItem) return;

    if (selectedItem.isUsed) {
      alert("This setup is already used in fee plan");
      return;
    }

    setEditingId(selectedItem.id);
    setFeePlanName(selectedItem.feePlanName);
    setIsEditMode(true);
  };

  const handleDelete = async () => {
    if (isLocked) {
      alert("Setup locked by super admin");
      return;
    }

    if (selectedIds.length === 0) {
      alert("Select setup");
      return;
    }

    const usedSetup = setupList.find(
      (item) => selectedIds.includes(item.id) && item.isUsed
    );

    if (usedSetup) {
      alert("Used setup cannot be deleted");
      return;
    }

    const ok = window.confirm("Delete selected setups?");
    if (!ok) return;

    try {
      setSaving(true);
      for (const id of selectedIds) {
        await adminPanelService.deleteFeePlanName(id);
      }
      setSelectedIds([]);
      alert("Setup deleted successfully");
      fetchFeePlanNames();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete setup");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fee-plan-name-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => {
            window.location.href = "/admin-panel";
          }}
        >
          ←
        </AppButton>

        <div>
          <h1>Fee Plan Name Setup</h1>
          <p>Manage fee plan names</p>
        </div>
      </div>

      <div className="common-card">
        <div className="filter-grid">
          <div className="form-group">
            <label>Fee Plan Name</label>

            <input
              type="text"
              placeholder="Enter fee plan name"
              value={feePlanName}
              disabled={saving}
              onChange={(e) => {
                setFeePlanName(e.target.value);
              }}
            />
          </div>
        </div>

        <div className="search-btn-row">
          <AppButton type="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : isEditMode ? "Update" : "Save"}
          </AppButton>
          {isEditMode && (
            <AppButton type="secondary" onClick={resetForm} disabled={saving}>
              Cancel
            </AppButton>
          )}
        </div>
      </div>

      <div className="common-card">
        <div className="list-header">
          <div>
            <h2>Setup List</h2>

            <p className="lock-status">
              {isLocked ? "🔒 Locked by Super Admin" : "🔓 Editable"}
            </p>
          </div>

          <div className="list-action-buttons">
            <AppButton type="primary" onClick={handleEdit} disabled={saving}>
              Edit
            </AppButton>

            <AppButton type="secondary" onClick={handleDelete} disabled={saving}>
              Delete
            </AppButton>
          </div>
        </div>

        {loading ? (
          <SkeletonTable rows={4} columns={3} />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={
                        visibleSetupList.length > 0 &&
                        selectedIds.length === visibleSetupList.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(
                            visibleSetupList.map((item) => item.id)
                          );
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                    />
                  </th>

                  <th>S.No</th>
                  <th>Fee Plan Name</th>
                </tr>
              </thead>

              <tbody>
                {visibleSetupList.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="empty-row">
                      No fee plan name found
                    </td>
                  </tr>
                ) : (
                  visibleSetupList.map((item, index) => (
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
                      <td>{item.feePlanName}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default FeePlanNameSetup;