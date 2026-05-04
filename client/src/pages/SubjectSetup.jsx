import React, { useState } from "react";
import "./subjectSetup.css";

function SubjectSetup() {
  const [subject, setSubject] = useState({
    subjectName: "",
    subjectCode: "",
    subjectType: ""
  });

  const [subjects, setSubjects] = useState([]);

  const handleChange = (e) => {
    setSubject({
      ...subject,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = () => {
   if (!subject.subjectName || !subject.subjectType) {
  alert("Please fill Subject Name and Subject Type");
  return;
}

const duplicateSubject = subjects.some(
  (item) =>
    item.subjectName.trim().toLowerCase() ===
    subject.subjectName.trim().toLowerCase()
);

if (duplicateSubject) {
  alert("This subject already exists");
  return;
}

    setSubjects([...subjects, subject]);

    setSubject({
      subjectName: "",
      subjectCode: "",
      subjectType: ""
    });
  };

  const handleDelete = (index) => {
    const updated = subjects.filter((_, i) => i !== index);
    setSubjects(updated);
  };

  const handleEdit = (index) => {
    setSubject(subjects[index]);
    handleDelete(index);
  };

  return (
    <div className="subject-page">
      <div className="subject-header">
        <button className="back-btn" onClick={() => window.location.href = "/academic-zone"}>
          ←
        </button>

        <div>
          <h1>Subject Setup</h1>
          <p>Create and manage subjects used across admission, exams and report cards</p>
        </div>
      </div>

      <div className="subject-form-card">
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

        <button className="save-btn" onClick={handleSave}>
          Save Subject
        </button>
      </div>

      <div className="subject-table-card">
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
                      <button className="edit-btn" onClick={() => handleEdit(index)}>
                        Edit
                      </button>
                      <button className="delete-btn" onClick={() => handleDelete(index)}>
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
    </div>
  );
}

export default SubjectSetup;