import React from "react";
import MasterReport from "../../components/reports/MasterReport";

function AdminReports() {
  const schoolId = localStorage.getItem("schoolId") || "SCH001";

  const feePlanData = [
    {
      id: 1,
      schoolId,
      className: "Class 2",
      feePlanName: "6EM",
      feeScheme: "Monthly",
      studentType: "Old Student",
      amounts: {
        APR: 2150,
        MAY: 650,
        JUN: 650,
        JUL: 650,
        AUG: 650,
        SEP: 650,
        OCT: 950,
        NOV: 650,
        DEC: 650,
        JAN: 650,
        FEB: 950,
        MAR: 650,
      },
      feeHeads: [
        {
          feeHeadName: "Tuition Fee",
          APR: 650,
          MAY: 650,
          JUN: 650,
          JUL: 650,
          AUG: 650,
          SEP: 650,
          OCT: 650,
          NOV: 650,
          DEC: 650,
          JAN: 650,
          FEB: 650,
          MAR: 650,
        },
        {
          feeHeadName: "Exam Fee",
          APR: 0,
          MAY: 0,
          JUN: 0,
          JUL: 0,
          AUG: 0,
          SEP: 0,
          OCT: 300,
          NOV: 0,
          DEC: 0,
          JAN: 0,
          FEB: 300,
          MAR: 0,
        },
        {
          feeHeadName: "Maintenance Fee",
          APR: 1500,
          MAY: 0,
          JUN: 0,
          JUL: 0,
          AUG: 0,
          SEP: 0,
          OCT: 0,
          NOV: 0,
          DEC: 0,
          JAN: 0,
          FEB: 0,
          MAR: 0,
        },
      ],
    },
  ];

  const months = [
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
    "JAN",
    "FEB",
    "MAR",
  ];

  const getTotal = (amounts) => {
    return months.reduce((sum, month) => {
      return sum + Number(amounts?.[month] || 0);
    }, 0);
  };

  const feePlanSummaryRows = feePlanData.map((item) => ({
    className: item.className,
    feePlanName: item.feePlanName,
    studentType: item.studentType,
    ...item.amounts,
    total: getTotal(item.amounts),
  }));

  const feePlanDetailRows = [];

  feePlanData.forEach((plan) => {
    let groupTotal = 0;

    plan.feeHeads.forEach((head, index) => {
      const rowTotal = getTotal(head);
      groupTotal += rowTotal;

      feePlanDetailRows.push({
        className: index === 0 ? plan.className : "",
        feePlanName: index === 0 ? plan.feePlanName : "",
        studentType: index === 0 ? plan.studentType : "",
        feeHeadName: head.feeHeadName,
        ...head,
        total: rowTotal,
        isGroupTotal: false,
      });
    });

    feePlanDetailRows.push({
      className: "Total",
      feePlanName: "",
      studentType: "",
      feeHeadName: "",
      total: groupTotal,
      isGroupTotal: true,
    });
  });

  const reportConfigs = [
    {
      id: "fee-plan-summary-report",
      title: "Fee Plan Summary Report",
      icon: "💳",
      description: "Class, fee plan and student type wise fee summary",
      filters: [
        {
          key: "className",
          label: "Class",
          type: "select",
          placeholder: "All Classes",
          options: ["Class 1", "Class 2", "Class 3", "Class 4"],
        },
        {
          key: "feePlanName",
          label: "Fee Plan Name",
          type: "select",
          placeholder: "All Fee Plans",
          options: ["6HM", "6EM", "7HM", "7EM"],
        },
        {
          key: "studentType",
          label: "Student Type",
          type: "select",
          placeholder: "All Student Types",
          options: ["New Student", "Old Student"],
        },
      ],
      columns: [
        { key: "className", label: "Class Name" },
        { key: "feePlanName", label: "Fee Plan Name" },
        { key: "studentType", label: "Student Type" },
        ...months.map((month) => ({
          key: month,
          label: month,
        })),
        { key: "total", label: "Total" },
      ],
      data: feePlanSummaryRows,
    },
    {
      id: "fee-plan-detail-report",
      title: "Fee Plan Detail Report",
      icon: "💳",
      description: "Fee head wise detailed fee plan report",
      filters: [
        {
          key: "className",
          label: "Class",
          type: "select",
          placeholder: "All Classes",
          options: ["Class 1", "Class 2", "Class 3", "Class 4"],
        },
        {
          key: "feePlanName",
          label: "Fee Plan Name",
          type: "select",
          placeholder: "All Fee Plans",
          options: ["6HM", "6EM", "7HM", "7EM"],
        },
        {
          key: "studentType",
          label: "Student Type",
          type: "select",
          placeholder: "All Student Types",
          options: ["New Student", "Old Student"],
        },
      ],
      columns: [
        { key: "className", label: "Class Name" },
        { key: "feePlanName", label: "Fee Plan Name" },
        { key: "studentType", label: "Student Type" },
        { key: "feeHeadName", label: "Fee Head Name" },
        ...months.map((month) => ({
          key: month,
          label: month,
        })),
        { key: "total", label: "Total" },
      ],
      data: feePlanDetailRows,
    },
  ];

  return (
    <MasterReport
      title="Admin Panel Reports"
      subtitle="Fee plan summary and detailed fee reports"
      reports={reportConfigs}
      backPath="/admin-panel"
    />
  );
}

export default AdminReports;