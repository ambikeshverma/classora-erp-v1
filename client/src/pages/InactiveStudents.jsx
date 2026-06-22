import React, { useState } from "react";
import "./inactiveStudents.css";
import AppButton from "../components/AppButton";

function InactiveStudents() {
  const schoolId = localStorage.getItem("schoolId") || "SCH001";

  const classOptions = [
    "Class 1", "Class 2", "Class 3", "Class 4",
    "Class 5", "Class 6", "Class 7", "Class 8",
    "Class 9", "Class 10", "Class 11", "Class 12",
  ];

  const sectionOptions = ["A", "B", "C", "D"];

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
      inactiveReason: "",
    },
    {
      id: 2,
      schoolId: "SCH001",
      studentName: "Priya Singh",
      admissionNo: "ADM002",
      className: "Class 6",
      sectionName: "A",
      rollNo: "6A-002",
      status: "Inactive",
      inactiveReason: "Left School",
    },
    {
      id: 3,
      schoolId: "SCH001",
      studentName: "Aman Verma",
      admissionNo: "ADM003",
      className: "Class 7",
      sectionName: "B",
      rollNo: "7B-001",
      status: "Active",
      inactiveReason: "",
    },
  ];

  const [students, setStudents] = useState(demoStudents);
  const [selectedIds, setSelectedIds] = useState([]);

  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [inactiveReasonFilter, setInactiveReasonFilter] = useState("");
  const [searchText, setSearchText] = useState("");

  const [isSearched, setIsSearched] = useState(false);

  const [showInactivePopup, setShowInactivePopup] = useState(false);
  const [inactiveReason, setInactiveReason] = useState("");

  const [appliedFilters, setAppliedFilters] = useState({
    classFilter: "",
    sectionFilter: "",
    inactiveReasonFilter: "",
    searchText: "",
  });

  const getFilteredStudents = (filters) => {
    return students.filter((item) => {
      const schoolMatch = item.schoolId === schoolId;

      const classMatch = filters.classFilter
        ? item.className === filters.classFilter
        : true;

      const sectionMatch = filters.sectionFilter
        ? item.sectionName === filters.sectionFilter
        : true;

      const reasonMatch = filters.inactiveReasonFilter
        ? item.inactiveReason === filters.inactiveReasonFilter
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

      return (
        schoolMatch &&
        classMatch &&
        sectionMatch &&
        reasonMatch &&
        searchMatch
      );
    });
  };

  const handleSearch = () => {
    const filters = {
      classFilter,
      sectionFilter,
      inactiveReasonFilter,
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

  const selectedStudents = students.filter((item) =>
    selectedIds.includes(item.id)
  );

  const allSelectedActive =
    selectedStudents.length > 0 &&
    selectedStudents.every((item) => item.status === "Active");

  const allSelectedInactive =
    selectedStudents.length > 0 &&
    selectedStudents.every((item) => item.status === "Inactive");

  const isMixedSelection =
    selectedStudents.length > 0 &&
    !allSelectedActive &&
    !allSelectedInactive;

  const smartButtonText = isMixedSelection
    ? "Mixed Selection"
    : allSelectedInactive
    ? "Reactivate"
    : "Mark Inactive";

  const handleSmartAction = () => {
    if (selectedIds.length === 0) {
      alert("Select student");
      return;
    }

    if (isMixedSelection) {
      return;
    }

    if (allSelectedActive) {
      setInactiveReason("");
      setShowInactivePopup(true);
      return;
    }

    if (allSelectedInactive) {
      const ok = window.confirm("Reactivate selected students?");
      if (!ok) return;

      setStudents((prev) =>
        prev.map((student) =>
          selectedIds.includes(student.id)
            ? {
                ...student,
                status: "Active",
                inactiveReason: "",
              }
            : student
        )
      );

      alert("Students reactivated successfully");
      setSelectedIds([]);
    }
  };

  const handleConfirmInactive = () => {
    if (!inactiveReason) {
      alert("Select inactive reason");
      return;
    }

    setStudents((prev) =>
      prev.map((student) =>
        selectedIds.includes(student.id)
          ? {
              ...student,
              status: "Inactive",
              inactiveReason,
            }
          : student
      )
    );

    alert("Students marked inactive successfully");

    setSelectedIds([]);
    setInactiveReason("");
    setShowInactivePopup(false);
  };

  return (
    <div className="inactive-page">
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
          <h1>Inactive Students</h1>
          <p>Manage inactive and reactivated students</p>
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
              <option value="">All</option>
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
            <label>Inactive Reason</label>
            <select
              value={inactiveReasonFilter}
              onChange={(e) => setInactiveReasonFilter(e.target.value)}
            >
              <option value="">All</option>
              {inactiveReasons.map((item) => (
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

        <div className="search-btn-row inactive-actions">
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
              onClick={handleSmartAction}
              disabled={selectedIds.length === 0 || isMixedSelection}
            >
              {smartButtonText}
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
                <th>Section</th>
                <th>Roll Number</th>
                <th>Status</th>
                <th>Inactive Reason</th>
              </tr>
            </thead>

            <tbody>
              {!isSearched ? (
                <tr>
                  <td colSpan="9" className="empty-row">
                    Click Search to view students
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty-row">
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
                    <td>{student.rollNo}</td>
                    <td>{student.status}</td>
                    <td>{student.inactiveReason || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showInactivePopup && (
        <div className="popup-overlay">
          <div className="inactive-popup">
            <div className="popup-head">
              <h2>Mark Student Inactive</h2>

              <button
                className="popup-close-btn"
                onClick={() => {
                  setShowInactivePopup(false);
                  setInactiveReason("");
                }}
              >
                ×
              </button>
            </div>

            <div className="form-group">
              <label>Inactive Reason</label>
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

            <div className="popup-actions">
              <AppButton type="primary" onClick={handleConfirmInactive}>
                Inactive
              </AppButton>

              <AppButton
                type="secondary"
                onClick={() => {
                  setShowInactivePopup(false);
                  setInactiveReason("");
                }}
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

export default InactiveStudents;