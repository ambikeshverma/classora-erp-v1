import React, { useState } from "react";
import "./admissionBulkImport.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { admissionService } from "../services/api";

function AdmissionBulkImport() {
  const currentSession = localStorage.getItem("currentSession") || "2026-2027";
  const [parsedRows, setParsedRows] = useState([]);
  const [pasteText, setPasteText] = useState("");
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const sampleCsvHeader =
    "Student Name,Father Name,Mother Name,Class,Section,Gender,DOB (YYYY-MM-DD),Mobile,Medium,Fee Plan,SR No,Aadhar,Address";

  const downloadSampleTemplate = () => {
    const sampleData = [
      sampleCsvHeader,
      "Aarav Sharma,Rajesh Sharma,Sunita Sharma,Class 6,A,Male,2014-05-12,9876543210,English Medium,6EM,SR-2026-001,123456789012,123 Green Park Colony",
      "Ananya Verma,Sunil Verma,Pooja Verma,Class 6,B,Female,2014-08-20,9876543211,Hindi Medium,6HM,SR-2026-002,123456789013,45 Civil Lines",
    ].join("\n");

    const blob = new Blob([sampleData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "student_admission_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCsvText = (text) => {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      alert("CSV must contain at least a header row and one student data row.");
      return [];
    }

    const dataRows = lines.slice(1);
    const results = [];

    dataRows.forEach((line, index) => {
      // Split by comma ignoring commas inside quotes
      const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const [
        studentName,
        fatherName,
        motherName,
        className,
        section,
        gender,
        dob,
        mobile,
        medium,
        feePlan,
        srNo,
        aadhar,
        permanentAddress,
      ] = values;

      const isValid = Boolean(studentName && className && mobile);

      results.push({
        id: index + 1,
        studentName: studentName || "",
        fatherName: fatherName || "",
        motherName: motherName || "",
        className: className || "",
        section: section || "A",
        gender: gender || "Male",
        dob: dob || "2015-01-01",
        admissionDate: new Date().toISOString().split("T")[0],
        mobile: mobile || "",
        medium: medium || "English Medium",
        feePlan: feePlan || "Standard",
        srNo: srNo || "",
        aadhar: aadhar || "",
        permanentAddress: permanentAddress || "",
        isValid,
      });
    });

    return results;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        const parsed = parseCsvText(text);
        setParsedRows(parsed);
        setImportResult(null);
      }
    };
    reader.readAsText(file);
  };

  const handlePasteSubmit = () => {
    if (!pasteText.trim()) {
      alert("Please paste CSV data first.");
      return;
    }
    const parsed = parseCsvText(pasteText);
    setParsedRows(parsed);
    setImportResult(null);
    setShowPasteArea(false);
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  const handleCommitImport = async () => {
    if (parsedRows.length === 0) {
      alert("No student records to import.");
      return;
    }

    const rowsToImport = parsedRows.filter((r) => r.isValid);
    if (rowsToImport.length === 0) {
      alert("No valid rows found to import.");
      return;
    }

    try {
      setLoading(true);
      const res = await admissionService.bulkImportAdmissions({
        rows: rowsToImport,
        session: currentSession,
      });

      setImportResult(res.data);
      alert(res.data.message || "Import completed!");
      if (res.data.insertedCount > 0) {
        setParsedRows([]);
        setPasteText("");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Bulk import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bulk-import-page">
      <div className="bulk-import-header">
        <AppButton
          type="back"
          onClick={() => {
            window.location.href = "/admissions";
          }}
        >
          ←
        </AppButton>
        <div>
          <h1>Bulk Student Import</h1>
          <p>Import multiple student admissions at once using CSV</p>
        </div>
      </div>

      <div className="upload-card">
        <div className="template-download-box">
          <div className="template-info">
            <h4>Download Sample Format</h4>
            <p>Use our structured CSV template with predefined column headings to prevent import errors.</p>
          </div>
          <AppButton type="primary" onClick={downloadSampleTemplate}>
            ⬇️ Download CSV Template
          </AppButton>
        </div>

        <label className="dropzone-container">
          <input
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={handleFileUpload}
            disabled={loading}
          />
          <div className="dropzone-icon">📁</div>
          <div className="dropzone-title">Click to Select or Drop CSV File Here</div>
          <div className="dropzone-subtitle">Supported format: .csv (UTF-8)</div>
        </label>

        <div
          className="manual-paste-toggle"
          onClick={() => setShowPasteArea(!showPasteArea)}
        >
          <span>{showPasteArea ? "▲ Hide Direct Paste" : "▼ Or Paste CSV / Tabular Text Directly"}</span>
        </div>

        {showPasteArea && (
          <div style={{ marginTop: "12px" }}>
            <textarea
              className="paste-textarea"
              rows="6"
              placeholder={`Paste CSV content here...\nExample:\n${sampleCsvHeader}\nAarav Sharma,Rajesh Sharma,Sunita Sharma,Class 6,A,Male,2014-05-12,9876543210,English Medium,6EM`}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
            />
            <div style={{ marginTop: "8px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <AppButton type="secondary" onClick={() => setPasteText("")}>
                Clear
              </AppButton>
              <AppButton type="primary" onClick={handlePasteSubmit}>
                Parse & Preview
              </AppButton>
            </div>
          </div>
        )}
      </div>

      {importResult && (
        <div className="import-results-card">
          <div className="results-title">
            ✅ {importResult.message}
          </div>
          <div>
            <strong>Successfully Imported:</strong> {importResult.insertedCount} |{" "}
            <strong>Skipped:</strong> {importResult.skippedCount}
          </div>
          {importResult.errors && importResult.errors.length > 0 && (
            <ul className="error-list">
              {importResult.errors.map((err, idx) => (
                <li key={idx}>
                  Row {err.row}: {err.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {parsedRows.length > 0 && (
        <div className="upload-card">
          <div className="preview-summary-bar">
            <span className="summary-pill pill-total">Total Rows: {parsedRows.length}</span>
            <span className="summary-pill pill-valid">Valid: {validCount}</span>
            {invalidCount > 0 && (
              <span className="summary-pill pill-error">Invalid (Missing fields): {invalidCount}</span>
            )}
          </div>

          {loading ? (
            <SkeletonTable rows={5} columns={7} />
          ) : (
            <div className="preview-table-container">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student Name</th>
                    <th>Father Name</th>
                    <th>Class</th>
                    <th>Section</th>
                    <th>Gender</th>
                    <th>Mobile</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row) => (
                    <tr key={row.id} className={!row.isValid ? "row-invalid" : ""}>
                      <td>{row.id}</td>
                      <td>{row.studentName || <span style={{ color: "red" }}>Missing</span>}</td>
                      <td>{row.fatherName || "-"}</td>
                      <td>{row.className || <span style={{ color: "red" }}>Missing</span>}</td>
                      <td>{row.section}</td>
                      <td>{row.gender}</td>
                      <td>{row.mobile || <span style={{ color: "red" }}>Missing</span>}</td>
                      <td>
                        {row.isValid ? (
                          <span style={{ color: "green", fontWeight: 600 }}>Ready</span>
                        ) : (
                          <span style={{ color: "red", fontWeight: 600 }}>Invalid</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <AppButton
              type="secondary"
              onClick={() => {
                setParsedRows([]);
                setImportResult(null);
              }}
              disabled={loading}
            >
              Cancel
            </AppButton>
            <AppButton
              type="primary"
              onClick={handleCommitImport}
              disabled={loading || validCount === 0}
            >
              {loading ? "Importing Records..." : `Import ${validCount} Students`}
            </AppButton>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdmissionBulkImport;
