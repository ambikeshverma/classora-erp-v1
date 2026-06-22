import React, { useState } from "react";
import "./promotionManagement.css";
import AppButton from "../components/AppButton";

function PromotionManagement() {
  const schoolId = localStorage.getItem("schoolId") || "SCH001";

  const classOptions = [
    "Class 1", "Class 2", "Class 3", "Class 4",
    "Class 5", "Class 6", "Class 7", "Class 8",
    "Class 9", "Class 10", "Class 11", "Class 12",
  ];

  const sectionOptions = ["A", "B", "C", "D"];
  const resultStatuses = ["Pass", "Fail", "Pending"];
  const promotionTypes = ["Promote", "Detain", "Transfer", "Alumni"];

  const demoStudents = [
    {
      id: 1,
      schoolId: "SCH001",
      studentName: "Rahul Kumar",
      admissionNo: "ADM001",
      className: "Class 6",
      sectionName: "A",
      rollNo: "6A-001",
      resultStatus: "Pass",
      promotionStatus: "Not Updated",
      studentStatus: "Active",
    },
    {
      id: 2,
      schoolId: "SCH001",
      studentName: "Priya Singh",
      admissionNo: "ADM002",
      className: "Class 6",
      sectionName: "A",
      rollNo: "6A-002",
      resultStatus: "Pass",
      promotionStatus: "Not Updated",
      studentStatus: "Active",
    },
    {
      id: 3,
      schoolId: "SCH001",
      studentName: "Aman Verma",
      admissionNo: "ADM003",
      className: "Class 6",
      sectionName: "B",
      rollNo: "6B-001",
      resultStatus: "Fail",
      promotionStatus: "Not Updated",
      studentStatus: "Active",
    },
  ];

  const [students, setStudents] = useState(demoStudents);
  const [selectedIds, setSelectedIds] = useState([]);

  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [resultFilter, setResultFilter] = useState("");
  const [searchText, setSearchText] = useState("");

  const [promotionType, setPromotionType] = useState("");
  const [targetClass, setTargetClass] = useState("");
  const [targetSection, setTargetSection] = useState("");
  const [showPromotionPopup, setShowPromotionPopup] = useState(false);

  const [isSearched, setIsSearched] = useState(false);

  const [appliedFilters, setAppliedFilters] = useState({
    classFilter: "",
    sectionFilter: "",
    resultFilter: "",
    searchText: "",
  });

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

        const resultMatch = filters.resultFilter
          ? item.resultStatus === filters.resultFilter
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

        return (
          schoolMatch &&
          classMatch &&
          sectionMatch &&
          resultMatch &&
          searchMatch &&
          item.studentStatus === "Active"
        );
      })
      .sort((a, b) => a.studentName.localeCompare(b.studentName));
  };

  const handleSearch = () => {
    if (!classFilter || !sectionFilter) {
      alert("Select current class and section");
      return;
    }

    const filters = {
      classFilter,
      sectionFilter,
      resultFilter,
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

  const handleOpenPromotionPopup = () => {
    if (selectedIds.length === 0) {
      alert("Select student");
      return;
    }

    setPromotionType("");
    setTargetClass("");
    setTargetSection("");
    setShowPromotionPopup(true);
  };

  const handlePromotionUpdate = () => {
    if (!promotionType) {
      alert("Select promotion type");
      return;
    }

    if (promotionType === "Promote" && (!targetClass || !targetSection)) {
      alert("Select target class and section");
      return;
    }

    const ok = window.confirm("Update selected students?");

    if (!ok) return;

    setStudents(
      students.map((item) => {
        if (!selectedIds.includes(item.id)) {
          return item;
        }

        if (promotionType === "Promote") {
          return {
            ...item,
            className: targetClass,
            sectionName: targetSection,
            promotionStatus: "Promote",
          };
        }

        if (promotionType === "Detain") {
          return {
            ...item,
            promotionStatus: "Detain",
          };
        }

        if (promotionType === "Transfer") {
          return {
            ...item,
            studentStatus: "Transfer",
            promotionStatus: "Transfer",
          };
        }

        if (promotionType === "Alumni") {
          return {
            ...item,
            studentStatus: "Alumni",
            promotionStatus: "Alumni",
          };
        }

        return item;
      })
    );

    alert("Promotion updated successfully");

    setSelectedIds([]);
    setPromotionType("");
    setTargetClass("");
    setTargetSection("");
    setShowPromotionPopup(false);
  };

  return (
    <div className="promotion-page">
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
          <h1>Promotion Management</h1>
          <p>Promote, detain, transfer or move students to alumni</p>
        </div>
      </div>

      <div className="common-card">
        <div className="filter-grid">
          <div className="form-group">
            <label>Current Class</label>
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
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
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
            <label>Result Status</label>
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
            >
              <option value="">All</option>
              {resultStatuses.map((item) => (
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

        <div className="search-btn-row promotion-actions">
          <AppButton type="primary" onClick={handleSearch}>
            Search
          </AppButton>
        </div>
      </div>

      <div className="common-card">
        <div className="list-header">
          <h2>Student List</h2>

          <div className="list-action-buttons">
            <AppButton type="primary" onClick={handleOpenPromotionPopup}>
              Promote Students
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
                <th>Result Status</th>
                <th>Promotion Status</th>
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
                    <td>{student.resultStatus}</td>
                    <td>{student.promotionStatus}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showPromotionPopup && (
        <div className="popup-overlay">
          <div className="promotion-popup">
            <div className="popup-head">
              <h2>Promotion Update</h2>

              <button
                className="popup-close-btn"
                onClick={() => setShowPromotionPopup(false)}
              >
                ×
              </button>
            </div>

            <div className="popup-form-grid">
              <div className="form-group">
                <label>Promotion Type</label>
                <select
                  value={promotionType}
                  onChange={(e) => {
                    setPromotionType(e.target.value);
                    setTargetClass("");
                    setTargetSection("");
                  }}
                >
                  <option value="">Select Promotion Type</option>
                  {promotionTypes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {promotionType === "Promote" && (
                <>
                  <div className="form-group">
                    <label>Target Class</label>
                    <select
                      value={targetClass}
                      onChange={(e) => setTargetClass(e.target.value)}
                    >
                      <option value="">Select Target Class</option>
                      {classOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Target Section</label>
                    <select
                      value={targetSection}
                      onChange={(e) => setTargetSection(e.target.value)}
                    >
                      <option value="">Select Target Section</option>
                      {sectionOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="popup-actions">
              <AppButton type="primary" onClick={handlePromotionUpdate}>
                Update
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PromotionManagement;