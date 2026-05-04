import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import StudentHub from "./pages/StudentHub";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdmissionDashboard from "./pages/AdmissionDashboard";
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
import AcademicAnalytics from "./pages/AcademicAnalytics";
function App() {
  return (
    <BrowserRouter> {/* 👈 ये missing था */}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admission" element={<AdmissionDashboard />} />
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
        <Route path="/academic-zone/reports" element={<AcademicAnalytics />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;