import React, { useState } from "react";
import "./reportCards.css";
import AppButton from "../components/AppButton";

function ReportCards() {

  const schoolId =
    localStorage.getItem("schoolId") || "SCH001";

  /* =========================
     MASTER DATA
  ========================= */

  const classes = [
    {
      id: 1,
      schoolId: "SCH001",
      className: "9",
    },
  ];

  const sections = [
    {
      id: 1,
      schoolId: "SCH001",
      className: "9",
      sectionName: "A",
    },
  ];

  const exams = [
    {
      id: 1,
      schoolId: "SCH001",
      className: "9",
      sectionName: "A",
      examName: "Unit Test 1",
    },

    {
      id: 2,
      schoolId: "SCH001",
      className: "9",
      sectionName: "A",
      examName: "Half Yearly",
    },

    {
      id: 3,
      schoolId: "SCH001",
      className: "9",
      sectionName: "A",
      examName: "Annual Exam",
    },
  ];

  const students = [
    {
      id: 1,
      rollNo: "01",
      srNo: "SR001",
      studentName: "Aarav Sharma",
      fatherName: "Rajesh Sharma",
      motherName: "Sunita Sharma",
      className: "9",
      sectionName: "A",
    },

    {
      id: 2,
      rollNo: "02",
      srNo: "SR002",
      studentName: "Priya Singh",
      fatherName: "Manoj Singh",
      motherName: "Poonam Singh",
      className: "9",
      sectionName: "A",
    },
  ];

  const subjects = [
    "Hindi",
    "English",
    "Math",
    "Science",
    "SST",
  ];

  const reportData = [
    {
      studentId: 1,
      examName: "Unit Test 1",
      subjectName: "Hindi",
      marks: 18,
    },

    {
      studentId: 1,
      examName: "Unit Test 1",
      subjectName: "English",
      marks: 17,
    },

    {
      studentId: 1,
      examName: "Unit Test 1",
      subjectName: "Math",
      marks: 19,
    },

    {
      studentId: 1,
      examName: "Half Yearly",
      subjectName: "Hindi",
      marks: 82,
    },

    {
      studentId: 1,
      examName: "Half Yearly",
      subjectName: "English",
      marks: 78,
    },

    {
      studentId: 1,
      examName: "Annual Exam",
      subjectName: "Hindi",
      marks: 86,
    },

    {
      studentId: 1,
      examName: "Annual Exam",
      subjectName: "English",
      marks: 82,
    },

    {
      studentId: 2,
      examName: "Unit Test 1",
      subjectName: "Hindi",
      marks: 16,
    },

    {
      studentId: 2,
      examName: "Half Yearly",
      subjectName: "Hindi",
      marks: 72,
    },

    {
      studentId: 2,
      examName: "Annual Exam",
      subjectName: "Hindi",
      marks: 75,
    },
  ];

  /* =========================
     STATES
  ========================= */

  const [filterData, setFilterData] =
    useState({
      className: "",
      sectionName: "",
    });

  const [loadedExams, setLoadedExams] =
    useState([]);

  const [selectedExams, setSelectedExams] =
    useState([]);

  const [previewMode, setPreviewMode] =
    useState(false);

  /* =========================
     FILTERED DATA
  ========================= */

  const schoolClasses =
    classes.filter(
      (item) =>
        item.schoolId === schoolId
    );

  const filteredSections =
    sections.filter(
      (item) =>
        item.schoolId === schoolId &&
        item.className ===
          filterData.className
    );

  const filteredStudents =
    students
      .filter(
        (item) =>
          item.className ===
            filterData.className &&
          item.sectionName ===
            filterData.sectionName
      )
      .sort(
        (a, b) =>
          Number(a.rollNo) -
          Number(b.rollNo)
      );
      /* =========================
     LOAD EXAMS
  ========================= */

  const handleLoadExams =
    () => {

      if (
        !filterData.className ||
        !filterData.sectionName
      ) {

        alert(
          "Please select class and section"
        );

        return;

      }

      const filteredExamList =
        exams.filter(
          (item) =>
            item.schoolId ===
              schoolId &&
            item.className ===
              filterData.className &&
            item.sectionName ===
              filterData.sectionName
        );

      setLoadedExams(
        filteredExamList
      );

      setSelectedExams(
        filteredExamList.map(
          (item) =>
            item.examName
        )
      );

      setPreviewMode(false);

    };

  /* =========================
     EXAM CHECKBOX
  ========================= */

  const handleExamSelection =
    (examName) => {

      if (
        selectedExams.includes(
          examName
        )
      ) {

        setSelectedExams(
          selectedExams.filter(
            (item) =>
              item !== examName
          )
        );

      } else {

        setSelectedExams([
          ...selectedExams,
          examName,
        ]);

      }

    };

  /* =========================
     PREVIEW
  ========================= */

  const handlePreview =
    () => {

      if (
        selectedExams.length === 0
      ) {

        alert(
          "Please select at least one exam"
        );

        return;

      }

      setPreviewMode(true);

    };

  /* =========================
     PRINT
  ========================= */

  const handlePrint =
    () => {

      window.print();

    };

  /* =========================
     DOWNLOAD
  ========================= */

  const handleDownload =
    () => {

      alert(
        "PDF download logic here"
      );

    };

  /* =========================
     HELPERS
  ========================= */

  const getStudentMarks =
    (
      studentId,
      examName,
      subjectName
    ) => {

      const found =
        reportData.find(
          (item) =>
            item.studentId ===
              studentId &&
            item.examName ===
              examName &&
            item.subjectName ===
              subjectName
        );

      return found
        ? found.marks
        : "-";

    };

  const calculateExamTotal =
    (
      studentId,
      examName
    ) => {

      let total = 0;

      reportData.forEach(
        (item) => {

          if (
            item.studentId ===
              studentId &&
            item.examName ===
              examName
          ) {

            total += Number(
              item.marks || 0
            );

          }

        }
      );

      return total;

    };

  const calculateGrandTotal =
    (studentId) => {

      let total = 0;

      selectedExams.forEach(
        (examName) => {

          total +=
            calculateExamTotal(
              studentId,
              examName
            );

        }
      );

      return total;

    };
    return (

    <div className="report-cards-page">

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
            Report Cards
          </h1>

          <p>
            Print generated report cards
          </p>

        </div>

      </div>

      {/* ================= FILTER AREA ================= */}

      {!previewMode && (

        <>

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

            </div>

            <div className="form-actions">

              <AppButton
                type="primary"
                onClick={
                  handleLoadExams
                }
              >
                Load Exams
              </AppButton>

            </div>

          </div>

          {loadedExams.length > 0 && (

            <div className="common-card">

              <div className="list-header">

                <h2>
                  Select Exams
                </h2>

              </div>

              <div className="exam-selection-grid">

                {loadedExams.map((exam) => (

                  <label
                    className="exam-check-card"
                    key={exam.id}
                  >

                    <input
                      type="checkbox"
                      checked={selectedExams.includes(
                        exam.examName
                      )}
                      onChange={() =>
                        handleExamSelection(
                          exam.examName
                        )
                      }
                    />

                    <span>
                      {exam.examName}
                    </span>

                  </label>

                ))}

              </div>

              <div className="form-actions">

                <AppButton
                  type="primary"
                  onClick={
                    handlePreview
                  }
                >
                  Preview
                </AppButton>

              </div>

            </div>

          )}

        </>

      )}
      {/* ================= PREVIEW ================= */}

      {previewMode && (

        <div className="preview-wrapper">

          <div className="preview-top-bar">

            <AppButton
              type="primary"
              onClick={
                handlePrint
              }
            >
              Print
            </AppButton>

            <AppButton
              type="success"
              onClick={
                handleDownload
              }
            >
              Download
            </AppButton>

          </div>

          {filteredStudents.map(
            (student) => (

              <div
                className="report-card-sheet"
                key={student.id}
              >

                {/* ===== SCHOOL HEADER ===== */}

                <div className="school-header">

                  <h1>
                    CHANDRA SHEKHAR AZAD
                    INTER COLLEGE
                  </h1>

                  <p>
                    Rasouli, Barabanki
                  </p>

                  <h2>
                    Report Card
                  </h2>

                </div>

                {/* ===== STUDENT DETAILS ===== */}

                <div className="student-details-grid">

                  <div>

                    <p>
                      <strong>
                        Roll No :
                      </strong>
                      {" "}
                      {student.rollNo}
                    </p>

                    <p>
                      <strong>
                        SR No :
                      </strong>
                      {" "}
                      {student.srNo}
                    </p>

                    <p>
                      <strong>
                        Student :
                      </strong>
                      {" "}
                      {student.studentName}
                    </p>

                  </div>

                  <div>

                    <p>
                      <strong>
                        Father :
                      </strong>
                      {" "}
                      {student.fatherName}
                    </p>

                    <p>
                      <strong>
                        Mother :
                      </strong>
                      {" "}
                      {student.motherName}
                    </p>

                    <p>
                      <strong>
                        Class :
                      </strong>
                      {" "}
                      {student.className}
                      {" "}
                      (
                      {student.sectionName}
                      )
                    </p>

                  </div>

                </div>

                {/* ===== REPORT TABLE ===== */}

                <div className="report-table-wrap">

                  <table className="report-table">

                    <thead>

                      <tr>

                        <th>
                          Subject
                        </th>

                        {selectedExams.map(
                          (examName) => (

                            <th
                              key={examName}
                            >
                              {examName}
                            </th>

                          )
                        )}

                      </tr>

                    </thead>

                    <tbody>

                      {subjects.map(
                        (subjectName) => (

                          <tr
                            key={subjectName}
                          >

                            <td>
                              {subjectName}
                            </td>

                            {selectedExams.map(
                              (examName) => (

                                <td
                                  key={
                                    examName
                                  }
                                >
                                  {getStudentMarks(
                                    student.id,
                                    examName,
                                    subjectName
                                  )}
                                </td>

                              )
                            )}

                          </tr>

                        )
                      )}

                      {/* ===== GRAND TOTAL ===== */}

                      <tr className="grand-total-row">

                        <td>
                          Grand Total
                        </td>

                        <td
                          colSpan={
                            selectedExams.length
                          }
                        >
                          {calculateGrandTotal(
                            student.id
                          )}
                        </td>

                      </tr>

                    </tbody>

                  </table>

                </div>

                {/* ===== FOOTER ===== */}

                <div className="report-footer">

                  <div>
                    Class Teacher
                  </div>

                  <div>
                    Principal
                  </div>

                </div>

              </div>

            )
          )}

        </div>

      )}

    </div>

  );

}

export default ReportCards;