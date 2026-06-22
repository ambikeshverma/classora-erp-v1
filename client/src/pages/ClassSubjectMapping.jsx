import React, { useState } from "react";
import "./classSubjectMapping.css";
import AppButton from "../components/AppButton";

function ClassSubjectMapping() {

  const [className, setClassName] =
    useState("");

  const [showPopup, setShowPopup] =
    useState(false);

  const [
    selectedScholasticSubjects,
    setSelectedScholasticSubjects,
  ] = useState([]);

  const [
    selectedCoScholasticSubjects,
    setSelectedCoScholasticSubjects,
  ] = useState([]);

  const [
    savedMappings,
    setSavedMappings,
  ] = useState([]);

  const [
    selectedRows,
    setSelectedRows,
  ] = useState([]);

  const classes = [
    "Class 9",
    "Class 10",
    "Class 11",
    "Class 12",
  ];

  /* Subject Setup se aayenge */
  const scholasticSubjects = [
    "Hindi",
    "English",
    "Math",
    "Science",
    "SST",
    "Physics",
    "Chemistry",
  ];

  /* Co-Scholastic Subject Setup se aayenge */
  const coScholasticSubjects = [
    "Discipline",
    "Art Education",
    "Sports",
    "Health Education",
  ];

  /* Report Card dependency example */
  const usedMappings = [
    "Class 9",
  ];

  const openPopup = () => {

    if (!className) {

      alert(
        "Please select class"
      );

      return;

    }

    const existingMapping =
      savedMappings.find(
        (item) =>
          item.className ===
          className
      );

    if (existingMapping) {

      setSelectedScholasticSubjects(
        existingMapping.scholasticSubjects
      );

      setSelectedCoScholasticSubjects(
        existingMapping.coScholasticSubjects
      );

    } else {

      setSelectedScholasticSubjects(
        []
      );

      setSelectedCoScholasticSubjects(
        []
      );

    }

    setShowPopup(true);

  };

  const closePopup = () => {

    setShowPopup(false);

    setSelectedScholasticSubjects(
      []
    );

    setSelectedCoScholasticSubjects(
      []
    );

  };

  const toggleScholasticSubject =
    (subject) => {

      setSelectedScholasticSubjects(
        (prev) =>
          prev.includes(subject)
            ? prev.filter(
                (item) =>
                  item !== subject
              )
            : [
                ...prev,
                subject,
              ]
      );

    };

  const toggleCoScholasticSubject =
    (subject) => {

      setSelectedCoScholasticSubjects(
        (prev) =>
          prev.includes(subject)
            ? prev.filter(
                (item) =>
                  item !== subject
              )
            : [
                ...prev,
                subject,
              ]
      );

    };

  const saveMapping = () => {

    if (
      selectedScholasticSubjects.length ===
        0 &&
      selectedCoScholasticSubjects.length ===
        0
    ) {

      alert(
        "Please select at least one subject"
      );

      return;

    }

    const existingMapping =
      savedMappings.find(
        (item) =>
          item.className ===
          className
      );

    if (existingMapping) {

      setSavedMappings(
        savedMappings.map(
          (item) =>
            item.className ===
            className
              ? {
                  ...item,

                  scholasticSubjects:
                    selectedScholasticSubjects,

                  coScholasticSubjects:
                    selectedCoScholasticSubjects,
                }
              : item
        )
      );

    } else {

      setSavedMappings([
        ...savedMappings,

        {
          className,

          scholasticSubjects:
            selectedScholasticSubjects,

          coScholasticSubjects:
            selectedCoScholasticSubjects,
        },

      ]);

    }

    closePopup();

  };
  const handleEdit = () => {
    if (selectedRows.length !== 1) {
      alert("Please select one mapping to edit");
      return;
    }

    const selectedItem = savedMappings[selectedRows[0]];

    setClassName(selectedItem.className);

    setSelectedScholasticSubjects(
      selectedItem.scholasticSubjects
    );

    setSelectedCoScholasticSubjects(
      selectedItem.coScholasticSubjects
    );

    setShowPopup(true);
  };

  const handleDelete = () => {
    if (selectedRows.length === 0) {
      alert("Please select mapping");
      return;
    }

    const blockedMapping = selectedRows.find((index) =>
      usedMappings.includes(savedMappings[index].className)
    );

    if (blockedMapping !== undefined) {
      alert("Mapping already in use. Cannot delete.");
      return;
    }

    const ok = window.confirm("Delete selected mappings?");
    if (!ok) return;

    setSavedMappings(
      savedMappings.filter(
        (_, index) => !selectedRows.includes(index)
      )
    );

    setSelectedRows([]);
  };

  const handleRowSelect = (index) => {
    if (selectedRows.includes(index)) {
      setSelectedRows(
        selectedRows.filter((item) => item !== index)
      );
    } else {
      setSelectedRows([...selectedRows, index]);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(savedMappings.map((_, index) => index));
    } else {
      setSelectedRows([]);
    }
  };

  return (
    <div className="class-subject-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => {
            window.location.href = "/academic-zone";
          }}
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
        </div>

        <div className="form-actions">
          <AppButton type="primary" onClick={openPopup}>
            Assign Subjects
          </AppButton>
        </div>
      </div>
      <div className="common-card">

        <div className="list-header">

          <h2>
            Mapping List
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
                      savedMappings.length > 0 &&
                      selectedRows.length ===
                        savedMappings.length
                    }
                    onChange={handleSelectAll}
                  />

                </th>

                <th>
                  S.No
                </th>

                <th>
                  Class
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

              {savedMappings.length === 0 ? (

                <tr>

                  <td
                    colSpan="5"
                    className="empty-row"
                  >
                    No mapping added yet
                  </td>

                </tr>

              ) : (

                savedMappings.map(
                  (item, index) => (

                    <tr
                      key={item.className}
                    >

                      <td>

                        <input
                          type="checkbox"
                          checked={selectedRows.includes(
                            index
                          )}
                          onChange={() =>
                            handleRowSelect(index)
                          }
                        />

                      </td>

                      <td>
                        {index + 1}
                      </td>

                      <td>
                        {item.className}
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
      {showPopup && (

        <div className="popup-overlay">

          <div className="subject-popup">

            <div className="popup-head">

              <h2>
                Assign Subjects
              </h2>

              <button
                className="popup-close-btn"
                onClick={closePopup}
              >
                ×
              </button>

            </div>

            <p className="popup-subtitle">

              Class :
              {" "}

              <strong>
                {className}
              </strong>

            </p>

            <div className="popup-section">

              <h3>
                Scholastic Subjects
              </h3>

              <div className="subject-options">

                {scholasticSubjects.map(
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

                {coScholasticSubjects.map(
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
                Save Mapping
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

export default ClassSubjectMapping;