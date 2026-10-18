import React, { useEffect, useState } from "react";
import "./feePlanManagement.css";
import AppButton from "../components/AppButton";

function FeePlanManagement() {
  const schoolId = localStorage.getItem("schoolId") || "SCH001";

  const currentUser = {
    name: localStorage.getItem("userName") || "School Admin",
  };

  const classOptions = [
    "Class 1",
    "Class 2",
    "Class 3",
    "Class 4",
    "Class 5",
    "Class 6",
    "Class 7",
    "Class 8",
  ];

  const feePlanNames = ["6HM", "6EM", "7HM", "7EM"];

  const allowedFeeSchemeConfig = {
    schoolId: "SCH001",
    feeScheme: "Monthly",
    feeHeads: [
      "Tuition Fee",
      "Computer Fee",
      "Exam Fee",
      "Annual Fee",
      "Transport Fee",
    ],
    installmentCount: 3,
  };

  const feeSchemeColumns = {
    Monthly: [
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
      "JAN",
      "FEB",
      "MAR",
    ],
    Installment: Array.from(
      { length: allowedFeeSchemeConfig.installmentCount || 1 },
      (_, index) => `Installment ${index + 1}`
    ),
    Quarterly: ["Quarter 1", "Quarter 2", "Quarter 3", "Quarter 4"],
    "Half Yearly": ["Half Yearly 1", "Half Yearly 2"],
    Yearly: ["Yearly"],
    Annual: ["Annual"],
  };

  const allowedFeeScheme = allowedFeeSchemeConfig.feeScheme || "Monthly";
  const feeHeads = allowedFeeSchemeConfig.feeHeads || [];
  const columns = feeSchemeColumns[allowedFeeScheme] || [];

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedPlanName, setSelectedPlanName] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [selectedIds, setSelectedIds] = useState([]);
  const [savedPlans, setSavedPlans] = useState([]);

  const [showCopyPopup, setShowCopyPopup] = useState(false);
  const [copyTargetClass, setCopyTargetClass] = useState("");
  const [copyTargetPlanName, setCopyTargetPlanName] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [isLocked] = useState(false);

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

  const [newStudentAmounts, setNewStudentAmounts] =
    useState(createEmptyAmounts());

  const [oldStudentAmounts, setOldStudentAmounts] =
    useState(createEmptyAmounts());

  useEffect(() => {
    if (!selectedClass || !selectedPlanName) {
      setEditingId(null);
      setNewStudentAmounts(createEmptyAmounts());
      setOldStudentAmounts(createEmptyAmounts());
      return;
    }

    const existingPlan = savedPlans.find(
      (item) =>
        item.schoolId === schoolId &&
        item.className === selectedClass &&
        item.feePlanName === selectedPlanName
    );

    if (existingPlan) {
      setEditingId(existingPlan.id);
      setNewStudentAmounts(existingPlan.newStudentAmounts);
      setOldStudentAmounts(existingPlan.oldStudentAmounts);
    } else {
      setEditingId(null);
      setNewStudentAmounts(createEmptyAmounts());
      setOldStudentAmounts(createEmptyAmounts());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, selectedPlanName, savedPlans, schoolId]);

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

    const setter =
      type === "new" ? setNewStudentAmounts : setOldStudentAmounts;

    setter((prev) => ({
      ...prev,
      [head]: {
        ...prev[head],
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

  const handleSaveFeePlan = () => {
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

    const now = new Date();

    const planData = {
      id: editingId || Date.now(),
      schoolId,
      className: selectedClass,
      feeScheme: allowedFeeScheme,
      feePlanName: selectedPlanName,
      feeHeads: [...feeHeads],
      columns: [...columns],
      newStudentAmounts,
      oldStudentAmounts,
      newTotal: getSectionTotal(newStudentAmounts),
      oldTotal: getSectionTotal(oldStudentAmounts),
      isUsed: false,
      updatedBy: currentUser.name,
      updatedDate: now.toLocaleDateString("en-IN"),
      updatedTime: now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    };

    if (editingId) {
      setSavedPlans((prev) =>
        prev.map((item) =>
          item.id === editingId ? planData : item
        )
      );
    } else {
      const exists = savedPlans.some(
        (item) =>
          item.schoolId === schoolId &&
          item.className === selectedClass &&
          item.feePlanName === selectedPlanName
      );

      if (exists) {
        alert("Fee plan already exists");
        return;
      }

      setSavedPlans([...savedPlans, planData]);
    }

    alert("Fee plan saved successfully");
    setSelectedIds([]);
  };

  const handleCopyPlan = () => {
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

    const alreadyExists = savedPlans.some(
      (item) =>
        item.schoolId === schoolId &&
        item.className === copyTargetClass &&
        item.feePlanName === copyTargetPlanName
    );

    if (alreadyExists) {
      alert("Target fee plan already exists");
      return;
    }

    const now = new Date();

    const copiedPlan = {
      id: Date.now(),
      schoolId,
      className: copyTargetClass,
      feeScheme: allowedFeeScheme,
      feePlanName: copyTargetPlanName,
      feeHeads: [...feeHeads],
      columns: [...columns],
      newStudentAmounts,
      oldStudentAmounts,
      newTotal: getSectionTotal(newStudentAmounts),
      oldTotal: getSectionTotal(oldStudentAmounts),
      isUsed: false,
      updatedBy: currentUser.name,
      updatedDate: now.toLocaleDateString("en-IN"),
      updatedTime: now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    };

    setSavedPlans([...savedPlans, copiedPlan]);

    setCopyTargetClass("");
    setCopyTargetPlanName("");
    setShowCopyPopup(false);

    alert("Fee plan copied successfully");
  };

  const lastEditedPlan = editingId
    ? savedPlans.find((item) => item.id === editingId)
    : null;

  const visibleSavedPlans = savedPlans.filter(
    (item) => item.schoolId === schoolId
  );

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

        <FeeAmountTable
          feeHeads={feeHeads}
          columns={columns}
          amounts={newStudentAmounts}
          onChange={(head, col, value) =>
            handleAmountChange("new", head, col, value)
          }
        />

        <div className="fee-total-row">
          New Student Total: ₹{getSectionTotal(newStudentAmounts)}
        </div>

        <div className="fee-section-title">Old Student Setup</div>

        <FeeAmountTable
          feeHeads={feeHeads}
          columns={columns}
          amounts={oldStudentAmounts}
          onChange={(head, col, value) =>
            handleAmountChange("old", head, col, value)
          }
        />

        <div className="fee-total-row">
          Old Student Total: ₹{getSectionTotal(oldStudentAmounts)}
        </div>

        <div className="bottom-action-row">
          <AppButton type="primary" onClick={handleSaveFeePlan}>
            Save Fee Plan
          </AppButton>

          <AppButton
            type="primary"
            onClick={() => setShowCopyPopup(true)}
          >
            Copy Fee Plan
          </AppButton>
        </div>

        <div className="last-edit-footer">
          <div>
            <strong>Updated By:</strong>{" "}
            {lastEditedPlan?.updatedBy || "-"}
          </div>

          <div>
            <strong>Updated Date:</strong>{" "}
            {lastEditedPlan?.updatedDate || "-"}
          </div>

          <div>
            <strong>Updated Time:</strong>{" "}
            {lastEditedPlan?.updatedTime || "-"}
          </div>
        </div>
      </div>

      <div className="common-card">
        <div className="list-header">
          <h2>Saved Fee Plan List</h2>
        </div>

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
              {visibleSavedPlans.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-row">
                    No fee plan found
                  </td>
                </tr>
              ) : (
                visibleSavedPlans.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>{item.className}</td>
                    <td>{item.feeScheme}</td>
                    <td>{item.feePlanName}</td>
                    <td>₹{item.newTotal}</td>
                    <td>₹{item.oldTotal}</td>
                    <td>₹{item.newTotal + item.oldTotal}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
              <AppButton type="primary" onClick={handleCopyPlan}>
                Copy
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FeeAmountTable({ feeHeads, columns, amounts, onChange }) {
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