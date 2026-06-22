import React, { useState } from "react";
import "./salaryManagement.css";
import AppButton from "../components/AppButton";

function SalaryManagement() {

  const schoolId =
    localStorage.getItem("schoolId") ||
    "SCH001";

  const departments = [
    {
      id: 1,
      schoolId: "SCH001",
      departmentName: "Teaching",
    },
    {
      id: 2,
      schoolId: "SCH001",
      departmentName: "Accounts",
    },
  ];

  const positions = [
    {
      id: 1,
      schoolId: "SCH001",
      department: "Teaching",
      positionName: "Teacher",
    },
    {
      id: 2,
      schoolId: "SCH001",
      department: "Teaching",
      positionName: "Coordinator",
    },
    {
      id: 3,
      schoolId: "SCH001",
      department: "Accounts",
      positionName: "Accountant",
    },
  ];

  const staffList = [
    {
      id: 1,
      schoolId: "SCH001",
      employeeCode: "SCH001-EMP-0001",
      employeeName: "Amit Kumar",
      department: "Teaching",
      position: "Teacher",
      isActive: true,
      lastWorkingDate: "",
    },

    {
      id: 2,
      schoolId: "SCH001",
      employeeCode: "SCH001-EMP-0002",
      employeeName: "Rahul Verma",
      department: "Accounts",
      position: "Accountant",
      isActive: true,
      lastWorkingDate: "",
    },
  ];

  const leaveRecords = [
    {
      employeeId: 1,
      month: "May",
      year: "2026",
      leaveType: "Sick Leave",
      days: 2,
    },

    {
      employeeId: 1,
      month: "May",
      year: "2026",
      leaveType: "Paid Leave",
      days: 1,
    },
  ];

  const [showSalaryStructureForm,
    setShowSalaryStructureForm] =
    useState(false);

  const [showGenerateSalaryForm,
    setShowGenerateSalaryForm] =
    useState(false);

  const [selectedStructureIds,
    setSelectedStructureIds] =
    useState([]);

  const [selectedSalaryIds,
    setSelectedSalaryIds] =
    useState([]);

  const [salaryStructures,
    setSalaryStructures] =
    useState([
      {
        id: 1,
        schoolId: "SCH001",
        employeeId: 1,
        employeeCode: "SCH001-EMP-0001",
        employeeName: "Amit Kumar",
        monthlySalary: 30000,
        effectiveFrom: "2026-07",
      },
    ]);

  const [salaryRecords,
    setSalaryRecords] =
    useState([]);

  const [filterData,
    setFilterData] =
    useState({
      department: "",
      position: "",
      employeeId: "",
      month: "",
      year: "",
    });

  const [appliedFilters,
    setAppliedFilters] =
    useState({
      department: "",
      position: "",
      employeeId: "",
      month: "",
      year: "",
    });

  const [salaryStructureForm,
    setSalaryStructureForm] =
    useState({
      employeeId: "",
      monthlySalary: "",
      effectiveFrom: "",
    });

  const [generateSalaryForm,
    setGenerateSalaryForm] =
    useState({
      employeeId: "",
      month: "",
      year: "",
      otherDeduction: "",
    });

  const activeStaff =
    staffList.filter(
      (item) =>
        item.schoolId === schoolId &&
        item.isActive &&
        !item.lastWorkingDate
    );

  const schoolDepartments =
    departments.filter(
      (item) =>
        item.schoolId === schoolId
    );

  const filterPositions =
    positions.filter(
      (item) =>
        item.schoolId === schoolId &&
        (
          !filterData.department ||
          item.department ===
            filterData.department
        )
    );

  const filterEmployees =
    activeStaff.filter(
      (item) =>
        (
          !filterData.department ||
          item.department ===
            filterData.department
        ) &&
        (
          !filterData.position ||
          item.position ===
            filterData.position
        )
    );

  const filteredSalaryRecords =
    salaryRecords.filter(
      (item) =>
        item.schoolId === schoolId &&
        (
          !appliedFilters.department ||
          item.department ===
            appliedFilters.department
        ) &&
        (
          !appliedFilters.position ||
          item.position ===
            appliedFilters.position
        ) &&
        (
          !appliedFilters.employeeId ||
          item.employeeId ===
            Number(
              appliedFilters.employeeId
            )
        ) &&
        (
          !appliedFilters.month ||
          item.month ===
            appliedFilters.month
        ) &&
        (
          !appliedFilters.year ||
          item.year ===
            appliedFilters.year
        )
    );

  const handleSearch = () => {
    setAppliedFilters(filterData);
    setSelectedSalaryIds([]);
  };

  const resetSalaryStructureForm =
    () => {
      setSalaryStructureForm({
        employeeId: "",
        monthlySalary: "",
        effectiveFrom: "",
      });
    };

  const resetGenerateSalaryForm =
    () => {
      setGenerateSalaryForm({
        employeeId: "",
        month: "",
        year: "",
        otherDeduction: "",
      });
    };

  const handleSaveSalaryStructure =
    () => {

      if (
        !salaryStructureForm.employeeId ||
        !salaryStructureForm.monthlySalary ||
        !salaryStructureForm.effectiveFrom
      ) {

        alert(
          "Please fill all required fields"
        );

        return;
      }

      const selectedEmployee =
        activeStaff.find(
          (staff) =>
            staff.id ===
            Number(
              salaryStructureForm.employeeId
            )
        );

      const existing =
        salaryStructures.find(
          (item) =>
            item.employeeId ===
            selectedEmployee.id
        );

      if (existing) {

        alert(
          "Salary structure already exists"
        );

        return;
      }

      const newStructure = {
        id: Date.now(),
        schoolId,
        employeeId:
          selectedEmployee.id,
        employeeCode:
          selectedEmployee.employeeCode,
        employeeName:
          selectedEmployee.employeeName,
        monthlySalary:
          Number(
            salaryStructureForm.monthlySalary
          ),
        effectiveFrom:
          salaryStructureForm.effectiveFrom,
      };

      setSalaryStructures([
        ...salaryStructures,
        newStructure,
      ]);

      alert(
        "Salary structure added successfully"
      );

      resetSalaryStructureForm();

      setShowSalaryStructureForm(
        false
      );
    };
    const handleEditSalaryStructure = () => {

    if (selectedStructureIds.length !== 1) {

      alert(
        "Select one salary structure"
      );

      return;
    }

    const selected =
      salaryStructures.find(
        (item) =>
          item.id ===
          selectedStructureIds[0]
      );

    if (!selected) return;

    setSalaryStructureForm({
      employeeId:
        String(selected.employeeId),
      monthlySalary:
        selected.monthlySalary,
      effectiveFrom:
        selected.effectiveFrom,
    });

    setShowSalaryStructureForm(true);
  };

  const handleDeleteSalaryStructure =
    () => {

      if (
        selectedStructureIds.length === 0
      ) {

        alert(
          "Select salary structure"
        );

        return;
      }

      const ok = window.confirm(
        "Delete selected salary structure?"
      );

      if (!ok) return;

      setSalaryStructures(
        salaryStructures.filter(
          (item) =>
            !selectedStructureIds.includes(
              item.id
            )
        )
      );

      setSelectedStructureIds([]);

      alert(
        "Salary structure deleted successfully"
      );
    };

  const getSalaryStructure = (
    employeeId,
    month,
    year
  ) => {

    return salaryStructures.find(
      (item) =>
        item.employeeId ===
          Number(employeeId) &&
        item.schoolId === schoolId
    );
  };

  const getLeaveSummary = (
    employeeId,
    month,
    year
  ) => {

    const employeeLeaves =
      leaveRecords.filter(
        (leave) =>
          leave.employeeId ===
            Number(employeeId) &&
          leave.month === month &&
          leave.year === year
      );

    const totalLeave =
      employeeLeaves.reduce(
        (sum, item) =>
          sum + item.days,
        0
      );

    const paidLeave =
      employeeLeaves
        .filter(
          (item) =>
            item.leaveType ===
            "Paid Leave"
        )
        .reduce(
          (sum, item) =>
            sum + item.days,
          0
        );

    const deductibleLeave =
      totalLeave - paidLeave;

    return {
      totalLeave,
      paidLeave,
      deductibleLeave,
    };
  };

  const getMonthDays = (
    month,
    year
  ) => {

    const monthIndex = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ].indexOf(month);

    return new Date(
      Number(year),
      monthIndex + 1,
      0
    ).getDate();
  };

  const calculateSalary = (
    employeeId,
    month,
    year,
    otherDeduction
  ) => {

    const structure =
      getSalaryStructure(
        employeeId,
        month,
        year
      );

    if (!structure) {
      return null;
    }

    const leaveSummary =
      getLeaveSummary(
        employeeId,
        month,
        year
      );

    const monthDays =
      getMonthDays(month, year);

    const oneDaySalary =
      structure.monthlySalary /
      monthDays;

    const leaveDeduction =
      oneDaySalary *
      leaveSummary.deductibleLeave;

    const grossSalary =
      structure.monthlySalary;

    const netSalary =
      grossSalary -
      leaveDeduction -
      Number(otherDeduction || 0);

    return {
      grossSalary,
      totalLeave:
        leaveSummary.totalLeave,
      paidLeave:
        leaveSummary.paidLeave,
      deductibleLeave:
        leaveSummary.deductibleLeave,
      leaveDeduction:
        Number(
          leaveDeduction.toFixed(2)
        ),
      netSalary:
        Number(netSalary.toFixed(2)),
    };
  };

  const handleGenerateSalary = () => {

    if (
      !generateSalaryForm.employeeId ||
      !generateSalaryForm.month ||
      !generateSalaryForm.year
    ) {

      alert(
        "Please fill all required fields"
      );

      return;
    }

    const selectedEmployee =
      activeStaff.find(
        (staff) =>
          staff.id ===
          Number(
            generateSalaryForm.employeeId
          )
      );

    if (!selectedEmployee) {

      alert("Employee not found");

      return;
    }

    const alreadyGenerated =
      salaryRecords.some(
        (item) =>
          item.employeeId ===
            selectedEmployee.id &&
          item.month ===
            generateSalaryForm.month &&
          item.year ===
            generateSalaryForm.year
      );

    if (alreadyGenerated) {

      alert(
        "Salary already generated for this month"
      );

      return;
    }

    const salary =
      calculateSalary(
        generateSalaryForm.employeeId,
        generateSalaryForm.month,
        generateSalaryForm.year,
        generateSalaryForm.otherDeduction
      );

    if (!salary) {

      alert(
        "Salary structure not found for selected employee"
      );

      return;
    }

    const newSalary = {
      id: Date.now(),
      schoolId,
      employeeId:
        selectedEmployee.id,
      employeeCode:
        selectedEmployee.employeeCode,
      employeeName:
        selectedEmployee.employeeName,
      department:
        selectedEmployee.department,
      position:
        selectedEmployee.position,
      month:
        generateSalaryForm.month,
      year:
        generateSalaryForm.year,
      grossSalary:
        salary.grossSalary,
      totalLeave:
        salary.totalLeave,
      paidLeave:
        salary.paidLeave,
      deductibleLeave:
        salary.deductibleLeave,
      leaveDeduction:
        salary.leaveDeduction,
      otherDeduction:
        Number(
          generateSalaryForm.otherDeduction ||
            0
        ),
      netSalary:
        salary.netSalary,
      paidAmount: 0,
      remainingAmount:
        salary.netSalary,
      paymentStatus:
        "Unpaid",
      paymentHistory: [],
    };

    setSalaryRecords([
      ...salaryRecords,
      newSalary,
    ]);

    alert(
      "Salary generated successfully"
    );

    resetGenerateSalaryForm();

    setShowGenerateSalaryForm(
      false
    );
  };
  const [showPaymentPopup, setShowPaymentPopup] =
    useState(false);

  const [paymentSalary, setPaymentSalary] =
    useState(null);

  const [paymentForm, setPaymentForm] =
    useState({
      paymentAmount: "",
      paymentDate: "",
      paymentMode: "",
      remarks: "",
      bankName: "",
      transactionNumber: "",
      transactionDate: "",
      upiAppName: "",
      transactionId: "",
      chequeNumber: "",
      issueDate: "",
    });

  const resetPaymentForm = () => {
    setPaymentForm({
      paymentAmount: "",
      paymentDate: "",
      paymentMode: "",
      remarks: "",
      bankName: "",
      transactionNumber: "",
      transactionDate: "",
      upiAppName: "",
      transactionId: "",
      chequeNumber: "",
      issueDate: "",
    });
  };

  const handlePaySalaryOpen = () => {
    if (selectedSalaryIds.length !== 1) {
      alert("Select one salary record");
      return;
    }

    const selected = salaryRecords.find(
      (item) =>
        item.id === selectedSalaryIds[0]
    );

    if (!selected) return;

    setPaymentSalary(selected);
    resetPaymentForm();
    setShowPaymentPopup(true);
  };

  const handleSavePayment = () => {
    if (
      !paymentForm.paymentAmount ||
      !paymentForm.paymentDate ||
      !paymentForm.paymentMode
    ) {
      alert("Please fill required payment fields");
      return;
    }

    const amount =
      Number(paymentForm.paymentAmount);

    if (amount <= 0) {
      alert("Enter valid payment amount");
      return;
    }

    if (amount > paymentSalary.remainingAmount) {
      alert("Payment amount cannot be greater than remaining amount");
      return;
    }

    const totalPaid =
      paymentSalary.paidAmount + amount;

    const remaining =
      paymentSalary.netSalary - totalPaid;

    let status = "Unpaid";

    if (totalPaid > 0 && totalPaid < paymentSalary.netSalary) {
      status = "Partially Paid";
    }

    if (totalPaid === paymentSalary.netSalary) {
      status = "Paid";
    }

    const paymentEntry = {
      id: Date.now(),
      amount,
      paymentDate: paymentForm.paymentDate,
      paymentMode: paymentForm.paymentMode,
      remarks: paymentForm.remarks,
      bankName: paymentForm.bankName,
      transactionNumber: paymentForm.transactionNumber,
      transactionDate: paymentForm.transactionDate,
      upiAppName: paymentForm.upiAppName,
      transactionId: paymentForm.transactionId,
      chequeNumber: paymentForm.chequeNumber,
      issueDate: paymentForm.issueDate,
    };

    const updatedRecords =
      salaryRecords.map((item) =>
        item.id === paymentSalary.id
          ? {
              ...item,
              paidAmount: totalPaid,
              remainingAmount: remaining,
              paymentStatus: status,
              paymentHistory: [
                ...item.paymentHistory,
                paymentEntry,
              ],
            }
          : item
      );

    setSalaryRecords(updatedRecords);
    setShowPaymentPopup(false);
    setPaymentSalary(null);
    resetPaymentForm();

    alert("Payment updated successfully");
  };

  const handleDeleteSalary = () => {
    if (selectedSalaryIds.length === 0) {
      alert("Select salary record");
      return;
    }

    const ok = window.confirm("Delete selected salary record?");
    if (!ok) return;

    setSalaryRecords(
      salaryRecords.filter(
        (item) =>
          !selectedSalaryIds.includes(item.id)
      )
    );

    setSelectedSalaryIds([]);

    alert("Salary record deleted");
  };

  const handleViewSlip = () => {
    if (selectedSalaryIds.length !== 1) {
      alert("Select one salary record");
      return;
    }

    alert("Salary slip view will open");
  };

  const handlePrintSalary = () => {
    if (selectedSalaryIds.length !== 1) {
      alert("Select one salary record");
      return;
    }

    alert("Salary slip print started");
  };

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const years = [
    "2026",
    "2025",
    "2024",
    "2023",
  ];

  return (
    <div className="salary-management-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => {
            if (showSalaryStructureForm) {
              resetSalaryStructureForm();
              setShowSalaryStructureForm(false);
            } else if (showGenerateSalaryForm) {
              resetGenerateSalaryForm();
              setShowGenerateSalaryForm(false);
            } else {
              window.location.href = "/staff-control";
            }
          }}
        >
          ←
        </AppButton>

        <div>
          <h1>
            {showSalaryStructureForm
              ? "Add Salary Structure"
              : showGenerateSalaryForm
              ? "Generate Salary"
              : "Salary Management"}
          </h1>

          <p>Manage staff salary and payroll</p>
        </div>
      </div>
      {!showSalaryStructureForm && !showGenerateSalaryForm && (
        <>
          <div className="common-card">
            <div className="list-header">
              <h2>Salary Structure</h2>

              <div className="list-action-buttons">
                <AppButton
                  type="primary"
                  onClick={() =>
                    setShowSalaryStructureForm(true)
                  }
                >
                  + Add Salary Structure
                </AppButton>

                <AppButton
                  type="primary"
                  onClick={handleEditSalaryStructure}
                >
                  Edit
                </AppButton>

                <AppButton
                  type="delete"
                  onClick={handleDeleteSalaryStructure}
                >
                  Delete
                </AppButton>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={
                          salaryStructures.length > 0 &&
                          selectedStructureIds.length ===
                            salaryStructures.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStructureIds(
                              salaryStructures.map((item) => item.id)
                            );
                          } else {
                            setSelectedStructureIds([]);
                          }
                        }}
                      />
                    </th>

                    <th>S.No</th>
                    <th>Employee Code</th>
                    <th>Employee Name</th>
                    <th>Monthly Salary</th>
                    <th>Effective From</th>
                  </tr>
                </thead>

                <tbody>
                  {salaryStructures.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-row">
                        No salary structure found
                      </td>
                    </tr>
                  ) : (
                    salaryStructures.map((item, index) => (
                      <tr key={item.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedStructureIds.includes(item.id)}
                            onChange={() => {
                              setSelectedStructureIds((prev) =>
                                prev.includes(item.id)
                                  ? prev.filter((id) => id !== item.id)
                                  : [...prev, item.id]
                              );
                            }}
                          />
                        </td>

                        <td>{index + 1}</td>
                        <td>{item.employeeCode}</td>
                        <td>{item.employeeName}</td>
                        <td>₹{item.monthlySalary}</td>
                        <td>{item.effectiveFrom}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="common-card">
            <div className="salary-filter-grid">
              <div className="form-group">
                <label>Department</label>

                <select
                  value={filterData.department}
                  onChange={(e) =>
                    setFilterData({
                      ...filterData,
                      department: e.target.value,
                      position: "",
                      employeeId: "",
                    })
                  }
                >
                  <option value="">All Department</option>

                  {schoolDepartments.map((item) => (
                    <option key={item.id} value={item.departmentName}>
                      {item.departmentName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Position</label>

                <select
                  value={filterData.position}
                  onChange={(e) =>
                    setFilterData({
                      ...filterData,
                      position: e.target.value,
                      employeeId: "",
                    })
                  }
                >
                  <option value="">All Position</option>

                  {filterPositions.map((item) => (
                    <option key={item.id} value={item.positionName}>
                      {item.positionName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Employee</label>

                <select
                  value={filterData.employeeId}
                  onChange={(e) =>
                    setFilterData({
                      ...filterData,
                      employeeId: e.target.value,
                    })
                  }
                >
                  <option value="">All Employee</option>

                  {filterEmployees.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.employeeName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Month</label>

                <select
                  value={filterData.month}
                  onChange={(e) =>
                    setFilterData({
                      ...filterData,
                      month: e.target.value,
                    })
                  }
                >
                  <option value="">All Month</option>

                  {months.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Year</label>

                <select
                  value={filterData.year}
                  onChange={(e) =>
                    setFilterData({
                      ...filterData,
                      year: e.target.value,
                    })
                  }
                >
                  <option value="">All Year</option>

                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-actions">
              <AppButton type="primary" onClick={handleSearch}>
                Search
              </AppButton>

              <AppButton
                type="primary"
                onClick={() =>
                  setShowGenerateSalaryForm(true)
                }
              >
                + Generate Salary
              </AppButton>
            </div>
          </div>
          <div className="common-card">
            <div className="list-header">
              <h2>Monthly Salary List</h2>

              <div className="list-action-buttons">
               <AppButton type="primary" onClick={handleViewSlip}>
  View Salary Slip
</AppButton>

<AppButton type="primary" onClick={handlePaySalaryOpen}>
  Pay Salary
</AppButton>

<AppButton type="primary" onClick={handlePrintSalary}>
  Print
</AppButton>

<AppButton
  type="delete"
  onClick={handleDeleteSalary}
>
  Delete
</AppButton>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={
                          filteredSalaryRecords.length > 0 &&
                          selectedSalaryIds.length ===
                            filteredSalaryRecords.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSalaryIds(
                              filteredSalaryRecords.map((item) => item.id)
                            );
                          } else {
                            setSelectedSalaryIds([]);
                          }
                        }}
                      />
                    </th>

                    <th>S.No</th>
                    <th>Employee Code</th>
                    <th>Employee Name</th>
                    <th>Department</th>
                    <th>Month</th>
                    <th>Gross Salary</th>
                    <th>Leave Deduction</th>
                    <th>Net Salary</th>
                    <th>Payment Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSalaryRecords.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="empty-row">
                        No salary record found
                      </td>
                    </tr>
                  ) : (
                    filteredSalaryRecords.map((item, index) => (
                      <tr key={item.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedSalaryIds.includes(item.id)}
                            onChange={() => {
                              setSelectedSalaryIds((prev) =>
                                prev.includes(item.id)
                                  ? prev.filter((id) => id !== item.id)
                                  : [...prev, item.id]
                              );
                            }}
                          />
                        </td>

                        <td>{index + 1}</td>
                        <td>{item.employeeCode}</td>
                        <td>{item.employeeName}</td>
                        <td>{item.department}</td>
                        <td>
                          {item.month} {item.year}
                        </td>
                        <td>₹{item.grossSalary}</td>
                        <td>₹{item.leaveDeduction}</td>
                        <td>₹{item.netSalary}</td>
                        <td>
                          <span
                            className={`salary-status salary-${item.paymentStatus
                              .toLowerCase()
                              .replaceAll(" ", "-")}`}
                          >
                            {item.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showSalaryStructureForm && (
        <div className="common-card">
          <div className="salary-form-grid">
            <div className="form-group">
              <label>Employee Name *</label>

              <select
                value={salaryStructureForm.employeeId}
                onChange={(e) =>
                  setSalaryStructureForm({
                    ...salaryStructureForm,
                    employeeId: e.target.value,
                  })
                }
              >
                <option value="">Select Employee</option>

                {activeStaff.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.employeeName} - {staff.employeeCode}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Monthly Salary *</label>

              <input
                type="number"
                value={salaryStructureForm.monthlySalary}
                onChange={(e) =>
                  setSalaryStructureForm({
                    ...salaryStructureForm,
                    monthlySalary: e.target.value,
                  })
                }
                placeholder="Enter monthly salary"
              />
            </div>

            <div className="form-group">
              <label>Effective From *</label>

              <input
                type="month"
                value={salaryStructureForm.effectiveFrom}
                onChange={(e) =>
                  setSalaryStructureForm({
                    ...salaryStructureForm,
                    effectiveFrom: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="form-actions">
            <AppButton type="primary" onClick={handleSaveSalaryStructure}>
              Save
            </AppButton>

            <AppButton
              type="secondary"
              onClick={() => {
                resetSalaryStructureForm();
                setShowSalaryStructureForm(false);
              }}
            >
              Go Back
            </AppButton>
          </div>
        </div>
      )}
      {showGenerateSalaryForm && (
        <div className="common-card">
          <div className="salary-form-grid">
            <div className="form-group">
              <label>Employee *</label>

              <select
                value={generateSalaryForm.employeeId}
                onChange={(e) =>
                  setGenerateSalaryForm({
                    ...generateSalaryForm,
                    employeeId: e.target.value,
                  })
                }
              >
                <option value="">Select Employee</option>

                {activeStaff.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.employeeName} - {staff.employeeCode}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Month *</label>

              <select
                value={generateSalaryForm.month}
                onChange={(e) =>
                  setGenerateSalaryForm({
                    ...generateSalaryForm,
                    month: e.target.value,
                  })
                }
              >
                <option value="">Select Month</option>

                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Year *</label>

              <select
                value={generateSalaryForm.year}
                onChange={(e) =>
                  setGenerateSalaryForm({
                    ...generateSalaryForm,
                    year: e.target.value,
                  })
                }
              >
                <option value="">Select Year</option>

                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Other Deduction</label>

              <input
                type="number"
                value={generateSalaryForm.otherDeduction}
                onChange={(e) =>
                  setGenerateSalaryForm({
                    ...generateSalaryForm,
                    otherDeduction: e.target.value,
                  })
                }
                placeholder="Enter other deduction"
              />
            </div>
          </div>

          <div className="form-actions">
            <AppButton type="primary" onClick={handleGenerateSalary}>
              Generate
            </AppButton>

            <AppButton
              type="secondary"
              onClick={() => {
                resetGenerateSalaryForm();
                setShowGenerateSalaryForm(false);
              }}
            >
              Go Back
            </AppButton>
          </div>
        </div>
      )}
      {showPaymentPopup && paymentSalary && (
        <div className="popup-overlay">
          <div className="view-popup">
            <div className="popup-head">
              <h2>Pay Salary</h2>

              <button
                className="popup-close-btn"
                onClick={() => {
                  setShowPaymentPopup(false);
                  setPaymentSalary(null);
                  resetPaymentForm();
                }}
              >
                ×
              </button>
            </div>

            <div className="payment-summary-grid">
              <p>
                <strong>Net Salary:</strong> ₹{paymentSalary.netSalary}
              </p>

              <p>
                <strong>Already Paid:</strong> ₹{paymentSalary.paidAmount}
              </p>

              <p>
                <strong>Remaining:</strong> ₹{paymentSalary.remainingAmount}
              </p>
            </div>

            <div className="salary-form-grid">
              <div className="form-group">
                <label>Payment Amount *</label>

                <input
                  type="number"
                  value={paymentForm.paymentAmount}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      paymentAmount: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Payment Date *</label>

                <input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      paymentDate: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Payment Mode *</label>

                <select
                  value={paymentForm.paymentMode}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      paymentMode: e.target.value,
                    })
                  }
                >
                  <option value="">Select Payment Mode</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              {paymentForm.paymentMode === "Bank Transfer" && (
                <>
                  <div className="form-group">
                    <label>Bank Name</label>

                    <input
                      value={paymentForm.bankName}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          bankName: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Transaction Number</label>

                    <input
                      value={paymentForm.transactionNumber}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          transactionNumber: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Transaction Date</label>

                    <input
                      type="date"
                      value={paymentForm.transactionDate}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          transactionDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </>
              )}

              {paymentForm.paymentMode === "UPI" && (
                <>
                  <div className="form-group">
                    <label>UPI App Name</label>

                    <input
                      value={paymentForm.upiAppName}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          upiAppName: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Transaction ID</label>

                    <input
                      value={paymentForm.transactionId}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          transactionId: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Transaction Date</label>

                    <input
                      type="date"
                      value={paymentForm.transactionDate}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          transactionDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </>
              )}

              {paymentForm.paymentMode === "Cheque" && (
                <>
                  <div className="form-group">
                    <label>Cheque Number</label>

                    <input
                      value={paymentForm.chequeNumber}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          chequeNumber: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Issue Date</label>

                    <input
                      type="date"
                      value={paymentForm.issueDate}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          issueDate: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Bank Name</label>

                    <input
                      value={paymentForm.bankName}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          bankName: e.target.value,
                        })
                      }
                    />
                  </div>
                </>
              )}

              <div className="form-group full-width">
                <label>Remarks</label>

                <textarea
                  value={paymentForm.remarks}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      remarks: e.target.value,
                    })
                  }
                ></textarea>
              </div>
            </div>

            <div className="form-actions">
              <AppButton type="primary" onClick={handleSavePayment}>
                Save Payment
              </AppButton>

              <AppButton
                type="secondary"
                onClick={() => {
                  setShowPaymentPopup(false);
                  setPaymentSalary(null);
                  resetPaymentForm();
                }}
              >
                Cancel
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalaryManagement;