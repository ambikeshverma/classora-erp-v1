const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
  {
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SchoolAdmin",
      required: true,
      index: true,
    },
    employeeCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    employeeName: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      default: "",
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    dob: { type: String, default: "" },
    aadhaar: { type: String, default: "" },
    pan: { type: String, default: "" },
    religion: { type: String, default: "" },
    community: { type: String, default: "" },
    caste: { type: String, default: "" },
    bloodGroup: { type: String, default: "" },
    highestEducation: { type: String, default: "" },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
      index: true,
    },
    positionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Position",
      required: true,
      index: true,
    },
    teachingStaff: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",
      index: true,
    },
    joiningDate: { type: String, default: "" },
    localAddress: { type: String, default: "" },
    state: { type: String, default: "" },
    city: { type: String, default: "" },
    postalCode: { type: String, default: "" },
    permanentAddress: { type: String, default: "" },
    bankName: { type: String, default: "" },
    branchName: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    ifscCode: { type: String, default: "" },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    documents: [
      {
        documentName: { type: String, required: true },
        fileUrl: { type: String, default: "" },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

staffSchema.index({ campusId: 1, employeeCode: 1 }, { unique: true });
staffSchema.index({ campusId: 1, mobile: 1 });
staffSchema.index({ campusId: 1, teachingStaff: 1, isActive: 1 });

module.exports = mongoose.model("Staff", staffSchema);
