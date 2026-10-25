import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./promotionManagement.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { studentHubService } from "../services/api";

function PromotionManagement() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [promotionsHistory, setPromotionsHistory] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  const [activeTab, setActiveTab] = useState("promote"); // "promote" | "history"

  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [searchText, setSearchText] = useState("");

  const [fromSession, setFromSession] = useState("2025-2026");
  const [toSession, setToSession] = useState("2026-2027");
  const [targetClass, setTargetClass] = useState("");
  const [targetSection, setTargetSection] = useState("");
  const [showPromotionPopup, setShowPromotionPopup] = useState(false);

  const [isSearched, setIsSearched] = useState(false);

  useEffect(() => {
    const fetchMetaAndHistory = async () => {
      try {
        const [metaRes, promoRes] = await Promise.all([
          studentHubService.getMeta(),
          studentHubService.getPromotions(),
        ]);

        if (metaRes.data?.success) {
          setClasses(metaRes.data.data.classes || []);
          setSections(metaRes.data.data.sections || []);
          if (metaRes.data.data.classes?.length > 0) {
            setClassFilter(metaRes.data.data.classes[0].className);
          }
        }
        if (promoRes.data?.success) {
          setPromotionsHistory(promoRes.data.data || []);
        }
      } catch (err) {
        console.error("Failed to load promotion data:", err);
      }
    };
    fetchMetaAndHistory();
  }, []);

  const handleSearch = async () => {
    if (!classFilter) {
      alert("Please select a Class first");
      return;
    }

    try {
      setLoading(true);
      setIsSearched(true);
      const params = { className: classFilter };
      if (sectionFilter) params.section = sectionFilter;

      const res = await studentHubService.getStudentsForPromotion(params);
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

  const handlePromoteSubmit = async () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one student to promote");
      return;
    }

    if (!targetClass) {
      alert("Please select Target (Promoted) Class");
      return;
    }

    if (!toSession) {
      alert("Please enter target academic session");
      return;
    }

    try {
      setPromoting(true);
      const res = await studentHubService.promoteStudents({
        fromClass: classFilter,
        toClass: targetClass,
        section: targetSection || sectionFilter,
        fromSession,
        toSession,
        studentIds: selectedIds,
      });

      if (res.data?.success) {
        alert(res.data.message || "Students promoted successfully");
        setShowPromotionPopup(false);
        setSelectedIds([]);
        setTargetClass("");
        handleSearch();
        // Refresh history
        const promoRes = await studentHubService.getPromotions();
        if (promoRes.data?.success) setPromotionsHistory(promoRes.data.data || []);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to promote students");
    } finally {
      setPromoting(false);
    }
  };

  const availableSections = classFilter
    ? sections.filter((s) => s.className === classFilter)
    : sections;

  const filteredStudents = students.filter((s) => {
    if (!searchText.trim()) return true;
    const q = searchText.toLowerCase();
    return (
      s.studentName?.toLowerCase().includes(q) ||
      s.admissionNo?.toLowerCase().includes(q) ||
      s.rollNo?.toLowerCase().includes(q) ||
      s.rollNumber?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="promotion-page">
      <div className="common-page-header">
        <AppButton type="back" onClick={() => navigate("/student-hub")}>
          ←
        </AppButton>

        <div>
          <h1>Promotion Management</h1>
          <p>Advance students to higher classes and subsequent academic sessions</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
        <button
          type="button"
          style={{
            padding: "8px 18px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            backgroundColor: activeTab === "promote" ? "#2563eb" : "#ffffff",
            color: activeTab === "promote" ? "#ffffff" : "#374151",
            fontWeight: "600",
            cursor: "pointer",
          }}
          onClick={() => setActiveTab("promote")}
        >
          ⬆️ Promote Students
        </button>

        <button
          type="button"
          style={{
            padding: "8px 18px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            backgroundColor: activeTab === "history" ? "#2563eb" : "#ffffff",
            color: activeTab === "history" ? "#ffffff" : "#374151",
            fontWeight: "600",
            cursor: "pointer",
          }}
          onClick={() => setActiveTab("history")}
        >
          📜 Promotion History ({promotionsHistory.length})
        </button>
      </div>

      {activeTab === "promote" && (
        <>
          <div className="common-card">
            <div className="filter-grid">
              <div className="form-group">
                <label>Current Class *</label>
                <select
                  value={classFilter}
                  onChange={(e) => {
                    setClassFilter(e.target.value);
                    setSectionFilter("");
                  }}
                >
                  <option value="">Select Class</option>
                  {classes.map((item) => (
                    <option key={item._id || item.className} value={item.className}>
                      {item.className}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Current Section</label>
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
                <label>Search Student</label>
                <input
                  type="text"
                  placeholder="Student name or admission no..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
            </div>

            <div className="search-btn-row">
              <AppButton type="primary" onClick={handleSearch}>
                Load Students
              </AppButton>
            </div>
          </div>

          {isSearched && (
            <div className="common-card">
              <div className="list-header">
                <h2>
                  Eligible Students ({filteredStudents.length})
                </h2>

                <div className="list-action-buttons">
                  <AppButton
                    type="primary"
                    onClick={() => {
                      if (selectedIds.length === 0) {
                        alert("Please select at least one student to promote");
                        return;
                      }
                      setShowPromotionPopup(true);
                    }}
                    disabled={students.length === 0}
                  >
                    Promote Selected ({selectedIds.length})
                  </AppButton>
                </div>
              </div>

              <div className="table-wrap">
                {loading ? (
                  <SkeletonTable rows={5} columns={5} />
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
                        <th>Admission No</th>
                        <th>Student Name</th>
                        <th>Class & Section</th>
                        <th>Father Name</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="empty-row">
                            No students found in this class/section.
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
                              <td><span className="badge-code">{item.admissionNo || item.srNo || "—"}</span></td>
                              <td><strong>{item.studentName}</strong></td>
                              <td>{item.className} {item.section ? `(${item.section})` : ""}</td>
                              <td>{item.fatherName || "—"}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "history" && (
        <div className="common-card">
          <div className="list-header">
            <h2>Promotion Audit Log</h2>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>From Class</th>
                  <th>To Class</th>
                  <th>From Session</th>
                  <th>To Session</th>
                  <th>Students Promoted</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {promotionsHistory.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-row">
                      No promotion history recorded yet.
                    </td>
                  </tr>
                ) : (
                  promotionsHistory.map((item, idx) => (
                    <tr key={item._id || idx}>
                      <td>{idx + 1}</td>
                      <td><strong>{item.fromClass}</strong></td>
                      <td><strong style={{ color: "#166534" }}>{item.toClass}</strong></td>
                      <td>{item.fromSession}</td>
                      <td><strong>{item.toSession}</strong></td>
                      <td><span className="badge-code">{item.promotedCount} students</span></td>
                      <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showPromotionPopup && (
        <div className="popup-overlay">
          <div className="view-popup">
            <div className="popup-head">
              <h2>Promote {selectedIds.length} Student(s)</h2>
              <button
                className="popup-close-btn"
                onClick={() => setShowPromotionPopup(false)}
              >
                ×
              </button>
            </div>

            <div style={{ padding: "10px 0" }}>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label>Current Class</label>
                <input type="text" value={classFilter} disabled />
              </div>

              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label>Promote to Class *</label>
                <select
                  value={targetClass}
                  onChange={(e) => setTargetClass(e.target.value)}
                >
                  <option value="">Select Target Class</option>
                  {classes.map((c) => (
                    <option key={c._id || c.className} value={c.className}>
                      {c.className}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label>Promote to Section (Optional)</label>
                <select
                  value={targetSection}
                  onChange={(e) => setTargetSection(e.target.value)}
                >
                  <option value="">Same Section / Default</option>
                  {sections.map((s) => (
                    <option key={s._id || s.sectionName} value={s.sectionName}>
                      Section {s.sectionName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label>From Session</label>
                <input
                  type="text"
                  value={fromSession}
                  onChange={(e) => setFromSession(e.target.value)}
                  placeholder="2025-2026"
                />
              </div>

              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label>To Session *</label>
                <input
                  type="text"
                  value={toSession}
                  onChange={(e) => setToSession(e.target.value)}
                  placeholder="2026-2027"
                />
              </div>

              <div className="form-actions" style={{ marginTop: "20px" }}>
                <AppButton
                  type="primary"
                  onClick={handlePromoteSubmit}
                  disabled={promoting}
                >
                  {promoting ? "Promoting..." : "Confirm Promotion"}
                </AppButton>
                <AppButton
                  type="secondary"
                  onClick={() => setShowPromotionPopup(false)}
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

export default PromotionManagement;