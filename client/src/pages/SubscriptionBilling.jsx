import React, { useMemo, useState } from "react";
import "./subscriptionBilling.css";
import AppButton from "../components/AppButton";

function SubscriptionBilling() {
  const schoolInfo = {
    schoolName: "ABC Public School",
    campusId: "CSAIC001",
    session: "2026-27",
  };

  const currentUser = {
    role: "School Admin",
    position: "School Admin",
  };

  const allowedBillingRoles = [
    "School Admin",
    "Manager",
    "Principal",
    "Accountant",
    "Managing Director",
    "Director",
    "President",
  ];

  const canAccessBilling =
    allowedBillingRoles.includes(currentUser.role) ||
    allowedBillingRoles.includes(currentUser.position);

  const canDownloadBills =
  allowedBillingRoles.includes(
    currentUser.role
  ) ||
  allowedBillingRoles.includes(
    currentUser.position
  );


  const studentCounts = {
    activeStudents: 350,
    inactiveStudents: 51,
  };

  const billingConfig = {
    ratePerStudent: 4,
    gstPercent: 18,
    includeInactiveStudentsInBilling: true,
    discounts: {
      Monthly: 0,
      Quarterly: 5,
      "Half-Yearly": 10,
      Annual: 15,
    },
  };

  const paymentConfig = {
    merchantName: "Classora ERP",
    upiId: "classora@upi",
    qrLabel: "Dynamic QR",
  };

  const subscriptionInfo = {
    currentDueDate: "2026-06-25",
    isExpired: false,
  };

  const plans = [
    { name: "Monthly", months: 1 },
    { name: "Quarterly", months: 3 },
    { name: "Half-Yearly", months: 6 },
    { name: "Annual", months: 12 },
  ];

  const paidBills = [
    {
      id: 1,
      billNo: "BILL-CSAIC001/2026-27/001",
      billDate: "25 Apr 2026",
      plan: "Monthly",
      period: "25 Apr 2026 - 24 May 2026",
      billingStudents: 401,
      baseAmount: 1604,
      discountPercent: 0,
      gstPercent: 18,
      amount: 1892.72,
      paidDate: "25 Apr 2026",
      paymentMode: "UPI / QR",
      transactionNo: "TXN123456",
      nextDueDate: "24 May 2026",
    },
    {
      id: 2,
      billNo: "BILL-CSAIC001/2026-27/002",
      billDate: "25 May 2026",
      plan: "Monthly",
      period: "25 May 2026 - 24 Jun 2026",
      billingStudents: 401,
      baseAmount: 1604,
      discountPercent: 0,
      gstPercent: 18,
      amount: 1892.72,
      paidDate: "25 May 2026",
      paymentMode: "UPI / QR",
      transactionNo: "TXN789456",
      nextDueDate: "24 Jun 2026",
    },
  ];

  const activeStudents = studentCounts.activeStudents;
  const inactiveStudents = studentCounts.inactiveStudents;

  const billingStudents = billingConfig.includeInactiveStudentsInBilling
    ? activeStudents + inactiveStudents
    : activeStudents;

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPayPopup, setShowPayPopup] = useState(false);
  const [showHistoryPopup, setShowHistoryPopup] = useState(false);
  const [selectedBillIds, setSelectedBillIds] = useState([]);
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [verificationPending, setVerificationPending] = useState(false);
  const [showSubmittedPopup, setShowSubmittedPopup] = useState(false);
  const [showRejectedPopup, setShowRejectedPopup] = useState(false);
  const [submittedPlan, setSubmittedPlan] = useState(null);
  const rejectedPayment = {
    reason: "Payment details could not be verified.",
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const addMonthsMinusOneDay = (startDateString, months) => {
    const startDate = new Date(startDateString);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);
    endDate.setDate(endDate.getDate() - 1);
    return endDate;
  };

  const getPlanPeriod = (plan) => {
    const startDate = subscriptionInfo.isExpired
      ? new Date()
      : new Date(subscriptionInfo.currentDueDate);

    const endDate = addMonthsMinusOneDay(startDate.toISOString(), plan.months);

    return {
      startDate,
      endDate,
      label: `${formatDate(startDate)} - ${formatDate(endDate)}`,
      nextDueDate: formatDate(endDate),
    };
  };

  const calculatePlan = (plan) => {
    const discountPercent = billingConfig.discounts[plan.name] || 0;

    const baseAmount =
      billingStudents * billingConfig.ratePerStudent * plan.months;

    const discountAmount = (baseAmount * discountPercent) / 100;

    const amountAfterDiscount = baseAmount - discountAmount;

    const gstAmount =
      (amountAfterDiscount * billingConfig.gstPercent) / 100;

    const finalPayable = amountAfterDiscount + gstAmount;

    return {
      baseAmount,
      discountPercent,
      gstPercent: billingConfig.gstPercent,
      finalPayable,
    };
  };

  const selectedPlanAmount = useMemo(() => {
    if (!selectedPlan) return null;
    return calculatePlan(selectedPlan);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlan]);

  const closePayPopup = () => {
    setShowPayPopup(false);
    setSelectedPlan(null);
    setPaymentScreenshot(null);
  };

  const handlePayNow = (plan) => {
    if (verificationPending) {
      alert("Payment verification is already pending.");
      return;
    }

    setSelectedPlan(plan);
    setPaymentScreenshot(null);
    setShowPayPopup(true);
  };

  const handleSubmitScreenshot = () => {
    if (!paymentScreenshot) {
      alert("Please upload payment screenshot.");
      return;
    }
    setSubmittedPlan(selectedPlan);
    setVerificationPending(true);
    closePayPopup();
    setShowSubmittedPopup(true);
  };

  const handlePayAgain = () => {
    setShowRejectedPopup(false);
    setVerificationPending(false);
    setPaymentScreenshot(null);
  };

  const handleDownloadSelectedBills = () => {
    if (selectedBillIds.length === 0) {
      alert("Please select at least one bill.");
      return;
    }

    const selectedBills = paidBills.filter((bill) =>
      selectedBillIds.includes(bill.id)
    );

    selectedBills.forEach((bill) => {
      const billText = `
CLASSORA ERP

Subscription Bill

Bill No        : ${bill.billNo}
Bill Date      : ${bill.billDate}

School Name    : ${schoolInfo.schoolName}
Campus ID      : ${schoolInfo.campusId}

Plan Name      : ${bill.plan}
Period         : ${bill.period}

Billing Students : ${bill.billingStudents}
Base Amount      : ₹${bill.baseAmount.toFixed(2)}
Discount          : ${bill.discountPercent}%
GST               : ${bill.gstPercent}%
Final Paid Amount : ₹${bill.amount.toFixed(2)}

Transaction No : ${bill.transactionNo}
Payment Mode   : ${bill.paymentMode}
Payment Date   : ${bill.paidDate}

Next Due Date  : ${bill.nextDueDate}

------------------------------------------------

This is a computer-generated subscription bill and does not require a physical signature.

The subscription becomes active only after successful payment verification by Classora ERP.

All payments once verified and approved are non-refundable unless otherwise approved by Classora ERP management.

Any dispute arising out of subscription services shall be governed by the applicable laws in force at the time of resolution.

------------------------------------------------

CLASSORA ERP
`;

      const blob = new Blob([billText], {
        type: "text/plain;charset=utf-8",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${bill.billNo.replaceAll("/", "-")}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  const isAllBillsSelected =
    paidBills.length > 0 && selectedBillIds.length === paidBills.length;

  if (!canAccessBilling) {
    return (
      <div className="subscription-page">
        <div className="access-message-card">
          <h2>ERP Access Unavailable</h2>
          <p>ERP access is currently unavailable.</p>
          <p>Please contact your school administration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => {
            window.location.href = "/admin-panel";
          }}
        >
          ←
        </AppButton>

        <div>
          <h1>Subscription & Billing</h1>
          <p>Choose billing plan and manage payments</p>
        </div>
      </div>

      <div className="subscription-top-actions">
        <AppButton type="primary" onClick={() => setShowHistoryPopup(true)}>
          Billing History
        </AppButton>
      </div>

<div className="subscription-summary-card">
  <h3>Current Due Date</h3>
  <p>
    {formatDate(
      new Date(subscriptionInfo.currentDueDate)
    )}
  </p>
</div>

     {verificationPending && (
  <div className="pending-box">
    <strong>Verification Pending</strong>

    <br />
    Plan:
{submittedPlan?.name || "-"}

    <br />
    Submitted:
    {formatDate(new Date())}

    <br />
    You cannot upload another screenshot
    until this payment is verified or rejected.
  </div>
)}

      <div className="plan-card-grid">
        {plans.map((plan) => {
          const amount = calculatePlan(plan);
          const period = getPlanPeriod(plan);

          return (
            <div className="plan-card" key={plan.name}>
              <h2>{plan.name}</h2>

              <p className="plan-subtitle">
                {plan.months} {plan.months === 1 ? "month" : "months"} billing
              </p>

              <h1>₹{amount.finalPayable.toFixed(2)}</h1>

              <p className="gst-text">Including GST</p>

              <div className="discount-badge">
                {amount.discountPercent === 0
                  ? "No Discount"
                  : `${amount.discountPercent}% Discount`}
              </div>

              <div className="plan-info">
                <p>
                  Billing Students: <strong>{billingStudents}</strong>
                </p>

                <p>
                  Base Amount:{" "}
                  <strong>₹{amount.baseAmount.toFixed(2)}</strong>
                </p>

                <p>
                  Discount: <strong>{amount.discountPercent}%</strong>
                </p>

                <p>
                  GST: <strong>{amount.gstPercent}%</strong>
                </p>

                <p>
                  Final Payable:{" "}
                  <strong>₹{amount.finalPayable.toFixed(2)}</strong>
                </p>

                <p>
                  Period: <strong>{period.label}</strong>
                </p>
              </div>

              <AppButton
                type="primary"
                onClick={() => handlePayNow(plan)}
                disabled={verificationPending}
              >
                {verificationPending ? "Verification Pending" : "Pay Now"}
              </AppButton>
            </div>
          );
        })}
      </div>

      {showPayPopup && selectedPlan && selectedPlanAmount && (
        <div className="popup-overlay">
          <div className="view-popup">
            <div className="popup-head">
              <h2>{selectedPlan.name} Payment</h2>

              <button className="popup-close-btn" onClick={closePayPopup}>
                ×
              </button>
            </div>

            <div className="qr-box">
              <div className="fake-qr">{paymentConfig.qrLabel}</div>

              <p>Scan QR and complete payment.</p>
              
              <p className="payment-note">
                Receiver: {paymentConfig.merchantName}
              </p>

              <p className="payment-note">UPI ID: {paymentConfig.upiId}</p>

              <p className="payable-label">Payable Amount</p>

              <h3>₹{selectedPlanAmount.finalPayable.toFixed(2)}</h3>
            </div>

            <div className="form-group">
              <label>Upload Payment Screenshot</label>

              <input
  type="file"
  accept=".jpg,.jpeg,.png"
  capture="environment"
  onChange={(e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert(
        "Only JPG, JPEG and PNG files are allowed."
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(
        "Maximum file size is 5 MB."
      );
      return;
    }

    setPaymentScreenshot(file);
  }}
/>
            </div>

            <div className="form-actions">
              <AppButton type="primary" onClick={handleSubmitScreenshot}>
                Submit Screenshot
              </AppButton>
            </div>
          </div>
        </div>
      )}

      {showSubmittedPopup && (
        <div className="popup-overlay">
          <div className="view-popup">
            <div className="popup-head">
              <h2>Payment Submitted</h2>

              <button
                className="popup-close-btn"
                onClick={() => setShowSubmittedPopup(false)}
              >
                ×
              </button>
            </div>

            <div className="popup-message">
              <p>Your payment screenshot has been submitted successfully.</p>
              <p>Your payment is waiting for Super Admin verification.</p>
              <p>
                You cannot upload another screenshot until this payment is
                verified or rejected.
              </p>
            </div>

            <div className="form-actions">
              <AppButton
                type="primary"
                onClick={() => setShowSubmittedPopup(false)}
              >
                OK
              </AppButton>
            </div>
          </div>
        </div>
      )}

      {showRejectedPopup && (
        <div className="popup-overlay">
          <div className="view-popup">
            <div className="popup-head">
              <h2>Payment Rejected</h2>

              <button
                className="popup-close-btn"
                onClick={() => setShowRejectedPopup(false)}
              >
                ×
              </button>
            </div>

            <div className="popup-message">
              <p>Your payment verification has been rejected.</p>

              <p>
                <strong>Reason:</strong> {rejectedPayment.reason}
              </p>

              <p>
                Please make the payment again and upload a new payment
                screenshot.
              </p>

              <div className="support-box">
                <p>Need Help?</p>
                <p>Contact Classora Support Team</p>
                <strong>📞 8840248644</strong>
              </div>
            </div>

            <div className="form-actions">
              <AppButton type="primary" onClick={handlePayAgain}>
                Pay Again
              </AppButton>
            </div>
          </div>
        </div>
      )}

      {showHistoryPopup && (
        <div className="popup-overlay">
          <div className="view-popup history-popup">
            <div className="popup-head">
              <h2>Billing History</h2>

              <button
                className="popup-close-btn"
                onClick={() => {
                  setShowHistoryPopup(false);
                  setSelectedBillIds([]);
                }}
              >
                ×
              </button>
            </div>
                <div className="form-group">
  <label>Session</label>

  <select>
    <option>All Sessions</option>
    <option>2026-27</option>
    <option>2025-26</option>
  </select>
</div>
            <div className="history-select-all">
              <label>
                <input
                  type="checkbox"
                  checked={isAllBillsSelected}
                  onChange={(e) => {
                    setSelectedBillIds(
                      e.target.checked ? paidBills.map((bill) => bill.id) : []
                    );
                  }}
                />
                Select All
              </label>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Bill No</th>
                    <th>Plan</th>
                    <th>Period</th>
                    <th>Amount</th>
                    <th>Paid Date</th>
                  </tr>
                </thead>

               <tbody>
  {paidBills.length === 0 && (
    <tr>
      <td colSpan="6">
        No Bills Available
      </td>
    </tr>
  )}

  {paidBills.length > 0 &&
    paidBills.map((bill) => (
      <tr key={bill.id}>
        <td>
          <input
            type="checkbox"
            checked={selectedBillIds.includes(
              bill.id
            )}
            onChange={() => {
              setSelectedBillIds((prev) =>
                prev.includes(bill.id)
                  ? prev.filter(
                      (id) => id !== bill.id
                    )
                  : [...prev, bill.id]
              );
            }}
          />
        </td>

        <td>{bill.billNo}</td>
        <td>{bill.plan}</td>
        <td>{bill.period}</td>
        <td>₹{bill.amount.toFixed(2)}</td>
        <td>{bill.paidDate}</td>
      </tr>
    ))}
</tbody>
              </table>
            </div>

            <div className="form-actions">
              <AppButton
  type="primary"
  onClick={handleDownloadSelectedBills}
  disabled={!canDownloadBills}
>
                Download Selected Bills
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubscriptionBilling;