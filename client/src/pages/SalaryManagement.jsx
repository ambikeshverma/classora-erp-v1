import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./salaryManagement.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import SalarySlip from "../components/hr/SalarySlip";
import { hrService } from "../services/api";

const MONTHS = [
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

const PAYMENT_MODES = ["Cash", "Bank Transfer", "UPI", "Cheque"];

const EMPTY_FILTERS = { departmentId: "", positionId: "", employeeId: "", month: "", year: "" };
const EMPTY_STRUCTURE_FORM = { employeeId: "", monthlySalary: "", effectiveFrom: "" };
const EMPTY_GENERATE_FORM = { employeeId: "", month: "", year: "", otherDeduction: "" };
const EMPTY_PAYMENT_FORM = {
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
};

const idOf = (value) => String(value?._id || value || "");

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const formatMonth = (value) => {
  if (!value) return "-";
  const [year, month] = value.split("-");
  return `${MONTHS[Number(month) - 1] || month} ${year}`;
};

function SalaryManagement() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [salaryStructures, setSalaryStructures] = useState([]);
  const [salaryRecords, setSalaryRecords] = useState([]);

  const [showSalaryStructureForm, setShowSalaryStructureForm] = useState(false);
  const [showGenerateSalaryForm, setShowGenerateSalaryForm] = useState(false);
  const [editStructureId, setEditStructureId] = useState(null);

  const [selectedStructureIds, setSelectedStructureIds] = useState([]);
  const [selectedSalaryIds, setSelectedSalaryIds] = useState([]);

  const [filterData, setFilterData] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);

  const [salaryStructureForm, setSalaryStructureForm] = useState(EMPTY_STRUCTURE_FORM);
  const [generateSalaryForm, setGenerateSalaryForm] = useState(EMPTY_GENERATE_FORM);

  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [paymentSalary, setPaymentSalary] = useState(null);
  const [paymentForm, setPaymentForm] = useState(EMPTY_PAYMENT_FORM);

  const [slip, setSlip] = useState(null);

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, index) => String(current - index));
  }, []);

  const loadSetup = useCallback(async () => {
    try {
      setLoading(true);
      const [metaRes, structureRes] = await Promise.all([hrService.getMeta(), hrService.getSalaryStructures()]);

      const meta = metaRes.data?.data || {};
      setDepartments(meta.departments || []);
      setPositions(meta.positions || []);
      setStaffList(meta.staff || []);
      setSalaryStructures(structureRes.data?.data || []);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load salary data");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSalaries = useCallback(async () => {
    try {
      setListLoading(true);

      const params = {};
      if (appliedFilters.departmentId) params.departmentId = appliedFilters.departmentId;
      if (appliedFilters.positionId) params.positionId = appliedFilters.positionId;
      if (appliedFilters.employeeId) params.staffId = appliedFilters.employeeId;
      if (appliedFilters.month) params.month = appliedFilters.month;
      if (appliedFilters.year) params.year = appliedFilters.year;

      const res = await hrService.getSalaries(params);
      setSalaryRecords(res.data?.data || []);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load salary records");
    } finally {
      setListLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    loadSetup();
  }, [loadSetup]);

  useEffect(() => {
    loadSalaries();
  }, [loadSalaries]);

  const filterPositions = positions.filter(
    (item) => !filterData.departmentId || idOf(item.departmentId) === filterData.departmentId
  );

  const filterEmployees = staffList.filter(
    (item) =>
      (!filterData.departmentId || idOf(item.departmentId) === filterData.departmentId) &&
      (!filterData.positionId || idOf(item.positionId) === filterData.positionId)
  );

  const handleSearch = () => {
    setAppliedFilters(filterData);
    setSelectedSalaryIds([]);
  };

  const resetSalaryStructureForm = () => {
    setSalaryStructureForm(EMPTY_STRUCTURE_FORM);
    setEditStructureId(null);
  };

  const resetGenerateSalaryForm = () => setGenerateSalaryForm(EMPTY_GENERATE_FORM);

  const resetPaymentForm = () => setPaymentForm(EMPTY_PAYMENT_FORM);

  const closePaymentPopup = () => {
    setShowPaymentPopup(false);
    setPaymentSalary(null);
    resetPaymentForm();
  };

  /* ---------------- Salary structure ---------------- */
  const handleSaveSalaryStructure = async () => {
    if (!salaryStructureForm.employeeId || !salaryStructureForm.monthlySalary || !salaryStructureForm.effectiveFrom) {
      alert("Please fill all required fields");
      return;
    }

    if (Number(salaryStructureForm.monthlySalary) <= 0) {
      alert("Monthly salary must be greater than zero");
      return;
    }

    try {
      setSaving(true);

      if (editStructureId) {
        await hrService.updateSalaryStructure(editStructureId, {
          monthlySalary: Number(salaryStructureForm.monthlySalary),
          effectiveFrom: salaryStructureForm.effectiveFrom,
        });
        alert("Salary structure updated successfully");
      } else {
        await hrService.createSalaryStructure({
          staffId: salaryStructureForm.employeeId,
          monthlySalary: Number(salaryStructureForm.monthlySalary),
          effectiveFrom: salaryStructureForm.effectiveFrom,
        });
        alert("Salary structure added successfully");
      }

      resetSalaryStructureForm();
      setShowSalaryStructureForm(false);
      await loadSetup();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save salary structure");
    } finally {
      setSaving(false);
    }
  };

  const handleEditSalaryStructure = () => {
    if (selectedStructureIds.length !== 1) {
      alert("Select one salary structure");
      return;
    }

    const selected = salaryStructures.find((item) => item._id === selectedStructureIds[0]);
    if (!selected) return;

    setEditStructureId(selected._id);
    setSalaryStructureForm({
      employeeId: idOf(selected.staffId),
      monthlySalary: selected.monthlySalary,
      effectiveFrom: selected.effectiveFrom,
    });
    setShowSalaryStructureForm(true);
  };

  const handleDeleteSalaryStructure = async () => {
    if (selectedStructureIds.length === 0) {
      alert("Select salary structure");
      return;
    }

    if (!window.confirm("Delete selected salary structure?")) return;

    try {
      setSaving(true);
      await Promise.all(selectedStructureIds.map((id) => hrService.deleteSalaryStructure(id)));
      setSelectedStructureIds([]);
      alert("Salary structure deleted successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete salary structure");
    } finally {
      setSaving(false);
      await loadSetup();
    }
  };

  /* ---------------- Generate salary ---------------- */
  const handleGenerateSalary = async () => {
    if (!generateSalaryForm.employeeId || !generateSalaryForm.month || !generateSalaryForm.year) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setSaving(true);
      await hrService.generateSalary({
        staffId: generateSalaryForm.employeeId,
        month: generateSalaryForm.month,
        year: generateSalaryForm.year,
        otherDeduction: Number(generateSalaryForm.otherDeduction || 0),
      });

      alert("Salary generated successfully");
      resetGenerateSalaryForm();
      setShowGenerateSalaryForm(false);
      await loadSalaries();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to generate salary");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- Payment ---------------- */
  const selectedSalary = () => {
    if (selectedSalaryIds.length !== 1) {
      alert("Select one salary record");
      return null;
    }

    return salaryRecords.find((item) => item._id === selectedSalaryIds[0]) || null;
  };

  const handlePaySalaryOpen = () => {
    const selected = selectedSalary();
    if (!selected) return;

    if (selected.remainingAmount <= 0) {
      alert("This salary is already fully paid");
      return;
    }

    setPaymentSalary(selected);
    resetPaymentForm();
    setShowPaymentPopup(true);
  };

  const handleSavePayment = async () => {
    if (!paymentForm.paymentAmount || !paymentForm.paymentDate || !paymentForm.paymentMode) {
      alert("Please fill required payment fields");
      return;
    }

    const amount = Number(paymentForm.paymentAmount);

    if (!(amount > 0)) {
      alert("Enter valid payment amount");
      return;
    }

    if (amount > paymentSalary.remainingAmount) {
      alert("Payment amount cannot be greater than remaining amount");
      return;
    }

    try {
      setSaving(true);
      await hrService.paySalary(paymentSalary._id, { ...paymentForm, paymentAmount: amount });

      closePaymentPopup();
      alert("Payment updated successfully");
      await loadSalaries();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save payment");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSalary = async () => {
    if (selectedSalaryIds.length === 0) {
      alert("Select salary record");
      return;
    }

    if (!window.confirm("Delete selected salary record?")) return;

    try {
      setSaving(true);
      await Promise.all(selectedSalaryIds.map((id) => hrService.deleteSalary(id)));
      setSelectedSalaryIds([]);
      alert("Salary record deleted");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete salary record");
    } finally {
      setSaving(false);
      await loadSalaries();
    }
  };

  /* ---------------- Salary slip ---------------- */
  const openSlip = async (autoPrint) => {
    const selected = selectedSalary();
    if (!selected) return;

    try {
      setSaving(true);
      const res = await hrService.getSalary(selected._id);
      setSlip({ data: res.data?.data, autoPrint });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load salary slip");
    } finally {
      setSaving(false);
    }
  };

  const updatePaymentForm = (name, value) => setPaymentForm({ ...paymentForm, [name]: value });

  const renderPaymentField = (name, label, type = "text") => (
    <div className="form-group">
      <label>{label}</label>

      <input type={type} value={paymentForm[name]} onChange={(e) => updatePaymentForm(name, e.target.value)} />
    </div>
  );

  const renderEmployeeOptions = () =>
    staffList.map((staff) => (
      <option key={staff._id} value={staff._id}>
        {staff.employeeName} - {staff.employeeCode}
      </option>
    ));

  const noEmployeeNote = !loading && staffList.length === 0 && (
    <p className="empty-row">No working staff available. Add staff in Staff Management first.</p>
  );

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
              navigate("/staff-control");
            }
          }}
        >
          ←
        </AppButton>

        <div>
          <h1>
            {showSalaryStructureForm
              ? editStructureId
                ? "Edit Salary Structure"
                : "Add Salary Structure"
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
                <AppButton type="primary" onClick={() => setShowSalaryStructureForm(true)}>
                  + Add Salary Structure
                </AppButton>

                <AppButton type="primary" onClick={handleEditSalaryStructure} disabled={saving}>
                  Edit
                </AppButton>

                <AppButton type="delete" onClick={handleDeleteSalaryStructure} disabled={saving}>
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
                        checked={salaryStructures.length > 0 && selectedStructureIds.length === salaryStructures.length}
                        onChange={(e) =>
                          setSelectedStructureIds(e.target.checked ? salaryStructures.map((item) => item._id) : [])
                        }
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
                  {loading ? (
                    <tr>
                      <td colSpan="6" style={{ padding: "4px 0", border: "none" }}>
                        <SkeletonTable rows={3} columns={6} />
                      </td>
                    </tr>
                  ) : salaryStructures.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-row">
                        No salary structure found
                      </td>
                    </tr>
                  ) : (
                    salaryStructures.map((item, index) => (
                      <tr key={item._id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedStructureIds.includes(item._id)}
                            onChange={() =>
                              setSelectedStructureIds((prev) =>
                                prev.includes(item._id) ? prev.filter((id) => id !== item._id) : [...prev, item._id]
                              )
                            }
                          />
                        </td>

                        <td>{index + 1}</td>
                        <td>{item.employeeCode}</td>
                        <td>{item.employeeName}</td>
                        <td>{money(item.monthlySalary)}</td>
                        <td>{formatMonth(item.effectiveFrom)}</td>
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
                  value={filterData.departmentId}
                  onChange={(e) =>
                    setFilterData({ ...filterData, departmentId: e.target.value, positionId: "", employeeId: "" })
                  }
                >
                  <option value="">All Department</option>

                  {departments.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.departmentName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Position</label>

                <select
                  value={filterData.positionId}
                  onChange={(e) => setFilterData({ ...filterData, positionId: e.target.value, employeeId: "" })}
                >
                  <option value="">All Position</option>

                  {filterPositions.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.positionName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Employee</label>

                <select
                  value={filterData.employeeId}
                  onChange={(e) => setFilterData({ ...filterData, employeeId: e.target.value })}
                >
                  <option value="">All Employee</option>

                  {filterEmployees.map((staff) => (
                    <option key={staff._id} value={staff._id}>
                      {staff.employeeName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Month</label>

                <select value={filterData.month} onChange={(e) => setFilterData({ ...filterData, month: e.target.value })}>
                  <option value="">All Month</option>

                  {MONTHS.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Year</label>

                <select value={filterData.year} onChange={(e) => setFilterData({ ...filterData, year: e.target.value })}>
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

              <AppButton type="primary" onClick={() => setShowGenerateSalaryForm(true)}>
                + Generate Salary
              </AppButton>
            </div>
          </div>

          <div className="common-card">
            <div className="list-header">
              <h2>Monthly Salary List</h2>

              <div className="list-action-buttons">
                <AppButton type="primary" onClick={() => openSlip(false)} disabled={saving}>
                  View Salary Slip
                </AppButton>

                <AppButton type="primary" onClick={handlePaySalaryOpen} disabled={saving}>
                  Pay Salary
                </AppButton>

                <AppButton type="primary" onClick={() => openSlip(true)} disabled={saving}>
                  Print
                </AppButton>

                <AppButton type="delete" onClick={handleDeleteSalary} disabled={saving}>
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
                        checked={salaryRecords.length > 0 && selectedSalaryIds.length === salaryRecords.length}
                        onChange={(e) =>
                          setSelectedSalaryIds(e.target.checked ? salaryRecords.map((item) => item._id) : [])
                        }
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
                  {listLoading ? (
                    <tr>
                      <td colSpan="10" style={{ padding: "4px 0", border: "none" }}>
                        <SkeletonTable rows={5} columns={10} />
                      </td>
                    </tr>
                  ) : salaryRecords.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="empty-row">
                        No salary record found
                      </td>
                    </tr>
                  ) : (
                    salaryRecords.map((item, index) => (
                      <tr key={item._id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedSalaryIds.includes(item._id)}
                            onChange={() =>
                              setSelectedSalaryIds((prev) =>
                                prev.includes(item._id) ? prev.filter((id) => id !== item._id) : [...prev, item._id]
                              )
                            }
                          />
                        </td>

                        <td>{index + 1}</td>
                        <td>{item.employeeCode}</td>
                        <td>{item.employeeName}</td>
                        <td>{item.department || "-"}</td>
                        <td>
                          {item.month} {item.year}
                        </td>
                        <td>{money(item.grossSalary)}</td>
                        <td>{money(item.leaveDeduction)}</td>
                        <td>{money(item.netSalary)}</td>
                        <td>
                          <span className={`salary-status salary-${item.paymentStatus.toLowerCase().replaceAll(" ", "-")}`}>
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
                disabled={Boolean(editStructureId)}
                onChange={(e) => setSalaryStructureForm({ ...salaryStructureForm, employeeId: e.target.value })}
              >
                <option value="">Select Employee</option>

                {editStructureId
                  ? salaryStructures
                      .filter((item) => idOf(item.staffId) === salaryStructureForm.employeeId)
                      .map((item) => (
                        <option key={item._id} value={idOf(item.staffId)}>
                          {item.employeeName} - {item.employeeCode}
                        </option>
                      ))
                  : renderEmployeeOptions()}
              </select>
            </div>

            <div className="form-group">
              <label>Monthly Salary *</label>

              <input
                type="number"
                min="0"
                value={salaryStructureForm.monthlySalary}
                onChange={(e) => setSalaryStructureForm({ ...salaryStructureForm, monthlySalary: e.target.value })}
                placeholder="Enter monthly salary"
              />
            </div>

            <div className="form-group">
              <label>Effective From *</label>

              <input
                type="month"
                value={salaryStructureForm.effectiveFrom}
                onChange={(e) => setSalaryStructureForm({ ...salaryStructureForm, effectiveFrom: e.target.value })}
              />
            </div>
          </div>

          {noEmployeeNote}

          <div className="form-actions">
            <AppButton type="primary" onClick={handleSaveSalaryStructure} disabled={saving}>
              {saving ? "Saving..." : editStructureId ? "Update" : "Save"}
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
                onChange={(e) => setGenerateSalaryForm({ ...generateSalaryForm, employeeId: e.target.value })}
              >
                <option value="">Select Employee</option>
                {renderEmployeeOptions()}
              </select>
            </div>

            <div className="form-group">
              <label>Month *</label>

              <select
                value={generateSalaryForm.month}
                onChange={(e) => setGenerateSalaryForm({ ...generateSalaryForm, month: e.target.value })}
              >
                <option value="">Select Month</option>

                {MONTHS.map((month) => (
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
                onChange={(e) => setGenerateSalaryForm({ ...generateSalaryForm, year: e.target.value })}
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
                min="0"
                value={generateSalaryForm.otherDeduction}
                onChange={(e) => setGenerateSalaryForm({ ...generateSalaryForm, otherDeduction: e.target.value })}
                placeholder="Enter other deduction"
              />
            </div>
          </div>

          {noEmployeeNote}

          <div className="form-actions">
            <AppButton type="primary" onClick={handleGenerateSalary} disabled={saving}>
              {saving ? "Generating..." : "Generate"}
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

              <button className="popup-close-btn" onClick={closePaymentPopup}>
                ×
              </button>
            </div>

            <div className="payment-summary-grid">
              <p>
                <strong>Net Salary:</strong> {money(paymentSalary.netSalary)}
              </p>

              <p>
                <strong>Already Paid:</strong> {money(paymentSalary.paidAmount)}
              </p>

              <p>
                <strong>Remaining:</strong> {money(paymentSalary.remainingAmount)}
              </p>
            </div>

            <div className="salary-form-grid">
              {renderPaymentField("paymentAmount", "Payment Amount *", "number")}
              {renderPaymentField("paymentDate", "Payment Date *", "date")}

              <div className="form-group">
                <label>Payment Mode *</label>

                <select value={paymentForm.paymentMode} onChange={(e) => updatePaymentForm("paymentMode", e.target.value)}>
                  <option value="">Select Payment Mode</option>

                  {PAYMENT_MODES.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </div>

              {paymentForm.paymentMode === "Bank Transfer" && (
                <>
                  {renderPaymentField("bankName", "Bank Name")}
                  {renderPaymentField("transactionNumber", "Transaction Number")}
                  {renderPaymentField("transactionDate", "Transaction Date", "date")}
                </>
              )}

              {paymentForm.paymentMode === "UPI" && (
                <>
                  {renderPaymentField("upiAppName", "UPI App Name")}
                  {renderPaymentField("transactionId", "Transaction ID")}
                  {renderPaymentField("transactionDate", "Transaction Date", "date")}
                </>
              )}

              {paymentForm.paymentMode === "Cheque" && (
                <>
                  {renderPaymentField("chequeNumber", "Cheque Number")}
                  {renderPaymentField("issueDate", "Issue Date", "date")}
                  {renderPaymentField("bankName", "Bank Name")}
                </>
              )}

              <div className="form-group full-width">
                <label>Remarks</label>

                <textarea value={paymentForm.remarks} onChange={(e) => updatePaymentForm("remarks", e.target.value)}></textarea>
              </div>
            </div>

            <div className="form-actions">
              <AppButton type="primary" onClick={handleSavePayment} disabled={saving}>
                {saving ? "Saving..." : "Save Payment"}
              </AppButton>

              <AppButton type="secondary" onClick={closePaymentPopup}>
                Cancel
              </AppButton>
            </div>
          </div>
        </div>
      )}

      {slip && <SalarySlip salary={slip.data} autoPrint={slip.autoPrint} onClose={() => setSlip(null)} />}
    </div>
  );
}

export default SalaryManagement;
