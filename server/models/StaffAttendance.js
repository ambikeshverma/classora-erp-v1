const mongoose = require("mongoose");

const staffAttendanceSchema = new mongoose.Schema(
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
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
      index: true,
    },
    employeeCode: {
      type: String,
      default: "",
      trim: true,
    },
    employeeName: {
      type: String,
      default: "",
      trim: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    positionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Position",
      default: null,
    },
    attendance: {
      type: String,
      enum: ["Present", "Absent", "Leave", "Not Marked", "Half Day", "Holiday"],
      default: "Not Marked",
    },
    checkInTime: {
      type: String,
      default: "--",
    },
    checkOutTime: {
      type: String,
      default: "--",
    },
    method: {
      type: String,
      default: "Manual", // "Manual" | "Geo" | "Biometric" | "RFID"
    },
    markedFrom: {
      type: String,
      default: "School Portal", // "Teacher Dashboard" | "School Portal" | "Leave Management"
    },
    isLeaveLocked: {
      type: Boolean,
      default: false,
    },
    leaveType: {
      type: String,
      default: "",
    },
    location: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
  },
  { timestamps: true }
);

// Compound Unique Index: One record per staff per date per campus
staffAttendanceSchema.index({ campusId: 1, date: 1, staffId: 1 }, { unique: true });
staffAttendanceSchema.index({ campusId: 1, date: 1 });
staffAttendanceSchema.index({ schoolId: 1, date: 1 });

module.exports =
  mongoose.models.StaffAttendance ||
  mongoose.model("StaffAttendance", staffAttendanceSchema);

