import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { School, CheckCircle, PauseCircle, Wallet, Clock, AlertTriangle, Users, Receipt } from "lucide-react";
import { superAdminService } from "../../services/api";
import { Skeleton, SkeletonStats, SkeletonList } from "../../components/Skeleton";
import { PageHeader, StatCard, EmptyState, ErrorState, StatusBadge, formatDate, formatDateTime, formatMoney, apiError } from "../../components/superadmin/ui";

const SADashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [res, remRes] = await Promise.all([
        superAdminService.getDashboard(),
        superAdminService.getReminders().catch(() => null),
      ]);
      setData(res.data.data);
      setReminders(remRes?.data?.data || []);
    } catch (err) {
      setError(apiError(err, "Failed to load the dashboard"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <>
        <PageHeader title="Platform Overview" subtitle="Live figures from all registered schools" />
        <SkeletonStats count={4} theme="dark" />
        <SkeletonStats count={4} theme="dark" />
        <div className="sa2-grid two">
          <Skeleton variant="rectangular" height={260} />
          <SkeletonList count={4} theme="dark" />
        </div>
      </>
    );
  }

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <EmptyState />;

  const { schools, subscriptions, billing, activeStudents, recentSchools, recentActivity } = data;

  return (
    <>
      <PageHeader
        title="Platform Overview"
        subtitle="Live figures from all registered schools"
        actions={
          <button className="sa2-btn" onClick={load}>
            Refresh
          </button>
        }
      />

      <div className="sa2-card" style={{ marginBottom: 20 }}>
        <h3>Needs your attention {reminders.length > 0 && <span className="sa2-badge amber">{reminders.length}</span>}</h3>
        <p className="sa2-muted" style={{ marginTop: -6 }}>
          Reminders only. Schools are never suspended or restricted automatically; every decision is yours.
        </p>
        {reminders.length === 0 ? (
          <EmptyState title="Nothing needs attention" message="No expiring subscriptions, pending payments or student-limit alerts right now." />
        ) : (
          <ul className="sa2-list">
            {reminders.slice(0, 8).map((r, index) => (
              <li key={`${r.type}-${r.schoolId}-${index}`}>
                <div>
                  <strong>{r.message}</strong>
                  <span className="sa2-cell-sub">
                    {r.expiryDate ? `Expiry ${formatDate(r.expiryDate)} · ` : ""}
                    {r.recommendedAction}
                    {!r.schoolActive ? " · School suspended" : ""}
                  </span>
                </div>
                <div className="sa2-actions">
                  <span className={`sa2-badge ${r.severity === "danger" ? "red" : r.severity === "warning" ? "amber" : "gray"}`}>
                    {r.type.replace(/_/g, " ")}
                  </span>
                  <button className="sa2-btn sm" onClick={() => navigate(r.link)}>
                    Open
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {reminders.length > 8 && (
          <p className="sa2-muted">
            {reminders.length - 8} more. See <button className="sa2-btn sm" onClick={() => navigate("/super-admin/billing")}>Subscriptions</button>
          </p>
        )}
      </div>
      <div className="sa2-grid stats">
        <StatCard label="Total schools" value={schools.total} icon={School} tone="blue" onClick={() => navigate("/super-admin/schools")} />
        <StatCard label="Active schools" value={schools.active} icon={CheckCircle} tone="green" />
        <StatCard label="Suspended schools" value={schools.suspended} icon={PauseCircle} tone="red" />
        <StatCard label="Active students" value={activeStudents} hint="Across all schools" icon={Users} tone="purple" />
      </div>

      <div className="sa2-grid stats">
        <StatCard
          label="Active subscriptions"
          value={subscriptions.active}
          hint={`${subscriptions.withoutSubscription} school(s) without a subscription`}
          icon={Wallet}
          tone="green"
          onClick={() => navigate("/super-admin/billing")}
        />
        <StatCard
          label="Expiring soon"
          value={subscriptions.expiringSoon}
          hint={`Within ${subscriptions.warningDays} days`}
          icon={Clock}
          tone="amber"
          onClick={() => navigate("/super-admin/billing?status=ExpiringSoon")}
        />
        <StatCard
          label="Pending payments"
          value={billing.pendingPayments}
          hint="Awaiting verification"
          icon={Receipt}
          tone="amber"
          onClick={() => navigate("/super-admin/payments?status=Pending")}
        />
        <StatCard
          label="Expired / overdue"
          value={billing.overdueSchools}
          hint={`Collected this month: ${formatMoney(billing.paidThisMonthAmount)}`}
          icon={AlertTriangle}
          tone="red"
          onClick={() => navigate("/super-admin/billing?status=Expired")}
        />
      </div>

      <div className="sa2-grid two">
        <div className="sa2-card">
          <h3>Recently created schools</h3>
          {recentSchools.length === 0 ? (
            <EmptyState message="No schools have been registered yet." />
          ) : (
            <ul className="sa2-list">
              {recentSchools.map((s) => (
                <li key={s._id}>
                  <div>
                    <strong>{s.schoolName}</strong>
                    <span className="sa2-cell-sub">
                      {s.campusId} · {formatDate(s.createdAt)}
                    </span>
                  </div>
                  <StatusBadge status={s.isActive ? "Active" : "Suspended"} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="sa2-card">
          <h3>Recent admin activity</h3>
          {recentActivity.length === 0 ? (
            <EmptyState message="Actions you take on schools, modules and billing will appear here." />
          ) : (
            <ul className="sa2-list">
              {recentActivity.map((a) => (
                <li key={a._id}>
                  <div>
                    <strong>{a.summary || a.action}</strong>
                    <span className="sa2-cell-sub">
                      {a.actorEmail || a.actorName} · {formatDateTime(a.createdAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

export default SADashboard;
