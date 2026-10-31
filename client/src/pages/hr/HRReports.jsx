import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppButton from "../../components/AppButton";
import MasterReport from "../../components/reports/MasterReport";
import { SkeletonList } from "../../components/Skeleton";
import { hrService } from "../../services/api";

const LEAVE_TYPES = [
  "Paid Leave",
  "Casual Leave",
  "Sick Leave",
  "Unpaid Leave",
  "Emergency Leave",
  "Maternity Leave",
  "Paternity Leave",
  "Other",
];

const MONTH_OPTIONS = [
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
  "January",
  "February",
  "March",
];

const SNO_COLUMN = { key: "sno", label: "S.No", render: (_, index) => index + 1 };

const idOf = (value) => String(value?._id || value || "");

const countDays = (fromDate, toDate) => {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
};

function HRReports() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    hrService
      .getReports()
      .then((res) => {
        if (active) setData(res.data?.data || null);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || "Failed to load HR reports");
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
        ...(data?.school || {}),
      },
    ],
    [data]
  );

  const currentUser = useMemo(() => ({ name: data?.school?.schoolName || "" }), [data]);

  const reports = useMemo(() => {
    if (!data) return [];

    const { departments, positions, staff, leaves, structures, salaries } = data;

    const departmentName = (id) => departments.find((item) => idOf(item) === idOf(id))?.departmentName || "-";
    const positionName = (id) => positions.find((item) => idOf(item) === idOf(id))?.positionName || "-";
    const staffById = new Map(staff.map((item) => [idOf(item), item]));

    const departmentOptions = departments.map((item) => ({ value: item._id, label: item.departmentName }));
    const positionOptions = positions.map((item) => ({ value: item._id, label: item.positionName }));
    const employeeOptions = staff.map((item) => ({
      value: item._id,
      label: `${item.employeeName} (${item.employeeCode})`,
    }));
    const sessionOptions = [...new Set(salaries.map((item) => item.session).filter(Boolean))].sort().reverse();

    const employeeFilter = {
      name: "employeeId",
      label: "Employee",
      type: "select",
      placeholder: "All Employee",
      options: employeeOptions,
    };

    const commonEmployeeColumns = [
      SNO_COLUMN,
      { key: "employeeCode", label: "Employee Code" },
      { key: "employeeName", label: "Employee Name" },
      { key: "departmentLabel", label: "Department" },
      { key: "positionLabel", label: "Position" },
    ];

    // Adds department / position names for a row that stores their ids
    const withNames = (row, departmentId, positionId) => ({
      ...row,
      departmentLabel: departmentName(departmentId),
      positionLabel: positionName(positionId),
    });

    // Leave rows keep the names stored at the time of the leave, so they are used as they are
    const staffOf = (row) => staffById.get(idOf(row.staffId));

    return [
      {
        id: "employee-report",
        title: "Employee Report",
        description: "View employee details",
        icon: "👨‍🏫",
        defaultFilters: { departmentId: "", positionId: "", status: "" },
        filters: [
          { name: "departmentId", label: "Department", type: "select", placeholder: "All Department", options: departmentOptions },
          { name: "positionId", label: "Position", type: "select", placeholder: "All Position", options: positionOptions },
          { name: "status", label: "Status", type: "select", placeholder: "All Status", options: ["Active", "Inactive"] },
        ],
        columns: [
          ...commonEmployeeColumns,
          { key: "mobile", label: "Mobile Number" },
          { key: "email", label: "Email" },
          { key: "joiningDate", label: "Joining Date" },
          { key: "status", label: "Status" },
        ],
        getData: ({ filters }) =>
          staff
            .filter((item) => !filters.departmentId || idOf(item.departmentId) === filters.departmentId)
            .filter((item) => !filters.positionId || idOf(item.positionId) === filters.positionId)
            .map((item) => ({
              ...withNames(item, item.departmentId, item.positionId),
              status: item.isActive !== false && !item.lastWorkingDate ? "Active" : "Inactive",
            }))
            .filter((item) => !filters.status || item.status === filters.status),
      },

      {
        id: "leave-report",
        title: "Leave Report",
        description: "View employee leave details",
        icon: "📅",
        defaultFilters: { employeeId: "", leaveType: "", fromDate: "", toDate: "" },
        filters: [
          employeeFilter,
          { name: "leaveType", label: "Leave Type", type: "select", placeholder: "All Leave Type", options: LEAVE_TYPES },
          { name: "fromDate", label: "From Date", type: "date" },
          { name: "toDate", label: "To Date", type: "date" },
        ],
        columns: [
          SNO_COLUMN,
          { key: "employeeCode", label: "Employee Code" },
          { key: "employeeName", label: "Employee Name" },
          { key: "department", label: "Department" },
          { key: "position", label: "Position" },
          { key: "leaveType", label: "Leave Type" },
          { key: "fromDate", label: "From Date" },
          { key: "toDate", label: "To Date" },
          { key: "days", label: "Days" },
          { key: "reason", label: "Reason" },
        ],
        getData: ({ filters }) =>
          leaves
            .filter((item) => !filters.employeeId || idOf(item.staffId) === filters.employeeId)
            .filter((item) => !filters.leaveType || item.leaveType === filters.leaveType)
            .filter((item) => !filters.fromDate || item.fromDate >= filters.fromDate)
            .filter((item) => !filters.toDate || item.toDate <= filters.toDate)
            .map((item) => ({
              ...item,
              days: countDays(item.fromDate, item.toDate),
              reason: item.reason || "-",
            })),
      },

      {
        id: "salary-structure-report",
        title: "Salary Structure Report",
        description: "View employee salary structure",
        icon: "💰",
        defaultFilters: { employeeId: "", effectiveFrom: "" },
        filters: [employeeFilter, { name: "effectiveFrom", label: "Effective From", type: "month" }],
        columns: [
          ...commonEmployeeColumns,
          { key: "monthlySalary", label: "Monthly Salary" },
          { key: "effectiveFrom", label: "Effective From" },
        ],
        getData: ({ filters }) =>
          structures
            .filter((item) => !filters.employeeId || idOf(item.staffId) === filters.employeeId)
            .filter((item) => !filters.effectiveFrom || item.effectiveFrom >= filters.effectiveFrom)
            .filter((item) => staffOf(item))
            .map((item) => {
              const member = staffOf(item);
              return {
                ...withNames(item, member.departmentId, member.positionId),
                employeeCode: member.employeeCode,
                employeeName: member.employeeName,
              };
            }),
      },

      {
        id: "monthly-salary-report",
        title: "Monthly Salary Report",
        description: "View generated monthly salary",
        icon: "💰",
        defaultFilters: { employeeId: "", month: "", session: "" },
        filters: [
          employeeFilter,
          { name: "month", label: "Month", type: "select", placeholder: "All Month", options: MONTH_OPTIONS },
          { name: "session", label: "Session", type: "select", placeholder: "All Session", options: sessionOptions },
        ],
        columns: [
          SNO_COLUMN,
          { key: "employeeCode", label: "Employee Code" },
          { key: "employeeName", label: "Employee Name" },
          { key: "department", label: "Department" },
          { key: "position", label: "Position" },
          { key: "monthLabel", label: "Month" },
          { key: "session", label: "Session" },
          { key: "grossSalary", label: "Gross Salary" },
          { key: "totalLeave", label: "Total Leave" },
          { key: "paidLeave", label: "Paid Leave" },
          { key: "deductibleLeave", label: "Deductible Leave" },
          { key: "leaveDeduction", label: "Leave Deduction" },
          { key: "otherDeduction", label: "Other Deduction" },
          { key: "netSalary", label: "Net Salary" },
          { key: "paidAmount", label: "Paid Amount" },
          { key: "remainingAmount", label: "Remaining Amount" },
          { key: "paymentStatus", label: "Payment Status" },
        ],
        getData: ({ filters }) =>
          salaries
            .filter((item) => !filters.employeeId || idOf(item.staffId) === filters.employeeId)
            .filter((item) => !filters.month || item.month === filters.month)
            .filter((item) => !filters.session || item.session === filters.session)
            .map((item) => ({ ...item, monthLabel: `${item.month} ${item.year}` })),
      },
    ];
  }, [data]);

  if (loading) {
    return (
      <div style={{ padding: "20px" }}>
        <SkeletonList count={6} />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: "20px" }}>
        <AppButton type="back" onClick={() => navigate("/staff-control")}>
          ←
        </AppButton>

        <p>{error || "HR reports are not available"}</p>
      </div>
    );
  }

  return (
    <MasterReport
      moduleTitle="HR & Staff Analytics & Reports"
      reports={reports}
      schoolProfiles={schoolProfiles}
      currentUser={currentUser}
    />
  );
}

export default HRReports;
