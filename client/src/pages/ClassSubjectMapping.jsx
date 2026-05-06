import React, { useState } from "react";
import "./classSubjectMapping.css";
import AppButton from "../components/AppButton";

function ClassSubjectMapping() {
  const [className, setClassName] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [savedMappings, setSavedMappings] = useState([]);

  const classes = ["Class 9", "Class 10", "Class 11", "Class 12"];

  const subjects = [
    "Hindi",
    "English",
    "Math",
    "Science",
    "SST",
    "Physics",
    "Chemistry",
  ];

  const openPopup = () => {
    if (!className) {
      alert("Please select class");
      return;
    }

    const existingMapping = savedMappings.find(
      (item) => item.className === className
    );

    if (existingMapping) {
      setSelectedSubjects(existingMapping.subjects);
    } else {
      setSelectedSubjects([]);
    }

    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedSubjects([]);
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

    const existingMapping = savedMappings.find(
      (item) => item.className === className
    );

    if (existingMapping) {
      setSavedMappings(
        savedMappings.map((item) =>
          item.className === className
            ? { ...item, subjects: selectedSubjects }
            : item
        )
      );
    } else {
      setSavedMappings([
        ...savedMappings,
        {
          className,
          subjects: selectedSubjects,
        },
      ]);
    }

    closePopup();
  };

  const handleEdit = (item) => {
    setClassName(item.className);
    setSelectedSubjects(item.subjects);
    setShowPopup(true);
  };

  const handleDelete = (item) => {
    const ok = window.confirm("Delete this class subject mapping?");
    if (!ok) return;

    setSavedMappings(
      savedMappings.filter(
        (mapping) => mapping.className !== item.className
      )
    );
  };

  return (
    <div className="class-subject-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => (window.location.href = "/academic-zone")}
        >
          ←
        </AppButton>

        <div>
          <h1>Class Subject Mapping</h1>
          <p>Assign subjects to classes and manage subject rules</p>
        </div>
      </div>

      <div className="common-card">
        <h2>Assign Subjects</h2>

        <div className="mapping-form-grid">
          <div className="form-group">
            <label>Select Class</label>

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

          <div className="assign-btn-wrap">
            <AppButton type="primary" onClick={openPopup}>
              Assign Subjects
            </AppButton>
          </div>
        </div>
      </div>

      <div className="common-card">
        <h2>Mapping List</h2>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Class</th>
                <th className="subject-column">Assigned Subjects</th>
                <th className="action-column">Action</th>
              </tr>
            </thead>

            <tbody>
              {savedMappings.length === 0 ? (
                <tr>
                  <td colSpan="4" className="empty-row">
                    No mapping added yet
                  </td>
                </tr>
              ) : (
                savedMappings.map((item, index) => (
                  <tr key={item.className}>
                    <td>{index + 1}</td>

                    <td>{item.className}</td>

                    <td className="subject-column">
  <div className="subject-badges">
                        {item.subjects.map((subject) => (
                          <span className="subject-badge" key={subject}>
                            {subject}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="action-column">
  <div className="table-actions">
                        <button
                          className="table-edit-btn"
                          onClick={() => handleEdit(item)}
                        >
                          Edit
                        </button>

                        <button
                          className="table-delete-btn"
                          onClick={() => handleDelete(item)}
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

      {showPopup && (
        <div className="popup-overlay">
          <div className="subject-popup">
            <div className="popup-head">
              <h2>Assign Subjects</h2>

              <button className="popup-close-btn" onClick={closePopup}>
                ×
              </button>
            </div>

            <p className="popup-subtitle">
              Class: <strong>{className}</strong>
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
              <AppButton type="primary" onClick={saveMapping}>
                Save Mapping
              </AppButton>

              <AppButton type="secondary" onClick={closePopup}>
                Cancel
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClassSubjectMapping;