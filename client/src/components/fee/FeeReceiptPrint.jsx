import React from "react";
import "./FeeReceiptPrint.css";

function FeeReceiptPrint({
  schoolInfo = {},
  receipt = {},
  student = {},
  studentProfile = {},
  showOfficeCopy = true,
}) {
  const renderCopy = (copyType) => (
    <div className="receipt-copy">

      {/* Header */}
      <div className="receipt-school-header">

        <div className="receipt-logo-box">
          {schoolInfo.logo ? (
            <img
              src={schoolInfo.logo}
              alt="School Logo"
            />
          ) : (
            <span>🏫</span>
          )}
        </div>

        <div className="receipt-school-details">
          <h1>{schoolInfo.schoolName}</h1>

          <p>{schoolInfo.address}</p>

          <p>
            {schoolInfo.email}
            {schoolInfo.email &&
            schoolInfo.mobile
              ? " | "
              : ""}
            {schoolInfo.mobile}
          </p>

          <p>{schoolInfo.website}</p>
        </div>
      </div>

      {/* Title Row */}

      <div className="receipt-title-row">

        <div className="copy-type">
          {copyType}
        </div>

        <div className="receipt-title">
          FEE PAYMENT RECEIPT
        </div>

        <div className="receipt-print-time">
          {receipt.printDateTime}
        </div>

      </div>

      {/* Basic Details */}

      <div className="receipt-info-grid">

        <div>
          <p>
            <strong>Session :</strong>{" "}
            {studentProfile.sessionName}
          </p>

          <p>
            <strong>Receipt No :</strong>{" "}
            {receipt.receiptNo}
          </p>

          <p>
            <strong>Admission No :</strong>{" "}
            {student.admissionNo}
          </p>

          <p>
            <strong>Father Name :</strong>{" "}
            {student.fatherName}
          </p>

          <p>
            <strong>SR No :</strong>{" "}
            {student.srNo}
          </p>

          <p>
            <strong>Payment Mode :</strong>{" "}
            {receipt.paymentMode}
          </p>
        </div>

        <div>
          <p>
            <strong>Fee Period :</strong>{" "}
            {receipt.feePeriod}
          </p>

          <p>
            <strong>Rec. Date :</strong>{" "}
            {receipt.receiptDate}
          </p>

          <p>
            <strong>Student Name :</strong>{" "}
            {student.studentName}
          </p>

          <p>
            <strong>Class :</strong>{" "}
            {studentProfile.className} -
            {studentProfile.sectionName}
          </p>

          <p>
            <strong>Route :</strong>{" "}
            {studentProfile.routeName}
          </p>

          <p>
            <strong>Ref No :</strong>{" "}
            {receipt.paymentRef || "-"}
          </p>
        </div>

      </div>

      {/* Table */}

      <table className="receipt-table">
        <thead>
          <tr>
            <th>S.No</th>
            <th>Head Name</th>
            <th>Fee</th>
            <th>Conc.</th>
            <th>Prepaid</th>
            <th>Paid</th>
            <th>Balance</th>
          </tr>
        </thead>

        <tbody>

          {receipt.rows?.map((row, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{row.headName}</td>
              <td>{row.fee}</td>
              <td>{row.concession}</td>
              <td>{row.prepaid}</td>
              <td>{row.paid}</td>
              <td>{row.balance}</td>
            </tr>
          ))}

          <tr className="receipt-total-row">
            <td colSpan="2">
              <strong>Total</strong>
            </td>

            <td>{receipt.totalFee}</td>

            <td>{receipt.totalConcession}</td>

            <td>{receipt.totalPrepaid}</td>

            <td>{receipt.totalPaid}</td>

            <td>{receipt.totalBalance}</td>
          </tr>

        </tbody>
      </table>

      {/* Amount */}

      <div className="receipt-amount-words">
        <strong>Amount In Words :</strong>{" "}
        {receipt.amountInWords}
      </div>

      {/* Remarks */}

      <div className="receipt-remarks">
        <strong>Remarks :</strong>{" "}
        {receipt.remarks || "-"}
      </div>

      {/* Footer */}

      <div className="receipt-footer">

        <div>
          Parent / Depositor
        </div>

        <div>
          This is a computer generated receipt.
        </div>

        <div>
          {receipt.collectedByName}
        </div>

      </div>

    </div>
  );

  return (
    <div className="fee-receipt-container">

      {renderCopy("Student Copy")}

      {showOfficeCopy &&
        renderCopy("Office Copy")}

    </div>
  );
}

export default FeeReceiptPrint;