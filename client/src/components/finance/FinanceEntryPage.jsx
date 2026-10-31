import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppButton from "../AppButton";
import { SkeletonStats, SkeletonTable } from "../Skeleton";
import { financeService } from "../../services/api";

// Income and expense screens are the same flow with different labels
const CONFIG = {
  INCOME: {
    pageClass: "income-entry-page",
    title: "Income Entry",
    addTitle: "Add Income Entry",
    subtitle: "Manage school income receipts and payment records",
    listTitle: "Income Entry List",
    reportTitle: "Income Entry Report",
    noLabel: "Receipt No",
    dateLabel: "Receipt Date",
    partyColumn: "Received From",
    amountLabel: "Received Amount",
    partyRefLabel: "Received From (Ref #)",
    partyNameLabel: "Received From (Name)",
    detailsTitle: "Income Receipt Details",
    printLabel: "Print Receipt",
    emptyText: "No income entry found",
    totalLabel: "Total Income",
    emptyGroupText: "No income group available. Create one in Account Groups first.",
  },
  EXPENSE: {
    pageClass: "expense-entry-page",
    title: "Expense Entry",
    addTitle: "Add Expense Entry",
    subtitle: "Manage school expense vouchers and payment records",
    listTitle: "Expense Entry List",
    reportTitle: "Expense Entry Report",
    noLabel: "Voucher No",
    dateLabel: "Voucher Date",
    partyColumn: "Paid To",
    amountLabel: "Paid Amount",
    partyRefLabel: "Paid To (Ref #)",
    partyNameLabel: "Paid To (Name)",
    detailsTitle: "Expense Voucher Details",
    printLabel: "Print Voucher",
    emptyText: "No expense entry found",
    totalLabel: "Total Expense",
    emptyGroupText: "No expense group available. Create one in Account Groups first.",
  },
};

const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024;

const todayISO = () => new Date().toISOString().split("T")[0];

const emptyForm = () => ({
  groupId: "",
  accountHeadId: "",
  date: todayISO(),
  amount: "",
  partyRef: "",
  partyName: "",
  paymentMode: "",
  bankName: "",
  transactionNo: "",
  transactionDate: "",
  description: "",
  attachmentName: "",
  attachmentUrl: "",
});

const EMPTY_FILTERS = { voucher: "", from: "", to: "" };

const money = (value) => `₹ ${Number(value || 0).toLocaleString("en-IN")}`;

const formatDate = (value) => (value ? String(value).split("-").reverse().join("-") : "-");

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

function FinanceEntryPage({ type }) {
  const navigate = useNavigate();
  const text = CONFIG[type];

  const [meta, setMeta] = useState(null);
  const [metaLoading, setMetaLoading] = useState(true);

  const [result, setResult] = useState({
    items: [],
    total: 0,
    pages: 1,
    summary: { totalEntries: 0, successAmount: 0, cancelledAmount: 0 },
  });
  const [listLoading, setListLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyForm());

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);

  const [selectedEntries, setSelectedEntries] = useState([]);
  const [viewEntry, setViewEntry] = useState(null);

  useEffect(() => {
    let active = true;

    financeService
      .getMeta()
      .then((res) => {
        if (active) setMeta(res.data?.data || null);
      })
      .catch((err) => {
        console.error("Failed to load finance meta", err);
      })
      .finally(() => {
        if (active) setMetaLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const loadEntries = useCallback(async () => {
    try {
      setListLoading(true);

      const params = { type, page, limit: 50 };
      if (appliedFilters.voucher) params.voucher = appliedFilters.voucher;
      if (appliedFilters.from) params.from = appliedFilters.from;
      if (appliedFilters.to) params.to = appliedFilters.to;

      const res = await financeService.getEntries(params);
      if (res.data?.data) setResult(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load entries");
    } finally {
      setListLoading(false);
    }
  }, [type, page, appliedFilters]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const groups = (meta?.groups || []).filter((group) => group.groupType === type);
  const heads = (meta?.heads || []).filter((head) => String(head.groupId) === String(formData.groupId));
  const paymentModes = meta?.paymentModes || [];
  const schoolInfo = meta?.schoolInfo || {};

  const resetForm = () => setFormData(emptyForm());

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "groupId") {
      setFormData({ ...formData, groupId: value, accountHeadId: "" });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleAttachment = async (e) => {
    const file = e.target.files[0];

    if (!file) {
      setFormData({ ...formData, attachmentName: "", attachmentUrl: "" });
      return;
    }

    if (file.size > MAX_ATTACHMENT_BYTES) {
      alert("Attachment must be smaller than 3 MB");
      e.target.value = "";
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setFormData((prev) => ({ ...prev, attachmentName: file.name, attachmentUrl: dataUrl }));
    } catch {
      alert("Failed to read attachment");
    }
  };

  const handleSave = async () => {
    if (
      !formData.groupId ||
      !formData.accountHeadId ||
      !formData.date ||
      !formData.amount ||
      !formData.partyName.trim() ||
      !formData.paymentMode
    ) {
      alert("Please fill all required fields");
      return;
    }

    if (Number(formData.amount) <= 0) {
      alert("Amount must be greater than zero");
      return;
    }

    try {
      setSaving(true);
      await financeService.createEntry({
        type,
        groupId: formData.groupId,
        headId: formData.accountHeadId,
        date: formData.date,
        amount: Number(formData.amount),
        partyRef: formData.partyRef,
        partyName: formData.partyName,
        paymentMode: formData.paymentMode,
        bankName: formData.bankName,
        transactionNo: formData.transactionNo,
        transactionDate: formData.transactionDate,
        description: formData.description,
        attachmentName: formData.attachmentName,
        attachmentUrl: formData.attachmentUrl,
      });

      alert(`${type === "INCOME" ? "Income" : "Expense"} entry saved successfully`);
      resetForm();
      setShowForm(false);

      if (page === 1) await loadEntries();
      else setPage(1);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save entry");
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = () => {
    if (!filters.voucher && !filters.from && !filters.to) {
      alert("Please fill at least one search field");
      return;
    }

    if (filters.from && filters.to && filters.from > filters.to) {
      alert("From date cannot be after To date");
      return;
    }

    setPage(1);
    setAppliedFilters(filters);
    setSelectedEntries([]);
  };

  const handleReset = () => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPage(1);
    setSelectedEntries([]);
  };

  const handleViewSelected = async () => {
    if (selectedEntries.length === 0) {
      alert("Please select one entry");
      return;
    }

    if (selectedEntries.length > 1) {
      alert("Please select only one entry");
      return;
    }

    try {
      setSaving(true);
      const res = await financeService.getEntry(selectedEntries[0]);
      setViewEntry(res.data?.data || null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load entry");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEntry = async () => {
    const reason = window.prompt("Enter the reason for cancelling this entry:");
    if (reason === null) return;

    try {
      setSaving(true);
      const res = await financeService.cancelEntry(viewEntry._id, reason);
      setViewEntry({ ...viewEntry, ...res.data?.data });
      await loadEntries();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel entry");
    } finally {
      setSaving(false);
    }
  };

  const downloadAttachment = () => {
    const link = document.createElement("a");
    link.href = viewEntry.attachmentUrl;
    link.download = viewEntry.attachmentName || "attachment";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const { items: entries, summary } = result;

  return (
    <div className={text.pageClass}>
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => {
            if (showForm) {
              resetForm();
              setShowForm(false);
            } else {
              navigate("/finance-manager");
            }
          }}
        >
          ←
        </AppButton>

        <div>
          <h1>{showForm ? text.addTitle : text.title}</h1>
          <p>{text.subtitle}</p>
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
                  value={filters.voucher}
                  onChange={(e) => setFilters({ ...filters, voucher: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>From Date</label>
                <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
              </div>

              <div className="form-group">
                <label>To Date</label>
                <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
              </div>
            </div>

            <div className="filter-actions">
              <AppButton type="primary" onClick={handleSearch}>
                Search
              </AppButton>

              <AppButton type="secondary" onClick={handleReset}>
                Reset
              </AppButton>

              <AppButton type="primary" onClick={() => setShowForm(true)}>
                + New Entry
              </AppButton>
            </div>
          </div>

          {listLoading ? (
            <SkeletonStats count={4} />
          ) : (
            <div className="summary-cards">
              <div className="summary-card">
                <h4>Total Entries</h4>
                <h2>{summary.totalEntries}</h2>
              </div>

              <div className="summary-card">
                <h4>Success Amount</h4>
                <h2>{money(summary.successAmount)}</h2>
              </div>

              <div className="summary-card">
                <h4>Cancelled Amount</h4>
                <h2>{money(summary.cancelledAmount)}</h2>
              </div>

              <div className="summary-card">
                <h4>{text.totalLabel}</h4>
                <h2>{money(summary.successAmount)}</h2>
              </div>
            </div>
          )}

          <div className="common-card income-print-card">
            <div className="table-top-header">
              <h2>{text.listTitle}</h2>

              <div className="top-action-buttons">
                <AppButton type="primary" onClick={handleViewSelected} disabled={saving}>
                  View
                </AppButton>
              </div>
            </div>

            <div className="print-header">
              <div className="school-details">
                <h2>{schoolInfo.schoolName}</h2>
                <p>{schoolInfo.address}</p>
                <p>{schoolInfo.phone}</p>
              </div>
            </div>

            <h3 className="report-title">{text.reportTitle}</h3>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={entries.length > 0 && selectedEntries.length === entries.length}
                        onChange={(e) => setSelectedEntries(e.target.checked ? entries.map((item) => item._id) : [])}
                      />
                    </th>
                    <th>S.No</th>
                    <th>{text.noLabel}</th>
                    <th>{text.dateLabel}</th>
                    <th>Group</th>
                    <th>Account Head</th>
                    <th>{text.partyColumn}</th>
                    <th>Payment Mode</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {listLoading ? (
                    <tr>
                      <td colSpan="10" style={{ padding: "4px 0", border: "none" }}>
                        <SkeletonTable rows={6} columns={10} />
                      </td>
                    </tr>
                  ) : entries.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="empty-row">
                        {text.emptyText}
                      </td>
                    </tr>
                  ) : (
                    entries.map((entry, index) => (
                      <tr key={entry._id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedEntries.includes(entry._id)}
                            onChange={() =>
                              setSelectedEntries((prev) =>
                                prev.includes(entry._id) ? prev.filter((id) => id !== entry._id) : [...prev, entry._id]
                              )
                            }
                          />
                        </td>
                        <td>{(page - 1) * 50 + index + 1}</td>
                        <td>{entry.voucherNo}</td>
                        <td>{formatDate(entry.date)}</td>
                        <td>{entry.groupName}</td>
                        <td>{entry.headName}</td>
                        <td>{entry.partyName}</td>
                        <td>{entry.paymentMode}</td>
                        <td>{money(entry.amount)}</td>
                        <td>{entry.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {result.pages > 1 && (
              <div className="filter-actions">
                <AppButton type="secondary" disabled={page <= 1 || listLoading} onClick={() => setPage(page - 1)}>
                  Previous
                </AppButton>

                <span>
                  Page {page} of {result.pages}
                </span>

                <AppButton type="secondary" disabled={page >= result.pages || listLoading} onClick={() => setPage(page + 1)}>
                  Next
                </AppButton>
              </div>
            )}

            <div className="print-footer">
              <span className="print-date">{new Date().toLocaleString()}</span>
            </div>
          </div>
        </>
      )}

      {showForm && (
        <div className="common-card">
          <div className="income-form-grid">
            <div className="form-group">
              <label>Group Name</label>
              <select name="groupId" value={formData.groupId} onChange={handleChange} disabled={metaLoading}>
                <option value="">{metaLoading ? "Loading..." : "Select Group"}</option>
                {groups.map((group) => (
                  <option key={group._id} value={group._id}>
                    {group.groupName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Account Head</label>
              <select name="accountHeadId" value={formData.accountHeadId} onChange={handleChange}>
                <option value="">Select Account Head</option>
                {heads.map((head) => (
                  <option key={head._id} value={head._id}>
                    {head.headName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>{text.dateLabel}</label>
              <input type="date" name="date" max={todayISO()} value={formData.date} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>{text.amountLabel}</label>
              <input
                type="number"
                min="0"
                name="amount"
                placeholder="Enter amount"
                value={formData.amount}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>{text.partyRefLabel}</label>
              <input
                type="text"
                name="partyRef"
                placeholder="Enter reference no"
                value={formData.partyRef}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>{text.partyNameLabel}</label>
              <input
                type="text"
                name="partyName"
                placeholder="Enter name"
                value={formData.partyName}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Payment Mode</label>
              <select name="paymentMode" value={formData.paymentMode} onChange={handleChange}>
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
                  <input type="date" name="transactionDate" value={formData.transactionDate} onChange={handleChange} />
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
              <input type="file" onChange={handleAttachment} />
              {formData.attachmentName && <p className="file-name">Selected: {formData.attachmentName}</p>}
            </div>
          </div>

          {!metaLoading && groups.length === 0 && <p className="empty-row">{text.emptyGroupText}</p>}

          <div className="form-actions">
            <AppButton type="primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
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
              <h2>{text.detailsTitle}</h2>
              <button className="popup-close-btn" onClick={() => setViewEntry(null)}>
                ×
              </button>
            </div>

            <div className="view-grid">
              <p>
                <strong>{text.noLabel}:</strong> {viewEntry.voucherNo}
              </p>
              <p>
                <strong>Date:</strong> {formatDate(viewEntry.date)}
              </p>
              <p>
                <strong>Group:</strong> {viewEntry.groupName}
              </p>
              <p>
                <strong>Head:</strong> {viewEntry.headName}
              </p>
              <p>
                <strong>{text.partyColumn}:</strong> {viewEntry.partyName}
              </p>
              <p>
                <strong>Reference:</strong> {viewEntry.partyRef || "-"}
              </p>
              <p>
                <strong>Payment Mode:</strong> {viewEntry.paymentMode}
              </p>
              <p>
                <strong>Amount:</strong> {money(viewEntry.amount)}
              </p>
              <p>
                <strong>Status:</strong> {viewEntry.status}
              </p>
              <p>
                <strong>Source:</strong>{" "}
                {viewEntry.source === "FEE_COLLECTION"
                  ? "Fee Collection"
                  : viewEntry.source === "SALARY"
                  ? "Salary Payment"
                  : "Manual Entry"}
              </p>
              {viewEntry.transactionNo && (
                <p>
                  <strong>Transaction No:</strong> {viewEntry.transactionNo}
                </p>
              )}
              {viewEntry.status === "Cancelled" && (
                <p>
                  <strong>Cancel Reason:</strong> {viewEntry.cancelReason || "-"}
                </p>
              )}
              <p>
                <strong>Description:</strong> {viewEntry.description || "-"}
              </p>
              <p>
                <strong>Attachment:</strong> {viewEntry.attachmentName || "-"}
              </p>
            </div>

            <div className="popup-actions">
              <AppButton type="print" onClick={() => window.print()}>
                {text.printLabel}
              </AppButton>

              {viewEntry.attachmentUrl && (
                <AppButton type="primary" onClick={downloadAttachment}>
                  Download Attachment
                </AppButton>
              )}

              <AppButton
                type="delete"
                onClick={handleCancelEntry}
                disabled={saving || viewEntry.status === "Cancelled" || viewEntry.source !== "MANUAL"}
              >
                Cancel Entry
              </AppButton>
            </div>

            {viewEntry.source !== "MANUAL" && viewEntry.status !== "Cancelled" && (
              <p className="file-name">
                {viewEntry.source === "SALARY"
                  ? "Posted automatically from a salary payment, so it cannot be cancelled here."
                  : "Posted automatically from a fee receipt. Cancel the fee receipt to cancel this entry."}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FinanceEntryPage;
