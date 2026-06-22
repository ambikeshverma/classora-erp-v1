import React, { useState } from "react";
import "./coScholasticSubjectSetup.css";
import AppButton from "../components/AppButton";

function CoScholasticSubjectSetup() {
  const [subject, setSubject] = useState({
    subjectName: "",
    subjectCode: "",
  });

  const [subjects, setSubjects] = useState([]);
  const [selectedIndexes, setSelectedIndexes] = useState([]);

  const [usedSubjects] = useState(["Discipline"]);

  const handleChange = (e) => {
    setSubject({
      ...subject,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = () => {
    if (!subject.subjectName) {
      alert("Please fill Subject Name");
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
    });
  };

  const handleEdit = () => {
    if (selectedIndexes.length !== 1) {
      alert("Please select one subject to edit");
      return;
    }

    const index = selectedIndexes[0];

    setSubject(subjects[index]);
    setSubjects(subjects.filter((_, i) => i !== index));
    setSelectedIndexes([]);
  };

  const handleDelete = () => {
    if (selectedIndexes.length === 0) {
      alert("Please select subjects");
      return;
    }

    const blockedSubject = selectedIndexes.find((index) =>
      usedSubjects.includes(subjects[index].subjectName)
    );

    if (blockedSubject !== undefined) {
      alert("Subject already in use. Cannot delete.");
      return;
    }

    const ok = window.confirm("Delete selected subjects?");
    if (!ok) return;

    setSubjects(
      subjects.filter((_, index) => !selectedIndexes.includes(index))
    );

    setSelectedIndexes([]);
  };

  const handleCheckboxChange = (index) => {
    if (selectedIndexes.includes(index)) {
      setSelectedIndexes(selectedIndexes.filter((item) => item !== index));
    } else {
      setSelectedIndexes([...selectedIndexes, index]);
    }
  };

  return (
    <div className="co-scholastic-subject-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => (window.location.href = "/academic-zone")}
        >
          ←
        </AppButton>

        <div>
          <h1>Co-Scholastic Subject Setup</h1>
          <p>Create and manage co-scholastic subjects</p>
        </div>
      </div>

      <div className="common-card">
        <h2>Add Co-Scholastic Subject</h2>

        <div className="subject-form-grid two-column-grid">
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
        </div>

        <div className="form-action right-action">
          <AppButton type="primary" onClick={handleSave}>
            Save Subject
          </AppButton>
        </div>
      </div>

      <div className="common-card">
        <div className="table-top-header">
          <h2>Co-Scholastic Subject List</h2>

          <div className="top-action-buttons">
            <AppButton type="primary" onClick={handleEdit}>
              Edit
            </AppButton>

            <AppButton type="delete" onClick={handleDelete}>
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
                      subjects.length > 0 &&
                      selectedIndexes.length === subjects.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIndexes(
                          subjects.map((_, index) => index)
                        );
                      } else {
                        setSelectedIndexes([]);
                      }
                    }}
                  />
                </th>

                <th>S.No.</th>
                <th>Subject Name</th>
                <th>Code</th>
              </tr>
            </thead>

            <tbody>
              {subjects.length === 0 ? (
                <tr>
                  <td colSpan="4" className="empty-row">
                    No co-scholastic subjects added yet
                  </td>
                </tr>
              ) : (
                subjects.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIndexes.includes(index)}
                        onChange={() => handleCheckboxChange(index)}
                      />
                    </td>

                    <td>{index + 1}</td>
                    <td>{item.subjectName}</td>
                    <td>{item.subjectCode}</td>
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

export default CoScholasticSubjectSetup;