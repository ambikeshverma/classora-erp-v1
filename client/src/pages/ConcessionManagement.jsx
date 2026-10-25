import React, { useState, useEffect } from "react";
import "./concessionManagement.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { adminPanelService } from "../services/api";

function ConcessionManagement() {
  const currentUser = {
    userId: localStorage.getItem("userId") || "USR001",
    employeeName: localStorage.getItem("userName") || "School Admin",
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [allowedFeeScheme, setAllowedFeeScheme] = useState("Monthly");
  const [installmentCount, setInstallmentCount] = useState(3);
  const [feeHeads, setFeeHeads] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [planName, setPlanName] = useState("");
  const [percentages, setPercentages] = useState({});
  const [savedPlans, setSavedPlans] = useState([]);

  const getColumns = (scheme = allowedFeeScheme, count = installmentCount) => {
    if (scheme === "Installment") {
      return Array.from({ length: count || 1 }, (_, index) => `Installment ${index + 1}`);
    }
    if (scheme === "Quarterly") {
      return ["Quarter 1", "Quarter 2", "Quarter 3", "Quarter 4"];
    }
    if (scheme === "Half Yearly") {
      return ["Half Yearly 1", "Half Yearly 2"];
    }
    if (scheme === "Yearly" || scheme === "Annual") {
      return ["Annual"];
    }
    return [
      "APR", "MAY", "JUN", "JUL", "AUG", "SEP",
      "OCT", "NOV", "DEC", "JAN", "FEB", "MAR",
    ];
  };

  const months = getColumns();

  const createEmptyPercentages = (heads = feeHeads, cols = months) => {
    const data = {};
    heads.forEach((head) => {
      const key = head.id || head.headName;
      data[key] = {};
      cols.forEach((month) => {
        data[key][month] = "";
      });
    });
    return data;
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [metaRes, concRes] = await Promise.all([
        adminPanelService.getMeta(),
        adminPanelService.getConcessions(),
      ]);

      let currentHeads = [];
      let currentScheme = "Monthly";
      let currentInstallment = 3;

      if (metaRes.data?.data?.feeScheme) {
        const fs = metaRes.data.data.feeScheme;
        currentScheme = fs.schemeType || "Monthly";
        currentInstallment = fs.installmentCount || 3;
        setAllowedFeeScheme(currentScheme);
        setInstallmentCount(currentInstallment);

        if (Array.isArray(fs.feeHeads)) {
          currentHeads = fs.feeHeads.map((h, i) => ({
            id: h._id || String(i + 1),
            headName: h.feeHeadName,
          }));
          setFeeHeads(currentHeads);
        }
      }

      if (concRes.data?.data) {
        setSavedPlans(
          concRes.data.data.map((c) => ({
            id: c._id,
            planName: c.concessionName,
            feeScheme: c.feeScheme || currentScheme,
            columns: c.applicableMonths?.length ? c.applicableMonths : getColumns(currentScheme, currentInstallment),
            percentages: c.percentages || {},
            isLocked: Boolean(c.isLocked),
            isUsed: Boolean(c.isUsed),
            lockedBy: c.lockedBy || "",
            lockedOnDate: c.lockedOnDate || "",
            lockedOnTime: c.lockedOnTime || "",
            createdBy: c.createdBy || "",
            updatedBy: c.updatedBy || "",
            updatedDate: c.updatedDate || "",
            updatedTime: c.updatedTime || "",
          }))
        );
      }
    } catch (err) {
      console.error("Failed to load concession data", err);
    } finally {
      setLoading(false);
    }
  };

  const selectedPlans = savedPlans.filter((item) => selectedIds.includes(item.id));
  const selectedSingle = selectedPlans.length === 1 ? selectedPlans[0] : null;

  const currentStatusText = selectedSingle?.isLocked
    ? "🔒 Locked"
    : "🔓 Editable";

  const resetForm = () => {
    setPlanName("");
    setPercentages(createEmptyPercentages());
    setEditingId(null);
    setViewMode(false);
  };

  const handlePercentageChange = (headId, month, value) => {
    if (viewMode) return;

    if (value !== "") {
      const num = Number(value);
      if (num < 0 || num > 100) {
        alert("Percentage must be between 0 and 100");
        return;
      }
    }

    setPercentages((prev) => ({
      ...prev,
      [headId]: {
        ...(prev[headId] || {}),
        [month]: value,
      },
    }));
  };

  const validatePlan = () => {
    if (!planName.trim()) {
      alert("Enter concession plan name");
      return false;
    }

    const duplicate = savedPlans.some(
      (item) =>
        item.planName.toLowerCase().trim() === planName.toLowerCase().trim() &&
        item.id !== editingId
    );

    if (duplicate) {
      alert("Concession plan already exists");
      return false;
    }

    return true;
  };

  const handleSavePlan = async () => {
    if (!validatePlan()) return;

    const now = new Date();
    const date = now.toLocaleDateString("en-IN");
    const time = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const payload = {
      concessionName: planName.trim(),
      type: "percentage",
      feeScheme: allowedFeeScheme,
      applicableMonths: [...months],
      applicableFeeHeads: feeHeads.map((h) => h.headName),
      percentages,
      updatedBy: currentUser.employeeName,
      updatedDate: date,
      updatedTime: time,
    };

    try {
      setSaving(true);
      if (editingId) {
        const editingPlan = savedPlans.find((item) => item.id === editingId);
        if (editingPlan?.isLocked) {
          alert("Locked plan cannot be edited");
          return;
        }

        await adminPanelService.updateConcession(editingId, payload);
        alert("Concession plan updated successfully");
      } else {
        payload.createdBy = currentUser.employeeName;
        await adminPanelService.createConcession(payload);
        alert("Concession plan saved successfully");
      }

      resetForm();
      setShowForm(false);
      setSelectedIds([]);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save concession plan");
    } finally {
      setSaving(false);
    }
  };

  const handleView = () => {
    if (selectedIds.length !== 1) {
      alert("Select one concession plan");
      return;
    }

    const item = selectedSingle;
    setPlanName(item.planName);
    setPercentages({
      ...createEmptyPercentages(),
      ...item.percentages,
    });
    setEditingId(item.id);
    setViewMode(true);
    setShowForm(true);
  };

  const handleEdit = () => {
    if (selectedIds.length !== 1) {
      alert("Select one concession plan");
      return;
    }

    const item = selectedSingle;
    if (item.isLocked) {
      alert("Locked plan cannot be edited");
      return;
    }

    if (item.isUsed) {
      alert("Used plan cannot be edited");
      return;
    }

    setPlanName(item.planName);
    setPercentages({
      ...createEmptyPercentages(),
      ...item.percentages,
    });
    setEditingId(item.id);
    setViewMode(false);
    setShowForm(true);
  };

  const handleLockPlan = async () => {
    if (selectedIds.length !== 1) {
      alert("Select one concession plan");
      return;
    }

    const item = selectedSingle;
    if (item.isLocked) {
      alert("Plan already locked");
      return;
    }

    const ok = window.confirm(
      "Once locked, this plan cannot be edited by school admin. Continue?"
    );
    if (!ok) return;

    const now = new Date();
    try {
      setSaving(true);
      await adminPanelService.updateConcession(item.id, {
        isLocked: true,
        lockedBy: currentUser.employeeName,
        lockedOnDate: now.toLocaleDateString("en-IN"),
        lockedOnTime: now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      });
      alert("Concession plan locked successfully");
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to lock plan");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async () => {
    if (selectedIds.length === 0) {
      alert("Select at least one plan to delete");
      return;
    }

    const lockedSelected = selectedPlans.some((p) => p.isLocked);
    if (lockedSelected) {
      alert("Locked plans cannot be deleted");
      return;
    }

    const ok = window.confirm("Delete selected concession plans?");
    if (!ok) return;

    try {
      setSaving(true);
      for (const id of selectedIds) {
        await adminPanelService.deleteConcession(id);
      }
      setSelectedIds([]);
      alert("Concession plans deleted successfully");
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete concession plans");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="concession-plan-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => {
            if (showForm) {
              resetForm();
              setShowForm(false);
            } else {
              window.location.href = "/admin-panel";
            }
          }}
        >
          ←
        </AppButton>

        <div>
          <h1>
            {showForm
              ? viewMode
                ? "View Concession Plan"
                : editingId
                ? "Edit Concession Plan"
                : "Add New Concession Plan"
              : "Concession Management"}
          </h1>
          <p>Manage concession percentage plans</p>
        </div>
      </div>

      {!showForm && (
        <div className="top-action-bar">
          <AppButton
            type="primary"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            + Add New Concession Plan
          </AppButton>
        </div>
      )}

      {showForm && (
        <div className="common-card">
          <div className="filter-grid">
            <div className="form-group">
              <label>Concession Plan Name *</label>
              <input
                type="text"
                value={planName}
                disabled={viewMode || saving}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="Enter concession plan name"
              />
            </div>
          </div>

          <div className="fee-section-title">
            Concession Percentage Setup
          </div>

          <ConcessionPercentTable
            feeHeads={feeHeads}
            months={months}
            percentages={percentages}
            viewMode={viewMode}
            onChange={handlePercentageChange}
          />

          <div className="bottom-action-row">
            {!viewMode && (
              <AppButton
                type="primary"
                onClick={handleSavePlan}
                disabled={saving}
              >
                {saving ? "Saving..." : editingId ? "Update Plan" : "Save Plan"}
              </AppButton>
            )}

            <AppButton
              type="secondary"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              disabled={saving}
            >
              Go Back
            </AppButton>
          </div>

          <div className="last-edit-footer">
            <div>
              <strong>Updated By:</strong> {selectedSingle?.updatedBy || "-"}
            </div>
            <div>
              <strong>Updated Date:</strong> {selectedSingle?.updatedDate || "-"}
            </div>
            <div>
              <strong>Updated Time:</strong> {selectedSingle?.updatedTime || "-"}
            </div>
          </div>
        </div>
      )}

      {!showForm && (
        <div className="common-card">
          <div className="list-header">
            <div>
              <h2>Concession Plan List</h2>
              <p className="lock-status">
                {selectedIds.length === 1 ? currentStatusText : "🔓 Editable"}
              </p>
            </div>

            <div className="list-action-buttons">
              <AppButton type="primary" onClick={handleLockPlan} disabled={saving || loading}>
                Lock Plan
              </AppButton>

              <AppButton type="primary" onClick={handleView} disabled={saving || loading}>
                View
              </AppButton>

              <AppButton type="primary" onClick={handleEdit} disabled={saving || loading}>
                Edit
              </AppButton>

              <AppButton type="secondary" onClick={handleDeletePlan} disabled={saving || loading}>
                Delete
              </AppButton>
            </div>
          </div>

          {loading ? (
            <SkeletonTable rows={4} columns={5} />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={
                          savedPlans.length > 0 &&
                          selectedIds.length === savedPlans.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(savedPlans.map((item) => item.id));
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                      />
                    </th>
                    <th>S.No</th>
                    <th>Concession Plan Name</th>
                    <th>Locked By</th>
                    <th>Locked On</th>
                  </tr>
                </thead>

                <tbody>
                  {savedPlans.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-row">
                        No concession plan found
                      </td>
                    </tr>
                  ) : (
                    savedPlans.map((item, index) => (
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
                        <td>{item.planName}</td>
                        <td>{item.lockedBy || "-"}</td>
                        <td>
                          {item.lockedOnDate
                            ? `${item.lockedOnDate} ${item.lockedOnTime}`
                            : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ConcessionPercentTable({
  feeHeads,
  months,
  percentages,
  viewMode,
  onChange,
}) {
  if (!feeHeads || feeHeads.length === 0) {
    return (
      <div className="table-wrap">
        <p style={{ padding: "16px", textAlign: "center", color: "#64748b" }}>
          No fee heads found. Please configure fee heads in Fee Scheme first.
        </p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Fee Head</th>
            {months.map((month) => (
              <th key={month}>{month}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {feeHeads.map((head) => {
            const headKey = head.id || head.headName;
            return (
              <tr key={headKey}>
                <td>{head.headName}</td>
                {months.map((month) => (
                  <td key={month}>
                    <input
                      className="amount-input"
                      type="number"
                      min="0"
                      max="100"
                      value={percentages?.[headKey]?.[month] || ""}
                      disabled={viewMode}
                      onChange={(e) =>
                        onChange(headKey, month, e.target.value)
                      }
                      placeholder="%"
                    />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default ConcessionManagement;