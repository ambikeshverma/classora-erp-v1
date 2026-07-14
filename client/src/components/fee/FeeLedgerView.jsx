import React from "react";
import "./FeeLedgerView.css";
import AppButton from "../AppButton";

function FeeLedgerView({
  student = {},
  studentProfile = {},
  session = {},
  route = {},
  receipts = [],
  feeHeads = [],
  monthOptions = [],
  feeRows = [],
  totals = {},
  onClose,
  onPrint,
}) {
  return (
    <div className="popup-overlay">
      <div className="fee-ledger-popup">

        <div className="popup-head">
          <h2>
            Fee Ledger - {student.studentName}
          </h2>

          <button
            className="popup-close-btn"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* Student Information */}

        <div className="ledger-student-info">

          <p>
            <strong>Session :</strong>{" "}
            {session.sessionName}
          </p>

          <p>
            <strong>Class :</strong>{" "}
            {studentProfile.className} -
            {studentProfile.sectionName}
          </p>

          <p>
            <strong>Admission No :</strong>{" "}
            {student.admissionNo}
          </p>

          <p>
            <strong>SR No :</strong>{" "}
            {student.srNo}
          </p>

          <p>
            <strong>Father Name :</strong>{" "}
            {student.fatherName}
          </p>

          <p>
            <strong>Route :</strong>{" "}
            {route?.routeName || "-"}
          </p>

        </div>

        {/* Receipt List */}

        <h3 className="ledger-section-title">
          Fee Receipts
        </h3>

        <div className="table-wrap ledger-table-wrap">

          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Receipt No</th>
                <th>Class</th>
                <th>Installments</th>
                <th>Paid On</th>
                <th>Paid Amount</th>
                <th>Remarks</th>
                <th>Deposit By</th>
                <th>Deposit On</th>
              </tr>
            </thead>

            <tbody>

              {receipts.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="empty-row"
                  >
                    No receipt found
                  </td>
                </tr>
              ) : (
                receipts.map((receipt, index) => (
                  <tr key={receipt.id}>
                    <td>{index + 1}</td>

                    <td>{receipt.receiptNo}</td>

                    <td>
                      {studentProfile.className}{" "}
                      {studentProfile.sectionName}
                    </td>

                    <td>
                      {receipt.months?.join(", ")}
                    </td>

                    <td>
                      {receipt.depositDate}
                    </td>

                    <td>
                      ₹{receipt.paidAmount}
                    </td>

                    <td>
                      {receipt.remarks || "-"}
                    </td>

                    <td>
                      {receipt.collectedByName}
                    </td>

                    <td>
                      {receipt.depositDate}
                    </td>
                  </tr>
                ))
              )}

            </tbody>
          </table>

        </div>

        {/* Fee Schedule */}

        <h3 className="ledger-section-title">
          Fee Schedule
        </h3>

        <div className="ledger-schedule-wrap">

          <table className="ledger-schedule-table">

            <thead>

              <tr>

                <th rowSpan="2">
                  Fee Head
                </th>

                {monthOptions.map((month) => (
                  <th
                    key={month.name}
                    colSpan="3"
                  >
                    {month.short}
                  </th>
                ))}

                <th colSpan="3">
                  Total
                </th>

              </tr>

              <tr>

                {monthOptions.map((month) => (
                  <React.Fragment
                    key={month.name}
                  >
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

              {feeHeads
                .filter((head) =>
                  feeRows.some(
                    (row) =>
                      row.feeHeadId === head.id
                  )
                )
                .map((head) => {
                  let totalFee = 0;
                  let totalPaid = 0;
                  let totalBalance = 0;

                  return (
                    <tr key={head.id}>

                      <td>
                        {head.headName}
                      </td>

                      {monthOptions.map(
                        (month) => {
                          const row =
                            feeRows.find(
                              (item) =>
                                item.monthName ===
                                  month.name &&
                                item.feeHeadId ===
                                  head.id
                            );

                          const fee =
                            row?.fee || 0;

                          const paid =
                            row?.paid || 0;

                          const balance =
                            row?.balance || 0;

                          totalFee += fee;
                          totalPaid += paid;
                          totalBalance +=
                            balance;

                          return (
                            <React.Fragment
                              key={month.name}
                            >
                              <td>{fee}</td>

                              <td className="green-text">
                                {paid}
                              </td>

                              <td className="red-text">
                                {balance}
                              </td>
                            </React.Fragment>
                          );
                        }
                      )}

                      <td>{totalFee}</td>

                      <td className="green-text">
                        {totalPaid}
                      </td>

                      <td className="red-text">
                        {totalBalance}
                      </td>

                    </tr>
                  );
                })}

              <tr className="total-row">

                <td>Total</td>

                {monthOptions.map(
                  (month) => {
                    const monthRows =
                      feeRows.filter(
                        (row) =>
                          row.monthName ===
                          month.name
                      );

                    const fee =
                      monthRows.reduce(
                        (sum, row) =>
                          sum + row.fee,
                        0
                      );

                    const paid =
                      monthRows.reduce(
                        (sum, row) =>
                          sum + row.paid,
                        0
                      );

                    const balance =
                      monthRows.reduce(
                        (sum, row) =>
                          sum +
                          row.balance,
                        0
                      );

                    return (
                      <React.Fragment
                        key={month.name}
                      >
                        <td>{fee}</td>
                        <td>{paid}</td>
                        <td>{balance}</td>
                      </React.Fragment>
                    );
                  }
                )}

                <td>
                  {totals.totalFee}
                </td>

                <td>
                  {totals.totalPaid}
                </td>

                <td>
                  {totals.outstandingBalance}
                </td>

              </tr>

            </tbody>

          </table>

        </div>

        {/* Footer Buttons */}

        <div className="ledger-footer-actions">

          <AppButton
            type="primary"
            onClick={onPrint}
          >
            Print Ledger
          </AppButton>

          <AppButton
            type="secondary"
            onClick={onClose}
          >
            Close
          </AppButton>

        </div>

      </div>
    </div>
  );
}

export default FeeLedgerView;