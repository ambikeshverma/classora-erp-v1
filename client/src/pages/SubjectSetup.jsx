import React, { useState } from "react";
import "./subjectSetup.css";
import AppButton from "../components/AppButton";

function SubjectSetup() {
  const [subject, setSubject] = useState({
    subjectName: "",
    subjectCode: "",
    subjectType: "",
  });

  const [subjects, setSubjects] = useState([]);

  const handleChange = (e) => {
    setSubject({
      ...subject,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = () => {
    if (!subject.subjectName || !subject.subjectType) {
      alert("Please fill Subject Name and Subject Type");
      return;
    }

    const duplicateSubject = subjects.some(
      (item) =>
        item.subjectName.toLowerCase() ===
        subject.subjectName.toLowerCase()
    );

    if (duplicateSubject) {
      alert("Subject already exists");
      return;
    }

    setSubjects([...subjects, subject]);

    setSubject({
      subjectName: "",
      subjectCode: "",
      subjectType: "",
    });
  };

  const handleEdit = (index) => {
    setSubject(subjects[index]);
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const handleDelete = (index) => {
    const ok = window.confirm("Delete this subject?");
    if (!ok) return;

    setSubjects(subjects.filter((_, i) => i !== index));
  };

  return (
    <div className="subject-setup-page">
      {/* ================= HEADER ================= */}

      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => (window.location.href = "/academic-zone")}
        >
          ←
        </AppButton>

        <div>
          <h1>Subject Setup</h1>
          <p>
            Create and manage subjects used across academic modules
          </p>
        </div>
      </div>

      {/* ================= FORM CARD ================= */}

      <div className="common-card">
        <h2>Add Subject</h2>

        <div className="subject-form-grid">
          <div className="form-group">
            <label>Subject Name</label>

            <input
              type="text"
              name="subjectName"
              value={subject.subjectName}
              onChange={handleChange}
              placeholder="Enter subject name"
            />
          </div>

          <div className="form-group">
            <label>Subject Code</label>

            <input
              type="text"
              name="subjectCode"
              value={subject.subjectCode}
              onChange={handleChange}
              placeholder="Enter subject code"
            />
          </div>

          <div className="form-group">
            <label>Subject Type</label>

            <select
              name="subjectType"
              value={subject.subjectType}
              onChange={handleChange}
            >
              <option value="">Select Type</option>
              <option value="Theory">Theory</option>
              <option value="Practical">Practical</option>
            </select>
          </div>
        </div>

        <div className="form-action">
          <AppButton type="primary" onClick={handleSave}>
            Save Subject
          </AppButton>
        </div>
      </div>

      {/* ================= SUBJECT TABLE ================= */}

      <div className="common-card">
        <h2>Subject List</h2>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Subject Name</th>
                <th>Code</th>
                <th>Type</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {subjects.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-row">
                    No subjects added yet
                  </td>
                </tr>
              ) : (
                subjects.map((item, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>

                    <td>{item.subjectName}</td>

                    <td>{item.subjectCode}</td>

                    <td>{item.subjectType}</td>

                    <td>
                      <div className="table-actions">
                        <button
                          className="table-edit-btn"
                          onClick={() => handleEdit(index)}
                        >
                          Edit
                        </button>

                        <button
                          className="table-delete-btn"
                          onClick={() => handleDelete(index)}
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
    </div>
  );
}

export default SubjectSetup;