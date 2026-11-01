import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./resultGeneration.css";
import AppButton from "../components/AppButton";
import { Skeleton } from "../components/Skeleton";
import { reportCardService } from "../services/api";

const EMPTY_STATE = { session: "", studentCount: 0, isLocked: false, isClassLive: false, results: [] };

function ResultGeneration() {
  const navigate = useNavigate();

  const [meta, setMeta] = useState({ classes: [] });
  const [metaLoading, setMetaLoading] = useState(true);

  const [filterData, setFilterData] = useState({ className: "", sectionName: "", rankMode: "SECTION" });
  const [calculationMode, setCalculationMode] = useState("Auto Calculate");

  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const [state, setState] = useState(EMPTY_STATE);
  const [rows, setRows] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  useEffect(() => {
    let active = true;

    reportCardService
      .getMeta()
      .then((res) => {
        if (active) setMeta(res.data?.data || { classes: [] });
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

  const applyResponse = (data) => {
    setState(data);
    setRows(data.results.map((item) => ({ ...item, rank: item.rank ?? "" })));
  };

  const loadResults = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const res = await reportCardService.getResults({
        className: filterData.className,
        sectionName: filterData.sectionName,
      });

      applyResponse(res.data?.data || EMPTY_STATE);
    } catch (err) {
      applyResponse(EMPTY_STATE);
      alert(err.response?.data?.message || "Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!filterData.className || !filterData.sectionName) {
      alert("Please select class and section");
      return;
    }

    setSearched(true);
    setSelectedStudentIds([]);
    await loadResults();
  };

  const runAction = async (action, successMessage) => {
    try {
      setBusy(true);
      const res = await action();
      alert(res?.data?.message || successMessage);
      await loadResults(false);
    } catch (err) {
      alert(err.response?.data?.message || "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const scope = { className: filterData.className, sectionName: filterData.sectionName };

  const handleGenerateResult = () => {
    if (state.studentCount === 0) {
      alert("No students found");
      return;
    }

    runAction(() => reportCardService.generateResults({ ...scope, rankMode: filterData.rankMode }), "Result generated successfully");
  };

  const handleSaveManual = () => {
    runAction(
      () =>
        reportCardService.saveManualResults({
          ...scope,
          rows: rows.map((row) => ({
            studentId: row.studentId,
            totalMarks: row.totalMarks,
            maximumMarks: row.maximumMarks,
            percentage: row.percentage,
            division: row.division,
            rank: row.rank,
            result: row.result,
          })),
        }),
      "Result saved successfully"
    );
  };

  const handleToggleLock = () => runAction(() => reportCardService.setResultLock({ ...scope, locked: !state.isLocked }), "Done");

  const handleToggleClassLive = () =>
    runAction(() => reportCardService.setResultLive({ ...scope, live: !state.isClassLive }), "Done");

  const allSelectedLive =
    selectedStudentIds.length > 0 &&
    selectedStudentIds.every((id) => rows.find((row) => row.studentId === id)?.isLive);

  const handleToggleStudentLive = () => {
    if (selectedStudentIds.length === 0) {
      alert("Please select students");
      return;
    }

    runAction(
      () => reportCardService.setResultLive({ ...scope, studentIds: selectedStudentIds, live: !allSelectedLive }),
      "Done"
    );
  };

  const handleManualChange = (studentId, field, value) => {
    if (state.isLocked) return;
    setRows((prev) => prev.map((item) => (item.studentId === studentId ? { ...item, [field]: value } : item)));
  };

  const manualDisabled = calculationMode === "Auto Calculate" || state.isLocked;

  return (
    <div className="result-generation-page">
      <div className="common-page-header">
        <AppButton type="back" onClick={() => navigate("/report-card-management")}>
          ←
        </AppButton>

        <div>
          <h1>Result Generation</h1>
          <p>Generate, manage, lock and publish results</p>
        </div>
      </div>

      <div className="common-card">
        <h2>Filter Records</h2>

        <div className="filter-grid">
          <div className="form-group">
            <label>Class</label>

            <select
              value={filterData.className}
              disabled={metaLoading}
              onChange={(e) => {
                setFilterData({ ...filterData, className: e.target.value, sectionName: "" });
                setSearched(false);
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
                setSearched(false);
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

          <div className="form-group">
            <label>Rank Calculation Mode</label>

            <select value={filterData.rankMode} onChange={(e) => setFilterData({ ...filterData, rankMode: e.target.value })}>
              <option value="SECTION">Section Wise Rank</option>
              <option value="CLASS">Overall Class Rank</option>
            </select>
          </div>

          <div className="form-group">
            <label>Calculation Mode</label>

            <select value={calculationMode} onChange={(e) => setCalculationMode(e.target.value)}>
              <option>Auto Calculate</option>
              <option>Manual Entry</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <AppButton type="primary" onClick={handleSearch} disabled={loading}>
            {loading ? "Loading..." : "Search"}
          </AppButton>
        </div>
      </div>

      <div className="result-notice">
        NOTE: Once the report card is locked, marks can no longer be edited. To make any corrections, unlock the report card
        first, update the marks, and then click the Generate Result button again to apply the latest changes.
      </div>

      {searched && (
        <div className="common-card">
          <div className="result-top-actions">
            <AppButton type="primary" onClick={handleGenerateResult} disabled={busy || loading || state.isLocked}>
              Generate Result
            </AppButton>

            {calculationMode === "Manual Entry" && (
              <AppButton type="primary" onClick={handleSaveManual} disabled={busy || loading || state.isLocked || rows.length === 0}>
                Save Manual Result
              </AppButton>
            )}

            <AppButton
              type={state.isLocked ? "danger" : "primary"}
              onClick={handleToggleLock}
              disabled={busy || loading}
            >
              {state.isLocked ? "Unlock Result" : "Lock Result"}
            </AppButton>

            <AppButton
              type={state.isClassLive ? "danger" : "success"}
              onClick={handleToggleClassLive}
              disabled={busy || loading}
            >
              {state.isClassLive ? "Remove Class Live" : "Make Class Live"}
            </AppButton>

            <AppButton type="success" onClick={handleToggleStudentLive} disabled={busy || loading}>
              {allSelectedLive ? "Remove Selected Students Live" : "Make Selected Students Live"}
            </AppButton>
          </div>

          {loading ? (
            <Skeleton variant="rectangular" height={110} count={3} />
          ) : rows.length === 0 ? (
            <div className="empty-row">
              {state.studentCount === 0 ? "No students found" : "No result generated"}
            </div>
          ) : (
            <div className="result-list">
              {rows.map((student) => (
                <div className="student-result-card" key={student.studentId}>
                  <div className="student-result-top">
                    <div className="student-left">
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(student.studentId)}
                        onChange={() =>
                          setSelectedStudentIds((prev) =>
                            prev.includes(student.studentId)
                              ? prev.filter((id) => id !== student.studentId)
                              : [...prev, student.studentId]
                          )
                        }
                      />

                      <div>
                        <h3>
                          {student.rollNo || "-"} | {student.srNo || "-"} | {student.studentName}
                        </h3>

                        <p>Father : {student.fatherName || "-"}</p>

                        <p>Mother : {student.motherName || "-"}</p>
                      </div>
                    </div>

                    <div className="live-status-wrap">
                      {state.isClassLive || student.isLive ? (
                        <span className="live-badge">LIVE</span>
                      ) : (
                        <span className="offline-badge">NOT LIVE</span>
                      )}
                    </div>
                  </div>

                  <div className="result-grid">
                    <div className="result-field">
                      <label>Total Marks (out of {student.maximumMarks})</label>

                      <input
                        type="number"
                        min="0"
                        disabled={manualDisabled}
                        value={student.totalMarks}
                        onChange={(e) => handleManualChange(student.studentId, "totalMarks", e.target.value)}
                      />
                    </div>

                    <div className="result-field">
                      <label>Percentage</label>

                      <input
                        type="number"
                        min="0"
                        max="100"
                        disabled={manualDisabled}
                        value={student.percentage}
                        onChange={(e) => handleManualChange(student.studentId, "percentage", e.target.value)}
                      />
                    </div>

                    <div className="result-field">
                      <label>Division</label>

                      <select
                        disabled={manualDisabled}
                        value={student.division}
                        onChange={(e) => handleManualChange(student.studentId, "division", e.target.value)}
                      >
                        {["First", "Second", "Third", "Fail", "-"].map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="result-field">
                      <label>Rank</label>

                      <input
                        type="number"
                        min="1"
                        disabled={manualDisabled}
                        value={student.rank}
                        onChange={(e) => handleManualChange(student.studentId, "rank", e.target.value)}
                      />
                    </div>

                    <div className="result-field">
                      <label>Result</label>

                      <select
                        disabled={manualDisabled}
                        value={student.result}
                        onChange={(e) => handleManualChange(student.studentId, "result", e.target.value)}
                      >
                        {["PASS", "FAIL", "NA"].map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ResultGeneration;
