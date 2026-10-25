import React, { useEffect, useState } from "react";
import "./feePlanManagement.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { adminPanelService } from "../services/api";

function FeePlanManagement() {
  const currentUser = {
    name: localStorage.getItem("userName") || "School Admin",
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [classOptions, setClassOptions] = useState([]);
  const [feePlanNames, setFeePlanNames] = useState([]);
  const [allowedFeeScheme, setAllowedFeeScheme] = useState("Monthly");
  const [feeHeads, setFeeHeads] = useState([]);
  const [installmentCount, setInstallmentCount] = useState(3);
  const [isLocked, setIsLocked] = useState(false);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedPlanName, setSelectedPlanName] = useState("");
  const [savedPlans, setSavedPlans] = useState([]);

  const [showCopyPopup, setShowCopyPopup] = useState(false);
  const [copyTargetClass, setCopyTargetClass] = useState("");
  const [copyTargetPlanName, setCopyTargetPlanName] = useState("");

  const [editingId, setEditingId] = useState(null);

  const feeSchemeColumns = {
    Monthly: [
      "APR", "MAY", "JUN", "JUL", "AUG", "SEP",
      "OCT", "NOV", "DEC", "JAN", "FEB", "MAR",
    ],
    Installment: Array.from(
      { length: installmentCount || 1 },
      (_, index) => `Installment ${index + 1}`
    ),
    Quarterly: ["Quarter 1", "Quarter 2", "Quarter 3", "Quarter 4"],
    "Half Yearly": ["Half Yearly 1", "Half Yearly 2"],
    Yearly: ["Yearly"],
    Annual: ["Annual"],
  };

  const columns = feeSchemeColumns[allowedFeeScheme] || feeSchemeColumns.Monthly;

  const createEmptyAmounts = () => {
    const data = {};
    feeHeads.forEach((head) => {
      data[head] = {};
      columns.forEach((col) => {
        data[head][col] = "";
      });
    });
    return data;
  };

  const [newStudentAmounts, setNewStudentAmounts] = useState({});
  const [oldStudentAmounts, setOldStudentAmounts] = useState({});

  // 1. Initial Meta & Saved Plans load
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [metaRes, plansRes] = await Promise.all([
        adminPanelService.getMeta(),
        adminPanelService.getFeePlans(),
      ]);

      if (metaRes.data?.data) {
        const { feeScheme, feePlanNames: names, classes } = metaRes.data.data;
        if (classes) {
          setClassOptions(classes.map((c) => c.className));
        }
        if (names) {
          setFeePlanNames(names.map((n) => n.feePlanName));
        }
        if (feeScheme) {
          setAllowedFeeScheme(feeScheme.schemeType || "Monthly");
          setInstallmentCount(feeScheme.installmentCount || 3);
          setIsLocked(Boolean(feeScheme.isLocked));
          if (Array.isArray(feeScheme.feeHeads)) {
            setFeeHeads(feeScheme.feeHeads.map((h) => h.feeHeadName));
          }
        }
      }

      if (plansRes.data?.data) {
        setSavedPlans(plansRes.data.data);
      }
    } catch (err) {
      console.error("Failed to load initial fee plan management data", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Adjust amounts when selected class, plan, or heads change
  useEffect(() => {
    if (!selectedClass || !selectedPlanName) {
      setEditingId(null);
      setNewStudentAmounts(createEmptyAmounts());
      setOldStudentAmounts(createEmptyAmounts());
      return;
    }

    const existingPlan = savedPlans.find(
      (item) =>
        item.className === selectedClass &&
        item.feePlanName === selectedPlanName
    );

    if (existingPlan) {
      setEditingId(existingPlan._id || existingPlan.id);
      setNewStudentAmounts(existingPlan.newStudentAmounts || createEmptyAmounts());
      setOldStudentAmounts(existingPlan.oldStudentAmounts || createEmptyAmounts());
    } else {
      setEditingId(null);
      setNewStudentAmounts(createEmptyAmounts());
      setOldStudentAmounts(createEmptyAmounts());
    }
  }, [selectedClass, selectedPlanName, savedPlans, feeHeads, allowedFeeScheme]);

  const getSectionTotal = (amounts) => {
    let total = 0;
    feeHeads.forEach((head) => {
      columns.forEach((col) => {
        total += Number(amounts?.[head]?.[col] || 0);
      });
    });
    return total;
  };

  const handleAmountChange = (type, head, col, value) => {
    if (Number(value) < 0) {
      alert("Amount cannot be negative");
      return;
    }

    const setter = type === "new" ? setNewStudentAmounts : setOldStudentAmounts;
    setter((prev) => ({
      ...prev,
      [head]: {
        ...(prev[head] || {}),
        [col]: value,
      },
    }));
  };

  const validateAmounts = () => {
    let isValid = true;
    feeHeads.forEach((head) => {
      columns.forEach((col) => {
        if (
          Number(newStudentAmounts?.[head]?.[col] || 0) < 0 ||
          Number(oldStudentAmounts?.[head]?.[col] || 0) < 0
        ) {
          isValid = false;
        }
      });
    });

    if (!isValid) {
      alert("Amount cannot be negative");
    }
    return isValid;
  };

  const handleSaveFeePlan = async () => {
    if (isLocked) {
      alert("Fee plan locked by super admin");
      return;
    }

    if (!selectedClass) {
      alert("Select class");
      return;
    }

    if (!selectedPlanName) {
      alert("Select fee plan name");
      return;
    }

    if (!validateAmounts()) {
      return;
    }

    try {
      setSaving(true);
      const payload = {
        className: selectedClass,
        feeScheme: allowedFeeScheme,
        feePlanName: selectedPlanName,
        feeHeads: [...feeHeads],
        columns: [...columns],
        newStudentAmounts,
        oldStudentAmounts,
        newTotal: getSectionTotal(newStudentAmounts),
        oldTotal: getSectionTotal(oldStudentAmounts),
      };

      const res = await adminPanelService.saveFeePlan(payload);
      if (res.data?.data) {
        alert("Fee plan saved successfully");
        const plansRes = await adminPanelService.getFeePlans();
        if (plansRes.data?.data) {
          setSavedPlans(plansRes.data.data);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save fee plan");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyPlan = async () => {
    if (!selectedClass || !selectedPlanName) {
      alert("Open source class and fee plan first");
      return;
    }

    if (!copyTargetClass) {
      alert("Select target class");
      return;
    }

    if (!copyTargetPlanName) {
      alert("Select target fee plan name");
      return;
    }

    if (
      copyTargetClass === selectedClass &&
      copyTargetPlanName === selectedPlanName
    ) {
      alert("Source and target fee plan cannot be same");
      return;
    }

    try {
      setSaving(true);
      const res = await adminPanelService.copyFeePlan({
        sourceClass: selectedClass,
        sourcePlanName: selectedPlanName,
        targetClass: copyTargetClass,
        targetPlanName: copyTargetPlanName,
      });

      if (res.data?.data) {
        alert("Fee plan copied successfully");
        setCopyTargetClass("");
        setCopyTargetPlanName("");
        setShowCopyPopup(false);
        const plansRes = await adminPanelService.getFeePlans();
        if (plansRes.data?.data) {
          setSavedPlans(plansRes.data.data);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to copy fee plan");
    } finally {
      setSaving(false);
    }
  };

  const lastEditedPlan = editingId
    ? savedPlans.find((item) => (item._id || item.id) === editingId)
    : null;

  return (
    <div className="fee-plan-page">
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
          <h1>Fee Plan Management</h1>
          <p>Manage new and old student fee plans</p>
        </div>
      </div>

      <div className="common-card">
        <div className="filter-grid">
          <div className="form-group">
            <label>Fee Scheme</label>
            <input type="text" value={allowedFeeScheme} readOnly />
          </div>

          <div className="form-group">
            <label>Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">Select Class</option>
              {classOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Fee Plan Name</label>
            <select
              value={selectedPlanName}
              onChange={(e) => setSelectedPlanName(e.target.value)}
            >
              <option value="">Select Fee Plan Name</option>
              {feePlanNames.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="common-card">
        <div className="list-header">
          <div>
            <h2>Fee Plan Table</h2>
            <p className="lock-status">
              {isLocked ? "🔒 Locked by Super Admin" : "🔓 Editable"}
            </p>
          </div>
        </div>

        <div className="fee-section-title">New Student Setup</div>

        {loading ? (
          <SkeletonTable rows={4} columns={columns.length + 1} />
        ) : (
          <FeeAmountTable
            feeHeads={feeHeads}
            columns={columns}
            amounts={newStudentAmounts}
            onChange={(head, col, value) =>
              handleAmountChange("new", head, col, value)
            }
          />
        )}

        <div className="fee-total-row">
          New Student Total: ₹{getSectionTotal(newStudentAmounts)}
        </div>

        <div className="fee-section-title">Old Student Setup</div>

        {loading ? (
          <SkeletonTable rows={4} columns={columns.length + 1} />
        ) : (
          <FeeAmountTable
            feeHeads={feeHeads}
            columns={columns}
            amounts={oldStudentAmounts}
            onChange={(head, col, value) =>
              handleAmountChange("old", head, col, value)
            }
          />
        )}

        <div className="fee-total-row">
          Old Student Total: ₹{getSectionTotal(oldStudentAmounts)}
        </div>

        <div className="bottom-action-row">
          <AppButton
            type="primary"
            onClick={handleSaveFeePlan}
            disabled={saving || loading}
          >
            {saving ? "Saving..." : "Save Fee Plan"}
          </AppButton>

          <AppButton
            type="primary"
            onClick={() => setShowCopyPopup(true)}
            disabled={saving || loading}
          >
            Copy Fee Plan
          </AppButton>
        </div>

        <div className="last-edit-footer">
          <div>
            <strong>Updated By:</strong> {lastEditedPlan?.updatedBy || "-"}
          </div>

          <div>
            <strong>Updated Date:</strong> {lastEditedPlan?.updatedDate || "-"}
          </div>

          <div>
            <strong>Updated Time:</strong> {lastEditedPlan?.updatedTime || "-"}
          </div>
        </div>
      </div>

      <div className="common-card">
        <div className="list-header">
          <h2>Saved Fee Plan List</h2>
        </div>

        {loading ? (
          <SkeletonTable rows={4} columns={7} />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Class</th>
                  <th>Fee Scheme</th>
                  <th>Fee Plan Name</th>
                  <th>New Student Total</th>
                  <th>Old Student Total</th>
                  <th>Total Amount</th>
                </tr>
              </thead>

              <tbody>
                {savedPlans.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-row">
                      No fee plan found
                    </td>
                  </tr>
                ) : (
                  savedPlans.map((item, index) => (
                    <tr key={item._id || item.id}>
                      <td>{index + 1}</td>
                      <td>{item.className}</td>
                      <td>{item.feeScheme}</td>
                      <td>{item.feePlanName}</td>
                      <td>₹{item.newTotal}</td>
                      <td>₹{item.oldTotal}</td>
                      <td>₹{Number(item.newTotal || 0) + Number(item.oldTotal || 0)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCopyPopup && (
        <div className="popup-overlay">
          <div className="view-popup">
            <div className="popup-head">
              <h2>Copy Fee Plan</h2>

              <button
                className="popup-close-btn"
                onClick={() => setShowCopyPopup(false)}
              >
                ×
              </button>
            </div>

            <div className="form-group">
              <label>Target Class</label>
              <select
                value={copyTargetClass}
                onChange={(e) => setCopyTargetClass(e.target.value)}
              >
                <option value="">Select Target Class</option>
                {classOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Target Fee Plan Name</label>
              <select
                value={copyTargetPlanName}
                onChange={(e) => setCopyTargetPlanName(e.target.value)}
              >
                <option value="">Select Target Plan</option>
                {feePlanNames.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <AppButton type="primary" onClick={handleCopyPlan} disabled={saving}>
                {saving ? "Copying..." : "Copy"}
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FeeAmountTable({ feeHeads, columns, amounts, onChange }) {
  if (!feeHeads || feeHeads.length === 0) {
    return (
      <div className="table-wrap">
        <p style={{ padding: "16px", textAlign: "center", color: "#64748b" }}>
          No fee heads configured. Please configure fee heads in Fee Scheme first.
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
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {feeHeads.map((head) => (
            <tr key={head}>
              <td>{head}</td>
              {columns.map((col) => (
                <td key={col}>
                  <input
                    className="amount-input"
                    type="number"
                    min="0"
                    value={amounts?.[head]?.[col] || ""}
                    onChange={(e) => onChange(head, col, e.target.value)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default FeePlanManagement;