import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../feeReports.css";
import AppButton from "../../components/AppButton";
import MasterReport from "../../components/reports/MasterReport";
import { SkeletonList } from "../../components/Skeleton";
import { feeService } from "../../services/api";
import { formatDate } from "../../utils/feeUtils";

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

const SNO_COLUMN = { key: "sno", label: "S.No", render: (_, index) => index + 1 };

const inDateRange = (date, from, to) => (!from || date >= from) && (!to || date <= to);

const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function FeeReports() {
  const navigate = useNavigate();

  const [meta, setMeta] = useState(null);
  const [session, setSession] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    feeService
      .getReports(session ? { session } : {})
      .then((res) => {
        if (active) setData(res.data?.data || null);
      })
      .catch((err) => {
        if (active) {
          setData(null);
          setError(err.response?.data?.message || "Failed to load fee reports");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session]);

  const schoolProfile = useMemo(
    () => ({
      schoolId: localStorage.getItem("schoolId") || "SCH001",
      ...(meta?.schoolInfo || {}),
    }),
    [meta]
  );

  const reports = useMemo(() => {
    if (!data) return [];

    const receipts = data.receipts || [];
    const dues = data.dues || [];
    const periods = data.periods || [];
    const paymentModes = data.paymentModes || [];
    const periodKeys = periods.map((item) => item.key);

    const classOptions = [
      ...new Set([...dues.map((item) => item.className), ...receipts.map((item) => item.className)].filter(Boolean)),
    ].sort();

    const classFilter = { name: "className", label: "Class", type: "select", options: classOptions };
    const dateFilters = [
      { name: "from", label: "From Date", type: "date" },
      { name: "to", label: "To Date", type: "date" },
    ];

    const dueUpTo = (row, upToPeriod) => {
      if (!upToPeriod) return row.balance;
      const index = periodKeys.indexOf(upToPeriod);
      return round2(periodKeys.slice(0, index + 1).reduce((sum, key) => sum + (row.periodDue?.[key] || 0), 0));
    };

    const activeReceipts = (filters) =>
      receipts.filter(
        (item) =>
          item.status === "Active" &&
          inDateRange(item.depositDate, filters.from, filters.to) &&
          (!filters.className || item.className === filters.className)
      );

    return [
      {
        id: "fee-collection-report",
        title: "Fee Collection Report",
        description: "Receipt wise fee collection for a date range",
        icon: "💰",
        defaultFilters: { from: "", to: "", className: "", paymentMode: "", status: "Active" },
        filters: [
          ...dateFilters,
          classFilter,
          { name: "paymentMode", label: "Payment Mode", type: "select", options: paymentModes },
          { name: "status", label: "Status", type: "select", options: ["Active", "Cancelled"], showAllOption: true },
        ],
        columns: [
          SNO_COLUMN,
          { key: "receiptNo", label: "Receipt No" },
          { key: "depositDate", label: "Date" },
          { key: "studentName", label: "Student" },
          { key: "fatherName", label: "Father Name" },
          { key: "classLabel", label: "Class" },
          { key: "paymentMode", label: "Mode" },
          { key: "paymentRef", label: "Ref No" },
          { key: "paidAmount", label: "Amount" },
          { key: "collectedByName", label: "Collected By" },
          { key: "status", label: "Status" },
        ],
        getData: ({ filters }) =>
          receipts
            .filter(
              (item) =>
                inDateRange(item.depositDate, filters.from, filters.to) &&
                (!filters.className || item.className === filters.className) &&
                (!filters.paymentMode || item.paymentMode === filters.paymentMode) &&
                (!filters.status || item.status === filters.status)
            )
            .map((item) => ({
              ...item,
              depositDate: formatDate(item.depositDate),
              classLabel: [item.className, item.section].filter(Boolean).join(" - "),
              paymentRef: item.paymentRef || "-",
            })),
      },

      {
        id: "daily-collection-summary",
        title: "Daily Collection Summary",
        description: "Day wise collection split by payment mode",
        icon: "📅",
        defaultFilters: { from: "", to: "", className: "" },
        filters: [...dateFilters, classFilter],
        columns: [
          SNO_COLUMN,
          { key: "date", label: "Date" },
          { key: "count", label: "Receipts" },
          ...paymentModes.map((mode) => ({ key: `mode_${mode}`, label: mode })),
          { key: "total", label: "Total" },
        ],
        getData: ({ filters }) => {
          const groups = new Map();

          activeReceipts(filters).forEach((item) => {
            if (!groups.has(item.depositDate)) {
              groups.set(item.depositDate, { rawDate: item.depositDate, count: 0, total: 0 });
            }
            const group = groups.get(item.depositDate);
            group.count += 1;
            group.total = round2(group.total + item.paidAmount);
            group[`mode_${item.paymentMode}`] = round2((group[`mode_${item.paymentMode}`] || 0) + item.paidAmount);
          });

          return [...groups.values()]
            .sort((a, b) => a.rawDate.localeCompare(b.rawDate))
            .map((group) => {
              const row = { ...group, date: formatDate(group.rawDate) };
              paymentModes.forEach((mode) => {
                row[`mode_${mode}`] = row[`mode_${mode}`] || 0;
              });
              return row;
            });
        },
      },

      {
        id: "month-wise-collection",
        title: "Month Wise Collection",
        description: "Collection grouped by the month of deposit",
        icon: "🗓️",
        defaultFilters: { className: "" },
        filters: [classFilter],
        columns: [
          SNO_COLUMN,
          { key: "month", label: "Month" },
          { key: "count", label: "Receipts" },
          { key: "total", label: "Amount Collected" },
        ],
        getData: ({ filters }) => {
          const groups = new Map();

          activeReceipts(filters).forEach((item) => {
            const monthKey = item.depositDate.slice(0, 7);
            if (!groups.has(monthKey)) groups.set(monthKey, { monthKey, count: 0, total: 0 });
            const group = groups.get(monthKey);
            group.count += 1;
            group.total = round2(group.total + item.paidAmount);
          });

          return [...groups.values()]
            .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
            .map((group) => ({
              ...group,
              month: `${MONTH_LABELS[Number(group.monthKey.slice(5, 7)) - 1]} ${group.monthKey.slice(0, 4)}`,
            }));
        },
      },

      {
        id: "head-wise-collection",
        title: "Fee Head Wise Collection",
        description: "Total collected against each fee head",
        icon: "🧾",
        defaultFilters: {},
        filters: [],
        columns: [SNO_COLUMN, { key: "feeHeadName", label: "Fee Head" }, { key: "collected", label: "Collected" }],
        getData: () => data.headWise || [],
      },

      {
        id: "class-wise-fee-summary",
        title: "Class Wise Fee Summary",
        description: "Fee, concession, collection and balance by class",
        icon: "🏫",
        defaultFilters: { className: "" },
        filters: [classFilter],
        columns: [
          SNO_COLUMN,
          { key: "className", label: "Class" },
          { key: "students", label: "Students" },
          { key: "totalFee", label: "Total Fee" },
          { key: "concession", label: "Concession" },
          { key: "paid", label: "Paid" },
          { key: "balance", label: "Balance" },
          { key: "percent", label: "% Collected" },
        ],
        getData: ({ filters }) => {
          const groups = new Map();

          dues
            .filter((item) => !filters.className || item.className === filters.className)
            .forEach((item) => {
              const key = item.className || "-";
              if (!groups.has(key)) {
                groups.set(key, { className: key, students: 0, totalFee: 0, concession: 0, paid: 0, balance: 0 });
              }
              const group = groups.get(key);
              group.students += 1;
              group.totalFee = round2(group.totalFee + item.totalFee);
              group.concession = round2(group.concession + item.concession);
              group.paid = round2(group.paid + item.paid);
              group.balance = round2(group.balance + item.balance);
            });

          return [...groups.values()]
            .sort((a, b) => a.className.localeCompare(b.className))
            .map((group) => {
              const payable = group.totalFee - group.concession;
              return { ...group, percent: `${payable > 0 ? round2((group.paid / payable) * 100) : 0}%` };
            });
        },
      },

      {
        id: "fee-defaulters",
        title: "Fee Defaulters / Dues List",
        description: "Students with pending fee, optionally up to a period",
        icon: "⚠️",
        defaultFilters: { className: "", upToPeriod: "", minDue: "" },
        filters: [
          classFilter,
          { name: "upToPeriod", label: "Dues Up To", type: "select", options: periodKeys, placeholder: "Full Session" },
          { name: "minDue", label: "Minimum Due Amount", type: "number", placeholder: "0" },
        ],
        columns: [
          SNO_COLUMN,
          { key: "studentName", label: "Student" },
          { key: "fatherName", label: "Father Name" },
          { key: "classLabel", label: "Class" },
          { key: "mobile", label: "Mobile" },
          { key: "srNo", label: "SR No" },
          { key: "feePlan", label: "Fee Plan" },
          { key: "totalFee", label: "Total Fee" },
          { key: "paid", label: "Paid" },
          { key: "due", label: "Due" },
        ],
        getData: ({ filters }) =>
          dues
            .filter((item) => !filters.className || item.className === filters.className)
            .map((item) => ({
              ...item,
              classLabel: [item.className, item.section].filter(Boolean).join(" - "),
              due: dueUpTo(item, filters.upToPeriod),
            }))
            .filter((item) => item.due > 0 && item.due >= Number(filters.minDue || 0))
            .sort((a, b) => b.due - a.due),
      },

      {
        id: "concession-report",
        title: "Concession Report",
        description: "Students with concession applied in this session",
        icon: "🎁",
        defaultFilters: { className: "" },
        filters: [classFilter],
        columns: [
          SNO_COLUMN,
          { key: "studentName", label: "Student" },
          { key: "classLabel", label: "Class" },
          { key: "srNo", label: "SR No" },
          { key: "concessionPlan", label: "Concession Plan" },
          { key: "totalFee", label: "Total Fee" },
          { key: "concession", label: "Concession" },
        ],
        getData: ({ filters }) =>
          dues
            .filter((item) => item.concession > 0 && (!filters.className || item.className === filters.className))
            .map((item) => ({ ...item, classLabel: [item.className, item.section].filter(Boolean).join(" - ") })),
      },

      {
        id: "cancelled-receipts",
        title: "Cancelled Receipts",
        description: "Receipts cancelled with their reasons",
        icon: "🚫",
        defaultFilters: { from: "", to: "" },
        filters: dateFilters,
        columns: [
          SNO_COLUMN,
          { key: "receiptNo", label: "Receipt No" },
          { key: "depositDate", label: "Date" },
          { key: "studentName", label: "Student" },
          { key: "paidAmount", label: "Amount" },
          { key: "cancelReason", label: "Reason" },
          { key: "cancelledByName", label: "Cancelled By" },
        ],
        getData: ({ filters }) =>
          receipts
            .filter((item) => item.status === "Cancelled" && inDateRange(item.depositDate, filters.from, filters.to))
            .map((item) => ({ ...item, depositDate: formatDate(item.depositDate) })),
      },
    ];
  }, [data]);

  const sessionBar = (
    <div className="ffr-session-bar">
      <span>Session</span>

      <select value={session || data?.session || ""} onChange={(e) => setSession(e.target.value)}>
        {!(session || data?.session) && <option value="">Loading...</option>}
        {(meta?.sessions || (data ? [data.session] : [])).map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );

  if (loading && !data) {
    return (
      <div className="ffr-page">
        <div className="ffr-header">
          <AppButton type="back" onClick={() => navigate("/fee-manager")}>
            ←
          </AppButton>

          <div>
            <h1>Analytics &amp; Reports</h1>
            <p>Loading fee reports...</p>
          </div>
        </div>

        <div className="ffr-card">
          <SkeletonList count={6} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="ffr-page">
        <div className="ffr-header">
          <AppButton type="back" onClick={() => navigate("/fee-manager")}>
            ←
          </AppButton>

          <div>
            <h1>Analytics &amp; Reports</h1>
            <p>{error || "Fee reports are not available"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {sessionBar}

      {loading ? (
        <div className="ffr-page">
          <div className="ffr-card">
            <SkeletonList count={6} />
          </div>
        </div>
      ) : (
        <MasterReport
          key={data.session}
          moduleTitle="Fee Analytics & Reports"
          reports={reports}
          schoolProfiles={[schoolProfile]}
          currentUser={{ name: meta?.collectedByName }}
        />
      )}
    </>
  );
}

export default FeeReports;
