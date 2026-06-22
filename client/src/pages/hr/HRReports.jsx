import React from "react";
import MasterReport from "../../components/reports/MasterReport";

function HRReports() {
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

  const departments = [
    { id: 1, schoolId: "SCH001", departmentName: "Teaching" },
    { id: 2, schoolId: "SCH001", departmentName: "Accounts" },
    { id: 3, schoolId: "SCH001", departmentName: "Transport" },
  ];

  const positions = [
    { id: 1, schoolId: "SCH001", departmentId: 1, positionName: "Teacher" },
    { id: 2, schoolId: "SCH001", departmentId: 1, positionName: "Coordinator" },
    { id: 3, schoolId: "SCH001", departmentId: 2, positionName: "Accountant" },
    { id: 4, schoolId: "SCH001", departmentId: 3, positionName: "Driver" },
  ];

  const staffList = [
    {
      id: 1,
      schoolId: "SCH001",
      employeeCode: "SCH001-EMP-0001",
      employeeName: "Amit Kumar",
      departmentId: 1,
      positionId: 1,
      mobile: "9876543210",
      email: "amit@gmail.com",
      gender: "Male",
      joiningDate: "2026-04-01",
      isActive: true,
      lastWorkingDate: "",
    },
    {
      id: 2,
      schoolId: "SCH001",
      employeeCode: "SCH001-EMP-0002",
      employeeName: "Rahul Verma",
      departmentId: 2,
      positionId: 3,
      mobile: "9876543211",
      email: "rahul@gmail.com",
      gender: "Male",
      joiningDate: "2026-04-10",
      isActive: true,
      lastWorkingDate: "",
    },
  ];

  const leaveTypes = [
    "Paid Leave",
    "Casual Leave",
    "Sick Leave",
    "Unpaid Leave",
    "Emergency Leave",
    "Maternity Leave",
    "Paternity Leave",
    "Other",
  ];

  const leaveRecords = [
    {
      id: 1,
      schoolId: "SCH001",
      employeeId: 1,
      employeeCode: "SCH001-EMP-0001",
      employeeName: "Amit Kumar",
      departmentId: 1,
      positionId: 1,
      leaveType: "Sick Leave",
      fromDate: "2026-05-10",
      toDate: "2026-05-11",
      days: 2,
      reason: "Health issue",
      source: "Manual",
    },
  ];

  const salaryStructures = [
    {
      id: 1,
      schoolId: "SCH001",
      employeeId: 1,
      employeeCode: "SCH001-EMP-0001",
      employeeName: "Amit Kumar",
      departmentId: 1,
      positionId: 1,
      monthlySalary: 30000,
      effectiveFrom: "2026-07-01",
    },
  ];

  const salaryRecords = [
    {
      id: 1,
      schoolId: "SCH001",
      employeeId: 1,
      employeeCode: "SCH001-EMP-0001",
      employeeName: "Amit Kumar",
      departmentId: 1,
      positionId: 1,
      month: "April",
      session: "2026-27",
      grossSalary: 30000,
      totalLeave: 2,
      paidLeave: 1,
      deductibleLeave: 1,
      leaveDeduction: 1000,
      otherDeduction: 0,
      netSalary: 29000,
      paidAmount: 10000,
      remainingAmount: 19000,
      paymentStatus: "Partially Paid",
    },
  ];

  const monthOptions = [
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

  const sessionOptions = ["2026-27", "2025-26", "2024-25"];

  const departmentOptions = departments
    .filter((item) => item.schoolId === schoolId)
    .map((item) => ({
      value: item.id,
      label: item.departmentName,
    }));

  const positionOptions = positions
    .filter((item) => item.schoolId === schoolId)
    .map((item) => ({
      value: item.id,
      label: item.positionName,
    }));

  const activeEmployeeOptions = staffList
    .filter(
      (item) =>
        item.schoolId === schoolId &&
        item.isActive &&
        !item.lastWorkingDate
    )
    .map((item) => ({
      value: item.id,
      label: `${item.employeeName} (${item.employeeCode})`,
    }));

  const getDepartmentName = (departmentId) =>
    departments.find((item) => item.id === departmentId)?.departmentName || "-";

  const getPositionName = (positionId) =>
    positions.find((item) => item.id === positionId)?.positionName || "-";

  const commonEmployeeColumns = [
    { key: "sno", label: "S.No", render: (_, index) => index + 1 },
    { key: "employeeCode", label: "Employee Code" },
    { key: "employeeName", label: "Employee Name" },
    {
      key: "departmentId",
      label: "Department",
      render: (row) => getDepartmentName(row.departmentId),
    },
    {
      key: "positionId",
      label: "Position",
      render: (row) => getPositionName(row.positionId),
    },
  ];

  const reports = [
    {
      id: "employee-report",
      title: "Employee Report",
      description: "View employee details",
      icon: "👨‍🏫",
      defaultFilters: {
        departmentId: "",
        positionId: "",
      },
      filters: [
        {
          name: "departmentId",
          label: "Department",
          type: "select",
          placeholder: "All Department",
          options: departmentOptions,
        },
        {
          name: "positionId",
          label: "Position",
          type: "select",
          placeholder: "All Position",
          options: positionOptions,
        },
      ],
      columns: [
        ...commonEmployeeColumns,
        { key: "mobile", label: "Mobile Number" },
        {
          key: "status",
          label: "Status",
          render: (row) => (row.isActive ? "Active" : "Inactive"),
        },
      ],
      getData: ({ schoolId, filters }) =>
        staffList
          .filter((item) => item.schoolId === schoolId)
          .filter((item) =>
            filters.departmentId
              ? item.departmentId === Number(filters.departmentId)
              : true
          )
          .filter((item) =>
            filters.positionId
              ? item.positionId === Number(filters.positionId)
              : true
          ),
    },

    {
      id: "leave-report",
      title: "Leave Report",
      description: "View employee leave details",
      icon: "📅",
      defaultFilters: {
        employeeId: "",
        leaveType: "",
        fromDate: "",
        toDate: "",
      },
      filters: [
        {
          name: "employeeId",
          label: "Employee",
          type: "select",
          placeholder: "All Employee",
          options: activeEmployeeOptions,
        },
        {
          name: "leaveType",
          label: "Leave Type",
          type: "select",
          placeholder: "All Leave Type",
          options: leaveTypes,
        },
        { name: "fromDate", label: "From Date", type: "date" },
        { name: "toDate", label: "To Date", type: "date" },
      ],
      columns: [
        ...commonEmployeeColumns,
        { key: "leaveType", label: "Leave Type" },
        { key: "fromDate", label: "From Date" },
        { key: "toDate", label: "To Date" },
        { key: "days", label: "Days" },
        { key: "reason", label: "Reason" },
        { key: "source", label: "Source" },
      ],
      getData: ({ schoolId, filters }) =>
        leaveRecords
          .filter((item) => item.schoolId === schoolId)
          .filter((item) =>
            filters.employeeId
              ? item.employeeId === Number(filters.employeeId)
              : true
          )
          .filter((item) =>
            filters.leaveType ? item.leaveType === filters.leaveType : true
          )
          .filter((item) =>
            filters.fromDate ? item.fromDate >= filters.fromDate : true
          )
          .filter((item) =>
            filters.toDate ? item.toDate <= filters.toDate : true
          ),
    },

    {
      id: "salary-structure-report",
      title: "Salary Structure Report",
      description: "View employee salary structure",
      icon: "💰",
      defaultFilters: {
        employeeId: "",
        effectiveFrom: "",
      },
      filters: [
        {
          name: "employeeId",
          label: "Employee",
          type: "select",
          placeholder: "All Employee",
          options: activeEmployeeOptions,
        },
        {
          name: "effectiveFrom",
          label: "Effective From",
          type: "date",
        },
      ],
      columns: [
        ...commonEmployeeColumns,
        { key: "monthlySalary", label: "Monthly Salary" },
        { key: "effectiveFrom", label: "Effective From" },
      ],
      getData: ({ schoolId, filters }) =>
        salaryStructures
          .filter((item) => item.schoolId === schoolId)
          .filter((item) =>
            filters.employeeId
              ? item.employeeId === Number(filters.employeeId)
              : true
          )
          .filter((item) =>
            filters.effectiveFrom
              ? item.effectiveFrom >= filters.effectiveFrom
              : true
          ),
    },

    {
      id: "monthly-salary-report",
      title: "Monthly Salary Report",
      description: "View generated monthly salary",
      icon: "💰",
      defaultFilters: {
        employeeId: "",
        month: "",
        session: "",
      },
      filters: [
        {
          name: "employeeId",
          label: "Employee",
          type: "select",
          placeholder: "All Employee",
          options: activeEmployeeOptions,
        },
        {
          name: "month",
          label: "Month",
          type: "select",
          placeholder: "All Month",
          options: monthOptions,
        },
        {
          name: "session",
          label: "Session",
          type: "select",
          placeholder: "All Session",
          options: sessionOptions,
        },
      ],
      columns: [
        ...commonEmployeeColumns,
        { key: "month", label: "Month" },
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
      getData: ({ schoolId, filters }) =>
        salaryRecords
          .filter((item) => item.schoolId === schoolId)
          .filter((item) =>
            filters.employeeId
              ? item.employeeId === Number(filters.employeeId)
              : true
          )
          .filter((item) => (filters.month ? item.month === filters.month : true))
          .filter((item) =>
            filters.session ? item.session === filters.session : true
          ),
    },
  ];

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