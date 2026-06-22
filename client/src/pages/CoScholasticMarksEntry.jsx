import React, { useState } from "react";
import "./coScholasticMarksEntry.css";
import AppButton from "../components/AppButton";

function CoScholasticMarksEntry() {
  const schoolId = localStorage.getItem("schoolId") || "SCH001";

  const exams = [
    {
      id: 1,
      schoolId: "SCH001",
      examName: "Unit Test 1",
      applicableClasses: ["9"],
      allowCoScholastic: false,
    },
    {
      id: 2,
      schoolId: "SCH001",
      examName: "Half-Yearly Examination",
      applicableClasses: ["9"],
      allowCoScholastic: true,
    },
    {
      id: 3,
      schoolId: "SCH001",
      examName: "Annual Examination",
      applicableClasses: ["9", "10"],
      allowCoScholastic: true,
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
      coScholasticSubjects: ["Discipline", "Art Education", "Sports"],
    },
    {
      studentId: 2,
      className: "9",
      sectionName: "A",
      scholasticSubjects: ["Hindi", "English", "Math", "Science", "SST"],
      coScholasticSubjects: ["Discipline", "Health Education"],
    },
  ];

  const examMarksSetup = [
    { examName: "Half-Yearly Examination", className: "9", sectionName: "A", subjectName: "Hindi", maximumMarks: 100 },
    { examName: "Half-Yearly Examination", className: "9", sectionName: "A", subjectName: "English", maximumMarks: 100 },
    { examName: "Half-Yearly Examination", className: "9", sectionName: "A", subjectName: "Math", maximumMarks: 100 },
    { examName: "Half-Yearly Examination", className: "9", sectionName: "A", subjectName: "Science", maximumMarks: 100 },
    { examName: "Half-Yearly Examination", className: "9", sectionName: "A", subjectName: "SST", maximumMarks: 100 },
  ];

  const scholasticMarks = [
    { studentId: 1, subjectName: "Hindi", marks: 70 },
    { studentId: 1, subjectName: "English", marks: 68 },
    { studentId: 1, subjectName: "Math", marks: 75 },
    { studentId: 1, subjectName: "Science", marks: 69 },
    { studentId: 1, subjectName: "SST", marks: 70 },

    { studentId: 2, subjectName: "Hindi", marks: 78 },
    { studentId: 2, subjectName: "English", marks: 80 },
    { studentId: 2, subjectName: "Math", marks: 72 },
    { studentId: 2, subjectName: "Science", marks: 85 },
    { studentId: 2, subjectName: "SST", marks: 81 },
  ];

  const resultLocks = [
    {
      schoolId: "SCH001",
      examName: "Half-Yearly Examination",
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
  const [gradeData, setGradeData] = useState({});

  const schoolExams = exams.filter(
    (item) =>
      item.schoolId === schoolId &&
      item.allowCoScholastic
  );

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

  const validGrades = ["A+", "A", "B+", "B", "C", "D"];

  const getStudentMapping = (studentId) => {
    return studentSubjectMapping.find(
      (item) =>
        item.studentId === studentId &&
        item.className === filterData.className &&
        item.sectionName === filterData.sectionName
    );
  };

  const getStudentCoSubjects = (studentId) => {
    const mapping = getStudentMapping(studentId);

    if (!mapping) return [];

    if (filterData.subjectFilter === "All Subjects") {
      return mapping.coScholasticSubjects;
    }

    return mapping.coScholasticSubjects.filter(
      (subject) => subject === filterData.subjectFilter
    );
  };

  const getAllCoSubjectsForFilter = () => {
    const subjectSet = new Set();

    studentSubjectMapping
      .filter(
        (item) =>
          item.className === filterData.className &&
          item.sectionName === filterData.sectionName
      )
      .forEach((item) => {
        item.coScholasticSubjects.forEach((subject) => subjectSet.add(subject));
      });

    return Array.from(subjectSet);
  };

  const getScholasticTotal = (studentId) => {
    const mapping = getStudentMapping(studentId);

    if (!mapping) {
      return {
        obtained: 0,
        maximum: 0,
      };
    }

    let obtained = 0;
    let maximum = 0;

    mapping.scholasticSubjects.forEach((subjectName) => {
      const mark = scholasticMarks.find(
        (item) =>
          item.studentId === studentId &&
          item.subjectName === subjectName
      );

      const maxMark = examMarksSetup.find(
        (item) =>
          item.examName === filterData.examName &&
          item.className === filterData.className &&
          item.sectionName === filterData.sectionName &&
          item.subjectName === subjectName
      );

      if (mark && !isNaN(mark.marks)) {
        obtained += Number(mark.marks);
      }

      if (maxMark && !isNaN(maxMark.maximumMarks)) {
        maximum += Number(maxMark.maximumMarks);
      }
    });

    return {
      obtained,
      maximum,
    };
  };

  const handleSearch = () => {
    if (
      !filterData.examName ||
      !filterData.className ||
      !filterData.sectionName
    ) {
      alert("Please select exam, class and section");
      return;
    }

    setSearched(true);
  };

  const handleGradeChange = (
    studentId,
    subjectName,
    value
  ) => {
    if (isResultLocked) return;

    const upperValue = value.toUpperCase();

    if (
      upperValue !== "" &&
      !validGrades.includes(upperValue)
    ) {
      return;
    }

    setGradeData((prev) => ({
      ...prev,

      [`${studentId}_${subjectName}`]:
        upperValue,
    }));
  };

  const handleSave = () => {
    if (isResultLocked) {
      alert(
        "Result is locked. Grades cannot be edited."
      );

      return;
    }

    alert(
      "Co-Scholastic grades saved successfully"
    );
  };

  return (
    <div className="co-scholastic-page">

      <div className="common-page-header">

        <AppButton
          type="back"
          onClick={() =>
            (window.location.href =
              "/report-card-management")
          }
        >
          ←
        </AppButton>

        <div>

          <h1>
            Co-Scholastic Marks Entry
          </h1>

          <p>
            Enter and manage co-scholastic grades
          </p>

        </div>

      </div>

      <div className="common-card">

        <h2>
          Filter Records
        </h2>

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
                  examName: e.target.value,
                  className: "",
                  sectionName: "",
                  subjectFilter: "All Subjects",
                })
              }
            >
              <option value="">
                Select Exam
              </option>

              {schoolExams.map((item) => (
                <option
                  key={item.id}
                  value={item.examName}
                >
                  {item.examName}
                </option>
              ))}

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
                  sectionName: "",
                  subjectFilter: "All Subjects",
                })
              }
            >
              <option value="">
                Select Class
              </option>

              {schoolClasses.map((item) => (
                <option
                  key={item.id}
                  value={item.className}
                >
                  {item.className}
                </option>
              ))}

            </select>

          </div>

          <div className="form-group">

            <label>
              Section
            </label>

            <select
              value={filterData.sectionName}
              onChange={(e) =>
                setFilterData({
                  ...filterData,
                  sectionName:
                    e.target.value,
                  subjectFilter: "All Subjects",
                })
              }
            >
              <option value="">
                Select Section
              </option>

              {filteredSections.map((item) => (
                <option
                  key={item.id}
                  value={item.sectionName}
                >
                  {item.sectionName}
                </option>
              ))}

            </select>

          </div>

          <div className="form-group">

            <label>
              Subject Filter
            </label>

            <select
              value={
                filterData.subjectFilter
              }
              onChange={(e) =>
                setFilterData({
                  ...filterData,
                  subjectFilter:
                    e.target.value,
                })
              }
            >
              <option value="All Subjects">
                All Subjects
              </option>

              {getAllCoSubjectsForFilter().map(
                (subject) => (
                  <option
                    key={subject}
                    value={subject}
                  >
                    {subject}
                  </option>
                )
              )}

            </select>

          </div>

        </div>

        <div className="form-actions">

          <AppButton
            type="primary"
            onClick={handleSearch}
          >
            Search
          </AppButton>

        </div>

      </div>

      <div className="grade-notice">
        Note: Allowed Grades → A+, A, B+, B, C, D | Blank = Pending | Invalid grade not allowed
      </div>

      {isResultLocked && (

        <div className="lock-warning-card">

          <p>
            Result is locked. Grades cannot be edited.
          </p>

        </div>

      )}

      {searched && (

        <div className="common-card">

          <div className="list-header">

            <h2>
              Grade Entry List
            </h2>

          </div>

          <div className="grade-entry-list">

            {filteredStudents.length === 0 ? (

              <div className="empty-row">
                No students found
              </div>

            ) : (

              filteredStudents.map((student) => {

                const scholasticTotal =
                  getScholasticTotal(student.id);

                const coSubjects =
                  getStudentCoSubjects(student.id);

                return (

                  <div
                    className="student-grade-card"
                    key={student.id}
                  >

                    <div className="student-top">

                      <div>

                        <span className="student-roll">
                          Roll No:
                          {" "}
                          {student.rollNo}
                        </span>

                        <h3>
                          {student.studentName}
                        </h3>

                      </div>

                      <div className="scholastic-total-box">

                        Scholastic Total

                        <strong>
                          {scholasticTotal.obtained}
                          {" / "}
                          {scholasticTotal.maximum}
                        </strong>

                      </div>

                    </div>

                    {coSubjects.length === 0 ? (

                      <p className="empty-message">
                        No co-scholastic subjects mapped for this student.
                      </p>

                    ) : (

                      <div className="subject-entry-grid">

                        {coSubjects.map((subject) => (

                          <div
                            className="subject-input-box"
                            key={subject}
                          >

                            <label>
                              {subject}
                            </label>

                            <input
                              type="text"
                              value={
                                gradeData[
                                  `${student.id}_${subject}`
                                ] || ""
                              }
                              disabled={isResultLocked}
                              onChange={(e) =>
                                handleGradeChange(
                                  student.id,
                                  subject,
                                  e.target.value
                                )
                              }
                              placeholder="A+ / A / B+ / B / C / D"
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

            <AppButton
              type="primary"
              onClick={handleSave}
              disabled={isResultLocked}
            >
              Save Grades
            </AppButton>

          </div>

        </div>

      )}
    </div>
  );
}

export default CoScholasticMarksEntry;