import React, { useMemo, useState } from "react";
import "./feeDueNotice.css";
import AppButton from "../components/AppButton";

function FeeDueNotice() {
  const currentSession = "2026-2027";

  const defaultFeeScheme = {
    id: 1,
    schemeName: "Monthly Scheme",
    paymentType: "Monthly",
  };

  const periodOptionsByType = {
    Monthly: [
      "APR", "MAY", "JUN", "JUL", "AUG", "SEP",
      "OCT", "NOV", "DEC", "JAN", "FEB", "MAR",
    ],
    Quarterly: ["Quarter 1", "Quarter 2", "Quarter 3", "Quarter 4"],
    Installment: ["Installment 1", "Installment 2", "Installment 3"],
    Annual: ["Annual Fee"],
  };

  const classOptions = [
    "All",
    "Class 1",
    "Class 2",
    "Class 3",
    "Class 4",
    "Class 5",
    "Class 6",
  ];

  const demoStudents = [
    {
      id: 1,
      srNo: "SR001",
      studentName: "Rahul Kumar",
      fatherName: "Sunil Kumar",
      className: "Class 6",
      sectionName: "A",
      mobile: "9876543210",
      previousBalance: 500,
      currentBalance: 2500,
      paid: 1000,
    },
    {
      id: 2,
      srNo: "SR002",
      studentName: "Priya Singh",
      fatherName: "Dinesh Singh",
      className: "Class 6",
      sectionName: "B",
      mobile: "9876543211",
      previousBalance: 0,
      currentBalance: 2500,
      paid: 500,
    },
    {
      id: 3,
      srNo: "SR003",
      studentName: "Aman Verma",
      fatherName: "Rakesh Verma",
      className: "Class 5",
      sectionName: "A",
      mobile: "9876543212",
      previousBalance: 800,
      currentBalance: 2200,
      paid: 0,
    },
  ];

  const [selectedPeriod, setSelectedPeriod] = useState(
    periodOptionsByType[defaultFeeScheme.paymentType][0]
  );

  const [selectedClass, setSelectedClass] = useState("All");
  const [includePreviousBalance, setIncludePreviousBalance] = useState(true);
  const [minimumBalance, setMinimumBalance] = useState("");

  const [noticeTitle, setNoticeTitle] = useState("Monthly Fee Reminder");
  const [dueDate, setDueDate] = useState("");
  const [lateFee, setLateFee] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  const [showReport, setShowReport] = useState(false);
  const [selectedDueIds, setSelectedDueIds] = useState([]);
  const [viewStudentMessage, setViewStudentMessage] = useState(null);

  const periodOptions =
    periodOptionsByType[defaultFeeScheme.paymentType] || [];

  const filteredStudents = useMemo(() => {
    return demoStudents
      .map((student) => {
        const previous = includePreviousBalance
          ? Number(student.previousBalance || 0)
          : 0;

        const current = Number(student.currentBalance || 0);
        const paid = Number(student.paid || 0);

        const balance = Math.max(previous + current - paid, 0);

        return {
          ...student,
          calculatedPreviousBalance: previous,
          calculatedBalance: balance,
        };
      })
      .filter((student) => {
        const classMatch =
          selectedClass === "All"
            ? true
            : student.className === selectedClass;

        const balanceMatch = minimumBalance
          ? student.calculatedBalance >= Number(minimumBalance)
          : student.calculatedBalance > 0;

        return classMatch && balanceMatch;
      });
  }, [selectedClass, includePreviousBalance, minimumBalance]);

  const totalDueAmount = filteredStudents.reduce(
    (sum, student) => sum + student.calculatedBalance,
    0
  );
const totalPreviousBalance = filteredStudents.reduce(
  (sum, student) =>
    sum +
    Number(
      student.calculatedPreviousBalance || 0
    ),
  0
);

const totalCurrentBalance = filteredStudents.reduce(
  (sum, student) =>
    sum +
    Number(
      student.currentBalance || 0
    ),
  0
);

const totalPaid = filteredStudents.reduce(
  (sum, student) =>
    sum +
    Number(student.paid || 0),
  0
);
  const generateStudentMessage = (student) => {
    if (customMessage.trim()) {
      return customMessage;
    }

    const dueDateText = dueDate || "the due date";

    const lateFeeText = lateFee
      ? `\nLate fee of ₹${lateFee} may be charged after the due date.`
      : "";

    return `Dear ${student.studentName},

Your ${student.className} ${selectedPeriod} fee of ₹${student.calculatedBalance} is pending.

Please pay the fee before ${dueDateText}.${lateFeeText}

Thank you.`;
  };

  const handleSendNotice = () => {
    if (!selectedPeriod) {
      alert("Select fee period");
      return;
    }

    if (!dueDate) {
      alert("Select due date");
      return;
    }

    if (filteredStudents.length === 0) {
      alert("No due student found");
      return;
    }

    alert("Fee due notice generated successfully for selected students");
  };

  const handlePrintReport = () => {
    if (filteredStudents.length === 0) {
      alert("No data found for print");
      return;
    }

    setShowReport(true);
  };

  return (
    <div className="fee-due-notice-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => (window.location.href = "/student-app-access")}
        >
          ←
        </AppButton>

        <div>
          <h1>Fee Due Notice</h1>
          <p>Manage student app fee reminders</p>
        </div>
      </div>

      {!showReport && (
        <>
          <div className="common-card">
            <div className="fee-filter-grid">
              <div className="form-group">
                <label>Fee Scheme</label>
                <input type="text" value={defaultFeeScheme.schemeName} readOnly />
              </div>

              <div className="form-group">
                <label>Select Period</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                >
                  {periodOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Select Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  {classOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Balance More Or Equal</label>

                <input
                  type="number"
                  placeholder="Enter amount"
                  value={minimumBalance}
                  onChange={(e) => setMinimumBalance(e.target.value)}
                />
              </div>
            <div className="form-group checkbox-last-field">

  <div className="inline-checkbox">

    <input
      type="checkbox"
      className="previous-balance-checkbox"
      checked={includePreviousBalance}
      onChange={(e) =>
        setIncludePreviousBalance(e.target.checked)
      }
    />

    <label>
      Include Previous Balance
    </label>

  </div>

</div>
            
            </div>
          </div>

          <div className="note-summary-card">
            <div className="note-summary-item">
              <h3>No Of Students</h3>
              <p>{filteredStudents.length}</p>
            </div>

            <div className="note-summary-item">
              <h3>Total Due Amount</h3>
              <p>₹{totalDueAmount}</p>
            </div>
          </div>

          <div className="common-card">
            <div className="action-header">
              <div>
                <h2>Message Builder</h2>
                <p>Configure fee reminder message</p>
              </div>

              <div className="list-action-buttons">
                <AppButton type="print" onClick={handlePrintReport}>
                  Report
                </AppButton>

                <AppButton type="primary" onClick={handleSendNotice}>
                  Send Notice
                </AppButton>
              </div>
            </div>

            <div className="message-builder-grid">
              <div className="form-group">
                <label>Notice Title</label>

                <input
                  type="text"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Due Date</label>

                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Late Fee</label>

                <input
                  type="number"
                  placeholder="Enter late fee"
                  value={lateFee}
                  onChange={(e) => setLateFee(e.target.value)}
                />
              </div>

              <div className="form-group fee-message-box">
                <label>Message (Optional)</label>

                <textarea
                  placeholder="Leave blank for auto generated message"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                ></textarea>
              </div>
            </div>
          </div>

          <div className="common-card">
            <div className="list-header">
              <h2>Filtered Due Students</h2>

              <div className="list-action-buttons">
                <AppButton
                  type="view"
                  onClick={() => {
                    if (selectedDueIds.length !== 1) {
                      alert("Select one student");
                      return;
                    }

                    const selected = filteredStudents.find(
                      (item) => item.id === selectedDueIds[0]
                    );

                    setViewStudentMessage(selected);
                  }}
                >
                  View
                </AppButton>
              </div>
            </div>

            <div className="table-wrap">
              <table className="due-student-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={
                          filteredStudents.length > 0 &&
                          selectedDueIds.length === filteredStudents.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDueIds(
                              filteredStudents.map((item) => item.id)
                            );
                          } else {
                            setSelectedDueIds([]);
                          }
                        }}
                      />
                    </th>
                    <th>Class</th>
                    <th>Section</th>
                    <th>Student Name</th>
                    <th>Father Name</th>
                    <th>Previous Balance</th>
                    <th>Current Balance</th>
                    <th>Paid</th>
                    <th>Balance</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="empty-row">
                        No due student found
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr key={student.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedDueIds.includes(student.id)}
                            onChange={() => {
                              setSelectedDueIds((prev) =>
                                prev.includes(student.id)
                                  ? prev.filter((id) => id !== student.id)
                                  : [...prev, student.id]
                              );
                            }}
                          />
                        </td>

                        <td>{student.className}</td>
                        <td>{student.sectionName}</td>
                        <td>{student.studentName}</td>
                        <td>{student.fatherName}</td>
                        <td>₹{student.calculatedPreviousBalance}</td>
                        <td>₹{student.currentBalance}</td>
                        <td>₹{student.paid}</td>
                        <td className="balance-column">
                          ₹{student.calculatedBalance}
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

      {showReport && (
        <div className="print-report-layout">
          <div className="print-report-header">
            <h1>CHANDRA SHEKHAR AZAD INTER COLLEGE</h1>
            <p>Rasauli, Barabanki</p>
            <p>Fee Due Notice Report</p>
          </div>

          <div className="report-filter-line">
  <div className="report-filter-info">
    <span>Session: {currentSession}</span>
    <span>Fee Scheme: {defaultFeeScheme.schemeName}</span>
    <span>Period: {selectedPeriod}</span>
    <span>Class: {selectedClass}</span>
  </div>

  <button
    className="report-print-icon"
    onClick={() => window.print()}
    title="Print Report"
  >
    🖨️
  </button>
</div>

          <div className="table-wrap">
            <table className="print-report-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Class</th>
                  <th>SR No</th>
                  <th>Student Name</th>
                  <th>Father Name</th>
                  <th>Mobile No</th>
                  <th>Previous Balance</th>
                  <th>Current Balance</th>
                  <th>Paid</th>
                  <th>Balance</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((student, index) => (
                  <tr key={student.id}>
                    <td>{index + 1}</td>
                    <td>{student.className}</td>
                    <td>{student.srNo}</td>
                    <td>{student.studentName}</td>
                    <td>{student.fatherName}</td>
                    <td>{student.mobile}</td>
                    <td>₹{student.calculatedPreviousBalance}</td>
                    <td>₹{student.currentBalance}</td>
                    <td>₹{student.paid}</td>
                    <td className="balance-column">
                      ₹{student.calculatedBalance}
                    </td>
                  </tr>
                ))}

                <tr className="final-total-row">

  <td colSpan="6">
    Grand Total
  </td>

  <td>
    ₹{totalPreviousBalance}
  </td>

  <td>
    ₹{totalCurrentBalance}
  </td>

  <td>
    ₹{totalPaid}
  </td>

  <td className="balance-column">
    ₹{totalDueAmount}
  </td>

</tr>
              </tbody>
            </table>
          </div>

          <div className="report-bottom-actions">
            <AppButton type="secondary" onClick={() => setShowReport(false)}>
              Back
            </AppButton>
          </div>
        </div>
      )}

      {viewStudentMessage && (
        <div className="popup-overlay">
          <div className="view-popup">
            <div className="popup-head">
              <h2>Student Message Preview</h2>

              <button
                className="popup-close-btn"
                onClick={() => setViewStudentMessage(null)}
              >
                ×
              </button>
            </div>

            <div className="message-view-box">
              <p>
                <strong>Student:</strong> {viewStudentMessage.studentName}
              </p>

              <p>
                <strong>Class:</strong> {viewStudentMessage.className}
              </p>

              <p>
                <strong>Balance:</strong> ₹{viewStudentMessage.calculatedBalance}
              </p>

              <div className="final-message-preview">
                <pre>{generateStudentMessage(viewStudentMessage)}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeeDueNotice;