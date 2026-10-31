const mongoose = require("mongoose");

const receiptRowSchema = new mongoose.Schema(
  {
    rowKey: { type: String, required: true },
    source: { type: String, enum: ["FeePlan", "Transport", "Manual"], default: "FeePlan" },
    manualFeeId: { type: mongoose.Schema.Types.ObjectId, default: null },
    periodKey: { type: String, required: true },
    periodShort: { type: String, default: "" },
    feeHeadName: { type: String, required: true },
    fee: { type: Number, default: 0 },
    concession: { type: Number, default: 0 },
    prepaid: { type: Number, default: 0 },
    paid: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
  },
  { _id: false }
);

const feeReceiptSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin", required: true, index: true },
    campusId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin", required: true, index: true },
    session: { type: String, required: true, trim: true },

    receiptSeq: { type: Number, required: true },
    receiptNo: { type: String, required: true },

    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Admission", required: true },
    studentName: { type: String, default: "" },
    fatherName: { type: String, default: "" },
    mobile: { type: String, default: "" },
    srNo: { type: String, default: "" },
    admissionNo: { type: String, default: "" },
    className: { type: String, default: "" },
    section: { type: String, default: "" },
    routeName: { type: String, default: "" },

    depositDate: { type: String, required: true },
    paymentMode: { type: String, default: "Cash" },
    paymentRef: { type: String, default: "" },
    remarks: { type: String, default: "" },

    paidAmount: { type: Number, default: 0 },
    isZeroReceipt: { type: Boolean, default: false },
    periods: { type: [String], default: [] },
    rows: { type: [receiptRowSchema], default: [] },

    collectedByName: { type: String, default: "" },
    collectedById: { type: String, default: "" },

    status: { type: String, enum: ["Active", "Cancelled"], default: "Active", index: true },
    cancelReason: { type: String, default: "" },
    cancelledAt: { type: Date, default: null },
    cancelledByName: { type: String, default: "" },
  },
  { timestamps: true }
);

feeReceiptSchema.index({ campusId: 1, session: 1, receiptSeq: 1 }, { unique: true });
feeReceiptSchema.index({ campusId: 1, studentId: 1, session: 1, status: 1 });
feeReceiptSchema.index({ campusId: 1, depositDate: 1, status: 1 });

module.exports = mongoose.models.FeeReceipt || mongoose.model("FeeReceipt", feeReceiptSchema);
