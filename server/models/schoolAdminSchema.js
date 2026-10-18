const mongoose = require("mongoose");

const DEFAULT_MODULES = [
  "user_control",
  "admin_panel",
  "admissions",
  "reception",
  "student_hub",
  "academic_zone",
  "attendance",
  "fee_manager",
  "transport",
  "finance",
  "student_app_access",
  "hr_staff",
  "exam_tools",
  "report_cards",
];

const noticeSchema = new mongoose.Schema(
  {
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["info", "warning", "danger", "success"],
      default: "info",
    },
    title: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String, default: "Super Admin" },
  },
  { timestamps: true }
);

const schoolAdminSchema = new mongoose.Schema(
  {
    campusId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: { type: String, required: true },

    schoolLogo: { type: String, default: "" },

    principalSignature: { type: String, default: "" },

    address: { type: String, required: true, trim: true },

    contactNo: { type: String, required: true, trim: true },

    website: { type: String, default: "", trim: true },

    schoolName: { type: String, required: true, trim: true },

    principalName: { type: String, required: true, trim: true },

    role: { type: String, default: "schoolAdmin" },

    isActive: { type: Boolean, default: true, index: true },

    enabledModules: {
      type: [String],
      default: DEFAULT_MODULES,
    },

    notices: {
      type: [noticeSchema],
      default: [],
    },

    refreshToken: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SchoolAdmin", schoolAdminSchema);
module.exports.DEFAULT_MODULES = DEFAULT_MODULES;