import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  School, CheckCircle, PauseCircle, Wallet, Clock,
  AlertTriangle, Users, Receipt,
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from "recharts";
import { superAdminService } from "../../services/api";
import { Skeleton, SkeletonStats, SkeletonList } from "../../components/Skeleton";
import {
  PageHeader, StatCard, EmptyState, ErrorState, StatusBadge,
  formatDate, formatDateTime, formatMoney, apiError,
} from "../../components/superadmin/ui";

/* ── colour palette ─────────────────────────────────────── */
const C = {
  navy:    "#1e3a5f",
  burg:    "#7c1d3e",
  green:   "#059669",
  amber:   "#d97706",
  red:     "#dc2626",
  blue:    "#2563a8",
  gray:    "#94a3b8",
  skyblue: "#3b82f6",
};

/* ── custom recharts tooltip ─────────────────────────────── */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff", border: "1px solid #d1dae7", borderRadius: 10,
      padding: "8px 14px", boxShadow: "0 4px 14px rgba(30,58,95,0.12)",
      fontSize: 12, color: "#1e293b",
    }}>
      {label && <p style={{ marginBottom: 4, fontWeight: 700, color: "#1e3a5f" }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ margin: "2px 0", color: p.color }}>
          <strong>{p.name}:</strong> {typeof p.value === "number" && p.name?.toLowerCase().includes("amount")
            ? formatMoney(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

/* ── custom label for pie slice (only if > 5%) ──────────── */
const PieLabel = ({ cx, cy, midAngle, outerRadius, percent, name }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const r = outerRadius + 18;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#4b6280" textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central" fontSize={11} fontWeight={600}>
      {Math.round(percent * 100)}%
    </text>
  );
};

/* ── legend item ─────────────────────────────────────────── */
const Legend2 = ({ items }) => (
  <div className="sa2-chart-legend">
    {items.map(({ color, label, value }) => (
      <span key={label} className="sa2-chart-legend-item">
        <span className="sa2-chart-legend-dot" style={{ background: color }} />
        {label}{value != null ? `: ${value}` : ""}
      </span>
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════════ */
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

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <>
        <PageHeader title="Platform Overview" subtitle="Live figures from all registered schools" />
        <SkeletonStats count={4} />
        <SkeletonStats count={4} />
        <div className="sa2-grid two">
          <Skeleton variant="rectangular" height={260} />
          <SkeletonList count={4} />
        </div>
        <div className="sa2-charts-row">
          <Skeleton variant="rectangular" height={240} />
          <Skeleton variant="rectangular" height={240} />
          <Skeleton variant="rectangular" height={240} />
        </div>
      </>
    );
  }

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <EmptyState />;

  const { schools, subscriptions, billing, activeStudents, recentSchools, recentActivity } = data;

  /* ── chart data derived from real API response ── */
  const schoolStatusData = [
    { name: "Active",    value: schools.active,    color: C.green },
    { name: "Suspended", value: schools.suspended,  color: C.red },
    {
      name: "Other",
      value: Math.max(0, (schools.total || 0) - (schools.active || 0) - (schools.suspended || 0)),
      color: C.gray,
    },
  ].filter(d => d.value > 0);

  const subscriptionData = [
    { name: "Active",        value: subscriptions.active,       fill: C.green },
    { name: "Exp. Soon",     value: subscriptions.expiringSoon,  fill: C.amber },
    { name: "No Sub",        value: subscriptions.withoutSubscription, fill: C.gray },
    { name: "Pending Pay",   value: billing.pendingPayments,    fill: C.blue },
    { name: "Overdue",       value: billing.overdueSchools,     fill: C.red },
  ].filter(d => d.value > 0);

  /* Spark: try to build simple data from recentSchools if available,
     else show a single-bar revenue summary */
  const revenueData = recentSchools && recentSchools.length > 0
    ? recentSchools.slice(0, 6).map((s, i) => ({
        name: s.schoolName?.slice(0, 10) || `School ${i + 1}`,
        students: s.activeStudents || s.studentCount || 0,
      }))
    : [];

  const hasPaidAmount = billing.paidThisMonthAmount > 0;

  return (
    <>
      <PageHeader
        title="Platform Overview"
        subtitle="Live figures from all registered schools"
        actions={
          <button className="sa2-btn" onClick={load}>Refresh</button>
        }
      />

      {/* ── Reminders ── */}
      <div className="sa2-card" style={{ marginBottom: 20 }}>
        <h3>
          Needs your attention{" "}
          {reminders.length > 0 && <span className="sa2-badge amber">{reminders.length}</span>}
        </h3>
        <p className="sa2-muted" style={{ marginTop: -6 }}>
          Reminders only. Schools are never suspended or restricted automatically; every decision is yours.
        </p>
        {reminders.length === 0 ? (
          <EmptyState title="Nothing needs attention"
            message="No expiring subscriptions, pending payments or student-limit alerts right now." />
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
                  <button className="sa2-btn sm" onClick={() => navigate(r.link)}>Open</button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {reminders.length > 8 && (
          <p className="sa2-muted">
            {reminders.length - 8} more. See{" "}
            <button className="sa2-btn sm" onClick={() => navigate("/super-admin/billing")}>
              Subscriptions
            </button>
          </p>
        )}
      </div>

      {/* ── Stat rows ── */}
      <div className="sa2-grid stats">
        <StatCard label="Total schools"    value={schools.total}     icon={School}       tone="blue"   onClick={() => navigate("/super-admin/schools")} />
        <StatCard label="Active schools"   value={schools.active}    icon={CheckCircle}  tone="green"  />
        <StatCard label="Suspended schools" value={schools.suspended} icon={PauseCircle}  tone="red"    />
        <StatCard label="Active students"  value={activeStudents}    icon={Users}        tone="purple" hint="Across all schools" />
      </div>

      <div className="sa2-grid stats">
        <StatCard
          label="Active subscriptions"
          value={subscriptions.active}
          hint={`${subscriptions.withoutSubscription} school(s) without a subscription`}
          icon={Wallet} tone="green"
          onClick={() => navigate("/super-admin/billing")}
        />
        <StatCard
          label="Expiring soon"
          value={subscriptions.expiringSoon}
          hint={`Within ${subscriptions.warningDays} days`}
          icon={Clock} tone="amber"
          onClick={() => navigate("/super-admin/billing?status=ExpiringSoon")}
        />
        <StatCard
          label="Pending payments"
          value={billing.pendingPayments}
          hint="Awaiting verification"
          icon={Receipt} tone="amber"
          onClick={() => navigate("/super-admin/payments?status=Pending")}
        />
        <StatCard
          label="Expired / overdue"
          value={billing.overdueSchools}
          hint={`Collected this month: ${formatMoney(billing.paidThisMonthAmount)}`}
          icon={AlertTriangle} tone="red"
          onClick={() => navigate("/super-admin/billing?status=Expired")}
        />
      </div>

      {/* ── Charts row ── */}
      <div className="sa2-charts-row">

        {/* Chart 1: Schools status donut */}
        <div className="sa2-chart-card">
          <h4>Schools Status</h4>
          <p className="sa2-chart-sub">Active vs Suspended breakdown</p>
          {schoolStatusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={schoolStatusData}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    animationDuration={700}
                    isAnimationActive
                    labelLine={false}
                    label={PieLabel}
                  >
                    {schoolStatusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartTooltip content={<ChartTip />} />
                </PieChart>
              </ResponsiveContainer>
              <Legend2 items={schoolStatusData.map(d => ({ color: d.color, label: d.name, value: d.value }))} />
            </>
          ) : (
            <EmptyState message="No school data yet." />
          )}
        </div>

        {/* Chart 2: Subscription breakdown bar chart */}
        <div className="sa2-chart-card">
          <h4>Subscription Breakdown</h4>
          <p className="sa2-chart-sub">Distribution across all schools</p>
          {subscriptionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={subscriptionData} barCategoryGap="30%"
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#4b6280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#4b6280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <RechartTooltip content={<ChartTip />} cursor={{ fill: "rgba(30,58,95,0.05)" }} />
                <Bar dataKey="value" name="Schools" radius={[6, 6, 0, 0]} animationDuration={700} isAnimationActive>
                  {subscriptionData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No subscription data yet." />
          )}
        </div>

        {/* Chart 3: Revenue / billing summary OR recent schools students */}
        <div className="sa2-chart-card">
          <h4>{revenueData.length > 0 ? "Recent Schools – Students" : "Revenue This Month"}</h4>
          <p className="sa2-chart-sub">
            {revenueData.length > 0
              ? "Student count for latest registered schools"
              : `Collected: ${formatMoney(billing.paidThisMonthAmount)}`}
          </p>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.navy} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={C.navy} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#4b6280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#4b6280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <RechartTooltip content={<ChartTip />} />
                <Area
                  type="monotone" dataKey="students" name="Students"
                  stroke={C.navy} strokeWidth={2.5}
                  fill="url(#areaGrad)"
                  dot={{ fill: C.navy, r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                  animationDuration={700} isAnimationActive
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : hasPaidAmount ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                { name: "Paid",    value: billing.paidThisMonthAmount, fill: C.green },
                { name: "Pending", value: billing.pendingPayments,     fill: C.amber },
                { name: "Overdue", value: billing.overdueSchools,      fill: C.red },
              ].filter(d => d.value > 0)} barCategoryGap="40%"
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#4b6280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#4b6280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <RechartTooltip content={<ChartTip />} cursor={{ fill: "rgba(30,58,95,0.05)" }} />
                <Bar dataKey="value" name="Amount" radius={[6, 6, 0, 0]} animationDuration={700} isAnimationActive>
                  {[{ fill: C.green }, { fill: C.amber }, { fill: C.red }].map((c, i) => (
                    <Cell key={i} fill={c.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No billing data yet." />
          )}
        </div>

      </div>

      {/* ── Recent schools + activity ── */}
      <div className="sa2-grid two" style={{ marginTop: 16 }}>
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
