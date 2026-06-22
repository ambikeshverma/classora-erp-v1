import React, { useState } from "react";
import "./examSetup.css";
import AppButton from "../components/AppButton";

function ExamSetup() {

  const schoolId =
    localStorage.getItem("schoolId") ||
    "SCH001";

  const [showForm, setShowForm] =
    useState(false);

  const [selectedIds, setSelectedIds] =
    useState([]);

  const [editId, setEditId] =
    useState(null);

  const [showClassPopup, setShowClassPopup] =
    useState(false);

  const classOptions = [
    "Nursery",
    "LKG",
    "UKG",
    "Class 1",
    "Class 2",
    "Class 3",
    "Class 4",
    "Class 5",
    "Class 6",
    "Class 7",
    "Class 8",
    "Class 9",
    "Class 10",
    "Class 11",
    "Class 12",
  ];

  const [formData, setFormData] =
    useState({
      examName: "",
      applicableClasses: [],
      allowCoScholastic: false,
    });

  const [exams, setExams] =
    useState([
      {
        id: 1,
        schoolId: "SCH001",
        examName: "Unit Test 1",
        applicableClasses: [
          "Class 1",
          "Class 2",
        ],
        allowCoScholastic: false,
        isUsed: false,
      },

      {
        id: 2,
        schoolId: "SCH001",
        examName:
          "Half-Yearly Examination",
        applicableClasses: [
          "Class 6",
          "Class 7",
          "Class 8",
        ],
        allowCoScholastic: true,
        isUsed: true,
      },
    ]);

  const schoolExams =
    exams.filter(
      (item) =>
        item.schoolId === schoolId
    );

  const resetForm = () => {

    setFormData({
      examName: "",
      applicableClasses: [],
      allowCoScholastic: false,
    });

    setEditId(null);

    setShowClassPopup(false);

  };

  const isExamUsed = (examId) => {

    const selectedExam =
      exams.find(
        (item) =>
          item.id === examId
      );

    return selectedExam?.isUsed;

  };

  const handleSave = () => {

    if (
      !formData.examName.trim()
    ) {
      alert(
        "Please enter exam name"
      );

      return;
    }

    if (
      formData.applicableClasses
        .length === 0
    ) {
      alert(
        "Please select applicable classes"
      );

      return;
    }

    const duplicate =
      schoolExams.some(
        (item) =>
          item.examName
            .toLowerCase()
            .trim() ===
            formData.examName
              .toLowerCase()
              .trim() &&
          item.id !== editId
      );

    if (duplicate) {

      alert(
        "Exam name already exists"
      );

      return;

    }

    if (editId) {

      if (
        isExamUsed(editId)
      ) {

        alert(
          "This exam is already used in other records. You cannot edit or delete it."
        );

        return;

      }

      setExams(

        exams.map((item) =>

          item.id === editId

            ? {

                ...item,

                examName:
                  formData.examName,

                applicableClasses:
                  formData.applicableClasses,

                allowCoScholastic:
                  formData.allowCoScholastic,

              }

            : item
        )
      );

      alert(
        "Exam updated successfully"
      );

    } else {

      const newExam = {

        id: Date.now(),

        schoolId,

        examName:
          formData.examName,

        applicableClasses:
          formData.applicableClasses,

        allowCoScholastic:
          formData.allowCoScholastic,

        isUsed: false,

      };

      setExams([
        ...exams,
        newExam,
      ]);

      alert(
        "Exam added successfully"
      );

    }

    resetForm();

    setShowForm(false);

  };

  const handleEdit = () => {

    if (
      selectedIds.length !== 1
    ) {

      alert(
        "Select one exam"
      );

      return;

    }

    const selected =
      schoolExams.find(
        (item) =>
          item.id ===
          selectedIds[0]
      );

    if (!selected) return;

    if (selected.isUsed) {

      alert(
        "This exam is already used in other records. You cannot edit or delete it."
      );

      return;

    }

    setEditId(selected.id);

    setFormData({

      examName:
        selected.examName,

      applicableClasses:
        selected.applicableClasses ||
        [],

      allowCoScholastic:
        selected.allowCoScholastic ||
        false,

    });

    setShowForm(true);

  };

  const handleDelete = () => {

    if (
      selectedIds.length === 0
    ) {

      alert(
        "Select exam"
      );

      return;

    }

    const usedExam =
      schoolExams.find(
        (item) =>
          selectedIds.includes(
            item.id
          ) && item.isUsed
      );

    if (usedExam) {

      alert(
        "This exam is already used in other records. You cannot edit or delete it."
      );

      return;

    }

    const ok =
      window.confirm(
        "Delete selected exam?"
      );

    if (!ok) return;

    setExams(
      exams.filter(
        (item) =>
          !selectedIds.includes(
            item.id
          )
      )
    );

    setSelectedIds([]);

    alert(
      "Exam deleted successfully"
    );

  };

  return (

    <div className="exam-setup-page">

      <div className="common-page-header">

        <AppButton
          type="back"
          onClick={() => {

            if (showForm) {

              resetForm();

              setShowForm(false);

            } else {

              window.location.href =
                "/exam-tools";

            }

          }}
        >
          ←
        </AppButton>

        <div>

          <h1>
            {showForm
              ? "Add / Edit Exam"
              : "Exam Setup"}
          </h1>

          <p>
            Create and manage exams
          </p>

        </div>

      </div>

      {!showForm && (

        <>

          <div className="top-action-bar">

            <AppButton
              type="primary"
              onClick={() => {

                resetForm();

                setShowForm(true);

              }}
            >
              + Add Exam
            </AppButton>

          </div>

          <div className="common-card">

            <div className="list-header">

              <h2>
                Exam List
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
                          schoolExams.length >
                            0 &&
                          selectedIds.length ===
                            schoolExams.length
                        }
                        onChange={(e) => {

                          if (
                            e.target.checked
                          ) {

                            setSelectedIds(
                              schoolExams.map(
                                (item) =>
                                  item.id
                              )
                            );

                          } else {

                            setSelectedIds(
                              []
                            );

                          }

                        }}
                      />
                    </th>

                    <th>
                      S.No
                    </th>

                    <th>
                      Exam Name
                    </th>

                    <th className="classes-cell">
                      Applicable Classes
                    </th>

                    <th>
                      Co-Scholastic
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {schoolExams.length ===
                  0 ? (

                    <tr>

                      <td
                        colSpan="5"
                        className="empty-row"
                      >
                        No exam found
                      </td>

                    </tr>

                  ) : (

                    schoolExams.map(
                      (
                        item,
                        index
                      ) => (

                        <tr key={item.id}>

                          <td>

                            <input
                              type="checkbox"
                              checked={selectedIds.includes(
                                item.id
                              )}
                              onChange={() => {

                                setSelectedIds(
                                  (prev) =>

                                    prev.includes(
                                      item.id
                                    )

                                      ? prev.filter(
                                          (
                                            id
                                          ) =>
                                            id !==
                                            item.id
                                        )

                                      : [
                                          ...prev,
                                          item.id,
                                        ]
                                );

                              }}
                            />

                          </td>

                          <td>
                            {index + 1}
                          </td>

                          <td>
                            {item.examName}
                          </td>

                          <td className="classes-cell">

                            {item
                              .applicableClasses
                              ?.length > 0

                              ? item.applicableClasses.join(
                                  ", "
                                )

                              : "-"}

                          </td>

                          <td>
                            {item.allowCoScholastic
                              ? "Yes"
                              : "No"}
                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

          </div>

        </>

      )}

      {showForm && (

        <div className="common-card">

          <div className="exam-form-grid">

            <div className="form-group">

              <label>
                Exam Name *
              </label>

              <input
                type="text"
                name="examName"
                value={
                  formData.examName
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    examName:
                      e.target.value,
                  })
                }
                placeholder="Enter exam name"
              />

            </div>

            <div className="form-group">

              <label>
                Applicable Classes *
              </label>

              <div className="applicable-class-box">

                <div className="selected-class-text">

                  {formData
                    .applicableClasses
                    .length > 0

                    ? formData.applicableClasses.join(
                        ", "
                      )

                    : "No class selected"}

                </div>

                <AppButton
                  type="secondary"
                  onClick={() =>
                    setShowClassPopup(
                      true
                    )
                  }
                >
                  Select Classes
                </AppButton>

              </div>

            </div>

            <div className="form-group">

              <label>
                Co-Scholastic Entry
              </label>

              <label className="exam-checkbox-row">

                <input
                  type="checkbox"
                  checked={
                    formData.allowCoScholastic
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      allowCoScholastic:
                        e.target.checked,
                    })
                  }
                />

                <span>
                  Allow Co-Scholastic Entry
                </span>

              </label>

            </div>

          </div>

          <div className="form-actions">

            <AppButton
              type="primary"
              onClick={handleSave}
            >
              {editId
                ? "Update"
                : "Save"}
            </AppButton>

            <AppButton
              type="secondary"
              onClick={() => {

                resetForm();

                setShowForm(false);

              }}
            >
              Go Back
            </AppButton>

          </div>

        </div>

      )}

      {showClassPopup && (

        <div className="popup-overlay">

          <div className="class-popup">

            <div className="popup-head">

              <h2>
                Select Applicable Classes
              </h2>

              <button
                className="popup-close-btn"
                onClick={() =>
                  setShowClassPopup(
                    false
                  )
                }
              >
                ×
              </button>

            </div>

            <div className="class-checkbox-list">

              {classOptions.map(
                (className) => (

                  <label
                    key={className}
                    className="class-checkbox-item"
                  >

                    <input
                      type="checkbox"
                      checked={formData.applicableClasses.includes(
                        className
                      )}
                      onChange={() => {

                        setFormData(
                          (prev) => ({

                            ...prev,

                            applicableClasses:
                              prev.applicableClasses.includes(
                                className
                              )

                                ? prev.applicableClasses.filter(
                                    (
                                      item
                                    ) =>
                                      item !==
                                      className
                                  )

                                : [
                                    ...prev.applicableClasses,
                                    className,
                                  ],

                          })
                        );

                      }}
                    />

                    <span>
                      {className}
                    </span>

                  </label>

                )
              )}

            </div>

            <div className="popup-actions">

              <AppButton
                type="primary"
                onClick={() =>
                  setShowClassPopup(
                    false
                  )
                }
              >
                Apply Classes
              </AppButton>

              <AppButton
                type="secondary"
                onClick={() =>
                  setShowClassPopup(
                    false
                  )
                }
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

export default ExamSetup;