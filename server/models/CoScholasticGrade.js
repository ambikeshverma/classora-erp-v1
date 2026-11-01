const mongoose = require("mongoose");

const coScholasticGradeSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin", required: true, index: true },
    campusId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin", required: true, index: true },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Admission", required: true },
    subjectName: { type: String, required: true, trim: true },
    grade: { type: String, enum: ["A+", "A", "B+", "B", "C", "D"], required: true },
    className: { type: String, default: "" },
    sectionName: { type: String, default: "" },
  },
  { timestamps: true }
);

coScholasticGradeSchema.index({ campusId: 1, examId: 1, studentId: 1, subjectName: 1 }, { unique: true });
coScholasticGradeSchema.index({ campusId: 1, studentId: 1 });

module.exports = mongoose.models.CoScholasticGrade || mongoose.model("CoScholasticGrade", coScholasticGradeSchema);
