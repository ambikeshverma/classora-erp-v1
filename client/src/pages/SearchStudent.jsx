import React, { useState } from "react";
import "./searchStudent.css";
import AppButton from "../components/AppButton";

function SearchStudent() {
  const schoolId = localStorage.getItem("schoolId") || "SCH001";

  const classOptions = [
    "Class 1",
    "Class 2",
    "Class 3",
    "Class 4",
    "Class 5",
    "Class 6",
    "Class 7",
    "Class 8",
    "Class 9",
    "Class 10",
    "Class 11",
    "Class 12",
  ];

  const sectionOptions = ["A", "B", "C", "D"];

  const demoStudents = [
    {
      id: 1,
      schoolId: "SCH001",
      studentName: "Rahul Kumar",
      fatherName: "Sunil Kumar",
      admissionNo: "ADM001",
      rollNo: "6A-001",
      className: "Class 6",
      sectionName: "A",
      mobile: "9876543210",
      status: "Active",
    },
    {
      id: 2,
      schoolId: "SCH001",
      studentName: "Priya Singh",
      fatherName: "Dinesh Singh",
      admissionNo: "ADM002",
      rollNo: "6A-002",
      className: "Class 6",
      sectionName: "A",
      mobile: "9876543211",
      status: "Active",
    },
    {
      id: 3,
      schoolId: "SCH001",
      studentName: "Aman Verma",
      fatherName: "Rakesh Verma",
      admissionNo: "ADM003",
      rollNo: "7B-001",
      className: "Class 7",
      sectionName: "B",
      mobile: "9876543212",
      status: "Inactive",
    },
  ];

  const [students] = useState(demoStudents);
  const [selectedIds, setSelectedIds] = useState([]);

  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [searchText, setSearchText] = useState("");

  const [isSearched, setIsSearched] = useState(false);

  const [appliedFilters, setAppliedFilters] = useState({
    classFilter: "",
    sectionFilter: "",
    searchText: "",
  });

  const getFilteredStudents = (filters) => {
    return students.filter((item) => {
      const schoolMatch = item.schoolId === schoolId;

      const activeMatch = item.status === "Active";

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
          item.fatherName
            .toLowerCase()
            .includes(filters.searchText.toLowerCase()) ||
          item.admissionNo
            .toLowerCase()
            .includes(filters.searchText.toLowerCase()) ||
          item.rollNo
            .toLowerCase()
            .includes(filters.searchText.toLowerCase()) ||
          item.mobile.includes(filters.searchText)
        : true;

      return schoolMatch && activeMatch && classMatch && sectionMatch && searchMatch;
    });
  };

  const handleSearch = () => {
    const filters = {
      classFilter,
      sectionFilter,
      searchText,
    };

    setAppliedFilters(filters);

    const result = getFilteredStudents(filters);

    if (result.length === 0) {
      alert("No active student found");
    }

    setIsSearched(true);
    setSelectedIds([]);
  };

  const filteredStudents = getFilteredStudents(appliedFilters);

  const selectedStudents = students.filter((item) =>
    selectedIds.includes(item.id)
  );

  const selectedSingle =
    selectedStudents.length === 1 ? selectedStudents[0] : null;

  const validateSingleStudent = () => {
    if (selectedIds.length === 0) {
      alert("Select one student");
      return false;
    }

    if (selectedIds.length > 1) {
      alert("Select only one student");
      return false;
    }

    return true;
  };

  const handleOpenProfile = () => {
    if (!validateSingleStudent()) return;

    alert("Open profile: " + selectedSingle.studentName);
  };

  const handleFeeSubmit = () => {
    if (!validateSingleStudent()) return;

    alert("Open fee submit: " + selectedSingle.studentName);
  };

  return (
    <div className="search-student-page">
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
          <h1>Student Search</h1>
          <p>Search active students and open profile or fee submit</p>
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
            <label>Search Student</label>
            <input
              type="text"
              placeholder="Search by name, admission no, roll no or mobile"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>

        <div className="search-btn-row search-actions">
          <AppButton type="primary" onClick={handleSearch}>
            Search
          </AppButton>
        </div>
      </div>

      <div className="common-card">
        <div className="list-header">
          <h2>Student List</h2>

          <div className="list-action-buttons">
            <AppButton type="view" onClick={handleOpenProfile}>
              View Profile
            </AppButton>

            <AppButton type="primary" onClick={handleFeeSubmit}>
              Collect Fee
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
                        setSelectedIds(
                          filteredStudents.map((item) => item.id)
                        );
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                  />
                </th>

                <th>S.No</th>
                <th>Admission No</th>
                <th>Roll No</th>
                <th>Class</th>
                <th>Section</th>
                <th>Student Name</th>
                <th>Father Name</th>
                <th>Mobile</th>
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
                    No active student found
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
                    <td>{student.admissionNo}</td>
                    <td>{student.rollNo}</td>
                    <td>{student.className}</td>
                    <td>{student.sectionName}</td>
                    <td>{student.studentName}</td>
                    <td>{student.fatherName}</td>
                    <td>{student.mobile}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SearchStudent;