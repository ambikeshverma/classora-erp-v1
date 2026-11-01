import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { superAdminService } from "../../services/api";
import { SkeletonTable } from "../../components/Skeleton";
import {
  PageHeader,
  EmptyState,
  ErrorState,
  Pagination,
  StatusBadge,
  Modal,
  ConfirmDialog,
  useToast,
  formatDate,
  formatDateTime,
  formatMoney,
  apiError,
} from "../../components/superadmin/ui";

const STATUSES = ["", "Pending", "Paid", "Rejected"];

const SAPayments = () => {
  const [params, setParams] = useSearchParams();
  const status = params.get("status") || "";
  const schoolId = params.get("school") || "";

  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, notify] = useToast();

  const [proof, setProof] = useState(null); // { invoice, image, loading }
  const [verifying, setVerifying] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await superAdminService.getInvoices({ page, limit: 20, status, schoolId, search: query });
      setRows(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(apiError(err, "Failed to load payments"));
    } finally {
      setLoading(false);
    }
  }, [page, status, schoolId, query]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setQuery(search.trim());
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const setStatus = (value) => {
    const next = new URLSearchParams(params);
    if (value) next.set("status", value);
    else next.delete("status");
    setParams(next);
    setPage(1);
  };

  const openProof = async (invoice) => {
    setProof({ invoice, image: "", loading: true });
    try {
      const res = await superAdminService.getInvoiceScreenshot(invoice.id);
      setProof({ invoice, image: res.data.data.screenshot, loading: false });
    } catch (err) {
      setProof({ invoice, image: "", loading: false });
      notify(apiError(err, "Could not load the payment proof"), "error");
    }
  };

  const confirmVerify = async () => {
    setBusy(true);
    try {
      const res = await superAdminService.verifyInvoice(verifying.id);
      notify(res.data.message);
      setVerifying(null);
      setProof(null);
      load();
    } catch (err) {
      notify(apiError(err, "Verification failed"), "error");
    } finally {
      setBusy(false);
    }
  };

  const confirmReject = async () => {
    if (reason.trim().length < 3) return notify("Enter a rejection reason", "error");
    setBusy(true);
    try {
      await superAdminService.rejectInvoice(rejecting.id, reason.trim());
      notify("Payment rejected");
      setRejecting(null);
      setReason("");
      setProof(null);
      load();
    } catch (err) {
      notify(apiError(err, "Rejection failed"), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {toast}
      <PageHeader
        title="Payments & Invoices"
        subtitle="Payments become Paid only after you verify them here or record an audited manual payment"
        actions={
          schoolId && (
            <button
              className="sa2-btn"
              onClick={() => {
                const next = new URLSearchParams(params);
                next.delete("school");
                setParams(next);
              }}
            >
              Clear school filter
            </button>
          )
        }
      />

      <div className="sa2-toolbar">
        <input className="sa2-input" placeholder="Search bill no, campus ID or transaction..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="sa2-chips">
          {STATUSES.map((s) => (
            <button key={s || "all"} className={`sa2-chip ${status === s ? "active" : ""}`} onClick={() => setStatus(s)}>
              {s || "All"}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <SkeletonTable rows={6} columns={7} />
      ) : rows.length === 0 ? (
        <div className="sa2-card">
          <EmptyState message="No payments match this filter." />
        </div>
      ) : (
        <>
          <div className="sa2-table-wrap">
            <table className="sa2-table">
              <thead>
                <tr>
                  <th>Bill</th>
                  <th>School</th>
                  <th>Plan / Period</th>
                  <th className="num">Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {r.billNo}
                      <span className="sa2-cell-sub">{formatDateTime(r.submittedAt || r.createdAt)}</span>
                    </td>
                    <td>
                      {r.schoolName}
                      <span className="sa2-cell-sub">{r.campusCode}</span>
                    </td>
                    <td>
                      {r.plan}
                      <span className="sa2-cell-sub">
                        {formatDate(r.periodStart)} – {formatDate(r.periodEnd)}
                      </span>
                    </td>
                    <td className="num">{formatMoney(r.amount)}</td>
                    <td>
                      {r.paymentMode || "-"}
                      <span className="sa2-cell-sub">
                        {r.transactionNo || "No reference"} · {r.source === "manual" ? "Manual" : "School submitted"}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={r.status} label={r.status === "Pending" ? "Pending verification" : undefined} />
                      {r.status === "Rejected" && r.rejectReason && <span className="sa2-cell-sub">{r.rejectReason}</span>}
                    </td>
                    <td>
                      <div className="sa2-actions">
                        {r.source === "school" && (
                          <button className="sa2-btn sm" onClick={() => openProof(r)}>
                            Details
                          </button>
                        )}
                        {r.status === "Pending" && (
                          <>
                            <button className="sa2-btn sm success" onClick={() => setVerifying(r)}>
                              Verify
                            </button>
                            <button className="sa2-btn sm danger" onClick={() => setRejecting(r)}>
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onChange={setPage} />
        </>
      )}

      {proof && (
        <Modal
          title={`Payment proof · ${proof.invoice.billNo}`}
          onClose={() => setProof(null)}
          footer={
            proof.invoice.status === "Pending" && (
              <>
                <button className="sa2-btn danger" onClick={() => setRejecting(proof.invoice)}>
                  Reject
                </button>
                <button className="sa2-btn success" onClick={() => setVerifying(proof.invoice)}>
                  Verify payment
                </button>
              </>
            )
          }
        >
          <div className="sa2-kv">
            <div>
              <span>Amount</span>
              <strong>{formatMoney(proof.invoice.amount)}</strong>
            </div>
            <div>
              <span>Reference</span>
              <strong>{proof.invoice.transactionNo || "-"}</strong>
            </div>
            <div>
              <span>Mode</span>
              <strong>{proof.invoice.paymentMode || "-"}</strong>
            </div>
            <div>
              <span>Amount submitted</span>
              <strong>{proof.invoice.amountPaid != null ? formatMoney(proof.invoice.amountPaid) : "-"}</strong>
            </div>
            <div>
              <span>Payer</span>
              <strong>{proof.invoice.payerName || "-"}</strong>
            </div>
            <div>
              <span>Payment date</span>
              <strong>{formatDate(proof.invoice.paymentDate)}</strong>
            </div>
          </div>
          {proof.invoice.remarks && <p className="sa2-muted">Remarks: {proof.invoice.remarks}</p>}
          <p className="sa2-muted">These details were typed by the school. Confirm the money in your account before verifying.</p>
          {proof.loading ? (
            <p className="sa2-muted">Loading proof...</p>
          ) : proof.image ? (
            <img className="sa2-proof" src={proof.image} alt="Payment screenshot" />
          ) : (
            <EmptyState message="No screenshot was attached." />
          )}
        </Modal>
      )}

      {verifying && (
        <ConfirmDialog
          title="Verify this payment?"
          message={`Confirm that ${formatMoney(verifying.amount)} for ${verifying.schoolName} has been received in your account (reference ${verifying.transactionNo || "none"}). The subscription will be extended to ${formatDate(verifying.periodEnd)}. This does not change whether the school is active or suspended.`}
          confirmLabel="Yes, payment received"
          busy={busy}
          onConfirm={confirmVerify}
          onClose={() => setVerifying(null)}
        />
      )}

      {rejecting && (
        <ConfirmDialog
          title="Reject this payment"
          confirmLabel="Reject payment"
          danger
          busy={busy}
          onConfirm={confirmReject}
          onClose={() => {
            setRejecting(null);
            setReason("");
          }}
        >
          <div className="sa2-field">
            <label htmlFor="sa-reject-reason">Reason shown to the school</label>
            <textarea id="sa-reject-reason" className="sa2-textarea" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Payment details could not be verified" />
          </div>
        </ConfirmDialog>
      )}
    </>
  );
};

export default SAPayments;
