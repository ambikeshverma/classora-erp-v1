import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./bulkAttendanceEntry.css";
import AppButton from "../components/AppButton";
import { SkeletonStats, SkeletonTable } from "../components/Skeleton";
import { attendanceService } from "../services/api";

function BulkAttendanceEntry() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const formatDisplayDate = (dateValue) => {
    if (!dateValue) return "--";
    return new Date(dateValue).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const statusOptions = ["P", "A", "L", "W", "H"];

  // Form states
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedClassSection, setSelectedClassSection] = useState("");
  const [openStatusFor, setOpenStatusFor] = useState(null);
  const [isExistingRecord, setIsExistingRecord] = useState(false);

  // Meta & Holidays
  const [metaLoading, setMetaLoading] = useState(true);
  const [classOptions, setClassOptions] = useState([]);
  const [closedDates, setClosedDates] = useState([]);

  // Students & Loading
  const [students, setStudents] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  // Fetch Meta
  useEffect(() => {
    let isMounted = true;
    setMetaLoading(true);

    attendanceService
      .getMeta()
      .then((res) => {
        if (!isMounted) return;
        if (res.data?.success) {
          const classes = res.data.data.classes || [];
          const options = [];

          classes.forEach((c) => {
            if (Array.isArray(c.sections) && c.sections.length > 0) {
              c.sections.forEach((s) => {
                options.push({
                  id: `${c.className}||${s.sectionName}`,
                  className: c.className,
                  section: s.sectionName,
                  label: `${c.className} (${s.sectionName})`,
                });
              });
            } else {
              options.push({
                id: `${c.className}||A`,
                className: c.className,
                section: "A",
                label: `${c.className} (A)`,
              });
            }
          });

          setClassOptions(options);
          setClosedDates(res.data.data.closedDates || []);
        }
      })
      .catch((err) => {
        console.error("Failed to load meta for bulk attendance:", err);
      })
      .finally(() => {
        if (isMounted) setMetaLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedClosedDate = closedDates.find(
    (item) => item.date === selectedDate
  );

  const summary = useMemo(() => {
    const total = students.length;
    const present = students.filter((s) => s.status === "P").length;
    const absent = students.filter((s) => s.status === "A").length;
    const leave = students.filter((s) => s.status === "L").length;
    const na = students.filter((s) => s.status === "NA").length;
    const percent = total ? Math.round((present / total) * 100) : 0;

    return { total, present, absent, leave, na, percent };
  }, [students]);

  const getInitials = (name) => {
    if (!name) return "--";
    return name
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const loadAttendance = async () => {
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

    if (selectedClosedDate) {
      setStudents([]);
      setHasLoaded(true);
      return;
    }

    const [className, section] = selectedClassSection.split("||");
    setLoadingAttendance(true);
    setHasLoaded(true);
    setOpenStatusFor(null);
    setToast(null);

    try {
      const res = await attendanceService.getStudentAttendance({
        className,
        section,
        date: selectedDate,
      });

      if (res.data?.success) {
        setStudents(res.data.data.students || []);
        setIsExistingRecord(Boolean(res.data.data.isExistingRecord));
      } else {
        setStudents([]);
        setIsExistingRecord(false);
      }
    } catch (err) {
      console.error("Failed to load bulk attendance:", err);
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to load attendance",
      });
      setStudents([]);
    } finally {
      setLoadingAttendance(false);
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
        student.id === studentId || student.studentId === studentId
          ? { ...student, status }
          : student
      )
    );

    setOpenStatusFor(null);
  };

  const saveAttendance = async () => {
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

    if (students.length === 0) {
      alert("No students to save attendance for.");
      return;
    }

    if (summary.na > 0) {
      alert(
        `${summary.na} student(s) are still marked as NA. Please complete attendance first.`
      );
      return;
    }

    const [className, section] = selectedClassSection.split("||");
    setSaving(true);
    setToast(null);

    try {
      const res = await attendanceService.saveStudentAttendance({
        date: selectedDate,
        className,
        section,
        records: students,
        summary,
      });

      if (res.data?.success) {
        setToast({
          type: "success",
          message: isExistingRecord
            ? "Attendance updated successfully!"
            : "Attendance saved successfully!",
        });
        setIsExistingRecord(true);
        setTimeout(() => setToast(null), 4000);
      }
    } catch (err) {
      console.error("Save attendance error:", err);
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to save attendance",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bulk-attendance-page">
      <div className="common-page-header attendance-header-row">
        <div className="attendance-header-left">
          <AppButton
            type="back"
            onClick={() => {
              navigate("/attendance-system");
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

      {toast && (
        <div className={`attendance-toast-msg ${toast.type}`}>
          {toast.message}
        </div>
      )}

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
                setHasLoaded(false);
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
                setHasLoaded(false);
              }}
              disabled={metaLoading}
            >
              <option value="">
                {metaLoading
                  ? "Loading classes..."
                  : classOptions.length === 0
                  ? "No classes found in database"
                  : "Select Class"}
              </option>

              {classOptions.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="load-action-box">
            <AppButton
              type="primary"
              onClick={loadAttendance}
              disabled={loadingAttendance}
            >
              {loadingAttendance ? "Loading..." : "Load Attendance"}
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
          {/* Shimmer loading */}
          {loadingAttendance && (
            <div style={{ marginTop: "20px" }}>
              <SkeletonStats count={6} />
              <div style={{ marginTop: "20px" }}>
                <SkeletonTable rows={5} columns={3} />
              </div>
            </div>
          )}

          {/* Empty state when class loaded but no students */}
          {!loadingAttendance && hasLoaded && students.length === 0 && (
            <div className="common-card">
              <div className="empty-attendance-box">
                <strong>No Students Enrolled</strong>
                <p>
                  No active students found in this class & section for the selected date.
                </p>
              </div>
            </div>
          )}

          {/* Attendance List */}
          {!loadingAttendance && students.length > 0 && (
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
                  <h2>Attendance List {isExistingRecord ? "(Saved Record)" : "(New Record)"}</h2>

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
                        <tr key={student.id || student.studentId}>
                          <td className="roll-col">{student.rollNo || "--"}</td>

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
                                <span>Father : {student.fatherName || "--"}</span>
                                <span>Mobile : {student.mobile || "--"}</span>
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
                                    openStatusFor === (student.id || student.studentId)
                                      ? null
                                      : (student.id || student.studentId)
                                  )
                                }
                              >
                                {student.status} <span>▼</span>
                              </button>

                              {openStatusFor === (student.id || student.studentId) && (
                                <div className="status-dropdown">
                                  {statusOptions.map((status) => (
                                    <button
                                      key={status}
                                      type="button"
                                      onClick={() =>
                                        updateStudentStatus(
                                          student.id || student.studentId,
                                          status
                                        )
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
                    <div
                      className="mobile-attendance-card"
                      key={student.id || student.studentId}
                    >
                      <div className="mobile-card-top">
                        <span>Roll No : {student.rollNo || "--"}</span>

                        <div className="status-selector">
                          <button
                            type="button"
                            className={`status-btn status-${student.status.toLowerCase()}`}
                            onClick={() =>
                              setOpenStatusFor(
                                openStatusFor === (student.id || student.studentId)
                                  ? null
                                  : (student.id || student.studentId)
                              )
                            }
                          >
                            {student.status} <span>▼</span>
                          </button>

                          {openStatusFor === (student.id || student.studentId) && (
                            <div className="status-dropdown">
                              {statusOptions.map((status) => (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() =>
                                    updateStudentStatus(
                                      student.id || student.studentId,
                                      status
                                    )
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
                          <span>Father : {student.fatherName || "--"}</span>
                          <span>Mobile : {student.mobile || "--"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="form-actions">
                  <AppButton
                    type="primary"
                    onClick={saveAttendance}
                    disabled={saving}
                  >
                    {saving
                      ? "Saving Attendance..."
                      : isExistingRecord
                      ? "Update Attendance"
                      : "Save Attendance"}
                  </AppButton>

                  <AppButton
                    type="secondary"
                    onClick={() => {
                      navigate("/attendance-system");
                    }}
                  >
                    Go Back
                  </AppButton>
                </div>
              </div>
            </>
          )}

          {!hasLoaded && !loadingAttendance && (
            <div className="common-card">
              <div className="empty-attendance-box">
                <strong>Ready to Load Attendance</strong>
                <p>Select date and class, then click "Load Attendance" to view or edit records.</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default BulkAttendanceEntry;
