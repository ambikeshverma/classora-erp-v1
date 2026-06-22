import React, { useState } from "react";
import "./examMarksSetup.css";
import AppButton from "../components/AppButton";

function ExamMarksSetup() {

  const schoolId =
    localStorage.getItem("schoolId") ||
    "SCH001";

  const exams = [
    {
      id: 1,
      schoolId: "SCH001",
      examName: "Unit Test 1",
    },
    {
      id: 2,
      schoolId: "SCH001",
      examName:
        "Half-Yearly Examination",
    },
    {
      id: 3,
      schoolId: "SCH001",
      examName:
        "Annual Examination",
    },
  ];

  const classes = [
    {
      id: 1,
      schoolId: "SCH001",
      className: "9",
    },
    {
      id: 2,
      schoolId: "SCH001",
      className: "10",
    },
  ];

  const sections = [
    {
      id: 1,
      schoolId: "SCH001",
      className: "9",
      sectionName: "A",
    },
    {
      id: 2,
      schoolId: "SCH001",
      className: "9",
      sectionName: "B",
    },
    {
      id: 3,
      schoolId: "SCH001",
      className: "10",
      sectionName: "A",
    },
    {
      id: 4,
      schoolId: "SCH001",
      className: "10",
      sectionName: "B",
    },
  ];

  const classSubjectMapping = [
    {
      id: 1,
      schoolId: "SCH001",
      className: "9",
      subjectName: "Hindi",
    },
    {
      id: 2,
      schoolId: "SCH001",
      className: "9",
      subjectName: "English",
    },
    {
      id: 3,
      schoolId: "SCH001",
      className: "9",
      subjectName: "Math",
    },
    {
      id: 4,
      schoolId: "SCH001",
      className: "9",
      subjectName: "Science",
    },
    {
      id: 5,
      schoolId: "SCH001",
      className: "10",
      subjectName: "Hindi",
    },
    {
      id: 6,
      schoolId: "SCH001",
      className: "10",
      subjectName: "English",
    },
    {
      id: 7,
      schoolId: "SCH001",
      className: "10",
      subjectName: "Math",
    },
    {
      id: 8,
      schoolId: "SCH001",
      className: "10",
      subjectName: "Science",
    },
  ];

  const emptyForm = {
    examName: "",
    className: "",
    sectionName: "",
    subjects: [],
  };

  const [showForm, setShowForm] =
    useState(false);

  const [selectedIds, setSelectedIds] =
    useState([]);

  const [filterData, setFilterData] =
    useState({
      examName: "",
      className: "",
      sectionName: "",
      subjectName: "",
    });

  const [
    appliedFilters,
    setAppliedFilters,
  ] = useState({
    examName: "",
    className: "",
    sectionName: "",
    subjectName: "",
  });

  const [formData, setFormData] =
    useState(emptyForm);

  const [marksSetups, setMarksSetups] =
    useState([
      {
        id: 1,
        schoolId: "SCH001",
        examName: "Unit Test 1",
        className: "9",
        sectionName: "A",
        subjectName: "Hindi",
        maximumMarks: 20,
        passingMarks: "",
        marksEntryStarted: false,
        resultGenerated: false,
      },

      {
        id: 2,
        schoolId: "SCH001",
        examName: "Unit Test 1",
        className: "9",
        sectionName: "A",
        subjectName: "English",
        maximumMarks: 20,
        passingMarks: "",
        marksEntryStarted: false,
        resultGenerated: false,
      },
    ]);

  const schoolExams =
    exams.filter(
      (item) =>
        item.schoolId === schoolId
    );

  const schoolClasses =
    classes.filter(
      (item) =>
        item.schoolId === schoolId
    );

  const filterSections =
    sections.filter(
      (item) =>
        item.schoolId === schoolId &&
        (!filterData.className ||
          item.className ===
            filterData.className)
    );

  const formSections =
    sections.filter(
      (item) =>
        item.schoolId === schoolId &&
        (!formData.className ||
          item.className ===
            formData.className)
    );

  const filterSubjects =
    classSubjectMapping.filter(
      (item) =>
        item.schoolId === schoolId &&
        (!filterData.className ||
          item.className ===
            filterData.className)
    );

  const resetForm = () => {
    setFormData(emptyForm);
  };

  const getGroupKey = (item) => {
    return `${item.examName}-${item.className}-${item.sectionName || "ALL"}`;
  };

  const groupedSetups =
    Object.values(
      marksSetups
        .filter(
          (item) =>
            item.schoolId ===
              schoolId &&
            (!appliedFilters.examName ||
              item.examName ===
                appliedFilters.examName) &&
            (!appliedFilters.className ||
              item.className ===
                appliedFilters.className) &&
            (!appliedFilters.sectionName ||
              item.sectionName ===
                appliedFilters.sectionName) &&
            (!appliedFilters.subjectName ||
              item.subjectName ===
                appliedFilters.subjectName)
        )

        .reduce((groups, item) => {

          const key =
            getGroupKey(item);

          if (!groups[key]) {

            groups[key] = {
              groupKey: key,
              examName:
                item.examName,
              className:
                item.className,
              sectionName:
                item.sectionName,
              subjectCount: 0,
              marksEntryStarted:
                false,
              resultGenerated:
                false,
            };

          }

          groups[key].subjectCount += 1;

          groups[key].marksEntryStarted =
            groups[key]
              .marksEntryStarted ||
            item.marksEntryStarted;

          groups[key].resultGenerated =
            groups[key]
              .resultGenerated ||
            item.resultGenerated;

          return groups;

        }, {})
    );

  const getSubjectsForSetup = (
    examName,
    className,
    sectionName
  ) => {

    return classSubjectMapping

      .filter(
        (item) =>
          item.schoolId ===
            schoolId &&
          item.className ===
            className
      )

      .map((subject) => {

        const existing =
          marksSetups.find(
            (setup) =>
              setup.schoolId ===
                schoolId &&
              setup.examName ===
                examName &&
              setup.className ===
                className &&
              setup.sectionName ===
                sectionName &&
              setup.subjectName ===
                subject.subjectName
          );

        return {
          subjectName:
            subject.subjectName,

          maximumMarks:
            existing?.maximumMarks ||
            "",

          passingMarks:
            existing?.passingMarks ||
            "",

          marksEntryStarted:
            existing?.marksEntryStarted ||
            false,

          resultGenerated:
            existing?.resultGenerated ||
            false,
        };

      });

  };
  const handleSearch = () => {

    setAppliedFilters(
      filterData
    );

    setSelectedIds([]);

  };

  const handleFormMainChange = (
    name,
    value
  ) => {

    const updated = {
      ...formData,
      [name]: value,
    };

    if (name === "className") {
      updated.sectionName = "";
    }

    const examName =
      name === "examName"
        ? value
        : updated.examName;

    const className =
      name === "className"
        ? value
        : updated.className;

    const sectionName =
      name === "sectionName"
        ? value
        : updated.sectionName;

    if (examName && className) {

      updated.subjects =
        getSubjectsForSetup(
          examName,
          className,
          sectionName
        );

    } else {

      updated.subjects = [];

    }

    setFormData(updated);

  };

  const handleSubjectMarksChange = (
    index,
    field,
    value
  ) => {

    const updatedSubjects = [
      ...formData.subjects,
    ];

    updatedSubjects[index] = {
      ...updatedSubjects[index],
      [field]: value,
    };

    setFormData({
      ...formData,
      subjects: updatedSubjects,
    });

  };

  const handleSave = () => {

    if (
      !formData.examName ||
      !formData.className
    ) {

      alert(
        "Please select exam and class"
      );

      return;

    }

    if (
      formData.subjects.length === 0
    ) {

      alert(
        "No subject mapped with selected class"
      );

      return;

    }

    const emptyMaximumMarks =
      formData.subjects.find(
        (item) =>
          !item.maximumMarks
      );

    if (emptyMaximumMarks) {

      alert(
        "Please fill maximum marks for all subjects"
      );

      return;

    }

    const invalidPassingMarks =
      formData.subjects.find(
        (item) =>
          item.passingMarks &&
          Number(
            item.passingMarks
          ) >
            Number(
              item.maximumMarks
            )
      );

    if (invalidPassingMarks) {

      alert(
        "Passing marks cannot exceed maximum marks"
      );

      return;

    }

    const updatedSetups = [
      ...marksSetups,
    ];

    formData.subjects.forEach(
      (subject) => {

        const existingIndex =
          updatedSetups.findIndex(
            (setup) =>
              setup.schoolId ===
                schoolId &&
              setup.examName ===
                formData.examName &&
              setup.className ===
                formData.className &&
              setup.sectionName ===
                formData.sectionName &&
              setup.subjectName ===
                subject.subjectName
          );

        if (existingIndex >= 0) {

          updatedSetups[
            existingIndex
          ] = {

            ...updatedSetups[
              existingIndex
            ],

            maximumMarks:
              Number(
                subject.maximumMarks
              ),

            passingMarks:
              subject.passingMarks,

          };

        } else {

          updatedSetups.push({

            id:
              Date.now() +
              Math.random(),

            schoolId,

            examName:
              formData.examName,

            className:
              formData.className,

            sectionName:
              formData.sectionName,

            subjectName:
              subject.subjectName,

            maximumMarks:
              Number(
                subject.maximumMarks
              ),

            passingMarks:
              subject.passingMarks,

            marksEntryStarted:
              false,

            resultGenerated:
              false,

          });

        }

      }
    );

    setMarksSetups(
      updatedSetups
    );

    alert(
      "Marks setup saved successfully"
    );

    resetForm();

    setShowForm(false);

  };

  const handleEdit = () => {

    if (
      selectedIds.length !== 1
    ) {

      alert(
        "Select one setup"
      );

      return;

    }

    const selectedGroup =
      groupedSetups.find(
        (item) =>
          item.groupKey ===
          selectedIds[0]
      );

    if (!selectedGroup)
      return;

    setFormData({

      examName:
        selectedGroup.examName,

      className:
        selectedGroup.className,

      sectionName:
        selectedGroup.sectionName,

      subjects:
        getSubjectsForSetup(
          selectedGroup.examName,
          selectedGroup.className,
          selectedGroup.sectionName
        ),

    });

    setShowForm(true);

  };

  const handleDelete = () => {

    if (
      selectedIds.length === 0
    ) {

      alert("Select setup");

      return;

    }

    const selectedGroups =
      groupedSetups.filter(
        (item) =>
          selectedIds.includes(
            item.groupKey
          )
      );

    const blocked =
      selectedGroups.some(
        (item) =>
          item.marksEntryStarted ||
          item.resultGenerated
      );

    if (blocked) {

      alert(
        "Marks entry/result already exists. Setup cannot be deleted."
      );

      return;

    }

    const ok =
      window.confirm(
        "Delete selected marks setup?"
      );

    if (!ok) return;

    setMarksSetups(

      marksSetups.filter(
        (setup) => {

          const key =
            getGroupKey(setup);

          return !selectedIds.includes(
            key
          );

        }
      )

    );

    setSelectedIds([]);

    alert(
      "Marks setup deleted successfully"
    );

  };

  return (

    <div className="exam-marks-page">

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
              ? "Add / Edit Marks Setup"
              : "Exam Marks Setup"}

          </h1>

          <p>
            Manage exam wise
            maximum marks
          </p>

        </div>

      </div>
      {!showForm && (
        <>

          <div className="common-card">

            <div className="filter-grid">

              <div className="form-group">

                <label>
                  Exam
                </label>

                <select
                  value={filterData.examName}
                  onChange={(e) =>
                    setFilterData({
                      ...filterData,
                      examName:
                        e.target.value,
                    })
                  }
                >

                  <option value="">
                    All Exams
                  </option>

                  {schoolExams.map(
                    (item) => (
                      <option
                        key={item.id}
                        value={
                          item.examName
                        }
                      >
                        {item.examName}
                      </option>
                    )
                  )}

                </select>

              </div>

              <div className="form-group">

                <label>
                  Class
                </label>

                <select
                  value={filterData.className}
                  onChange={(e) =>
                    setFilterData({
                      ...filterData,
                      className:
                        e.target.value,
                      sectionName:
                        "",
                      subjectName:
                        "",
                    })
                  }
                >

                  <option value="">
                    All Classes
                  </option>

                  {schoolClasses.map(
                    (item) => (
                      <option
                        key={item.id}
                        value={
                          item.className
                        }
                      >
                        Class{" "}
                        {
                          item.className
                        }
                      </option>
                    )
                  )}

                </select>

              </div>

              <div className="form-group">

                <label>
                  Section
                </label>

                <select
                  value={
                    filterData.sectionName
                  }
                  onChange={(e) =>
                    setFilterData({
                      ...filterData,
                      sectionName:
                        e.target.value,
                    })
                  }
                >

                  <option value="">
                    All Sections
                  </option>

                  {filterSections.map(
                    (item) => (
                      <option
                        key={item.id}
                        value={
                          item.sectionName
                        }
                      >
                        {
                          item.sectionName
                        }
                      </option>
                    )
                  )}

                </select>

              </div>

              <div className="form-group">

                <label>
                  Subject Filter
                </label>

                <select
                  value={
                    filterData.subjectName
                  }
                  onChange={(e) =>
                    setFilterData({
                      ...filterData,
                      subjectName:
                        e.target.value,
                    })
                  }
                >

                  <option value="">
                    All Subjects
                  </option>

                  {filterSubjects.map(
                    (item) => (
                      <option
                        key={item.id}
                        value={
                          item.subjectName
                        }
                      >
                        {
                          item.subjectName
                        }
                      </option>
                    )
                  )}

                </select>

              </div>

            </div>

            <div className="form-actions">

              <AppButton
                type="primary"
                onClick={
                  handleSearch
                }
              >
                Search
              </AppButton>

            </div>

          </div>

          <div className="common-card">

            <div className="list-header">

              <h2>
                Marks Setup List
              </h2>

              <div className="list-action-buttons">

                <AppButton
                  type="primary"
                  onClick={() => {

                    resetForm();

                    setShowForm(true);

                  }}
                >
                  + Add Marks Setup
                </AppButton>

                <AppButton
                  type="primary"
                  onClick={handleEdit}
                >
                  Edit
                </AppButton>

                <AppButton
                  type="delete"
                  onClick={
                    handleDelete
                  }
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
                          groupedSetups.length >
                            0 &&
                          selectedIds.length ===
                            groupedSetups.length
                        }
                        onChange={(e) => {

                          if (
                            e.target.checked
                          ) {

                            setSelectedIds(
                              groupedSetups.map(
                                (item) =>
                                  item.groupKey
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
                      Exam
                    </th>

                    <th>
                      Class
                    </th>

                    <th>
                      Section
                    </th>

                    <th>
                      Subjects Count
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {groupedSetups.length ===
                  0 ? (

                    <tr>

                      <td
                        colSpan="6"
                        className="empty-row"
                      >
                        No marks
                        setup found
                      </td>

                    </tr>

                  ) : (

                    groupedSetups.map(
                      (
                        item,
                        index
                      ) => (

                        <tr
                          key={
                            item.groupKey
                          }
                        >

                          <td>

                            <input
                              type="checkbox"
                              checked={selectedIds.includes(
                                item.groupKey
                              )}
                              onChange={() => {

                                setSelectedIds(
                                  (
                                    prev
                                  ) =>

                                    prev.includes(
                                      item.groupKey
                                    )

                                      ? prev.filter(
                                          (
                                            id
                                          ) =>
                                            id !==
                                            item.groupKey
                                        )

                                      : [
                                          ...prev,
                                          item.groupKey,
                                        ]
                                );

                              }}
                            />

                          </td>

                          <td>
                            {index + 1}
                          </td>

                          <td>
                            {
                              item.examName
                            }
                          </td>

                          <td>
                            {
                              item.className
                            }
                          </td>

                          <td>
                            {item.sectionName ||
                              "All"}
                          </td>

                          <td>
                            {
                              item.subjectCount
                            }
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

          <div className="exam-marks-form-grid">

            <div className="form-group">

              <label>
                Exam *
              </label>

              <select
                value={formData.examName}
                onChange={(e) =>
                  handleFormMainChange(
                    "examName",
                    e.target.value
                  )
                }
              >

                <option value="">
                  Select Exam
                </option>

                {schoolExams.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={
                        item.examName
                      }
                    >
                      {item.examName}
                    </option>
                  )
                )}

              </select>

            </div>

            <div className="form-group">

              <label>
                Class *
              </label>

              <select
                value={formData.className}
                onChange={(e) =>
                  handleFormMainChange(
                    "className",
                    e.target.value
                  )
                }
              >

                <option value="">
                  Select Class
                </option>

                {schoolClasses.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={
                        item.className
                      }
                    >
                      Class{" "}
                      {
                        item.className
                      }
                    </option>
                  )
                )}

              </select>

            </div>

            <div className="form-group">

              <label>
                Section
              </label>

              <select
                value={
                  formData.sectionName
                }
                onChange={(e) =>
                  handleFormMainChange(
                    "sectionName",
                    e.target.value
                  )
                }
              >

                <option value="">
                  All Sections
                </option>

                {formSections.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={
                        item.sectionName
                      }
                    >
                      {
                        item.sectionName
                      }
                    </option>
                  )
                )}

              </select>

            </div>

          </div>

          <div className="subject-marks-box">

            <h2>
              Subject Marks Setup
            </h2>

            {formData.subjects
              .length === 0 ? (

              <p className="empty-row">
                Select exam and
                class to load
                subjects
              </p>

            ) : (

              <div className="subject-marks-list">

                {formData.subjects.map(
                  (
                    subject,
                    index
                  ) => (

                    <div
                      className="subject-marks-row"
                      key={
                        subject.subjectName
                      }
                    >

                      <div className="subject-name-box">

                        {
                          subject.subjectName
                        }

                      </div>

                      <div className="form-group">

                        <label>
                          Maximum Marks *
                        </label>

                        <input
                          type="number"
                          value={
                            subject.maximumMarks
                          }
                          disabled={
                            subject.marksEntryStarted
                          }
                          onChange={(e) =>
                            handleSubjectMarksChange(
                              index,
                              "maximumMarks",
                              e.target
                                .value
                            )
                          }
                        />

                      </div>

                      <div className="form-group">

                        <label>
                          Passing Marks
                        </label>

                        <input
                          type="number"
                          value={
                            subject.passingMarks
                          }
                          onChange={(e) =>
                            handleSubjectMarksChange(
                              index,
                              "passingMarks",
                              e.target
                                .value
                            )
                          }
                        />

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

          <div className="form-actions">

            <AppButton
              type="primary"
              onClick={handleSave}
            >
              Save All
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

    </div>

  );

}

export default ExamMarksSetup;