import React, { useMemo } from "react";
import "./FeeLedgerView.css";
import AppButton from "../AppButton";
import { formatDate } from "../../utils/feeUtils";

function FeeLedgerView({
  student = {},
  profile = {},
  session = "",
  receipts = [],
  periods = [],
  rows = [],
  onClose,
  onPrint,
}) {
  // Fee heads in the order they first appear in the student's fee rows
  const feeHeads = useMemo(() => [...new Set(rows.map((row) => row.feeHeadName))], [rows]);

  const cellFor = (head, periodKey) => {
    const matches = rows.filter((row) => row.feeHeadName === head && row.periodKey === periodKey);
    return {
      fee: matches.reduce((sum, row) => sum + row.fee - row.concession, 0),
      paid: matches.reduce((sum, row) => sum + row.paid, 0),
      balance: matches.reduce((sum, row) => sum + row.balance, 0),
    };
  };

  const sumCells = (cells) =>
    cells.reduce(
      (acc, cell) => ({
        fee: acc.fee + cell.fee,
        paid: acc.paid + cell.paid,
        balance: acc.balance + cell.balance,
      }),
      { fee: 0, paid: 0, balance: 0 }
    );

  const grandTotal = sumCells(rows.map((row) => ({ fee: row.fee - row.concession, paid: row.paid, balance: row.balance })));

  return (
    <div className="popup-overlay">
      <div className="fee-ledger-popup">
        <div className="popup-head">
          <h2>Fee Ledger - {student.studentName}</h2>

          <button className="popup-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="ledger-student-info">
          <p>
            <strong>Session :</strong> {session}
          </p>

          <p>
            <strong>Class :</strong> {[profile.className, profile.section].filter(Boolean).join(" - ") || "-"}
          </p>

          <p>
            <strong>Admission No :</strong> {student.admissionNo || "-"}
          </p>

          <p>
            <strong>SR No :</strong> {student.srNo || "-"}
          </p>

          <p>
            <strong>Father Name :</strong> {student.fatherName || "-"}
          </p>

          <p>
            <strong>Route :</strong> {profile.routeName || "-"}
          </p>
        </div>

        <h3 className="ledger-section-title">Fee Receipts</h3>

        <div className="table-wrap ledger-table-wrap">
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Receipt No</th>
                <th>Class</th>
                <th>Fee Period</th>
                <th>Paid On</th>
                <th>Paid Amount</th>
                <th>Remarks</th>
                <th>Deposit By</th>
              </tr>
            </thead>

            <tbody>
              {receipts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-row">
                    No receipt found
                  </td>
                </tr>
              ) : (
                receipts.map((receipt, index) => (
                  <tr key={receipt.id}>
                    <td>{index + 1}</td>
                    <td>{receipt.receiptNo}</td>
                    <td>{[profile.className, profile.section].filter(Boolean).join(" ") || "-"}</td>
                    <td>{receipt.periods?.join(", ") || "-"}</td>
                    <td>{formatDate(receipt.depositDate)}</td>
                    <td>₹{receipt.paidAmount}</td>
                    <td>{receipt.remarks || "-"}</td>
                    <td>{receipt.collectedByName || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <h3 className="ledger-section-title">Fee Schedule</h3>

        <div className="ledger-schedule-wrap">
          <table className="ledger-schedule-table">
            <thead>
              <tr>
                <th rowSpan="2">Fee Head</th>

                {periods.map((period) => (
                  <th key={period.key} colSpan="3">
                    {period.short}
                  </th>
                ))}

                <th colSpan="3">Total</th>
              </tr>

              <tr>
                {periods.map((period) => (
                  <React.Fragment key={period.key}>
                    <th>Fee</th>
                    <th>Paid</th>
                    <th>Bal</th>
                  </React.Fragment>
                ))}

                <th>Fee</th>
                <th>Paid</th>
                <th>Bal</th>
              </tr>
            </thead>

            <tbody>
              {feeHeads.length === 0 ? (
                <tr>
                  <td colSpan={periods.length * 3 + 4} className="empty-row">
                    No fee schedule available for this session
                  </td>
                </tr>
              ) : (
                <>
                  {feeHeads.map((head) => {
                    const cells = periods.map((period) => cellFor(head, period.key));
                    const total = sumCells(cells);

                    return (
                      <tr key={head}>
                        <td>{head}</td>

                        {cells.map((cell, index) => (
                          <React.Fragment key={periods[index].key}>
                            <td>{cell.fee}</td>
                            <td className="green-text">{cell.paid}</td>
                            <td className="red-text">{cell.balance}</td>
                          </React.Fragment>
                        ))}

                        <td>{total.fee}</td>
                        <td className="green-text">{total.paid}</td>
                        <td className="red-text">{total.balance}</td>
                      </tr>
                    );
                  })}

                  <tr className="total-row">
                    <td>Total</td>

                    {periods.map((period) => {
                      const total = sumCells(feeHeads.map((head) => cellFor(head, period.key)));
                      return (
                        <React.Fragment key={period.key}>
                          <td>{total.fee}</td>
                          <td>{total.paid}</td>
                          <td>{total.balance}</td>
                        </React.Fragment>
                      );
                    })}

                    <td>{grandTotal.fee}</td>
                    <td>{grandTotal.paid}</td>
                    <td>{grandTotal.balance}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        <div className="ledger-footer-actions">
          <AppButton type="primary" onClick={onPrint}>
            Print Ledger
          </AppButton>

          <AppButton type="secondary" onClick={onClose}>
            Close
          </AppButton>
        </div>
      </div>
    </div>
  );
}

export default FeeLedgerView;
