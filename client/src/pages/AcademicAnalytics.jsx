import React, { useState } from "react";
import "./academicAnalytics.css";

function AcademicAnalytics() {
  const [activeReport, setActiveReport] = useState("");
  const [reportClass, setReportClass] = useState("All Classes");
  const [showClassReport, setShowClassReport] = useState(false);
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [showExport, setShowExport] = useState(false);
const schoolProfile = {
  name: "Chandra Shekhar Azad Inter College",
  address: "Rasauli, Barabanki",
  logo: "🏫",
  contact: "8840248644"
};
  // Demo Data
  const classData = [
    { className: "Class 9", subjects: ["Hindi", "English", "Math"] },
    { className: "Class 10", subjects: ["Hindi", "English", "Math", "Science"] }
  ];

  const studentData = [
    {
      name: "Aman",
      admissionNo: "ADM001",
      className: "Class 10",
      section: "A",
      subjects: ["Math", "Science"]
    },
    {
      name: "Riya",
      admissionNo: "ADM002",
      className: "Class 10",
      section: "A",
      subjects: ["English", "Math"]
    }
  ];

  const filteredClassData =
    reportClass === "All Classes"
      ? classData
      : classData.filter((c) => c.className === reportClass);

  const filteredStudents = studentData.filter(
    (s) => s.className === className && s.section === section
  );
const handlePrint = () => {
  window.print();
};
  return (
    <div className="analytics-page">

      {/* HEADER */}
      <div className="analytics-header">
        <button
  className="back-btn"
  onClick={() => {
    if (activeReport) {
      setActiveReport("");
    } else {
      window.location.href = "/academic-zone";
    }
  }}
>
          ←
        </button>
        <div>
          <h1>Analytics & Reports</h1>
          <p>Generate and export academic reports</p>
        </div>
      </div>

      {/* MAIN OPTIONS */}
      {!activeReport && (
        <div className="report-list">
          <div className="report-card" onClick={() => setActiveReport("class")}>
            Class-wise Subject Report
          </div>

          <div className="report-card" onClick={() => setActiveReport("student")}>
            Student-wise Subject Report
          </div>
        </div>
      )}

      {/* CLASS REPORT */}
      {activeReport === "class" && (
        <div className="report-card-box">
          <h2>Class-wise Subject Report</h2>

          <div className="filters">
            <select
              value={reportClass}
              onChange={(e) => {
                setReportClass(e.target.value);
                setShowClassReport(false);
              }}
            >
              <option value="All Classes">All Classes</option>
              {classData.map((c, i) => (
                <option key={i} value={c.className}>
                  {c.className}
                </option>
              ))}
            </select>

            <button className="view-btn" onClick={() => setShowClassReport(true)}>
              View
            </button>
          </div>

          {showClassReport && (
            <>
            <div className="print-header">
  <div className="logo">{schoolProfile.logo}</div>

  <div className="school-details">
    <h2>{schoolProfile.name}</h2>
    <p>{schoolProfile.address}</p>
    <p>{schoolProfile.contact}</p>
  </div>
</div>

<h3 className="report-title">Class-wise Subject Report</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Class</th>
                      <th>Assigned Subjects</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClassData.map((c, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{c.className}</td>
                        <td>{c.subjects.join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
<div className="print-footer">
  <span className="print-date">
  {new Date().toLocaleString()}
</span>
</div>
              <div className="actions">
                <button className="print-btn" onClick={handlePrint}>
  Print
</button>
                <button className="export-btn" onClick={() => setShowExport(true)}>
                  Export
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* STUDENT REPORT */}
      {activeReport === "student" && (
        <div className="report-card-box">
          <h2>Student-wise Subject Report</h2>

          <div className="filters">
            <select value={className} onChange={(e) => setClassName(e.target.value)}>
              <option value="">Select Class</option>
              <option value="Class 10">Class 10</option>
            </select>

            <select value={section} onChange={(e) => setSection(e.target.value)}>
              <option value="">Select Section</option>
              <option value="A">A</option>
            </select>
          </div>

          {className && section && (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Name</th>
                      <th>Admission No</th>
                      <th>Class</th>
                      <th>Section</th>
                      <th>Subjects</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{s.name}</td>
                        <td>{s.admissionNo}</td>
                        <td>{s.className}</td>
                        <td>{s.section}</td>
                        <td>{s.subjects.join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="actions">
                <button className="print-btn">Print</button>
                <button className="export-btn" onClick={() => setShowExport(true)}>
                  Export
                </button>
              </div>

             <div className="print-footer">
  <span className="print-date">
    {new Date().toLocaleString()}
  </span>
</div>
            </>
          )}
        </div>
      )}

      {/* EXPORT POPUP */}
      {showExport && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>Select Format</h3>

            <button className="pdf-btn">📄 PDF</button>
            <button className="excel-btn">📊 Excel</button>

            <button className="cancel-btn" onClick={() => setShowExport(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AcademicAnalytics;