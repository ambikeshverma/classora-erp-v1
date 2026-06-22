import React from "react";
import MasterReport from "../../components/reports/MasterReport";

function FinanceReports() {
  const schoolId = localStorage.getItem("schoolId") || "SCH001";

  const schoolProfiles = [
    {
      schoolId: "SCH001",
      schoolName: "Chandra Shekhar Azad Inter College",
      address: "Azad Nagar, Barabanki",
      email: "school@gmail.com",
      website: "www.school.com",
      phone: "9876543210",
      logo: "",
    },
  ];

  const currentUser = {
    name: localStorage.getItem("userName") || "School Admin",
  };

  const incomeEntries = [
    {
      id: 1,
      schoolId: "SCH001",
      receiptNo: "20260001",
      receiptDate: "2026-06-01",
      groupName: "Fees Income",
      accountHeadName: "Tuition Fee",
      receivedFromName: "Aman Kumar",
      paymentMode: "Cash",
      receivedAmount: 5000,
      status: "SUCCESS",
    },
    {
      id: 2,
      schoolId: "SCH001",
      receiptNo: "20260002",
      receiptDate: "2026-06-02",
      groupName: "Donation Income",
      accountHeadName: "General Donation",
      receivedFromName: "Ramesh Kumar",
      paymentMode: "UPI",
      receivedAmount: 2000,
      status: "Cancelled",
    },
  ];

  const expenseEntries = [
    {
      id: 1,
      schoolId: "SCH001",
      voucherNo: "EXP20260001",
      voucherDate: "2026-06-01",
      groupName: "Salary Expense",
      accountHeadName: "Salary",
      paidToName: "Ankit Verma",
      paymentMode: "Bank Transfer",
      paidAmount: 3000,
      status: "SUCCESS",
    },
    {
      id: 2,
      schoolId: "SCH001",
      voucherNo: "EXP20260002",
      voucherDate: "2026-06-02",
      groupName: "Transport Expense",
      accountHeadName: "Vehicle Expense",
      paidToName: "Driver",
      paymentMode: "Cash",
      paidAmount: 1000,
      status: "Cancelled",
    },
  ];

  const incomeGroups = [
    "Fees Income",
    "Transport Income",
    "Donation Income",
  ];

  const expenseGroups = [
    "Salary Expense",
    "Transport Expense",
    "Maintenance Expense",
  ];

  const incomeHeads = [
    "Tuition Fee",
    "Admission Fee",
    "Bus Fee",
    "General Donation",
  ];

  const expenseHeads = [
    "Salary",
    "Electricity bill",
    "Office expense",
    "Vehicle expense",
  ];

  const paymentModes = [
    "Cash",
    "UPI",
    "Bank Transfer",
    "Cheque",
    "Card",
  ];

  const isDateInRange = (date, fromDate, toDate) => {
    if (fromDate && date < fromDate) return false;
    if (toDate && date > toDate) return false;
    return true;
  };

  const amountFormat = (amount) =>
    `₹ ${Number(amount || 0).toLocaleString("en-IN")}`;

  const reports = [
    {
      id: "income-report",
      title: "Income Report",
      description: "View successful income receipt records",
      icon: "💰",
      filters: [
        { name: "fromDate", label: "From Date", type: "date" },
        { name: "toDate", label: "To Date", type: "date" },
        {
          name: "groupName",
          label: "Group",
          type: "select",
          placeholder: "All Group",
          options: incomeGroups,
        },
        {
          name: "accountHeadName",
          label: "Account Head",
          type: "select",
          placeholder: "All Head",
          options: incomeHeads,
        },
        {
          name: "paymentMode",
          label: "Payment Mode",
          type: "select",
          placeholder: "All Mode",
          options: paymentModes,
        },
      ],
      columns: [
        { key: "sno", label: "S.No", render: (_, index) => index + 1 },
        { key: "receiptNo", label: "Receipt No" },
        { key: "receiptDate", label: "Receipt Date" },
        { key: "groupName", label: "Group" },
        { key: "accountHeadName", label: "Account Head" },
        { key: "receivedFromName", label: "Received From" },
        { key: "paymentMode", label: "Payment Mode" },
        {
          key: "receivedAmount",
          label: "Amount",
          render: (row) => amountFormat(row.receivedAmount),
        },
      ],
      getData: ({ schoolId, filters }) =>
        incomeEntries
          .filter((item) => item.schoolId === schoolId)
          .filter((item) => item.status === "SUCCESS")
          .filter((item) =>
            isDateInRange(item.receiptDate, filters.fromDate, filters.toDate)
          )
          .filter((item) =>
            filters.groupName ? item.groupName === filters.groupName : true
          )
          .filter((item) =>
            filters.accountHeadName
              ? item.accountHeadName === filters.accountHeadName
              : true
          )
          .filter((item) =>
            filters.paymentMode ? item.paymentMode === filters.paymentMode : true
          ),
    },

    {
      id: "cancelled-income-report",
      title: "Cancelled Income Report",
      description: "View cancelled income receipt records",
      icon: "❌",
      filters: [
        { name: "fromDate", label: "From Date", type: "date" },
        { name: "toDate", label: "To Date", type: "date" },
        {
          name: "groupName",
          label: "Group",
          type: "select",
          placeholder: "All Group",
          options: incomeGroups,
        },
        {
          name: "accountHeadName",
          label: "Account Head",
          type: "select",
          placeholder: "All Head",
          options: incomeHeads,
        },
      ],
      columns: [
        { key: "sno", label: "S.No", render: (_, index) => index + 1 },
        { key: "receiptNo", label: "Receipt No" },
        { key: "receiptDate", label: "Receipt Date" },
        { key: "groupName", label: "Group" },
        { key: "accountHeadName", label: "Account Head" },
        { key: "receivedFromName", label: "Received From" },
        { key: "paymentMode", label: "Payment Mode" },
        {
          key: "receivedAmount",
          label: "Amount",
          render: (row) => amountFormat(row.receivedAmount),
        },
      ],
      getData: ({ schoolId, filters }) =>
        incomeEntries
          .filter((item) => item.schoolId === schoolId)
          .filter((item) => item.status === "Cancelled")
          .filter((item) =>
            isDateInRange(item.receiptDate, filters.fromDate, filters.toDate)
          )
          .filter((item) =>
            filters.groupName ? item.groupName === filters.groupName : true
          )
          .filter((item) =>
            filters.accountHeadName
              ? item.accountHeadName === filters.accountHeadName
              : true
          ),
    },

    {
      id: "expense-report",
      title: "Expense Report",
      description: "View successful expense voucher records",
      icon: "💸",
      filters: [
        { name: "fromDate", label: "From Date", type: "date" },
        { name: "toDate", label: "To Date", type: "date" },
        {
          name: "groupName",
          label: "Group",
          type: "select",
          placeholder: "All Group",
          options: expenseGroups,
        },
        {
          name: "accountHeadName",
          label: "Account Head",
          type: "select",
          placeholder: "All Head",
          options: expenseHeads,
        },
        {
          name: "paymentMode",
          label: "Payment Mode",
          type: "select",
          placeholder: "All Mode",
          options: paymentModes,
        },
      ],
      columns: [
        { key: "sno", label: "S.No", render: (_, index) => index + 1 },
        { key: "voucherNo", label: "Voucher No" },
        { key: "voucherDate", label: "Voucher Date" },
        { key: "groupName", label: "Group" },
        { key: "accountHeadName", label: "Account Head" },
        { key: "paidToName", label: "Paid To" },
        { key: "paymentMode", label: "Payment Mode" },
        {
          key: "paidAmount",
          label: "Amount",
          render: (row) => amountFormat(row.paidAmount),
        },
      ],
      getData: ({ schoolId, filters }) =>
        expenseEntries
          .filter((item) => item.schoolId === schoolId)
          .filter((item) => item.status === "SUCCESS")
          .filter((item) =>
            isDateInRange(item.voucherDate, filters.fromDate, filters.toDate)
          )
          .filter((item) =>
            filters.groupName ? item.groupName === filters.groupName : true
          )
          .filter((item) =>
            filters.accountHeadName
              ? item.accountHeadName === filters.accountHeadName
              : true
          )
          .filter((item) =>
            filters.paymentMode ? item.paymentMode === filters.paymentMode : true
          ),
    },

    {
      id: "cancelled-expense-report",
      title: "Cancelled Expense Report",
      description: "View cancelled expense voucher records",
      icon: "❌",
      filters: [
        { name: "fromDate", label: "From Date", type: "date" },
        { name: "toDate", label: "To Date", type: "date" },
        {
          name: "groupName",
          label: "Group",
          type: "select",
          placeholder: "All Group",
          options: expenseGroups,
        },
        {
          name: "accountHeadName",
          label: "Account Head",
          type: "select",
          placeholder: "All Head",
          options: expenseHeads,
        },
      ],
      columns: [
        { key: "sno", label: "S.No", render: (_, index) => index + 1 },
        { key: "voucherNo", label: "Voucher No" },
        { key: "voucherDate", label: "Voucher Date" },
        { key: "groupName", label: "Group" },
        { key: "accountHeadName", label: "Account Head" },
        { key: "paidToName", label: "Paid To" },
        { key: "paymentMode", label: "Payment Mode" },
        {
          key: "paidAmount",
          label: "Amount",
          render: (row) => amountFormat(row.paidAmount),
        },
      ],
      getData: ({ schoolId, filters }) =>
        expenseEntries
          .filter((item) => item.schoolId === schoolId)
          .filter((item) => item.status === "Cancelled")
          .filter((item) =>
            isDateInRange(item.voucherDate, filters.fromDate, filters.toDate)
          )
          .filter((item) =>
            filters.groupName ? item.groupName === filters.groupName : true
          )
          .filter((item) =>
            filters.accountHeadName
              ? item.accountHeadName === filters.accountHeadName
              : true
          ),
    },

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
        { key: "sno", label: "S.No", render: (_, index) => index + 1 },
        { key: "date", label: "Date" },
        {
          key: "totalIncome",
          label: "Total Income",
          render: (row) => amountFormat(row.totalIncome),
        },
        {
          key: "totalExpense",
          label: "Total Expense",
          render: (row) => amountFormat(row.totalExpense),
        },
        {
          key: "netBalance",
          label: "Net Balance",
          render: (row) => amountFormat(row.netBalance),
        },
      ],
      getData: ({ schoolId, filters }) => {
        const dates = [
          ...new Set([
            ...incomeEntries
              .filter((item) => item.schoolId === schoolId)
              .filter((item) => item.status === "SUCCESS")
              .map((item) => item.receiptDate),

            ...expenseEntries
              .filter((item) => item.schoolId === schoolId)
              .filter((item) => item.status === "SUCCESS")
              .map((item) => item.voucherDate),
          ]),
        ]
          .filter((date) => isDateInRange(date, filters.fromDate, filters.toDate))
          .sort();

        return dates.map((date) => {
          const totalIncome = incomeEntries
            .filter((item) => item.schoolId === schoolId)
            .filter((item) => item.status === "SUCCESS")
            .filter((item) => item.receiptDate === date)
            .reduce(
              (sum, item) => sum + Number(item.receivedAmount || 0),
              0
            );

          const totalExpense = expenseEntries
            .filter((item) => item.schoolId === schoolId)
            .filter((item) => item.status === "SUCCESS")
            .filter((item) => item.voucherDate === date)
            .reduce(
              (sum, item) => sum + Number(item.paidAmount || 0),
              0
            );

          return {
            date,
            totalIncome,
            totalExpense,
            netBalance: totalIncome - totalExpense,
          };
        });
      },
    },
  ];

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