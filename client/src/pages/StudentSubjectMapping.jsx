import React, { useState } from "react";
import "./studentSubjectMapping.css";
import AppButton from "../components/AppButton";

function StudentSubjectMapping() {
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [showPopup, setShowPopup] = useState(false);

  const [selectedScholasticSubjects, setSelectedScholasticSubjects] =
    useState([]);

  const [selectedCoScholasticSubjects, setSelectedCoScholasticSubjects] =
    useState([]);

  const [savedMappings, setSavedMappings] = useState([]);
  const [editStudent, setEditStudent] = useState(null);

  const demoStudents = [
    { id: 1, name: "Aman Kumar", admissionNo: "ADM001", section: "A" },
    { id: 2, name: "Riya Sharma", admissionNo: "ADM002", section: "A" },
    { id: 3, name: "Pooja Singh", admissionNo: "ADM003", section: "B" },
    { id: 4, name: "Ankit Verma", admissionNo: "ADM004", section: "B" },
  ];

  const classSubjectMapping = {
    "Class 9": {
      scholasticSubjects: ["Hindi", "English", "Math"],
      coScholasticSubjects: ["Discipline", "Art Education", "Sports"],
    },
    "Class 10": {
      scholasticSubjects: ["Hindi", "English", "Math", "Science", "SST"],
      coScholasticSubjects: ["Discipline", "Health Education"],
    },
  };

  const assignedSubjects = classSubjectMapping[className] || {
    scholasticSubjects: [],
    coScholasticSubjects: [],
  };

  const visibleMappings = savedMappings.filter(
    (item) => item.className === className
  );

  const loadStudents = () => {
    if (!className || !section) {
      alert("Please select class and section");
      return;
    }

    setStudents(demoStudents.filter((student) => student.section === section));
    setSelectedStudents([]);
    setSelectedRows([]);
    setEditStudent(null);
  };

  const toggleStudent = (id) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const toggleSelectAllStudents = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map((student) => student.id));
    }
  };

  const toggleRow = (admissionNo) => {
    setSelectedRows((prev) =>
      prev.includes(admissionNo)
        ? prev.filter((id) => id !== admissionNo)
        : [...prev, admissionNo]
    );
  };

  const toggleSelectAllRows = () => {
    if (selectedRows.length === visibleMappings.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(visibleMappings.map((item) => item.admissionNo));
    }
  };
  const openAssignPopup = () => {
    if (selectedStudents.length === 0) {
      alert("Please select at least one student");
      return;
    }

    if (
      assignedSubjects.scholasticSubjects.length === 0 &&
      assignedSubjects.coScholasticSubjects.length === 0
    ) {
      alert("No subjects mapped for this class");
      return;
    }

    setEditStudent(null);
    setSelectedScholasticSubjects([]);
    setSelectedCoScholasticSubjects([]);
    setShowPopup(true);
  };

  const toggleScholasticSubject = (subject) => {
    setSelectedScholasticSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((item) => item !== subject)
        : [...prev, subject]
    );
  };

  const toggleCoScholasticSubject = (subject) => {
    setSelectedCoScholasticSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((item) => item !== subject)
        : [...prev, subject]
    );
  };

  const saveMapping = () => {
    if (
      selectedScholasticSubjects.length === 0 &&
      selectedCoScholasticSubjects.length === 0
    ) {
      alert("Please select at least one subject");
      return;
    }

    let updatedMappings = [...savedMappings];

    if (editStudent) {
      updatedMappings = updatedMappings.map((mapping) =>
        mapping.admissionNo === editStudent.admissionNo
          ? {
              ...mapping,
              scholasticSubjects: selectedScholasticSubjects,
              coScholasticSubjects: selectedCoScholasticSubjects,
            }
          : mapping
      );
    } else {
      selectedStudents.forEach((studentId) => {
        const student = students.find((item) => item.id === studentId);

        const existingIndex = updatedMappings.findIndex(
          (mapping) =>
            mapping.className === className &&
            mapping.admissionNo === student.admissionNo
        );

        if (existingIndex !== -1) {
          const oldScholastic =
            updatedMappings[existingIndex].scholasticSubjects || [];

          const oldCoScholastic =
            updatedMappings[existingIndex].coScholasticSubjects || [];

          const newScholastic = selectedScholasticSubjects.filter(
            (subject) => !oldScholastic.includes(subject)
          );

          const newCoScholastic = selectedCoScholasticSubjects.filter(
            (subject) => !oldCoScholastic.includes(subject)
          );

          updatedMappings[existingIndex] = {
            ...updatedMappings[existingIndex],
            section,
            scholasticSubjects: [...oldScholastic, ...newScholastic],
            coScholasticSubjects: [...oldCoScholastic, ...newCoScholastic],
          };
        } else {
          updatedMappings.push({
            className,
            section,
            studentName: student.name,
            admissionNo: student.admissionNo,
            scholasticSubjects: selectedScholasticSubjects,
            coScholasticSubjects: selectedCoScholasticSubjects,
          });
        }
      });
    }

    setSavedMappings(updatedMappings);
    setShowPopup(false);
    setSelectedScholasticSubjects([]);
    setSelectedCoScholasticSubjects([]);
    setSelectedStudents([]);
    setSelectedRows([]);
    setEditStudent(null);
  };
  const handleEdit = () => {
    if (selectedRows.length !== 1) {
      alert("Please select one student mapping");
      return;
    }

    const selectedMapping = visibleMappings.find(
      (item) => item.admissionNo === selectedRows[0]
    );

    if (!selectedMapping) return;

    setEditStudent(selectedMapping);

    setSelectedScholasticSubjects(
      selectedMapping.scholasticSubjects || []
    );

    setSelectedCoScholasticSubjects(
      selectedMapping.coScholasticSubjects || []
    );

    setShowPopup(true);
  };

  const handleDelete = () => {
    if (selectedRows.length === 0) {
      alert("Please select mapping");
      return;
    }

    const ok = window.confirm(
      "Delete selected subject mappings?"
    );

    if (!ok) return;

    setSavedMappings(
      savedMappings.filter(
        (item) =>
          !selectedRows.includes(item.admissionNo)
      )
    );

    setSelectedRows([]);
  };

  const closePopup = () => {
    setShowPopup(false);

    setSelectedScholasticSubjects([]);
    setSelectedCoScholasticSubjects([]);

    setEditStudent(null);
  };

  return (
    <div className="student-subject-page">

      {/* ================= HEADER ================= */}

      <div className="common-page-header">

        <AppButton
          type="back"
          onClick={() =>
            (window.location.href =
              "/academic-zone")
          }
        >
          ←
        </AppButton>

        <div>
          <h1>
            Student Subject Mapping
          </h1>

          <p>
            Bulk assign class subjects
            to selected students
          </p>
        </div>

      </div>

      {/* ================= FILTER CARD ================= */}

      <div className="common-card">

        <h2>
          Filter Students
        </h2>

        <div className="mapping-filter-grid">

          <div className="form-group">

            <select
              value={className}
              onChange={(e) =>
                setClassName(e.target.value)
                
              }
            >
              <option value="">
                Select Class
              </option>

              <option value="Class 9">
                Class 9
              </option>

              <option value="Class 10">
                Class 10
              </option>

              <option value="Class 11">
                Class 11
              </option>

              <option value="Class 12">
                Class 12
              </option>

            </select>

          </div>

          <div className="form-group">

  <select
    value={section}
    onChange={(e) =>
      setSection(
        e.target.value
      )
    }
  >
              <option value="">
                Select Section
              </option>

              <option value="A">
                A
              </option>

              <option value="B">
                B
              </option>

            </select>

          </div>

        </div>

        <div className="form-actions">

          <AppButton
            type="primary"
            onClick={loadStudents}
          >
            Load Students
          </AppButton>

        </div>

      </div>
      {/* ================= STUDENT LIST ================= */}

      <div className="common-card">

        <div className="list-header">

          <h2>
            Student List
          </h2>

          <div className="list-action-buttons">

            <AppButton
              type="primary"
              onClick={openAssignPopup}
            >
              Assign Subjects
            </AppButton>

          </div>

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
                      onChange={toggleSelectAllStudents}
                    />

                  </th>

                  <th>S.No</th>
                  <th>Student Name</th>
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

        <div className="list-header">

          <h2>
            Saved Subject Mappings
          </h2>

          <div className="list-action-buttons">

            <AppButton
              type="primary"
              onClick={handleEdit}
            >
              Edit
            </AppButton>

            <AppButton
              type="delete"
              onClick={handleDelete}
            >
              Delete
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
                      visibleMappings.length > 0 &&
                      selectedRows.length ===
                        visibleMappings.length
                    }
                    onChange={toggleSelectAllRows}
                  />

                </th>

                <th>
                  S.No
                </th>

                <th>
                  Student Name
                </th>

                <th>
                  Class
                </th>

                <th>
                  Section
                </th>

                <th className="subject-column">
                  Scholastic Subjects
                </th>

                <th className="subject-column">
                  Co-Scholastic Subjects
                </th>

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

                visibleMappings.map(
                  (item, index) => (

                    <tr key={item.admissionNo}>

                      <td>

                        <input
                          type="checkbox"
                          checked={selectedRows.includes(
                            item.admissionNo
                          )}
                          onChange={() =>
                            toggleRow(
                              item.admissionNo
                            )
                          }
                        />

                      </td>

                      <td>
                        {index + 1}
                      </td>

                      <td>
                        {item.studentName}
                      </td>

                      <td>
                        {item.className}
                      </td>

                      <td>
                        {item.section}
                      </td>

                      <td className="subject-column">

                        {item.scholasticSubjects.join(
                          ", "
                        )}

                      </td>

                      <td className="subject-column">

                        {item.coScholasticSubjects.join(
                          ", "
                        )}

                      </td>

                    </tr>

                  )
                )

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
                  Student:
                  {" "}
                  <strong>
                    {editStudent.studentName}
                  </strong>
                </>

              ) : (

                <>
                  Selected Students:
                  {" "}
                  <strong>
                    {selectedStudents.length}
                  </strong>
                </>

              )}

            </p>

            <div className="popup-section">

              <h3>
                Scholastic Subjects
              </h3>

              <div className="subject-options">

                {assignedSubjects.scholasticSubjects.map(
                  (subject) => (

                    <label key={subject}>

                      <input
                        type="checkbox"
                        checked={selectedScholasticSubjects.includes(
                          subject
                        )}
                        onChange={() =>
                          toggleScholasticSubject(
                            subject
                          )
                        }
                      />

                      {subject}

                    </label>

                  )
                )}

              </div>

            </div>

            <div className="popup-section">

              <h3>
                Co-Scholastic Subjects
              </h3>

              <div className="subject-options">

                {assignedSubjects.coScholasticSubjects.map(
                  (subject) => (

                    <label key={subject}>

                      <input
                        type="checkbox"
                        checked={selectedCoScholasticSubjects.includes(
                          subject
                        )}
                        onChange={() =>
                          toggleCoScholasticSubject(
                            subject
                          )
                        }
                      />

                      {subject}

                    </label>

                  )
                )}

              </div>

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