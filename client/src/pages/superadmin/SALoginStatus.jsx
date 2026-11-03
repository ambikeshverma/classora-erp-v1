import React, { useCallback, useEffect, useState } from "react";
import {
  Users,
  ShieldAlert,
  Radio,
  RefreshCw,
  Search,
  Laptop,
  Smartphone,
  LogOut,
  Copy,
  Check,
  RotateCcw,
} from "lucide-react";
import { superAdminService } from "../../services/api";
import { SkeletonTable } from "../../components/Skeleton";
import {
  PageHeader,
  StatCard,
  EmptyState,
  ErrorState,
  Pagination,
  useToast,
  formatDateTime,
  apiError,
} from "../../components/superadmin/ui";
import { confirmDialog } from "../../utils/toast";

const timeAgo = (date) => {
  if (!date) return "Never";
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 20) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const getRoleBadge = (role) => {
  switch ((role || "").toLowerCase()) {
    case "superadmin":
      return { label: "Super Admin", className: "sa2-badge burgundy" };
    case "schooladmin":
      return { label: "School Admin", className: "sa2-badge navy" };
    case "teacher":
      return { label: "Teacher", className: "sa2-badge purple" };
    case "student":
      return { label: "Student", className: "sa2-badge green" };
    case "staff":
      return { label: "Staff", className: "sa2-badge amber" };
    default:
      return { label: role || "User", className: "sa2-badge gray" };
  }
};

const SALoginStatus = () => {
  const [sessions, setSessions] = useState([]);
  const [summary, setSummary] = useState({
    totalTrackedUsers: 0,
    activeSessions: 0,
    forceLoggedOut: 0,
  });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [, notify] = useToast();

  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshCountdown, setRefreshCountdown] = useState(15);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [copiedIp, setCopiedIp] = useState(null);

  const loadSessions = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError("");
    try {
      const res = await superAdminService.getSessions({
        search: query,
        role: roleFilter,
        status: statusFilter,
        page,
        limit: 20,
      });

      if (res.data?.success) {
        setSessions(res.data.data || []);
        if (res.data.pagination) setPagination(res.data.pagination);
        if (res.data.summary) setSummary(res.data.summary);
      }
    } catch (err) {
      if (!isBackground) {
        setError(apiError(err, "Failed to load active login sessions"));
      }
    } finally {
      if (!isBackground) setLoading(false);
      setRefreshCountdown(15);
    }
  }, [query, roleFilter, statusFilter, page]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;

    const timer = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          loadSessions(true);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefresh, loadSessions]);

  const handleForceLogout = async (session) => {
    const userName = session.name || session.email || session.campusId || "this user";
    const confirmed = await confirmDialog({
      title: "Force Logout User?",
      message: `Are you sure you want to immediately terminate the active session for "${userName}"?\n\nThey will be forcefully disconnected on their very next API request.`,
      confirmText: "Force Logout",
      confirmVariant: "danger",
    });

    if (!confirmed) return;

    setActionLoadingId(session._id);
    try {
      const res = await superAdminService.forceLogoutSession(session._id);
      if (res.data?.success) {
        notify(res.data.message || `Session for "${userName}" terminated`, "success");
        loadSessions(true);
      }
    } catch (err) {
      notify(apiError(err, "Failed to force logout session"), "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReactivate = async (session) => {
    const userName = session.name || session.email || "this user";
    setActionLoadingId(session._id);
    try {
      const res = await superAdminService.reactivateSession(session._id);
      if (res.data?.success) {
        notify(`Session for "${userName}" reactivated`, "success");
        loadSessions(true);
      }
    } catch (err) {
      notify(apiError(err, "Failed to reactivate session"), "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const copyIp = (ip) => {
    if (!ip || ip === "Unknown") return;
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    notify(`IP Address ${ip} copied to clipboard`, "info");
    setTimeout(() => setCopiedIp(null), 2000);
  };

  return (
    <>
      <PageHeader
        title="Live Login Status & Active Sessions"
        subtitle="Real-time monitoring of all active user sessions across schools and platform. Force logout terminates sessions instantly."
        actions={
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              className={`sa2-btn sm ${autoRefresh ? "secondary" : "ghost"}`}
              onClick={() => setAutoRefresh(!autoRefresh)}
              title="Toggle 15s automatic live refresh"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <Radio size={14} className={autoRefresh ? "pulse-anim" : ""} color={autoRefresh ? "#059669" : "#64748b"} />
              <span>{autoRefresh ? `Live (${refreshCountdown}s)` : "Live: Paused"}</span>
            </button>
            <button
              className="sa2-btn sm"
              onClick={() => loadSessions(false)}
              disabled={loading}
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <RefreshCw size={14} className={loading ? "spin-anim" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {/* ── Summary Stats Cards ── */}
      <div className="sa2-grid stats" style={{ marginBottom: 18 }}>
        <StatCard
          label="Active Sessions"
          value={summary.activeSessions}
          hint="Currently online / authenticated"
          icon={Radio}
          tone="green"
        />
        <StatCard
          label="Force-Terminated"
          value={summary.forceLoggedOut}
          hint="Terminated by Super Admin"
          icon={ShieldAlert}
          tone="red"
        />
        <StatCard
          label="Tracked Accounts"
          value={summary.totalTrackedUsers}
          hint="Total unique users recorded"
          icon={Users}
          tone="blue"
        />
      </div>

      {/* ── Filter Toolbar ── */}
      <div className="sa2-card" style={{ marginBottom: 18, padding: "14px 18px" }}>
        <div className="sa2-toolbar" style={{ margin: 0 }}>
          <div style={{ position: "relative", flex: "1 1 240px", width: "100%" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#64748b",
              }}
            />
            <input
              type="text"
              className="sa2-input"
              placeholder="Search by name, email, campus, IP, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 36, width: "100%" }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flexShrink: 0, width: "100%", maxWidth: "100%" }}>
            <select
              className="sa2-input"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              style={{ flex: "1 1 140px", minWidth: 130 }}
            >
              <option value="all">All Roles</option>
              <option value="superAdmin">Super Admin</option>
              <option value="schoolAdmin">School Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
              <option value="staff">Staff</option>
            </select>

            <select
              className="sa2-input"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              style={{ flex: "1 1 140px", minWidth: 140 }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="force_logged_out">Force Logged Out</option>
              <option value="inactive">Inactive</option>
            </select>

            {(search || roleFilter !== "all" || statusFilter !== "all") && (
              <button
                className="sa2-btn sm secondary"
                onClick={() => {
                  setSearch("");
                  setQuery("");
                  setRoleFilter("all");
                  setStatusFilter("all");
                  setPage(1);
                }}
                style={{ flexShrink: 0 }}
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      {error ? (
        <ErrorState message={error} onRetry={() => loadSessions(false)} />
      ) : loading && sessions.length === 0 ? (
        <div className="sa2-card">
          <SkeletonTable rows={6} columns={7} />
        </div>
      ) : sessions.length === 0 ? (
        <div className="sa2-card">
          <EmptyState
            title="No login sessions found"
            message={
              query || roleFilter !== "all" || statusFilter !== "all"
                ? "No sessions match your search filters."
                : "No users have logged into the platform yet."
            }
          />
        </div>
      ) : (
        <div className="sa2-card" style={{ padding: 0, overflow: "hidden" }}>
          {/* ══════════════════════════════════════════════════
              DESKTOP / LAPTOP TABLE VIEW (Hidden on Mobile)
             ══════════════════════════════════════════════════ */}
          <div className="sa2-table-wrap sa2-session-table-desktop">
            <table className="sa2-table" style={{ minWidth: 960 }}>
              <thead>
                <tr>
                  <th style={{ width: 230 }}>User Details</th>
                  <th style={{ width: 130 }}>Role</th>
                  <th style={{ width: 160 }}>Campus / School</th>
                  <th style={{ width: 140 }}>IP Address</th>
                  <th style={{ width: 160 }}>Device / Browser</th>
                  <th style={{ width: 120 }}>Status</th>
                  <th style={{ width: 100 }}>Last Active</th>
                  <th style={{ width: 140 }}>Login Time</th>
                  <th style={{ width: 120, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const roleBadge = getRoleBadge(s.role);
                  const isOnline = s.isActive && !s.forceLoggedOut;
                  const isMobileDevice = (s.device || "").toLowerCase().includes("android") || (s.device || "").toLowerCase().includes("ios");
                  const isBusy = actionLoadingId === s._id;

                  return (
                    <tr key={s._id} style={{ background: s.forceLoggedOut ? "rgba(220, 38, 38, 0.03)" : undefined }}>
                      {/* User */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              background: isOnline ? "linear-gradient(135deg, #1e3a5f, #7c1d3e)" : "#94a3b8",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: 13,
                              flexShrink: 0,
                            }}
                          >
                            {(s.name || s.email || "U").charAt(0).toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0, overflow: "hidden" }}>
                            <strong style={{ display: "block", color: "#1e293b", fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {s.name || "Unnamed User"}
                            </strong>
                            <span className="sa2-cell-sub" style={{ fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {s.email || "No email"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td>
                        <span className={roleBadge.className}>{roleBadge.label}</span>
                      </td>

                      {/* School & Campus */}
                      <td>
                        {s.campusId ? (
                          <div>
                            <span className="sa2-badge navy" style={{ fontSize: 11, padding: "2px 7px" }}>
                              {s.campusId}
                            </span>
                            {s.schoolName && (
                              <span className="sa2-cell-sub" style={{ display: "block", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 150 }}>
                                {s.schoolName}
                              </span>
                            )}
                          </div>
                        ) : s.role === "superAdmin" ? (
                          <span className="sa2-badge burgundy" style={{ fontSize: 11 }}>
                            Classora Super Admin
                          </span>
                        ) : (
                          <span className="sa2-muted">—</span>
                        )}
                      </td>

                      {/* IP Address */}
                      <td>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <code
                            style={{
                              background: "#f1f5f9",
                              padding: "2px 6px",
                              borderRadius: 4,
                              fontSize: 11,
                              fontFamily: "monospace",
                              color: "#0f2645",
                              border: "1px solid #d1dae7",
                              fontWeight: 600,
                            }}
                          >
                            {s.ipAddress || "Unknown"}
                          </code>
                          {s.ipAddress && s.ipAddress !== "Unknown" && (
                            <button
                              className="sa2-btn sm icon-only"
                              onClick={() => copyIp(s.ipAddress)}
                              title="Copy IP Address"
                              style={{ width: 22, height: 22, padding: 0 }}
                            >
                              {copiedIp === s.ipAddress ? (
                                <Check size={12} color="#059669" />
                              ) : (
                                <Copy size={12} color="#64748b" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Device */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#334155" }}>
                          {isMobileDevice ? (
                            <Smartphone size={14} color="#64748b" style={{ flexShrink: 0 }} />
                          ) : (
                            <Laptop size={14} color="#64748b" style={{ flexShrink: 0 }} />
                          )}
                          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 }}>
                            {s.device || "Browser"}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        {s.forceLoggedOut ? (
                          <span className="sa2-badge red" title={`Forced out on ${formatDateTime(s.forceLoggedOutAt)}`}>
                            Terminated
                          </span>
                        ) : s.isActive ? (
                          <span
                            className="sa2-badge green"
                            style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
                          >
                            <span
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                background: "#059669",
                                display: "inline-block",
                                boxShadow: "0 0 6px #059669",
                              }}
                            />
                            Active
                          </span>
                        ) : (
                          <span className="sa2-badge gray">Logged Out</span>
                        )}
                      </td>

                      {/* Last Active */}
                      <td>
                        <span
                          title={formatDateTime(s.lastActivityAt)}
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: isOnline ? "#059669" : "#64748b",
                          }}
                        >
                          {timeAgo(s.lastActivityAt)}
                        </span>
                      </td>

                      {/* Login Time */}
                      <td>
                        <span className="sa2-cell-sub" style={{ fontSize: 12 }}>
                          {formatDateTime(s.loginAt)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: "right" }}>
                        {isOnline ? (
                          <button
                            className="sa2-btn sm danger"
                            onClick={() => handleForceLogout(s)}
                            disabled={isBusy}
                            title="Force logout user now"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "4px 10px",
                              fontSize: 12,
                            }}
                          >
                            <LogOut size={13} />
                            <span>{isBusy ? "Terminating..." : "Force Logout"}</span>
                          </button>
                        ) : s.forceLoggedOut ? (
                          <button
                            className="sa2-btn sm secondary"
                            onClick={() => handleReactivate(s)}
                            disabled={isBusy}
                            title="Allow user to reconnect"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "4px 8px",
                              fontSize: 11,
                            }}
                          >
                            <RotateCcw size={12} />
                            <span>Reactivate</span>
                          </button>
                        ) : (
                          <span className="sa2-muted" style={{ fontSize: 12 }}>
                            Ended
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ══════════════════════════════════════════════════
              MOBILE PHONE CARDS VIEW (Clean & Responsive)
             ══════════════════════════════════════════════════ */}
          <div className="sa2-session-cards-mobile">
            {sessions.map((s) => {
              const roleBadge = getRoleBadge(s.role);
              const isOnline = s.isActive && !s.forceLoggedOut;
              const isMobileDevice = (s.device || "").toLowerCase().includes("android") || (s.device || "").toLowerCase().includes("ios");
              const isBusy = actionLoadingId === s._id;

              return (
                <div key={`m-${s._id}`} className={`sa2-session-card ${s.forceLoggedOut ? "terminated" : ""}`}>
                  {/* Card Header */}
                  <div className="sa2-session-card-head">
                    <div className="sa2-session-card-user">
                      <div
                        className="sa2-session-card-avatar"
                        style={{
                          background: isOnline ? "linear-gradient(135deg, #1e3a5f, #7c1d3e)" : "#94a3b8",
                        }}
                      >
                        {(s.name || s.email || "U").charAt(0).toUpperCase()}
                      </div>
                      <div className="sa2-session-card-info">
                        <strong>{s.name || "Unnamed User"}</strong>
                        <span>{s.email || "No email"}</span>
                      </div>
                    </div>

                    <div className="sa2-session-card-badges">
                      {s.forceLoggedOut ? (
                        <span className="sa2-badge red">Terminated</span>
                      ) : s.isActive ? (
                        <span className="sa2-badge green" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#059669", display: "inline-block" }} />
                          Active
                        </span>
                      ) : (
                        <span className="sa2-badge gray">Logged Out</span>
                      )}
                      <span className={roleBadge.className} style={{ marginTop: 2 }}>{roleBadge.label}</span>
                    </div>
                  </div>

                  {/* Card Details Grid */}
                  <div className="sa2-session-card-grid">
                    {/* School / Campus */}
                    <div className="sa2-session-card-item">
                      <span className="label">School / Campus</span>
                      <span className="val">
                        {s.campusId ? (
                          <>
                            <span className="sa2-badge navy" style={{ fontSize: 10, padding: "1px 5px" }}>{s.campusId}</span>
                            <span style={{ fontSize: 11, color: "#64748b" }}>{s.schoolName}</span>
                          </>
                        ) : s.role === "superAdmin" ? (
                          <span className="sa2-badge burgundy" style={{ fontSize: 10, padding: "1px 5px" }}>Classora SA</span>
                        ) : (
                          "—"
                        )}
                      </span>
                    </div>

                    {/* IP Address */}
                    <div className="sa2-session-card-item">
                      <span className="label">IP Address</span>
                      <span className="val">
                        <code style={{ fontSize: 11, background: "#f1f5f9", padding: "1px 4px", borderRadius: 4 }}>
                          {s.ipAddress || "Unknown"}
                        </code>
                        {s.ipAddress && s.ipAddress !== "Unknown" && (
                          <button
                            className="sa2-btn sm icon-only"
                            onClick={() => copyIp(s.ipAddress)}
                            style={{ width: 20, height: 20, padding: 0 }}
                          >
                            {copiedIp === s.ipAddress ? <Check size={11} color="#059669" /> : <Copy size={11} color="#64748b" />}
                          </button>
                        )}
                      </span>
                    </div>

                    {/* Device */}
                    <div className="sa2-session-card-item">
                      <span className="label">Device & Browser</span>
                      <span className="val">
                        {isMobileDevice ? <Smartphone size={13} color="#64748b" /> : <Laptop size={13} color="#64748b" />}
                        <span style={{ fontSize: 11 }}>{s.device || "Browser"}</span>
                      </span>
                    </div>

                    {/* Last Active */}
                    <div className="sa2-session-card-item">
                      <span className="label">Last Activity</span>
                      <span className="val" style={{ color: isOnline ? "#059669" : "#64748b", fontWeight: 700 }}>
                        {timeAgo(s.lastActivityAt)}
                      </span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="sa2-session-card-actions">
                    {isOnline ? (
                      <button
                        className="sa2-btn sm danger"
                        onClick={() => handleForceLogout(s)}
                        disabled={isBusy}
                        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "8px 12px" }}
                      >
                        <LogOut size={14} />
                        <span>{isBusy ? "Terminating..." : "Force Logout"}</span>
                      </button>
                    ) : s.forceLoggedOut ? (
                      <button
                        className="sa2-btn sm secondary"
                        onClick={() => handleReactivate(s)}
                        disabled={isBusy}
                        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "8px 12px" }}
                      >
                        <RotateCcw size={14} />
                        <span>Reactivate Session</span>
                      </button>
                    ) : (
                      <span className="sa2-muted" style={{ textAlign: "center", fontSize: 12, padding: "4px 0", width: "100%" }}>
                        Session Inactive
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {pagination.pages > 1 && (
            <div style={{ padding: "12px 18px", borderTop: "1px solid #e2e8f0" }}>
              <Pagination
                page={pagination.page}
                pages={pagination.pages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default SALoginStatus;
