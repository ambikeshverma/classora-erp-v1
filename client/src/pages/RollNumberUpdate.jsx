import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./rollNumberUpdate.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { studentHubService } from "../services/api";

function RollNumberUpdate() {
  const navigate = useNavigate();
  const currentSession = "2026-2027";

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [searchText, setSearchText] = useState("");

  const [isSearched, setIsSearched] = useState(false);
  const [showGeneratePopup, setShowGeneratePopup] = useState(false);
  const [showManualPopup, setShowManualPopup] = useState(false);

  const [rollFormat, setRollFormat] = useState("Class + Section Wise");
  const [manualRolls, setManualRolls] = useState({});

  const formatOptions = [
    "Numeric Only",
    "Class Wise",
    "Class + Section Wise",
    "Session + Class + Section Wise",
  ];

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await studentHubService.getMeta();
        if (res.data?.success) {
          setClasses(res.data.data.classes || []);
          setSections(res.data.data.sections || []);
          if (res.data.data.classes?.length > 0) {
            setClassFilter(res.data.data.classes[0].className);
          }
        }
      } catch (err) {
        console.error("Failed to load meta:", err);
      }
    };
    fetchMeta();
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

      const res = await studentHubService.getStudentsForRollNumber(params);
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

  const getClassCode = (clsName) => {
    return (clsName || "").replace("Class ", "");
  };

  const getSessionCode = () => {
    return currentSession.split("-")[0];
  };

  const generateRollNo = (student, index, format) => {
    const number = String(index + 1).padStart(3, "0");
    const classCode = getClassCode(student.className);
    const sectionCode = student.section || student.sectionName || "A";
    const sessionCode = getSessionCode();

    if (format === "Numeric Only") return number;
    if (format === "Class Wise") return `${classCode}-${number}`;
    if (format === "Class + Section Wise") return `${classCode}${sectionCode}-${number}`;
    if (format === "Session + Class + Section Wise") return `${sessionCode}-${classCode}${sectionCode}-${number}`;
    return number;
  };

  const handleAutoGenerateApply = async () => {
    const targetStudents =
      selectedIds.length > 0
        ? students.filter((s) => selectedIds.includes(s._id || s.id))
        : students;

    if (targetStudents.length === 0) {
      alert("No students to assign roll numbers to");
      return;
    }

    const updates = targetStudents.map((student, idx) => ({
      studentId: student._id || student.id,
      rollNumber: generateRollNo(student, idx, rollFormat),
      rollNo: generateRollNo(student, idx, rollFormat),
    }));

    try {
      setSaving(true);
      const res = await studentHubService.bulkUpdateRollNumbers(updates);
      if (res.data?.success) {
        alert(res.data.message || "Roll numbers generated and saved successfully");
        setShowGeneratePopup(false);
        handleSearch();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update roll numbers");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenManual = () => {
    const initialRolls = {};
    students.forEach((s) => {
      initialRolls[s._id || s.id] = s.rollNo || s.rollNumber || "";
    });
    setManualRolls(initialRolls);
    setShowManualPopup(true);
  };

  const handleSaveManual = async () => {
    const updates = Object.entries(manualRolls).map(([studentId, rollNo]) => ({
      studentId,
      rollNumber: rollNo,
      rollNo: rollNo,
    }));

    try {
      setSaving(true);
      const res = await studentHubService.bulkUpdateRollNumbers(updates);
      if (res.data?.success) {
        alert(res.data.message || "Roll numbers updated successfully");
        setShowManualPopup(false);
        handleSearch();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update roll numbers");
    } finally {
      setSaving(false);
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
    <div className="roll-number-page">
      <div className="common-page-header">
        <AppButton type="back" onClick={() => navigate("/student-hub")}>
          ←
        </AppButton>

        <div>
          <h1>Roll Number Update</h1>
          <p>Generate standardized roll numbers or manually configure student seating sequences</p>
        </div>
      </div>

      <div className="common-card">
        <div className="filter-grid">
          <div className="form-group">
            <label>Class *</label>
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
            <label>Search in Class</label>
            <input
              type="text"
              placeholder="Filter by student name or admission no..."
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
              Class Students ({filteredStudents.length})
            </h2>

            <div className="list-action-buttons">
              <AppButton
                type="primary"
                onClick={() => setShowGeneratePopup(true)}
                disabled={students.length === 0}
              >
                Auto Generate Roll Numbers
              </AppButton>

              <AppButton
                type="view"
                onClick={handleOpenManual}
                disabled={students.length === 0}
              >
                Manual Quick Edit
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
                    <th>Section</th>
                    <th>Current Roll No</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-row">
                        No active students found in this class/section.
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
                          <td>{item.section || item.sectionName || "—"}</td>
                          <td>
                            <span
                              style={{
                                fontWeight: "600",
                                color: item.rollNo || item.rollNumber ? "#1e40af" : "#9ca3af",
                              }}
                            >
                              {item.rollNo || item.rollNumber || "Not Set"}
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
      )}

      {showGeneratePopup && (
        <div className="popup-overlay">
          <div className="view-popup">
            <div className="popup-head">
              <h2>Auto Generate Roll Numbers</h2>
              <button
                className="popup-close-btn"
                onClick={() => setShowGeneratePopup(false)}
              >
                ×
              </button>
            </div>

            <div style={{ padding: "10px 0" }}>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label>Format Pattern</label>
                <select
                  value={rollFormat}
                  onChange={(e) => setRollFormat(e.target.value)}
                >
                  {formatOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  backgroundColor: "#eff6ff",
                  fontSize: "13px",
                  color: "#1e40af",
                  marginBottom: "15px",
                }}
              >
                <strong>Sample Preview:</strong>{" "}
                {students[0] ? generateRollNo(students[0], 0, rollFormat) : "001"}
              </div>

              <div className="form-actions">
                <AppButton
                  type="primary"
                  onClick={handleAutoGenerateApply}
                  disabled={saving}
                >
                  {saving ? "Applying..." : "Generate & Save to Database"}
                </AppButton>
                <AppButton
                  type="secondary"
                  onClick={() => setShowGeneratePopup(false)}
                >
                  Cancel
                </AppButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {showManualPopup && (
        <div className="popup-overlay">
          <div className="view-popup" style={{ maxWidth: "600px" }}>
            <div className="popup-head">
              <h2>Manual Roll Number Entry</h2>
              <button
                className="popup-close-btn"
                onClick={() => setShowManualPopup(false)}
              >
                ×
              </button>
            </div>

            <div style={{ maxHeight: "400px", overflowY: "auto", margin: "15px 0" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    <th style={{ padding: "8px", textAlign: "left" }}>Student Name</th>
                    <th style={{ padding: "8px", textAlign: "left" }}>Section</th>
                    <th style={{ padding: "8px", width: "140px" }}>Roll Number</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const sid = student._id || student.id;
                    return (
                      <tr key={sid} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "8px" }}>{student.studentName}</td>
                        <td style={{ padding: "8px" }}>{student.section || "—"}</td>
                        <td style={{ padding: "8px" }}>
                          <input
                            type="text"
                            value={manualRolls[sid] || ""}
                            onChange={(e) =>
                              setManualRolls({
                                ...manualRolls,
                                [sid]: e.target.value,
                              })
                            }
                            style={{
                              width: "100%",
                              padding: "6px 8px",
                              border: "1px solid #d1d5db",
                              borderRadius: "4px",
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="form-actions">
              <AppButton
                type="primary"
                onClick={handleSaveManual}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save All Roll Numbers"}
              </AppButton>
              <AppButton
                type="secondary"
                onClick={() => setShowManualPopup(false)}
              >
                Cancel
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RollNumberUpdate;