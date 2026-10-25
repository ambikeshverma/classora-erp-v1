import React, { useState, useEffect } from "react";
import MasterReport from "../../components/reports/MasterReport";
import { SkeletonTable } from "../../components/Skeleton";
import { adminPanelService } from "../../services/api";

function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [feePlans, setFeePlans] = useState([]);
  const [feeScheme, setFeeScheme] = useState({});

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await adminPanelService.getReports();
      if (res.data?.data) {
        setFeePlans(res.data.data.feePlans || []);
        setFeeScheme(res.data.data.feeScheme || {});
      }
    } catch (err) {
      console.error("Failed to load admin reports", err);
    } finally {
      setLoading(false);
    }
  };

  const defaultMonths = [
    "APR", "MAY", "JUN", "JUL", "AUG", "SEP",
    "OCT", "NOV", "DEC", "JAN", "FEB", "MAR",
  ];

  // Dynamic columns based on scheme or first plan
  const months = (feePlans[0]?.columns?.length) ? feePlans[0].columns : defaultMonths;

  const getTotal = (amounts) => {
    return months.reduce((sum, month) => {
      return sum + Number(amounts?.[month] || 0);
    }, 0);
  };

  // Convert feePlans into New Student & Old Student summary rows
  const feePlanSummaryRows = [];
  const feePlanDetailRows = [];

  const availableClasses = new Set();
  const availablePlanNames = new Set();

  feePlans.forEach((plan) => {
    availableClasses.add(plan.className);
    availablePlanNames.add(plan.feePlanName);

    const heads = plan.feeHeads || [];

    // Helper for student type
    const processType = (studentType, amountsObj) => {
      // Calculate month totals across all heads
      const monthTotals = {};
      months.forEach((m) => {
        monthTotals[m] = heads.reduce(
          (sum, h) => sum + Number(amountsObj?.[h]?.[m] || 0),
          0
        );
      });

      feePlanSummaryRows.push({
        className: plan.className,
        feePlanName: plan.feePlanName,
        studentType,
        ...monthTotals,
        total: getTotal(monthTotals),
      });

      // Detail rows
      let groupTotal = 0;
      heads.forEach((head, index) => {
        const headAmounts = amountsObj?.[head] || {};
        const rowTotal = getTotal(headAmounts);
        groupTotal += rowTotal;

        feePlanDetailRows.push({
          className: index === 0 ? plan.className : "",
          feePlanName: index === 0 ? plan.feePlanName : "",
          studentType: index === 0 ? studentType : "",
          feeHeadName: head,
          ...headAmounts,
          total: rowTotal,
          isGroupTotal: false,
        });
      });

      if (heads.length > 0) {
        feePlanDetailRows.push({
          className: "Total",
          feePlanName: "",
          studentType: "",
          feeHeadName: "",
          total: groupTotal,
          isGroupTotal: true,
        });
      }
    };

    if (plan.newStudentAmounts) {
      processType("New Student", plan.newStudentAmounts);
    }
    if (plan.oldStudentAmounts) {
      processType("Old Student", plan.oldStudentAmounts);
    }
  });

  const classOptions = Array.from(availableClasses).sort();
  const planNameOptions = Array.from(availablePlanNames).sort();

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
          options: classOptions,
        },
        {
          key: "feePlanName",
          label: "Fee Plan Name",
          type: "select",
          placeholder: "All Fee Plans",
          options: planNameOptions,
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
          options: classOptions,
        },
        {
          key: "feePlanName",
          label: "Fee Plan Name",
          type: "select",
          placeholder: "All Fee Plans",
          options: planNameOptions,
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

  if (loading) {
    return (
      <div style={{ padding: "24px" }}>
        <SkeletonTable rows={6} columns={6} />
      </div>
    );
  }

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