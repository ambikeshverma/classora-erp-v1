import React, { useEffect, useMemo, useState } from "react";
import "./feeDueNotice.css";
import AppButton from "../components/AppButton";
import { SkeletonStats, SkeletonTable } from "../components/Skeleton";
import { feeService } from "../services/api";

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

function FeeDueNotice() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [selectedClass, setSelectedClass] = useState("All");
  const [includePreviousBalance, setIncludePreviousBalance] = useState(true);
  const [minimumBalance, setMinimumBalance] = useState("");

  const [noticeTitle, setNoticeTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [lateFee, setLateFee] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  const [showReport, setShowReport] = useState(false);
  const [selectedDueIds, setSelectedDueIds] = useState([]);
  const [viewStudentMessage, setViewStudentMessage] = useState(null);

  useEffect(() => {
    let active = true;

    feeService
      .getDues()
      .then((res) => {
        if (active) setData(res.data?.data || null);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || "Failed to load fee dues");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const periods = useMemo(() => data?.periods || [], [data]);
  const periodOptions = useMemo(() => periods.map((item) => item.key), [periods]);
  const selectedPeriodKey = selectedPeriod || periodOptions[0] || "";
  const currentSession = data?.session || "";
  const schoolInfo = data?.schoolInfo || {};

  const classOptions = useMemo(
    () => ["All", ...new Set((data?.dues || []).map((item) => item.className).filter(Boolean))].sort((a, b) =>
      a === "All" ? -1 : b === "All" ? 1 : a.localeCompare(b)
    ),
    [data]
  );

  // Previous balance = dues of periods before the selected one; current = dues of the selected period
  const filteredStudents = useMemo(() => {
    const periodIndex = periodOptions.indexOf(selectedPeriodKey);

    return (data?.dues || [])
      .map((student) => {
        const previous = includePreviousBalance
          ? round2(
              periodOptions
                .slice(0, Math.max(periodIndex, 0))
                .reduce((sum, key) => sum + Number(student.periodDue?.[key] || 0), 0)
            )
          : 0;

        const current = round2(student.periodDue?.[selectedPeriodKey] || 0);

        return {
          ...student,
          id: student.studentId,
          sectionName: student.section,
          currentBalance: current,
          calculatedPreviousBalance: previous,
          calculatedBalance: round2(previous + current),
        };
      })
      .filter((student) => {
        const classMatch = selectedClass === "All" ? true : student.className === selectedClass;

        const balanceMatch = minimumBalance
          ? student.calculatedBalance >= Number(minimumBalance)
          : student.calculatedBalance > 0;

        return classMatch && balanceMatch;
      });
  }, [data, periodOptions, selectedPeriodKey, selectedClass, includePreviousBalance, minimumBalance]);

  const totalDueAmount = filteredStudents.reduce((sum, student) => sum + student.calculatedBalance, 0);
  const totalPreviousBalance = filteredStudents.reduce(
    (sum, student) => sum + Number(student.calculatedPreviousBalance || 0),
    0
  );
  const totalCurrentBalance = filteredStudents.reduce((sum, student) => sum + Number(student.currentBalance || 0), 0);
  const totalPaid = filteredStudents.reduce((sum, student) => sum + Number(student.paid || 0), 0);
  const generateStudentMessage = (student) => {
    if (customMessage.trim()) {
      return customMessage;
    }

    const dueDateText = dueDate || "the due date";

    const lateFeeText = lateFee
      ? `\nLate fee of ₹${lateFee} may be charged after the due date.`
      : "";

    return `Dear ${student.studentName},

Your ${student.className} ${selectedPeriodKey} fee of ₹${student.calculatedBalance} is pending.

Please pay the fee before ${dueDateText}.${lateFeeText}

Thank you.`;
  };

  const handleSendNotice = () => {
    if (!selectedPeriodKey) {
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

      {!showReport && loading && (
        <>
          <SkeletonStats count={2} />
          <div className="common-card">
            <SkeletonTable rows={6} columns={9} />
          </div>
        </>
      )}

      {!showReport && !loading && !data && (
        <div className="common-card">
          <div className="empty-row">{error || "Fee dues are not available"}</div>
        </div>
      )}

      {!showReport && !loading && data && (
        <>
          <div className="common-card">
            <div className="fee-filter-grid">
              <div className="form-group">
                <label>Fee Scheme</label>
                <input type="text" value={`${data.schemeType} Scheme`} readOnly />
              </div>

              <div className="form-group">
                <label>Select Period</label>
                <select
                  value={selectedPeriodKey}
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
                  placeholder="Fee Reminder"
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
            <h1>{schoolInfo.schoolName}</h1>
            <p>{schoolInfo.address}</p>
            <p>Fee Due Notice Report</p>
          </div>

          <div className="report-filter-line">
  <div className="report-filter-info">
    <span>Session: {currentSession}</span>
    <span>Fee Scheme: {data?.schemeType} Scheme</span>
    <span>Period: {selectedPeriodKey}</span>
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
