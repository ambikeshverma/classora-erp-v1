const mongoose = require("mongoose");

const scholasticMarkSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin", required: true, index: true },
    campusId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin", required: true, index: true },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Admission", required: true },
    subjectName: { type: String, required: true, trim: true },

    // A number as text, "AB" (absent) or "ML" (medical leave)
    marks: { type: String, required: true },
    // Numeric value for aggregation; null for AB / ML
    value: { type: Number, default: null },

    className: { type: String, default: "" },
    sectionName: { type: String, default: "" },
  },
  { timestamps: true }
);

scholasticMarkSchema.index({ campusId: 1, examId: 1, studentId: 1, subjectName: 1 }, { unique: true });
scholasticMarkSchema.index({ campusId: 1, studentId: 1 });
scholasticMarkSchema.index({ campusId: 1, className: 1, sectionName: 1, examId: 1 });

module.exports = mongoose.models.ScholasticMark || mongoose.model("ScholasticMark", scholasticMarkSchema);
