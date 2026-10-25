import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./studentDocuments.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { studentHubService } from "../services/api";

function StudentDocuments() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [documentTypeFilter, setDocumentTypeFilter] = useState("");
  const [searchText, setSearchText] = useState("");

  const [uploadForm, setUploadForm] = useState({
    documentType: "Student Aadhaar Card",
    remarks: "",
  });

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
    "Marksheet",
    "Board Certificate",
    "Leave Certificate",
    "Concession Form",
    "Other",
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      const [metaRes, studRes, docRes] = await Promise.all([
        studentHubService.getMeta(),
        studentHubService.searchStudents({ status: "Active" }),
        studentHubService.getDocuments({}),
      ]);

      if (metaRes.data?.success) {
        setClasses(metaRes.data.data.classes || []);
        setSections(metaRes.data.data.sections || []);
      }
      if (studRes.data?.success) {
        setStudents(studRes.data.data || []);
      }
      if (docRes.data?.success) {
        setDocuments(docRes.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load documents data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUploadSubmit = async () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one student");
      return;
    }

    if (!uploadForm.documentType) {
      alert("Please select a document type");
      return;
    }

    try {
      setUploading(true);
      for (const id of selectedIds) {
        const student = students.find((s) => (s._id || s.id) === id);
        if (student) {
          await studentHubService.uploadDocument({
            studentId: id,
            studentName: student.studentName,
            className: student.className,
            section: student.section,
            rollNumber: student.rollNo || student.rollNumber || "",
            documentType: uploadForm.documentType,
            remarks: uploadForm.remarks || "",
          });
        }
      }

      alert(`Document recorded successfully for ${selectedIds.length} student(s)`);
      setShowUploadPopup(false);
      setSelectedIds([]);
      setUploadForm({ documentType: "Student Aadhaar Card", remarks: "" });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to record document");
    } finally {
      setUploading(false);
    }
  };

  const getStudentDocs = (studentId) => {
    return documents.filter((d) => String(d.studentId) === String(studentId));
  };

  const availableSections = classFilter
    ? sections.filter((s) => s.className === classFilter)
    : sections;

  const filteredStudents = students.filter((s) => {
    const classMatch = classFilter ? s.className === classFilter : true;
    const sectionMatch = sectionFilter ? s.section === sectionFilter : true;
    const searchMatch = searchText.trim()
      ? s.studentName?.toLowerCase().includes(searchText.toLowerCase()) ||
        s.admissionNo?.toLowerCase().includes(searchText.toLowerCase()) ||
        s.srNo?.toLowerCase().includes(searchText.toLowerCase())
      : true;

    const studentDocs = getStudentDocs(s._id || s.id);
    const docMatch = documentTypeFilter
      ? studentDocs.some((d) => d.documentType === documentTypeFilter)
      : true;

    return classMatch && sectionMatch && searchMatch && docMatch;
  });

  return (
    <div className="student-documents-page">
      <div className="common-page-header">
        <AppButton type="back" onClick={() => navigate("/student-hub")}>
          ←
        </AppButton>

        <div>
          <h1>Student Documents</h1>
          <p>Track certificates, identity cards, admissions records, and mandatory student documentation</p>
        </div>
      </div>

      <div className="common-card">
        <div className="filter-grid">
          <div className="form-group">
            <label>Class</label>
            <select
              value={classFilter}
              onChange={(e) => {
                setClassFilter(e.target.value);
                setSectionFilter("");
              }}
            >
              <option value="">All Classes</option>
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
            <label>Document Type</label>
            <select
              value={documentTypeFilter}
              onChange={(e) => setDocumentTypeFilter(e.target.value)}
            >
              <option value="">All Document Types</option>
              {documentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search by student name or admission no..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="common-card">
        <div className="list-header">
          <h2>Student Documentation Status ({filteredStudents.length})</h2>

          <div className="list-action-buttons">
            <AppButton
              type="primary"
              onClick={() => {
                if (selectedIds.length === 0) {
                  alert("Please select at least one student to upload documents for");
                  return;
                }
                setShowUploadPopup(true);
              }}
            >
              + Record Document Submission
            </AppButton>
          </div>
        </div>

        <div className="table-wrap">
          {loading ? (
            <SkeletonTable rows={5} columns={6} />
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
                  <th>Student Name</th>
                  <th>Class & Section</th>
                  <th>Admission No</th>
                  <th>Uploaded Documents</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-row">
                      {classes.length === 0
                        ? "No classes found. Please configure classes in Class Management."
                        : "No student records found matching your filters."}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((item, index) => {
                    const itemId = item._id || item.id;
                    const studentDocs = getStudentDocs(itemId);
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
                        <td><strong>{item.studentName}</strong></td>
                        <td>{item.className} {item.section ? `(${item.section})` : ""}</td>
                        <td><span className="badge-code">{item.admissionNo || item.srNo || "—"}</span></td>
                        <td>
                          {studentDocs.length > 0 ? (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                              {studentDocs.map((doc, dIdx) => (
                                <span
                                  key={dIdx}
                                  style={{
                                    padding: "2px 8px",
                                    borderRadius: "12px",
                                    backgroundColor: "#dcfce7",
                                    color: "#166534",
                                    fontSize: "12px",
                                    fontWeight: "500",
                                    border: "1px solid #bbf7d0",
                                  }}
                                >
                                  ✓ {doc.documentType}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: "#9ca3af", fontStyle: "italic", fontSize: "12px" }}>
                              No documents recorded yet
                            </span>
                          )}
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

      {showUploadPopup && (
        <div className="popup-overlay">
          <div className="view-popup">
            <div className="popup-head">
              <h2>Record Document ({selectedIds.length} student(s))</h2>
              <button
                className="popup-close-btn"
                onClick={() => setShowUploadPopup(false)}
              >
                ×
              </button>
            </div>

            <div style={{ padding: "10px 0" }}>
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label>Document Type *</label>
                <select
                  value={uploadForm.documentType}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, documentType: e.target.value })
                  }
                >
                  {documentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label>Remarks / Document ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Verified original, TC No 1024"
                  value={uploadForm.remarks}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, remarks: e.target.value })
                  }
                />
              </div>

              <div className="form-actions" style={{ marginTop: "20px" }}>
                <AppButton
                  type="primary"
                  onClick={handleUploadSubmit}
                  disabled={uploading}
                >
                  {uploading ? "Submitting..." : "Save Record"}
                </AppButton>
                <AppButton
                  type="secondary"
                  onClick={() => setShowUploadPopup(false)}
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

export default StudentDocuments;