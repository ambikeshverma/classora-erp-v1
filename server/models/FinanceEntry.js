const mongoose = require("mongoose");

const financeEntrySchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin", required: true, index: true },
    campusId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin", required: true, index: true },

    type: { type: String, enum: ["INCOME", "EXPENSE"], required: true },
    voucherNo: { type: String, required: true },
    voucherSeq: { type: Number, required: true },
    year: { type: String, required: true }, // academic session start year used in the voucher number

    date: { type: String, required: true }, // yyyy-mm-dd
    amount: { type: Number, required: true, min: 0 },

    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "AccountGroup", required: true },
    groupName: { type: String, required: true },
    headId: { type: mongoose.Schema.Types.ObjectId, ref: "AccountHead", required: true },
    headName: { type: String, required: true },

    partyRef: { type: String, default: "" },
    partyName: { type: String, required: true },

    paymentMode: { type: String, required: true },
    bankName: { type: String, default: "" },
    transactionNo: { type: String, default: "" },
    transactionDate: { type: String, default: "" },
    description: { type: String, default: "" },

    attachmentName: { type: String, default: "" },
    attachmentUrl: { type: String, default: "" },

    // MANUAL entries are typed in by users; the others are posted automatically by other modules
    source: { type: String, enum: ["MANUAL", "FEE_COLLECTION", "SALARY"], default: "MANUAL" },
    sourceId: { type: String, default: undefined },

    status: { type: String, enum: ["SUCCESS", "Cancelled"], default: "SUCCESS", index: true },
    cancelReason: { type: String, default: "" },
    cancelledAt: { type: Date, default: null },
    cancelledByName: { type: String, default: "" },

    createdByName: { type: String, default: "" },
  },
  { timestamps: true }
);

financeEntrySchema.index({ campusId: 1, type: 1, voucherSeq: 1, year: 1 }, { unique: true });
financeEntrySchema.index({ campusId: 1, type: 1, date: -1 });
financeEntrySchema.index({ campusId: 1, headId: 1 });
financeEntrySchema.index({ campusId: 1, groupId: 1 });
// One automatic posting per source record
financeEntrySchema.index(
  { campusId: 1, source: 1, sourceId: 1 },
  { unique: true, partialFilterExpression: { sourceId: { $type: "string" } } }
);

module.exports = mongoose.models.FinanceEntry || mongoose.model("FinanceEntry", financeEntrySchema);
