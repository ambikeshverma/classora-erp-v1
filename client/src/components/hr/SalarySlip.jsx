import React, { useEffect } from "react";
import "./SalarySlip.css";
import AppButton from "../AppButton";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const formatDate = (value) => (value ? String(value).slice(0, 10).split("-").reverse().join("-") : "-");

function SalarySlip({ salary, autoPrint = false, onClose }) {
  useEffect(() => {
    if (!autoPrint) return undefined;

    const timer = setTimeout(() => window.print(), 300);
    return () => clearTimeout(timer);
  }, [autoPrint]);

  if (!salary) return null;

  const school = salary.school || {};
  const payments = salary.payments || [];

  return (
    <div className="salary-slip-overlay">
      <div className="salary-slip-box">
        <div className="salary-slip-actions">
          <AppButton type="primary" onClick={() => window.print()}>
            Print
          </AppButton>

          <AppButton type="secondary" onClick={onClose}>
            Close
          </AppButton>
        </div>

        <div className="salary-slip-sheet">
          <div className="salary-slip-header">
            {school.logo && <img src={school.logo} alt="School Logo" />}

            <div>
              <h1>{school.schoolName}</h1>
              <p>{school.address}</p>
              <p>
                {[school.phone, school.email, school.website].filter(Boolean).join(" | ")}
              </p>
            </div>
          </div>

          <h2 className="salary-slip-title">
            SALARY SLIP - {salary.month} {salary.year}
          </h2>

          <div className="salary-slip-info">
            <p>
              <strong>Employee Name:</strong> {salary.employeeName}
            </p>
            <p>
              <strong>Employee Code:</strong> {salary.employeeCode}
            </p>
            <p>
              <strong>Department:</strong> {salary.department || "-"}
            </p>
            <p>
              <strong>Position:</strong> {salary.position || "-"}
            </p>
            <p>
              <strong>Session:</strong> {salary.session || "-"}
            </p>
            <p>
              <strong>Payment Status:</strong> {salary.paymentStatus}
            </p>
          </div>

          <table className="salary-slip-table">
            <tbody>
              <tr>
                <td>Gross Salary</td>
                <td>{money(salary.grossSalary)}</td>
              </tr>
              <tr>
                <td>
                  Leave Deduction ({salary.deductibleLeave} day(s) of {salary.totalLeave} leave day(s),{" "}
                  {salary.paidLeave} paid)
                </td>
                <td>- {money(salary.leaveDeduction)}</td>
              </tr>
              <tr>
                <td>Other Deduction</td>
                <td>- {money(salary.otherDeduction)}</td>
              </tr>
              <tr className="salary-slip-total">
                <td>Net Salary</td>
                <td>{money(salary.netSalary)}</td>
              </tr>
              <tr>
                <td>Paid Amount</td>
                <td>{money(salary.paidAmount)}</td>
              </tr>
              <tr>
                <td>Remaining Amount</td>
                <td>{money(salary.remainingAmount)}</td>
              </tr>
            </tbody>
          </table>

          <h3 className="salary-slip-subtitle">Payment History</h3>

          <table className="salary-slip-table salary-slip-payments">
            <thead>
              <tr>
                <th>Date</th>
                <th>Mode</th>
                <th>Reference</th>
                <th>Amount</th>
              </tr>
            </thead>

            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="4" className="salary-slip-empty">
                    No payment made yet
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment._id}>
                    <td>{formatDate(payment.paymentDate)}</td>
                    <td>{payment.paymentMode}</td>
                    <td>
                      {payment.transactionNumber || payment.transactionId || payment.chequeNumber || "-"}
                    </td>
                    <td>{money(payment.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <p className="salary-slip-footer">This is a computer generated salary slip.</p>
        </div>
      </div>
    </div>
  );
}

export default SalarySlip;
