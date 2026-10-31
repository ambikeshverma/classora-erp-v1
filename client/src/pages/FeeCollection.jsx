import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./feeCollection.css";
import AppButton from "../components/AppButton";
import { Skeleton, SkeletonStats, SkeletonTable } from "../components/Skeleton";
import FeeLedgerView from "../components/fee/FeeLedgerView";
import FeeReceiptModal from "../components/fee/FeeReceiptModal";
import FeeStudentProfile from "../components/fee/FeeStudentProfile";
import { feeService } from "../services/api";
import { formatMoney, todayISO } from "../utils/feeUtils";

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

function FeeCollection() {
  const navigate = useNavigate();

  const [meta, setMeta] = useState(null);
  const [metaLoading, setMetaLoading] = useState(true);

  const [searchValue, setSearchValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [dashLoading, setDashLoading] = useState(false);
  const [dashError, setDashError] = useState("");

  const [selectedPeriods, setSelectedPeriods] = useState([]);
  const [deselectedHeads, setDeselectedHeads] = useState([]);
  const [payableOnly, setPayableOnly] = useState(true);

  const [paymentMode, setPaymentMode] = useState("Cash");
  const [paymentRef, setPaymentRef] = useState("");
  const [remarks, setRemarks] = useState("");
  const [zeroReceiptConfirmed, setZeroReceiptConfirmed] = useState(false);
  const [depositDate, setDepositDate] = useState(todayISO());
  const [totalPaidInput, setTotalPaidInput] = useState("");
  const [rowPaidAmounts, setRowPaidAmounts] = useState({});
  const [saving, setSaving] = useState(false);

  const [showAddFeePopup, setShowAddFeePopup] = useState(false);
  const [showTransportPopup, setShowTransportPopup] = useState(false);
  const [showConcessionPopup, setShowConcessionPopup] = useState(false);
  const [showLedgerPopup, setShowLedgerPopup] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);

  const [addFeeForm, setAddFeeForm] = useState({ feeHeadName: "", periodKey: "", amount: "" });
  const [transportRouteId, setTransportRouteId] = useState("");
  const [popupBusy, setPopupBusy] = useState(false);

  const requestRef = useRef(0);

  // School level data (sessions, fee heads, transport routes, school info) in a single call
  useEffect(() => {
    let active = true;

    feeService
      .getMeta()
      .then((res) => {
        if (active) setMeta(res.data?.data || null);
      })
      .catch((err) => {
        console.error("Failed to load fee collection meta", err);
      })
      .finally(() => {
        if (active) setMetaLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Debounced student search against the database
  useEffect(() => {
    const query = searchValue.trim();

    if (!showSuggestions || query.length < 2) {
      setSuggestions([]);
      setSearching(false);
      return undefined;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await feeService.searchStudents(query);
        if (active) setSuggestions(res.data?.data || []);
      } catch {
        if (active) setSuggestions([]);
      } finally {
        if (active) setSearching(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchValue, showSuggestions]);

  const loadDashboard = useCallback(async (studentId, session) => {
    const requestId = ++requestRef.current;
    setDashLoading(true);
    setDashError("");

    try {
      const res = await feeService.getDashboard(studentId, session);
      if (requestId !== requestRef.current) return;

      setDashboard(res.data?.data || null);
      setSelectedSession(res.data?.data?.session || "");
    } catch (err) {
      if (requestId !== requestRef.current) return;

      setDashboard(null);
      setDashError(err.response?.data?.message || "Failed to load fee details");
    } finally {
      if (requestId === requestRef.current) setDashLoading(false);
    }
  }, []);

  const resetCollectionForm = () => {
    setSelectedPeriods([]);
    setTotalPaidInput("");
    setPaymentMode("Cash");
    setPaymentRef("");
    setRemarks("");
    setZeroReceiptConfirmed(false);
    setRowPaidAmounts({});
    setDepositDate(todayISO());
  };

  const allRows = useMemo(() => dashboard?.rows || [], [dashboard]);
  const periods = useMemo(() => dashboard?.periods || [], [dashboard]);
  const feeHeadNames = useMemo(() => [...new Set(allRows.map((row) => row.feeHeadName))], [allRows]);

  const visibleRows = useMemo(
    () =>
      allRows.filter((row) => {
        const periodMatch = selectedPeriods.length === 0 || selectedPeriods.includes(row.periodKey);
        const headMatch = !deselectedHeads.includes(row.feeHeadName);
        const payableMatch = payableOnly ? row.payable > 0 : true;
        return periodMatch && headMatch && payableMatch;
      }),
    [allRows, selectedPeriods, deselectedHeads, payableOnly]
  );

  const getEditablePayable = (row) =>
    rowPaidAmounts[row.rowKey] !== undefined ? rowPaidAmounts[row.rowKey] : row.payable;

  const totalPayableNow = round2(visibleRows.reduce((sum, row) => sum + Number(getEditablePayable(row) || 0), 0));
  const calculatedPaidInput = totalPaidInput === "" ? totalPayableNow : Number(totalPaidInput);

  const totals = dashboard?.totals || { totalFee: 0, totalConcession: 0, totalPaid: 0, balance: 0 };
  const profile = dashboard?.profile || {};
  const student = dashboard?.student || {};
  const transport = dashboard?.transport || null;

  const getPeriodStatus = (periodKey) => {
    const list = allRows.filter((row) => row.periodKey === periodKey);
    if (list.length === 0) return "upcoming";

    const due = list.reduce((sum, row) => sum + row.fee - row.concession, 0);
    const paid = list.reduce((sum, row) => sum + row.paid, 0);

    if (due <= 0 || paid >= due) return "paid";
    if (paid > 0) return "partial";
    return "due";
  };

  const payableTotal = totals.totalFee - totals.totalConcession;
  const progressPercent = payableTotal > 0 ? Math.min(Math.round((totals.totalPaid / payableTotal) * 100), 100) : 0;

  const handleStudentSelect = (item) => {
    setSearchValue(item.studentName);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedStudentId(item._id);
    setSelectedSession("");
    setDashboard(null);
    setDeselectedHeads([]);
    resetCollectionForm();
    loadDashboard(item._id, "");
  };

  const handleSessionChange = (session) => {
    setSelectedSession(session);
    setDeselectedHeads([]);
    resetCollectionForm();
    loadDashboard(selectedStudentId, session);
  };

  const refreshDashboard = () => loadDashboard(selectedStudentId, dashboard?.session || selectedSession);

  // Selecting a period selects everything up to it; selecting it again trims back
  const handlePeriodClick = (periodKey) => {
    const index = periods.findIndex((item) => item.key === periodKey);
    if (index === -1) return;

    if (!selectedPeriods.includes(periodKey)) {
      setSelectedPeriods(periods.slice(0, index + 1).map((item) => item.key));
    } else {
      setSelectedPeriods(periods.slice(0, index).map((item) => item.key));
    }
  };

  const handleToggleFeeHead = (name) => {
    setDeselectedHeads((prev) => (prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]));
  };

  const handleToggleAllFeeHeads = (checked) => {
    setDeselectedHeads(checked ? [] : [...feeHeadNames]);
  };

  const handleSaveReceipt = async () => {
    if (!dashboard) {
      alert("Please select student");
      return;
    }

    if (visibleRows.length === 0) {
      alert("No fee rows selected");
      return;
    }

    if (Number.isNaN(calculatedPaidInput) || calculatedPaidInput < 0) {
      alert("Invalid paid amount");
      return;
    }

    if (calculatedPaidInput > totalPayableNow + 0.001) {
      alert("Total paid cannot exceed payable amount");
      return;
    }

    if (calculatedPaidInput === 0 && !zeroReceiptConfirmed) {
      alert("Please confirm ZERO amount receipt.");
      return;
    }

    if (depositDate > todayISO()) {
      alert("Future date is not allowed");
      return;
    }

    if (paymentMode !== "Cash" && !paymentRef.trim()) {
      alert("Please enter payment reference number");
      return;
    }

    let remaining = calculatedPaidInput;
    const payloadRows = visibleRows.map((row) => {
      const cap = Number(getEditablePayable(row) || 0);
      const pay = Math.min(remaining, cap);
      remaining = round2(remaining - pay);
      return { rowKey: row.rowKey, paid: round2(pay) };
    });

    try {
      setSaving(true);
      const res = await feeService.createReceipt({
        studentId: student.id,
        session: dashboard.session,
        depositDate,
        paymentMode,
        paymentRef: paymentMode === "Cash" ? "" : paymentRef.trim(),
        remarks,
        rows: payloadRows,
        confirmZero: zeroReceiptConfirmed,
      });

      setLastReceipt(res.data?.data || null);
      resetCollectionForm();
      await refreshDashboard();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save receipt");
    } finally {
      setSaving(false);
    }
  };

  const handleAddManualFee = async () => {
    if (!addFeeForm.feeHeadName || !addFeeForm.periodKey || !addFeeForm.amount) {
      alert("Please select fee head, fee period and amount");
      return;
    }

    try {
      setPopupBusy(true);
      await feeService.addManualFee(student.id, {
        session: dashboard.session,
        feeHeadName: addFeeForm.feeHeadName,
        periodKey: addFeeForm.periodKey,
        amount: Number(addFeeForm.amount),
      });

      setAddFeeForm({ feeHeadName: "", periodKey: "", amount: "" });
      await refreshDashboard();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add fee");
    } finally {
      setPopupBusy(false);
    }
  };

  const handleDeleteManualFee = async (manualFeeId) => {
    if (!window.confirm("Delete selected added fee?")) return;

    try {
      setPopupBusy(true);
      await feeService.deleteManualFee(manualFeeId);
      await refreshDashboard();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete fee");
    } finally {
      setPopupBusy(false);
    }
  };

  const openTransportPopup = () => {
    setTransportRouteId(transport?.routeId || "");
    setShowTransportPopup(true);
  };

  const handleAllocateTransport = async () => {
    if (!transportRouteId) {
      alert("Please select route");
      return;
    }

    try {
      setPopupBusy(true);
      await feeService.allocateTransport(student.id, { session: dashboard.session, routeId: transportRouteId });
      await refreshDashboard();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to allocate transport");
    } finally {
      setPopupBusy(false);
    }
  };

  const handleRemoveFullTransport = async () => {
    if (!transport) {
      alert("Transport is not allocated to this student");
      return;
    }

    if (!window.confirm("Remove full transport from this student?")) return;

    try {
      setPopupBusy(true);
      await feeService.removeTransport(student.id, dashboard.session);
      setTransportRouteId("");
      await refreshDashboard();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to remove transport");
    } finally {
      setPopupBusy(false);
    }
  };

  const handleTransportPeriod = async (periodKey, restore) => {
    try {
      setPopupBusy(true);
      await feeService.setTransportPeriod(student.id, { session: dashboard.session, periodKey, restore });
      await refreshDashboard();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update transport fee");
    } finally {
      setPopupBusy(false);
    }
  };

  const concessionRows = allRows.filter((row) => row.concession > 0);
  const feeSessions = meta?.sessions || [];

  const renderDashboardSkeleton = () => (
    <div className="fc-layout">
      <div className="fc-left-panel">
        <div className="fc-card fc-skeleton-card">
          <Skeleton variant="circular" width={72} height={72} />
          <Skeleton variant="text" count={5} height={14} />
        </div>
        <SkeletonStats count={4} />
      </div>

      <div className="fc-right-panel">
        <div className="fc-card fc-skeleton-card">
          <Skeleton variant="text" width="40%" height={20} />
          <Skeleton variant="rectangular" height={44} />
        </div>
        <div className="fc-card fc-skeleton-card">
          <SkeletonTable rows={6} columns={7} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="fc-page">
      <div className="fc-header">
        <AppButton type="back" onClick={() => navigate("/fee-manager")}>
          ←
        </AppButton>

        <div className="fc-header-title">
          <h1>Fee Collection</h1>
          <p>Search student and collect fee</p>
        </div>

        <div className="fc-header-tools">
          <div className="fc-search-area">
            <input
              type="text"
              placeholder="Search by student, father, mobile, SR no, admission no..."
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
                setShowSuggestions(true);
              }}
            />

            <span className="fc-search-icon">🔎</span>

            {showSuggestions && searchValue.trim().length >= 2 && (
              <div className="fc-search-suggestion-box">
                {searching ? (
                  <div className="fc-suggestion-skeleton">
                    <Skeleton variant="text" count={3} height={14} />
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="fc-suggestion-empty">No student found</div>
                ) : (
                  suggestions.map((item) => (
                    <button
                      type="button"
                      className="fc-search-suggestion-item"
                      key={item._id}
                      onClick={() => handleStudentSelect(item)}
                    >
                      <strong>{item.studentName}</strong>
                      <span>
                        {[item.className, item.section].filter(Boolean).join(" - ") || "No class"} | Father:{" "}
                        {item.fatherName || "-"} | Mobile: {item.mobile || "-"} | SR: {item.srNo || "-"}
                        {item.schoolAdmissionNo ? ` | Adm: ${item.schoolAdmissionNo}` : ""}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {metaLoading ? (
            <Skeleton variant="input" width={150} height={42} />
          ) : (
            <select
              className="fc-session-select"
              value={selectedSession}
              disabled={!selectedStudentId}
              onChange={(e) => handleSessionChange(e.target.value)}
            >
              {!selectedSession && <option value="">Session</option>}
              {feeSessions.map((session) => (
                <option key={session} value={session}>
                  {session}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {!selectedStudentId ? (
        <div className="fc-card fc-empty-card">Search and select a student to load fee dashboard</div>
      ) : dashLoading && !dashboard ? (
        renderDashboardSkeleton()
      ) : !dashboard ? (
        <div className="fc-card fc-empty-card">{dashError || "Fee details are not available"}</div>
      ) : (
        <div className="fc-layout">
          <div className="fc-left-panel">
            <div className="fc-card fc-student-card">
              <div className="fc-student-photo">
                {student.photo ? <img src={student.photo} alt="Student" /> : <span>👤</span>}
              </div>

              <div className="fc-student-info">
                <h2>{student.studentName}</h2>

                <div className="fc-student-grid">
                  <p>
                    <strong>Class:</strong> {[profile.className, profile.section].filter(Boolean).join(" - ") || "-"}
                  </p>

                  <p>
                    <strong>Father:</strong> {student.fatherName || "-"}
                  </p>

                  <p>
                    <strong>Mobile:</strong> {student.mobile || "-"}
                  </p>

                  <p>
                    <strong>Admission No:</strong> {student.admissionNo || "-"}
                  </p>

                  <p>
                    <strong>SR No:</strong> {student.srNo || "-"}
                  </p>

                  <p>
                    <strong>Fee Plan:</strong> {profile.feePlan || "-"}
                  </p>

                  <p>
                    <strong>Concession:</strong> {profile.concessionPlan || "-"}
                  </p>

                  <p>
                    <strong>Route:</strong> {profile.routeName || "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="fc-summary-grid">
              <div className="fc-summary-box">
                <span>Total Fee</span>
                <strong>{formatMoney(totals.totalFee)}</strong>
              </div>

              <div className="fc-summary-box">
                <span>Concession</span>
                <strong>{formatMoney(totals.totalConcession)}</strong>
              </div>

              <div className="fc-summary-box fc-paid-box">
                <span>Paid</span>
                <strong>{formatMoney(totals.totalPaid)}</strong>
              </div>

              <div className="fc-summary-box fc-balance-box">
                <span>Balance</span>
                <strong>{formatMoney(totals.balance)}</strong>
              </div>
            </div>

            <div className="fc-card fc-head-card">
              {feeHeadNames.length === 0 ? (
                <div className="fc-head-empty">No fee heads available</div>
              ) : (
                <>
                  <label className="fc-head-item">
                    <input
                      type="checkbox"
                      checked={deselectedHeads.length === 0}
                      onChange={(e) => handleToggleAllFeeHeads(e.target.checked)}
                    />
                    <span>All Fee Heads</span>
                  </label>

                  {feeHeadNames.map((name) => (
                    <label className="fc-head-item" key={name}>
                      <input
                        type="checkbox"
                        checked={!deselectedHeads.includes(name)}
                        onChange={() => handleToggleFeeHead(name)}
                      />
                      <span>{name}</span>
                    </label>
                  ))}
                </>
              )}
            </div>
          </div>

          <div className="fc-right-panel">
            {dashboard.feePlanMissing && (
              <div className="fc-notice-warning">
                No fee plan found for {profile.className || "this class"}
                {profile.feePlan ? ` / ${profile.feePlan}` : ""}. Set it up in Admin Panel → Fee Plan Management to
                generate this student's fee.
              </div>
            )}

            <div className="fc-card fc-month-card">
              <div className="fc-card-head">
                <h2>Fee Status Summary</h2>
                <strong>{progressPercent}% Paid</strong>
              </div>

              <div className="fc-progress-track">
                <div className="fc-progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>

              <div className="fc-month-grid">
                {periods.map((period) => {
                  const status = getPeriodStatus(period.key);
                  const selected = selectedPeriods.includes(period.key);

                  return (
                    <button
                      type="button"
                      key={period.key}
                      className={`fc-month-box ${status} ${selected ? "selected" : ""}`}
                      onClick={() => handlePeriodClick(period.key)}
                    >
                      {period.short}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="fc-action-row">
              <AppButton type="secondary" onClick={() => setShowProfilePopup(true)}>
                Student Profile
              </AppButton>

              <AppButton type="secondary" onClick={() => setShowAddFeePopup(true)}>
                + Add Fee
              </AppButton>

              <AppButton type="secondary" onClick={() => setShowConcessionPopup(true)}>
                Concession
              </AppButton>

              <AppButton type="secondary" onClick={openTransportPopup}>
                Transport Fee
              </AppButton>

              <AppButton type="secondary" onClick={() => setShowLedgerPopup(true)}>
                Fee Ledger
              </AppButton>
            </div>

            <div className="fc-card fc-main-card">
              <div className="fc-table-wrap">
                <table className="fc-table">
                  <thead>
                    <tr>
                      <th>
                        <label className="fc-payable-head">
                          <input
                            type="checkbox"
                            checked={payableOnly}
                            onChange={(e) => setPayableOnly(e.target.checked)}
                          />
                          Payable Only
                        </label>
                      </th>
                      <th>Month</th>
                      <th>Fee</th>
                      <th>Concession</th>
                      <th>Paid</th>
                      <th>Balance</th>
                      <th>Payable</th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleRows.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="fc-empty-row">
                          {allRows.length === 0 ? "No fee found for this session" : "No payable fee found"}
                        </td>
                      </tr>
                    ) : (
                      visibleRows.map((row) => (
                        <tr key={row.rowKey}>
                          <td>{row.feeHeadName}</td>
                          <td>{row.periodShort}</td>
                          <td>{formatMoney(row.fee)}</td>
                          <td>{formatMoney(row.concession)}</td>
                          <td>{formatMoney(row.paid)}</td>
                          <td>{formatMoney(row.balance)}</td>
                          <td>
                            <input
                              className="fc-payable-input"
                              type="number"
                              min="0"
                              max={row.payable}
                              value={getEditablePayable(row)}
                              onChange={(e) => {
                                const value = Number(e.target.value || 0);

                                if (value > row.payable) {
                                  alert("Payable amount cannot exceed balance.");
                                  return;
                                }

                                setRowPaidAmounts({ ...rowPaidAmounts, [row.rowKey]: value });
                                setTotalPaidInput("");
                              }}
                            />
                          </td>
                        </tr>
                      ))
                    )}

                    {visibleRows.length > 0 && (
                      <tr className="fc-total-row">
                        <td colSpan="2">Total</td>
                        <td>{formatMoney(visibleRows.reduce((sum, row) => sum + row.fee, 0))}</td>
                        <td>{formatMoney(visibleRows.reduce((sum, row) => sum + row.concession, 0))}</td>
                        <td>{formatMoney(visibleRows.reduce((sum, row) => sum + row.paid, 0))}</td>
                        <td>{formatMoney(visibleRows.reduce((sum, row) => sum + row.balance, 0))}</td>
                        <td>{formatMoney(totalPayableNow)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="fc-payment-section">
                <div className="fc-payment-grid">
                  <div className="fc-form-group">
                    <label>Payment Mode</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => {
                        setPaymentMode(e.target.value);
                        setPaymentRef("");
                      }}
                    >
                      {(meta?.paymentModes || ["Cash"]).map((mode) => (
                        <option key={mode}>{mode}</option>
                      ))}
                    </select>
                  </div>

                  {paymentMode !== "Cash" && (
                    <div className="fc-form-group">
                      <label>Payment Ref #</label>
                      <input
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        placeholder="Transaction / cheque / reference no"
                      />
                    </div>
                  )}

                  <div className="fc-form-group">
                    <label>Remarks</label>
                    <input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Enter remarks" />
                  </div>

                  <div className="fc-form-group">
                    <label>Deposit Date 🔒</label>
                    <input
                      type="date"
                      value={depositDate}
                      max={todayISO()}
                      onChange={(e) => setDepositDate(e.target.value)}
                    />
                  </div>

                  <div className="fc-form-group">
                    <label>Total Paid</label>
                    <input
                      type="number"
                      min="0"
                      value={totalPaidInput === "" ? totalPayableNow : totalPaidInput}
                      onChange={(e) => setTotalPaidInput(e.target.value)}
                    />
                  </div>
                </div>

                <label className="fc-zero-row">
                  <input
                    type="checkbox"
                    checked={zeroReceiptConfirmed}
                    onChange={(e) => setZeroReceiptConfirmed(e.target.checked)}
                  />
                  <span>I confirm to save ZERO amount receipt</span>
                </label>

                <div className="fc-save-row">
                  <AppButton type="primary" onClick={handleSaveReceipt} disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </AppButton>

                  <AppButton type="secondary" onClick={resetCollectionForm} disabled={saving}>
                    Close
                  </AppButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProfilePopup && dashboard && (
        <FeeStudentProfile studentId={student.id} onClose={() => setShowProfilePopup(false)} />
      )}

      {showLedgerPopup && dashboard && (
        <FeeLedgerView
          student={student}
          profile={profile}
          session={dashboard.session}
          receipts={dashboard.receipts}
          periods={periods}
          rows={allRows}
          onClose={() => setShowLedgerPopup(false)}
          onPrint={() => window.print()}
        />
      )}

      {lastReceipt && (
        <FeeReceiptModal receipt={lastReceipt} schoolInfo={meta?.schoolInfo} onClose={() => setLastReceipt(null)} />
      )}

      {showConcessionPopup && dashboard && (
        <div className="fc-popup-overlay">
          <div className="fc-popup">
            <div className="fc-popup-head">
              <h2>Concession</h2>

              <button className="fc-popup-close" onClick={() => setShowConcessionPopup(false)}>
                ×
              </button>
            </div>

            <div className="fc-popup-note">
              <strong>Concession Plan:</strong> {profile.concessionPlan || "-"}
              <br />
              To change the plan, update the student's concession plan from Student Hub.
            </div>

            <div className="fc-table-wrap fc-popup-table-wrap">
              <table className="fc-table">
                <thead>
                  <tr>
                    <th>Fee Head</th>
                    <th>Month</th>
                    <th>Fee</th>
                    <th>Concession</th>
                  </tr>
                </thead>

                <tbody>
                  {concessionRows.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="fc-empty-row">
                        No concession applied for this session
                      </td>
                    </tr>
                  ) : (
                    concessionRows.map((row) => (
                      <tr key={row.rowKey}>
                        <td>{row.feeHeadName}</td>
                        <td>{row.periodShort}</td>
                        <td>{formatMoney(row.fee)}</td>
                        <td>{formatMoney(row.concession)}</td>
                      </tr>
                    ))
                  )}

                  {concessionRows.length > 0 && (
                    <tr className="fc-total-row">
                      <td colSpan="3">Total Concession</td>
                      <td>{formatMoney(totals.totalConcession)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showAddFeePopup && dashboard && (
        <div className="fc-popup-overlay">
          <div className="fc-popup">
            <div className="fc-popup-head">
              <h2>Add Fee</h2>

              <button className="fc-popup-close" onClick={() => setShowAddFeePopup(false)}>
                ×
              </button>
            </div>

            <div className="fc-popup-form-grid">
              <div className="fc-form-group">
                <label>Fee Head</label>
                <select
                  value={addFeeForm.feeHeadName}
                  onChange={(e) => setAddFeeForm({ ...addFeeForm, feeHeadName: e.target.value })}
                >
                  <option value="">Select Fee Head</option>

                  {(meta?.feeHeads || []).map((head) => (
                    <option key={head.id} value={head.name}>
                      {head.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="fc-form-group">
                <label>Fee Period</label>
                <select
                  value={addFeeForm.periodKey}
                  onChange={(e) => setAddFeeForm({ ...addFeeForm, periodKey: e.target.value })}
                >
                  <option value="">Select Period</option>

                  {periods.map((period) => (
                    <option key={period.key} value={period.key}>
                      {period.key}
                    </option>
                  ))}
                </select>
              </div>

              <div className="fc-form-group">
                <label>Amount</label>
                <input
                  type="number"
                  min="0"
                  value={addFeeForm.amount}
                  onChange={(e) => setAddFeeForm({ ...addFeeForm, amount: e.target.value })}
                  placeholder="Enter amount"
                />
              </div>
            </div>

            {(meta?.feeHeads || []).length === 0 && (
              <div className="fc-popup-note">
                No fee heads are configured. Add fee heads in Admin Panel → Fee Scheme first.
              </div>
            )}

            <div className="fc-popup-action-row">
              <AppButton type="primary" onClick={handleAddManualFee} disabled={popupBusy}>
                {popupBusy ? "Saving..." : "Save"}
              </AppButton>
            </div>

            <div className="fc-table-wrap fc-popup-table-wrap">
              <table className="fc-table">
                <thead>
                  <tr>
                    <th>Del</th>
                    <th>Fee Schedule</th>
                    <th>Fee</th>
                    <th>Paid</th>
                    <th>Balance</th>
                  </tr>
                </thead>

                <tbody>
                  {dashboard.manualFees.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="fc-empty-row">
                        No added fee found
                      </td>
                    </tr>
                  ) : (
                    dashboard.manualFees.map((fee) => (
                      <tr key={fee.id}>
                        <td>
                          <button
                            className="fc-simple-icon-btn"
                            disabled={popupBusy}
                            onClick={() => handleDeleteManualFee(fee.id)}
                          >
                            🗑
                          </button>
                        </td>

                        <td>
                          {fee.periodKey} {fee.feeHeadName}
                        </td>

                        <td>{formatMoney(fee.amount)}</td>
                        <td>{formatMoney(fee.paid)}</td>
                        <td>{formatMoney(fee.balance)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showTransportPopup && dashboard && (
        <div className="fc-popup-overlay">
          <div className="fc-popup fc-transport-popup">
            <div className="fc-popup-head">
              <h2>Transport Fee</h2>

              <button className="fc-popup-close" onClick={() => setShowTransportPopup(false)}>
                ×
              </button>
            </div>

            <div className="fc-popup-form-grid">
              <div className="fc-form-group">
                <label>Route</label>
                <select value={transportRouteId} onChange={(e) => setTransportRouteId(e.target.value)}>
                  <option value="">Select Route</option>

                  {(meta?.routes || []).map((route) => (
                    <option key={route._id} value={route._id}>
                      {route.routeName} - {formatMoney(route.monthlyFee)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {(meta?.routes || []).length === 0 && (
              <div className="fc-popup-note">
                No transport routes available. Add routes in Transport System → Route Management.
              </div>
            )}

            <div className="fc-transport-actions">
              <AppButton type="primary" onClick={handleAllocateTransport} disabled={popupBusy}>
                {popupBusy ? "Please wait..." : "Allocate Transport"}
              </AppButton>

              <AppButton type="delete" onClick={handleRemoveFullTransport} disabled={popupBusy}>
                Remove Full Transport
              </AppButton>
            </div>

            <div className="fc-table-wrap fc-popup-table-wrap">
              <table className="fc-table">
                <thead>
                  <tr>
                    <th>Del</th>
                    <th>Period</th>
                    <th>Route</th>
                    <th>Fee</th>
                    <th>Paid</th>
                    <th>Balance</th>
                  </tr>
                </thead>

                <tbody>
                  {!transport ? (
                    <tr>
                      <td colSpan="6" className="fc-empty-row">
                        Transport is not allocated to this student
                      </td>
                    </tr>
                  ) : (
                    periods.map((period) => {
                      const removed = transport.removedPeriods.includes(period.key);
                      const row = allRows.find((item) => item.source === "Transport" && item.periodKey === period.key);
                      const fee = row?.fee || 0;
                      const paid = row?.paid || 0;
                      const balance = row?.balance || 0;

                      return (
                        <tr key={period.key}>
                          <td>
                            {removed ? (
                              <button
                                className="fc-simple-icon-btn"
                                title="Restore"
                                disabled={popupBusy}
                                onClick={() => handleTransportPeriod(period.key, true)}
                              >
                                ↩
                              </button>
                            ) : (
                              <button
                                className="fc-simple-icon-btn"
                                title="Remove"
                                disabled={popupBusy}
                                onClick={() => handleTransportPeriod(period.key, false)}
                              >
                                🗑
                              </button>
                            )}
                          </td>

                          <td>{period.key}</td>
                          <td>{transport.routeName || "-"}</td>
                          <td>{formatMoney(fee)}</td>
                          <td>{formatMoney(paid)}</td>

                          <td>
                            {removed ? (
                              <span className="fc-removed-badge">Removed</span>
                            ) : balance === 0 && paid > 0 ? (
                              <span className="fc-paid-badge">PAID</span>
                            ) : (
                              formatMoney(balance)
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeeCollection;
