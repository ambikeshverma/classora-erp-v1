import React, { useState } from "react";
import "./sectionTransfer.css";
import AppButton from "../components/AppButton";

function SectionTransfer() {
  const schoolId = localStorage.getItem("schoolId") || "SCH001";

  const classOptions = [
    "Class 1",
    "Class 2",
    "Class 3",
    "Class 4",
    "Class 5",
    "Class 6",
  ];

  const sectionOptions = ["A", "B", "C", "D"];

  const demoStudents = [
    {
      id: 1,
      schoolId: "SCH001",
      studentName: "Rahul Kumar",
      admissionNo: "ADM001",
      className: "Class 6",
      sectionName: "A",
      rollNo: "6A-001",
      status: "Active",
    },
    {
      id: 2,
      schoolId: "SCH001",
      studentName: "Priya Singh",
      admissionNo: "ADM002",
      className: "Class 6",
      sectionName: "A",
      rollNo: "6A-002",
      status: "Active",
    },
    {
      id: 3,
      schoolId: "SCH001",
      studentName: "Aman Verma",
      admissionNo: "ADM003",
      className: "Class 6",
      sectionName: "B",
      rollNo: "6B-001",
      status: "Active",
    },
  ];

  const [students, setStudents] = useState(demoStudents);
  const [selectedIds, setSelectedIds] = useState([]);

  const [classFilter, setClassFilter] = useState("");
  const [currentSectionFilter, setCurrentSectionFilter] = useState("");
  const [newSection, setNewSection] = useState("");
  const [searchText, setSearchText] = useState("");

  const [isSearched, setIsSearched] = useState(false);
  const [showTransferPopup, setShowTransferPopup] = useState(false);

  const [appliedFilters, setAppliedFilters] = useState({
    classFilter: "",
    currentSectionFilter: "",
    searchText: "",
  });

  const getFilteredStudents = (filters) => {
    return students
      .filter((item) => {
        const schoolMatch = item.schoolId === schoolId;

        const classMatch = filters.classFilter
          ? item.className === filters.classFilter
          : true;

        const sectionMatch = filters.currentSectionFilter
          ? item.sectionName === filters.currentSectionFilter
          : true;

        const searchMatch = filters.searchText
          ? item.studentName
              .toLowerCase()
              .includes(filters.searchText.toLowerCase()) ||
            item.admissionNo
              .toLowerCase()
              .includes(filters.searchText.toLowerCase()) ||
            item.rollNo
              .toLowerCase()
              .includes(filters.searchText.toLowerCase())
          : true;

        return schoolMatch && classMatch && sectionMatch && searchMatch;
      })
      .sort((a, b) => a.studentName.localeCompare(b.studentName));
  };

  const handleSearch = () => {
    if (!classFilter || !currentSectionFilter) {
      alert("Select class and current section");
      return;
    }

    const filters = {
      classFilter,
      currentSectionFilter,
      searchText,
    };

    setAppliedFilters(filters);

    const result = getFilteredStudents(filters);

    if (result.length === 0) {
      alert("No student found");
    }

    setIsSearched(true);
    setSelectedIds([]);
  };

  const filteredStudents = getFilteredStudents(appliedFilters);

  const handleTransfer = () => {
    if (selectedIds.length === 0) {
      alert("Select student");
      return;
    }

    if (!newSection) {
      alert("Select destination section");
      return;
    }

    if (newSection === currentSectionFilter) {
      alert("Current section and new section cannot be same");
      return;
    }

    const ok = window.confirm("Transfer selected students?");

    if (!ok) return;

    setStudents(
      students.map((student) => {
        if (!selectedIds.includes(student.id)) {
          return student;
        }

        return {
          ...student,
          sectionName: newSection,
        };
      })
    );

    alert("Section transferred successfully");

    setSelectedIds([]);
    setNewSection("");
    setShowTransferPopup(false);
  };

  return (
    <div className="section-transfer-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => {
            window.location.href = "/student-hub";
          }}
        >
          ←
        </AppButton>

        <div>
          <h1>Section Transfer</h1>
          <p>Transfer students between sections</p>
        </div>
      </div>

      <div className="common-card">
        <div className="filter-grid">
          <div className="form-group">
            <label>Class</label>

            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value="">Select Class</option>

              {classOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
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
              <option value="">Select Section</option>

              {sectionOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Search Student</label>

            <input
              type="text"
              placeholder="Name, admission no or roll no"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>

        <div className="search-btn-row section-actions">
          <AppButton type="primary" onClick={handleSearch}>
            Search
          </AppButton>
        </div>
      </div>

      <div className="common-card">
        <div className="list-header">
          <h2>Student List</h2>

          <div className="list-action-buttons">
            <AppButton
              type="primary"
              onClick={() => {
                if (selectedIds.length === 0) {
                  alert("Select student");
                  return;
                }

                setShowTransferPopup(true);
              }}
            >
              Transfer Section
            </AppButton>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={
                      isSearched &&
                      filteredStudents.length > 0 &&
                      selectedIds.length === filteredStudents.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(filteredStudents.map((item) => item.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                  />
                </th>

                <th>S.No</th>
                <th>Student Name</th>
                <th>Admission Number</th>
                <th>Class</th>
                <th>Current Section</th>
              </tr>
            </thead>

            <tbody>
              {!isSearched ? (
                <tr>
                  <td colSpan="6" className="empty-row">
                    Click Search to view students
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-row">
                    No student found
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, index) => (
                  <tr key={student.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(student.id)}
                        onChange={() => {
                          setSelectedIds((prev) =>
                            prev.includes(student.id)
                              ? prev.filter((id) => id !== student.id)
                              : [...prev, student.id]
                          );
                        }}
                      />
                    </td>

                    <td>{index + 1}</td>
                    <td>{student.studentName}</td>
                    <td>{student.admissionNo}</td>
                    <td>{student.className}</td>
                    <td>{student.sectionName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showTransferPopup && (
        <div className="popup-overlay">
          <div className="view-popup">
            <div className="popup-head">
              <h2>Transfer Section</h2>

              <button
                className="popup-close-btn"
                onClick={() => setShowTransferPopup(false)}
              >
                ×
              </button>
            </div>

            <div className="form-group">
              <label>New Section</label>

              <select
                value={newSection}
                onChange={(e) => setNewSection(e.target.value)}
              >
                <option value="">Select New Section</option>

                {sectionOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <AppButton type="primary" onClick={handleTransfer}>
                Transfer
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SectionTransfer;