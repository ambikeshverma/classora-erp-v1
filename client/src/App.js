import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import SuperAdminProtectedRoute from "./components/SuperAdminProtectedRoute";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";

import StudentHub from "./pages/StudentHub";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Admissions from "./pages/Admissions";
import NewAdmission from "./pages/NewAdmission";
import AdminPanel from "./pages/AdminPanel";
import ReceptionDesk from "./pages/ReceptionDesk";
import AcademicZone from "./pages/AcademicZone";
import TransportSystem from "./pages/TransportSystem";
import FinanceManager from "./pages/FinanceManager";
import HRStaffManagement from "./pages/HRStaffManagement";
import ExamTools from "./pages/ExamTools";
import ReportCardManagement from "./pages/ReportCardManagement";
import StudentAppAccess from "./pages/StudentAppAccess";
import UserControl from "./pages/UserControl";
import AttendanceSystem from "./pages/AttendanceSystem";
import FeeManager from "./pages/FeeManager";
import SubjectSetup from "./pages/SubjectSetup";
import ClassSubjectMapping from "./pages/ClassSubjectMapping";
import StudentSubjectMapping from "./pages/StudentSubjectMapping";
import AccountGroups from "./pages/AccountGroups";
import AccountHeads from "./pages/AccountHeads";
import IncomeEntry from "./pages/IncomeEntry";
import ExpenseEntry from "./pages/ExpenseEntry";
import EnquirySources from "./pages/EnquirySources";
import AdmissionEnquiries from "./pages/AdmissionEnquiries";
import FollowUpManagement from "./pages/FollowUpManagement";
import StudentIDManagement from "./pages/StudentIDManagement";
import ParentIDManagement from "./pages/ParentIDManagement";
import VisitorManagement from "./pages/VisitorManagement";
import AppointmentScheduling from "./pages/AppointmentScheduling";
import SupportComplaint from "./pages/SupportComplaint";
import ClassManagement from "./pages/ClassManagement";
import SectionManagement from "./pages/SectionManagement";
import MediumManagement from "./pages/MediumManagement";
import HouseManagement from "./pages/HouseManagement";
import HouseAllocation from "./pages/HouseAllocation";
import SiblingManagement from "./pages/SiblingManagement";
import StudentDocuments from "./pages/StudentDocuments";
import RollNumberUpdate from "./pages/RollNumberUpdate";
import SectionTransfer from "./pages/SectionTransfer";
import PromotionManagement from "./pages/PromotionManagement";
import AlumniManagement from "./pages/AlumniManagement";
import InactiveStudents from "./pages/InactiveStudents";
import SearchStudent from "./pages/SearchStudent";
import RouteManagement from "./pages/RouteManagement";
import VehicleManagement from "./pages/VehicleManagement";
import StudentTransportAllocation from "./pages/StudentTransportAllocation";
import FeeScheme from "./pages/FeeScheme";
import FeePlanNameSetup from "./pages/FeePlanNameSetup";
import FeePlanManagement from "./pages/FeePlanManagement";
import SubscriptionBilling from "./pages/SubscriptionBilling";
import DepartmentManagement from "./pages/DepartmentManagement";
import PositionManagement from "./pages/PositionManagement";
import StaffManagement from "./pages/StaffManagement";
import LeaveManagement from "./pages/LeaveManagement";
import SalaryManagement from "./pages/SalaryManagement";
import ExamSetup from "./pages/ExamSetup";
import ExamTimetable from "./pages/ExamTimetable";
import ExamMarksSetup from "./pages/ExamMarksSetup";
import ScholasticMarksEntry from "./pages/ScholasticMarksEntry";
import CoScholasticSubjectSetup from "./pages/CoScholasticSubjectSetup";
import CoScholasticMarksEntry from "./pages/CoScholasticMarksEntry";
import ResultGeneration from "./pages/ResultGeneration";
import ReportCards from "./pages/ReportCards";
import ClassTeacherAssignment from "./pages/ClassTeacherAssignment";
import SubjectTeacherAssignment from "./pages/SubjectTeacherAssignment";
import UserManagement from "./pages/UserManagement";
import FeeCollection from "./pages/FeeCollection";
import ConcessionManagement from "./pages/ConcessionManagement";
import AppBanners from "./pages/AppBanners";
import AppNoticeBoard from "./pages/AppNoticeBoard";
import AppNews from "./pages/AppNews";
import FeeDueNotice from "./pages/FeeDueNotice";
import StudentLoginManagement from "./pages/StudentLoginManagement";
import StudentAttendance from "./pages/StudentAttendance";
import BulkAttendanceEntry from "./pages/BulkAttendanceEntry";
import StaffAttendance from "./pages/StaffAttendance";
import AcademicReports from "./pages/academic/AcademicReports";
import FinanceReports from "./pages/finance/FinanceReports";
import HRReports from "./pages/hr/HRReports";
import AttendanceReports from "./pages/attendance/AttendanceReports";
import ReceptionReports from "./pages/reception/ReceptionReports";
import StudentReports from "./pages/student/StudentReports";
import TransportReports from "./pages/transport/TransportReports";
import AdminReports from "./pages/adminpanel/AdminReports";

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

        {/* Admissions Module */}
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
            <ProtectedRoute moduleKey="admissions">
              <NewAdmission />
            </ProtectedRoute>
          }
        />
        <Route
          path="/enquiry-sources"
          element={
            <ProtectedRoute moduleKey="admissions">
              <EnquirySources />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admission-enquiries"
          element={
            <ProtectedRoute moduleKey="admissions">
              <AdmissionEnquiries />
            </ProtectedRoute>
          }
        />
        <Route
          path="/follow-up-management"
          element={
            <ProtectedRoute moduleKey="admissions">
              <FollowUpManagement />
            </ProtectedRoute>
          }
        />

        {/* Student Hub Module */}
        <Route
          path="/student-hub"
          element={
            <ProtectedRoute moduleKey="student_hub">
              <StudentHub />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-id-management"
          element={
            <ProtectedRoute moduleKey="student_hub">
              <StudentIDManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent-id-management"
          element={
            <ProtectedRoute moduleKey="student_hub">
              <ParentIDManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/house-management"
          element={
            <ProtectedRoute moduleKey="student_hub">
              <HouseManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/house-allocation"
          element={
            <ProtectedRoute moduleKey="student_hub">
              <HouseAllocation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sibling-management"
          element={
            <ProtectedRoute moduleKey="student_hub">
              <SiblingManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-documents"
          element={
            <ProtectedRoute moduleKey="student_hub">
              <StudentDocuments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/roll-number-update"
          element={
            <ProtectedRoute moduleKey="student_hub">
              <RollNumberUpdate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/section-transfer"
          element={
            <ProtectedRoute moduleKey="student_hub">
              <SectionTransfer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/promotion-management"
          element={
            <ProtectedRoute moduleKey="student_hub">
              <PromotionManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alumni-management"
          element={
            <ProtectedRoute moduleKey="student_hub">
              <AlumniManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inactive-students"
          element={
            <ProtectedRoute moduleKey="student_hub">
              <InactiveStudents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-search"
          element={
            <ProtectedRoute moduleKey="student_hub">
              <SearchStudent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-reports"
          element={
            <ProtectedRoute moduleKey="student_hub">
              <StudentReports />
            </ProtectedRoute>
          }
        />

        {/* Academic Zone Module */}
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
            <ProtectedRoute moduleKey="academic_zone">
              <SubjectSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/academic-zone/class-subject-mapping"
          element={
            <ProtectedRoute moduleKey="academic_zone">
              <ClassSubjectMapping />
            </ProtectedRoute>
          }
        />
        <Route
          path="/academic-zone/student-subject-mapping"
          element={
            <ProtectedRoute moduleKey="academic_zone">
              <StudentSubjectMapping />
            </ProtectedRoute>
          }
        />
        <Route
          path="/class-management"
          element={
            <ProtectedRoute moduleKey="academic_zone">
              <ClassManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/section-management"
          element={
            <ProtectedRoute moduleKey="academic_zone">
              <SectionManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/medium-management"
          element={
            <ProtectedRoute moduleKey="academic_zone">
              <MediumManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/class-teacher-assignment"
          element={
            <ProtectedRoute moduleKey="academic_zone">
              <ClassTeacherAssignment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subject-teacher-assignment"
          element={
            <ProtectedRoute moduleKey="academic_zone">
              <SubjectTeacherAssignment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/academic-zone/reports"
          element={
            <ProtectedRoute moduleKey="academic_zone">
              <AcademicReports />
            </ProtectedRoute>
          }
        />

        {/* Attendance System Module */}
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
            <ProtectedRoute moduleKey="attendance">
              <StudentAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance-system/bulk-attendance-entry"
          element={
            <ProtectedRoute moduleKey="attendance">
              <BulkAttendanceEntry />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance-system/staff-attendance"
          element={
            <ProtectedRoute moduleKey="attendance">
              <StaffAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance-system/attendance-analytics"
          element={
            <ProtectedRoute moduleKey="attendance">
              <AttendanceReports />
            </ProtectedRoute>
          }
        />

        {/* Fee Management Module */}
        <Route
          path="/fee-manager"
          element={
            <ProtectedRoute moduleKey="fee_manager">
              <FeeManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fee-scheme"
          element={
            <ProtectedRoute moduleKey="fee_manager">
              <FeeScheme />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fee-plan-name-setup"
          element={
            <ProtectedRoute moduleKey="fee_manager">
              <FeePlanNameSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fee-plan-management"
          element={
            <ProtectedRoute moduleKey="fee_manager">
              <FeePlanManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fee-collection"
          element={
            <ProtectedRoute moduleKey="fee_manager">
              <FeeCollection />
            </ProtectedRoute>
          }
        />
        <Route
          path="/concession-management"
          element={
            <ProtectedRoute moduleKey="fee_manager">
              <ConcessionManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fee-due-notice"
          element={
            <ProtectedRoute moduleKey="fee_manager">
              <FeeDueNotice />
            </ProtectedRoute>
          }
        />

        {/* Transport System Module */}
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
            <ProtectedRoute moduleKey="transport">
              <RouteManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicle-management"
          element={
            <ProtectedRoute moduleKey="transport">
              <VehicleManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-transport-allocation"
          element={
            <ProtectedRoute moduleKey="transport">
              <StudentTransportAllocation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transport-analytics-reports"
          element={
            <ProtectedRoute moduleKey="transport">
              <TransportReports />
            </ProtectedRoute>
          }
        />

        {/* Finance Manager Module */}
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
            <ProtectedRoute moduleKey="finance">
              <AccountGroups />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account-heads"
          element={
            <ProtectedRoute moduleKey="finance">
              <AccountHeads />
            </ProtectedRoute>
          }
        />
        <Route
          path="/income-entry"
          element={
            <ProtectedRoute moduleKey="finance">
              <IncomeEntry />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expense-entry"
          element={
            <ProtectedRoute moduleKey="finance">
              <ExpenseEntry />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscription-billing"
          element={
            <ProtectedRoute moduleKey="finance">
              <SubscriptionBilling />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance-manager/reports"
          element={
            <ProtectedRoute moduleKey="finance">
              <FinanceReports />
            </ProtectedRoute>
          }
        />

        {/* HR & Staff Management Module */}
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
            <ProtectedRoute moduleKey="hr_staff">
              <DepartmentManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/position-management"
          element={
            <ProtectedRoute moduleKey="hr_staff">
              <PositionManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff-management"
          element={
            <ProtectedRoute moduleKey="hr_staff">
              <StaffManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leave-management"
          element={
            <ProtectedRoute moduleKey="hr_staff">
              <LeaveManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/salary-management"
          element={
            <ProtectedRoute moduleKey="hr_staff">
              <SalaryManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff-analytics-reports"
          element={
            <ProtectedRoute moduleKey="hr_staff">
              <HRReports />
            </ProtectedRoute>
          }
        />

        {/* Exam Tools & Report Cards */}
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
            <ProtectedRoute moduleKey="exam_tools">
              <ExamSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exam-timetable"
          element={
            <ProtectedRoute moduleKey="exam_tools">
              <ExamTimetable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exam-marks-setup"
          element={
            <ProtectedRoute moduleKey="exam_tools">
              <ExamMarksSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scholastic-marks-entry"
          element={
            <ProtectedRoute moduleKey="exam_tools">
              <ScholasticMarksEntry />
            </ProtectedRoute>
          }
        />
        <Route
          path="/co-scholastic-subject-setup"
          element={
            <ProtectedRoute moduleKey="exam_tools">
              <CoScholasticSubjectSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/co-scholastic-marks-entry"
          element={
            <ProtectedRoute moduleKey="exam_tools">
              <CoScholasticMarksEntry />
            </ProtectedRoute>
          }
        />
        <Route
          path="/result-generation"
          element={
            <ProtectedRoute moduleKey="report_cards">
              <ResultGeneration />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report-cards"
          element={
            <ProtectedRoute moduleKey="report_cards">
              <ReportCards />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report-card-management"
          element={
            <ProtectedRoute moduleKey="report_cards">
              <ReportCardManagement />
            </ProtectedRoute>
          }
        />

        {/* Reception Desk Module */}
        <Route
          path="/reception-desk"
          element={
            <ProtectedRoute moduleKey="reception">
              <ReceptionDesk />
            </ProtectedRoute>
          }
        />
        <Route
          path="/visitor-management"
          element={
            <ProtectedRoute moduleKey="reception">
              <VisitorManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointment-scheduling"
          element={
            <ProtectedRoute moduleKey="reception">
              <AppointmentScheduling />
            </ProtectedRoute>
          }
        />
        <Route
          path="/support-complaint"
          element={
            <ProtectedRoute moduleKey="reception">
              <SupportComplaint />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reception-reports"
          element={
            <ProtectedRoute moduleKey="reception">
              <ReceptionReports />
            </ProtectedRoute>
          }
        />

        {/* Student Mobile App Access */}
        <Route
          path="/student-app-access"
          element={
            <ProtectedRoute moduleKey="student_app_access">
              <StudentAppAccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app-banners"
          element={
            <ProtectedRoute moduleKey="student_app_access">
              <AppBanners />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app-notice-board"
          element={
            <ProtectedRoute moduleKey="student_app_access">
              <AppNoticeBoard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app-news"
          element={
            <ProtectedRoute moduleKey="student_app_access">
              <AppNews />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-login-management"
          element={
            <ProtectedRoute moduleKey="student_app_access">
              <StudentLoginManagement />
            </ProtectedRoute>
          }
        />

        {/* User Control & Admin Panel */}
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
            <ProtectedRoute moduleKey="user_control">
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-panel"
          element={
            <ProtectedRoute moduleKey="admin_panel">
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-reports"
          element={
            <ProtectedRoute moduleKey="admin_panel">
              <AdminReports />
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