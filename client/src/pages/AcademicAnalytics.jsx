import React, { useState, useEffect } from "react";
import "./academicAnalytics.css";
import { exportToPDF } from "../utils/exportPDF";
import { exportToExcel } from "../utils/exportExcel";
import AppButton from "../components/AppButton";

function AcademicAnalytics() {
  const [activeReport, setActiveReport] = useState("");
  const [reportClass, setReportClass] = useState("All Classes");
  const [showClassReport, setShowClassReport] = useState(false);
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [showExport, setShowExport] = useState(false);

  const resetReports = () => {
    setReportClass("All Classes");
    setShowClassReport(false);
    setClassName("");
    setSection("");
    setShowExport(false);
  };

  useEffect(() => {
    resetReports();
  }, []);

  const schoolProfile = {
    name: "Chandra Shekhar Azad Inter College",
    address: "Rasauli, Barabanki",
    contact: "8840248644",
  };

  const classData = [
    { className: "Class 9", subjects: ["Hindi", "English", "Math"] },
    { className: "Class 10", subjects: ["Hindi", "English", "Math", "Science"] },
  ];

  const studentData = [
    {
      name: "Aman",
      admissionNo: "ADM001",
      className: "Class 10",
      section: "A",
      subjects: ["Math", "Science"],
    },
    {
      name: "Riya",
      admissionNo: "ADM002",
      className: "Class 10",
      section: "A",
      subjects: ["English", "Math"],
    },
  ];

  const filteredClassData =
    reportClass === "All Classes"
      ? classData
      : classData.filter((item) => item.className === reportClass);

  const filteredStudents = studentData.filter(
    (s) => s.className === className && s.section === section
  );

  const getCurrentReportData = () => {
    if (activeReport === "class") return filteredClassData;
    if (activeReport === "student") return filteredStudents;
    return [];
  };

  const getReportTitle = () => {
    return activeReport === "class"
      ? "Class-wise Subject Report"
      : "Student-wise Subject Report";
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    const data = getCurrentReportData();

    const columns =
      activeReport === "class"
        ? ["S.No", "Class", "Subjects"]
        : ["S.No", "Name", "Adm No", "Class", "Section", "Subjects"];

    const rows =
      activeReport === "class"
        ? data.map((item, i) => [i + 1, item.className, item.subjects.join(", ")])
        : data.map((item, i) => [
            i + 1,
            item.name,
            item.admissionNo,
            item.className,
            item.section,
            item.subjects.join(", "),
          ]);

    exportToPDF({
      title: getReportTitle(),
      columns,
      data: rows,
      schoolProfile,
    });

    setShowExport(false);
  };

  const handleExportExcel = () => {
    const data = getCurrentReportData();

    const columns =
      activeReport === "class"
        ? ["S.No", "Class", "Subjects"]
        : ["S.No", "Name", "Adm No", "Class", "Section", "Subjects"];

    const rows =
      activeReport === "class"
        ? data.map((item, i) => [i + 1, item.className, item.subjects.join(", ")])
        : data.map((item, i) => [
            i + 1,
            item.name,
            item.admissionNo,
            item.className,
            item.section,
            item.subjects.join(", "),
          ]);

    exportToExcel({
      title: getReportTitle(),
      columns,
      data: rows,
      schoolProfile,
    });

    setShowExport(false);
  };

  return (
    <div className="analytics-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => {
            if (activeReport) {
              resetReports();
              setActiveReport("");
            } else {
              window.location.href = "/academic-zone";
            }
          }}
        >
          ←
        </AppButton>

        <div>
          <h1>Analytics & Reports</h1>
          <p>Generate and export academic reports</p>
        </div>
      </div>

      {!activeReport && (
        <div className="report-list">
          <div
            className="report-card"
            onClick={() => {
              resetReports();
              setActiveReport("class");
            }}
          >
            Class-wise Subject Report
          </div>

          <div
            className="report-card"
            onClick={() => {
              resetReports();
              setActiveReport("student");
            }}
          >
            Student-wise Subject Report
          </div>
        </div>
      )}

      {activeReport === "class" && (
        <div className="common-card">
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
              {classData.map((item, index) => (
                <option key={index} value={item.className}>
                  {item.className}
                </option>
              ))}
            </select>

            <AppButton type="view" onClick={() => setShowClassReport(true)}>
              View
            </AppButton>
          </div>

          {showClassReport && (
            <>
              <div className="print-header">
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
                    {filteredClassData.map((item, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{item.className}</td>
                        <td>{item.subjects.join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="actions">
                <AppButton type="print" onClick={handlePrint}>
                  Print
                </AppButton>

                <AppButton type="export" onClick={() => setShowExport(true)}>
                  Export
                </AppButton>
              </div>

              <div className="print-footer">
                <span className="print-date">{new Date().toLocaleString()}</span>
              </div>
            </>
          )}
        </div>
      )}

      {activeReport === "student" && (
        <div className="common-card">
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
              <div className="print-header">
                <div className="school-details">
                  <h2>{schoolProfile.name}</h2>
                  <p>{schoolProfile.address}</p>
                  <p>{schoolProfile.contact}</p>
                </div>
              </div>

              <h3 className="report-title">Student-wise Subject Report</h3>

              <div className="table-wrap">
                <table style={{ width: "100%", tableLayout: "fixed" }}>
                  <thead>
                    <tr>
                      <th style={{ width: "8%" }}>S.No</th>
                      <th style={{ width: "22%" }}>Student Name</th>
                      <th style={{ width: "18%" }}>Admission No</th>
                      <th style={{ width: "14%" }}>Class</th>
                      <th style={{ width: "10%" }}>Section</th>
                      <th style={{ width: "28%" }}>Assigned Subjects</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredStudents.map((student, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{student.name}</td>
                        <td>{student.admissionNo}</td>
                        <td>{student.className}</td>
                        <td>{student.section}</td>
                        <td>{student.subjects.join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="actions">
                <AppButton type="print" onClick={handlePrint}>
                  Print
                </AppButton>

                <AppButton type="export" onClick={() => setShowExport(true)}>
                  Export
                </AppButton>
              </div>

              <div className="print-footer">
                <span className="print-date">{new Date().toLocaleString()}</span>
              </div>
            </>
          )}
        </div>
      )}

      {showExport && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>Select Format</h3>

            <AppButton type="pdf" onClick={handleExportPDF}>
              PDF
            </AppButton>

            <AppButton type="excel" onClick={handleExportExcel}>
              Excel
            </AppButton>

            <AppButton type="cancel" onClick={() => setShowExport(false)}>
              Cancel
            </AppButton>
          </div>
        </div>
      )}
    </div>
  );
}

export default AcademicAnalytics;