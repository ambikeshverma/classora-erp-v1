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

// Sub-modules for each main module matching the exact cards, names, counts, and sequence in School Dashboard
const DEFAULT_SUB_MODULES = {
  user_control: [
    "user_management",
    "class_teacher_assignment",
    "subject_teacher_assignment",
  ],
  admin_panel: [
    "fee_scheme",
    "fee_plan_name_setup",
    "fee_plan_management",
    "concession_management",
    "subscription_billing",
    "admin_reports",
  ],
  admissions: [
    "new_admission",
    "admission_enquiries",
    "admission_bulk_import",
    "admission_analytics_reports",
  ],
  reception: [
    "enquiry_sources",
    "follow_up_management",
    "gate_pass_management",
    "student_id_management",
    "parent_id_management",
    "appointment_scheduling",
    "visitor_management",
    "support_complaint",
    "reception_reports",
  ],
  student_hub: [
    "class_management",
    "section_management",
    "medium_management",
    "house_management",
    "house_allocation",
    "sibling_management",
    "student_search",
    "inactive_students",
    "student_documents",
    "roll_number_update",
    "section_transfer",
    "promotion_management",
    "alumni_management",
    "bulk_student_update",
    "data_export",
    "student_reports",
  ],
  academic_zone: [
    "subject_setup",
    "co_scholastic_subject_setup",
    "class_subject_mapping",
    "student_subject_mapping",
    "academic_reports",
  ],
  attendance: [
    "student_attendance",
    "staff_attendance",
    "bulk_attendance_entry",
    "attendance_analytics",
  ],
  fee_manager: [
    "fee_collection",
    "fee_receipt",
    "fee_analytics_reports",
  ],
  transport: [
    "route_management",
    "vehicle_management",
    "student_transport_allocation",
    "transport_reports",
  ],
  finance: [
    "account_groups",
    "account_heads",
    "income_entry",
    "expense_entry",
    "finance_reports",
  ],
  student_app_access: [
    "student_login_management",
    "app_banners",
    "teacher_circulars",
    "app_news",
    "app_notice_board",
    "fee_due_notice",
    "app_permissions",
    "student_app_reports",
  ],
  hr_staff: [
    "department_management",
    "position_management",
    "staff_management",
    "leave_management",
    "salary_management",
    "staff_reports",
  ],
  exam_tools: [
    "exam_setup",
    "exam_marks_setup",
    "exam_timetable",
    "admit_card",
  ],
  report_cards: [
    "scholastic_marks_entry",
    "co_scholastic_marks_entry",
    "result_generation",
    "report_cards_view",
    "report_card_analytics",
  ],
};

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

    // Sub-module control: module_key -> array of enabled sub-module keys
    enabledSubModules: {
      type: Map,
      of: [String],
      default: () => new Map(Object.entries(DEFAULT_SUB_MODULES)),
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
module.exports.DEFAULT_SUB_MODULES = DEFAULT_SUB_MODULES;