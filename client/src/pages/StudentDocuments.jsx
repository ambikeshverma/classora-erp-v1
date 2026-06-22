import React, { useState } from "react";
import "./studentDocuments.css";
import AppButton from "../components/AppButton";

function StudentDocuments() {
  const schoolId = localStorage.getItem("schoolId") || "SCH001";

  const classOptions = [
    "Class 1", "Class 2", "Class 3", "Class 4",
    "Class 5", "Class 6", "Class 7", "Class 8",
    "Class 9", "Class 10", "Class 11", "Class 12",
  ];

  const sectionOptions = ["A", "B", "C", "D"];

  const documentTypes = [
    "Admission Form",
    "Student Image",
    "Family Photo",
    "Student Aadhaar Card",
    "Father Aadhaar Card",
    "Mother Aadhaar Card",
    "Guardian Aadhaar Card",
    "Birth Certificate",
    "DOB Certificate",
    "Previous School TC",
    "Current School TC",
    "Migration Certificate",
    "Character Certificate",
    "Medical Certificate",
    "Fitness Certificate",
    "Blood Group Report",
    "Income Certificate",
    "Caste Certificate",
    "EWS Certificate",
    "Domicile Certificate",
    "Address Proof",
    "Electricity Bill",
    "Ration Card",
    "Bank Passbook",
    "Cheque Copy",
    "Father Photo",
    "Mother Photo",
    "Guardian Photo",
    "Father Signature",
    "Mother Signature",
    "Student Signature",
    "Scholarship Form",
    "Scholarship Proof",
    "Transport Form",
    "Bus Route Approval",
    "Court Affidavit",
    "Notary Document",
    "Adoption Certificate",
    "Disability Certificate",
    "Marksheet",
    "Board Certificate",
    "Leave Certificate",
    "Concession Form",
    "Other",
  ];

  const demoStudents = [
    {
      id: 1,
      schoolId: "SCH001",
      studentName: "Rahul Kumar",
      className: "Class 6",
      sectionName: "A",
      uploadedDocuments: ["Student Image"],
    },
    {
      id: 2,
      schoolId: "SCH001",
      studentName: "Priya Singh",
      className: "Class 7",
      sectionName: "B",
      uploadedDocuments: ["Student Image", "Student Aadhaar Card"],
    },
    {
      id: 3,
      schoolId: "SCH001",
      studentName: "Aman Verma",
      className: "Class 8",
      sectionName: "C",
      uploadedDocuments: [],
    },
  ];

  const [students, setStudents] = useState(demoStudents);
  const [selectedIds, setSelectedIds] = useState([]);

  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [searchText, setSearchText] = useState("");
  const [showMissingOnly, setShowMissingOnly] = useState(true);

  const [isSearched, setIsSearched] = useState(false);

  const [appliedFilters, setAppliedFilters] = useState({
    classFilter: "",
    sectionFilter: "",
    documentType: "",
    searchText: "",
    showMissingOnly: true,
  });

  const getFilteredStudents = (filters) => {
    return students.filter((student) => {
      const schoolMatch = student.schoolId === schoolId;

      const classMatch = filters.classFilter
        ? student.className === filters.classFilter
        : true;

      const sectionMatch = filters.sectionFilter
        ? student.sectionName === filters.sectionFilter
        : true;

      const searchMatch = filters.searchText
        ? student.studentName
            .toLowerCase()
            .includes(filters.searchText.toLowerCase())
        : true;

      const missingMatch = filters.showMissingOnly
        ? !student.uploadedDocuments.includes(filters.documentType)
        : true;

      return schoolMatch && classMatch && sectionMatch && searchMatch && missingMatch;
    });
  };

  const getMissingCount = (student) => {
    return documentTypes.length - student.uploadedDocuments.length;
  };

  const getUploadedCount = (student) => {
    return student.uploadedDocuments.length;
  };

  const handleSearch = () => {
    if (!documentType) {
      alert("Select document type");
      return;
    }

    const filters = {
      classFilter,
      sectionFilter,
      documentType,
      searchText,
      showMissingOnly,
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

  const handleOpenUpload = () => {
    if (!documentType) {
      alert("Select document type");
      return;
    }

    if (selectedIds.length === 0) {
      alert("Select student");
      return;
    }

    setSelectedFile(null);
    setShowUploadPopup(true);
  };

  const handleUpload = () => {
    if (!selectedFile) {
      alert("Select file");
      return;
    }

    const selectedStudents = students.filter((student) =>
      selectedIds.includes(student.id)
    );

    const alreadyUploaded = selectedStudents.some((student) =>
      student.uploadedDocuments.includes(appliedFilters.documentType)
    );

    if (alreadyUploaded) {
      const ok = window.confirm(
        "Document already uploaded. Do you want to replace it?"
      );

      if (!ok) return;
    }

    setStudents((prev) =>
      prev.map((student) =>
        selectedIds.includes(student.id)
          ? {
              ...student,
              uploadedDocuments: student.uploadedDocuments.includes(
                appliedFilters.documentType
              )
                ? student.uploadedDocuments
                : [...student.uploadedDocuments, appliedFilters.documentType],
            }
          : student
      )
    );

    alert("Document uploaded successfully");

    setSelectedIds([]);
    setSelectedFile(null);
    setShowUploadPopup(false);
  };

  const handleDownload = () => {
    if (!documentType) {
      alert("Select document type");
      return;
    }

    if (selectedIds.length === 0) {
      alert("Select student");
      return;
    }

    const selectedStudents = students.filter((student) =>
      selectedIds.includes(student.id)
    );

    const hasDocument = selectedStudents.some((student) =>
      student.uploadedDocuments.includes(appliedFilters.documentType)
    );

    if (!hasDocument) {
      alert("No document uploaded");
      return;
    }

    alert("Document download started");
  };

  return (
    <div className="student-document-page">
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
          <h1>Student Documents</h1>
          <p>Upload and manage student documents</p>
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
            <label>Document Type</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
            >
              <option value="">Select Document</option>
              {documentTypes.map((item) => (
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
              placeholder="Student name"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>

        <div className="document-bottom-row">
          <label className="missing-checkbox">
            <input
              type="checkbox"
              checked={showMissingOnly}
              onChange={(e) => setShowMissingOnly(e.target.checked)}
            />
            Show Missing Only
          </label>

          <AppButton type="primary" onClick={handleSearch}>
            Search
          </AppButton>
        </div>
      </div>

      <div className="common-card">
        <div className="list-header">
          <h2>Student Document List</h2>

          <div className="list-action-buttons">
            <AppButton type="primary" onClick={handleOpenUpload}>
              Upload
            </AppButton>

            <AppButton type="primary" onClick={handleDownload}>
              Download
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
                <th>Class</th>
                <th>Section</th>
                <th>Missing</th>
                <th>Uploaded</th>
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
                    <td>{student.className}</td>
                    <td>{student.sectionName}</td>
                    <td>{getMissingCount(student)}</td>
                    <td>{getUploadedCount(student)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showUploadPopup && (
        <div className="popup-overlay">
          <div className="upload-popup">
            <div className="popup-head">
              <h2>Upload Document</h2>

              <button
                className="popup-close-btn"
                onClick={() => {
                  setShowUploadPopup(false);
                  setSelectedFile(null);
                }}
              >
                ×
              </button>
            </div>

            <div className="upload-content">
              <div className="form-group">
                <label>Choose File</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                />
              </div>

              <div className="form-group">
                <label>Open Camera</label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                />
              </div>

              {selectedFile && (
                <p className="selected-file-name">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>

            <div className="form-actions">
              <AppButton type="primary" onClick={handleUpload}>
                Upload
              </AppButton>

              <AppButton
                type="secondary"
                onClick={() => {
                  setShowUploadPopup(false);
                  setSelectedFile(null);
                }}
              >
                Go Back
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDocuments;