import React, { useState } from "react";
import "./resultGeneration.css";
import AppButton from "../components/AppButton";

function ResultGeneration() {
  const schoolId = localStorage.getItem("schoolId") || "SCH001";

  const classes = [
    { id: 1, schoolId: "SCH001", className: "9" },
    { id: 2, schoolId: "SCH001", className: "10" },
  ];

  const sections = [
    { id: 1, schoolId: "SCH001", className: "9", sectionName: "A" },
    { id: 2, schoolId: "SCH001", className: "9", sectionName: "B" },
    { id: 3, schoolId: "SCH001", className: "10", sectionName: "A" },
  ];

  const exams = [
    { id: 1, schoolId: "SCH001", examName: "Unit Test 1" },
    { id: 2, schoolId: "SCH001", examName: "Half Yearly" },
    { id: 3, schoolId: "SCH001", examName: "Annual Exam" },
  ];

  const students = [
    {
      id: 1,
      schoolId: "SCH001",
      rollNo: "01",
      srNo: "SR001",
      studentName: "Aarav Sharma",
      fatherName: "Rajesh Sharma",
      motherName: "Sunita Sharma",
      photo: "",
      className: "9",
      sectionName: "A",
    },
    {
      id: 2,
      schoolId: "SCH001",
      rollNo: "02",
      srNo: "SR002",
      studentName: "Priya Singh",
      fatherName: "Manoj Singh",
      motherName: "Poonam Singh",
      photo: "",
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
      scholasticSubjects: ["Hindi", "English", "Math", "Science", "SST"],
    },
  ];

  const examMarksSetup = [
    { examName: "Unit Test 1", className: "9", sectionName: "A", subjectName: "Hindi", maximumMarks: 20, passingMarks: 7 },
    { examName: "Unit Test 1", className: "9", sectionName: "A", subjectName: "English", maximumMarks: 20, passingMarks: 7 },
    { examName: "Unit Test 1", className: "9", sectionName: "A", subjectName: "Math", maximumMarks: 20, passingMarks: 7 },
    { examName: "Unit Test 1", className: "9", sectionName: "A", subjectName: "Science", maximumMarks: 20, passingMarks: 7 },
    { examName: "Unit Test 1", className: "9", sectionName: "A", subjectName: "SST", maximumMarks: 20, passingMarks: 7 },

    { examName: "Half Yearly", className: "9", sectionName: "A", subjectName: "Hindi", maximumMarks: 100, passingMarks: 33 },
    { examName: "Half Yearly", className: "9", sectionName: "A", subjectName: "English", maximumMarks: 100, passingMarks: 33 },
    { examName: "Half Yearly", className: "9", sectionName: "A", subjectName: "Math", maximumMarks: 100, passingMarks: 33 },
    { examName: "Half Yearly", className: "9", sectionName: "A", subjectName: "Science", maximumMarks: 100, passingMarks: 33 },
    { examName: "Half Yearly", className: "9", sectionName: "A", subjectName: "SST", maximumMarks: 100, passingMarks: 33 },

    { examName: "Annual Exam", className: "9", sectionName: "A", subjectName: "Hindi", maximumMarks: 100, passingMarks: 33 },
    { examName: "Annual Exam", className: "9", sectionName: "A", subjectName: "English", maximumMarks: 100, passingMarks: 33 },
    { examName: "Annual Exam", className: "9", sectionName: "A", subjectName: "Math", maximumMarks: 100, passingMarks: 33 },
    { examName: "Annual Exam", className: "9", sectionName: "A", subjectName: "Science", maximumMarks: 100, passingMarks: 33 },
    { examName: "Annual Exam", className: "9", sectionName: "A", subjectName: "SST", maximumMarks: 100, passingMarks: 33 },
  ];

  const scholasticMarks = [
    { examName: "Unit Test 1", studentId: 1, subjectName: "Hindi", marks: 18 },
    { examName: "Unit Test 1", studentId: 1, subjectName: "English", marks: 17 },
    { examName: "Unit Test 1", studentId: 1, subjectName: "Math", marks: 19 },
    { examName: "Unit Test 1", studentId: 1, subjectName: "Science", marks: 18 },
    { examName: "Unit Test 1", studentId: 1, subjectName: "SST", marks: 18 },
    { examName: "Half Yearly", studentId: 1, subjectName: "Hindi", marks: 82 },
    { examName: "Half Yearly", studentId: 1, subjectName: "English", marks: 78 },
    { examName: "Half Yearly", studentId: 1, subjectName: "Math", marks: 88 },
    { examName: "Half Yearly", studentId: 1, subjectName: "Science", marks: 84 },
    { examName: "Half Yearly", studentId: 1, subjectName: "SST", marks: 80 },
    { examName: "Annual Exam", studentId: 1, subjectName: "Hindi", marks: 86 },
    { examName: "Annual Exam", studentId: 1, subjectName: "English", marks: 82 },
    { examName: "Annual Exam", studentId: 1, subjectName: "Math", marks: 91 },
    { examName: "Annual Exam", studentId: 1, subjectName: "Science", marks: 88 },
    { examName: "Annual Exam", studentId: 1, subjectName: "SST", marks: 84 },

    { examName: "Unit Test 1", studentId: 2, subjectName: "Hindi", marks: 16 },
    { examName: "Unit Test 1", studentId: 2, subjectName: "English", marks: 15 },
    { examName: "Unit Test 1", studentId: 2, subjectName: "Math", marks: 17 },
    { examName: "Unit Test 1", studentId: 2, subjectName: "Science", marks: 16 },
    { examName: "Unit Test 1", studentId: 2, subjectName: "SST", marks: 17 },
    { examName: "Half Yearly", studentId: 2, subjectName: "Hindi", marks: 72 },
    { examName: "Half Yearly", studentId: 2, subjectName: "English", marks: 70 },
    { examName: "Half Yearly", studentId: 2, subjectName: "Math", marks: 74 },
    { examName: "Half Yearly", studentId: 2, subjectName: "Science", marks: 76 },
    { examName: "Half Yearly", studentId: 2, subjectName: "SST", marks: 73 },
    { examName: "Annual Exam", studentId: 2, subjectName: "Hindi", marks: 75 },
    { examName: "Annual Exam", studentId: 2, subjectName: "English", marks: 72 },
    { examName: "Annual Exam", studentId: 2, subjectName: "Math", marks: 78 },
    { examName: "Annual Exam", studentId: 2, subjectName: "Science", marks: 79 },
    { examName: "Annual Exam", studentId: 2, subjectName: "SST", marks: 76 },
  ];

  const [filterData, setFilterData] = useState({
    className: "",
    sectionName: "",
    rankMode: "Section Wise Rank",
  });

  const [searched, setSearched] = useState(false);
  const [resultData, setResultData] = useState([]);
  const [calculationMode, setCalculationMode] = useState("Auto Calculate");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [isClassLive, setIsClassLive] = useState(false);
  const [studentLiveIds, setStudentLiveIds] = useState([]);

  const schoolClasses = classes.filter((item) => item.schoolId === schoolId);

  const filteredSections = sections.filter(
    (item) =>
      item.schoolId === schoolId &&
      (!filterData.className || item.className === filterData.className)
  );

  const filteredStudents = students.filter(
    (item) =>
      item.schoolId === schoolId &&
      item.className === filterData.className &&
      item.sectionName === filterData.sectionName
  );

  const getStudentSubjects = (studentId) => {
    const mapping = studentSubjectMapping.find(
      (item) =>
        item.studentId === studentId &&
        item.className === filterData.className &&
        item.sectionName === filterData.sectionName
    );

    return mapping ? mapping.scholasticSubjects : [];
  };

  const getDivision = (percentage) => {
    if (percentage >= 60) return "First";
    if (percentage >= 45) return "Second";
    if (percentage >= 33) return "Third";
    return "Fail";
  };
  const calculateStudentResult = (student) => {

    const subjects =
      getStudentSubjects(student.id);

    let obtained = 0;
    let maximum = 0;
    let isFail = false;

    exams.forEach((exam) => {

      subjects.forEach((subjectName) => {

        const maxSetup =
          examMarksSetup.find(
            (item) =>
              item.examName ===
                exam.examName &&
              item.className ===
                filterData.className &&
              item.sectionName ===
                filterData.sectionName &&
              item.subjectName ===
                subjectName
          );

        const markEntry =
          scholasticMarks.find(
            (item) =>
              item.examName ===
                exam.examName &&
              item.studentId ===
                student.id &&
              item.subjectName ===
                subjectName
          );

        if (maxSetup) {

          maximum += Number(
            maxSetup.maximumMarks || 0
          );

        }

        if (
          markEntry &&
          markEntry.marks !== "AB" &&
          markEntry.marks !== "ML" &&
          !isNaN(markEntry.marks)
        ) {

          obtained += Number(
            markEntry.marks
          );

          if (
            maxSetup?.passingMarks &&
            Number(markEntry.marks) <
              Number(
                maxSetup.passingMarks
              )
          ) {

            isFail = true;

          }

        } else if (
          maxSetup?.passingMarks
        ) {

          isFail = true;

        }

      });

    });

    const percentage =
      maximum > 0
        ? Number(
            (
              (obtained / maximum) *
              100
            ).toFixed(2)
          )
        : 0;

    return {
      id: student.id,
      rollNo: student.rollNo,
      srNo: student.srNo,
      studentName:
        student.studentName,
      fatherName:
        student.fatherName,
      motherName:
        student.motherName,
      className:
        student.className,
      sectionName:
        student.sectionName,
      photo:
        student.photo,
      totalMarks:
        obtained,
      maximumMarks:
        maximum,
      percentage,
      division:
        getDivision(
          percentage
        ),
      rank: "",
      result: isFail
        ? "FAIL"
        : "PASS",
    };

  };

  const generateRanks = (
    data
  ) => {

    const sorted = [...data].sort(
      (a, b) =>
        b.percentage -
        a.percentage
    );

    return data.map((item) => {

      const rankIndex =
        sorted.findIndex(
          (student) =>
            student.id === item.id
        );

      return {
        ...item,
        rank: rankIndex + 1,
      };

    });

  };

  const handleSearch = () => {

    if (
      !filterData.className ||
      !filterData.sectionName
    ) {

      alert(
        "Please select class and section"
      );

      return;

    }

    setSearched(true);

  };

  const handleGenerateResult =
    () => {

      if (
        filteredStudents.length === 0
      ) {

        alert(
          "No students found"
        );

        return;

      }

      const calculated =
        filteredStudents.map(
          (student) =>
            calculateStudentResult(
              student
            )
        );

      const ranked =
        generateRanks(calculated);

      setResultData(ranked);

      alert(
        "Result generated successfully"
      );

    };

  const handleManualChange = (
    studentId,
    field,
    value
  ) => {

    if (isLocked) return;

    setResultData((prev) =>
      prev.map((item) =>
        item.id === studentId
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );

  };

  const handleSelectStudent =
    (studentId) => {

      setSelectedStudentIds(
        (prev) => {

          if (
            prev.includes(studentId)
          ) {

            return prev.filter(
              (id) =>
                id !== studentId
            );

          }

          return [
            ...prev,
            studentId,
          ];

        }
      );

    };

  const handleToggleLock =
    () => {

      setIsLocked(
        !isLocked
      );

    };

  const handleToggleClassLive =
    () => {

      setIsClassLive(
        !isClassLive
      );

    };

  const handleToggleStudentLive =
    () => {

      if (
        selectedStudentIds.length === 0
      ) {

        alert(
          "Please select students"
        );

        return;

      }

      const allLive =
        selectedStudentIds.every(
          (id) =>
            studentLiveIds.includes(
              id
            )
        );

      if (allLive) {

        setStudentLiveIds(
          (prev) =>
            prev.filter(
              (id) =>
                !selectedStudentIds.includes(
                  id
                )
            )
        );

      } else {

        setStudentLiveIds(
          (prev) => [
            ...new Set([
              ...prev,
              ...selectedStudentIds,
            ]),
          ]
        );

      }

    };
    return (

    <div className="result-generation-page">

      {/* ================= HEADER ================= */}

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
            Result Generation
          </h1>

          <p>
            Generate, manage, lock and publish results
          </p>

        </div>

      </div>

      {/* ================= FILTER ================= */}

      <div className="common-card">

        <h2>
          Filter Records
        </h2>

        <div className="filter-grid">

          <div className="form-group">

            <label>
              Class
            </label>

            <select
              value={
                filterData.className
              }
              onChange={(e) =>
                setFilterData({
                  ...filterData,
                  className:
                    e.target.value,
                  sectionName: "",
                })
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
                    {item.className}
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
                Select Section
              </option>

              {filteredSections.map(
                (item) => (

                  <option
                    key={item.id}
                    value={
                      item.sectionName
                    }
                  >
                    {item.sectionName}
                  </option>

                )
              )}

            </select>

          </div>

          <div className="form-group">

            <label>
              Rank Calculation Mode
            </label>

            <select
              value={
                filterData.rankMode
              }
              onChange={(e) =>
                setFilterData({
                  ...filterData,
                  rankMode:
                    e.target.value,
                })
              }
            >
              <option>
                Section Wise Rank
              </option>

              <option>
                Overall Class Rank
              </option>

            </select>

          </div>

          <div className="form-group">

            <label>
              Calculation Mode
            </label>

            <select
              value={
                calculationMode
              }
              onChange={(e) =>
                setCalculationMode(
                  e.target.value
                )
              }
            >
              <option>
                Auto Calculate
              </option>

              <option>
                Manual Entry
              </option>

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

      {/* ================= NOTICE ================= */}

      <div className="result-notice">

        NOTE: Once the report card is locked, marks can no longer be edited. To make any corrections, unlock the report card first, update the marks, and then click the Generate Result button again to apply the latest changes.

      </div>

      {/* ================= RESULT AREA ================= */}

      {searched && (

        <div className="common-card">

          <div className="result-top-actions">

            <AppButton
              type="primary"
              onClick={
                handleGenerateResult
              }
            >
              Generate Result
            </AppButton>

            <AppButton
              type={
                isLocked
                  ? "danger"
                  : "primary"
              }
              onClick={
                handleToggleLock
              }
            >
              {isLocked
                ? "Unlock Result"
                : "Lock Result"}
            </AppButton>

            <AppButton
              type={
                isClassLive
                  ? "danger"
                  : "success"
              }
              onClick={
                handleToggleClassLive
              }
            >
              {isClassLive
                ? "Remove Class Live"
                : "Make Class Live"}
            </AppButton>

            <AppButton
              type="success"
              onClick={
                handleToggleStudentLive
              }
            >
              {selectedStudentIds.every(
                (id) =>
                  studentLiveIds.includes(
                    id
                  )
              ) &&
              selectedStudentIds.length > 0
                ? "Remove Selected Students Live"
                : "Make Selected Students Live"}
            </AppButton>

          </div>

          {resultData.length === 0 ? (

            <div className="empty-row">
              No result generated
            </div>

          ) : (

            <div className="result-list">

              {resultData.map(
                (student) => (

                  <div
                    className="student-result-card"
                    key={student.id}
                  >

                    <div className="student-result-top">

                      <div className="student-left">

                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(
                            student.id
                          )}
                          onChange={() =>
                            handleSelectStudent(
                              student.id
                            )
                          }
                        />

                        <div>

                          <h3>
                            {student.rollNo}
                            {" | "}
                            {student.srNo}
                            {" | "}
                            {student.studentName}
                          </h3>

                          <p>
                            Father :
                            {" "}
                            {student.fatherName}
                          </p>

                          <p>
                            Mother :
                            {" "}
                            {student.motherName}
                          </p>

                        </div>

                      </div>

                      <div className="live-status-wrap">

                        {isClassLive ||
                        studentLiveIds.includes(
                          student.id
                        ) ? (

                          <span className="live-badge">
                            LIVE
                          </span>

                        ) : (

                          <span className="offline-badge">
                            NOT LIVE
                          </span>

                        )}

                      </div>

                    </div>

                    <div className="result-grid">

                      <div className="result-field">

                        <label>
                          Total Marks
                        </label>

                        <input
                          type="text"
                          disabled={
                            calculationMode ===
                              "Auto Calculate" ||
                            isLocked
                          }
                          value={`${student.totalMarks} / ${student.maximumMarks}`}
                          onChange={(e) =>
                            handleManualChange(
                              student.id,
                              "totalMarks",
                              e.target.value
                            )
                          }
                        />

                      </div>

                      <div className="result-field">

                        <label>
                          Percentage
                        </label>

                        <input
                          type="text"
                          disabled={
                            calculationMode ===
                              "Auto Calculate" ||
                            isLocked
                          }
                          value={
                            student.percentage
                          }
                          onChange={(e) =>
                            handleManualChange(
                              student.id,
                              "percentage",
                              e.target.value
                            )
                          }
                        />

                      </div>

                      <div className="result-field">

                        <label>
                          Division
                        </label>

                        <input
                          type="text"
                          disabled={
                            calculationMode ===
                              "Auto Calculate" ||
                            isLocked
                          }
                          value={
                            student.division
                          }
                          onChange={(e) =>
                            handleManualChange(
                              student.id,
                              "division",
                              e.target.value
                            )
                          }
                        />

                      </div>

                      <div className="result-field">

                        <label>
                          Rank
                        </label>

                        <input
                          type="text"
                          disabled={
                            calculationMode ===
                              "Auto Calculate" ||
                            isLocked
                          }
                          value={
                            student.rank
                          }
                          onChange={(e) =>
                            handleManualChange(
                              student.id,
                              "rank",
                              e.target.value
                            )
                          }
                        />

                      </div>

                      <div className="result-field">

                        <label>
                          Result
                        </label>

                        <input
                          type="text"
                          disabled={
                            calculationMode ===
                              "Auto Calculate" ||
                            isLocked
                          }
                          value={
                            student.result
                          }
                          onChange={(e) =>
                            handleManualChange(
                              student.id,
                              "result",
                              e.target.value
                            )
                          }
                        />

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>

      )}

    </div>

  );

}

export default ResultGeneration;