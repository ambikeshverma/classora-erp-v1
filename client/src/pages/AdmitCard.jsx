import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./admitCard.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import AdmitCardPrint from "../components/exam/AdmitCardPrint";
import { examService } from "../services/api";

import { notifyAlert } from "../utils/toast";
const formatDate = (value) => (value ? String(value).split("-").reverse().join("-") : "-");

function AdmitCard() {
  const navigate = useNavigate();

  const [meta, setMeta] = useState({ exams: [], classes: [] });
  const [metaLoading, setMetaLoading] = useState(true);

  const [filters, setFilters] = useState({ examId: "", className: "", sectionName: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [selectedIds, setSelectedIds] = useState([]);
  const [printMode, setPrintMode] = useState("");

  useEffect(() => {
    let active = true;

    examService
      .getMeta()
      .then((res) => {
        if (active) setMeta(res.data?.data || { exams: [], classes: [] });
      })
      .catch((err) => {
        console.error("Failed to load exam meta", err);
      })
      .finally(() => {
        if (active) setMetaLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const exam = meta.exams.find((item) => item._id === filters.examId);
  const classOptions = exam ? meta.classes.filter((item) => exam.applicableClasses.includes(item.className)) : [];
  const sectionOptions = meta.classes.find((item) => item.className === filters.className)?.sections || [];

  const handleGenerate = async () => {
    if (!filters.examId || !filters.className || !filters.sectionName) {
      notifyAlert("Select exam, class and section");
      return;
    }

    try {
      setLoading(true);
      setSelectedIds([]);

      const res = await examService.getAdmitCards(filters);
      setResult({ ...res.data?.data, className: filters.className, sectionName: filters.sectionName });
    } catch (err) {
      setResult(null);
      notifyAlert(err.response?.data?.message || "Failed to load admit card data");
    } finally {
      setLoading(false);
    }
  };

  const students = result?.students || [];
  const timetable = result?.timetable || [];

  const openPrint = (mode) => {
    if (timetable.length === 0) {
      notifyAlert("No timetable found for this exam, class and section. Create it in Exam Timetable first.");
      return;
    }

    if (selectedIds.length === 0) {
      notifyAlert("Select student");
      return;
    }

    setPrintMode(mode);
  };

  return (
    <div className="admit-card-page">
      <div className="common-page-header">
        <AppButton type="back" onClick={() => navigate("/exam-tools")}>
          ←
        </AppButton>

        <div>
          <h1>Admit Card and Deskslip</h1>
          <p>Print admit cards and desk slips for a class</p>
        </div>
      </div>

      <div className="common-card">
        <div className="admit-filter-grid">
          <div className="form-group">
            <label>Exam *</label>

            <select
              value={filters.examId}
              disabled={metaLoading}
              onChange={(e) => {
                setFilters({ examId: e.target.value, className: "", sectionName: "" });
                setResult(null);
              }}
            >
              <option value="">{metaLoading ? "Loading..." : meta.exams.length === 0 ? "No exam available" : "Select Exam"}</option>

              {meta.exams.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.examName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Class *</label>

            <select
              value={filters.className}
              onChange={(e) => {
                setFilters({ ...filters, className: e.target.value, sectionName: "" });
                setResult(null);
              }}
            >
              <option value="">Select Class</option>

              {classOptions.map((item) => (
                <option key={item.className} value={item.className}>
                  {item.className}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Section *</label>

            <select
              value={filters.sectionName}
              onChange={(e) => {
                setFilters({ ...filters, sectionName: e.target.value });
                setResult(null);
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

        <div className="admit-action-row">
          <AppButton type="primary" onClick={handleGenerate} disabled={loading}>
            {loading ? "Loading..." : "Search"}
          </AppButton>
        </div>
      </div>

      {(loading || result) && (
        <>
          <div className="common-card">
            <div className="list-header">
              <h2>Exam Schedule{result?.exam ? ` - ${result.exam.examName}` : ""}</h2>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Subject</th>
                    <th>Exam Date</th>
                    <th>Time</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="4" style={{ padding: "4px 0", border: "none" }}>
                        <SkeletonTable rows={3} columns={4} />
                      </td>
                    </tr>
                  ) : timetable.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="empty-row">
                        No timetable found. Create it in Exam Timetable first.
                      </td>
                    </tr>
                  ) : (
                    timetable.map((row, index) => (
                      <tr key={row._id}>
                        <td>{index + 1}</td>
                        <td>{row.subjectName}</td>
                        <td>{formatDate(row.examDate)}</td>
                        <td>
                          {row.startTime} - {row.endTime}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="common-card">
            <div className="list-header">
              <h2>Students</h2>

              <div className="list-action-buttons">
                <AppButton type="primary" onClick={() => openPrint("admit")} disabled={loading}>
                  Print Admit Card
                </AppButton>

                <AppButton type="primary" onClick={() => openPrint("deskslip")} disabled={loading}>
                  Print Desk Slip
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
                        checked={students.length > 0 && selectedIds.length === students.length}
                        onChange={(e) => setSelectedIds(e.target.checked ? students.map((item) => item._id) : [])}
                      />
                    </th>
                    <th>Roll No</th>
                    <th>Student Name</th>
                    <th>Father Name</th>
                    <th>SR No</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" style={{ padding: "4px 0", border: "none" }}>
                        <SkeletonTable rows={5} columns={5} />
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-row">
                        No active student found in this class and section
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student._id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(student._id)}
                            onChange={() =>
                              setSelectedIds((prev) =>
                                prev.includes(student._id) ? prev.filter((id) => id !== student._id) : [...prev, student._id]
                              )
                            }
                          />
                        </td>
                        <td>{student.rollNo || "-"}</td>
                        <td>{student.studentName}</td>
                        <td>{student.fatherName || "-"}</td>
                        <td>{student.srNo || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {printMode && result && (
        <AdmitCardPrint
          mode={printMode}
          examName={result.exam.examName}
          className={result.className}
          sectionName={result.sectionName}
          timetable={timetable}
          students={students.filter((item) => selectedIds.includes(item._id))}
          schoolInfo={result.schoolInfo}
          onClose={() => setPrintMode("")}
        />
      )}
    </div>
  );
}

export default AdmitCard;
