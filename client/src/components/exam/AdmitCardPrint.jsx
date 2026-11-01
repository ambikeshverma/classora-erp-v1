import React from "react";
import "./AdmitCardPrint.css";
import AppButton from "../AppButton";

const formatDate = (value) => (value ? String(value).split("-").reverse().join("-") : "-");

// Papers a student sits: everything in the class timetable unless the student has a subject choice
const papersFor = (student, timetable) =>
  student.subjects ? timetable.filter((row) => student.subjects.includes(row.subjectName)) : timetable;

function AdmitCardPrint({ mode, examName, className, sectionName, timetable, students, schoolInfo = {}, onClose }) {
  const isDeskSlip = mode === "deskslip";

  const header = (
    <div className="admit-school-header">
      {schoolInfo.logo && <img src={schoolInfo.logo} alt="School Logo" />}

      <div>
        <h1>{schoolInfo.schoolName}</h1>
        <p>{schoolInfo.address}</p>
      </div>
    </div>
  );

  return (
    <div className="admit-overlay">
      <div className="admit-box">
        <div className="admit-actions">
          <span className="admit-count">
            {students.length} {isDeskSlip ? "desk slip(s)" : "admit card(s)"}
          </span>

          <AppButton type="primary" onClick={() => window.print()}>
            Print
          </AppButton>

          <AppButton type="secondary" onClick={onClose}>
            Close
          </AppButton>
        </div>

        <div className={isDeskSlip ? "admit-print-sheet deskslip-grid" : "admit-print-sheet"}>
          {students.map((student) =>
            isDeskSlip ? (
              <div className="deskslip" key={student._id}>
                <h3>{schoolInfo.schoolName}</h3>
                <p className="deskslip-exam">{examName}</p>

                <p>
                  <strong>Name:</strong> {student.studentName}
                </p>
                <p>
                  <strong>Class:</strong> {className} - {sectionName}
                </p>
                <p>
                  <strong>Roll No:</strong> {student.rollNo || "-"}
                </p>
                <p>
                  <strong>SR No:</strong> {student.srNo || "-"}
                </p>
              </div>
            ) : (
              <div className="admit-card" key={student._id}>
                {header}

                <h2 className="admit-title">ADMIT CARD - {examName}</h2>

                <div className="admit-info">
                  <p>
                    <strong>Student Name:</strong> {student.studentName}
                  </p>
                  <p>
                    <strong>Father Name:</strong> {student.fatherName || "-"}
                  </p>
                  <p>
                    <strong>Class / Section:</strong> {className} - {sectionName}
                  </p>
                  <p>
                    <strong>Roll No:</strong> {student.rollNo || "-"}
                  </p>
                  <p>
                    <strong>SR No:</strong> {student.srNo || "-"}
                  </p>
                  <p>
                    <strong>Date of Birth:</strong> {formatDate(student.dob)}
                  </p>
                </div>

                <table className="admit-table">
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Subject</th>
                      <th>Exam Date</th>
                      <th>Time</th>
                    </tr>
                  </thead>

                  <tbody>
                    {papersFor(student, timetable).length === 0 ? (
                      <tr>
                        <td colSpan="4" className="admit-empty">
                          No exam scheduled
                        </td>
                      </tr>
                    ) : (
                      papersFor(student, timetable).map((row, index) => (
                        <tr key={row.subjectName}>
                          <td>{index + 1}</td>
                          <td>{row.subjectName}</td>
                          <td>{formatDate(row.examDate)}</td>
                          <td>
                            {row.startTime} - {row.endTime}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                <div className="admit-signatures">
                  <span>Class Teacher</span>
                  <span>Principal</span>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default AdmitCardPrint;
