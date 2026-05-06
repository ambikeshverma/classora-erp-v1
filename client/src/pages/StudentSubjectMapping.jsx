import React, { useState } from "react";
import "./studentSubjectMapping.css";
import AppButton from "../components/AppButton";

function StudentSubjectMapping() {
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [savedMappings, setSavedMappings] = useState([]);
  const [editStudent, setEditStudent] = useState(null);

  const demoStudents = [
    { id: 1, name: "Aman Kumar", admissionNo: "ADM001", section: "A" },
    { id: 2, name: "Riya Sharma", admissionNo: "ADM002", section: "A" },
    { id: 3, name: "Pooja Singh", admissionNo: "ADM003", section: "B" },
    { id: 4, name: "Ankit Verma", admissionNo: "ADM004", section: "B" },
  ];

  const classSubjects = {
    "Class 9": ["Hindi", "English", "Math"],
    "Class 10": ["Hindi", "English", "Math", "Science", "SST"],
    "Class 11": ["Physics", "Chemistry", "Math", "English"],
    "Class 12": ["Physics", "Chemistry", "Math", "English"],
  };

  const subjects = classSubjects[className] || [];

  const visibleMappings = savedMappings.filter(
    (m) => m.className === className
  );

  const loadStudents = () => {
    if (!className || !section) {
      alert("Please select class and section");
      return;
    }

    const filtered = demoStudents.filter(
      (student) => student.section === section
    );

    setStudents(filtered);
    setSelectedStudents([]);
    setSelectedSubjects([]);
    setEditStudent(null);
  };

  const toggleStudent = (id) => {
    setSelectedStudents((prev) =>
      prev.includes(id)
        ? prev.filter((sid) => sid !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map((student) => student.id));
    }
  };

  const openAssignPopup = () => {
    if (selectedStudents.length === 0) {
      alert("Please select at least one student");
      return;
    }

    if (subjects.length === 0) {
      alert("No subjects mapped for this class");
      return;
    }

    setEditStudent(null);
    setSelectedSubjects([]);
    setShowPopup(true);
  };

  const toggleSubject = (subject) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((item) => item !== subject)
        : [...prev, subject]
    );
  };

  const saveMapping = () => {
    if (selectedSubjects.length === 0) {
      alert("Please select at least one subject");
      return;
    }

    let updatedMappings = [...savedMappings];

    if (editStudent) {
      updatedMappings = updatedMappings.map((mapping) =>
        mapping.admissionNo === editStudent.admissionNo
          ? {
              ...mapping,
              subjects: selectedSubjects,
            }
          : mapping
      );
    } else {
      selectedStudents.forEach((studentId) => {
        const student = students.find((s) => s.id === studentId);

        const existingIndex = updatedMappings.findIndex(
          (mapping) =>
            mapping.className === className &&
            mapping.admissionNo === student.admissionNo
        );

        if (existingIndex !== -1) {
          const oldSubjects =
            updatedMappings[existingIndex].subjects;

          const newSubjects = selectedSubjects.filter(
            (subject) => !oldSubjects.includes(subject)
          );

          updatedMappings[existingIndex] = {
            ...updatedMappings[existingIndex],
            section,
            subjects: [...oldSubjects, ...newSubjects],
          };
        } else {
          updatedMappings.push({
            className,
            section,
            studentName: student.name,
            admissionNo: student.admissionNo,
            subjects: selectedSubjects,
          });
        }
      });
    }

    setSavedMappings(updatedMappings);
    setShowPopup(false);
    setSelectedSubjects([]);
    setSelectedStudents([]);
    setEditStudent(null);
  };

  const handleEdit = (mapping) => {
    setEditStudent(mapping);
    setSelectedSubjects(mapping.subjects);
    setShowPopup(true);
  };

  const handleDelete = (mapping) => {
    const ok = window.confirm(
      "Delete this subject mapping?"
    );

    if (!ok) return;

    setSavedMappings(
      savedMappings.filter(
        (item) =>
          !(
            item.className === mapping.className &&
            item.admissionNo === mapping.admissionNo
          )
      )
    );
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedSubjects([]);
    setEditStudent(null);
  };

  return (
    <div className="student-subject-page">
      {/* ================= HEADER ================= */}

      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() =>
            (window.location.href = "/academic-zone")
          }
        >
          ←
        </AppButton>

        <div>
          <h1>Student Subject Mapping</h1>
          <p>
            Bulk assign class subjects to selected students
          </p>
        </div>
      </div>

      {/* ================= FILTER CARD ================= */}

      <div className="common-card">
        <h2>Filter Students</h2>

        <div className="mapping-filter-grid">
          <div className="form-group">
            <label>Class</label>

            <select
              value={className}
              onChange={(e) =>
                setClassName(e.target.value)
              }
            >
              <option value="">Select Class</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 10">Class 10</option>
              <option value="Class 11">Class 11</option>
              <option value="Class 12">Class 12</option>
            </select>
          </div>

          <div className="form-group">
            <label>Section</label>

            <select
              value={section}
              onChange={(e) =>
                setSection(e.target.value)
              }
            >
              <option value="">Select Section</option>
              <option value="A">A</option>
              <option value="B">B</option>
            </select>
          </div>

          <div className="filter-btn-wrap">
            <AppButton
              type="primary"
              onClick={loadStudents}
            >
              Load Students
            </AppButton>
          </div>
        </div>
      </div>

      {/* ================= STUDENT LIST ================= */}

      <div className="common-card">
        <div className="card-head-with-btn">
          <h2>Student List</h2>

          <AppButton
            type="primary"
            onClick={openAssignPopup}
          >
            Assign Subjects
          </AppButton>
        </div>

        {students.length === 0 ? (
          <p className="empty-message">
            Select class and section to load students.
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={
                        students.length > 0 &&
                        selectedStudents.length ===
                          students.length
                      }
                      onChange={toggleSelectAll}
                    />
                  </th>

                  <th>S.No</th>
                  <th>Student Name</th>
                  <th>Admission No</th>
                  <th>Class</th>
                  <th>Section</th>
                </tr>
              </thead>

              <tbody>
                {students.map((student, index) => (
                  <tr key={student.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(
                          student.id
                        )}
                        onChange={() =>
                          toggleStudent(student.id)
                        }
                      />
                    </td>

                    <td>{index + 1}</td>
                    <td>{student.name}</td>
                    <td>{student.admissionNo}</td>
                    <td>{className}</td>
                    <td>{section}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= SAVED MAPPINGS ================= */}

      <div className="common-card">
        <h2>Saved Subject Mappings</h2>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Student Name</th>
                <th>Admission No</th>
                <th>Class</th>
                <th>Section</th>
                <th className="subject-column">Subjects</th>
                <th className="action-column">Action</th>
              </tr>
            </thead>

            <tbody>
              {!className ? (
                <tr>
                  <td
                    colSpan="7"
                    className="empty-row"
                  >
                    Select class to view saved mappings
                  </td>
                </tr>
              ) : visibleMappings.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="empty-row"
                  >
                    No mapping saved for this class
                  </td>
                </tr>
              ) : (
                visibleMappings.map((item, index) => (
                  <tr key={item.admissionNo}>
                    <td>{index + 1}</td>
                    <td>{item.studentName}</td>
                    <td>{item.admissionNo}</td>
                    <td>{item.className}</td>
                    <td>{item.section}</td>

                    <td className="subject-column">
  <div className="subject-badges">
                        {item.subjects.map(
                          (subject, subIndex) => (
                            <span
                              key={subIndex}
                              className="subject-badge"
                            >
                              {subject}
                            </span>
                          )
                        )}
                      </div>
                    </td>

                    <td className="action-column">
  <div className="table-actions">
                        <button
                          className="table-edit-btn"
                          onClick={() =>
                            handleEdit(item)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="table-delete-btn"
                          onClick={() =>
                            handleDelete(item)
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= POPUP ================= */}

      {showPopup && (
        <div className="popup-overlay">
          <div className="subject-popup">
            <div className="popup-head">
              <h2>
                {editStudent
                  ? "Edit Subjects"
                  : "Assign Subjects"}
              </h2>

              <button
                className="popup-close-btn"
                onClick={closePopup}
              >
                ×
              </button>
            </div>

            <p className="popup-subtitle">
              {editStudent ? (
                <>
                  Student:{" "}
                  <strong>
                    {editStudent.studentName}
                  </strong>
                </>
              ) : (
                <>
                  Selected Students:{" "}
                  <strong>
                    {selectedStudents.length}
                  </strong>
                </>
              )}
            </p>

            <div className="subject-options">
              {subjects.map((subject) => (
                <label key={subject}>
                  <input
                    type="checkbox"
                    checked={selectedSubjects.includes(
                      subject
                    )}
                    onChange={() =>
                      toggleSubject(subject)
                    }
                  />

                  {subject}
                </label>
              ))}
            </div>

            <div className="popup-actions">
              <AppButton
                type="primary"
                onClick={saveMapping}
              >
                {editStudent
                  ? "Update Mapping"
                  : "Save Mapping"}
              </AppButton>

              <AppButton
                type="secondary"
                onClick={closePopup}
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

export default StudentSubjectMapping;