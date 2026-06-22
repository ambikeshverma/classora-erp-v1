import React, { useState } from "react";
import "./concessionManagement.css";
import AppButton from "../components/AppButton";

function ConcessionManagement() {
  const schoolId = localStorage.getItem("schoolId") || "SCH001";

  const currentUser = {
    userId: localStorage.getItem("userId") || "USR001",
    employeeName: localStorage.getItem("employeeName") || "Ankit Verma",
  };

  /*
    Future API Source:
    Fee Scheme Module se allowed fee scheme aur fee heads aayenge.
  */
  const feeSchemeData = {
    schoolId: "SCH001",
    feeScheme: "Monthly",
    installmentCount: 3,
    feeHeads: [
      {
        id: 1,
        schoolId: "SCH001",
        headName: "Monthly Fee",
      },
      {
        id: 2,
        schoolId: "SCH001",
        headName: "Computer Fee",
      },
      {
        id: 3,
        schoolId: "SCH001",
        headName: "Exam Fee",
      },
      {
        id: 4,
        schoolId: "SCH001",
        headName: "Transport Fee",
      },
      {
        id: 5,
        schoolId: "SCH001",
        headName: "Tie+Belt",
      },
      {
        id: 6,
        schoolId: "SCH001",
        headName: "ID Card",
      },
    ],
  };

  const allowedFeeSchemeConfig = feeSchemeData;

  const getColumns = () => {
    if (allowedFeeSchemeConfig.feeScheme === "Installment") {
      return Array.from(
        { length: allowedFeeSchemeConfig.installmentCount || 1 },
        (_, index) => `Installment ${index + 1}`
      );
    }

    if (allowedFeeSchemeConfig.feeScheme === "Quarterly") {
      return ["Quarter 1", "Quarter 2", "Quarter 3", "Quarter 4"];
    }

    if (allowedFeeSchemeConfig.feeScheme === "Half Yearly") {
      return ["Half Yearly 1", "Half Yearly 2"];
    }

    if (
      allowedFeeSchemeConfig.feeScheme === "Yearly" ||
      allowedFeeSchemeConfig.feeScheme === "Annual"
    ) {
      return ["Annual"];
    }

    return [
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
    ];
  };

  const months = getColumns();

  const feeHeads = feeSchemeData?.feeHeads || [];

  const schoolFeeHeads = feeHeads.filter(
    (item) => item.schoolId === schoolId
  );

  const createEmptyPercentages = () => {
    const data = {};

    schoolFeeHeads.forEach((head) => {
      data[head.id] = {};

      months.forEach((month) => {
        data[head.id][month] = "";
      });
    });

    return data;
  };

  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [planName, setPlanName] = useState("");
  const [percentages, setPercentages] = useState(createEmptyPercentages());

  const [savedPlans, setSavedPlans] = useState([
    {
      id: 1,
      schoolId: "SCH001",
      planName: "Staff Child",
      feeScheme: "Monthly",
      columns: [
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
      percentages: {
        1: {
          APR: "50",
          MAY: "50",
          JUN: "50",
          JUL: "50",
          AUG: "50",
          SEP: "50",
          OCT: "50",
          NOV: "50",
          DEC: "50",
          JAN: "50",
          FEB: "50",
          MAR: "50",
        },
        2: {
          APR: "25",
          MAY: "25",
          JUN: "25",
          JUL: "25",
          AUG: "25",
          SEP: "25",
          OCT: "25",
          NOV: "25",
          DEC: "25",
          JAN: "25",
          FEB: "25",
          MAR: "25",
        },
        3: {},
        4: {},
        5: {},
        6: {},
      },
      isLocked: false,
      isUsed: false,
      lockedBy: "",
      lockedByUserId: "",
      lockedOnDate: "",
      lockedOnTime: "",
      createdBy: "Ankit Verma",
      updatedBy: "Ankit Verma",
      updatedDate: "28/05/2026",
      updatedTime: "10:30 AM",
    },
    {
      id: 2,
      schoolId: "SCH001",
      planName: "Sibling Concession",
      feeScheme: "Monthly",
      columns: [
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
      percentages: {
        1: {
          APR: "20",
          MAY: "20",
          JUN: "20",
          JUL: "20",
          AUG: "20",
          SEP: "20",
          OCT: "20",
          NOV: "20",
          DEC: "20",
          JAN: "20",
          FEB: "20",
          MAR: "20",
        },
        2: {},
        3: {},
        4: {},
        5: {},
        6: {},
      },
      isLocked: true,
      isUsed: false,
      lockedBy: "Ankit Verma",
      lockedByUserId: "USR001",
      lockedOnDate: "28/05/2026",
      lockedOnTime: "11:15 AM",
      createdBy: "Ankit Verma",
      updatedBy: "Ankit Verma",
      updatedDate: "28/05/2026",
      updatedTime: "11:15 AM",
    },
  ]);

  const schoolPlans = savedPlans.filter((item) => item.schoolId === schoolId);

  const selectedPlans = schoolPlans.filter((item) =>
    selectedIds.includes(item.id)
  );

  const selectedSingle = selectedPlans.length === 1 ? selectedPlans[0] : null;

  const currentStatusText = selectedSingle?.isLocked
    ? "🔒 Locked"
    : "🔓 Editable";

  const usableConcessionPlans = schoolPlans.filter((item) => item.isLocked);

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
        ...prev[headId],
        [month]: value,
      },
    }));
  };

  const validatePlan = () => {
    if (!planName.trim()) {
      alert("Enter concession plan name");
      return false;
    }

    const duplicate = schoolPlans.some(
      (item) =>
        item.planName.toLowerCase().trim() ===
          planName.toLowerCase().trim() &&
        item.id !== editingId
    );

    if (duplicate) {
      alert("Concession plan already exists");
      return false;
    }

    return true;
  };

  const handleSavePlan = () => {
    if (!validatePlan()) return;

    const now = new Date();

    const date = now.toLocaleDateString("en-IN");
    const time = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const planData = {
      id: editingId || Date.now(),
      schoolId,
      planName: planName.trim(),
      feeScheme: allowedFeeSchemeConfig.feeScheme,
      columns: [...months],
      percentages,
      isLocked: false,
      isUsed: false,
      lockedBy: "",
      lockedByUserId: "",
      lockedOnDate: "",
      lockedOnTime: "",
      createdBy: currentUser.employeeName,
      updatedBy: currentUser.employeeName,
      updatedDate: date,
      updatedTime: time,
    };

    if (editingId) {
      const editingPlan = savedPlans.find((item) => item.id === editingId);

      if (editingPlan?.isLocked) {
        alert("Locked plan cannot be edited");
        return;
      }

      if (editingPlan?.isUsed) {
        alert("Used plan cannot be edited");
        return;
      }

      setSavedPlans(
        savedPlans.map((item) =>
          item.id === editingId
            ? {
                ...item,
                planName: planName.trim(),
                feeScheme: allowedFeeSchemeConfig.feeScheme,
                columns: [...months],
                percentages,
                updatedBy: currentUser.employeeName,
                updatedDate: date,
                updatedTime: time,
              }
            : item
        )
      );

      alert("Concession plan updated successfully");
    } else {
      setSavedPlans([...savedPlans, planData]);

      alert("Concession plan saved successfully");
    }

    resetForm();
    setShowForm(false);
    setSelectedIds([]);
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

  const handleLockPlan = () => {
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

    setSavedPlans(
      savedPlans.map((plan) =>
        plan.id === item.id
          ? {
              ...plan,
              isLocked: true,
              lockedBy: currentUser.employeeName,
              lockedByUserId: currentUser.userId,
              lockedOnDate: now.toLocaleDateString("en-IN"),
              lockedOnTime: now.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }),
            }
          : plan
      )
    );

    alert("Concession plan locked successfully");
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
                disabled={viewMode}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="Enter concession plan name"
              />
            </div>
          </div>

          <div className="fee-section-title">
            Concession Percentage Setup
          </div>

          <ConcessionPercentTable
            feeHeads={schoolFeeHeads}
            months={months}
            percentages={percentages}
            viewMode={viewMode}
            onChange={handlePercentageChange}
          />

          <div className="bottom-action-row">
            {!viewMode && (
              <AppButton type="primary" onClick={handleSavePlan}>
                {editingId ? "Update Plan" : "Save Plan"}
              </AppButton>
            )}

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

          <div className="last-edit-footer">
            <div>
              <strong>Updated By:</strong>{" "}
              {selectedSingle?.updatedBy || "-"}
            </div>

            <div>
              <strong>Updated Date:</strong>{" "}
              {selectedSingle?.updatedDate || "-"}
            </div>

            <div>
              <strong>Updated Time:</strong>{" "}
              {selectedSingle?.updatedTime || "-"}
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
              <AppButton type="primary" onClick={handleLockPlan}>
                Lock Plan
              </AppButton>

              <AppButton type="primary" onClick={handleView}>
                View
              </AppButton>

              <AppButton type="primary" onClick={handleEdit}>
                Edit
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
                        schoolPlans.length > 0 &&
                        selectedIds.length === schoolPlans.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(schoolPlans.map((item) => item.id));
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
                {schoolPlans.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-row">
                      No concession plan found
                    </td>
                  </tr>
                ) : (
                  schoolPlans.map((item, index) => (
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

          <input type="hidden" value={usableConcessionPlans.length} readOnly />
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
          {feeHeads.map((head) => (
            <tr key={head.id}>
              <td>{head.headName}</td>

              {months.map((month) => (
                <td key={month}>
                  <input
                    className="amount-input"
                    type="number"
                    min="0"
                    max="100"
                    value={percentages?.[head.id]?.[month] || ""}
                    disabled={viewMode}
                    onChange={(e) =>
                      onChange(head.id, month, e.target.value)
                    }
                    placeholder="%"
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

export default ConcessionManagement;