import React, { useState } from "react";
import "./examTimetable.css";
import AppButton from "../components/AppButton";

function ExamTimetable() {
  const schoolId =
    localStorage.getItem("schoolId") || "SCH001";

  const exams = [
    {
      id: 1,
      schoolId: "SCH001",
      examName: "Unit Test 1",
    },
    {
      id: 2,
      schoolId: "SCH001",
      examName: "Half-Yearly Examination",
    },
    {
      id: 3,
      schoolId: "SCH001",
      examName: "Annual Examination",
    },
  ];

  const classes = [
    { id: 1, schoolId: "SCH001", className: "9" },
    { id: 2, schoolId: "SCH001", className: "10" },
  ];

  const sections = [
    { id: 1, schoolId: "SCH001", className: "9", sectionName: "A" },
    { id: 2, schoolId: "SCH001", className: "9", sectionName: "B" },
    { id: 3, schoolId: "SCH001", className: "10", sectionName: "A" },
    { id: 4, schoolId: "SCH001", className: "10", sectionName: "B" },
  ];

  const subjects = [
    { id: 1, schoolId: "SCH001", className: "9", subjectName: "Hindi" },
    { id: 2, schoolId: "SCH001", className: "9", subjectName: "English" },
    { id: 3, schoolId: "SCH001", className: "10", subjectName: "Science" },
    { id: 4, schoolId: "SCH001", className: "10", subjectName: "Math" },
  ];

  const schoolDetails = {
    name: "CHANDRA SHEKHAR AZAD INTER COLLEGE",
    address: "Rasauli, Barabanki",
    contact: "+91 8840248644",
  };

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const [filterData, setFilterData] = useState({
    examName: "",
    className: "",
    sectionName: "",
  });

  const [appliedFilters, setAppliedFilters] = useState({
    examName: "",
    className: "",
    sectionName: "",
  });

  const emptyForm = {
    mode: "Single",
    examName: "",
    className: "",
    sectionName: "",
    selectedClassSections: [],
    subjectName: "",
    examDate: "",
    startTime: "",
    endTime: "",
  };

  const [formData, setFormData] = useState(emptyForm);

  const [timetableList, setTimetableList] = useState([
    {
      id: 1,
      schoolId: "SCH001",
      examName: "Half-Yearly Examination",
      className: "9",
      sectionName: "A",
      subjectName: "Hindi",
      examDate: "2026-09-10",
      startTime: "09:00",
      endTime: "12:00",
    },
    {
      id: 2,
      schoolId: "SCH001",
      examName: "Half-Yearly Examination",
      className: "9",
      sectionName: "B",
      subjectName: "Hindi",
      examDate: "2026-09-10",
      startTime: "09:00",
      endTime: "12:00",
    },
  ]);

  const schoolExams = exams.filter(
    (item) => item.schoolId === schoolId
  );

  const schoolClasses = classes.filter(
    (item) => item.schoolId === schoolId
  );

  const filterSections = sections.filter(
    (item) =>
      item.schoolId === schoolId &&
      (!filterData.className ||
        item.className === filterData.className)
  );

  const formSections = sections.filter(
    (item) =>
      item.schoolId === schoolId &&
      (!formData.className ||
        item.className === formData.className)
  );

  const formSubjects = subjects.filter(
    (item) =>
      item.schoolId === schoolId &&
      (!formData.className ||
        item.className === formData.className)
  );

  const classSectionOptions = sections.filter(
    (item) => item.schoolId === schoolId
  );

  const filteredTimetable = timetableList.filter(
    (item) =>
      item.schoolId === schoolId &&
      (!appliedFilters.examName ||
        item.examName === appliedFilters.examName) &&
      (!appliedFilters.className ||
        item.className === appliedFilters.className) &&
      (!appliedFilters.sectionName ||
        item.sectionName === appliedFilters.sectionName)
  );

  const resetForm = () => {
    setFormData(emptyForm);
    setEditId(null);
  };

  const handleSearch = () => {
    setAppliedFilters(filterData);
    setSelectedIds([]);
  };

  const formatTime = (start, end) => {
    return `${start} - ${end}`;
  };
  const handleSave = () => {

    if (
      !formData.examName ||
      !formData.subjectName ||
      !formData.examDate ||
      !formData.startTime ||
      !formData.endTime
    ) {
      alert("Please fill all required fields");
      return;
    }

    if (
      formData.mode === "Single" &&
      (!formData.className ||
        !formData.sectionName)
    ) {
      alert("Please select class and section");
      return;
    }

    if (
      formData.mode === "Multiple" &&
      formData.selectedClassSections.length === 0
    ) {
      alert(
        "Please select class sections"
      );
      return;
    }

    if (
      formData.endTime <=
      formData.startTime
    ) {
      alert(
        "End time cannot be before start time"
      );
      return;
    }

    if (formData.mode === "Single") {

      const duplicate =
        timetableList.some(
          (item) =>
            item.examName ===
              formData.examName &&
            item.className ===
              formData.className &&
            item.sectionName ===
              formData.sectionName &&
            item.subjectName ===
              formData.subjectName &&
            item.id !== editId
        );

      if (duplicate) {
        alert(
          "Duplicate timetable not allowed"
        );
        return;
      }

      if (editId) {

        setTimetableList(
          timetableList.map((item) =>
            item.id === editId
              ? {
                  ...item,
                  examName:
                    formData.examName,
                  className:
                    formData.className,
                  sectionName:
                    formData.sectionName,
                  subjectName:
                    formData.subjectName,
                  examDate:
                    formData.examDate,
                  startTime:
                    formData.startTime,
                  endTime:
                    formData.endTime,
                }
              : item
          )
        );

        alert(
          "Timetable updated successfully"
        );

      } else {

        const newRecord = {
          id: Date.now(),
          schoolId,
          examName:
            formData.examName,
          className:
            formData.className,
          sectionName:
            formData.sectionName,
          subjectName:
            formData.subjectName,
          examDate:
            formData.examDate,
          startTime:
            formData.startTime,
          endTime:
            formData.endTime,
        };

        setTimetableList([
          ...timetableList,
          newRecord,
        ]);

        alert(
          "Timetable added successfully"
        );

      }

    } else {

      const duplicateFound =
        formData.selectedClassSections.some(
          (value) => {

            const splitData =
              value.split("-");

            const className =
              splitData[0];

            const sectionName =
              splitData[1];

            return timetableList.some(
              (item) =>
                item.examName ===
                  formData.examName &&
                item.className ===
                  className &&
                item.sectionName ===
                  sectionName &&
                item.subjectName ===
                  formData.subjectName
            );

          }
        );

      if (duplicateFound) {
        alert(
          "Duplicate timetable not allowed"
        );
        return;
      }

      const newRecords =
        formData.selectedClassSections.map(
          (value) => {

            const splitData =
              value.split("-");

            return {
              id:
                Date.now() +
                Math.random(),
              schoolId,
              examName:
                formData.examName,
              className:
                splitData[0],
              sectionName:
                splitData[1],
              subjectName:
                formData.subjectName,
              examDate:
                formData.examDate,
              startTime:
                formData.startTime,
              endTime:
                formData.endTime,
            };

          }
        );

      setTimetableList([
        ...timetableList,
        ...newRecords,
      ]);

      alert(
        "Multi class timetable added successfully"
      );

    }

    resetForm();
    setShowForm(false);
  };

  const handleEdit = () => {

    if (selectedIds.length !== 1) {
      alert(
        "Please select one timetable"
      );
      return;
    }

    const selected =
      timetableList.find(
        (item) =>
          item.id ===
          selectedIds[0]
      );

    if (!selected) return;

    setEditId(selected.id);

    setFormData({
      mode: "Single",
      examName:
        selected.examName,
      className:
        selected.className,
      sectionName:
        selected.sectionName,
      selectedClassSections: [],
      subjectName:
        selected.subjectName,
      examDate:
        selected.examDate,
      startTime:
        selected.startTime,
      endTime:
        selected.endTime,
    });

    setShowForm(true);
  };

  const handleDelete = () => {

    if (selectedIds.length === 0) {
      alert(
        "Please select timetable"
      );
      return;
    }

    const ok = window.confirm(
      "Delete selected timetable?"
    );

    if (!ok) return;

    setTimetableList(
      timetableList.filter(
        (item) =>
          !selectedIds.includes(item.id)
      )
    );

    setSelectedIds([]);

    alert(
      "Timetable deleted successfully"
    );
  };
  const handlePrint = () => {
    if (selectedIds.length === 0) {
      alert("Please select timetable rows");
      return;
    }

    const selectedRows = timetableList.filter((item) =>
      selectedIds.includes(item.id)
    );

    const groupedRows = [];

    selectedRows.forEach((item) => {
      const existing = groupedRows.find(
        (row) =>
          row.examName === item.examName &&
          row.className === item.className &&
          row.subjectName === item.subjectName &&
          row.examDate === item.examDate &&
          row.startTime === item.startTime &&
          row.endTime === item.endTime
      );

      if (existing) {
        existing.sections.push(item.sectionName);
      } else {
        groupedRows.push({
          ...item,
          sections: [item.sectionName],
        });
      }
    });

    const printWindow = window.open("", "_blank");

    const rowsHtml = groupedRows
      .map(
        (item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${item.className} (${item.sections.join(", ")})</td>
            <td>${item.subjectName}</td>
            <td>${item.examDate}</td>
            <td>${formatTime(item.startTime, item.endTime)}</td>
          </tr>
        `
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Exam Timetable</title>

          <style>
            @page {
              size: A4 landscape;
              margin: 12mm;
            }

            body {
              font-family: Arial, sans-serif;
              color: #111827;
            }

            .print-header {
              text-align: center;
              border-bottom: 2px solid #111827;
              padding-bottom: 10px;
              margin-bottom: 16px;
            }

            .print-header h1 {
              margin: 0;
              font-size: 22px;
            }

            .print-header p {
              margin: 4px 0;
              font-size: 13px;
            }

            .exam-title {
              text-align: center;
              margin: 12px 0;
              font-size: 18px;
              font-weight: bold;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
            }

            th,
            td {
              border: 1px solid #111827;
              padding: 8px;
              text-align: center;
            }

            th {
              background: #f1f5f9;
            }
          </style>
        </head>

        <body>
          <div class="print-header">
            <h1>${schoolDetails.name}</h1>
            <p>${schoolDetails.address}</p>
            <p>Contact: ${schoolDetails.contact}</p>
          </div>

          <div class="exam-title">
            ${groupedRows[0]?.examName || "Exam Timetable"}
          </div>

          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Class</th>
                <th>Subject</th>
                <th>Exam Date</th>
                <th>Time</th>
              </tr>
            </thead>

            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  const handleClassSectionToggle = (value) => {
    setFormData((prev) => ({
      ...prev,
      selectedClassSections: prev.selectedClassSections.includes(value)
        ? prev.selectedClassSections.filter((item) => item !== value)
        : [...prev.selectedClassSections, value],
    }));
  };

  return (
    <div className="exam-timetable-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => {
            if (showForm) {
              resetForm();
              setShowForm(false);
            } else {
              window.location.href = "/exam-tools";
            }
          }}
        >
          ←
        </AppButton>

        <div>
          <h1>{showForm ? "Add / Edit Timetable" : "Exam Timetable"}</h1>
          <p>Create and manage exam schedules</p>
        </div>
      </div>
      {!showForm && (
        <>
          <div className="common-card">
            <div className="exam-filter-grid">
              <div className="form-group">
                <label>Exam Name</label>

                <select
                  value={filterData.examName}
                  onChange={(e) =>
                    setFilterData({
                      ...filterData,
                      examName: e.target.value,
                    })
                  }
                >
                  <option value="">All Exam</option>

                  {schoolExams.map((exam) => (
                    <option key={exam.id} value={exam.examName}>
                      {exam.examName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Class</label>

                <select
                  value={filterData.className}
                  onChange={(e) =>
                    setFilterData({
                      ...filterData,
                      className: e.target.value,
                      sectionName: "",
                    })
                  }
                >
                  <option value="">All Class</option>

                  {schoolClasses.map((cls) => (
                    <option key={cls.id} value={cls.className}>
                      Class {cls.className}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Section</label>

                <select
                  value={filterData.sectionName}
                  onChange={(e) =>
                    setFilterData({
                      ...filterData,
                      sectionName: e.target.value,
                    })
                  }
                >
                  <option value="">All Section</option>

                  {filterSections.map((sec) => (
                    <option key={sec.id} value={sec.sectionName}>
                      {sec.sectionName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-actions search-action-row">
              <AppButton type="primary" onClick={handleSearch}>
                Search
              </AppButton>
            </div>
          </div>

          <div className="top-action-bar">
            <AppButton
              type="primary"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              + Add Timetable
            </AppButton>
          </div>

          <div className="common-card">
            <div className="list-header">
              <h2>Timetable List</h2>

              <div className="list-action-buttons">
                <AppButton type="primary" onClick={handlePrint}>
                  Print
                </AppButton>

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
                          filteredTimetable.length > 0 &&
                          selectedIds.length === filteredTimetable.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(
                              filteredTimetable.map((item) => item.id)
                            );
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                      />
                    </th>

                    <th>S.No</th>
                    <th>Exam Name</th>
                    <th>Class</th>
                    <th>Section</th>
                    <th>Subject</th>
                    <th>Exam Date</th>
                    <th>Time</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTimetable.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="empty-row">
                        No timetable found
                      </td>
                    </tr>
                  ) : (
                    filteredTimetable.map((item, index) => (
                      <tr key={item.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => {
                              setSelectedIds((prev) =>
                                prev.includes(item.id)
                                  ? prev.filter((id) => id !== item.id)
                                  : [...prev, item.id]
                              );
                            }}
                          />
                        </td>

                        <td>{index + 1}</td>
                        <td>{item.examName}</td>
                        <td>{item.className}</td>
                        <td>{item.sectionName}</td>
                        <td>{item.subjectName}</td>
                        <td>{item.examDate}</td>
                        <td>{formatTime(item.startTime, item.endTime)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      {showForm && (
        <div className="common-card">
          <div className="mode-selection">
            <label>
              <input
                type="radio"
                name="mode"
                value="Single"
                checked={formData.mode === "Single"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    mode: e.target.value,
                  })
                }
              />
              Single Class
            </label>

            <label>
              <input
                type="radio"
                name="mode"
                value="Multiple"
                checked={formData.mode === "Multiple"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    mode: e.target.value,
                  })
                }
              />
              Multiple Classes
            </label>
          </div>

          <div className="exam-form-grid">
            {formData.mode === "Single" ? (
              <>
                <div className="form-group">
                  <label>Class *</label>

                  <select
                    value={formData.className}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        className: e.target.value,
                        sectionName: "",
                        subjectName: "",
                      })
                    }
                  >
                    <option value="">Select Class</option>

                    {schoolClasses.map((cls) => (
                      <option
                        key={cls.id}
                        value={cls.className}
                      >
                        Class {cls.className}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Section *</label>

                  <select
                    value={formData.sectionName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sectionName: e.target.value,
                      })
                    }
                  >
                    <option value="">
                      Select Section
                    </option>

                    {formSections.map((sec) => (
                      <option
                        key={sec.id}
                        value={sec.sectionName}
                      >
                        {sec.sectionName}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <div className="multi-class-box">
                <label>
                  Select Class & Sections *
                </label>

                <div className="multi-class-grid">
                 {classSectionOptions.length === 0 ? (

  <p className="empty-row">
    No class section found
  </p>

) : (

  classSectionOptions.map((item) => {

                    const value =
                      `${item.className}-${item.sectionName}`;

                    return (
                      <label
                        key={item.id}
                        className="multi-checkbox"
                      >
                        <input
                          type="checkbox"
                          checked={
                            formData.selectedClassSections.includes(
                              value
                            )
                          }
                          onChange={() =>
                            handleClassSectionToggle(
                              value
                            )
                          }
                        />

                        Class {item.className}
                        {" - "}
                        {item.sectionName}
                      </label>
                    );
                
                  })
                )}
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Exam Name *</label>

              <select
                value={formData.examName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    examName: e.target.value,
                  })
                }
              >
                <option value="">
                  Select Exam
                </option>

                {schoolExams.map((exam) => (
                  <option
                    key={exam.id}
                    value={exam.examName}
                  >
                    {exam.examName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Subject *</label>

              <select
                value={formData.subjectName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    subjectName: e.target.value,
                  })
                }
              >
                <option value="">
                  Select Subject
                </option>

                {formSubjects.map((subject) => (
                  <option
                    key={subject.id}
                    value={subject.subjectName}
                  >
                    {subject.subjectName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Exam Date *</label>

              <input
                type="date"
                value={formData.examDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    examDate: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-group">
              <label>Start Time *</label>

              <input
                type="time"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    startTime: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-group">
              <label>End Time *</label>

              <input
                type="time"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    endTime: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="form-actions">
            <AppButton
              type="primary"
              onClick={handleSave}
            >
              {editId ? "Update" : "Save"}
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

export default ExamTimetable;