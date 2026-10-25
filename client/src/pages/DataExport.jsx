import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { studentHubService } from "../services/api";

function DataExport() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);

  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const handleFetchExportData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (classFilter) params.className = classFilter;
      if (sectionFilter) params.section = sectionFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await studentHubService.getDataExport(params);
      if (res.data?.success) {
        setStudents(res.data.data || []);
      }
    } catch (err) {
      console.error("Export fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [classFilter, sectionFilter, statusFilter]);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await studentHubService.getMeta();
        if (res.data?.success) {
          setClasses(res.data.data.classes || []);
          setSections(res.data.data.sections || []);
        }
      } catch (err) {
        console.error("Failed to load meta:", err);
      }
    };
    fetchMeta();
    handleFetchExportData();
  }, [handleFetchExportData]);

  const handleExportCSV = () => {
    if (students.length === 0) {
      alert("No students to export");
      return;
    }

    const headers = [
      "Student Name",
      "Admission No",
      "SR No",
      "Class",
      "Section",
      "Roll No",
      "Father Name",
      "Mother Name",
      "Mobile",
      "Gender",
      "DOB",
      "Medium",
      "House",
      "Status",
    ];

    const rows = students.map((s) => [
      `"${s.studentName || ""}"`,
      `"${s.admissionNo || ""}"`,
      `"${s.srNo || ""}"`,
      `"${s.className || ""}"`,
      `"${s.section || ""}"`,
      `"${s.rollNo || s.rollNumber || ""}"`,
      `"${s.fatherName || ""}"`,
      `"${s.motherName || ""}"`,
      `"${s.mobile || ""}"`,
      `"${s.gender || ""}"`,
      `"${s.dob || ""}"`,
      `"${s.medium || ""}"`,
      `"${s.house || ""}"`,
      `"${s.status || "Active"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Student_Data_Export_${classFilter ? classFilter.replace(" ", "_") : "All"}_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const availableSections = classFilter
    ? sections.filter((s) => s.className === classFilter)
    : sections;

  return (
    <div className="class-page">
      <div className="common-page-header">
        <AppButton type="back" onClick={() => navigate("/student-hub")}>
          ←
        </AppButton>

        <div>
          <h1>Data Export</h1>
          <p>Download comprehensive student records in standard CSV and spreadsheet formats</p>
        </div>
      </div>

      <div className="common-card">
        <div className="filter-grid">
          <div className="form-group">
            <label>Filter Class</label>
            <select
              value={classFilter}
              onChange={(e) => {
                setClassFilter(e.target.value);
                setSectionFilter("");
              }}
            >
              <option value="">All Classes</option>
              {classes.map((item) => (
                <option key={item._id || item.className} value={item.className}>
                  {item.className}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Filter Section</label>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
            >
              <option value="">All Sections</option>
              {availableSections.map((item) => (
                <option key={item._id || item.sectionName} value={item.sectionName}>
                  Section {item.sectionName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Student Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
              <option value="Alumni">Alumni Only</option>
            </select>
          </div>
        </div>

        <div className="search-btn-row" style={{ display: "flex", gap: "10px" }}>
          <AppButton type="primary" onClick={handleFetchExportData}>
            Apply Filters
          </AppButton>
          <AppButton
            type="primary"
            onClick={handleExportCSV}
            disabled={students.length === 0}
          >
            📥 Download CSV ({students.length} Records)
          </AppButton>
        </div>
      </div>

      <div className="common-card">
        <div className="list-header">
          <h2>Data Preview ({students.length} rows)</h2>
        </div>

        <div className="table-wrap">
          {loading ? (
            <SkeletonTable rows={6} columns={7} />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Student Name</th>
                  <th>Admission No</th>
                  <th>Class & Section</th>
                  <th>Roll No</th>
                  <th>Father Name</th>
                  <th>Contact</th>
                  <th>House</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="empty-row">
                      No student records match the export criteria.
                    </td>
                  </tr>
                ) : (
                  students.map((item, index) => (
                    <tr key={item._id || item.id || index}>
                      <td>{index + 1}</td>
                      <td><strong>{item.studentName}</strong></td>
                      <td><span className="badge-code">{item.admissionNo || item.srNo || "—"}</span></td>
                      <td>{item.className} {item.section ? `(${item.section})` : ""}</td>
                      <td>{item.rollNo || item.rollNumber || "—"}</td>
                      <td>{item.fatherName || "—"}</td>
                      <td>{item.mobile || "—"}</td>
                      <td>{item.house || "—"}</td>
                      <td>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "10px",
                            backgroundColor: item.status === "Active" ? "#dcfce7" : "#fee2e2",
                            color: item.status === "Active" ? "#166534" : "#991b1b",
                            fontSize: "12px",
                            fontWeight: "600",
                          }}
                        >
                          {item.status || "Active"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default DataExport;
