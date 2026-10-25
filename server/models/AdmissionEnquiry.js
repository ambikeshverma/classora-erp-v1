const mongoose = require("mongoose");

const admissionEnquirySchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    enquiryNo: {
      type: String,
      required: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      trim: true,
    },
    classInterested: {
      type: String,
      required: true,
    },
    fatherName: {
      type: String,
      default: "",
      trim: true,
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    source: {
      type: String,
      required: true,
      default: "Walk-in",
    },
    status: {
      type: String,
      enum: ["NEW", "FOLLOW-UP", "CLOSED", "CONVERTED"],
      default: "NEW",
    },
    enquiryDate: {
      type: String,
      required: true,
    },
    remarks: {
      type: String,
      default: "",
    },
    session: {
      type: String,
      default: "2026-2027",
    },
  },
  { timestamps: true }
);

admissionEnquirySchema.index({ campusId: 1, status: 1 });

module.exports = mongoose.model("AdmissionEnquiry", admissionEnquirySchema);
