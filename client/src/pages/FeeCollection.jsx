import React, { useMemo, useState } from "react";
import "./feeCollection.css";
import AppButton from "../components/AppButton";
import FeeLedgerView from "../components/fee/FeeLedgerView";
import FeeReceiptPrint from "../components/fee/FeeReceiptPrint";
import StudentProfileView from "../components/student/StudentProfileView";

function FeeCollection() {
  const schoolId = localStorage.getItem("schoolId") || "SCH001";
  const loggedInUserId = localStorage.getItem("userId") || "U001";
  const loggedInEmployeeName =
    localStorage.getItem("employeeName") || "Ankit Verma";

  const monthOptions = [
    { id: 1, short: "APR", name: "April" },
    { id: 2, short: "MAY", name: "May" },
    { id: 3, short: "JUN", name: "June" },
    { id: 4, short: "JUL", name: "July" },
    { id: 5, short: "AUG", name: "August" },
    { id: 6, short: "SEP", name: "September" },
    { id: 7, short: "OCT", name: "October" },
    { id: 8, short: "NOV", name: "November" },
    { id: 9, short: "DEC", name: "December" },
    { id: 10, short: "JAN", name: "January" },
    { id: 11, short: "FEB", name: "February" },
    { id: 12, short: "MAR", name: "March" },
  ];

  const sessions = [
    { id: 1, sessionName: "2024-2025", shortName: "2024-25", isCurrent: false },
    { id: 2, sessionName: "2025-2026", shortName: "2025-26", isCurrent: false },
    { id: 3, sessionName: "2026-2027", shortName: "2026-27", isCurrent: true },
  ];

  const feeHeads = [
    { id: 1, schoolId: "SCH001", headName: "Monthly Fee", type: "School" },
    { id: 2, schoolId: "SCH001", headName: "Maintenance Fee", type: "School" },
    { id: 3, schoolId: "SCH001", headName: "Transport Fee", type: "School" },
    { id: 4, schoolId: "SCH001", headName: "Tie+Belt", type: "SuperAdmin" },
    { id: 5, schoolId: "SCH001", headName: "ID Card", type: "SuperAdmin" },
  ];

  const feePlans = [
    {
      id: 1,
      schoolId: "SCH001",
      className: "Class 6",
      planName: "English Medium Fee Plan",
    },
    {
      id: 2,
      schoolId: "SCH001",
      className: "Class 5",
      planName: "Hindi Medium Fee Plan",
    },
  ];

  const feePlanDetails = [
    {
      id: 1,
      schoolId: "SCH001",
      feePlanId: 1,
      feeHeadId: 1,
      amount: 725,
      monthly: true,
    },
    {
      id: 2,
      schoolId: "SCH001",
      feePlanId: 1,
      feeHeadId: 2,
      amount: 50,
      monthly: true,
    },
    {
      id: 3,
      schoolId: "SCH001",
      feePlanId: 2,
      feeHeadId: 1,
      amount: 535,
      monthly: true,
    },
  ];

  const routes = [
    {
      id: 1,
      schoolId: "SCH001",
      routeName: "Rasauli Route",
      monthlyFee: 500,
      status: "Active",
    },
    {
      id: 2,
      schoolId: "SCH001",
      routeName: "Lucknow Route",
      monthlyFee: 800,
      status: "Active",
    },
    {
      id: 3,
      schoolId: "SCH001",
      routeName: "Madaran Route",
      monthlyFee: 425,
      status: "Active",
    },
  ];

  const demoStudents = [
    {
      id: 1,
      schoolId: "SCH001",
      studentName: "Rahul Kumar",
      fatherName: "Sunil Kumar",
      mobile: "9876543210",
      srNo: "SR001",
      admissionNo: "ADM001",
      photo: "",
      sessionProfiles: [
        {
          sessionId: 2,
          className: "Class 5",
          sectionName: "B",
          feePlanId: 2,
          concessionPlanName: "No Concession",
          concessionAmount: 0,
        },
        {
          sessionId: 3,
          className: "Class 6",
          sectionName: "A",
          feePlanId: 1,
          concessionPlanName: "Staff Concession",
          concessionAmount: 50,
        },
      ],
    },
    {
      id: 2,
      schoolId: "SCH001",
      studentName: "Priya Singh",
      fatherName: "Dinesh Singh",
      mobile: "9876543211",
      srNo: "SR002",
      admissionNo: "ADM002",
      photo: "",
      sessionProfiles: [
        {
          sessionId: 3,
          className: "Class 6",
          sectionName: "A",
          feePlanId: 1,
          concessionPlanName: "No Concession",
          concessionAmount: 0,
        },
      ],
    },
  ];

  const [selectedSessionId, setSelectedSessionId] = useState(3);
  const [searchValue, setSearchValue] = useState("Rahul Kumar");
  const [selectedStudent, setSelectedStudent] = useState(demoStudents[0]);

  const [selectedMonths, setSelectedMonths] = useState([]);
  const [selectedFeeHeadIds, setSelectedFeeHeadIds] = useState(
    feeHeads.map((item) => item.id)
  );
  const [payableOnly, setPayableOnly] = useState(true);

  const [paymentMode, setPaymentMode] = useState("Cash");
  const [paymentRef, setPaymentRef] = useState("");
  const [remarks, setRemarks] = useState("");
  const [zeroReceiptConfirmed, setZeroReceiptConfirmed] = useState(false);
  const [depositDate, setDepositDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [totalPaidInput, setTotalPaidInput] = useState("");
  const [rowPaidAmounts, setRowPaidAmounts] = useState({});

  const [showAddFeePopup, setShowAddFeePopup] = useState(false);
  const [showTransportPopup, setShowTransportPopup] = useState(false);
  const [showLedgerPopup, setShowLedgerPopup] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showReceiptPrint, setShowReceiptPrint] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);

  const [addFeeForm, setAddFeeForm] = useState({
    feeHeadId: "",
    monthName: "",
    amount: "",
  });

  const [manualFees, setManualFees] = useState([
    {
      id: 1,
      schoolId: "SCH001",
      studentId: 1,
      sessionId: 3,
      feeHeadId: 4,
      monthName: "June",
      amount: 100,
      paid: 0,
    },
  ]);

  const [transportAllocations, setTransportAllocations] = useState([
    {
      id: 1,
      schoolId: "SCH001",
      studentId: 1,
      sessionId: 3,
      routeId: 3,
      vehicleId: "",
      transportFee: 425,
      removedMonths: ["April", "May"],
    },
  ]);

  const [receipts, setReceipts] = useState([
    {
      id: 1,
      schoolId: "SCH001",
      studentId: 1,
      sessionId: 3,
      receiptNo: "01",
      depositDate: "2026-04-10",
      paymentMode: "Cash",
      paidAmount: 725,
      months: ["April"],
      rows: [
        {
          monthName: "April",
          feeHeadId: 1,
          fee: 725,
          concession: 0,
          paid: 725,
        },
      ],
      collectedByUserId: loggedInUserId,
      collectedByName: loggedInEmployeeName,
      status: "Active",
    },
  ]);

  const activeRoutes = routes.filter(
    (item) => item.schoolId === schoolId && item.status === "Active"
  );

  const currentSession = sessions.find(
    (item) => item.id === Number(selectedSessionId)
  );

  const selectedStudentProfile = selectedStudent?.sessionProfiles?.find(
    (item) => item.sessionId === Number(selectedSessionId)
  );

  const selectedFeePlan = feePlans.find(
    (item) => item.id === selectedStudentProfile?.feePlanId
  );

  const selectedTransport = transportAllocations.find(
    (item) =>
      item.schoolId === schoolId &&
      item.studentId === selectedStudent?.id &&
      item.sessionId === Number(selectedSessionId)
  );

  const selectedRoute = activeRoutes.find(
    (item) => item.id === selectedTransport?.routeId
  );

  const matchedStudents = searchValue.trim()
    ? demoStudents.filter((student) => {
        const value = searchValue.toLowerCase();

        return (
          student.schoolId === schoolId &&
          (student.studentName.toLowerCase().includes(value) ||
            student.fatherName.toLowerCase().includes(value) ||
            student.mobile.includes(searchValue) ||
            student.srNo.toLowerCase().includes(value) ||
            student.admissionNo.toLowerCase().includes(value))
        );
      })
    : [];

  const getHeadName = (feeHeadId) => {
    const head = feeHeads.find((item) => item.id === Number(feeHeadId));
    return head?.headName || "-";
  };

  const getStudentSessionReceipts = (studentId, sessionId) => {
    return receipts.filter(
      (item) =>
        item.schoolId === schoolId &&
        item.studentId === studentId &&
        item.sessionId === Number(sessionId) &&
        item.status === "Active"
    );
  };

  const getPaidForRow = (studentId, sessionId, monthName, feeHeadId) => {
    return getStudentSessionReceipts(studentId, sessionId).reduce(
      (total, receipt) => {
        const rowTotal = receipt.rows
          .filter(
            (row) =>
              row.monthName === monthName &&
              Number(row.feeHeadId) === Number(feeHeadId)
          )
          .reduce((sum, row) => sum + Number(row.paid || 0), 0);

        return total + rowTotal;
      },
      0
    );
  };

  const buildFeeRows = () => {
    if (!selectedStudent || !selectedStudentProfile) return [];

    const rows = [];

    monthOptions.forEach((month) => {
      const planDetails = feePlanDetails.filter(
        (item) =>
          item.schoolId === schoolId &&
          item.feePlanId === selectedStudentProfile.feePlanId
      );

      planDetails.forEach((item) => {
        const paid = getPaidForRow(
          selectedStudent.id,
          selectedSessionId,
          month.name,
          item.feeHeadId
        );

        const concession =
          item.feeHeadId === 1
            ? Number(selectedStudentProfile.concessionAmount || 0)
            : 0;

        const fee = Number(item.amount || 0);
        const payable = Math.max(fee - concession - paid, 0);

        rows.push({
          id: `${month.name}_${item.feeHeadId}`,
          monthName: month.name,
          monthShort: month.short,
          feeHeadId: item.feeHeadId,
          feeHeadName: getHeadName(item.feeHeadId),
          fee,
          concession,
          paid,
          payable,
          balance: payable,
          source: "FeePlan",
        });
      });

      if (
        selectedTransport?.routeId &&
        !selectedTransport.removedMonths?.includes(month.name)
      ) {
        const paid = getPaidForRow(
          selectedStudent.id,
          selectedSessionId,
          month.name,
          3
        );

        const fee = Number(selectedTransport.transportFee || 0);
        const payable = Math.max(fee - paid, 0);

        rows.push({
          id: `${month.name}_transport`,
          monthName: month.name,
          monthShort: month.short,
          feeHeadId: 3,
          feeHeadName: "Transport Fee",
          fee,
          concession: 0,
          paid,
          payable,
          balance: payable,
          source: "Transport",
        });
      }

      manualFees
        .filter(
          (item) =>
            item.schoolId === schoolId &&
            item.studentId === selectedStudent.id &&
            item.sessionId === Number(selectedSessionId) &&
            item.monthName === month.name
        )
        .forEach((item) => {
          const paid = getPaidForRow(
            selectedStudent.id,
            selectedSessionId,
            month.name,
            item.feeHeadId
          );

          const fee = Number(item.amount || 0);
          const payable = Math.max(fee - paid, 0);

          rows.push({
            id: `manual_${item.id}`,
            monthName: month.name,
            monthShort: month.short,
            feeHeadId: item.feeHeadId,
            feeHeadName: getHeadName(item.feeHeadId),
            fee,
            concession: 0,
            paid,
            payable,
            balance: payable,
            source: "Manual",
            manualFeeId: item.id,
          });
        });
    });

    return rows;
  };

  const allFeeRows = buildFeeRows();

  const visibleRows = allFeeRows.filter((row) => {
    const monthMatch =
      selectedMonths.length === 0 || selectedMonths.includes(row.monthName);

    const headMatch = selectedFeeHeadIds.includes(Number(row.feeHeadId));

    const payableMatch = payableOnly ? row.payable > 0 : true;

    return monthMatch && headMatch && payableMatch;
  });

  const totalFee = allFeeRows.reduce((sum, row) => sum + Number(row.fee), 0);

  const totalConcession = allFeeRows.reduce(
    (sum, row) => sum + Number(row.concession),
    0
  );

  const totalPaid = allFeeRows.reduce((sum, row) => sum + Number(row.paid), 0);

  const outstandingBalance = Math.max(
    totalFee - totalConcession - totalPaid,
    0
  );

  const getEditablePayable = (row) => {
    if (rowPaidAmounts[row.id] !== undefined) {
      return rowPaidAmounts[row.id];
    }

    return row.payable;
  };

  const totalPayableNow = visibleRows.reduce(
    (sum, row) => sum + Number(getEditablePayable(row) || 0),
    0
  );

  const calculatedPaidInput =
    totalPaidInput === "" ? totalPayableNow : Number(totalPaidInput);

  const getMonthStatus = (monthName) => {
    const rows = allFeeRows.filter((row) => row.monthName === monthName);

    if (rows.length === 0) return "upcoming";

    const fee = rows.reduce((sum, row) => sum + row.fee - row.concession, 0);
    const paid = rows.reduce((sum, row) => sum + row.paid, 0);

    if (fee > 0 && paid >= fee) return "paid";
    if (paid > 0 && paid < fee) return "partial";
    if (fee > 0 && paid === 0) return "due";

    return "upcoming";
  };

  const getProgressPercent = () => {
    const fee = allFeeRows.reduce(
      (sum, row) => sum + row.fee - row.concession,
      0
    );

    return fee > 0 ? Math.min(Math.round((totalPaid / fee) * 100), 100) : 0;
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setSearchValue(student.studentName);

    const current = sessions.find((item) => item.isCurrent) || sessions[0];

    setSelectedSessionId(current.id);
    setSelectedMonths([]);
    setTotalPaidInput("");
    setRowPaidAmounts({});
  };

  const handleMonthClick = (monthName) => {
    const monthIndex = monthOptions.findIndex((item) => item.name === monthName);

    if (monthIndex === -1) return;

    const alreadySelected = selectedMonths.includes(monthName);

    if (!alreadySelected) {
      const monthsToSelect = monthOptions
        .slice(0, monthIndex + 1)
        .map((item) => item.name);

      setSelectedMonths(monthsToSelect);
      return;
    }

    const monthsToKeep = monthOptions
      .slice(0, monthIndex)
      .map((item) => item.name);

    setSelectedMonths(monthsToKeep);
  };

  const handleToggleFeeHead = (feeHeadId) => {
    setSelectedFeeHeadIds((prev) =>
      prev.includes(feeHeadId)
        ? prev.filter((id) => id !== feeHeadId)
        : [...prev, feeHeadId]
    );
  };

  const handleToggleAllFeeHeads = (checked) => {
    if (checked) {
      setSelectedFeeHeadIds(feeHeads.map((item) => item.id));
    } else {
      setSelectedFeeHeadIds([]);
    }
  };
    const handleAddManualFee = () => {
    if (
      !addFeeForm.feeHeadId ||
      !addFeeForm.monthName ||
      !addFeeForm.amount
    ) {
      alert("Please select fee head, month and amount");
      return;
    }

    const newManualFee = {
      id: Date.now(),
      schoolId,
      studentId: selectedStudent.id,
      sessionId: Number(selectedSessionId),
      feeHeadId: Number(addFeeForm.feeHeadId),
      monthName: addFeeForm.monthName,
      amount: Number(addFeeForm.amount),
      paid: 0,
    };

    setManualFees([...manualFees, newManualFee]);

    setAddFeeForm({
      feeHeadId: "",
      monthName: "",
      amount: "",
    });

    alert("Fee added successfully");
  };

  const handleDeleteManualFee = (manualFeeId) => {
    const ok = window.confirm("Delete selected added fee?");
    if (!ok) return;

    setManualFees(manualFees.filter((item) => item.id !== manualFeeId));
  };

  const handleTransportRouteChange = (routeId) => {
    const selectedRouteObj = activeRoutes.find(
      (item) => item.id === Number(routeId)
    );

    if (!selectedRouteObj) return;

    const existing = transportAllocations.find(
      (item) =>
        item.schoolId === schoolId &&
        item.studentId === selectedStudent.id &&
        item.sessionId === Number(selectedSessionId)
    );

    if (existing) {
      setTransportAllocations(
        transportAllocations.map((item) =>
          item.id === existing.id
            ? {
                ...item,
                routeId: selectedRouteObj.id,
                transportFee: selectedRouteObj.monthlyFee,
              }
            : item
        )
      );
    } else {
      setTransportAllocations([
        ...transportAllocations,
        {
          id: Date.now(),
          schoolId,
          studentId: selectedStudent.id,
          sessionId: Number(selectedSessionId),
          routeId: selectedRouteObj.id,
          vehicleId: "",
          transportFee: selectedRouteObj.monthlyFee,
          removedMonths: [],
        },
      ]);
    }

    alert("Transport allocated successfully");
  };

  const handleRemoveFullTransport = () => {
    if (!selectedTransport) {
      alert("Transport is not allocated to this student");
      return;
    }

    const ok = window.confirm("Remove full transport from this student?");
    if (!ok) return;

    setTransportAllocations(
      transportAllocations.filter((item) => item.id !== selectedTransport.id)
    );

    alert("Full transport removed successfully");
  };

  const handleRemoveTransportMonth = (monthName) => {
    if (!selectedTransport) return;

    const paid = getPaidForRow(
      selectedStudent.id,
      selectedSessionId,
      monthName,
      3
    );

    if (paid > 0) {
      alert("This month's transport fee is already paid.");
      return;
    }

    setTransportAllocations(
      transportAllocations.map((item) =>
        item.id === selectedTransport.id
          ? {
              ...item,
              removedMonths: [
                ...new Set([...(item.removedMonths || []), monthName]),
              ],
            }
          : item
      )
    );
  };

  const handleSaveReceipt = () => {
    if (!selectedStudent) {
      alert("Please select student");
      return;
    }

    if (visibleRows.length === 0) {
      alert("No fee rows selected");
      return;
    }

    if (calculatedPaidInput < 0) {
      alert("Invalid paid amount");
      return;
    }

    if (calculatedPaidInput > totalPayableNow) {
      alert("Total paid cannot exceed payable amount");
      return;
    }

    if (calculatedPaidInput === 0 && !zeroReceiptConfirmed) {
      alert("Please confirm ZERO amount receipt.");
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    if (depositDate > today) {
      alert("Future date is not allowed");
      return;
    }

    const sessionReceipts = receipts.filter(
      (item) =>
        item.schoolId === schoolId &&
        item.sessionId === Number(selectedSessionId)
    );

    const receiptNo = String(sessionReceipts.length + 1).padStart(2, "0");

    let remainingPaid = calculatedPaidInput;

    const receiptRows = visibleRows.map((row) => {
      const editablePayable = Number(getEditablePayable(row) || 0);
      const rowPaid = Math.min(remainingPaid, editablePayable);

      remainingPaid -= rowPaid;

      return {
        monthName: row.monthName,
        feeHeadId: row.feeHeadId,
        fee: row.fee,
        concession: row.concession,
        paid: rowPaid,
      };
    });

    const newReceipt = {
      id: Date.now(),
      schoolId,
      studentId: selectedStudent.id,
      sessionId: Number(selectedSessionId),
      receiptNo,
      depositDate,
      paymentMode,
      paymentRef: paymentMode === "Cash" ? "" : paymentRef,
      remarks,
      paidAmount: calculatedPaidInput,
      months: [...new Set(visibleRows.map((row) => row.monthName))],
      rows: receiptRows,
      collectedByUserId: loggedInUserId,
      collectedByName: loggedInEmployeeName,
      status: "Active",
      isZeroReceipt: calculatedPaidInput === 0,
    };

    setReceipts([...receipts, newReceipt]);
    setLastReceipt(newReceipt);
    setShowReceiptPrint(true);

    alert("Receipt saved successfully");

    setSelectedMonths([]);
    setTotalPaidInput("");
    setPaymentMode("Cash");
    setPaymentRef("");
    setRemarks("");
    setZeroReceiptConfirmed(false);
    setRowPaidAmounts({});
  };

  const handleCloseCollection = () => {
    setSelectedMonths([]);
    setTotalPaidInput("");
    setPaymentMode("Cash");
    setPaymentRef("");
    setRemarks("");
    setZeroReceiptConfirmed(false);
    setRowPaidAmounts({});
  };

  const studentManualFees = manualFees.filter(
    (item) =>
      selectedStudent &&
      item.schoolId === schoolId &&
      item.studentId === selectedStudent.id &&
      item.sessionId === Number(selectedSessionId)
  );

  const receiptForPrint = lastReceipt
    ? {
        receiptNo: lastReceipt.receiptNo,
        receiptDate: lastReceipt.depositDate,
        printDateTime: new Date().toLocaleString("en-IN"),
        feePeriod: lastReceipt.months.join(", "),
        paymentMode: lastReceipt.paymentMode,
        paymentRef: lastReceipt.paymentRef,
        remarks: lastReceipt.remarks,
        totalFee: lastReceipt.rows.reduce((sum, row) => sum + row.fee, 0),
        totalConcession: lastReceipt.rows.reduce(
          (sum, row) => sum + row.concession,
          0
        ),
        totalPrepaid: lastReceipt.rows.reduce(
          (sum, row) => sum + (row.fee - row.concession - row.paid),
          0
        ),
        totalPaid: lastReceipt.paidAmount,
        totalBalance: 0,
        amountInWords: `${lastReceipt.paidAmount} Rupees Only`,
        collectedByName: lastReceipt.collectedByName,
        rows: lastReceipt.rows.map((row) => ({
          headName: getHeadName(row.feeHeadId),
          fee: row.fee,
          concession: row.concession,
          prepaid: 0,
          paid: row.paid,
          balance: Math.max(row.fee - row.concession - row.paid, 0),
        })),
      }
    : null;

  return (
    <div className="fc-page">
      <div className="fc-header">
        <AppButton type="back" onClick={() => (window.location.href = "/fee-manager")}>
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
              onChange={(e) => setSearchValue(e.target.value)}
            />

            <span className="fc-search-icon">🔎</span>

            {matchedStudents.length > 0 && (
              <div className="fc-search-suggestion-box">
                {matchedStudents.map((student) => (
                  <button
                    type="button"
                    className="fc-search-suggestion-item"
                    key={student.id}
                    onClick={() => handleStudentSelect(student)}
                  >
                    <strong>{student.studentName}</strong>
                    <span>
                      Father: {student.fatherName} | Mobile: {student.mobile} |
                      SR: {student.srNo} | Adm: {student.admissionNo}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <select
            className="fc-session-select"
            value={selectedSessionId}
            onChange={(e) => {
              setSelectedSessionId(Number(e.target.value));
              setSelectedMonths([]);
              setTotalPaidInput("");
              setRowPaidAmounts({});
            }}
          >
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.sessionName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedStudent ? (
        <div className="fc-card fc-empty-card">
          Search and select a student to load fee dashboard
        </div>
      ) : (
        <div className="fc-layout">
          <div className="fc-left-panel">
            <div className="fc-card fc-student-card">
              <div className="fc-student-photo">
                {selectedStudent.photo ? (
                  <img src={selectedStudent.photo} alt="Student" />
                ) : (
                  <span>👤</span>
                )}
              </div>

              <div className="fc-student-info">
                <h2>{selectedStudent.studentName}</h2>

                <div className="fc-student-grid">
                  <p>
                    <strong>Class:</strong>{" "}
                    {selectedStudentProfile
                      ? `${selectedStudentProfile.className} - ${selectedStudentProfile.sectionName}`
                      : "-"}
                  </p>

                  <p>
                    <strong>Father:</strong> {selectedStudent.fatherName}
                  </p>

                  <p>
                    <strong>Mobile:</strong> {selectedStudent.mobile}
                  </p>

                  <p>
                    <strong>Admission No:</strong> {selectedStudent.admissionNo}
                  </p>

                  <p>
                    <strong>SR No:</strong> {selectedStudent.srNo}
                  </p>

                  <p>
                    <strong>Fee Plan:</strong> {selectedFeePlan?.planName || "-"}
                  </p>

                  <p>
                    <strong>Concession:</strong>{" "}
                    {selectedStudentProfile?.concessionPlanName || "-"}
                  </p>

                  <p>
                    <strong>Route:</strong> {selectedRoute?.routeName || "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="fc-summary-grid">
              <div className="fc-summary-box">
                <span>Total Fee</span>
                <strong>₹{totalFee}</strong>
              </div>

              <div className="fc-summary-box">
                <span>Concession</span>
                <strong>₹{totalConcession}</strong>
              </div>

              <div className="fc-summary-box fc-paid-box">
                <span>Paid</span>
                <strong>₹{totalPaid}</strong>
              </div>

              <div className="fc-summary-box fc-balance-box">
                <span>Balance</span>
                <strong>₹{outstandingBalance}</strong>
              </div>
            </div>

            <div className="fc-card fc-head-card">
              <label className="fc-head-item">
                <input
                  type="checkbox"
                  checked={selectedFeeHeadIds.length === feeHeads.length}
                  onChange={(e) => handleToggleAllFeeHeads(e.target.checked)}
                />
                <span>All Fee Heads</span>
              </label>

              {feeHeads.map((head) => (
                <label className="fc-head-item" key={head.id}>
                  <input
                    type="checkbox"
                    checked={selectedFeeHeadIds.includes(head.id)}
                    onChange={() => handleToggleFeeHead(head.id)}
                  />
                  <span>{head.headName}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="fc-right-panel">
            <div className="fc-card fc-month-card">
              <div className="fc-card-head">
                <h2>Fee Status Summary</h2>
                <strong>{getProgressPercent()}% Paid</strong>
              </div>

              <div className="fc-progress-track">
                <div
                  className="fc-progress-fill"
                  style={{ width: `${getProgressPercent()}%` }}
                />
              </div>

              <div className="fc-month-grid">
                {monthOptions.map((month) => {
                  const status = getMonthStatus(month.name);
                  const selected = selectedMonths.includes(month.name);

                  return (
                    <button
                      type="button"
                      key={month.name}
                      className={`fc-month-box ${status} ${
                        selected ? "selected" : ""
                      }`}
                      onClick={() => handleMonthClick(month.name)}
                    >
                      {month.short}
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

              <AppButton type="secondary" onClick={() => alert("Concession popup pending")}>
                Concession
              </AppButton>

              <AppButton type="secondary" onClick={() => setShowTransportPopup(true)}>
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
                          No payable fee found
                        </td>
                      </tr>
                    ) : (
                      visibleRows.map((row) => (
                        <tr key={row.id}>
                          <td>{row.feeHeadName}</td>
                          <td>{row.monthShort}</td>
                          <td>₹{row.fee}</td>
                          <td>₹{row.concession}</td>
                          <td>₹{row.paid}</td>
                          <td>₹{row.balance}</td>
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

                                setRowPaidAmounts({
                                  ...rowPaidAmounts,
                                  [row.id]: value,
                                });

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
                        <td>
                          ₹
                          {visibleRows.reduce(
                            (sum, row) => sum + Number(row.fee),
                            0
                          )}
                        </td>
                        <td>
                          ₹
                          {visibleRows.reduce(
                            (sum, row) => sum + Number(row.concession),
                            0
                          )}
                        </td>
                        <td>
                          ₹
                          {visibleRows.reduce(
                            (sum, row) => sum + Number(row.paid),
                            0
                          )}
                        </td>
                        <td>₹{totalPayableNow}</td>
                        <td>₹{totalPayableNow}</td>
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
                      <option>Cash</option>
                      <option>Cheque</option>
                      <option>UPI</option>
                      <option>Bank Transfer</option>
                      <option>Card</option>
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
                    <input
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Enter remarks"
                    />
                  </div>

                  <div className="fc-form-group">
                    <label>Deposit Date 🔒</label>
                    <input
                      type="date"
                      value={depositDate}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setDepositDate(e.target.value)}
                    />
                  </div>

                  <div className="fc-form-group">
                    <label>Total Paid</label>
                    <input
                      type="number"
                      value={
                        totalPaidInput === "" ? totalPayableNow : totalPaidInput
                      }
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
                  <AppButton type="primary" onClick={handleSaveReceipt}>
                    Save
                  </AppButton>

                  <AppButton type="secondary" onClick={handleCloseCollection}>
                    Close
                  </AppButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProfilePopup && selectedStudent && (
        <StudentProfileView
          studentId={selectedStudent.id}
          onClose={() => setShowProfilePopup(false)}
        />
      )}

      {showLedgerPopup && selectedStudent && (
        <FeeLedgerView
          student={selectedStudent}
          studentProfile={selectedStudentProfile}
          session={currentSession}
          route={selectedRoute}
          receipts={getStudentSessionReceipts(selectedStudent.id, selectedSessionId)}
          feeHeads={feeHeads}
          monthOptions={monthOptions}
          feeRows={allFeeRows}
          totals={{
            totalFee,
            totalPaid,
            outstandingBalance,
          }}
          onClose={() => setShowLedgerPopup(false)}
          onPrint={() => window.print()}
        />
      )}

      {showReceiptPrint && receiptForPrint && (
        <div className="fc-print-overlay">
          <div className="fc-print-box">
            <div className="fc-print-actions">
              <AppButton type="primary" onClick={() => window.print()}>
                Print
              </AppButton>

              <AppButton
                type="secondary"
                onClick={() => setShowReceiptPrint(false)}
              >
                Close
              </AppButton>
            </div>

            <FeeReceiptPrint
              schoolInfo={{
                schoolName: "CHANDRA SHEKHAR AZAD INTER COLLEGE",
                address: "Rasouli, Barabanki",
                email: "",
                mobile: "",
                website: "",
                logo: "",
              }}
              receipt={receiptForPrint}
              student={selectedStudent}
              studentProfile={{
                className: selectedStudentProfile?.className,
                sectionName: selectedStudentProfile?.sectionName,
                routeName: selectedRoute?.routeName || "-",
                sessionName: currentSession?.sessionName,
              }}
              showOfficeCopy={true}
            />
          </div>
        </div>
      )}
            {showAddFeePopup && (
        <div className="fc-popup-overlay">
          <div className="fc-popup">
            <div className="fc-popup-head">
              <h2>Add Fee</h2>

              <button
                className="fc-popup-close"
                onClick={() => setShowAddFeePopup(false)}
              >
                ×
              </button>
            </div>

            <div className="fc-popup-form-grid">
              <div className="fc-form-group">
                <label>Fee Head</label>
                <select
                  value={addFeeForm.feeHeadId}
                  onChange={(e) =>
                    setAddFeeForm({
                      ...addFeeForm,
                      feeHeadId: e.target.value,
                    })
                  }
                >
                  <option value="">Select Fee Head</option>

                  {feeHeads
                    .filter((head) => head.type === "SuperAdmin")
                    .map((head) => (
                      <option key={head.id} value={head.id}>
                        {head.headName}
                      </option>
                    ))}
                </select>
              </div>

              <div className="fc-form-group">
                <label>Fee Period</label>
                <select
                  value={addFeeForm.monthName}
                  onChange={(e) =>
                    setAddFeeForm({
                      ...addFeeForm,
                      monthName: e.target.value,
                    })
                  }
                >
                  <option value="">Select Month</option>

                  {monthOptions.map((month) => (
                    <option key={month.name} value={month.name}>
                      {month.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="fc-form-group">
                <label>Amount</label>
                <input
                  type="number"
                  value={addFeeForm.amount}
                  onChange={(e) =>
                    setAddFeeForm({
                      ...addFeeForm,
                      amount: e.target.value,
                    })
                  }
                  placeholder="Enter amount"
                />
              </div>
            </div>

            <div className="fc-popup-action-row">
              <AppButton type="primary" onClick={handleAddManualFee}>
                Save
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
                  {studentManualFees.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="fc-empty-row">
                        No added fee found
                      </td>
                    </tr>
                  ) : (
                    studentManualFees.map((fee) => {
                      const paid = getPaidForRow(
                        selectedStudent.id,
                        selectedSessionId,
                        fee.monthName,
                        fee.feeHeadId
                      );

                      const balance = Math.max(
                        Number(fee.amount || 0) - paid,
                        0
                      );

                      return (
                        <tr key={fee.id}>
                          <td>
                            <button
                              className="fc-simple-icon-btn"
                              onClick={() => handleDeleteManualFee(fee.id)}
                            >
                              🗑
                            </button>
                          </td>

                          <td>
                            {fee.monthName} {getHeadName(fee.feeHeadId)}
                          </td>

                          <td>₹{fee.amount}</td>
                          <td>₹{paid}</td>
                          <td>₹{balance}</td>
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

      {showTransportPopup && (
        <div className="fc-popup-overlay">
          <div className="fc-popup fc-transport-popup">
            <div className="fc-popup-head">
              <h2>Transport Fee</h2>

              <button
                className="fc-popup-close"
                onClick={() => setShowTransportPopup(false)}
              >
                ×
              </button>
            </div>

            <div className="fc-popup-form-grid">
              <div className="fc-form-group">
                <label>Route</label>
                <select
                  value={selectedTransport?.routeId || ""}
                  onChange={(e) => handleTransportRouteChange(e.target.value)}
                >
                  <option value="">Select Route</option>

                  {activeRoutes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.routeName} - ₹{route.monthlyFee}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="fc-transport-actions">
              <AppButton
                type="primary"
                onClick={() => {
                  if (!selectedTransport?.routeId) {
                    alert("Please select route");
                  } else {
                    alert("Transport allocated successfully");
                  }
                }}
              >
                Allocate Transport
              </AppButton>

              <AppButton type="delete" onClick={handleRemoveFullTransport}>
                Remove Full Transport
              </AppButton>
            </div>

            <div className="fc-table-wrap fc-popup-table-wrap">
              <table className="fc-table">
                <thead>
                  <tr>
                    <th>Del</th>
                    <th>Month</th>
                    <th>Route</th>
                    <th>Fee</th>
                    <th>Paid</th>
                    <th>Balance</th>
                  </tr>
                </thead>

                <tbody>
                  {!selectedTransport?.routeId ? (
                    <tr>
                      <td colSpan="6" className="fc-empty-row">
                        Transport is not allocated to this student
                      </td>
                    </tr>
                  ) : (
                    monthOptions.map((month) => {
                      const removed =
                        selectedTransport.removedMonths?.includes(month.name);

                      const paid = getPaidForRow(
                        selectedStudent.id,
                        selectedSessionId,
                        month.name,
                        3
                      );

                      const fee = removed
                        ? 0
                        : Number(selectedTransport.transportFee || 0);

                      const balance = Math.max(fee - paid, 0);

                      return (
                        <tr key={month.name}>
                          <td>
                            {!removed && (
                              <button
                                className="fc-simple-icon-btn"
                                onClick={() =>
                                  handleRemoveTransportMonth(month.name)
                                }
                              >
                                🗑
                              </button>
                            )}
                          </td>

                          <td>{month.name}</td>
                          <td>{selectedRoute?.routeName || "-"}</td>
                          <td>₹{fee}</td>
                          <td>₹{paid}</td>

                          <td>
                            {removed ? (
                              <span className="fc-removed-badge">
                                Removed
                              </span>
                            ) : balance === 0 && paid > 0 ? (
                              <span className="fc-paid-badge">PAID</span>
                            ) : (
                              `₹${balance}`
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