import React, { useState } from "react";
import "./rollNumberUpdate.css";
import AppButton from "../components/AppButton";

function RollNumberUpdate() {
  const schoolId = localStorage.getItem("schoolId") || "SCH001";
  const currentSession = "2026-2027";

  const classOptions = [
    "Class 1",
    "Class 2",
    "Class 3",
    "Class 4",
    "Class 5",
    "Class 6",
  ];

  const sectionOptions = ["A", "B", "C"];

  const formatOptions = [
    "Numeric Only",
    "Class Wise",
    "Class + Section Wise",
    "Session + Class + Section Wise",
  ];

  const demoStudents = [
    {
      id: 1,
      schoolId: "SCH001",
      admissionNo: "ADM001",
      studentName: "Rahul Kumar",
      className: "Class 6",
      sectionName: "A",
      rollNo: "",
    },
    {
      id: 2,
      schoolId: "SCH001",
      admissionNo: "ADM002",
      studentName: "Priya Singh",
      className: "Class 6",
      sectionName: "A",
      rollNo: "",
    },
    {
      id: 3,
      schoolId: "SCH001",
      admissionNo: "ADM003",
      studentName: "Aman Verma",
      className: "Class 6",
      sectionName: "B",
      rollNo: "",
    },
  ];

  const [students, setStudents] = useState(demoStudents);
  const [selectedIds, setSelectedIds] = useState([]);

  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [searchText, setSearchText] = useState("");

  const [isSearched, setIsSearched] = useState(false);

  const [showGeneratePopup, setShowGeneratePopup] = useState(false);
  const [showManualPopup, setShowManualPopup] = useState(false);

  const [rollFormat, setRollFormat] = useState("Class + Section Wise");
  const [manualRolls, setManualRolls] = useState({});

  const [appliedFilters, setAppliedFilters] = useState({
    classFilter: "",
    sectionFilter: "",
    searchText: "",
  });

  const getClassCode = (className) => {
    return className.replace("Class ", "");
  };

  const getSessionCode = () => {
    return currentSession.split("-")[0];
  };

  const generateRollNo = (student, index, format) => {
    const number = String(index + 1).padStart(3, "0");
    const classCode = getClassCode(student.className);
    const sectionCode = student.sectionName;
    const sessionCode = getSessionCode();

    if (format === "Numeric Only") return number;

    if (format === "Class Wise") return `${classCode}-${number}`;

    if (format === "Class + Section Wise") {
      return `${classCode}${sectionCode}-${number}`;
    }

    if (format === "Session + Class + Section Wise") {
      return `${sessionCode}-${classCode}${sectionCode}-${number}`;
    }

    return number;
  };

  const getFilteredStudents = (filters) => {
    return students
      .filter((item) => {
        const schoolMatch = item.schoolId === schoolId;

        const classMatch = filters.classFilter
          ? item.className === filters.classFilter
          : true;

        const sectionMatch = filters.sectionFilter
          ? item.sectionName === filters.sectionFilter
          : true;

        const searchMatch = filters.searchText
          ? item.studentName
              .toLowerCase()
              .includes(filters.searchText.toLowerCase()) ||
            item.admissionNo
              .toLowerCase()
              .includes(filters.searchText.toLowerCase()) ||
            item.rollNo.toLowerCase().includes(filters.searchText.toLowerCase())
          : true;

        return schoolMatch && classMatch && sectionMatch && searchMatch;
      })
      .sort((a, b) => a.studentName.localeCompare(b.studentName));
  };

  const filteredStudents = getFilteredStudents(appliedFilters);

  const selectedStudents = filteredStudents.filter((item) =>
    selectedIds.includes(item.id)
  );

  const getPreview = () => {
    const sampleStudent = selectedStudents[0] || filteredStudents[0];

    if (!sampleStudent) return "-";

    return generateRollNo(sampleStudent, 0, rollFormat);
  };

  const handleSearch = () => {
    if (!classFilter) {
      alert("Please select class");
      return;
    }

    const filters = {
      classFilter,
      sectionFilter,
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

  const handleOpenGeneratePopup = () => {
    if (selectedIds.length === 0) {
      alert("Select at least one student");
      return;
    }

    setRollFormat("Class + Section Wise");
    setShowGeneratePopup(true);
  };

  const handleGenerateRollNumbers = () => {
    const studentsToGenerate = selectedStudents.sort((a, b) =>
      a.studentName.localeCompare(b.studentName)
    );

    setStudents((prev) =>
      prev.map((student) => {
        const index = studentsToGenerate.findIndex(
          (item) => item.id === student.id
        );

        if (index === -1) return student;

        return {
          ...student,
          rollNo: generateRollNo(student, index, rollFormat),
        };
      })
    );

    setSelectedIds([]);
    setShowGeneratePopup(false);
    alert("Roll numbers generated successfully");
  };

  const handleOpenManualPopup = () => {
    if (selectedIds.length === 0) {
      alert("Select at least one student");
      return;
    }

    const rollData = {};

    selectedStudents.forEach((student) => {
      rollData[student.id] = student.rollNo || "";
    });

    setManualRolls(rollData);
    setShowManualPopup(true);
  };

  const handleManualRollChange = (studentId, value) => {
    setManualRolls({
      ...manualRolls,
      [studentId]: value,
    });
  };

  const handleSaveManualRolls = () => {
    const rollNumbers = selectedStudents.map((student) =>
      (manualRolls[student.id] || "").trim()
    );

    const hasBlank = rollNumbers.some((roll) => roll === "");

    if (hasBlank) {
      alert("Blank roll number is not allowed");
      return;
    }

    const duplicateRoll = rollNumbers.find(
      (roll, index) => rollNumbers.indexOf(roll) !== index
    );

    if (duplicateRoll) {
      alert("Duplicate roll number found: " + duplicateRoll);
      return;
    }

    setStudents((prev) =>
      prev.map((student) =>
        selectedIds.includes(student.id)
          ? {
              ...student,
              rollNo: manualRolls[student.id].trim(),
            }
          : student
      )
    );

    setSelectedIds([]);
    setManualRolls({});
    setShowManualPopup(false);
    alert("Roll numbers saved successfully");
  };

  return (
    <div className="roll-page">
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
          <h1>Roll Number Update</h1>
          <p>Generate and update student roll numbers</p>
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
            <label>Section</label>

            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
            >
              <option value="">All</option>

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

        <div className="search-btn-row roll-actions">
          <AppButton type="primary" onClick={handleSearch}>
            Search
          </AppButton>
        </div>
      </div>

      <div className="common-card">
        <div className="list-header">
          <h2>Student Roll Number List</h2>

          <div className="list-action-buttons">
            <AppButton type="primary" onClick={handleOpenManualPopup}>
              Enable Manual Editing
            </AppButton>

            <AppButton type="primary" onClick={handleOpenGeneratePopup}>
              Auto Generate
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
                <th>Admission No</th>
                <th>Class</th>
                <th>Section</th>
                <th>Roll No</th>
              </tr>
            </thead>

            <tbody>
              {!isSearched ? (
                <tr>
                  <td colSpan="7" className="empty-row">
                    Click Search to view students
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-row">
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
                    <td>{student.rollNo || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showGeneratePopup && (
        <div className="popup-overlay">
          <div className="roll-popup">
            <div className="popup-head">
              <h2>Auto Generate Roll Number</h2>

              <button
                className="popup-close-btn"
                onClick={() => setShowGeneratePopup(false)}
              >
                ×
              </button>
            </div>

            <div className="form-group">
              <label>Roll Number Format</label>

              <select
                value={rollFormat}
                onChange={(e) => setRollFormat(e.target.value)}
              >
                {formatOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="preview-box">
              <strong>Preview:</strong> {getPreview()}
            </div>

            <div className="popup-actions">
              <AppButton type="primary" onClick={handleGenerateRollNumbers}>
                Generate
              </AppButton>
            </div>
          </div>
        </div>
      )}

      {showManualPopup && (
        <div className="popup-overlay">
          <div className="roll-popup large-popup">
            <div className="popup-head">
              <h2>Manual Roll Number Editing</h2>

              <button
                className="popup-close-btn"
                onClick={() => setShowManualPopup(false)}
              >
                ×
              </button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Student Name</th>
                    <th>Class</th>
                    <th>Section</th>
                    <th>Roll No</th>
                  </tr>
                </thead>

                <tbody>
                  {selectedStudents.map((student, index) => (
                    <tr key={student.id}>
                      <td>{index + 1}</td>
                      <td>{student.studentName}</td>
                      <td>{student.className}</td>
                      <td>{student.sectionName}</td>
                      <td>
                        <input
                          className="roll-input"
                          type="text"
                          value={manualRolls[student.id] || ""}
                          onChange={(e) =>
                            handleManualRollChange(student.id, e.target.value)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="popup-actions">
              <AppButton type="primary" onClick={handleSaveManualRolls}>
                Save
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RollNumberUpdate;