import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import SuperAdminDashboard from "./pages/SuperAdminDashboard"

function App() {
  return (
    <BrowserRouter> {/* 👈 ये missing था */}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admissions" element={<Admissions />} />
        <Route path="/admission/new" element={<NewAdmission />} />
        <Route path="/student-hub" element={<StudentHub />} />
        <Route path="/admin-panel" element={<AdminPanel />} />
        <Route path="/reception-desk" element={<ReceptionDesk />} />
        <Route path="/academic-zone" element={<AcademicZone />} />
        <Route path="/transport-system" element={<TransportSystem />} />
        <Route path="/finance-manager" element={<FinanceManager />} />
        <Route path="/staff-control" element={<HRStaffManagement />} />
        <Route path="/exam-tools" element={<ExamTools />} />
        <Route path="/report-card-management" element={<ReportCardManagement />} />
        <Route path="/student-app-access" element={<StudentAppAccess />} />
        <Route path="/user-control" element={<UserControl />} />
        <Route path="/attendance-system" element={<AttendanceSystem />} />
        <Route path="/fee-manager" element={<FeeManager />} />
        <Route path="/academic-zone/subject-setup" element={<SubjectSetup />} />
        <Route path="/academic-zone/class-subject-mapping" element={<ClassSubjectMapping />} />
        <Route path="/academic-zone/student-subject-mapping" element={<StudentSubjectMapping />} />
        <Route path="/account-groups" element={<AccountGroups />} /> 
        <Route path="/account-heads" element={<AccountHeads />} />
        <Route path="/income-entry" element={<IncomeEntry />} />
        <Route path="/expense-entry" element={<ExpenseEntry />} />
        <Route path="/enquiry-sources" element={<EnquirySources />} />
        <Route path="/admission-enquiries" element={<AdmissionEnquiries />} />
        <Route path="/follow-up-management" element={<FollowUpManagement />} />
        <Route path="/student-id-management" element={<StudentIDManagement />} />
        <Route path="/parent-id-management" element={<ParentIDManagement />} />
        <Route path="/visitor-management" element={<VisitorManagement />} />
        <Route path="/appointment-scheduling" element={<AppointmentScheduling />} />
        <Route path="/support-complaint" element={<SupportComplaint />} />
        <Route path="/class-management" element={<ClassManagement />} />
        <Route path="/section-management" element={<SectionManagement />} />
        <Route path="/medium-management" element={<MediumManagement />} />
        <Route path="/house-management" element={<HouseManagement />} />
        <Route path="/house-allocation" element={<HouseAllocation />} />
        <Route path="/sibling-management" element={<SiblingManagement />} />
        <Route path="/student-documents" element={<StudentDocuments />} />
        <Route path="/roll-number-update" element={<RollNumberUpdate />} />
        <Route path="/section-transfer" element={<SectionTransfer />} />
        <Route path="/promotion-management" element={<PromotionManagement />} />
        <Route path="/alumni-management" element={<AlumniManagement />} />
        <Route path="/inactive-students" element={<InactiveStudents />} />
        <Route path="/student-search" element={<SearchStudent />} />
        <Route path="/route-management" element={<RouteManagement />} />
        <Route path="/vehicle-management" element={<VehicleManagement />} />
        <Route path="/student-transport-allocation" element={<StudentTransportAllocation />} />
        <Route path="/fee-scheme" element={<FeeScheme />} />
        <Route path="/fee-plan-name-setup" element={<FeePlanNameSetup />} />
        <Route path="/fee-plan-management" element={<FeePlanManagement />} />
        <Route path="/subscription-billing" element={<SubscriptionBilling />} />
        <Route path="/department-management" element={<DepartmentManagement />} />
        <Route path="/position-management" element={<PositionManagement />} />
        <Route path="/staff-management" element={<StaffManagement />} />
        <Route path="/leave-management" element={<LeaveManagement />} />
        <Route path="/salary-management" element={<SalaryManagement />} />
        <Route path="/exam-setup" element={<ExamSetup />} />
        <Route path="/exam-timetable" element={<ExamTimetable />} />
        <Route path="/exam-marks-setup" element={<ExamMarksSetup />} />
        <Route path="/scholastic-marks-entry" element={<ScholasticMarksEntry />} />
        <Route path="/co-scholastic-subject-setup" element={<CoScholasticSubjectSetup />} />
        <Route path="/co-scholastic-marks-entry" element={<CoScholasticMarksEntry />} />
        <Route path="/result-generation" element={<ResultGeneration />} />
        <Route path="/report-cards" element={<ReportCards />} />
        <Route path="/class-teacher-assignment" element={<ClassTeacherAssignment />} />
        <Route path="/subject-teacher-assignment" element={<SubjectTeacherAssignment />} />
        <Route path="/user-management" element={<UserManagement />} />
        <Route path="/fee-collection" element={<FeeCollection />} />
        <Route path="/concession-management" element={<ConcessionManagement />} />
        <Route path="/app-banners" element={<AppBanners />} />
        <Route path="/app-notice-board" element={<AppNoticeBoard />} />
        <Route path="/app-news" element={<AppNews />} />
        <Route path="/fee-due-notice" element={<FeeDueNotice />} />
        <Route path="/student-login-management" element={<StudentLoginManagement />} />
        <Route path="/attendance-system/student-attendance" element={<StudentAttendance />} />
        <Route path="/attendance-system/bulk-attendance-entry" element={<BulkAttendanceEntry />} />
        <Route path="/attendance-system/staff-attendance" element={<StaffAttendance />} />
        <Route path="/academic-zone/reports" element={<AcademicReports />} />
        <Route path="/finance-manager/reports" element={<FinanceReports />} />
        <Route path="/staff-analytics-reports" element={<HRReports />} />
        <Route path="/attendance-system/attendance-analytics" element={<AttendanceReports />} />
        <Route path="/reception-reports" element={<ReceptionReports />} />
        <Route path="/student-reports" element={<StudentReports />} />
        <Route path="/transport-analytics-reports" element={<TransportReports />} />
        <Route path="/admin-reports" element={<AdminReports />} />
        <Route path="/super-admin" element={<SuperAdminDashboard></SuperAdminDashboard>} />


      </Routes>
    </BrowserRouter>
  );
}

export default App;