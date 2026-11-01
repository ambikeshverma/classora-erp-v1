const mongoose = require("mongoose");

const reportResultSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin", required: true, index: true },
    campusId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin", required: true, index: true },
    session: { type: String, required: true, trim: true },

    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Admission", required: true },
    className: { type: String, required: true, trim: true },
    sectionName: { type: String, required: true, trim: true },

    totalMarks: { type: Number, default: 0 },
    maximumMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    division: { type: String, default: "-" },
    rank: { type: Number, default: null },
    result: { type: String, enum: ["PASS", "FAIL", "NA"], default: "NA" },

    isManual: { type: Boolean, default: false },
    // Live results are visible to students / parents
    isLive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reportResultSchema.index({ campusId: 1, studentId: 1, session: 1 }, { unique: true });
reportResultSchema.index({ campusId: 1, session: 1, className: 1, sectionName: 1 });

module.exports = mongoose.models.ReportResult || mongoose.model("ReportResult", reportResultSchema);
