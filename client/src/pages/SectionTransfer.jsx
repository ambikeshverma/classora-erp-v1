import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./sectionTransfer.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { studentHubService } from "../services/api";

function SectionTransfer() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  const [classFilter, setClassFilter] = useState("");
  const [currentSectionFilter, setCurrentSectionFilter] = useState("");
  const [newSection, setNewSection] = useState("");
  const [searchText, setSearchText] = useState("");

  const [isSearched, setIsSearched] = useState(false);
  const [showTransferPopup, setShowTransferPopup] = useState(false);

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
      if (currentSectionFilter) params.section = currentSectionFilter;

      const res = await studentHubService.getStudentsForTransfer(params);
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

  const handleTransfer = async () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one student to transfer");
      return;
    }

    if (!newSection) {
      alert("Please select destination section");
      return;
    }

    if (newSection === currentSectionFilter) {
      alert("Destination section must be different from the current section");
      return;
    }

    try {
      setTransferring(true);
      const res = await studentHubService.bulkTransferSection({
        studentIds: selectedIds,
        toSection: newSection,
      });

      if (res.data?.success) {
        alert(res.data.message || "Students transferred successfully");
        setShowTransferPopup(false);
        setNewSection("");
        handleSearch();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to transfer students");
    } finally {
      setTransferring(false);
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
    <div className="section-transfer-page">
      <div className="common-page-header">
        <AppButton type="back" onClick={() => navigate("/student-hub")}>
          ←
        </AppButton>

        <div>
          <h1>Section Transfer</h1>
          <p>Reassign students across sections within the same class</p>
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
                setCurrentSectionFilter("");
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
              value={currentSectionFilter}
              onChange={(e) => setCurrentSectionFilter(e.target.value)}
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
              placeholder="Filter by name, admission no, roll no..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>

        <div className="search-btn-row">
          <AppButton type="primary" onClick={handleSearch}>
            Search Students
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
                onClick={() => {
                  if (selectedIds.length === 0) {
                    alert("Please select at least one student to transfer");
                    return;
                  }
                  setShowTransferPopup(true);
                }}
                disabled={students.length === 0}
              >
                Transfer Selected to New Section
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
                    <th>Current Section</th>
                    <th>Roll No</th>
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
                          <td>
                            <span className="badge-code">Section {item.section || item.sectionName || "—"}</span>
                          </td>
                          <td>{item.rollNo || item.rollNumber || "—"}</td>
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

      {showTransferPopup && (
        <div className="popup-overlay">
          <div className="view-popup">
            <div className="popup-head">
              <h2>Transfer {selectedIds.length} Student(s)</h2>
              <button
                className="popup-close-btn"
                onClick={() => setShowTransferPopup(false)}
              >
                ×
              </button>
            </div>

            <div style={{ padding: "10px 0" }}>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label>Select Target Section *</label>
                <select
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                >
                  <option value="">Select Destination Section</option>
                  {availableSections.map((s) => (
                    <option key={s._id || s.sectionName} value={s.sectionName}>
                      Section {s.sectionName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-actions">
                <AppButton
                  type="primary"
                  onClick={handleTransfer}
                  disabled={transferring}
                >
                  {transferring ? "Transferring..." : "Confirm Transfer"}
                </AppButton>
                <AppButton
                  type="secondary"
                  onClick={() => setShowTransferPopup(false)}
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

export default SectionTransfer;