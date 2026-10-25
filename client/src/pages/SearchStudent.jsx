import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./searchStudent.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { studentHubService } from "../services/api";

function SearchStudent() {
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewData, setViewData] = useState(null);

  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [searchText, setSearchText] = useState("");

  const [isSearched, setIsSearched] = useState(false);
  const [loading, setLoading] = useState(false);

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
    // Initial fetch of active students
    handleSearch();
  }, []);

  const handleSearch = async () => {
    try {
      setLoading(true);
      setIsSearched(true);
      const params = { status: "Active" };
      if (classFilter) params.className = classFilter;
      if (sectionFilter) params.section = sectionFilter;
      if (searchText) params.q = searchText;

      const res = await studentHubService.searchStudents(params);
      if (res.data?.success) {
        setStudents(res.data.data || []);
      }
      setSelectedIds([]);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectedStudents = students.filter((item) =>
    selectedIds.includes(item._id || item.id)
  );
  const selectedSingle = selectedStudents.length === 1 ? selectedStudents[0] : null;

  const availableSections = classFilter
    ? sections.filter((s) => s.className === classFilter)
    : sections;

  return (
    <div className="search-student-page">
      <div className="common-page-header">
        <AppButton type="back" onClick={() => navigate("/student-hub")}>
          ←
        </AppButton>

        <div>
          <h1>Search Student</h1>
          <p>Quick lookup and comprehensive student directory</p>
        </div>
      </div>

      <div className="common-card">
        <div className="filter-grid">
          <div className="form-group">
            <label>Class</label>
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
            <label>Section</label>
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
            <label>Search Keyword</label>
            <input
              type="text"
              placeholder="Name, father name, admission no, SR no, roll no..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
        </div>

        <div className="search-btn-row">
          <AppButton type="primary" onClick={handleSearch}>
            Search Students
          </AppButton>
        </div>
      </div>

      <div className="common-card">
        <div className="list-header">
          <h2>Student Directory ({students.length})</h2>

          <div className="list-action-buttons">
            <AppButton
              type="view"
              onClick={() => {
                if (!selectedSingle) {
                  alert("Please select exactly one student to view");
                  return;
                }
                setViewData(selectedSingle);
              }}
            >
              View Full Profile
            </AppButton>
          </div>
        </div>

        <div className="table-wrap">
          {loading ? (
            <SkeletonTable rows={6} columns={8} />
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{ width: "40px" }}>
                    <input
                      type="checkbox"
                      checked={
                        students.length > 0 &&
                        selectedIds.length === students.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(students.map((item) => item._id || item.id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                    />
                  </th>
                  <th>S.No</th>
                  <th>Student Name</th>
                  <th>Father Name</th>
                  <th>Admission / SR No</th>
                  <th>Class & Section</th>
                  <th>Roll No</th>
                  <th>Mobile</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="empty-row">
                      {isSearched
                        ? "No active students found matching your search."
                        : "No students currently enrolled. Admitted students will appear here."}
                    </td>
                  </tr>
                ) : (
                  students.map((item, index) => {
                    const itemId = item._id || item.id;
                    return (
                      <tr key={itemId}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(itemId)}
                            onChange={() => {
                              setSelectedIds((prev) =>
                                prev.includes(itemId)
                                  ? prev.filter((id) => id !== itemId)
                                  : [...prev, itemId]
                              );
                            }}
                          />
                        </td>
                        <td>{index + 1}</td>
                        <td><strong>{item.studentName}</strong></td>
                        <td>{item.fatherName || "—"}</td>
                        <td><span className="badge-code">{item.admissionNo || item.srNo || "—"}</span></td>
                        <td>{item.className} {item.section ? `(${item.section})` : ""}</td>
                        <td>{item.rollNo || item.rollNumber || "—"}</td>
                        <td>{item.mobile || "—"}</td>
                        <td>
                          <span
                            style={{
                              padding: "3px 8px",
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
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {viewData && (
        <div className="popup-overlay">
          <div className="view-popup">
            <div className="popup-head">
              <h2>Student Profile Details</h2>
              <button
                className="popup-close-btn"
                onClick={() => setViewData(null)}
              >
                ×
              </button>
            </div>

            <div className="view-grid">
              <p>
                <strong>Full Name:</strong> {viewData.studentName}
              </p>
              <p>
                <strong>Father's Name:</strong> {viewData.fatherName || "—"}
              </p>
              <p>
                <strong>Mother's Name:</strong> {viewData.motherName || "—"}
              </p>
              <p>
                <strong>Admission / SR No:</strong> {viewData.admissionNo || viewData.srNo || "—"}
              </p>
              <p>
                <strong>Class & Section:</strong> {viewData.className} {viewData.section ? `(${viewData.section})` : ""}
              </p>
              <p>
                <strong>Roll Number:</strong> {viewData.rollNo || viewData.rollNumber || "Not Assigned"}
              </p>
              <p>
                <strong>Medium:</strong> {viewData.medium || "—"}
              </p>
              <p>
                <strong>House:</strong> {viewData.house || "Not Allocated"}
              </p>
              <p>
                <strong>Contact Mobile:</strong> {viewData.mobile || "—"}
              </p>
              <p>
                <strong>Gender / DOB:</strong> {viewData.gender || "—"} / {viewData.dob || "—"}
              </p>
              <p>
                <strong>Status:</strong> {viewData.status || "Active"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchStudent;