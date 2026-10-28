const mongoose = require("mongoose");

const staffLeaveSchema = new mongoose.Schema(
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
    department: {
      type: String,
      default: "",
      trim: true,
    },
    position: {
      type: String,
      default: "",
      trim: true,
    },
    leaveType: {
      type: String,
      required: true,
      trim: true,
    },
    fromDate: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    toDate: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    reason: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["Approved", "Pending", "Rejected"],
      default: "Approved",
      index: true,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

staffLeaveSchema.index({ campusId: 1, staffId: 1, fromDate: 1, toDate: 1 });
staffLeaveSchema.index({ campusId: 1, status: 1 });

module.exports =
  mongoose.models.StaffLeave || mongoose.model("StaffLeave", staffLeaveSchema);

