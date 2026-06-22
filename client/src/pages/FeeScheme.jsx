import React, { useState } from "react";
import "./feeScheme.css";
import AppButton from "../components/AppButton";

function FeeScheme() {
  const schoolId = localStorage.getItem("schoolId") || "SCH001";

  const allowedFeeTypes = [
    "Monthly",
    "Installment",
    "Quarterly",
    "Half Yearly",
    "Yearly",
  ];

  const monthOptions = [
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

  const [selectedFeeType, setSelectedFeeType] =
    useState("Monthly");

  const [feeHeads, setFeeHeads] =
    useState([]);

  const [selectedIds, setSelectedIds] =
    useState([]);

  const [showAddPopup, setShowAddPopup] =
    useState(false);

  const [showEditPopup, setShowEditPopup] =
    useState(false);

  const [feeHeadName, setFeeHeadName] =
    useState("");

  const [selectedMonths, setSelectedMonths] =
    useState([]);

  const [editingId, setEditingId] =
    useState(null);

  const [editingFeeType, setEditingFeeType] =
    useState("");

  const [isLocked] =
    useState(false);

  const getMonthsText = (feeType = selectedFeeType) => {
    if (feeType === "Monthly") {
      return "APR-MAR";
    }

    if (feeType === "Quarterly") {
      return "Quarterly";
    }

    if (feeType === "Half Yearly") {
      return "Half Yearly";
    }

    if (feeType === "Yearly") {
      return "APR-MAR";
    }

    return selectedMonths.join(", ");
  };

  const resetForm = () => {
    setFeeHeadName("");
    setSelectedMonths([]);
    setEditingId(null);
    setEditingFeeType("");
  };

  const getUsedInstallmentMonths = () => {
    return feeHeads
      .filter(
        (item) =>
          item.schoolId === schoolId &&
          item.feeType === "Installment" &&
          item.id !== editingId
      )
      .flatMap((item) =>
        item.months
          ? item.months.split(", ")
          : []
      );
  };

  const isMonthDisabled = (month) => {
    return getUsedInstallmentMonths().includes(month);
  };

  const isFeeHeadUsed = (item) => {
    return item.isUsedInFeePlan === true;
  };

  const handleAddFeeHead = () => {
    if (isLocked) {
      alert(
        "Fee scheme locked by super admin"
      );

      return;
    }

    if (!feeHeadName.trim()) {
      alert(
        "Enter fee head name"
      );

      return;
    }

    const duplicateFeeHead =
      feeHeads.find(
        (item) =>
          item.schoolId === schoolId &&
          item.feeType === selectedFeeType &&
          item.feeHeadName
            .trim()
            .toLowerCase() ===
            feeHeadName
              .trim()
              .toLowerCase()
      );

    if (duplicateFeeHead) {
      alert(
        "Fee head already exists"
      );

      return;
    }

    if (
      selectedFeeType === "Installment" &&
      selectedMonths.length === 0
    ) {
      alert(
        "Select months"
      );

      return;
    }

    const newItem = {
      id: Date.now(),
      schoolId,
      feeHeadName,
      feeType: selectedFeeType,
      months: getMonthsText(selectedFeeType),
      isUsedInFeePlan: false,
    };

    setFeeHeads([
      ...feeHeads,
      newItem,
    ]);

    alert(
      "Fee head added successfully"
    );

    resetForm();
    setShowAddPopup(false);
  };

  const handleEditOpen = () => {
    if (isLocked) {
      alert(
        "Fee scheme locked by super admin"
      );

      return;
    }

    if (
      selectedIds.length !== 1
    ) {
      alert(
        "Select one fee head"
      );

      return;
    }

    const item = feeHeads.find(
      (head) =>
        head.id === selectedIds[0]
    );

    if (!item) return;

    if (isFeeHeadUsed(item)) {
      alert(
        "This fee head is used in Fee Plan Management and cannot be edited/deleted."
      );

      return;
    }

    setEditingId(item.id);
    setEditingFeeType(item.feeType);
    setFeeHeadName(
      item.feeHeadName
    );

    if (
      item.feeType === "Installment"
    ) {
      setSelectedMonths(
        item.months
          ? item.months.split(", ")
          : []
      );
    } else {
      setSelectedMonths([]);
    }

    setShowEditPopup(true);
  };

  const handleUpdate = () => {
    if (!feeHeadName.trim()) {
      alert(
        "Enter fee head name"
      );

      return;
    }

    const duplicateFeeHead =
      feeHeads.find(
        (item) =>
          item.schoolId === schoolId &&
          item.feeType === editingFeeType &&
          item.feeHeadName
            .trim()
            .toLowerCase() ===
            feeHeadName
              .trim()
              .toLowerCase() &&
          item.id !== editingId
      );

    if (duplicateFeeHead) {
      alert(
        "Fee head already exists"
      );

      return;
    }

    if (
      editingFeeType === "Installment" &&
      selectedMonths.length === 0
    ) {
      alert(
        "Select months"
      );

      return;
    }

    setFeeHeads(
      feeHeads.map((item) => {
        if (
          item.id !== editingId
        ) {
          return item;
        }

        return {
          ...item,
          feeHeadName,
          months: getMonthsText(editingFeeType),
        };
      })
    );

    alert(
      "Fee head updated successfully"
    );

    resetForm();
    setSelectedIds([]);
    setShowEditPopup(false);
  };

  const handleDelete = () => {
    if (isLocked) {
      alert(
        "Fee scheme locked by super admin"
      );

      return;
    }

    if (
      selectedIds.length === 0
    ) {
      alert(
        "Select fee head"
      );

      return;
    }

    const selectedFeeHeads =
      feeHeads.filter((item) =>
        selectedIds.includes(item.id)
      );

    const usedFeeHead =
      selectedFeeHeads.some((item) =>
        isFeeHeadUsed(item)
      );

    if (usedFeeHead) {
      alert(
        "This fee head is used in Fee Plan Management and cannot be edited/deleted."
      );

      return;
    }

    const ok =
      window.confirm(
        "Delete selected fee heads?"
      );

    if (!ok) return;

    setFeeHeads(
      feeHeads.filter(
        (item) =>
          !selectedIds.includes(
            item.id
          )
      )
    );

    setSelectedIds([]);

    alert(
      "Fee heads deleted successfully"
    );
  };

  const visibleFeeHeads =
    feeHeads
      .filter(
        (item) =>
          item.schoolId === schoolId
      )
      .sort((a, b) =>
        a.feeHeadName.localeCompare(
          b.feeHeadName
        )
      );

  return (
    <div className="fee-scheme-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => {
            window.location.href =
              "/admin-panel";
          }}
        >
          ←
        </AppButton>

        <div>
          <h1>
            Fee Scheme
          </h1>

          <p>
            Manage fee heads and fee types
          </p>
        </div>
      </div>

      <div className="common-card">
        <div className="fee-type-grid">
          {allowedFeeTypes.map(
            (item) => (
              <div
                key={item}
                className={
                  selectedFeeType === item
                    ? "fee-type-card active-type"
                    : "fee-type-card"
                }
                onClick={() => {
                  setSelectedFeeType(
                    item
                  );
                }}
              >
                <h3>
                  {item}
                </h3>
              </div>
            )
          )}
        </div>
      </div>

      <div className="common-card">
        <div className="list-header">
          <div>
            <h2>
              Fee Head List
            </h2>

            <p className="lock-status">
              {isLocked
                ? "🔒 Locked by Super Admin"
                : "🔓 Editable"}
            </p>
          </div>

          <div className="list-action-buttons">
            <AppButton
              type="primary"
              onClick={() => {
                resetForm();
                setShowAddPopup(true);
              }}
            >
              + Add Fee Head
            </AppButton>

            <AppButton
              type="primary"
              onClick={handleEditOpen}
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
                      visibleFeeHeads.length > 0 &&
                      selectedIds.length ===
                        visibleFeeHeads.length
                    }
                    onChange={(e) => {
                      if (
                        e.target.checked
                      ) {
                        setSelectedIds(
                          visibleFeeHeads.map(
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

                <th>
                  S.No
                </th>

                <th>
                  Fee Head Name
                </th>

                <th>
                  Fee Type
                </th>

                <th>
                  Months / Installment
                </th>
              </tr>
            </thead>

            <tbody>
              {visibleFeeHeads.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="empty-row"
                  >
                    No fee head found
                  </td>
                </tr>
              ) : (
                visibleFeeHeads.map(
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
                        {item.feeHeadName}
                      </td>

                      <td>
                        {item.feeType}
                      </td>

                      <td>
                        {item.months}
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddPopup && (
        <div className="popup-overlay">
          <div className="view-popup">
            <div className="popup-head">
              <h2>
                Add Fee Head
              </h2>

              <button
                className="popup-close-btn"
                onClick={() => {
                  setShowAddPopup(false);
                }}
              >
                ×
              </button>
            </div>

            <div className="form-group">
              <label>
                Fee Head Name
              </label>

              <input
                type="text"
                placeholder="Enter fee head name"
                value={feeHeadName}
                onChange={(e) => {
                  setFeeHeadName(
                    e.target.value
                  );
                }}
              />
            </div>

            {selectedFeeType ===
              "Installment" && (
              <div className="form-group">
                <label>
                  Select Months
                </label>

                <div className="month-grid">
                  {monthOptions.map(
                    (month) => (
                      <label
                        key={month}
                        className={
                          isMonthDisabled(month)
                            ? "month-check disabled-month"
                            : "month-check"
                        }
                      >
                        <input
                          type="checkbox"
                          disabled={isMonthDisabled(month)}
                          checked={selectedMonths.includes(
                            month
                          )}
                          onChange={() => {
                            setSelectedMonths(
                              (prev) =>
                                prev.includes(
                                  month
                                )
                                  ? prev.filter(
                                      (item) =>
                                        item !==
                                        month
                                    )
                                  : [
                                      ...prev,
                                      month,
                                    ]
                            );
                          }}
                        />

                        {month}
                      </label>
                    )
                  )}
                </div>
              </div>
            )}

            <div className="form-actions">
              <AppButton
                type="primary"
                onClick={handleAddFeeHead}
              >
                Save
              </AppButton>
            </div>
          </div>
        </div>
      )}

      {showEditPopup && (
        <div className="popup-overlay">
          <div className="view-popup">
            <div className="popup-head">
              <h2>
                Edit Fee Head
              </h2>

              <button
                className="popup-close-btn"
                onClick={() => {
                  setShowEditPopup(false);
                }}
              >
                ×
              </button>
            </div>

            <div className="form-group">
              <label>
                Fee Head Name
              </label>

              <input
                type="text"
                value={feeHeadName}
                onChange={(e) => {
                  setFeeHeadName(
                    e.target.value
                  );
                }}
              />
            </div>

            {editingFeeType ===
              "Installment" && (
              <div className="form-group">
                <label>
                  Select Months
                </label>

                <div className="month-grid">
                  {monthOptions.map(
                    (month) => (
                      <label
                        key={month}
                        className={
                          isMonthDisabled(month)
                            ? "month-check disabled-month"
                            : "month-check"
                        }
                      >
                        <input
                          type="checkbox"
                          disabled={isMonthDisabled(month)}
                          checked={selectedMonths.includes(
                            month
                          )}
                          onChange={() => {
                            setSelectedMonths(
                              (prev) =>
                                prev.includes(
                                  month
                                )
                                  ? prev.filter(
                                      (item) =>
                                        item !==
                                        month
                                    )
                                  : [
                                      ...prev,
                                      month,
                                    ]
                            );
                          }}
                        />

                        {month}
                      </label>
                    )
                  )}
                </div>
              </div>
            )}

            <div className="form-actions">
              <AppButton
                type="primary"
                onClick={handleUpdate}
              >
                Update
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeeScheme;