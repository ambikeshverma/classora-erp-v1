import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./inactiveStudents.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { studentHubService } from "../services/api";

function InactiveStudents() {
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // View mode: "Inactive" or "Active" (to allow deactivating active students or restoring inactive ones)
  const [viewStatus, setViewStatus] = useState("Inactive");
  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [inactiveReasonFilter, setInactiveReasonFilter] = useState("");
  const [searchText, setSearchText] = useState("");

  const [showInactivePopup, setShowInactivePopup] = useState(false);
  const [inactiveReason, setInactiveReason] = useState("");

  const inactiveReasons = [
    "Left School",
    "Long Absent",
    "Fee Issue",
    "Transfer",
    "Medical Reason",
    "Discipline Issue",
    "Duplicate Admission",
    "Other",
  ];

  const loadMetaAndStudents = useCallback(async () => {
    try {
      setLoading(true);
      const [metaRes, studRes] = await Promise.all([
        studentHubService.getMeta(),
        viewStatus === "Inactive"
          ? studentHubService.getInactiveStudents({ className: classFilter, section: sectionFilter, search: searchText })
          : studentHubService.searchStudents({ status: "Active", className: classFilter, section: sectionFilter, q: searchText }),
      ]);

      if (metaRes.data?.success) {
        setClasses(metaRes.data.data.classes || []);
        setSections(metaRes.data.data.sections || []);
      }

      if (studRes.data?.success) {
        setStudents(studRes.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load students:", err);
    } finally {
      setLoading(false);
    }
  }, [viewStatus, classFilter, sectionFilter, searchText]);

  useEffect(() => {
    loadMetaAndStudents();
  }, [loadMetaAndStudents]);

  const handleSearch = async () => {
    try {
      setLoading(true);
      if (viewStatus === "Inactive") {
        const res = await studentHubService.getInactiveStudents({
          className: classFilter,
          section: sectionFilter,
          search: searchText,
        });
        if (res.data?.success) setStudents(res.data.data || []);
      } else {
        const res = await studentHubService.searchStudents({
          status: "Active",
          className: classFilter,
          section: sectionFilter,
          q: searchText,
        });
        if (res.data?.success) setStudents(res.data.data || []);
      }
      setSelectedIds([]);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one student to reactivate");
      return;
    }

    const ok = window.confirm(`Restore ${selectedIds.length} student(s) to Active status?`);
    if (!ok) return;

    try {
      setProcessing(true);
      for (const id of selectedIds) {
        await studentHubService.restoreStudent(id);
      }
      alert("Student(s) reactivated successfully");
      setSelectedIds([]);
      handleSearch();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to restore students");
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmInactive = async () => {
    if (!inactiveReason) {
      alert("Please select reason for deactivation");
      return;
    }

    try {
      setProcessing(true);
      const res = await studentHubService.bulkDeactivateStudents({
        studentIds: selectedIds,
        reason: inactiveReason,
      });

      if (res.data?.success) {
        alert(res.data.message || "Students marked inactive successfully");
        setSelectedIds([]);
        setInactiveReason("");
        setShowInactivePopup(false);
        handleSearch();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to deactivate students");
    } finally {
      setProcessing(false);
    }
  };

  const availableSections = classFilter
    ? sections.filter((s) => s.className === classFilter)
    : sections;

  const filteredStudents = students.filter((s) => {
    if (inactiveReasonFilter && viewStatus === "Inactive") {
      return s.inactiveReason === inactiveReasonFilter;
    }
    return true;
  });

  return (
    <div className="inactive-page">
      <div className="common-page-header">
        <AppButton type="back" onClick={() => navigate("/student-hub")}>
          ←
        </AppButton>

        <div>
          <h1>Inactive Students</h1>
          <p>Manage withdrawn, transferred, and inactive student accounts</p>
        </div>
      </div>

      <div className="common-card">
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <button
            type="button"
            className={`tab-btn ${viewStatus === "Inactive" ? "active" : ""}`}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              backgroundColor: viewStatus === "Inactive" ? "#ef4444" : "#ffffff",
              color: viewStatus === "Inactive" ? "#ffffff" : "#374151",
              fontWeight: "600",
              cursor: "pointer",
            }}
            onClick={() => {
              setViewStatus("Inactive");
              setSelectedIds([]);
            }}
          >
            🚫 Inactive Students
          </button>

          <button
            type="button"
            className={`tab-btn ${viewStatus === "Active" ? "active" : ""}`}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              backgroundColor: viewStatus === "Active" ? "#10b981" : "#ffffff",
              color: viewStatus === "Active" ? "#ffffff" : "#374151",
              fontWeight: "600",
              cursor: "pointer",
            }}
            onClick={() => {
              setViewStatus("Active");
              setSelectedIds([]);
            }}
          >
            ✅ Active Students (To Deactivate)
          </button>
        </div>

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

          {viewStatus === "Inactive" && (
            <div className="form-group">
              <label>Reason Filter</label>
              <select
                value={inactiveReasonFilter}
                onChange={(e) => setInactiveReasonFilter(e.target.value)}
              >
                <option value="">All Reasons</option>
                {inactiveReasons.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Search Keyword</label>
            <input
              type="text"
              placeholder="Name, admission no, mobile..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
        </div>

        <div className="search-btn-row">
          <AppButton type="primary" onClick={handleSearch}>
            Search
          </AppButton>
        </div>
      </div>

      <div className="common-card">
        <div className="list-header">
          <h2>
            {viewStatus === "Inactive" ? "Inactive Students List" : "Active Students List"} ({filteredStudents.length})
          </h2>

          <div className="list-action-buttons">
            {viewStatus === "Inactive" ? (
              <AppButton
                type="primary"
                onClick={handleReactivate}
                disabled={processing || selectedIds.length === 0}
              >
                {processing ? "Reactivating..." : "Reactivate Selected"}
              </AppButton>
            ) : (
              <AppButton
                type="delete"
                onClick={() => {
                  if (selectedIds.length === 0) {
                    alert("Please select at least one student to deactivate");
                    return;
                  }
                  setShowInactivePopup(true);
                }}
                disabled={processing || selectedIds.length === 0}
              >
                Mark Selected Inactive
              </AppButton>
            )}
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
                        filteredStudents.length > 0 &&
                        selectedIds.length === filteredStudents.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(filteredStudents.map((item) => item._id || item.id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                    />
                  </th>
                  <th>S.No</th>
                  <th>Student Name</th>
                  <th>Admission No</th>
                  <th>Class & Section</th>
                  <th>Roll No</th>
                  {viewStatus === "Inactive" ? <th>Inactive Reason</th> : <th>Status</th>}
                </tr>
              </thead>

              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-row">
                      {viewStatus === "Inactive"
                        ? "No inactive students found."
                        : "No active students found matching criteria."}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((item, index) => {
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
                        <td>{item.rollNo || item.rollNumber || "—"}</td>
                        <td>
                          {viewStatus === "Inactive" ? (
                            <span style={{ color: "#ef4444", fontWeight: "600" }}>
                              {item.inactiveReason || "Not Specified"}
                            </span>
                          ) : (
                            <span style={{ color: "#166534", fontWeight: "600" }}>Active</span>
                          )}
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

      {showInactivePopup && (
        <div className="popup-overlay">
          <div className="view-popup">
            <div className="popup-head">
              <h2>Confirm Deactivation ({selectedIds.length} students)</h2>
              <button
                className="popup-close-btn"
                onClick={() => setShowInactivePopup(false)}
              >
                ×
              </button>
            </div>

            <div style={{ padding: "10px 0" }}>
              <div className="form-group">
                <label>Reason for Inactivation *</label>
                <select
                  value={inactiveReason}
                  onChange={(e) => setInactiveReason(e.target.value)}
                >
                  <option value="">Select Reason</option>
                  {inactiveReasons.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-actions" style={{ marginTop: "20px" }}>
                <AppButton
                  type="delete"
                  onClick={handleConfirmInactive}
                  disabled={processing}
                >
                  {processing ? "Processing..." : "Confirm Deactivation"}
                </AppButton>
                <AppButton
                  type="secondary"
                  onClick={() => setShowInactivePopup(false)}
                >
                  Cancel
                </AppButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InactiveStudents;