const mongoose = require("mongoose");

// Subscription invoice / payment record. A school submission is "Pending" until the Super Admin verifies it.
const billingInvoiceSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Schema.Types.ObjectId, required: true },
    campusCode: { type: String, default: "" },
    billNo: { type: String, required: true, unique: true },
    plan: { type: String, enum: ["Monthly", "Quarterly", "Half-Yearly", "Annual"], required: true },
    months: { type: Number, required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    billingStudents: { type: Number, default: 0 },
    ratePerStudent: { type: Number, default: 0 },
    baseAmount: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
    gstPercent: { type: Number, default: 0 },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Pending", "Paid", "Rejected", "Cancelled"],
      default: "Pending",
    },
    source: { type: String, enum: ["school", "manual"], default: "school" },
    paymentMode: { type: String, default: "", trim: true },
    transactionNo: { type: String, default: "", trim: true },
    note: { type: String, default: "", trim: true },
    // Details submitted by the School Admin for verification (never proof of payment by themselves)
    amountPaid: { type: Number },
    paymentDate: { type: Date },
    payerName: { type: String, default: "", trim: true },
    remarks: { type: String, default: "", trim: true },
    // Normalised transaction reference while the invoice is Pending or Paid; unset on rejection so a
    // mistyped reference can be resubmitted. Unique so one reference cannot back two payments.
    activeTxnKey: { type: String },
    // Protected file storage reference (see utils/privateFiles). New proofs use this instead of base64.
    proofPath: { type: String, default: "", select: false },
    proofMime: { type: String, default: "" },
    // Legacy: base64 data URL stored in the document. Still readable; see scripts/migrate-payment-proofs.js
    screenshot: { type: String, default: "", select: false },
    submittedAt: { type: Date },
    paidAt: { type: Date },
    verifiedBy: { type: String, default: "" },
    rejectReason: { type: String, default: "" },
  },
  { timestamps: true }
);

billingInvoiceSchema.index({ schoolId: 1, createdAt: -1 });
billingInvoiceSchema.index({ status: 1, createdAt: -1 });
billingInvoiceSchema.index({ activeTxnKey: 1 }, { unique: true, sparse: true });
billingInvoiceSchema.index({ schoolId: 1, status: 1 });
billingInvoiceSchema.index({ status: 1, paidAt: -1 });

module.exports = mongoose.models.BillingInvoice || mongoose.model("BillingInvoice", billingInvoiceSchema);
