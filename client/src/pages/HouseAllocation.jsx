import React, { useState } from "react";
import "./houseAllocation.css";
import AppButton from "../components/AppButton";

function HouseAllocation() {
  // Demo master data
  // Later backend se aayega

  const classOptions = [
    "Class 1",
    "Class 2",
    "Class 3",
    "Class 4",
    "Class 5",
    "Class 6",
    "Class 7",
    "Class 8",
  ];

  const sectionOptions = ["A", "B", "C"];

  const houseOptions = ["Red House", "Blue House", "Green House", "Yellow House"];

  const demoStudents = [
    {
      id: 1,
      admissionNo: "ADM001",
      studentName: "Rahul Kumar",
      className: "Class 6",
      sectionName: "A",
      houseName: "",
      status: "Not Allocated",
    },

    {
      id: 2,
      admissionNo: "ADM002",
      studentName: "Aman Singh",
      className: "Class 7",
      sectionName: "B",
      houseName: "Red House",
      status: "Allocated",
    },
  ];

  const [students, setStudents] = useState(demoStudents);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewData, setViewData] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [houseFilter, setHouseFilter] = useState("");
  const [selectedHouse, setSelectedHouse] = useState("");

  const [isSearched, setIsSearched] = useState(false);

  const [appliedFilters, setAppliedFilters] = useState({
    searchText: "",
    classFilter: "",
    sectionFilter: "",
    houseFilter: "",
  });

  const handleSearch = () => {
    const filters = {
      searchText,
      classFilter,
      sectionFilter,
      houseFilter,
    };

    setAppliedFilters(filters);

    const result = students.filter((item) => {
      const classMatch = filters.classFilter
        ? item.className === filters.classFilter
        : true;

      const sectionMatch = filters.sectionFilter
        ? item.sectionName === filters.sectionFilter
        : true;

      const houseMatch = filters.houseFilter
        ? filters.houseFilter === "Not Allocated"
          ? !item.houseName
          : item.houseName === filters.houseFilter
        : true;

      const searchMatch = filters.searchText
        ? item.studentName
            .toLowerCase()
            .includes(filters.searchText.toLowerCase()) ||
          item.admissionNo
            .toLowerCase()
            .includes(filters.searchText.toLowerCase())
        : true;

      return classMatch && sectionMatch && houseMatch && searchMatch;
    });

    if (result.length === 0) {
      alert("No student found");
    }

    setIsSearched(true);
    setSelectedIds([]);
  };

  const filteredStudents = students.filter((item) => {
    const classMatch = appliedFilters.classFilter
      ? item.className === appliedFilters.classFilter
      : true;

    const sectionMatch = appliedFilters.sectionFilter
      ? item.sectionName === appliedFilters.sectionFilter
      : true;

    const houseMatch = appliedFilters.houseFilter
      ? appliedFilters.houseFilter === "Not Allocated"
        ? !item.houseName
        : item.houseName === appliedFilters.houseFilter
      : true;

    const searchMatch = appliedFilters.searchText
      ? item.studentName
          .toLowerCase()
          .includes(appliedFilters.searchText.toLowerCase()) ||
        item.admissionNo
          .toLowerCase()
          .includes(appliedFilters.searchText.toLowerCase())
      : true;

    return classMatch && sectionMatch && houseMatch && searchMatch;
  });

  const selectedStudents = students.filter((item) =>
    selectedIds.includes(item.id)
  );

  const selectedSingle =
    selectedStudents.length === 1 ? selectedStudents[0] : null;

  const handleAllocateHouse = () => {
    if (!selectedHouse) {
      alert("Select house");
      return;
    }

    if (selectedIds.length === 0) {
      alert("Select student");
      return;
    }

    setStudents(
      students.map((item) =>
        selectedIds.includes(item.id)
          ? {
              ...item,
              houseName: selectedHouse,
              status: "Allocated",
            }
          : item
      )
    );

    alert("House allocated successfully");

    setSelectedIds([]);
    setSelectedHouse("");
  };

  const handleRemoveAllocation = () => {
    if (selectedIds.length === 0) {
      alert("Select student");
      return;
    }

    const hasNotAllocatedStudent = selectedStudents.some(
      (item) => !item.houseName
    );

    if (hasNotAllocatedStudent) {
      alert("Selected student has no house allocated");
      return;
    }

    const ok = window.confirm("Remove house allocation?");

    if (!ok) return;

    setStudents(
      students.map((item) =>
        selectedIds.includes(item.id)
          ? {
              ...item,
              houseName: "",
              status: "Not Allocated",
            }
          : item
      )
    );

    setSelectedIds([]);
  };

  return (
    <div className="house-allocation-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => (window.location.href = "/student-hub")}
        >
          ←
        </AppButton>

        <div>
          <h1>House Allocation</h1>

          <p>Allocate houses to students</p>
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
            <label>House</label>

            <select
              value={houseFilter}
              onChange={(e) => setHouseFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="Not Allocated">Not Allocated</option>

              {houseOptions.map((item) => (
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
              placeholder="Student name or admission no"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
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
          <h2>Student Allocation List</h2>

          <div className="list-action-buttons">
            <div className="form-group">
              <select
                value={selectedHouse}
                onChange={(e) => setSelectedHouse(e.target.value)}
              >
                <option value="">Select House</option>

                {houseOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <AppButton type="primary" onClick={handleAllocateHouse}>
              {selectedSingle?.houseName ? "Change House" : "Allocate House"}
            </AppButton>

            <AppButton
              type="view"
              onClick={() => {
                if (!selectedSingle) {
                  alert("Select one student");
                  return;
                }

                setViewData(selectedSingle);
              }}
            >
              View
            </AppButton>

            <AppButton type="delete" onClick={handleRemoveAllocation}>
              Remove Allocation
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
                <th>Admission No</th>
                <th>Student Name</th>
                <th>Class</th>
                <th>Section</th>
                <th>House</th>
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
                filteredStudents.map((item, index) => (
                  <tr key={item.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => {
                          setSelectedIds((prev) =>
                            prev.includes(item.id)
                              ? prev.filter((id) => id !== item.id)
                              : [...prev, item.id]
                          );
                        }}
                      />
                    </td>

                    <td>{index + 1}</td>
                    <td>{item.admissionNo}</td>
                    <td>{item.studentName}</td>
                    <td>{item.className}</td>
                    <td>{item.sectionName}</td>
                    <td>{item.houseName || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewData && (
        <div className="popup-overlay">
          <div className="view-popup">
            <div className="popup-head">
              <h2>Student House Details</h2>

              <button
                className="popup-close-btn"
                onClick={() => setViewData(null)}
              >
                ×
              </button>
            </div>

            <div className="view-grid">
              <p>
                <strong>Admission No:</strong> {viewData.admissionNo}
              </p>

              <p>
                <strong>Student Name:</strong> {viewData.studentName}
              </p>

              <p>
                <strong>Class:</strong> {viewData.className}
              </p>

              <p>
                <strong>Section:</strong> {viewData.sectionName}
              </p>

              <p>
                <strong>House:</strong>{" "}
                {viewData.houseName || "Not Allocated"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HouseAllocation;