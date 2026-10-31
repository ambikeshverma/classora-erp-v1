import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./feeReceipts.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import FeeReceiptModal from "../components/fee/FeeReceiptModal";
import { feeService } from "../services/api";
import { formatDate, formatMoney } from "../utils/feeUtils";

const EMPTY_FILTERS = { session: "", from: "", to: "", paymentMode: "", status: "", q: "" };

function FeeReceipts() {
  const navigate = useNavigate();

  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);

  const [result, setResult] = useState({ items: [], total: 0, pages: 1, totalAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [viewReceipt, setViewReceipt] = useState(null);
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    let active = true;

    feeService
      .getMeta()
      .then((res) => {
        if (active) setMeta(res.data?.data || null);
      })
      .catch((err) => {
        console.error("Failed to load fee meta", err);
      });

    return () => {
      active = false;
    };
  }, []);

  const loadReceipts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = { page, limit: 25 };
      Object.entries(applied).forEach(([key, value]) => {
        if (value) params[key] = value;
      });

      const res = await feeService.getReceipts(params);
      setResult(res.data?.data || { items: [], total: 0, pages: 1, totalAmount: 0 });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load receipts");
      setResult({ items: [], total: 0, pages: 1, totalAmount: 0 });
    } finally {
      setLoading(false);
    }
  }, [applied, page]);

  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  const handleSearch = () => {
    if (filters.from && filters.to && filters.from > filters.to) {
      alert("From date cannot be after To date");
      return;
    }

    setPage(1);
    setApplied(filters);
  };

  const handleReset = () => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
    setApplied(EMPTY_FILTERS);
  };

  const handleView = async (id) => {
    try {
      setBusyId(id);
      const res = await feeService.getReceipt(id);
      setViewReceipt(res.data?.data || null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load receipt");
    } finally {
      setBusyId("");
    }
  };

  const handleCancel = async (receipt) => {
    const reason = window.prompt(`Cancel receipt ${receipt.receiptNo}? Enter the cancellation reason:`);
    if (reason === null) return;

    if (reason.trim().length < 3) {
      alert("Cancellation reason is required");
      return;
    }

    try {
      setBusyId(receipt._id);
      await feeService.cancelReceipt(receipt._id, reason.trim());
      await loadReceipts();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel receipt");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="fr-page">
      <div className="fr-header">
        <AppButton type="back" onClick={() => navigate("/fee-manager")}>
          ←
        </AppButton>

        <div>
          <h1>Fee Receipt</h1>
          <p>Search, reprint and cancel fee receipts</p>
        </div>
      </div>

      <div className="fr-card">
        <div className="fr-filter-grid">
          <div className="fr-form-group">
            <label>Session</label>
            <select value={filters.session} onChange={(e) => setFilters({ ...filters, session: e.target.value })}>
              <option value="">All Sessions</option>
              {(meta?.sessions || []).map((session) => (
                <option key={session} value={session}>
                  {session}
                </option>
              ))}
            </select>
          </div>

          <div className="fr-form-group">
            <label>From Date</label>
            <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          </div>

          <div className="fr-form-group">
            <label>To Date</label>
            <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          </div>

          <div className="fr-form-group">
            <label>Payment Mode</label>
            <select
              value={filters.paymentMode}
              onChange={(e) => setFilters({ ...filters, paymentMode: e.target.value })}
            >
              <option value="">All Modes</option>
              {(meta?.paymentModes || []).map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>

          <div className="fr-form-group">
            <label>Status</label>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All</option>
              <option value="Active">Active</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="fr-form-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Student, father, receipt no, SR no, mobile"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
          </div>
        </div>

        <div className="fr-action-row">
          <AppButton type="primary" onClick={handleSearch}>
            Search
          </AppButton>

          <AppButton type="secondary" onClick={handleReset}>
            Reset
          </AppButton>
        </div>
      </div>

      <div className="fr-card">
        <div className="fr-summary">
          <span>
            <strong>{result.total}</strong> receipt(s)
          </span>
          <span>
            Total Amount: <strong>{formatMoney(result.totalAmount)}</strong>
          </span>
        </div>

        {loading ? (
          <SkeletonTable rows={8} columns={9} />
        ) : (
          <div className="fr-table-wrap">
            <table className="fr-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Receipt No</th>
                  <th>Date</th>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Mode</th>
                  <th>Amount</th>
                  <th>Collected By</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {result.items.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="fr-empty-row">
                      {error || "No receipts found"}
                    </td>
                  </tr>
                ) : (
                  result.items.map((receipt, index) => (
                    <tr key={receipt._id} className={receipt.status === "Cancelled" ? "fr-cancelled-row" : ""}>
                      <td>{(page - 1) * 25 + index + 1}</td>
                      <td>
                        {receipt.receiptNo}
                        <small className="fr-session-tag">{receipt.session}</small>
                      </td>
                      <td>{formatDate(receipt.depositDate)}</td>
                      <td>
                        <strong>{receipt.studentName}</strong>
                        <small className="fr-sub-text">{receipt.fatherName}</small>
                      </td>
                      <td>{[receipt.className, receipt.section].filter(Boolean).join(" - ") || "-"}</td>
                      <td>{receipt.paymentMode}</td>
                      <td>{formatMoney(receipt.paidAmount)}</td>
                      <td>{receipt.collectedByName || "-"}</td>
                      <td>
                        <span className={`fr-badge ${receipt.status === "Active" ? "active" : "cancelled"}`}>
                          {receipt.status}
                        </span>
                      </td>
                      <td>
                        <div className="fr-row-actions">
                          <button disabled={busyId === receipt._id} onClick={() => handleView(receipt._id)}>
                            View / Print
                          </button>

                          {receipt.status === "Active" && (
                            <button
                              className="danger"
                              disabled={busyId === receipt._id}
                              onClick={() => handleCancel(receipt)}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {result.pages > 1 && (
          <div className="fr-pagination">
            <AppButton type="secondary" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>
              Previous
            </AppButton>

            <span>
              Page {page} of {result.pages}
            </span>

            <AppButton type="secondary" disabled={page >= result.pages || loading} onClick={() => setPage(page + 1)}>
              Next
            </AppButton>
          </div>
        )}
      </div>

      {viewReceipt && (
        <FeeReceiptModal receipt={viewReceipt} schoolInfo={meta?.schoolInfo} onClose={() => setViewReceipt(null)} />
      )}
    </div>
  );
}

export default FeeReceipts;
