const mongoose = require("mongoose");

// Tracks which students already had a student ID / parent ID card printed
const idCardIssueSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin", required: true, index: true },
    campusId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin", required: true, index: true },
    type: { type: String, enum: ["STUDENT", "PARENT"], required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Admission", required: true },
    template: { type: String, default: "" },
    printCount: { type: Number, default: 0 },
    lastIssuedAt: { type: Date, default: Date.now },
    issuedByName: { type: String, default: "" },
  },
  { timestamps: true }
);

idCardIssueSchema.index({ campusId: 1, type: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.models.IdCardIssue || mongoose.model("IdCardIssue", idCardIssueSchema);
