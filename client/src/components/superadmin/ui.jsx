import React, { useCallback } from "react";
import { XCircle, X, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { toast } from "../../utils/toast";

// Thin wrapper over the central toast service: const [, notify] = useToast(); notify("Saved") / notify("Failed", "error")
// The first tuple item is kept (always null) so existing `{toast}` renders keep working.
export const useToast = () => {
  const notify = useCallback((message, type = "success") => toast.show(message, type), []);
  return [null, notify];
};
export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="sa2-page-header">
    <div>
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
    {actions && <div className="sa2-page-actions">{actions}</div>}
  </div>
);

export const StatCard = ({ label, value, hint, tone = "blue", icon: Icon, onClick }) => (
  <div
    className={`sa2-stat ${tone} ${onClick ? "clickable" : ""}`}
    onClick={onClick}
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
  >
    <div>
      <span className="sa2-stat-label">{label}</span>
      <strong className="sa2-stat-value">{value}</strong>
      {hint && <span className="sa2-stat-hint">{hint}</span>}
    </div>
    {Icon && (
      <span className="sa2-stat-icon">
        <Icon size={22} />
      </span>
    )}
  </div>
);

const STATUS_TONES = {
  Active: "green",
  Paid: "green",
  Grace: "amber",
  Pending: "amber",
  ExpiringSoon: "amber",
  Expired: "red",
  Rejected: "red",
  Suspended: "red",
  Inactive: "red",
  Cancelled: "gray",
  None: "gray",
};

export const StatusBadge = ({ status, label }) => (
  <span className={`sa2-badge ${STATUS_TONES[status] || "gray"}`}>
    {label || (status === "None" ? "No subscription" : status)}
  </span>
);

export const EmptyState = ({ title = "No data available", message }) => (
  <div className="sa2-empty">
    <Inbox size={32} />
    <h4>{title}</h4>
    {message && <p>{message}</p>}
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div className="sa2-empty error">
    <XCircle size={32} />
    <h4>Something went wrong</h4>
    <p>{message}</p>
    {onRetry && (
      <button className="sa2-btn" onClick={onRetry}>
        Try again
      </button>
    )}
  </div>
);

export const Pagination = ({ page, pages, total, onChange }) => {
  if (!pages || pages <= 1) {
    return total ? <div className="sa2-pagination"><span>{total} record{total === 1 ? "" : "s"}</span></div> : null;
  }
  return (
    <div className="sa2-pagination">
      <span>
        Page {page} of {pages} · {total} records
      </span>
      <div>
        <button className="sa2-btn icon" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
          <ChevronLeft size={16} />
        </button>
        <button className="sa2-btn icon" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export const Modal = ({ title, onClose, children, footer, wide }) => (
  <div className="sa2-modal-backdrop" onClick={onClose}>
    <div
      className={`sa2-modal ${wide ? "wide" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="sa2-modal-head">
        <h3>{title}</h3>
        <button className="sa2-btn icon" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
      </div>
      <div className="sa2-modal-body">{children}</div>
      {footer && <div className="sa2-modal-foot">{footer}</div>}
    </div>
  </div>
);

export const ConfirmDialog = ({ title, message, confirmLabel = "Confirm", danger, busy, onConfirm, onClose, children }) => (
  <Modal
    title={title}
    onClose={onClose}
    footer={
      <>
        <button className="sa2-btn" onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button className={`sa2-btn ${danger ? "danger" : "primary"}`} onClick={onConfirm} disabled={busy}>
          {busy ? "Working..." : confirmLabel}
        </button>
      </>
    }
  >
    {message && <p className="sa2-muted">{message}</p>}
    {children}
  </Modal>
);

export const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
};

export const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

export const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const apiError = (err, fallback) => err?.response?.data?.message || fallback;
