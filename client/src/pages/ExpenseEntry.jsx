import React, { useState } from "react";
import "./expenseEntry.css";
import AppButton from "../components/AppButton";
function ExpenseEntry() {
  const schoolId =
  localStorage.getItem("schoolId") || "";
  const demoGroups = [
  { id: 1, groupName: "Salary Expense" },
  { id: 2, groupName: "Transport Expense" },
  { id: 3, groupName: "Maintenance Expense" },
];

  const demoHeads = [
    { id: 1, groupId: 1, headName: "Salary",},
    { id: 2, groupId: 1, headName: "Electricity bill",},
    { id: 3, groupId: 2, headName: "Office expense", },
    { id: 4, groupId: 3, headName: "Vehicle expense", },
  ];

  const paymentModes = ["Cash", "UPI", "Bank Transfer", "Cheque", "Card"];

  const [showForm, setShowForm] = useState(false);
  const [entries, setEntries] = useState([]);
  const [viewEntry, setViewEntry] = useState(null);
  const [selectedEntries, setSelectedEntries] = useState([]);
  const [searchVoucher, setSearchVoucher] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
  voucher: "",
  from: "",
  to: "",
});

  const [formData, setFormData] = useState({
    groupId: "",
    accountHeadId: "",
    voucherDate: new Date().toISOString().split("T")[0],
    PaidAmount: "",
    PaidToRef: "",
    PaidToName: "",
    paymentMode: "",
    bankName: "",
    transactionNo: "",
    transactionDate: "",
    description: "",
    attachment: "",
  });

  const selectedGroup = demoGroups.find(
    (group) => String(group.id) === String(formData.groupId)
  );

  const filteredHeads = demoHeads.filter(
    (head) =>
      String(head.groupId) === String(formData.groupId)
  );

  const SESSION = "2026";

const generateVoucherNo = () => {
  const nextNo = entries.length + 1;

  return `EXP${SESSION}${String(
    nextNo
  ).padStart(4, "0")}`;
};

  const resetForm = () => {
    setFormData({
      groupId: "",
      accountHeadId: "",
      voucherDate: new Date().toISOString().split("T")[0],
      paidAmount: "",
      paidToRef: "",
      paidToName: "",
      paymentMode: "",
      bankName: "",
      transactionNo: "",
      transactionDate: "",
      description: "",
      attachment: "",
    });
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

   if (name === "attachment") {

  setFormData({
    ...formData,
    attachment: files[0] || null,
  });

  return;
}

    if (name === "groupId") {
      setFormData({
        ...formData,
        groupId: value,
        accountHeadId: "",
      });
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const selectedHead = demoHeads.find(
    (head) => String(head.id) === String(formData.accountHeadId)
  );

  const handleSave = () => {
    if (
      !formData.groupId ||
      !formData.accountHeadId ||
      !formData.voucherDate ||
      !formData.paidAmount ||
      !formData.paidToName ||
      !formData.paymentMode
    ) {
      alert("Please fill all required fields");
      return;
    }
    if (Number(formData.paidAmount) <= 0) {
  alert("Amount must be greater than zero");
  return;
}
    const newEntry = {
  id: Date.now(),
  schoolId,
  voucherNo: generateVoucherNo(),

  status: "SUCCESS",

  ...formData,

  groupName: selectedGroup.groupName,
  accountHeadName: selectedHead.headName,

  createdBy: "Admin",
  createdOn: new Date().toLocaleString(),
};

setEntries([...entries, newEntry]);

alert("Expense entry saved successfully");

    resetForm();
    setShowForm(false);
  };

  const handleCancelEntry = (id) => {
    const ok = window.confirm("Cancel this expense entry?");
    if (!ok) return;

    setEntries(
      entries.map((entry) =>
        entry.id === id ? { ...entry, status: "Cancelled" } : entry
      )
    );
    if (
  viewEntry &&
  viewEntry.id === id
) {

  setViewEntry({
    ...viewEntry,
    status: "Cancelled",
  });

}
  };

  const filteredEntries = entries.filter((entry) => {
  const voucherMatch = appliedFilters.voucher
    ? entry.voucherNo
        .toLowerCase()
        .includes(appliedFilters.voucher.toLowerCase())
    : true;

  const fromMatch = appliedFilters.from
    ? entry.voucherDate >= appliedFilters.from
    : true;

  const toMatch = appliedFilters.to
    ? entry.voucherDate <= appliedFilters.to
    : true;

  return voucherMatch && fromMatch && toMatch;
});
const handleViewSelected = () => {

  if (selectedEntries.length === 0) {
    alert("Please select one entry");
    return;
  }

  if (selectedEntries.length > 1) {
    alert("Please select only one entry");
    return;
  }

  const selectedRecord = filteredEntries.find(
    (item) => item.id === selectedEntries[0]
  );

  setViewEntry(selectedRecord);
};

const handleRowSelect = (id) => {

  if (selectedEntries.includes(id)) {

    setSelectedEntries(
      selectedEntries.filter(
        (item) => item !== id
      )
    );

  } else {

    setSelectedEntries([
      ...selectedEntries,
      id,
    ]);

  }
};

const handleSelectAll = (e) => {

  if (e.target.checked) {

    setSelectedEntries(
      filteredEntries.map(
        (item) => item.id
      )
    );

  } else {

    setSelectedEntries([]);
  }
};
const totalEntries = filteredEntries.length;

const successAmount = filteredEntries
  .filter((entry) => entry.status === "SUCCESS")
  .reduce(
    (sum, entry) =>
      sum + Number(entry.paidAmount || 0),
    0
  );

const cancelledAmount = filteredEntries
  .filter((entry) => entry.status === "Cancelled")
  .reduce(
    (sum, entry) =>
      sum + Number(entry.paidAmount || 0),
    0
  );

const totalExpense = successAmount;
  return (
    <div className="expense-entry-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => {
            if (showForm) {
              resetForm();
              setShowForm(false);
            } else {
              window.location.href = "/finance-manager";
            }
          }}
        >
          ←
        </AppButton>

        <div>
          <h1>{showForm ? "Add Expense Entry" : "Expense Entry"}</h1>
          <p>Manage school expense vouchers and payment records</p>
        </div>
      </div>

      {!showForm && (
        <>
          <div className="common-card">
            <div className="filter-grid">
              <div className="form-group">
                <label>Voucher No</label>
                <input
                  type="text"
                  placeholder="Enter voucher no"
                  value={searchVoucher}
                  onChange={(e) => setSearchVoucher(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>

            <div className="filter-actions">
              <AppButton
  type="primary"
  onClick={() => {
    if (!searchVoucher && !fromDate && !toDate) {
      alert("Please fill at least one search field");
      return;
    }

    setAppliedFilters({
      voucher: searchVoucher,
      from: fromDate,
      to: toDate,
    });
  }}
>
  Search
</AppButton>

              <AppButton type="primary" onClick={() => setShowForm(true)}>
                + New Entry
              </AppButton>
            </div>
          </div>
          <div className="summary-cards">

  <div className="summary-card">
    <h4>Total Entries</h4>
    <h2>{totalEntries}</h2>
  </div>

  <div className="summary-card">
    <h4>Success Amount</h4>
    <h2>
      ₹ {successAmount.toLocaleString("en-IN")}
    </h2>
  </div>

  <div className="summary-card">
    <h4>Cancelled Amount</h4>
    <h2>
      ₹ {cancelledAmount.toLocaleString("en-IN")}
    </h2>
  </div>

  <div className="summary-card">
    <h4>Total Expense</h4>
    <h2>
      ₹ {totalExpense.toLocaleString("en-IN")}
    </h2>
  </div>

</div>
          <div className="common-card expense-print-card">
            <div className="table-top-header">

  <h2>Expense Entry List</h2>

  <div className="top-action-buttons">

    <AppButton
      type="primary"
      onClick={handleViewSelected}
    >
      View
    </AppButton>

  </div>

</div>
<div className="print-header">
  <div className="school-details">
    <h2>Chandra Shekhar Azad Inter College</h2>
    <p>Rasauli, Barabanki</p>
    <p>8840248644</p>
  </div>
</div>

<h3 className="report-title">Expense Entry Report</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>
  <input
    type="checkbox"
    checked={
      filteredEntries.length > 0 &&
      selectedEntries.length === filteredEntries.length
    }
    onChange={handleSelectAll}
  />
</th>
                    <th>S.No</th>
                    <th>Voucher No</th>
                    <th>Voucher Date</th>
                    <th>Group</th>
                    <th>Account Head</th>
                    <th>Paid To</th>
                    <th>Payment Mode</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="empty-row">
                        No expense entry found
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((entry, index) => (
                      <tr key={entry.id}>
                        <td>
  <input
    type="checkbox"
    checked={selectedEntries.includes(entry.id)}
    onChange={() => handleRowSelect(entry.id)}
  />
</td>
                        <td>{index + 1}</td>
                        <td>{entry.voucherNo}</td>
                        <td>{entry.voucherDate}</td>
                        <td>{entry.groupName}</td>
                        <td>{entry.accountHeadName}</td>
                        <td>{entry.paidToName}</td>
                        <td>{entry.paymentMode}</td>
                        <td>₹ {Number(entry.paidAmount).toLocaleString("en-IN")}</td>
                        <td>{entry.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
           <div className="print-footer">
  <span className="print-date">
    {new Date().toLocaleString()} | Page 1
  </span>
</div>
          </div>
        </>
      )}

      {showForm && (
        <div className="common-card">
          <div className="expense-form-grid">
            <div className="form-group">
              <label>Group Name</label>
              <select
                name="groupId"
                value={formData.groupId}
                onChange={handleChange}
              >
                <option value="">Select Group</option>
                {demoGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.groupName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Account Head</label>
              <select
                name="accountHeadId"
                value={formData.accountHeadId}
                onChange={handleChange}
              >
                <option value="">Select Account Head</option>
                {filteredHeads.map((head) => (
                  <option key={head.id} value={head.id}>
                    {head.headName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Voucher Date</label>
              <input
                type="date"
                name="voucherDate"
                value={formData.voucherDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Paid Amount</label>
              <input
                type="number"
                name="paidAmount"
                placeholder="Enter paid amount"
                value={formData.paidAmount}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Paid To (Ref #)</label>
              <input
                type="text"
                name="paidToRef"
                placeholder="Enter reference no"
                value={formData.paidToRef}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Paid To (Name)</label>
              <input
                type="text"
                name="paidToName"
                placeholder="Enter paid to name"
                value={formData.paidToName}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Payment Mode</label>
              <select
                name="paymentMode"
                value={formData.paymentMode}
                onChange={handleChange}
              >
                <option value="">Select Payment Mode</option>
                {paymentModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>

            {formData.paymentMode && formData.paymentMode !== "Cash" && (
              <>
                <div className="form-group">
                  <label>Bank / Payment Gateway Name</label>
                  <input
                    type="text"
                    name="bankName"
                    placeholder="Enter bank or gateway name"
                    value={formData.bankName}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Cheque / Ref / Transaction No</label>
                  <input
                    type="text"
                    name="transactionNo"
                    placeholder="Enter transaction no"
                    value={formData.transactionNo}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Cheque / Transaction Date</label>
                  <input
                    type="date"
                    name="transactionDate"
                    value={formData.transactionDate}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}

            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                name="description"
                placeholder="Description / Remarks"
                value={formData.description}
                onChange={handleChange}
              ></textarea>
            </div>

            <div className="form-group full-width">
              <label>Attachment</label>
              <input type="file" name="attachment" onChange={handleChange} />
              {formData.attachment && (
                <p className="file-name">Selected: {formData.attachment}</p>
              )}
            </div>
          </div>

          <div className="form-actions">
            <AppButton type="primary" onClick={handleSave}>
              Save
            </AppButton>

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
        </div>
      )}

      {viewEntry && (
        <div className="popup-overlay">
          <div className="view-popup">
            <div className="popup-head">
              <h2>Expense Voucher Details</h2>
              <button className="popup-close-btn" onClick={() => setViewEntry(null)}>
                ×
              </button>
            </div>

            <div className="view-grid">
              <p><strong>Voucher No:</strong> {viewEntry.voucherNo}</p>
              <p><strong>Date:</strong> {viewEntry.voucherDate}</p>
              <p><strong>Group:</strong> {viewEntry.groupName}</p>
              <p><strong>Head:</strong> {viewEntry.accountHeadName}</p>
              <p><strong>Paid To:</strong> {viewEntry.paidToName}</p>
              <p><strong>Payment Mode:</strong> {viewEntry.paymentMode}</p>
              <p><strong>Amount:</strong> ₹ {Number(viewEntry.paidAmount).toLocaleString("en-IN")}</p>
              <p><strong>Status:</strong> {viewEntry.status}</p>
              <p><strong>Description:</strong> {viewEntry.description || "-"}</p>
              <p><strong>Attachment:</strong> {viewEntry.attachment ? "Uploaded" : "-"}
                </p>
            </div>

            <div className="popup-actions">
              <AppButton type="print" onClick={() => window.print()}>
                Print Voucher
              </AppButton>

              <AppButton
  type="delete"
  onClick={() => handleCancelEntry(viewEntry.id)}
  disabled={viewEntry.status === "Cancelled"}
>
  Cancel Entry
</AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExpenseEntry;