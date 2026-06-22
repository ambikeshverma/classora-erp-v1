import React, { useState } from "react";
import "./scholasticMarksEntry.css";
import AppButton from "../components/AppButton";

function ScholasticMarksEntry() {
  const schoolId = localStorage.getItem("schoolId") || "SCH001";

  const exams = [
    {
      id: 1,
      schoolId: "SCH001",
      examName: "Unit Test 1",
      applicableClasses: ["9"],
    },
    {
      id: 2,
      schoolId: "SCH001",
      examName: "Half-Yearly Examination",
      applicableClasses: ["10"],
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
  ];

  const students = [
    {
      id: 1,
      schoolId: "SCH001",
      rollNo: "02",
      studentName: "Priya Singh",
      className: "9",
      sectionName: "A",
    },
    {
      id: 2,
      schoolId: "SCH001",
      rollNo: "01",
      studentName: "Aarav Sharma",
      className: "9",
      sectionName: "A",
    },
  ];

  const studentSubjectMapping = [
    {
      studentId: 1,
      className: "9",
      sectionName: "A",
      scholasticSubjects: ["Hindi", "English", "Math", "Science", "SST"],
    },
    {
      studentId: 2,
      className: "9",
      sectionName: "A",
      scholasticSubjects: ["Hindi", "English", "Math"],
    },
  ];

  const examMarksSetup = [
    {
      examName: "Unit Test 1",
      className: "9",
      sectionName: "A",
      subjectName: "Hindi",
      maximumMarks: 100,
    },
    {
      examName: "Unit Test 1",
      className: "9",
      sectionName: "A",
      subjectName: "English",
      maximumMarks: 100,
    },
    {
      examName: "Unit Test 1",
      className: "9",
      sectionName: "A",
      subjectName: "Math",
      maximumMarks: 100,
    },
    {
      examName: "Unit Test 1",
      className: "9",
      sectionName: "A",
      subjectName: "Science",
      maximumMarks: 100,
    },
    {
      examName: "Unit Test 1",
      className: "9",
      sectionName: "A",
      subjectName: "SST",
      maximumMarks: 100,
    },
  ];

  const resultLocks = [
    {
      schoolId: "SCH001",
      examName: "Unit Test 1",
      className: "9",
      sectionName: "A",
      isLocked: false,
    },
  ];

  const [filterData, setFilterData] = useState({
    examName: "",
    className: "",
    sectionName: "",
    subjectFilter: "All Subjects",
  });

  const [searched, setSearched] = useState(false);
  const [marksData, setMarksData] = useState({});

  const schoolExams = exams.filter((item) => item.schoolId === schoolId);

  const selectedExam = schoolExams.find(
    (item) => item.examName === filterData.examName
  );

  const schoolClasses = classes.filter(
    (item) =>
      item.schoolId === schoolId &&
      (!filterData.examName ||
        selectedExam?.applicableClasses?.includes(item.className))
  );

  const filteredSections = sections.filter(
    (item) =>
      item.schoolId === schoolId &&
      (!filterData.className || item.className === filterData.className)
  );

  const filteredStudents = students
    .filter(
      (item) =>
        item.schoolId === schoolId &&
        item.className === filterData.className &&
        item.sectionName === filterData.sectionName
    )
    .sort((a, b) => {
      const rollA = Number(a.rollNo);
      const rollB = Number(b.rollNo);

      if (!isNaN(rollA) && !isNaN(rollB)) {
        return rollA - rollB;
      }

      return a.studentName.localeCompare(b.studentName);
    });

  const isResultLocked = resultLocks.some(
    (item) =>
      item.schoolId === schoolId &&
      item.examName === filterData.examName &&
      item.className === filterData.className &&
      item.sectionName === filterData.sectionName &&
      item.isLocked
  );

  const getStudentSubjects = (studentId) => {
    const mapping = studentSubjectMapping.find(
      (item) =>
        item.studentId === studentId &&
        item.className === filterData.className &&
        item.sectionName === filterData.sectionName
    );

    if (!mapping) return [];

    if (filterData.subjectFilter === "All Subjects") {
      return mapping.scholasticSubjects;
    }

    return mapping.scholasticSubjects.filter(
      (subject) => subject === filterData.subjectFilter
    );
  };

  const getAllSubjectsForFilter = () => {
    const subjectSet = new Set();

    studentSubjectMapping
      .filter(
        (item) =>
          item.className === filterData.className &&
          item.sectionName === filterData.sectionName
      )
      .forEach((item) => {
        item.scholasticSubjects.forEach((subject) => subjectSet.add(subject));
      });

    return Array.from(subjectSet);
  };

  const getMaximumMarks = (subjectName) => {
    const found = examMarksSetup.find(
      (item) =>
        item.examName === filterData.examName &&
        item.className === filterData.className &&
        item.sectionName === filterData.sectionName &&
        item.subjectName === subjectName
    );

    return found ? found.maximumMarks : 0;
  };

  const calculateTotal = (studentId) => {
    const subjects = getStudentSubjects(studentId);

    let obtained = 0;
    let maximum = 0;

    subjects.forEach((subjectName) => {
      const value = marksData[`${studentId}_${subjectName}`] || "";
      const maxMarks = getMaximumMarks(subjectName);

      maximum += Number(maxMarks);

      if (value !== "" && value !== "AB" && value !== "ML" && !isNaN(value)) {
        obtained += Number(value);
      }
    });

    return { obtained, maximum };
  };

  const handleSearch = () => {
    if (!filterData.examName || !filterData.className || !filterData.sectionName) {
      alert("Please select exam, class and section");
      return;
    }

    setSearched(true);
  };

  const handleMarksChange = (studentId, subjectName, value) => {
    if (isResultLocked) return;

    const upperValue = value.toUpperCase();
    const maximumMarks = getMaximumMarks(subjectName);

    if (upperValue !== "" && upperValue !== "AB" && upperValue !== "ML") {
      if (isNaN(upperValue)) return;
      if (Number(upperValue) < 0) return;

      if (Number(upperValue) > maximumMarks) {
        alert(`Maximum marks for ${subjectName} is ${maximumMarks}`);
        return;
      }
    }

    setMarksData((prev) => ({
      ...prev,
      [`${studentId}_${subjectName}`]: upperValue,
    }));
  };

  const handleSave = () => {
    if (isResultLocked) {
      alert("Result is locked. Marks cannot be edited.");
      return;
    }

    alert("Scholastic marks saved successfully");
  };

  return (
    <div className="scholastic-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => (window.location.href = "/report-card-management")}
        >
          ←
        </AppButton>

        <div>
          <h1>Scholastic Marks Entry</h1>
          <p>Enter and manage subject wise scholastic marks</p>
        </div>
      </div>

      <div className="common-card">
        <h2>Filter Records</h2>

        <div className="filter-grid">
          <div className="form-group">
            <label>Exam</label>

            <select
              value={filterData.examName}
              onChange={(e) =>
                setFilterData({
                  ...filterData,
                  examName: e.target.value,
                  className: "",
                  sectionName: "",
                  subjectFilter: "All Subjects",
                })
              }
            >
              <option value="">Select Exam</option>

              {schoolExams.map((item) => (
                <option key={item.id} value={item.examName}>
                  {item.examName}
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
                  subjectFilter: "All Subjects",
                })
              }
            >
              <option value="">Select Class</option>

              {schoolClasses.map((item) => (
                <option key={item.id} value={item.className}>
                  {item.className}
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
                  subjectFilter: "All Subjects",
                })
              }
            >
              <option value="">Select Section</option>

              {filteredSections.map((item) => (
                <option key={item.id} value={item.sectionName}>
                  {item.sectionName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Subject Filter</label>

            <select
              value={filterData.subjectFilter}
              onChange={(e) =>
                setFilterData({
                  ...filterData,
                  subjectFilter: e.target.value,
                })
              }
            >
              <option value="All Subjects">All Subjects</option>

              {getAllSubjectsForFilter().map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-actions">
          <AppButton type="primary" onClick={handleSearch}>
            Search
          </AppButton>
        </div>
      </div>

      <div className="marks-notice">
        NOTE: AB = Absent | ML = Medical Leave | Only numbers, AB and ML allowed | Invalid value not allowed
      </div>

      {isResultLocked && (
        <div className="lock-warning-card">
          <p>Result is locked. Marks cannot be edited.</p>
        </div>
      )}

      {searched && (
        <div className="common-card">
          <div className="list-header">
            <h2>Marks Entry List</h2>
          </div>

          <div className="marks-entry-list">
            {filteredStudents.length === 0 ? (
              <div className="empty-row">No students found</div>
            ) : (
              filteredStudents.map((student) => {
                const subjects = getStudentSubjects(student.id);
                const total = calculateTotal(student.id);

                return (
                  <div className="student-marks-card" key={student.id}>
                    <div className="student-top">
                      <div>
                        <span className="student-roll">
                          Roll No: {student.rollNo}
                        </span>

                        <h3>{student.studentName}</h3>
                      </div>

                      <div className="live-total-box">
                        Live Total
                        <strong>
                          {total.obtained} / {total.maximum}
                        </strong>
                      </div>
                    </div>

                    {subjects.length === 0 ? (
                      <p className="empty-message">
                        No scholastic subjects assigned for this student.
                      </p>
                    ) : (
                      <div className="subject-entry-grid">
                        {subjects.map((subject) => (
                          <div className="subject-input-box" key={subject}>
                            <label>
                              {subject} ({getMaximumMarks(subject)})
                            </label>

                            <input
                              type="text"
                              value={marksData[`${student.id}_${subject}`] || ""}
                              disabled={isResultLocked}
                              onChange={(e) =>
                                handleMarksChange(
                                  student.id,
                                  subject,
                                  e.target.value
                                )
                              }
                              placeholder="Enter Marks / AB / ML"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="form-actions">
            <AppButton type="primary" onClick={handleSave}>
              Save Marks
            </AppButton>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScholasticMarksEntry;