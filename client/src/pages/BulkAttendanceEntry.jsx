import React, { useMemo, useState } from "react";
import "./bulkAttendanceEntry.css";
import AppButton from "../components/AppButton";

function BulkAttendanceEntry() {
  const today = new Date().toISOString().split("T")[0];
  const formatDisplayDate = (dateValue) =>
  new Date(dateValue).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedClassSection, setSelectedClassSection] = useState("");
  const [openStatusFor, setOpenStatusFor] = useState(null);
  const [isExistingRecord, setIsExistingRecord] = useState(false);

  const statusOptions = ["P", "A", "L", "W", "H"];

  const classSections = [
    { id: "10-A", label: "10 (A)" },
    { id: "10-B", label: "10 (B)" },
    { id: "11-SCI", label: "11 (Science)" },
    { id: "12-HUM", label: "12 (Humanities)" },
  ];

  const closedDates = [
    // Dashboard Academic Calendar se backend se aayega
    // { date: "2026-05-31", reason: "Holiday" },
  ];

  const selectedClosedDate = closedDates.find(
    (item) => item.date === selectedDate
  );

  const [students, setStudents] = useState([
    {
      id: 1,
      rollNo: "001",
      name: "Ankit Verma",
      fatherName: "Rajesh Verma",
      mobile: "9876543210",
      photo: "",
      status: "NA",
    },
    {
      id: 2,
      rollNo: "002",
      name: "Rahul Singh",
      fatherName: "Manoj Singh",
      mobile: "9876543211",
      photo: "",
      status: "NA",
    },
    {
      id: 3,
      rollNo: "003",
      name: "Aman Gupta",
      fatherName: "Suresh Gupta",
      mobile: "9876543212",
      photo: "",
      status: "NA",
    },
  ]);

  const summary = useMemo(() => {
    const total = students.length;
    const present = students.filter((s) => s.status === "P").length;
    const absent = students.filter((s) => s.status === "A").length;
    const leave = students.filter((s) => s.status === "L").length;
    const na = students.filter((s) => s.status === "NA").length;
    const percent = total ? Math.round((present / total) * 100) : 0;

    return { total, present, absent, leave, na, percent };
  }, [students]);

  const getInitials = (name) =>
    name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const loadAttendance = () => {
    if (!selectedDate) {
      alert("Please select date");
      return;
    }

    if (!selectedClassSection) {
      alert("Please select class");
      return;
    }

    if (selectedDate > today) {
      alert("Future date is not allowed");
      return;
    }

    /*
      Backend logic:
      1. Check selectedDate + classSection + schoolId attendance record
      2. If found -> load saved status and setIsExistingRecord(true)
      3. If not found -> all students NA and setIsExistingRecord(false)
    */

    const demoExistingRecord = false;

    if (demoExistingRecord) {
      setStudents((prev) =>
        prev.map((student, index) => ({
          ...student,
          status: index === 0 ? "P" : index === 1 ? "A" : "L",
        }))
      );

      setIsExistingRecord(true);
    } else {
      setStudents((prev) =>
        prev.map((student) => ({
          ...student,
          status: "NA",
        }))
      );

      setIsExistingRecord(false);
    }
  };

  const applyBulkStatus = (status) => {
    if (!status || selectedClosedDate) return;

    setStudents((prev) =>
      prev.map((student) => ({
        ...student,
        status,
      }))
    );

    setOpenStatusFor(null);
  };

  const updateStudentStatus = (studentId, status) => {
    if (selectedClosedDate) return;

    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId ? { ...student, status } : student
      )
    );

    setOpenStatusFor(null);
  };

  const saveAttendance = () => {
    if (!selectedDate) {
      alert("Please select date");
      return;
    }

    if (selectedDate > today) {
      alert("Future date is not allowed");
      return;
    }

    if (selectedClosedDate) {
      alert("Selected date is marked as school closed. Attendance cannot be saved.");
      return;
    }

    if (!selectedClassSection) {
      alert("Please select class");
      return;
    }

    if (summary.na > 0) {
      alert(
        `${summary.na} student(s) are still marked as NA. Please complete attendance first.`
      );
      return;
    }

    alert(
      isExistingRecord
        ? "Attendance updated successfully"
        : "Attendance saved successfully"
    );

    setIsExistingRecord(true);
  };

  return (
    <div className="bulk-attendance-page">
      <div className="common-page-header attendance-header-row">
        <div className="attendance-header-left">
          <AppButton
            type="back"
            onClick={() => {
              window.location.href = "/attendance-system";
            }}
          >
            ←
          </AppButton>

          <div>
            <h1>Bulk Attendance Entry</h1>
            <p>Fill or correct student attendance for selected date</p>
          </div>
        </div>

        <div className="attendance-header-date">
  📅 {formatDisplayDate(selectedDate)}
</div>
      </div>

      <div className="common-card">
        <div className="attendance-top-grid">
          <div className="form-group">
            <label>Attendance Date</label>
            <input
              type="date"
              value={selectedDate}
              max={today}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setOpenStatusFor(null);
              }}
            />
          </div>

          <div className="form-group">
            <label>Class</label>

            <select
              value={selectedClassSection}
              onChange={(e) => {
                setSelectedClassSection(e.target.value);
                setOpenStatusFor(null);
              }}
            >
              <option value="">Select Class</option>

              {classSections.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="load-action-box">
            <AppButton type="primary" onClick={loadAttendance}>
              Load Attendance
            </AppButton>
          </div>
        </div>

        {selectedClosedDate && (
          <div className="holiday-note-card">
            <strong>School Closed</strong>
            <span>Reason: {selectedClosedDate.reason}</span>
            <p>Attendance entry is disabled for selected date.</p>
          </div>
        )}
      </div>

      {!selectedClosedDate && (
        <>
          <div className="summary-grid">
            <div className="summary-card">
              <span>Students</span>
              <strong>{summary.total}</strong>
            </div>

            <div className="summary-card present">
              <span>Present</span>
              <strong>{summary.present}</strong>
            </div>

            <div className="summary-card absent">
              <span>Absent</span>
              <strong>{summary.absent}</strong>
            </div>

            <div className="summary-card leave">
              <span>Leave</span>
              <strong>{summary.leave}</strong>
            </div>

            <div className="summary-card na">
              <span>NA</span>
              <strong>{summary.na}</strong>
            </div>

            <div className="summary-card percent">
              <span>%</span>
              <strong>{summary.percent}%</strong>
            </div>
          </div>

          <div className="common-card">
            <div className="list-header">
              <h2>Attendance List</h2>

              <div className="bulk-attendance-box">
                <span>Bulk Attendance</span>

                <select onChange={(e) => applyBulkStatus(e.target.value)}>
                  <option value="">Select</option>

                  {statusOptions.map((status) => (
                    <option value={status} key={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="table-wrap desktop-attendance-table">
              <table>
                <thead>
                  <tr>
                    <th className="roll-col">Roll</th>
                    <th>Student Details</th>
                    <th className="attendance-col">Attendance</th>
                  </tr>
                </thead>

                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td className="roll-col">{student.rollNo}</td>

                      <td>
                        <div className="student-detail-box">
                          <div className="student-avatar">
                            {student.photo ? (
                              <img src={student.photo} alt={student.name} />
                            ) : (
                              getInitials(student.name)
                            )}
                          </div>

                          <div className="student-info">
                            <strong>{student.name}</strong>
                            <span>Father : {student.fatherName}</span>
                            <span>Mobile : {student.mobile}</span>
                          </div>
                        </div>
                      </td>

                      <td className="attendance-col">
                        <div className="status-selector">
                          <button
                            type="button"
                            className={`status-btn status-${student.status.toLowerCase()}`}
                            onClick={() =>
                              setOpenStatusFor(
                                openStatusFor === student.id ? null : student.id
                              )
                            }
                          >
                            {student.status} <span>▼</span>
                          </button>

                          {openStatusFor === student.id && (
                            <div className="status-dropdown">
                              {statusOptions.map((status) => (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() =>
                                    updateStudentStatus(student.id, status)
                                  }
                                >
                                  {status}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-attendance-list">
              {students.map((student) => (
                <div className="mobile-attendance-card" key={student.id}>
                  <div className="mobile-card-top">
                    <span>Roll No : {student.rollNo}</span>

                    <div className="status-selector">
                      <button
                        type="button"
                        className={`status-btn status-${student.status.toLowerCase()}`}
                        onClick={() =>
                          setOpenStatusFor(
                            openStatusFor === student.id ? null : student.id
                          )
                        }
                      >
                        {student.status} <span>▼</span>
                      </button>

                      {openStatusFor === student.id && (
                        <div className="status-dropdown">
                          {statusOptions.map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() =>
                                updateStudentStatus(student.id, status)
                              }
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="student-detail-box">
                    <div className="student-avatar">
                      {student.photo ? (
                        <img src={student.photo} alt={student.name} />
                      ) : (
                        getInitials(student.name)
                      )}
                    </div>

                    <div className="student-info">
                      <strong>{student.name}</strong>
                      <span>Father : {student.fatherName}</span>
                      <span>Mobile : {student.mobile}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="form-actions">
              <AppButton type="primary" onClick={saveAttendance}>
                {isExistingRecord ? "Update Attendance" : "Save Attendance"}
              </AppButton>

              <AppButton
                type="secondary"
                onClick={() => {
                  window.location.href = "/attendance-system";
                }}
              >
                Go Back
              </AppButton>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default BulkAttendanceEntry;