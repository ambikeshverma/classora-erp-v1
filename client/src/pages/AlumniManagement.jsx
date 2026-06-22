import React, { useState } from "react";
import "./alumniManagement.css";
import AppButton from "../components/AppButton";

function AlumniManagement() {
  const schoolId = localStorage.getItem("schoolId") || "SCH001";

  const demoAlumni = [
    {
      id: 1,
      schoolId: "SCH001",
      studentName: "Rohit Kumar",
      admissionNo: "ADM101",
      rollNo: "12A-001",
      passedOutSession: "2025-2026",
      lastClass: "Class 12",
      lastSection: "A",
      contactNumber: "9876543210",
      uploadedDocuments: ["TC", "Marksheet"],
    },
    {
      id: 2,
      schoolId: "SCH001",
      studentName: "Neha Singh",
      admissionNo: "ADM102",
      rollNo: "12B-004",
      passedOutSession: "2025-2026",
      lastClass: "Class 12",
      lastSection: "B",
      contactNumber: "9876543211",
      uploadedDocuments: ["TC", "Character Certificate"],
    },
  ];

  const [alumniList] = useState(demoAlumni);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewData, setViewData] = useState(null);

  const [sessionFilter, setSessionFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [searchText, setSearchText] = useState("");

  const [isSearched, setIsSearched] = useState(false);

  const [appliedFilters, setAppliedFilters] = useState({
    sessionFilter: "",
    classFilter: "",
    sectionFilter: "",
    searchText: "",
  });

  const getFilteredAlumni = (filters) => {
    return alumniList
      .filter((item) => {
        const schoolMatch = item.schoolId === schoolId;

        const sessionMatch = filters.sessionFilter
          ? item.passedOutSession === filters.sessionFilter
          : true;

        const classMatch = filters.classFilter
          ? item.lastClass === filters.classFilter
          : true;

        const sectionMatch = filters.sectionFilter
          ? item.lastSection === filters.sectionFilter
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
          sessionMatch &&
          classMatch &&
          sectionMatch &&
          searchMatch
        );
      })
      .sort((a, b) => a.studentName.localeCompare(b.studentName));
  };

  const handleSearch = () => {
    const filters = {
      sessionFilter,
      classFilter,
      sectionFilter,
      searchText,
    };

    setAppliedFilters(filters);

    const result = getFilteredAlumni(filters);

    if (result.length === 0) {
      alert("No alumni found");
    }

    setIsSearched(true);
    setSelectedIds([]);
  };

  const filteredAlumni = getFilteredAlumni(appliedFilters);

  const selectedAlumni = alumniList.filter((item) =>
    selectedIds.includes(item.id)
  );

  const selectedSingle = selectedAlumni.length === 1 ? selectedAlumni[0] : null;

  const handleDownloadDocument = (documentName) => {
    alert("Download started: " + documentName);
  };

  return (
    <div className="alumni-page">
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
          <h1>Alumni Management</h1>
          <p>Manage passed out student records</p>
        </div>
      </div>

      <div className="common-card">
        <div className="filter-grid">
          <div className="form-group">
            <label>Passed Out Session</label>

            <select
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="2024-2025">2024-2025</option>
              <option value="2025-2026">2025-2026</option>
              <option value="2026-2027">2026-2027</option>
            </select>
          </div>

          <div className="form-group">
            <label>Last Class</label>

            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="Class 10">Class 10</option>
              <option value="Class 12">Class 12</option>
            </select>
          </div>

          <div className="form-group">
            <label>Last Section</label>

            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </div>

          <div className="form-group">
            <label>Search</label>

            <input
              type="text"
              placeholder="Name, admission no or roll no"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>

        <div className="search-btn-row alumni-actions">
          <AppButton type="primary" onClick={handleSearch}>
            Search
          </AppButton>
        </div>
      </div>

      <div className="common-card">
        <div className="list-header">
          <h2>Alumni List</h2>

          <div className="list-action-buttons">
            <AppButton
              type="view"
              onClick={() => {
                if (!selectedSingle) {
                  alert("Select one alumni");
                  return;
                }

                setViewData(selectedSingle);
              }}
            >
              View Profile
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
                      filteredAlumni.length > 0 &&
                      selectedIds.length === filteredAlumni.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(filteredAlumni.map((item) => item.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                  />
                </th>

                <th>S.No</th>
                <th>Student Name</th>
                <th>Admission No</th>
                <th>Roll No</th>
                <th>Passed Out Session</th>
                <th>Last Class</th>
                <th>Last Section</th>
                <th>Contact Number</th>
              </tr>
            </thead>

            <tbody>
              {!isSearched ? (
                <tr>
                  <td colSpan="9" className="empty-row">
                    Click Search to view alumni
                  </td>
                </tr>
              ) : filteredAlumni.length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty-row">
                    No alumni found
                  </td>
                </tr>
              ) : (
                filteredAlumni.map((item, index) => (
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
                    <td>{item.studentName}</td>
                    <td>{item.admissionNo}</td>
                    <td>{item.rollNo}</td>
                    <td>{item.passedOutSession}</td>
                    <td>{item.lastClass}</td>
                    <td>{item.lastSection}</td>
                    <td>{item.contactNumber}</td>
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
              <h2>Alumni Profile</h2>

              <button className="popup-close-btn" onClick={() => setViewData(null)}>
                ×
              </button>
            </div>

            <div className="view-grid">
              <p>
                <strong>Student Name:</strong> {viewData.studentName}
              </p>

              <p>
                <strong>Admission No:</strong> {viewData.admissionNo}
              </p>

              <p>
                <strong>Roll No:</strong> {viewData.rollNo}
              </p>

              <p>
                <strong>Passed Out Session:</strong>{" "}
                {viewData.passedOutSession}
              </p>

              <p>
                <strong>Last Class:</strong> {viewData.lastClass}
              </p>

              <p>
                <strong>Last Section:</strong> {viewData.lastSection}
              </p>

              <p>
                <strong>Contact Number:</strong> {viewData.contactNumber}
              </p>
            </div>

            <div className="uploaded-documents-box">
              <h3>Uploaded Documents</h3>

              {viewData.uploadedDocuments.length === 0 ? (
                <div className="empty-row">No document uploaded</div>
              ) : (
                <div className="document-download-list">
                  {viewData.uploadedDocuments.map((doc) => (
                    <div className="document-download-row" key={doc}>
                      <span>{doc}</span>

                      <AppButton
                        type="primary"
                        onClick={() => handleDownloadDocument(doc)}
                      >
                        Download
                      </AppButton>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AlumniManagement;