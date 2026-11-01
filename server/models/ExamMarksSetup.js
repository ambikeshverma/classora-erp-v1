const mongoose = require("mongoose");

const examMarksSetupSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin", required: true, index: true },
    campusId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin", required: true, index: true },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    examName: { type: String, required: true, trim: true },
    className: { type: String, required: true, trim: true },
    sectionName: { type: String, default: "", trim: true }, // empty means all sections
    subjectName: { type: String, required: true, trim: true },
    maximumMarks: { type: Number, required: true, min: 1 },
    passingMarks: { type: Number, default: null, min: 0 },
    // Set by marks entry / result generation (Report Card Management) once they use this setup
    marksEntryStarted: { type: Boolean, default: false },
    resultGenerated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

examMarksSetupSchema.index(
  { campusId: 1, examId: 1, className: 1, sectionName: 1, subjectName: 1 },
  { unique: true }
);

module.exports = mongoose.models.ExamMarksSetup || mongoose.model("ExamMarksSetup", examMarksSetupSchema);
