import React, { useState } from "react";
import "./classSubjectMapping.css";

function ClassSubjectMapping() {
  const [className, setClassName] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [editMode, setEditMode] = useState(false);

  const classes = ["Class 9", "Class 10", "Class 11", "Class 12"];
  const subjects = ["Hindi", "English", "Math", "Science", "SST"];

  const openPopup = () => {
    if (!className) {
      alert("Please select class");
      return;
    }

    const existing = mappings.find((m) => m.className === className);

    if (existing) {
      setSelectedSubjects(existing.subjects);
      setEditMode(true);
    } else {
      setSelectedSubjects([]);
      setEditMode(false);
    }

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

    const existingIndex = mappings.findIndex(
      (m) => m.className === className
    );

    if (existingIndex !== -1) {
      const updatedMappings = [...mappings];

      updatedMappings[existingIndex] = {
        className,
        subjects: selectedSubjects
      };

      setMappings(updatedMappings);
    } else {
      setMappings([
        ...mappings,
        {
          className,
          subjects: selectedSubjects
        }
      ]);
    }

    setClassName("");
    setSelectedSubjects([]);
    setShowPopup(false);
    setEditMode(false);
  };

  const handleEdit = (index) => {
    setClassName(mappings[index].className);
    setSelectedSubjects(mappings[index].subjects);
    setEditMode(true);
    setShowPopup(true);
  };

  const handleDelete = (index) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this mapping?");
    if (!confirmDelete) return;

    setMappings(mappings.filter((_, i) => i !== index));
  };

  return (
    <div className="class-mapping-page">
      <div className="class-mapping-header">
        <button
          className="back-btn"
          onClick={() => (window.location.href = "/academic-zone")}
        >
          ←
        </button>

        <div>
          <h1>Class Subject Mapping</h1>
          <p>Assign subjects to selected class</p>
        </div>
      </div>

      <div className="class-mapping-form">
        <h2>Select Class</h2>

        <div className="class-mapping-row">
          <div className="form-group">
            <label>Class</label>
            <select
              value={className}
              onChange={(e) => setClassName(e.target.value)}
            >
              <option value="">Select Class</option>
              {classes.map((cls) => (
                <option value={cls} key={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          <button className="assign-btn" onClick={openPopup}>
            Assign Subjects
          </button>
        </div>
      </div>

      <div className="class-mapping-table">
        <h2>Mapping List</h2>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Class</th>
                <th>Subjects</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {mappings.length === 0 ? (
                <tr>
                  <td colSpan="4" className="empty-row">
                    No mappings added
                  </td>
                </tr>
              ) : (
                mappings.map((item, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{item.className}</td>
                    <td>{item.subjects.join(", ")}</td>
                    <td>
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(index)}
                      >
                        Edit
                      </button>

                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(index)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showPopup && (
        <div className="popup-overlay">
          <div className="subject-popup">
            <div className="popup-head">
              <h2>{editMode ? "Edit Subjects" : "Assign Subjects"}</h2>
              <button onClick={() => setShowPopup(false)}>×</button>
            </div>

            <p className="popup-subtitle">
              Selected Class: <strong>{className}</strong>
            </p>

            <div className="subject-options">
              {subjects.map((subject) => (
                <label key={subject}>
                  <input
                    type="checkbox"
                    checked={selectedSubjects.includes(subject)}
                    onChange={() => toggleSubject(subject)}
                  />
                  {subject}
                </label>
              ))}
            </div>

            <div className="popup-actions">
              <button className="save-btn" onClick={saveMapping}>
                {editMode ? "Update Mapping" : "Save Mapping"}
              </button>

              <button className="cancel-btn" onClick={() => setShowPopup(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClassSubjectMapping;