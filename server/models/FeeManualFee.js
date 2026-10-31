const mongoose = require("mongoose");

const feeManualFeeSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin", required: true, index: true },
    campusId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin", required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Admission", required: true },
    session: { type: String, required: true, trim: true },
    feeHeadName: { type: String, required: true, trim: true },
    periodKey: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    createdByName: { type: String, default: "" },
  },
  { timestamps: true }
);

feeManualFeeSchema.index({ campusId: 1, studentId: 1, session: 1 });
feeManualFeeSchema.index({ campusId: 1, session: 1 });

module.exports = mongoose.models.FeeManualFee || mongoose.model("FeeManualFee", feeManualFeeSchema);
