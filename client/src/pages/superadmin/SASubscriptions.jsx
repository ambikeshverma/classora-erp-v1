import React, { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { superAdminService } from "../../services/api";
import { confirmDialog } from "../../utils/toast";
import { SkeletonTable, SkeletonForm } from "../../components/Skeleton";
import {
  PageHeader,
  EmptyState,
  ErrorState,
  StatusBadge,
  Modal,
  Pagination,
  useToast,
  formatDate,
  formatMoney,
  apiError,
} from "../../components/superadmin/ui";

const FILTERS = [
  ["", "All"],
  ["Active", "Active"],
  ["ExpiringSoon", "Expiring soon"],
  ["Grace", "Grace"],
  ["Expired", "Expired"],
  ["None", "No subscription"],
  ["Pending", "Pending payment"],
];
const PLAN_NAMES = ["Monthly", "Quarterly", "Half-Yearly", "Annual"];
const toInput = (v) => (v ? new Date(v).toISOString().slice(0, 10) : "");

const SASubscriptions = () => {
  const [params, setParams] = useSearchParams();
  const status = params.get("status") || "";
  const [rows, setRows] = useState([]);
  const [warnDays, setWarnDays] = useState(30);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, notify] = useToast();

  const [detailId, setDetailId] = useState(params.get("school") || null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await superAdminService.getSubscriptions({ status, search: query, page, limit: 20 });
      setRows(res.data.data);
      setPagination(res.data.pagination);
      setWarnDays(res.data.settings?.expiryWarningDays || 30);
    } catch (err) {
      setError(apiError(err, "Failed to load subscriptions"));
    } finally {
      setLoading(false);
    }
  }, [status, query, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setQuery(search.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const visible = rows;

  const setFilter = (value) => {
    const next = new URLSearchParams(params);
    if (value) next.set("status", value);
    else next.delete("status");
    setParams(next);
    setPage(1);
  };

  return (
    <>
      {toast}
      <PageHeader
        title="Subscriptions"
        subtitle="Plan, validity, student limits and payment status for every school. Expiry never suspends a school automatically."
      />

      <div className="sa2-toolbar">
        <input className="sa2-input" placeholder="Search school or campus ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="sa2-chips">
          {FILTERS.map(([value, label]) => (
            <button key={value || "all"} className={`sa2-chip ${status === value ? "active" : ""}`} onClick={() => setFilter(value)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <SkeletonTable rows={7} columns={7} theme="dark" />
      ) : visible.length === 0 ? (
        <div className="sa2-card">
          <EmptyState message="No schools match this filter." />
        </div>
      ) : (
        <div className="sa2-table-wrap">
          <table className="sa2-table">
            <thead>
              <tr>
                <th>School</th>
                <th>Plan</th>
                <th>Validity</th>
                <th>Status</th>
                <th>Payments</th>
                <th className="num">Total paid</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.schoolId}>
                  <td>
                    {r.schoolName}
                    <span className="sa2-cell-sub">
                      {r.campusId} {!r.isActive && "· Suspended"}
                    </span>
                  </td>
                  <td>{r.plan || "-"}</td>
                  <td>
                    {r.expiryDate ? `${formatDate(r.startDate)} – ${formatDate(r.expiryDate)}` : "-"}
                    {r.daysLeft !== null && (
                      <span className="sa2-cell-sub">
                        {r.daysLeft >= 0 ? `${r.daysLeft} day(s) left` : `Expired ${Math.abs(r.daysLeft)} day(s) ago`}
                        {r.status === "Active" && r.daysLeft <= warnDays ? " · renewal due soon" : ""}
                      </span>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td>
                    {r.pendingPayments > 0 ? (
                      <Link to={`/super-admin/payments?status=Pending&school=${r.schoolId}`}>
                        <StatusBadge status="Pending" label={`${r.pendingPayments} pending · ${formatMoney(r.pendingAmount)}`} />
                      </Link>
                    ) : (
                      <span className="sa2-muted">{r.lastPaidAt ? `Last paid ${formatDate(r.lastPaidAt)}` : "No payments"}</span>
                    )}
                  </td>
                  <td className="num">{formatMoney(r.totalPaid)}</td>
                  <td>
                    <div className="sa2-actions">
                      <button className="sa2-btn sm" onClick={() => setDetailId(r.schoolId)}>
                        Manage
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && !error && <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onChange={setPage} />}

      {detailId && (
        <SchoolBillingModal
          schoolId={detailId}
          notify={notify}
          onChanged={load}
          onClose={() => {
            setDetailId(null);
            if (params.get("school")) {
              const next = new URLSearchParams(params);
              next.delete("school");
              setParams(next);
            }
          }}
        />
      )}

    </>
  );
};

/* ---------------- School billing detail ---------------- */
const SchoolBillingModal = ({ schoolId, notify, onChanged, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ plan: "Monthly", startDate: "", expiryDate: "", studentLimit: 0, restrictStudentAdditions: false, notes: "" });
  const [accessBusy, setAccessBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [manual, setManual] = useState({ open: false, plan: "Monthly", paymentMode: "Bank transfer", transactionNo: "", note: "" });
  const [manualBusy, setManualBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await superAdminService.getSchoolBilling(schoolId);
      const d = res.data.data;
      setData(d);
      setForm({
        plan: d.subscription?.plan || "Monthly",
        startDate: toInput(d.subscription?.startDate),
        expiryDate: toInput(d.subscription?.expiryDate),
        studentLimit: d.subscription?.studentLimit || 0,
        restrictStudentAdditions: Boolean(d.subscription?.restrictStudentAdditions),
        notes: d.subscription?.notes || "",
      });
    } catch (err) {
      setError(apiError(err, "Failed to load billing details"));
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await superAdminService.updateSubscription(schoolId, {
        plan: form.plan,
        startDate: form.startDate || undefined,
        expiryDate: form.expiryDate || undefined,
        studentLimit: Number(form.studentLimit) || 0,
        restrictStudentAdditions: Boolean(form.restrictStudentAdditions),
        notes: form.notes,
      });
      notify("Subscription updated");
      await load();
      onChanged();
    } catch (err) {
      notify(apiError(err, "Failed to update subscription"), "error");
    } finally {
      setSaving(false);
    }
  };

  const changeAccess = async () => {
    const suspending = data.school.isActive;
    const ok = await confirmDialog(
      suspending
        ? `Suspend ${data.school.schoolName}? Their users will be blocked immediately. No data is deleted.`
        : `Reactivate ${data.school.schoolName}? Their users can log in again.`,
      { confirmLabel: suspending ? "Suspend school" : "Reactivate school", danger: suspending }
    );
    if (!ok) return;
    setAccessBusy(true);
    try {
      await superAdminService.toggleSchoolStatus(schoolId, !suspending);
      notify(suspending ? "School suspended" : "School reactivated");
      await load();
      onChanged();
    } catch (err) {
      notify(apiError(err, "Failed to change school access"), "error");
    } finally {
      setAccessBusy(false);
    }
  };

  const recordManual = async () => {
    setManualBusy(true);
    try {
      const res = await superAdminService.recordManualPayment(schoolId, {
        plan: manual.plan,
        paymentMode: manual.paymentMode,
        transactionNo: manual.transactionNo,
        note: manual.note,
      });
      notify(res.data.message);
      setManual({ ...manual, open: false, transactionNo: "", note: "" });
      await load();
      onChanged();
    } catch (err) {
      notify(apiError(err, "Failed to record payment"), "error");
    } finally {
      setManualBusy(false);
    }
  };

  const quote = data?.quotes.find((q) => q.plan === manual.plan);

  return (
    <Modal title={data ? `${data.school.schoolName} · Subscription & Billing` : "Subscription & Billing"} wide onClose={onClose}>
      {loading ? (
        <SkeletonForm fields={4} theme="dark" />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          <div className="sa2-kv">
            <div>
              <span>Status</span>
              <strong>
                <StatusBadge status={data.status} />
              </strong>
            </div>
            <div>
              <span>Active students</span>
              <strong>
                {data.students.activeStudents}
                {data.students.limit > 0 ? ` of ${data.students.limit}` : " (no limit)"}
              </strong>
              {data.students.limit > 0 && (
                <span className="sa2-cell-sub">
                  {data.students.remaining >= 0 ? `${data.students.remaining} remaining` : `${Math.abs(data.students.remaining)} over the limit`}
                  {data.students.restricted ? " · new students restricted" : ""}
                </span>
              )}
            </div>
            <div>
              <span>Outstanding (pending)</span>
              <strong>{formatMoney(data.outstanding)}</strong>
            </div>
            <div>
              <span>School access</span>
              <strong>{data.school.isActive ? "Active" : "Suspended"}</strong>
              <button className={`sa2-btn sm ${data.school.isActive ? "danger" : "success"}`} onClick={changeAccess} disabled={accessBusy} style={{ marginTop: 6 }}>
                {data.school.isActive ? "Suspend school" : "Reactivate school"}
              </button>
            </div>
          </div>

          {data.students.limit > 0 && data.students.activeStudents > data.students.limit && (
            <p className="sa2-muted" style={{ color: "#fcd34d" }}>
              Active students exceed the configured limit. Existing students are never removed; decide whether to raise the limit.
            </p>
          )}
          {(data.status === "Expired" || data.status === "Grace") && (
            <p className="sa2-muted" style={{ color: "#fca5a5" }}>
              The subscription has expired. The school stays active until you suspend it; renew, extend the validity, or suspend as you see fit.
            </p>
          )}

          <div className="sa2-card" style={{ marginBottom: 16 }}>
            <h3>Plan & validity</h3>
            <div className="sa2-form-grid">
              <div className="sa2-field">
                <label htmlFor="sa-plan">Plan</label>
                <select id="sa-plan" className="sa2-select" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
                  {[...PLAN_NAMES, "Custom"].map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="sa2-field">
                <label htmlFor="sa-start">Start date</label>
                <input id="sa-start" type="date" className="sa2-input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="sa2-field">
                <label htmlFor="sa-expiry">Valid until</label>
                <input id="sa-expiry" type="date" className="sa2-input" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
              </div>
              <div className="sa2-field">
                <label htmlFor="sa-limit">Student limit (0 = unlimited)</label>
                <input id="sa-limit" type="number" min="0" className="sa2-input" value={form.studentLimit} onChange={(e) => setForm({ ...form, studentLimit: e.target.value })} />
              </div>
            </div>
            <div className="sa2-field">
              <label>
                <input
                  type="checkbox"
                  checked={form.restrictStudentAdditions}
                  onChange={(e) => setForm({ ...form, restrictStudentAdditions: e.target.checked })}
                />{" "}
                Refuse new students once the limit is reached (enforced by the server; existing students are never affected)
              </label>
            </div>
            <div className="sa2-field">
              <label htmlFor="sa-notes">Internal notes</label>
              <textarea id="sa-notes" className="sa2-textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="sa2-actions">
              <button className="sa2-btn primary" onClick={save} disabled={saving}>
                {saving ? "Saving..." : "Save subscription"}
              </button>
            </div>
          </div>

          <div className="sa2-card" style={{ marginBottom: 16 }}>
            <h3>Record manual payment</h3>
            {!manual.open ? (
              <>
                <p className="sa2-muted">
                  Use only for money received outside the school's own payment submission. A reference note is mandatory and the entry is audited.
                </p>
                <button className="sa2-btn" onClick={() => setManual({ ...manual, open: true })}>
                  Record payment
                </button>
              </>
            ) : (
              <>
                <div className="sa2-form-grid">
                  <div className="sa2-field">
                    <label htmlFor="sa-m-plan">Plan</label>
                    <select id="sa-m-plan" className="sa2-select" value={manual.plan} onChange={(e) => setManual({ ...manual, plan: e.target.value })}>
                      {PLAN_NAMES.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sa2-field">
                    <label htmlFor="sa-m-mode">Payment mode</label>
                    <input id="sa-m-mode" className="sa2-input" value={manual.paymentMode} onChange={(e) => setManual({ ...manual, paymentMode: e.target.value })} />
                  </div>
                  <div className="sa2-field">
                    <label htmlFor="sa-m-txn">Transaction / cheque no.</label>
                    <input id="sa-m-txn" className="sa2-input" value={manual.transactionNo} onChange={(e) => setManual({ ...manual, transactionNo: e.target.value })} />
                  </div>
                </div>
                <div className="sa2-field">
                  <label htmlFor="sa-m-note">Reference note (required)</label>
                  <textarea id="sa-m-note" className="sa2-textarea" value={manual.note} onChange={(e) => setManual({ ...manual, note: e.target.value })} placeholder="How and when the payment was received, who confirmed it" />
                </div>
                {quote && (
                  <p className="sa2-muted">
                    Amount for {quote.plan}: <strong>{formatMoney(quote.amount)}</strong> ({quote.billingStudents} students, {quote.discountPercent}% discount, {quote.gstPercent}% GST)
                  </p>
                )}
                <div className="sa2-actions">
                  <button className="sa2-btn" onClick={() => setManual({ ...manual, open: false })} disabled={manualBusy}>
                    Cancel
                  </button>
                  <button className="sa2-btn success" onClick={recordManual} disabled={manualBusy}>
                    {manualBusy ? "Recording..." : "Record as paid"}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="sa2-card">
            <h3>Invoice history</h3>
            {data.invoices.length === 0 ? (
              <EmptyState message="No invoices have been created for this school." />
            ) : (
              <div className="sa2-table-wrap">
                <table className="sa2-table">
                  <thead>
                    <tr>
                      <th>Bill</th>
                      <th>Plan / Period</th>
                      <th className="num">Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.invoices.map((i) => (
                      <tr key={i.id}>
                        <td>
                          {i.billNo}
                          <span className="sa2-cell-sub">{i.source === "manual" ? "Manual" : "School submitted"}</span>
                        </td>
                        <td>
                          {i.plan}
                          <span className="sa2-cell-sub">
                            {formatDate(i.periodStart)} – {formatDate(i.periodEnd)}
                          </span>
                        </td>
                        <td className="num">{formatMoney(i.amount)}</td>
                        <td>
                          <StatusBadge status={i.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </Modal>
  );
};

export default SASubscriptions;
