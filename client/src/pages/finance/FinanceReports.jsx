import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppButton from "../../components/AppButton";
import MasterReport from "../../components/reports/MasterReport";
import { SkeletonList } from "../../components/Skeleton";
import { financeService } from "../../services/api";

const SNO_COLUMN = { key: "sno", label: "S.No", render: (_, index) => index + 1 };

const amountFormat = (amount) => `₹ ${Number(amount || 0).toLocaleString("en-IN")}`;

const formatDate = (value) => (value ? String(value).split("-").reverse().join("-") : "-");

const isDateInRange = (date, fromDate, toDate) => {
  if (fromDate && date < fromDate) return false;
  if (toDate && date > toDate) return false;
  return true;
};

function FinanceReports() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    financeService
      .getReports()
      .then((res) => {
        if (active) setData(res.data?.data || null);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || "Failed to load finance reports");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const schoolProfiles = useMemo(
    () => [
      {
        schoolId: localStorage.getItem("schoolId") || "SCH001",
        ...(data?.schoolInfo || {}),
      },
    ],
    [data]
  );

  const currentUser = useMemo(() => ({ name: data?.schoolInfo?.schoolName || "" }), [data]);

  const reports = useMemo(() => {
    if (!data) return [];

    const { entries, groups, heads, paymentModes } = data;

    const optionsFor = (list, key, type) => [
      ...new Set(list.filter((item) => item.groupType === type).map((item) => item[key])),
    ];

    const entriesOf = (type, status) => entries.filter((item) => item.type === type && item.status === status);

    const baseFilters = (type) => [
      { name: "fromDate", label: "From Date", type: "date" },
      { name: "toDate", label: "To Date", type: "date" },
      {
        name: "groupName",
        label: "Group",
        type: "select",
        placeholder: "All Group",
        options: optionsFor(groups, "groupName", type),
      },
      {
        name: "headName",
        label: "Account Head",
        type: "select",
        placeholder: "All Head",
        options: optionsFor(heads, "headName", type),
      },
    ];

    const modeFilter = {
      name: "paymentMode",
      label: "Payment Mode",
      type: "select",
      placeholder: "All Mode",
      options: paymentModes,
    };

    const entryColumns = (type) => [
      SNO_COLUMN,
      { key: "voucherNo", label: type === "INCOME" ? "Receipt No" : "Voucher No" },
      { key: "dateLabel", label: type === "INCOME" ? "Receipt Date" : "Voucher Date" },
      { key: "groupName", label: "Group" },
      { key: "headName", label: "Account Head" },
      { key: "partyName", label: type === "INCOME" ? "Received From" : "Paid To" },
      { key: "paymentMode", label: "Payment Mode" },
      { key: "amount", label: "Amount", render: (row) => amountFormat(row.amount) },
    ];

    const entryReport = (id, title, description, icon, type, status, withMode) => ({
      id,
      title,
      description,
      icon,
      filters: withMode ? [...baseFilters(type), modeFilter] : baseFilters(type),
      columns: entryColumns(type),
      getData: ({ filters }) =>
        entriesOf(type, status)
          .filter((item) => isDateInRange(item.date, filters.fromDate, filters.toDate))
          .filter((item) => !filters.groupName || item.groupName === filters.groupName)
          .filter((item) => !filters.headName || item.headName === filters.headName)
          .filter((item) => !filters.paymentMode || item.paymentMode === filters.paymentMode)
          .map((item) => ({ ...item, dateLabel: formatDate(item.date) })),
    });

    return [
      entryReport("income-report", "Income Report", "View successful income receipt records", "💰", "INCOME", "SUCCESS", true),
      entryReport("cancelled-income-report", "Cancelled Income Report", "View cancelled income receipt records", "❌", "INCOME", "Cancelled", false),
      entryReport("expense-report", "Expense Report", "View successful expense voucher records", "💸", "EXPENSE", "SUCCESS", true),
      entryReport("cancelled-expense-report", "Cancelled Expense Report", "View cancelled expense voucher records", "❌", "EXPENSE", "Cancelled", false),

      {
        id: "income-vs-expense-report",
        title: "Income vs Expense Report",
        description: "View date-wise income, expense and net balance",
        icon: "📊",
        filters: [
          { name: "fromDate", label: "From Date", type: "date" },
          { name: "toDate", label: "To Date", type: "date" },
        ],
        columns: [
          SNO_COLUMN,
          { key: "dateLabel", label: "Date" },
          { key: "totalIncome", label: "Total Income", render: (row) => amountFormat(row.totalIncome) },
          { key: "totalExpense", label: "Total Expense", render: (row) => amountFormat(row.totalExpense) },
          { key: "netBalance", label: "Net Balance", render: (row) => amountFormat(row.netBalance) },
        ],
        getData: ({ filters }) => {
          const byDate = new Map();

          entries
            .filter((item) => item.status === "SUCCESS")
            .filter((item) => isDateInRange(item.date, filters.fromDate, filters.toDate))
            .forEach((item) => {
              if (!byDate.has(item.date)) byDate.set(item.date, { date: item.date, totalIncome: 0, totalExpense: 0 });
              const row = byDate.get(item.date);
              if (item.type === "INCOME") row.totalIncome += item.amount;
              else row.totalExpense += item.amount;
            });

          return [...byDate.values()]
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((row) => ({
              ...row,
              dateLabel: formatDate(row.date),
              netBalance: row.totalIncome - row.totalExpense,
            }));
        },
      },
    ];
  }, [data]);

  if (loading) {
    return (
      <div style={{ padding: "20px" }}>
        <SkeletonList count={5} />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: "20px" }}>
        <AppButton type="back" onClick={() => navigate("/finance-manager")}>
          ←
        </AppButton>

        <p>{error || "Finance reports are not available"}</p>
      </div>
    );
  }

  return (
    <MasterReport
      moduleTitle="Finance Analytics & Reports"
      reports={reports}
      schoolProfiles={schoolProfiles}
      currentUser={currentUser}
    />
  );
}

export default FinanceReports;
