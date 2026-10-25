import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./alumniManagement.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { studentHubService } from "../services/api";

function AlumniManagement() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [alumniList, setAlumniList] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewData, setViewData] = useState(null);

  const [passYearFilter, setPassYearFilter] = useState("");
  const [searchText, setSearchText] = useState("");

  const loadAlumni = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (passYearFilter) params.passYear = passYearFilter;
      if (searchText) params.search = searchText;

      const res = await studentHubService.getAlumni(params);
      if (res.data?.success) {
        setAlumniList(res.data.data || []);
      }
      setSelectedIds([]);
    } catch (err) {
      console.error("Failed to load alumni:", err);
    } finally {
      setLoading(false);
    }
  }, [passYearFilter, searchText]);

  useEffect(() => {
    loadAlumni();
  }, [loadAlumni]);

  const selectedAlumni = alumniList.filter((item) =>
    selectedIds.includes(item._id || item.id)
  );
  const selectedSingle = selectedAlumni.length === 1 ? selectedAlumni[0] : null;

  return (
    <div className="alumni-page">
      <div className="common-page-header">
        <AppButton type="back" onClick={() => navigate("/student-hub")}>
          ←
        </AppButton>

        <div>
          <h1>Alumni Management</h1>
          <p>Directory and records of graduated and passed-out students</p>
        </div>
      </div>

      <div className="common-card">
        <div className="filter-grid">
          <div className="form-group">
            <label>Passing Year</label>
            <select
              value={passYearFilter}
              onChange={(e) => setPassYearFilter(e.target.value)}
            >
              <option value="">All Passing Years</option>
              {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map((yr) => (
                <option key={yr} value={yr}>
                  Class of {yr}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Search Alumni</label>
            <input
              type="text"
              placeholder="Name, admission no, or mobile..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadAlumni()}
            />
          </div>
        </div>

        <div className="search-btn-row">
          <AppButton type="primary" onClick={loadAlumni}>
            Search
          </AppButton>
        </div>
      </div>

      <div className="common-card">
        <div className="list-header">
          <h2>Alumni Directory ({alumniList.length})</h2>

          <div className="list-action-buttons">
            <AppButton
              type="view"
              onClick={() => {
                if (!selectedSingle) {
                  alert("Please select one alumnus to view");
                  return;
                }
                setViewData(selectedSingle);
              }}
            >
              View Record
            </AppButton>
          </div>
        </div>

        <div className="table-wrap">
          {loading ? (
            <SkeletonTable rows={5} columns={7} />
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{ width: "40px" }}>
                    <input
                      type="checkbox"
                      checked={
                        alumniList.length > 0 &&
                        selectedIds.length === alumniList.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(alumniList.map((item) => item._id || item.id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                    />
                  </th>
                  <th>S.No</th>
                  <th>Student Name</th>
                  <th>Admission No</th>
                  <th>Last Class & Section</th>
                  <th>Passout Year</th>
                  <th>Contact</th>
                </tr>
              </thead>

              <tbody>
                {alumniList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-row">
                      {passYearFilter || searchText
                        ? "No alumni records found matching your filter."
                        : "No alumni recorded yet. Graduated students marked as Alumni will appear here."}
                    </td>
                  </tr>
                ) : (
                  alumniList.map((item, index) => {
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
                        <td><span className="badge-code">{item.admissionNo || item.srNo || "—"}</span></td>
                        <td>{item.className} {item.section ? `(${item.section})` : ""}</td>
                        <td><span className="badge-code">{item.passYear || "—"}</span></td>
                        <td>{item.mobile || "—"}</td>
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
              <h2>Alumnus Profile</h2>
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
                <strong>Admission No:</strong> {viewData.admissionNo || viewData.srNo || "—"}
              </p>
              <p>
                <strong>Last Class Completed:</strong> {viewData.className} {viewData.section ? `(${viewData.section})` : ""}
              </p>
              <p>
                <strong>Graduation / Passing Year:</strong> {viewData.passYear || "—"}
              </p>
              <p>
                <strong>Contact Number:</strong> {viewData.mobile || "—"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AlumniManagement;