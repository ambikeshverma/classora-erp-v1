const mongoose = require("mongoose");

const examTimetableSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin", required: true, index: true },
    campusId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin", required: true, index: true },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    examName: { type: String, required: true, trim: true },
    className: { type: String, required: true, trim: true },
    sectionName: { type: String, required: true, trim: true },
    subjectName: { type: String, required: true, trim: true },
    examDate: { type: String, required: true }, // yyyy-mm-dd
    startTime: { type: String, required: true }, // HH:mm
    endTime: { type: String, required: true },
  },
  { timestamps: true }
);

examTimetableSchema.index(
  { campusId: 1, examId: 1, className: 1, sectionName: 1, subjectName: 1 },
  { unique: true }
);
examTimetableSchema.index({ campusId: 1, examId: 1, className: 1, sectionName: 1, examDate: 1 });

module.exports = mongoose.models.ExamTimetable || mongoose.model("ExamTimetable", examTimetableSchema);
