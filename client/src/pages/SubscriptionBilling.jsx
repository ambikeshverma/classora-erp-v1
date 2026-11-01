import React, { useState, useEffect, useCallback } from "react";
import "./subscriptionBilling.css";
import AppButton from "../components/AppButton";
import { useAuth } from "../context/AuthContext";
import { Skeleton, SkeletonTable } from "../components/Skeleton";
import { adminPanelService } from "../services/api";
import { toast } from "../utils/toast";

const allowedBillingRoles = [
  "School Admin",
  "Manager",
  "Principal",
  "Accountant",
  "Managing Director",
  "Director",
  "President",
];

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
};

const money = (value) => `₹${Number(value || 0).toFixed(2)}`;

// "BILL-CAMPUS/2026-27/001" -> "2026-27"
const sessionOf = (billNo) => (billNo || "").split("/")[1] || "";

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the selected file"));
    reader.readAsDataURL(file);
  });

function SubscriptionBilling() {
  const { user, role } = useAuth();

  const schoolInfo = {
    schoolName: user?.schoolName || user?.name || localStorage.getItem("userName") || "",
    campusId: user?.campusCode || user?.campusId || localStorage.getItem("campusId") || "",
  };

  const currentUser = {
    role: role || user?.role || "School Admin",
    position: user?.position || role || "School Admin",
    ...(user || {}),
  };

  const canAccessBilling =
    allowedBillingRoles.includes(currentUser.role) ||
    allowedBillingRoles.includes(currentUser.position);

  const canDownloadBills = canAccessBilling;

  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPayPopup, setShowPayPopup] = useState(false);
  const [showHistoryPopup, setShowHistoryPopup] = useState(false);
  const [historySession, setHistorySession] = useState("");
  const [selectedBillIds, setSelectedBillIds] = useState([]);
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [transactionNo, setTransactionNo] = useState("");
  const [payerName, setPayerName] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [qrImage, setQrImage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSubmittedPopup, setShowSubmittedPopup] = useState(false);
  const [rejectedDismissed, setRejectedDismissed] = useState(false);
  // Messages go through the central toast service
  const setMessage = (text) => {
    if (text) toast.warning(text);
  };

  const loadBilling = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await adminPanelService.getBilling();
      setBilling(res.data?.data || null);
    } catch (err) {
      setLoadError(err.response?.data?.message || "Failed to load billing information");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canAccessBilling) loadBilling();
    else setLoading(false);
  }, [canAccessBilling, loadBilling]);

  const plans = billing?.plans || [];
  const paidBills = billing?.invoices || [];
  const pendingInvoice = billing?.pendingInvoice || null;
  const verificationPending = Boolean(pendingInvoice);
  const rejectedInvoice = !rejectedDismissed && !pendingInvoice ? billing?.rejectedInvoice : null;
  const supportPhone = billing?.payment?.supportPhone;

  const sessions = [...new Set(paidBills.map((bill) => sessionOf(bill.billNo)).filter(Boolean))];
  const visibleBills = historySession
    ? paidBills.filter((bill) => sessionOf(bill.billNo) === historySession)
    : paidBills;

  const selectedPlanData = plans.find((plan) => plan.plan === selectedPlan) || null;

  const closePayPopup = () => {
    setShowPayPopup(false);
    setSelectedPlan(null);
    setPaymentScreenshot(null);
    setTransactionNo("");
    setPayerName("");
    setAmountPaid("");
    setPaymentDate("");
    setRemarks("");
  };

  const handlePayNow = (plan) => {
    if (verificationPending) {
      setMessage("Payment verification is already pending.");
      return;
    }

    setSelectedPlan(plan.plan);
    setPaymentScreenshot(null);
    setAmountPaid(String(Number(plan.amount).toFixed(2)));
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setQrImage("");
    setShowPayPopup(true);
    if (billing?.payment?.hasQr) {
      adminPanelService
        .getBillingQr()
        .then((res) => setQrImage(res.data?.data?.image || ""))
        .catch(() => setQrImage(""));
    }
  };

  const handleSubmitScreenshot = async () => {
    const proofRequired = billing?.payment?.proofRequired !== false;

    if (transactionNo.trim().length < 4) return toast.warning("Enter the transaction / reference ID.");
    if (!payerName.trim()) return toast.warning("Enter the payer name.");
    if (!paymentDate) return toast.warning("Select the payment date.");
    if (!(Number(amountPaid) > 0)) return toast.warning("Enter the amount paid.");
    if (proofRequired && !paymentScreenshot) return toast.warning("Please upload the payment screenshot.");

    setSubmitting(true);

    try {
      const screenshot = paymentScreenshot ? await readFileAsDataUrl(paymentScreenshot) : undefined;

      await adminPanelService.submitBillingPayment({
        plan: selectedPlan,
        transactionNo: transactionNo.trim(),
        amountPaid: Number(amountPaid),
        paymentDate,
        payerName: payerName.trim(),
        remarks: remarks.trim(),
        screenshot,
      });

      closePayPopup();
      setShowSubmittedPopup(true);
      setRejectedDismissed(false);
      loadBilling();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to submit payment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadSelectedBills = () => {
    if (selectedBillIds.length === 0) {
      setMessage("Please select at least one bill.");
      return;
    }

    const selectedBills = paidBills.filter((bill) => selectedBillIds.includes(bill.id));

    selectedBills.forEach((bill) => {
      const billText = `
CLASSORA ERP

Subscription Bill

Bill No        : ${bill.billNo}
Bill Date      : ${formatDate(bill.createdAt)}

School Name    : ${schoolInfo.schoolName}
Campus ID      : ${schoolInfo.campusId}

Plan Name      : ${bill.plan}
Period         : ${formatDate(bill.periodStart)} - ${formatDate(bill.periodEnd)}

Billing Students : ${bill.billingStudents}
Base Amount      : ${money(bill.baseAmount)}
Discount          : ${bill.discountPercent}%
GST               : ${bill.gstPercent}%
Final Paid Amount : ${money(bill.amount)}

Transaction No : ${bill.transactionNo || "-"}
Payment Mode   : ${bill.paymentMode || "-"}
Payment Date   : ${formatDate(bill.paidAt)}

Next Due Date  : ${formatDate(new Date(new Date(bill.periodEnd).getTime() + 24 * 60 * 60 * 1000))}

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
    visibleBills.length > 0 && visibleBills.every((bill) => selectedBillIds.includes(bill.id));

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

  const statusLabel = {
    Active: "Active",
    Grace: "Grace period",
    Expired: "Expired",
    None: "No active subscription",
  };

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
        <AppButton
          type="primary"
          onClick={() => {
            setSelectedBillIds([]);
            setShowHistoryPopup(true);
          }}
          disabled={loading}
        >
          Billing History
        </AppButton>
      </div>

      {loading ? (
        <div style={{ padding: "8px 0" }}>
          <Skeleton variant="rectangular" height={90} />
          <div className="plan-card-grid">
            {[0, 1, 2, 3].map((item) => (
              <Skeleton key={item} variant="rectangular" height={320} />
            ))}
          </div>
        </div>
      ) : loadError || !billing ? (
        <div className="subscription-summary-card">
          <h3>Billing unavailable</h3>
          <p>{loadError || "Billing information is not available"}</p>
          <AppButton type="primary" onClick={loadBilling}>
            Try again
          </AppButton>
        </div>
      ) : (
        <>
          <div className="subscription-summary-card">
            <h3>{billing.subscription ? "Subscription valid until" : "Subscription"}</h3>
            <p>
              {billing.subscription
                ? formatDate(billing.subscription.expiryDate)
                : "No active subscription. Choose a plan to start."}
            </p>
            <p>
              Status: <strong>{statusLabel[billing.status] || billing.status}</strong>
              {billing.subscription?.plan ? ` · Plan: ${billing.subscription.plan}` : ""}
            </p>
            {billing.subscription && (
              <p>
                Next billing period starts: <strong>{formatDate(billing.currentDueDate)}</strong>
              </p>
            )}
          </div>

          {verificationPending && (
            <div className="pending-box">
              <strong>Verification Pending</strong>

              <br />
              Plan: {pendingInvoice.plan}

              <br />
              Submitted: {formatDate(pendingInvoice.submittedAt)}

              <br />
              You cannot upload another screenshot until this payment is verified or rejected.
            </div>
          )}

          <div className="plan-card-grid">
            {plans.map((plan) => (
              <div className="plan-card" key={plan.plan}>
                <h2>{plan.plan}</h2>

                <p className="plan-subtitle">
                  {plan.months} {plan.months === 1 ? "month" : "months"} billing
                </p>

                <h1>{money(plan.amount)}</h1>

                <p className="gst-text">Including GST</p>

                <div className="discount-badge">
                  {plan.discountPercent === 0 ? "No Discount" : `${plan.discountPercent}% Discount`}
                </div>

                <div className="plan-info">
                  <p>
                    Billing Students: <strong>{plan.billingStudents}</strong>
                  </p>

                  <p>
                    Base Amount: <strong>{money(plan.baseAmount)}</strong>
                  </p>

                  <p>
                    Discount: <strong>{plan.discountPercent}%</strong>
                  </p>

                  <p>
                    GST: <strong>{plan.gstPercent}%</strong>
                  </p>

                  <p>
                    Final Payable: <strong>{money(plan.amount)}</strong>
                  </p>

                  <p>
                    Period:{" "}
                    <strong>
                      {formatDate(plan.periodStart)} - {formatDate(plan.periodEnd)}
                    </strong>
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
            ))}
          </div>
        </>
      )}

      {showPayPopup && selectedPlanData && (
        <div className="popup-overlay">
          <div className="view-popup">
            <div className="popup-head">
              <h2>{selectedPlanData.plan} Payment</h2>

              <button className="popup-close-btn" onClick={closePayPopup}>
                ×
              </button>
            </div>

            <div className="qr-box">
              {qrImage ? (
                <img src={qrImage} alt="Payment QR code" style={{ maxWidth: 220, width: "100%", borderRadius: 8 }} />
              ) : billing.payment?.hasQr ? (
                <p>Loading QR...</p>
              ) : (
                <p>
                  The payment QR is not configured yet. Please contact Classora support
                  {supportPhone ? ` on ${supportPhone}` : ""}.
                </p>
              )}

              <p>Scan the QR, pay the exact amount, then fill in the details below.</p>

              {billing.payment?.merchantName && (
                <p className="payment-note">Receiver: {billing.payment.merchantName}</p>
              )}

              {billing.payment?.upiId && <p className="payment-note">UPI ID: {billing.payment.upiId}</p>}

              {billing.payment?.accountDetails && (
                <p className="payment-note" style={{ whiteSpace: "pre-line" }}>
                  {billing.payment.accountDetails}
                </p>
              )}

              {billing.payment?.instructions && (
                <p className="payment-note" style={{ whiteSpace: "pre-line" }}>
                  {billing.payment.instructions}
                </p>
              )}

              <p className="payable-label">Payable Amount</p>

              <h3>{money(selectedPlanData.amount)}</h3>
            </div>

            <div className="form-group">
              <label>Transaction / Reference ID *</label>

              <input
                type="text"
                value={transactionNo}
                maxLength={80}
                onChange={(e) => setTransactionNo(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Amount Paid (₹) *</label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Payment Date *</label>

              <input
                type="date"
                value={paymentDate}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Payer Name *</label>

              <input
                type="text"
                value={payerName}
                maxLength={100}
                onChange={(e) => setPayerName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Remarks (optional)</label>

              <input
                type="text"
                value={remarks}
                maxLength={300}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Upload Payment Screenshot{billing.payment?.proofRequired !== false ? " *" : " (optional)"}</label>

              <input
                type="file"
                accept=".jpg,.jpeg,.png"
                capture="environment"
                onChange={(e) => {
                  const file = e.target.files?.[0];

                  if (!file) return;

                  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

                  if (!allowedTypes.includes(file.type)) {
                    setMessage("Only JPG, JPEG and PNG files are allowed.");
                    return;
                  }

                  if (file.size > 5 * 1024 * 1024) {
                    setMessage("Maximum file size is 5 MB.");
                    return;
                  }

                  setMessage("");
                  setPaymentScreenshot(file);
                }}
              />
            </div>

            <div className="form-actions">
              <AppButton type="primary" onClick={handleSubmitScreenshot} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Screenshot"}
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

              <button className="popup-close-btn" onClick={() => setShowSubmittedPopup(false)}>
                ×
              </button>
            </div>

            <div className="popup-message">
              <p>Your payment screenshot has been submitted successfully.</p>
              <p>Your payment is waiting for Super Admin verification.</p>
              <p>
                You cannot upload another screenshot until this payment is verified or
                rejected.
              </p>
            </div>

            <div className="form-actions">
              <AppButton type="primary" onClick={() => setShowSubmittedPopup(false)}>
                OK
              </AppButton>
            </div>
          </div>
        </div>
      )}

      {rejectedInvoice && (
        <div className="popup-overlay">
          <div className="view-popup">
            <div className="popup-head">
              <h2>Payment Rejected</h2>

              <button className="popup-close-btn" onClick={() => setRejectedDismissed(true)}>
                ×
              </button>
            </div>

            <div className="popup-message">
              <p>Your payment verification has been rejected.</p>

              <p>
                <strong>Reason:</strong> {rejectedInvoice.rejectReason || "Not specified"}
              </p>

              <p>Please make the payment again and upload a new payment screenshot.</p>

              {supportPhone && (
                <div className="support-box">
                  <p>Need Help?</p>
                  <p>Contact Classora Support Team</p>
                  <strong>📞 {supportPhone}</strong>
                </div>
              )}
            </div>

            <div className="form-actions">
              <AppButton type="primary" onClick={() => setRejectedDismissed(true)}>
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

            {sessions.length > 0 && (
              <div className="form-group">
                <label>Session</label>

                <select
                  value={historySession}
                  onChange={(e) => {
                    setHistorySession(e.target.value);
                    setSelectedBillIds([]);
                  }}
                >
                  <option value="">All Sessions</option>
                  {sessions.map((session) => (
                    <option key={session} value={session}>
                      {session}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="history-select-all">
              <label>
                <input
                  type="checkbox"
                  checked={isAllBillsSelected}
                  onChange={(e) => {
                    setSelectedBillIds(e.target.checked ? visibleBills.map((bill) => bill.id) : []);
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
                  {loading ? (
                    <tr>
                      <td colSpan="6" style={{ padding: "4px 0", border: "none" }}>
                        <SkeletonTable rows={3} columns={6} />
                      </td>
                    </tr>
                  ) : visibleBills.length === 0 ? (
                    <tr>
                      <td colSpan="6">No Bills Available</td>
                    </tr>
                  ) : (
                    visibleBills.map((bill) => (
                      <tr key={bill.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedBillIds.includes(bill.id)}
                            onChange={() => {
                              setSelectedBillIds((prev) =>
                                prev.includes(bill.id)
                                  ? prev.filter((id) => id !== bill.id)
                                  : [...prev, bill.id]
                              );
                            }}
                          />
                        </td>

                        <td>{bill.billNo}</td>
                        <td>{bill.plan}</td>
                        <td>
                          {formatDate(bill.periodStart)} - {formatDate(bill.periodEnd)}
                        </td>
                        <td>{money(bill.amount)}</td>
                        <td>{formatDate(bill.paidAt)}</td>
                      </tr>
                    ))
                  )}
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
