import React, { useMemo, useState } from "react";
import "./feeCollection.css";
import AppButton from "../components/AppButton";

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

  const [showAddFeePopup, setShowAddFeePopup] = useState(false);
  const [showTransportPopup, setShowTransportPopup] = useState(false);
  const [showLedgerPopup, setShowLedgerPopup] = useState(false);

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
  const outstandingBalance = Math.max(totalFee - totalConcession - totalPaid, 0);

  const totalPayableNow = visibleRows.reduce(
    (sum, row) => sum + Number(row.payable),
    0
  );

  const [totalPaidInput, setTotalPaidInput] = useState("");

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

  const getProgressPercent = (sessionId) => {
    if (!selectedStudent) return 0;

    const prevSessionId = selectedSessionId;
    const targetProfile = selectedStudent.sessionProfiles.find(
      (item) => item.sessionId === sessionId
    );

    if (!targetProfile) return 0;

    const sessionRows = allFeeRows.filter(
      () => Number(prevSessionId) === Number(sessionId)
    );

    if (Number(sessionId) !== Number(selectedSessionId)) {
      return 0;
    }

    const fee = sessionRows.reduce(
      (sum, row) => sum + row.fee - row.concession,
      0
    );
    const paid = sessionRows.reduce((sum, row) => sum + row.paid, 0);

    return fee > 0 ? Math.min(Math.round((paid / fee) * 100), 100) : 0;
  };
    const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setSearchValue(student.studentName);

    const current = sessions.find((item) => item.isCurrent) || sessions[0];

    setSelectedSessionId(current.id);
    setSelectedMonths([]);
    setTotalPaidInput("");
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

    setManualFees(
      manualFees.filter((item) => item.id !== manualFeeId)
    );
  };

  const handleAllocateTransport = () => {
    if (!selectedStudent || !addFeeForm.routeId) return;
  };

  const handleTransportRouteChange = (routeId) => {
    const selectedRoute = activeRoutes.find(
      (item) => item.id === Number(routeId)
    );

    if (!selectedRoute) return;

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
                routeId: selectedRoute.id,
                transportFee: selectedRoute.monthlyFee,
              }
            : item
        )
      );
    } else {
      const newTransport = {
        id: Date.now(),
        schoolId,
        studentId: selectedStudent.id,
        sessionId: Number(selectedSessionId),
        routeId: selectedRoute.id,
        vehicleId: "",
        transportFee: selectedRoute.monthlyFee,
        removedMonths: [],
      };

      setTransportAllocations([
        ...transportAllocations,
        newTransport,
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
      transportAllocations.filter(
        (item) => item.id !== selectedTransport.id
      )
    );

    alert("Full transport removed successfully");
  };

  const handleRemoveTransportMonth = (monthName) => {
    if (!selectedTransport) return;

    setTransportAllocations(
      transportAllocations.map((item) =>
        item.id === selectedTransport.id
          ? {
              ...item,
              removedMonths: [
                ...new Set([
                  ...(item.removedMonths || []),
                  monthName,
                ]),
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

    const receiptNo = String(sessionReceipts.length + 1).padStart(
      2,
      "0"
    );

    let remainingPaid = calculatedPaidInput;

    const receiptRows = visibleRows.map((row) => {
      const rowPaid = Math.min(remainingPaid, row.payable);
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

    alert("Receipt saved successfully");

    setSelectedMonths([]);
    setTotalPaidInput("");
    setPaymentMode("Cash");
    setPaymentRef("");
    setRemarks("");
    setZeroReceiptConfirmed(false);

    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleCloseCollection = () => {
    setSelectedMonths([]);
    setTotalPaidInput("");
    setPaymentMode("Cash");
    setPaymentRef("");
    setRemarks("");
    setZeroReceiptConfirmed(false);
  };

  const studentManualFees = manualFees.filter(
    (item) =>
      selectedStudent &&
      item.schoolId === schoolId &&
      item.studentId === selectedStudent.id &&
      item.sessionId === Number(selectedSessionId)
  );

  return (
    <div className="fee-collection-page">
      <div className="common-page-header fee-collection-header">
        <AppButton
          type="back"
          onClick={() =>
            (window.location.href = "/fee-manager")
          }
        >
          ←
        </AppButton>

        <div className="fee-header-title">
          <h1>Fee Collection</h1>
          <p>Search student and collect fee</p>
        </div>

        <div className="fee-header-tools">
          <div className="fee-search-area">
            <input
              type="text"
              placeholder="Search by student, father, mobile, SR no, admission no..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />

            <span className="search-icon">🔎</span>

            {matchedStudents.length > 0 && (
              <div className="fee-search-suggestion-box">
                {matchedStudents.map((student) => (
                  <div
                    className="fee-search-suggestion-item"
                    key={student.id}
                    onClick={() => handleStudentSelect(student)}
                  >
                    <strong>{student.studentName}</strong>
                    <span>
                      Father: {student.fatherName} | Mobile:{" "}
                      {student.mobile} | SR: {student.srNo} | Adm:{" "}
                      {student.admissionNo}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <select
            className="fee-session-select"
            value={selectedSessionId}
            onChange={(e) => {
              setSelectedSessionId(Number(e.target.value));
              setSelectedMonths([]);
              setTotalPaidInput("");
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
        <div className="common-card empty-fee-dashboard">
          Search and select a student to load fee dashboard
        </div>
      ) : (
        <>
          <div className="fee-dashboard-grid">
            <div className="fee-left-column">
              <div className="common-card student-info-card">
                <div className="student-photo-wrap">
                  <div className="student-photo-box">
                    {selectedStudent.photo ? (
                      <img
                        src={selectedStudent.photo}
                        alt="Student"
                      />
                    ) : (
                      <span>👤</span>
                    )}
                  </div>
                </div>

                <div className="student-info-details">
                  <h2>Student Information</h2>

                  <div className="student-info-grid">
                    <p>
                      <strong>Student Name:</strong>{" "}
                      {selectedStudent.studentName}
                    </p>

                    <p>
                      <strong>Class & Section:</strong>{" "}
                      {selectedStudentProfile
                        ? `${selectedStudentProfile.className} - ${selectedStudentProfile.sectionName}`
                        : "-"}
                    </p>

                    <p>
                      <strong>Fee Plan:</strong>{" "}
                      {selectedFeePlan?.planName || "-"}
                    </p>

                    <p>
                      <strong>Father Name:</strong>{" "}
                      {selectedStudent.fatherName}
                    </p>

                    <p>
                      <strong>Mobile Number:</strong>{" "}
                      {selectedStudent.mobile}
                    </p>

                    <p>
                      <strong>SR No:</strong> {selectedStudent.srNo}
                    </p>

                    <p>
                      <strong>Admission No:</strong>{" "}
                      {selectedStudent.admissionNo}
                    </p>

                    <p>
                      <strong>Concession Plan:</strong>{" "}
                      {selectedStudentProfile?.concessionPlanName || "-"}
                    </p>

                    <p>
                      <strong>Transport Route 🚌:</strong>{" "}
                      {selectedRoute?.routeName || "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="fee-overview-grid">
                <div className="fee-overview-card">
                  <span>Total Fee</span>
                  <strong>₹{totalFee}</strong>
                </div>

                <div className="fee-overview-card">
                  <span>Total Concession</span>
                  <strong>₹{totalConcession}</strong>
                </div>

                <div className="fee-overview-card paid">
                  <span>Total Paid</span>
                  <strong>₹{totalPaid}</strong>
                </div>

                <div className="fee-overview-card balance">
                  <span>Outstanding Balance</span>
                  <strong>₹{outstandingBalance}</strong>
                </div>
              </div>

              <div className="common-card quick-action-card">
                <div className="quick-action-row">
                  <AppButton type="secondary">
                    Student Profile
                  </AppButton>

                  <AppButton type="secondary">
                    Concession
                  </AppButton>

                  <AppButton
                    type="secondary"
                    onClick={() => setShowLedgerPopup(true)}
                  >
                    Fee Ledger
                  </AppButton>

                  <AppButton
                    type="secondary"
                    onClick={() => setShowAddFeePopup(true)}
                  >
                    + Add Fee
                  </AppButton>

                  <AppButton
                    type="secondary"
                    onClick={() => setShowTransportPopup(true)}
                  >
                    Transport Fee
                  </AppButton>
                </div>
              </div>
            </div>

            <div className="fee-right-column">
              <div className="common-card fee-status-card">
                <div className="list-header">
                  <h2>Fee Status Summary</h2>
                </div>

                <div className="progress-list">
                  <div className="progress-item active-session">
                    <div className="progress-top">
                      <span>{currentSession?.sessionName}</span>
                      <strong>{getProgressPercent(selectedSessionId)}% Paid</strong>
                    </div>

                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${getProgressPercent(selectedSessionId)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="month-status-grid">
                  {monthOptions.map((month) => {
                    const status = getMonthStatus(month.name);
                    const selected = selectedMonths.includes(month.name);

                    return (
                      <button
                        key={month.name}
                        className={`month-box ${status} ${
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

              <div className="fee-main-grid">
                <div className="common-card fee-head-card">
                  <div className="fee-head-top">
                    <label className="checkbox-line">
                      <input
                        type="checkbox"
                        checked={
                          selectedFeeHeadIds.length === feeHeads.length
                        }
                        onChange={(e) =>
                          handleToggleAllFeeHeads(e.target.checked)
                        }
                      />
                      <span>All Fee Heads</span>
                    </label>

                    <label className="checkbox-line">
                      <input
                        type="checkbox"
                        checked={payableOnly}
                        onChange={(e) =>
                          setPayableOnly(e.target.checked)
                        }
                      />
                      <span>Payable Only</span>
                    </label>
                  </div>

                  <div className="fee-head-list">
                    {feeHeads.map((head) => (
                      <label className="fee-head-item" key={head.id}>
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

                <div className="common-card calculation-card">
                  <div className="list-header">
                    <h2>Fee Calculation</h2>
                  </div>

                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Fee</th>
                          <th>Concession</th>
                          <th>Paid</th>
                          <th>Payable</th>
                          <th>Balance</th>
                        </tr>
                      </thead>

                      <tbody>
                        {visibleRows.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="empty-row">
                              No payable fee found
                            </td>
                          </tr>
                        ) : (
                          visibleRows.map((row) => (
                            <tr key={row.id}>
                              <td>
                                <strong>{row.monthShort}</strong>{" "}
                                {row.feeHeadName}
                              </td>

                              <td>₹{row.concession}</td>

                              <td>
                                {row.paid > 0 ? (
                                  <span className="paid-text">
                                    ₹{row.paid}
                                  </span>
                                ) : (
                                  "₹0"
                                )}
                              </td>

                              <td>
                                {row.payable === 0 ? (
                                  <span className="paid-badge">PAID</span>
                                ) : (
                                  `₹${row.payable}`
                                )}
                              </td>

                              <td>₹{row.balance}</td>
                            </tr>
                          ))
                        )}

                        {visibleRows.length > 0 && (
                          <tr className="total-row">
                            <td>Total</td>
                            <td>
                              ₹
                              {visibleRows.reduce(
                                (sum, row) => sum + row.concession,
                                0
                              )}
                            </td>
                            <td>
                              ₹
                              {visibleRows.reduce(
                                (sum, row) => sum + row.paid,
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

                  <div className="payment-section">
                    <h2>Payment Details</h2>

                    <div className="payment-grid">
                      <div className="form-group">
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
                        <div className="form-group">
                          <label>Payment Ref #</label>
                          <input
                            value={paymentRef}
                            onChange={(e) =>
                              setPaymentRef(e.target.value)
                            }
                            placeholder="Transaction / cheque / reference no"
                          />
                        </div>
                      )}

                      <div className="form-group">
                        <label>Remarks</label>
                        <input
                          value={remarks}
                          onChange={(e) =>
                            setRemarks(e.target.value)
                          }
                          placeholder="Enter remarks"
                        />
                      </div>

                      <div className="form-group">
                        <label>Deposit Date 🔒</label>
                        <input
                          type="date"
                          value={depositDate}
                          max={new Date().toISOString().split("T")[0]}
                          onChange={(e) =>
                            setDepositDate(e.target.value)
                          }
                        />
                      </div>

                      <div className="form-group">
                        <label>Total Paid</label>
                        <input
                          type="number"
                          value={
                            totalPaidInput === ""
                              ? totalPayableNow
                              : totalPaidInput
                          }
                          onChange={(e) =>
                            setTotalPaidInput(e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <label className="zero-receipt-row">
                      <input
                        type="checkbox"
                        checked={zeroReceiptConfirmed}
                        onChange={(e) =>
                          setZeroReceiptConfirmed(e.target.checked)
                        }
                      />
                      <span>
                        I confirm to save ZERO amount receipt
                      </span>
                    </label>

                    <div className="form-actions">
                      <AppButton
                        type="primary"
                        onClick={handleSaveReceipt}
                      >
                        Save
                      </AppButton>

                      <AppButton
                        type="secondary"
                        onClick={handleCloseCollection}
                      >
                        Close
                      </AppButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {showAddFeePopup && (
            <div className="popup-overlay">
              <div className="fee-popup">
                <div className="popup-head">
                  <h2>Add Fee</h2>

                  <button
                    className="popup-close-btn"
                    onClick={() => setShowAddFeePopup(false)}
                  >
                    ×
                  </button>
                </div>

                <div className="popup-form-grid">
                  <div className="form-group">
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

                  <div className="form-group">
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

                  <div className="form-group">
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

                <div className="form-actions">
                  <AppButton type="primary" onClick={handleAddManualFee}>
                    Save
                  </AppButton>
                </div>

                <div className="table-wrap popup-table-wrap">
                  <table>
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
                          <td colSpan="5" className="empty-row">
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
                                  className="simple-icon-btn"
                                  onClick={() =>
                                    handleDeleteManualFee(fee.id)
                                  }
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

                <div className="form-actions">
                  <AppButton
                    type="secondary"
                    onClick={() => setShowAddFeePopup(false)}
                  >
                    Close
                  </AppButton>
                </div>
              </div>
            </div>
          )}

          {showTransportPopup && (
            <div className="popup-overlay">
              <div className="fee-popup">
                <div className="popup-head">
                  <h2>Transport Fee</h2>

                  <button
                    className="popup-close-btn"
                    onClick={() => setShowTransportPopup(false)}
                  >
                    ×
                  </button>
                </div>

                <div className="popup-form-grid">
                  <div className="form-group">
                    <label>Route</label>
                    <select
                      value={selectedTransport?.routeId || ""}
                      onChange={(e) =>
                        handleTransportRouteChange(e.target.value)
                      }
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

                <div className="transport-popup-actions">
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

                  <AppButton
                    type="delete"
                    onClick={handleRemoveFullTransport}
                  >
                    Remove Full Transport
                  </AppButton>
                </div>

                <div className="table-wrap popup-table-wrap">
                  <table>
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
                          <td colSpan="6" className="empty-row">
                            Transport is not allocated to this student
                          </td>
                        </tr>
                      ) : (
                        monthOptions.map((month) => {
                          const removed =
                            selectedTransport.removedMonths?.includes(
                              month.name
                            );

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
                                    className="simple-icon-btn"
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
                                  <span className="removed-badge">
                                    Removed
                                  </span>
                                ) : balance === 0 && paid > 0 ? (
                                  <span className="paid-badge">PAID</span>
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

                <div className="form-actions">
                  <AppButton
                    type="secondary"
                    onClick={() => setShowTransportPopup(false)}
                  >
                    Close
                  </AppButton>
                </div>
              </div>
            </div>
          )}

          {showLedgerPopup && (
            <div className="popup-overlay">
              <div className="fee-ledger-popup">
                <div className="popup-head">
                  <h2>
                    Fee Ledger - {selectedStudent.studentName}
                  </h2>

                  <button
                    className="popup-close-btn"
                    onClick={() => setShowLedgerPopup(false)}
                  >
                    ×
                  </button>
                </div>

                <div className="ledger-student-info">
                  <p>
                    <strong>Session:</strong>{" "}
                    {currentSession?.sessionName}
                  </p>

                  <p>
                    <strong>Class:</strong>{" "}
                    {selectedStudentProfile
                      ? `${selectedStudentProfile.className} - ${selectedStudentProfile.sectionName}`
                      : "-"}
                  </p>

                  <p>
                    <strong>Admission No:</strong>{" "}
                    {selectedStudent.admissionNo}
                  </p>

                  <p>
                    <strong>SR No:</strong>{" "}
                    {selectedStudent.srNo}
                  </p>

                  <p>
                    <strong>Father Name:</strong>{" "}
                    {selectedStudent.fatherName}
                  </p>

                  <p>
                    <strong>Route:</strong>{" "}
                    {selectedRoute?.routeName || "-"}
                  </p>
                </div>

                <h3>Fee Receipts</h3>

                <div className="table-wrap popup-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>S.No</th>
                        <th>Receipt No</th>
                        <th>Class</th>
                        <th>Installments</th>
                        <th>Paid On</th>
                        <th>Paid Amount</th>
                        <th>Remarks</th>
                        <th>Deposit By</th>
                        <th>Deposit On</th>
                      </tr>
                    </thead>

                    <tbody>
                      {getStudentSessionReceipts(
                        selectedStudent.id,
                        selectedSessionId
                      ).length === 0 ? (
                        <tr>
                          <td colSpan="9" className="empty-row">
                            No receipt found
                          </td>
                        </tr>
                      ) : (
                        getStudentSessionReceipts(
                          selectedStudent.id,
                          selectedSessionId
                        ).map((receipt, index) => (
                          <tr key={receipt.id}>
                            <td>{index + 1}</td>

                            <td>{receipt.receiptNo}</td>

                            <td>
                              {selectedStudentProfile
                                ? `${selectedStudentProfile.className} ${selectedStudentProfile.sectionName}`
                                : "-"}
                            </td>

                            <td>
                              {receipt.months.join(", ")}
                            </td>

                            <td>{receipt.depositDate}</td>

                            <td>₹{receipt.paidAmount}</td>

                            <td>{receipt.remarks || "-"}</td>

                            <td>{receipt.collectedByName}</td>

                            <td>{receipt.depositDate}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <h3>Fee Schedule</h3>

                <div className="ledger-schedule-wrap">
                  <table className="ledger-schedule-table">
                    <thead>
                      <tr>
                        <th rowSpan="2">Fee Head</th>

                        {monthOptions.map((month) => (
                          <th key={month.name} colSpan="3">
                            {month.short}
                          </th>
                        ))}

                        <th colSpan="3">Total</th>
                      </tr>

                      <tr>
                        {monthOptions.map((month) => (
                          <React.Fragment key={month.name}>
                            <th>Fee</th>
                            <th>Paid</th>
                            <th>Bal</th>
                          </React.Fragment>
                        ))}

                        <th>Fee</th>
                        <th>Paid</th>
                        <th>Bal</th>
                      </tr>
                    </thead>

                    <tbody>
                      {feeHeads
                        .filter((head) =>
                          allFeeRows.some(
                            (row) => row.feeHeadId === head.id
                          )
                        )
                        .map((head) => {
                          let headFeeTotal = 0;
                          let headPaidTotal = 0;
                          let headBalanceTotal = 0;

                          return (
                            <tr key={head.id}>
                              <td>{head.headName}</td>

                              {monthOptions.map((month) => {
                                const row = allFeeRows.find(
                                  (item) =>
                                    item.monthName === month.name &&
                                    item.feeHeadId === head.id
                                );

                                const fee = row?.fee || 0;
                                const paid = row?.paid || 0;
                                const balance =
                                  Math.max(
                                    fee -
                                      (row?.concession || 0) -
                                      paid,
                                    0
                                  ) || 0;

                                headFeeTotal += fee;
                                headPaidTotal += paid;
                                headBalanceTotal += balance;

                                return (
                                  <React.Fragment key={month.name}>
                                    <td>{fee}</td>
                                    <td className={paid > 0 ? "green-text" : ""}>
                                      {paid}
                                    </td>
                                    <td className={balance > 0 ? "red-text" : ""}>
                                      {balance}
                                    </td>
                                  </React.Fragment>
                                );
                              })}

                              <td>{headFeeTotal}</td>
                              <td className="green-text">
                                {headPaidTotal}
                              </td>
                              <td className={headBalanceTotal > 0 ? "red-text" : ""}>
                                {headBalanceTotal}
                              </td>
                            </tr>
                          );
                        })}

                      <tr className="total-row">
                        <td>Total</td>

                        {monthOptions.map((month) => {
                          const monthRows = allFeeRows.filter(
                            (row) => row.monthName === month.name
                          );

                          const fee = monthRows.reduce(
                            (sum, row) => sum + row.fee,
                            0
                          );

                          const paid = monthRows.reduce(
                            (sum, row) => sum + row.paid,
                            0
                          );

                          const balance = monthRows.reduce(
                            (sum, row) => sum + row.balance,
                            0
                          );

                          return (
                            <React.Fragment key={month.name}>
                              <td>{fee}</td>
                              <td>{paid}</td>
                              <td>{balance}</td>
                            </React.Fragment>
                          );
                        })}

                        <td>{totalFee}</td>
                        <td>{totalPaid}</td>
                        <td>{outstandingBalance}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="form-actions">
                  <AppButton
                    type="secondary"
                    onClick={() => setShowLedgerPopup(false)}
                  >
                    Close
                  </AppButton>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default FeeCollection;