// Single Source of Truth for all 14 Modules and their Sub-modules
// Exact names, sequence, counts, and paths matching the School Portal

export const MODULES_REGISTRY = [
  {
    key: "user_control",
    name: "User Control",
    icon: "🔐",
    desc: "Manage user types, users and teacher/coordinator assignments",
    path: "/user-control",
    subModules: [
      { key: "user_management", name: "User Management", icon: "👤", route: "/user-management" },
      { key: "class_teacher_assignment", name: "Class Teacher Assignment", icon: "🏫", route: "/class-teacher-assignment" },
      { key: "subject_teacher_assignment", name: "Subject Teacher Assignment", icon: "📚", route: "/subject-teacher-assignment" },
    ],
  },
  {
    key: "admin_panel",
    name: "Admin Panel",
    icon: "⚙️",
    desc: "Manage school profile, fees, concessions and billing",
    path: "/admin-panel",
    subModules: [
      { key: "fee_scheme", name: "Fee Scheme", icon: "🧾", route: "/fee-scheme" },
      { key: "fee_plan_name_setup", name: "Fee Plan Name Setup", icon: "🏷️", route: "/fee-plan-name-setup" },
      { key: "fee_plan_management", name: "Fee Plan Management", icon: "💳", route: "/fee-plan-management" },
      { key: "concession_management", name: "Concession Management", icon: "🎁", route: "/concession-management" },
      { key: "subscription_billing", name: "Subscription & Billing", icon: "💼", route: "/subscription-billing" },
      { key: "admin_reports", name: "Analytics & Reports", icon: "📊", route: "/admin-reports" },
    ],
  },
  {
    key: "admissions",
    name: "Admissions",
    icon: "📝",
    desc: "Manage student admissions, enquiries, imports and reports",
    path: "/admissions",
    subModules: [
      { key: "new_admission", name: "New Admission", icon: "➕", route: "/admission/new" },
      { key: "admission_enquiries", name: "Admission Enquiries", icon: "📝", route: "/admission-enquiries" },
      { key: "admission_bulk_import", name: "Bulk Import", icon: "⬇️", route: "/admission-bulk-import" },
      { key: "admission_analytics_reports", name: "Analytics & Reports", icon: "📊", route: "/admission-analytics-reports" },
    ],
  },
  {
    key: "reception",
    name: "Reception Desk",
    icon: "🏢",
    desc: "Manage enquiries, visitors, appointments and front office operations",
    path: "/reception-desk",
    subModules: [
      { key: "enquiry_sources", name: "Enquiry Sources", icon: "📰", route: "/enquiry-sources" },
      { key: "follow_up_management", name: "Follow-up Management", icon: "🔄", route: "/follow-up-management" },
      { key: "gate_pass_management", name: "Gate Pass Management", icon: "🚪", route: "/gate-pass-management" },
      { key: "student_id_management", name: "Student ID Management", icon: "🎓", route: "/student-id-management" },
      { key: "parent_id_management", name: "Parent ID Management", icon: "👨‍👩‍👧", route: "/parent-id-management" },
      { key: "appointment_scheduling", name: "Appointment Scheduling", icon: "📅", route: "/appointment-scheduling" },
      { key: "visitor_management", name: "Visitor Management", icon: "🛂", route: "/visitor-management" },
      { key: "support_complaint", name: "Support & Complaints", icon: "🛠️", route: "/support-complaint" },
      { key: "reception_reports", name: "Analytics and Reports", icon: "📊", route: "/reception-reports" },
    ],
  },
  {
    key: "student_hub",
    name: "Student Hub",
    icon: "🎓",
    desc: "Manage classes, sections, students, documents and reports",
    path: "/student-hub",
    subModules: [
      { key: "class_management", name: "Class Management", icon: "🏫", route: "/class-management" },
      { key: "section_management", name: "Section Management", icon: "🧩", route: "/section-management" },
      { key: "medium_management", name: "Medium Management", icon: "🌐", route: "/medium-management" },
      { key: "house_management", name: "House Management", icon: "🏠", route: "/house-management" },
      { key: "house_allocation", name: "House Allocation", icon: "🏠", route: "/house-allocation" },
      { key: "sibling_management", name: "Sibling Management", icon: "👨‍👩‍👧‍👦", route: "/sibling-management" },
      { key: "student_search", name: "Student Search", icon: "🔍", route: "/student-search" },
      { key: "inactive_students", name: "Inactive Students", icon: "🚫", route: "/inactive-students" },
      { key: "student_documents", name: "Student Documents", icon: "📁", route: "/student-documents" },
      { key: "roll_number_update", name: "Roll Number Update", icon: "🔢", route: "/roll-number-update" },
      { key: "section_transfer", name: "Section Transfer", icon: "🔄", route: "/section-transfer" },
      { key: "promotion_management", name: "Promotion Management", icon: "⬆️", route: "/promotion-management" },
      { key: "alumni_management", name: "Alumni Management", icon: "🎓", route: "/alumni-management" },
      { key: "bulk_student_update", name: "Bulk Student Update", icon: "🛠️", route: "/bulk-student-update" },
      { key: "data_export", name: "Data Export", icon: "📤", route: "/data-export" },
      { key: "student_reports", name: "Analytics & Reports", icon: "📊", route: "/student-reports" },
    ],
  },
  {
    key: "academic_zone",
    name: "Academic Zone",
    icon: "📚",
    desc: "Manage subjects, class mappings, student mappings and subject rules",
    path: "/academic-zone",
    subModules: [
      { key: "subject_setup", name: "Subject Setup", icon: "📘", route: "/academic-zone/subject-setup" },
      { key: "co_scholastic_subject_setup", name: "Co-Scholastic Subject Setup", icon: "🧩", route: "/co-scholastic-subject-setup" },
      { key: "class_subject_mapping", name: "Class Subject Mapping", icon: "🏫", route: "/academic-zone/class-subject-mapping" },
      { key: "student_subject_mapping", name: "Student Subject Mapping", icon: "🎓", route: "/academic-zone/student-subject-mapping" },
      { key: "academic_reports", name: "Analytics and Reports", icon: "📊", route: "/academic-zone/reports" },
    ],
  },
  {
    key: "attendance",
    name: "Attendance System",
    icon: "✅",
    desc: "Manage student attendance, staff attendance, leave and attendance lock",
    path: "/attendance-system",
    subModules: [
      { key: "student_attendance", name: "Student Attendance", icon: "🎓", route: "/attendance-system/student-attendance" },
      { key: "staff_attendance", name: "Staff Attendance", icon: "👨‍🏫", route: "/attendance-system/staff-attendance" },
      { key: "bulk_attendance_entry", name: "Bulk Attendance Entry", icon: "📝", route: "/attendance-system/bulk-attendance-entry" },
      { key: "attendance_analytics", name: "Analytics and Reports", icon: "📊", route: "/attendance-system/attendance-analytics" },
    ],
  },
  {
    key: "fee_manager",
    name: "Fee Manager",
    icon: "💳",
    desc: "Manage fee collection, receipts, fines, transport fee and fee reports",
    path: "/fee-manager",
    subModules: [
      { key: "fee_collection", name: "Fee Collection", icon: "💰", route: "/fee-collection" },
      { key: "fee_receipt", name: "Fee Receipt", icon: "🧾", route: "/fee-receipt" },
      { key: "fee_analytics_reports", name: "Analytics and Reports", icon: "📊", route: "/fee-analytics-reports" },
    ],
  },
  {
    key: "transport",
    name: "Transport System",
    icon: "🚌",
    desc: "Manage routes, vehicles and student transport allocation",
    path: "/transport-system",
    subModules: [
      { key: "route_management", name: "Route Management", icon: "🛣️", route: "/route-management" },
      { key: "vehicle_management", name: "Vehicle Management", icon: "🚌", route: "/vehicle-management" },
      { key: "student_transport_allocation", name: "Student Transport Allocation", icon: "🎒", route: "/student-transport-allocation" },
      { key: "transport_reports", name: "Analytics and Reports", icon: "📊", route: "/transport-analytics-reports" },
    ],
  },
  {
    key: "finance",
    name: "Finance Manager",
    icon: "📊",
    desc: "Manage income, expenses and accounting structure",
    path: "/finance-manager",
    subModules: [
      { key: "account_groups", name: "Account Groups", icon: "📂", route: "/account-groups" },
      { key: "account_heads", name: "Account Heads", icon: "🧾", route: "/account-heads" },
      { key: "income_entry", name: "Income Entry", icon: "📥", route: "/income-entry" },
      { key: "expense_entry", name: "Expense Entry", icon: "📤", route: "/expense-entry" },
      { key: "finance_reports", name: "Analytics and Reports", icon: "📊", route: "/finance-manager/reports" },
    ],
  },
  {
    key: "student_app_access",
    name: "Student App Access",
    icon: "📱",
    desc: "Manage student app login, banners, notices, news and permissions",
    path: "/student-app-access",
    subModules: [
      { key: "student_login_management", name: "Student Login Management", icon: "📱", route: "/student-login-management" },
      { key: "app_banners", name: "App Banners", icon: "🖼️", route: "/app-banners" },
      { key: "teacher_circulars", name: "Teacher Circulars", icon: "📢", route: "/teacher-circulars" },
      { key: "app_news", name: "App News", icon: "📰", route: "/app-news" },
      { key: "app_notice_board", name: "App Notice Board", icon: "🔔", route: "/app-notice-board" },
      { key: "fee_due_notice", name: "Fee Due Notice", icon: "💳", route: "/fee-due-notice" },
      { key: "app_permissions", name: "App Permissions", icon: "🔐", route: "/app-permissions" },
      { key: "student_app_reports", name: "Analytics and Reports", icon: "📊", route: "/student-app-analytics-reports" },
    ],
  },
  {
    key: "hr_staff",
    name: "HR & Staff Management",
    icon: "👨‍🏫",
    desc: "Manage staff, departments, positions, salary and documents",
    path: "/staff-control",
    subModules: [
      { key: "department_management", name: "Department Management", icon: "🏢", route: "/department-management" },
      { key: "position_management", name: "Position Management", icon: "🎯", route: "/position-management" },
      { key: "staff_management", name: "Staff Management", icon: "👨‍🏫", route: "/staff-management" },
      { key: "leave_management", name: "Leave Management", icon: "📅", route: "/leave-management" },
      { key: "salary_management", name: "Salary Management", icon: "💰", route: "/salary-management" },
      { key: "staff_reports", name: "Analytics and Reports", icon: "📊", route: "/staff-analytics-reports" },
    ],
  },
  {
    key: "exam_tools",
    name: "Exam Tools",
    icon: "🧾",
    desc: "Manage exams, timetable and admit cards",
    path: "/exam-tools",
    subModules: [
      { key: "exam_setup", name: "Exam Setup", icon: "🧾", route: "/exam-setup" },
      { key: "exam_marks_setup", name: "Exam Marks Setup", icon: "📘", route: "/exam-marks-setup" },
      { key: "exam_timetable", name: "Exam Timetable", icon: "🗓️", route: "/exam-timetable" },
      { key: "admit_card", name: "Admit Card and Deskslip", icon: "🎫", route: "/admit-card" },
    ],
  },
  {
    key: "report_cards",
    name: "Report Card Management",
    icon: "📄",
    desc: "Manage marks entry, result generation and report cards",
    path: "/report-card-management",
    subModules: [
      { key: "scholastic_marks_entry", name: "Scholastic Marks Entry", icon: "✍️", route: "/scholastic-marks-entry" },
      { key: "co_scholastic_marks_entry", name: "Co-Scholastic Marks Entry", icon: "🎨", route: "/co-scholastic-marks-entry" },
      { key: "result_generation", name: "Result Generation", icon: "⚙️", route: "/result-generation" },
      { key: "report_cards_view", name: "Report Cards", icon: "📄", route: "/report-cards" },
      { key: "report_card_analytics", name: "Analytics and Reports", icon: "📊", route: "/analytics-reports" },
    ],
  },
];

export const getDefaultSubModulesMap = () => {
  const result = {};
  MODULES_REGISTRY.forEach((mod) => {
    result[mod.key] = (mod.subModules || []).map((s) => s.key);
  });
  return result;
};

export const TOTAL_SUB_MODULES_COUNT = MODULES_REGISTRY.reduce(
  (sum, mod) => sum + (mod.subModules ? mod.subModules.length : 0),
  0
);
