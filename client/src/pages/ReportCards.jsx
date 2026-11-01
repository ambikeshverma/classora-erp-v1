import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./reportCards.css";
import AppButton from "../components/AppButton";
import { Skeleton } from "../components/Skeleton";
import { reportCardService } from "../services/api";

function ReportCards() {
  const navigate = useNavigate();

  const [meta, setMeta] = useState({ classes: [], schoolInfo: {} });
  const [metaLoading, setMetaLoading] = useState(true);

  const [filterData, setFilterData] = useState({ className: "", sectionName: "" });
  const [loadedExams, setLoadedExams] = useState([]);
  const [examsLoaded, setExamsLoaded] = useState(false);
  const [selectedExamIds, setSelectedExamIds] = useState([]);
  const [loading, setLoading] = useState(false);

  const [previewMode, setPreviewMode] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    let active = true;

    reportCardService
      .getMeta()
      .then((res) => {
        if (active) setMeta(res.data?.data || { classes: [], schoolInfo: {} });
      })
      .catch((err) => {
        console.error("Failed to load report card meta", err);
      })
      .finally(() => {
        if (active) setMetaLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const sectionOptions = meta.classes.find((item) => item.className === filterData.className)?.sections || [];

  const handleLoadExams = async () => {
    if (!filterData.className || !filterData.sectionName) {
      alert("Please select class and section");
      return;
    }

    try {
      setLoading(true);
      const res = await reportCardService.getReportCardExams(filterData);
      const exams = res.data?.data || [];

      setLoadedExams(exams);
      setSelectedExamIds(exams.map((item) => item._id));
      setExamsLoaded(true);
      setPreviewMode(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load exams");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (selectedExamIds.length === 0) {
      alert("Please select at least one exam");
      return;
    }

    try {
      setLoading(true);

      // Keep the exams in the order they are listed
      const orderedIds = loadedExams.filter((exam) => selectedExamIds.includes(exam._id)).map((exam) => exam._id);

      const res = await reportCardService.getReportCardData({ ...filterData, examIds: orderedIds.join(",") });
      setPreview(res.data?.data || null);
      setPreviewMode(true);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load report cards");
    } finally {
      setLoading(false);
    }
  };

  const markOf = (student, examId, subjectName) => student.marks?.[examId]?.[subjectName] ?? "-";

  const examTotals = (student, examId) => {
    let obtained = 0;
    let maximum = 0;

    student.subjects.forEach((subjectName) => {
      const max = preview.maxMarks?.[examId]?.[subjectName];
      const mark = student.marks?.[examId]?.[subjectName];
      if (max === undefined || mark === "ML") return;

      maximum += max;
      if (mark !== undefined && mark !== "AB") obtained += Number(mark);
    });

    return { obtained, maximum };
  };

  const coSubjectsOf = (student) => [
    ...new Set(Object.values(student.coScholastic || {}).flatMap((byExam) => Object.keys(byExam))),
  ];

  const schoolInfo = preview?.schoolInfo || {};

  return (
    <div className="report-cards-page">
      <div className="common-page-header">
        <AppButton type="back" onClick={() => navigate("/report-card-management")}>
          ←
        </AppButton>

        <div>
          <h1>Report Cards</h1>
          <p>Print generated report cards</p>
        </div>
      </div>

      {!previewMode && (
        <>
          <div className="common-card">
            <h2>Filter Records</h2>

            <div className="filter-grid">
              <div className="form-group">
                <label>Class</label>

                <select
                  value={filterData.className}
                  disabled={metaLoading}
                  onChange={(e) => {
                    setFilterData({ className: e.target.value, sectionName: "" });
                    setExamsLoaded(false);
                    setLoadedExams([]);
                  }}
                >
                  <option value="">{metaLoading ? "Loading..." : "Select Class"}</option>

                  {meta.classes.map((item) => (
                    <option key={item.className} value={item.className}>
                      {item.className}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Section</label>

                <select
                  value={filterData.sectionName}
                  onChange={(e) => {
                    setFilterData({ ...filterData, sectionName: e.target.value });
                    setExamsLoaded(false);
                    setLoadedExams([]);
                  }}
                >
                  <option value="">Select Section</option>

                  {sectionOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-actions">
              <AppButton type="primary" onClick={handleLoadExams} disabled={loading}>
                {loading && !examsLoaded ? "Loading..." : "Load Exams"}
              </AppButton>
            </div>
          </div>

          {loading && examsLoaded && (
            <div className="common-card">
              <Skeleton variant="rectangular" height={60} count={2} />
            </div>
          )}

          {examsLoaded && !loading && (
            <div className="common-card">
              <div className="list-header">
                <h2>Select Exams</h2>
              </div>

              {loadedExams.length === 0 ? (
                <div className="empty-row">
                  No exam has marks set up for this class and section. Set it up in Exam Tools → Exam Marks Setup.
                </div>
              ) : (
                <>
                  <div className="exam-selection-grid">
                    {loadedExams.map((exam) => (
                      <label className="exam-check-card" key={exam._id}>
                        <input
                          type="checkbox"
                          checked={selectedExamIds.includes(exam._id)}
                          onChange={() =>
                            setSelectedExamIds((prev) =>
                              prev.includes(exam._id) ? prev.filter((id) => id !== exam._id) : [...prev, exam._id]
                            )
                          }
                        />

                        <span>{exam.examName}</span>
                      </label>
                    ))}
                  </div>

                  <div className="form-actions">
                    <AppButton type="primary" onClick={handlePreview} disabled={loading}>
                      Preview
                    </AppButton>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {previewMode && preview && (
        <div className="preview-wrapper">
          <div className="preview-top-bar">
            <AppButton type="secondary" onClick={() => setPreviewMode(false)}>
              Back
            </AppButton>

            <AppButton type="primary" onClick={() => window.print()}>
              Print
            </AppButton>
          </div>

          {preview.students.length === 0 ? (
            <div className="common-card">
              <div className="empty-row">No active student found in this class and section</div>
            </div>
          ) : (
            preview.students.map((student) => {
              const coSubjects = coSubjectsOf(student);

              return (
                <div className="report-card-sheet" key={student._id}>
                  <div className="school-header">
                    {schoolInfo.logo && <img src={schoolInfo.logo} alt="School Logo" style={{ height: 56 }} />}

                    <h1>{schoolInfo.schoolName}</h1>

                    <p>{schoolInfo.address}</p>

                    <h2>Report Card ({preview.session})</h2>
                  </div>

                  <div className="student-details-grid">
                    <div>
                      <p>
                        <strong>Roll No :</strong> {student.rollNo || "-"}
                      </p>

                      <p>
                        <strong>SR No :</strong> {student.srNo || "-"}
                      </p>

                      <p>
                        <strong>Student :</strong> {student.studentName}
                      </p>
                    </div>

                    <div>
                      <p>
                        <strong>Father :</strong> {student.fatherName || "-"}
                      </p>

                      <p>
                        <strong>Mother :</strong> {student.motherName || "-"}
                      </p>

                      <p>
                        <strong>Class :</strong> {filterData.className} ({filterData.sectionName})
                      </p>
                    </div>
                  </div>

                  <div className="report-table-wrap">
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>Subject</th>

                          {preview.exams.map((exam) => (
                            <th key={exam._id}>{exam.examName}</th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {student.subjects.length === 0 ? (
                          <tr>
                            <td colSpan={preview.exams.length + 1}>No subjects assigned</td>
                          </tr>
                        ) : (
                          student.subjects.map((subjectName) => (
                            <tr key={subjectName}>
                              <td>{subjectName}</td>

                              {preview.exams.map((exam) => {
                                const max = preview.maxMarks?.[exam._id]?.[subjectName];

                                return (
                                  <td key={exam._id}>
                                    {max === undefined ? "-" : `${markOf(student, exam._id, subjectName)} / ${max}`}
                                  </td>
                                );
                              })}
                            </tr>
                          ))
                        )}

                        <tr className="grand-total-row">
                          <td>Total</td>

                          {preview.exams.map((exam) => {
                            const totals = examTotals(student, exam._id);
                            return (
                              <td key={exam._id}>
                                {totals.obtained} / {totals.maximum}
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {coSubjects.length > 0 && (
                    <div className="report-table-wrap">
                      <table className="report-table">
                        <thead>
                          <tr>
                            <th>Co-Scholastic</th>

                            {preview.exams.map((exam) => (
                              <th key={exam._id}>{exam.examName}</th>
                            ))}
                          </tr>
                        </thead>

                        <tbody>
                          {coSubjects.map((subjectName) => (
                            <tr key={subjectName}>
                              <td>{subjectName}</td>

                              {preview.exams.map((exam) => (
                                <td key={exam._id}>{student.coScholastic?.[exam._id]?.[subjectName] || "-"}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {student.result ? (
                    <div className="student-details-grid">
                      <div>
                        <p>
                          <strong>Total Marks :</strong> {student.result.totalMarks} / {student.result.maximumMarks}
                        </p>

                        <p>
                          <strong>Percentage :</strong> {student.result.percentage}%
                        </p>
                      </div>

                      <div>
                        <p>
                          <strong>Division :</strong> {student.result.division}
                        </p>

                        <p>
                          <strong>Rank :</strong> {student.result.rank ?? "-"}
                        </p>

                        <p>
                          <strong>Result :</strong> {student.result.result}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="empty-message">Result is not generated yet for this student.</p>
                  )}

                  <div className="report-footer">
                    <div>Class Teacher</div>

                    <div>Principal</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default ReportCards;
