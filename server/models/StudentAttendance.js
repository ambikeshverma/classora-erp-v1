const mongoose = require("mongoose");

const studentAttendanceRecordSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Admission",
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    rollNo: {
      type: String,
      default: "",
      trim: true,
    },
    fatherName: {
      type: String,
      default: "",
      trim: true,
    },
    mobile: {
      type: String,
      default: "",
      trim: true,
    },
    photo: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["P", "A", "L", "W", "H", "NA"],
      default: "NA",
    },
    remarks: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const studentAttendanceSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SchoolAdmin",
      required: true,
      index: true,
    },
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SchoolAdmin",
      required: true,
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
      trim: true,
    },
    className: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    section: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    records: {
      type: [studentAttendanceRecordSchema],
      default: [],
    },
    summary: {
      total: { type: Number, default: 0 },
      present: { type: Number, default: 0 },
      absent: { type: Number, default: 0 },
      leave: { type: Number, default: 0 },
      na: { type: Number, default: 0 },
      percent: { type: Number, default: 0 },
    },
    markedBy: {
      type: String,
      default: "School Admin",
      trim: true,
    },
  },
  { timestamps: true }
);

// Compound Unique Index: One attendance entry per class & section per date per campus
studentAttendanceSchema.index(
  { campusId: 1, date: 1, className: 1, section: 1 },
  { unique: true }
);
studentAttendanceSchema.index({ campusId: 1, date: 1 });
studentAttendanceSchema.index({ schoolId: 1, date: 1 });
studentAttendanceSchema.index({ campusId: 1, className: 1, section: 1 });

module.exports =
  mongoose.models.StudentAttendance ||
  mongoose.model("StudentAttendance", studentAttendanceSchema);

