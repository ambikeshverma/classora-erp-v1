import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import SuperAdminProtectedRoute from "./components/SuperAdminProtectedRoute";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import SubModulePlaceholder from "./components/SubModulePlaceholder";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

// Module Hub Pages
import UserControl from "./pages/UserControl";
import AdminPanel from "./pages/AdminPanel";
import Admissions from "./pages/Admissions";
import ReceptionDesk from "./pages/ReceptionDesk";
import StudentHub from "./pages/StudentHub";
import AcademicZone from "./pages/AcademicZone";
import AttendanceSystem from "./pages/AttendanceSystem";
import FeeManager from "./pages/FeeManager";
import TransportSystem from "./pages/TransportSystem";
import FinanceManager from "./pages/FinanceManager";
import StudentAppAccess from "./pages/StudentAppAccess";
import HRStaffManagement from "./pages/HRStaffManagement";
import ExamTools from "./pages/ExamTools";
import ReportCardManagement from "./pages/ReportCardManagement";

// Sub-Module Pages
import UserManagement from "./pages/UserManagement";
import ClassTeacherAssignment from "./pages/ClassTeacherAssignment";
import SubjectTeacherAssignment from "./pages/SubjectTeacherAssignment";

import FeeScheme from "./pages/FeeScheme";
import FeePlanNameSetup from "./pages/FeePlanNameSetup";
import FeePlanManagement from "./pages/FeePlanManagement";
import ConcessionManagement from "./pages/ConcessionManagement";
import SubscriptionBilling from "./pages/SubscriptionBilling";
import AdminReports from "./pages/adminpanel/AdminReports";

import NewAdmission from "./pages/NewAdmission";
import AdmissionEnquiries from "./pages/AdmissionEnquiries";

import AdmissionBulkImport from "./pages/AdmissionBulkImport";
import EnquirySources from "./pages/EnquirySources";
import FollowUpManagement from "./pages/FollowUpManagement";
import GatePassManagement from "./pages/GatePassManagement";
import StudentIDManagement from "./pages/StudentIDManagement";
import ParentIDManagement from "./pages/ParentIDManagement";
import AppointmentScheduling from "./pages/AppointmentScheduling";
import VisitorManagement from "./pages/VisitorManagement";
import SupportComplaint from "./pages/SupportComplaint";
import ReceptionReports from "./pages/reception/ReceptionReports";

import ClassManagement from "./pages/ClassManagement";
import SectionManagement from "./pages/SectionManagement";
import MediumManagement from "./pages/MediumManagement";
import HouseManagement from "./pages/HouseManagement";
import HouseAllocation from "./pages/HouseAllocation";
import SiblingManagement from "./pages/SiblingManagement";
import SearchStudent from "./pages/SearchStudent";
import InactiveStudents from "./pages/InactiveStudents";
import StudentDocuments from "./pages/StudentDocuments";
import RollNumberUpdate from "./pages/RollNumberUpdate";
import SectionTransfer from "./pages/SectionTransfer";
import PromotionManagement from "./pages/PromotionManagement";
import AlumniManagement from "./pages/AlumniManagement";
import BulkStudentUpdate from "./pages/BulkStudentUpdate";
import DataExport from "./pages/DataExport";
import StudentReports from "./pages/student/StudentReports";

import SubjectSetup from "./pages/SubjectSetup";
import CoScholasticSubjectSetup from "./pages/CoScholasticSubjectSetup";
import ClassSubjectMapping from "./pages/ClassSubjectMapping";
import StudentSubjectMapping from "./pages/StudentSubjectMapping";
import AcademicReports from "./pages/academic/AcademicReports";

import StudentAttendance from "./pages/StudentAttendance";
import StaffAttendance from "./pages/StaffAttendance";
import BulkAttendanceEntry from "./pages/BulkAttendanceEntry";
import AttendanceReports from "./pages/attendance/AttendanceReports";

import FeeCollection from "./pages/FeeCollection";

import RouteManagement from "./pages/RouteManagement";
import VehicleManagement from "./pages/VehicleManagement";
import StudentTransportAllocation from "./pages/StudentTransportAllocation";
import TransportReports from "./pages/transport/TransportReports";

import AccountGroups from "./pages/AccountGroups";
import AccountHeads from "./pages/AccountHeads";
import IncomeEntry from "./pages/IncomeEntry";
import ExpenseEntry from "./pages/ExpenseEntry";
import FinanceReports from "./pages/finance/FinanceReports";

import StudentLoginManagement from "./pages/StudentLoginManagement";
import AppBanners from "./pages/AppBanners";
import AppNews from "./pages/AppNews";
import AppNoticeBoard from "./pages/AppNoticeBoard";
import FeeDueNotice from "./pages/FeeDueNotice";

import DepartmentManagement from "./pages/DepartmentManagement";
import PositionManagement from "./pages/PositionManagement";
import StaffManagement from "./pages/StaffManagement";
import LeaveManagement from "./pages/LeaveManagement";
import SalaryManagement from "./pages/SalaryManagement";
import HRReports from "./pages/hr/HRReports";

import ExamSetup from "./pages/ExamSetup";
import ExamMarksSetup from "./pages/ExamMarksSetup";
import ExamTimetable from "./pages/ExamTimetable";

import ScholasticMarksEntry from "./pages/ScholasticMarksEntry";
import CoScholasticMarksEntry from "./pages/CoScholasticMarksEntry";
import ResultGeneration from "./pages/ResultGeneration";
import ReportCards from "./pages/ReportCards";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Authentication Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/super-admin/login" element={<SuperAdminLogin />} />

        {/* Super Admin Protected Governance Portal */}
        <Route
          path="/super-admin"
          element={
            <SuperAdminProtectedRoute>
              <SuperAdminDashboard />
            </SuperAdminProtectedRoute>
          }
        />

        {/* School Protected Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* ========================================================
            1. USER CONTROL MODULE
        ======================================================== */}
        <Route
          path="/user-control"
          element={
            <ProtectedRoute moduleKey="user_control">
              <UserControl />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user-management"
          element={
            <ProtectedRoute moduleKey="user_control" subModuleKey="user_management">
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/class-teacher-assignment"
          element={
            <ProtectedRoute moduleKey="user_control" subModuleKey="class_teacher_assignment">
              <ClassTeacherAssignment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subject-teacher-assignment"
          element={
            <ProtectedRoute moduleKey="user_control" subModuleKey="subject_teacher_assignment">
              <SubjectTeacherAssignment />
            </ProtectedRoute>
          }
        />

        {/* ========================================================
            2. ADMIN PANEL MODULE
        ======================================================== */}
        <Route
          path="/admin-panel"
          element={
            <ProtectedRoute moduleKey="admin_panel">
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fee-scheme"
          element={
            <ProtectedRoute moduleKey="admin_panel" subModuleKey="fee_scheme">
              <FeeScheme />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fee-plan-name-setup"
          element={
            <ProtectedRoute moduleKey="admin_panel" subModuleKey="fee_plan_name_setup">
              <FeePlanNameSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fee-plan-management"
          element={
            <ProtectedRoute moduleKey="admin_panel" subModuleKey="fee_plan_management">
              <FeePlanManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/concession-management"
          element={
            <ProtectedRoute moduleKey="admin_panel" subModuleKey="concession_management">
              <ConcessionManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscription-billing"
          element={
            <ProtectedRoute moduleKey="admin_panel" subModuleKey="subscription_billing">
              <SubscriptionBilling />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-reports"
          element={
            <ProtectedRoute moduleKey="admin_panel" subModuleKey="admin_reports">
              <AdminReports />
            </ProtectedRoute>
          }
        />

        {/* ========================================================
            3. ADMISSIONS MODULE
        ======================================================== */}
        <Route
          path="/admissions"
          element={
            <ProtectedRoute moduleKey="admissions">
              <Admissions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admission/new"
          element={
            <ProtectedRoute moduleKey="admissions" subModuleKey="new_admission">
              <NewAdmission />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admission-enquiries"
          element={
            <ProtectedRoute moduleKey="admissions" subModuleKey="admission_enquiries">
              <AdmissionEnquiries />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admission-bulk-import"
          element={
            <ProtectedRoute moduleKey="admissions" subModuleKey="admission_bulk_import">
              <AdmissionBulkImport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admission-analytics-reports"
          element={
            <ProtectedRoute moduleKey="admissions" subModuleKey="admission_analytics_reports">
              <SubModulePlaceholder
                title="Analytics & Reports"
                moduleName="Admissions"
                icon="📊"
                backRoute="/admissions"
              />
            </ProtectedRoute>
          }
        />

        {/* ========================================================
            4. RECEPTION DESK MODULE
        ======================================================== */}
        <Route
          path="/reception-desk"
          element={
            <ProtectedRoute moduleKey="reception">
              <ReceptionDesk />
            </ProtectedRoute>
          }
        />
        <Route
          path="/enquiry-sources"
          element={
            <ProtectedRoute moduleKey="reception" subModuleKey="enquiry_sources">
              <EnquirySources />
            </ProtectedRoute>
          }
        />
        <Route
          path="/follow-up-management"
          element={
            <ProtectedRoute moduleKey="reception" subModuleKey="follow_up_management">
              <FollowUpManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gate-pass-management"
          element={
            <ProtectedRoute moduleKey="reception" subModuleKey="gate_pass_management">
              <GatePassManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-id-management"
          element={
            <ProtectedRoute moduleKey="reception" subModuleKey="student_id_management">
              <StudentIDManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent-id-management"
          element={
            <ProtectedRoute moduleKey="reception" subModuleKey="parent_id_management">
              <ParentIDManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointment-scheduling"
          element={
            <ProtectedRoute moduleKey="reception" subModuleKey="appointment_scheduling">
              <AppointmentScheduling />
            </ProtectedRoute>
          }
        />
        <Route
          path="/visitor-management"
          element={
            <ProtectedRoute moduleKey="reception" subModuleKey="visitor_management">
              <VisitorManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/support-complaint"
          element={
            <ProtectedRoute moduleKey="reception" subModuleKey="support_complaint">
              <SupportComplaint />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reception-reports"
          element={
            <ProtectedRoute moduleKey="reception" subModuleKey="reception_reports">
              <ReceptionReports />
            </ProtectedRoute>
          }
        />

        {/* ========================================================
            5. STUDENT HUB MODULE
        ======================================================== */}
        <Route
          path="/student-hub"
          element={
            <ProtectedRoute moduleKey="student_hub">
              <StudentHub />
            </ProtectedRoute>
          }
        />
        <Route
          path="/class-management"
          element={
            <ProtectedRoute moduleKey="student_hub" subModuleKey="class_management">
              <ClassManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/section-management"
          element={
            <ProtectedRoute moduleKey="student_hub" subModuleKey="section_management">
              <SectionManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/medium-management"
          element={
            <ProtectedRoute moduleKey="student_hub" subModuleKey="medium_management">
              <MediumManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/house-management"
          element={
            <ProtectedRoute moduleKey="student_hub" subModuleKey="house_management">
              <HouseManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/house-allocation"
          element={
            <ProtectedRoute moduleKey="student_hub" subModuleKey="house_allocation">
              <HouseAllocation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sibling-management"
          element={
            <ProtectedRoute moduleKey="student_hub" subModuleKey="sibling_management">
              <SiblingManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-search"
          element={
            <ProtectedRoute moduleKey="student_hub" subModuleKey="student_search">
              <SearchStudent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inactive-students"
          element={
            <ProtectedRoute moduleKey="student_hub" subModuleKey="inactive_students">
              <InactiveStudents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-documents"
          element={
            <ProtectedRoute moduleKey="student_hub" subModuleKey="student_documents">
              <StudentDocuments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/roll-number-update"
          element={
            <ProtectedRoute moduleKey="student_hub" subModuleKey="roll_number_update">
              <RollNumberUpdate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/section-transfer"
          element={
            <ProtectedRoute moduleKey="student_hub" subModuleKey="section_transfer">
              <SectionTransfer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/promotion-management"
          element={
            <ProtectedRoute moduleKey="student_hub" subModuleKey="promotion_management">
              <PromotionManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alumni-management"
          element={
            <ProtectedRoute moduleKey="student_hub" subModuleKey="alumni_management">
              <AlumniManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bulk-student-update"
          element={
            <ProtectedRoute moduleKey="student_hub" subModuleKey="bulk_student_update">
              <BulkStudentUpdate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/data-export"
          element={
            <ProtectedRoute moduleKey="student_hub" subModuleKey="data_export">
              <DataExport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-reports"
          element={
            <ProtectedRoute moduleKey="student_hub" subModuleKey="student_reports">
              <StudentReports />
            </ProtectedRoute>
          }
        />

        {/* ========================================================
            6. ACADEMIC ZONE MODULE
        ======================================================== */}
        <Route
          path="/academic-zone"
          element={
            <ProtectedRoute moduleKey="academic_zone">
              <AcademicZone />
            </ProtectedRoute>
          }
        />
        <Route
          path="/academic-zone/subject-setup"
          element={
            <ProtectedRoute moduleKey="academic_zone" subModuleKey="subject_setup">
              <SubjectSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/co-scholastic-subject-setup"
          element={
            <ProtectedRoute moduleKey="academic_zone" subModuleKey="co_scholastic_subject_setup">
              <CoScholasticSubjectSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/academic-zone/class-subject-mapping"
          element={
            <ProtectedRoute moduleKey="academic_zone" subModuleKey="class_subject_mapping">
              <ClassSubjectMapping />
            </ProtectedRoute>
          }
        />
        <Route
          path="/academic-zone/student-subject-mapping"
          element={
            <ProtectedRoute moduleKey="academic_zone" subModuleKey="student_subject_mapping">
              <StudentSubjectMapping />
            </ProtectedRoute>
          }
        />
        <Route
          path="/academic-zone/reports"
          element={
            <ProtectedRoute moduleKey="academic_zone" subModuleKey="academic_reports">
              <AcademicReports />
            </ProtectedRoute>
          }
        />

        {/* ========================================================
            7. ATTENDANCE SYSTEM MODULE
        ======================================================== */}
        <Route
          path="/attendance-system"
          element={
            <ProtectedRoute moduleKey="attendance">
              <AttendanceSystem />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance-system/student-attendance"
          element={
            <ProtectedRoute moduleKey="attendance" subModuleKey="student_attendance">
              <StudentAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance-system/staff-attendance"
          element={
            <ProtectedRoute moduleKey="attendance" subModuleKey="staff_attendance">
              <StaffAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance-system/bulk-attendance-entry"
          element={
            <ProtectedRoute moduleKey="attendance" subModuleKey="bulk_attendance_entry">
              <BulkAttendanceEntry />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance-system/attendance-analytics"
          element={
            <ProtectedRoute moduleKey="attendance" subModuleKey="attendance_analytics">
              <AttendanceReports />
            </ProtectedRoute>
          }
        />

        {/* ========================================================
            8. FEE MANAGER MODULE
        ======================================================== */}
        <Route
          path="/fee-manager"
          element={
            <ProtectedRoute moduleKey="fee_manager">
              <FeeManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fee-collection"
          element={
            <ProtectedRoute moduleKey="fee_manager" subModuleKey="fee_collection">
              <FeeCollection />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fee-receipt"
          element={
            <ProtectedRoute moduleKey="fee_manager" subModuleKey="fee_receipt">
              <SubModulePlaceholder
                title="Fee Receipt"
                moduleName="Fee Manager"
                icon="🧾"
                backRoute="/fee-manager"
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fee-analytics-reports"
          element={
            <ProtectedRoute moduleKey="fee_manager" subModuleKey="fee_analytics_reports">
              <SubModulePlaceholder
                title="Analytics and Reports"
                moduleName="Fee Manager"
                icon="📊"
                backRoute="/fee-manager"
              />
            </ProtectedRoute>
          }
        />

        {/* ========================================================
            9. TRANSPORT SYSTEM MODULE
        ======================================================== */}
        <Route
          path="/transport-system"
          element={
            <ProtectedRoute moduleKey="transport">
              <TransportSystem />
            </ProtectedRoute>
          }
        />
        <Route
          path="/route-management"
          element={
            <ProtectedRoute moduleKey="transport" subModuleKey="route_management">
              <RouteManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicle-management"
          element={
            <ProtectedRoute moduleKey="transport" subModuleKey="vehicle_management">
              <VehicleManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-transport-allocation"
          element={
            <ProtectedRoute moduleKey="transport" subModuleKey="student_transport_allocation">
              <StudentTransportAllocation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transport-analytics-reports"
          element={
            <ProtectedRoute moduleKey="transport" subModuleKey="transport_reports">
              <TransportReports />
            </ProtectedRoute>
          }
        />

        {/* ========================================================
            10. FINANCE MANAGER MODULE
        ======================================================== */}
        <Route
          path="/finance-manager"
          element={
            <ProtectedRoute moduleKey="finance">
              <FinanceManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account-groups"
          element={
            <ProtectedRoute moduleKey="finance" subModuleKey="account_groups">
              <AccountGroups />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account-heads"
          element={
            <ProtectedRoute moduleKey="finance" subModuleKey="account_heads">
              <AccountHeads />
            </ProtectedRoute>
          }
        />
        <Route
          path="/income-entry"
          element={
            <ProtectedRoute moduleKey="finance" subModuleKey="income_entry">
              <IncomeEntry />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expense-entry"
          element={
            <ProtectedRoute moduleKey="finance" subModuleKey="expense_entry">
              <ExpenseEntry />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance-manager/reports"
          element={
            <ProtectedRoute moduleKey="finance" subModuleKey="finance_reports">
              <FinanceReports />
            </ProtectedRoute>
          }
        />

        {/* ========================================================
            11. STUDENT APP ACCESS MODULE
        ======================================================== */}
        <Route
          path="/student-app-access"
          element={
            <ProtectedRoute moduleKey="student_app_access">
              <StudentAppAccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-login-management"
          element={
            <ProtectedRoute moduleKey="student_app_access" subModuleKey="student_login_management">
              <StudentLoginManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app-banners"
          element={
            <ProtectedRoute moduleKey="student_app_access" subModuleKey="app_banners">
              <AppBanners />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher-circulars"
          element={
            <ProtectedRoute moduleKey="student_app_access" subModuleKey="teacher_circulars">
              <SubModulePlaceholder
                title="Teacher Circulars"
                moduleName="Student App Access"
                icon="📢"
                backRoute="/student-app-access"
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app-news"
          element={
            <ProtectedRoute moduleKey="student_app_access" subModuleKey="app_news">
              <AppNews />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app-notice-board"
          element={
            <ProtectedRoute moduleKey="student_app_access" subModuleKey="app_notice_board">
              <AppNoticeBoard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fee-due-notice"
          element={
            <ProtectedRoute moduleKey="student_app_access" subModuleKey="fee_due_notice">
              <FeeDueNotice />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app-permissions"
          element={
            <ProtectedRoute moduleKey="student_app_access" subModuleKey="app_permissions">
              <SubModulePlaceholder
                title="App Permissions"
                moduleName="Student App Access"
                icon="🔐"
                backRoute="/student-app-access"
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-app-analytics-reports"
          element={
            <ProtectedRoute moduleKey="student_app_access" subModuleKey="student_app_reports">
              <SubModulePlaceholder
                title="Analytics and Reports"
                moduleName="Student App Access"
                icon="📊"
                backRoute="/student-app-access"
              />
            </ProtectedRoute>
          }
        />

        {/* ========================================================
            12. HR & STAFF MANAGEMENT MODULE
        ======================================================== */}
        <Route
          path="/staff-control"
          element={
            <ProtectedRoute moduleKey="hr_staff">
              <HRStaffManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/department-management"
          element={
            <ProtectedRoute moduleKey="hr_staff" subModuleKey="department_management">
              <DepartmentManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/position-management"
          element={
            <ProtectedRoute moduleKey="hr_staff" subModuleKey="position_management">
              <PositionManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff-management"
          element={
            <ProtectedRoute moduleKey="hr_staff" subModuleKey="staff_management">
              <StaffManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leave-management"
          element={
            <ProtectedRoute moduleKey="hr_staff" subModuleKey="leave_management">
              <LeaveManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/salary-management"
          element={
            <ProtectedRoute moduleKey="hr_staff" subModuleKey="salary_management">
              <SalaryManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff-analytics-reports"
          element={
            <ProtectedRoute moduleKey="hr_staff" subModuleKey="staff_reports">
              <HRReports />
            </ProtectedRoute>
          }
        />

        {/* ========================================================
            13. EXAM TOOLS MODULE
        ======================================================== */}
        <Route
          path="/exam-tools"
          element={
            <ProtectedRoute moduleKey="exam_tools">
              <ExamTools />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exam-setup"
          element={
            <ProtectedRoute moduleKey="exam_tools" subModuleKey="exam_setup">
              <ExamSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exam-marks-setup"
          element={
            <ProtectedRoute moduleKey="exam_tools" subModuleKey="exam_marks_setup">
              <ExamMarksSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exam-timetable"
          element={
            <ProtectedRoute moduleKey="exam_tools" subModuleKey="exam_timetable">
              <ExamTimetable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admit-card"
          element={
            <ProtectedRoute moduleKey="exam_tools" subModuleKey="admit_card">
              <SubModulePlaceholder
                title="Admit Card and Deskslip"
                moduleName="Exam Tools"
                icon="🎫"
                backRoute="/exam-tools"
              />
            </ProtectedRoute>
          }
        />

        {/* ========================================================
            14. REPORT CARD MANAGEMENT MODULE
        ======================================================== */}
        <Route
          path="/report-card-management"
          element={
            <ProtectedRoute moduleKey="report_cards">
              <ReportCardManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scholastic-marks-entry"
          element={
            <ProtectedRoute moduleKey="report_cards" subModuleKey="scholastic_marks_entry">
              <ScholasticMarksEntry />
            </ProtectedRoute>
          }
        />
        <Route
          path="/co-scholastic-marks-entry"
          element={
            <ProtectedRoute moduleKey="report_cards" subModuleKey="co_scholastic_marks_entry">
              <CoScholasticMarksEntry />
            </ProtectedRoute>
          }
        />
        <Route
          path="/result-generation"
          element={
            <ProtectedRoute moduleKey="report_cards" subModuleKey="result_generation">
              <ResultGeneration />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report-cards"
          element={
            <ProtectedRoute moduleKey="report_cards" subModuleKey="report_cards_view">
              <ReportCards />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics-reports"
          element={
            <ProtectedRoute moduleKey="report_cards" subModuleKey="report_card_analytics">
              <SubModulePlaceholder
                title="Analytics and Reports"
                moduleName="Report Card Management"
                icon="📊"
                backRoute="/report-card-management"
              />
            </ProtectedRoute>
          }
        />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;