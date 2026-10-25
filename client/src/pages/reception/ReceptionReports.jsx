import React, { useState, useEffect } from "react";
import MasterReport from "../../components/reports/MasterReport";
import { receptionService } from "../../services/api";

function ReceptionReports() {
  const currentUser = {
    name: localStorage.getItem("userName") || "School Admin",
  };

  const [summaryStats, setSummaryStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    receptionService.getReports()
      .then((res) => setSummaryStats(res.data?.data || null))
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, []);

  // For MasterReport: fetch live data via API for each report's getData
  // eslint-disable-next-line no-unused-vars
  const makeGetData = (fetchFn) => async ({ filters }) => {
    try {
      const params = {};
      if (filters.fromDate) params.visitDate = filters.fromDate; // fallback
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      const res = await fetchFn(params);
      return res.data?.data || [];
    } catch {
      return [];
    }
  };

  const reports = [
    {
      id: "follow-up-report",
      title: "Follow-Up Report",
      description: "View enquiry follow-up records",
      icon: "🔄",
      filters: [
        { name: "followUpStatus", label: "Follow-Up Status", type: "select", placeholder: "All Status", options: ["Interested", "Call Back Later", "No Response", "Not Interested", "Admission Confirmed"] },
        { name: "followUpType", label: "Follow-Up Type", type: "select", placeholder: "All Type", options: ["Call", "WhatsApp", "Visit", "SMS", "Meeting"] },
      ],
      columns: [
        { key: "sno", label: "S.No", render: (_, index) => index + 1 },
        { key: "studentName", label: "Student Name" },
        { key: "mobileNumber", label: "Mobile Number" },
        { key: "classInterested", label: "Class Interested" },
        { key: "followUpDate", label: "Follow-Up Date" },
        { key: "followUpType", label: "Follow-Up Type" },
        { key: "followUpStatus", label: "Follow-Up Status" },
        { key: "nextFollowUpDate", label: "Next Follow-Up Date" },
        { key: "discussionNotes", label: "Discussion Notes" },
      ],
      getData: async ({ filters }) => {
        try {
          const res = await receptionService.getFollowUps();
          let data = res.data?.data || [];
          if (filters.followUpStatus) data = data.filter((f) => f.followUpStatus === filters.followUpStatus);
          if (filters.followUpType) data = data.filter((f) => f.followUpType === filters.followUpType);
          return data;
        } catch { return []; }
      },
    },
    {
      id: "appointment-report",
      title: "Appointment Report",
      description: "View visitor appointment records",
      icon: "📅",
      filters: [
        { name: "appointmentDate", label: "Appointment Date", type: "date" },
        { name: "appointmentStatus", label: "Status", type: "select", placeholder: "All Status", options: ["Pending", "Approved", "Rejected", "Completed", "Cancelled"] },
      ],
      columns: [
        { key: "sno", label: "S.No", render: (_, index) => index + 1 },
        { key: "appointmentId", label: "Appointment ID" },
        { key: "visitorName", label: "Visitor Name" },
        { key: "mobile", label: "Mobile Number" },
        { key: "purpose", label: "Purpose" },
        { key: "departmentName", label: "Department" },
        { key: "personToMeet", label: "Person To Meet" },
        { key: "appointmentDate", label: "Appointment Date" },
        { key: "timeSlot", label: "Time Slot" },
        { key: "status", label: "Status" },
      ],
      getData: async ({ filters }) => {
        try {
          const params = {};
          if (filters.appointmentDate) params.appointmentDate = filters.appointmentDate;
          if (filters.appointmentStatus) params.status = filters.appointmentStatus;
          const res = await receptionService.getAppointments(params);
          return res.data?.data || [];
        } catch { return []; }
      },
    },
    {
      id: "visitor-report",
      title: "Visitor Report",
      description: "View visitor entry and exit records",
      icon: "🛂",
      filters: [
        { name: "visitDate", label: "Visit Date", type: "date" },
        { name: "visitorType", label: "Visitor Type", type: "select", placeholder: "All Type", options: ["Walk-In Visitor", "Appointment Visitor"] },
        { name: "visitorStatus", label: "Visitor Status", type: "select", placeholder: "All Status", options: ["Waiting", "Inside Campus", "Exited", "Cancelled"] },
      ],
      columns: [
        { key: "sno", label: "S.No", render: (_, index) => index + 1 },
        { key: "visitorName", label: "Visitor Name" },
        { key: "visitorType", label: "Visitor Type" },
        { key: "mobile", label: "Mobile Number" },
        { key: "purpose", label: "Purpose" },
        { key: "whomToMeet", label: "Whom To Meet" },
        { key: "visitDate", label: "Visit Date" },
        { key: "inTime", label: "In Time" },
        { key: "outTime", label: "Out Time" },
        { key: "status", label: "Status" },
      ],
      getData: async ({ filters }) => {
        try {
          const params = {};
          if (filters.visitDate) params.visitDate = filters.visitDate;
          if (filters.visitorType) params.visitorType = filters.visitorType;
          if (filters.visitorStatus) params.status = filters.visitorStatus;
          const res = await receptionService.getVisitors(params);
          return res.data?.data || [];
        } catch { return []; }
      },
    },
    {
      id: "gate-pass-report",
      title: "Gate Pass Report",
      description: "View student gate pass records",
      icon: "🚪",
      filters: [
        { name: "passDate", label: "Pass Date", type: "date" },
        { name: "passStatus", label: "Status", type: "select", placeholder: "All Status", options: ["Issued", "Returned", "Cancelled"] },
      ],
      columns: [
        { key: "sno", label: "S.No", render: (_, index) => index + 1 },
        { key: "passNumber", label: "Pass No" },
        { key: "studentName", label: "Student Name" },
        { key: "className", label: "Class" },
        { key: "guardianName", label: "Guardian" },
        { key: "reason", label: "Reason" },
        { key: "passDate", label: "Pass Date" },
        { key: "outTime", label: "Out Time" },
        { key: "inTime", label: "In Time" },
        { key: "status", label: "Status" },
      ],
      getData: async ({ filters }) => {
        try {
          const params = {};
          if (filters.passDate) params.passDate = filters.passDate;
          if (filters.passStatus) params.status = filters.passStatus;
          const res = await receptionService.getGatePasses(params);
          return res.data?.data || [];
        } catch { return []; }
      },
    },
    {
      id: "support-complaint-report",
      title: "Support & Complaint Report",
      description: "View guardian complaints and support tickets",
      icon: "🛠️",
      filters: [
        { name: "complaintDate", label: "Complaint Date", type: "date" },
        { name: "complaintStatus", label: "Status", type: "select", placeholder: "All Status", options: ["Open", "In Progress", "Resolved", "Closed", "Rejected"] },
        { name: "priority", label: "Priority", type: "select", placeholder: "All Priority", options: ["Low", "Medium", "High", "Urgent"] },
        { name: "complaintCategory", label: "Category", type: "select", placeholder: "All Category", options: ["Fee Issue", "Transport", "Teacher Behaviour", "Academic", "App/ERP Issue", "Examination", "Result", "Admission", "Discipline", "Other"] },
      ],
      columns: [
        { key: "sno", label: "S.No", render: (_, index) => index + 1 },
        { key: "complaintId", label: "Complaint ID" },
        { key: "guardianName", label: "Guardian Name" },
        { key: "studentName", label: "Student Name" },
        { key: "mobile", label: "Mobile Number" },
        { key: "category", label: "Category" },
        { key: "priority", label: "Priority" },
        { key: "assignedUser", label: "Assigned To" },
        { key: "complaintDate", label: "Complaint Date" },
        { key: "resolutionDate", label: "Resolution Date" },
        { key: "status", label: "Status" },
      ],
      getData: async ({ filters }) => {
        try {
          const params = {};
          if (filters.complaintDate) params.complaintDate = filters.complaintDate;
          if (filters.complaintStatus) params.status = filters.complaintStatus;
          if (filters.priority) params.priority = filters.priority;
          const res = await receptionService.getComplaints(params);
          let data = res.data?.data || [];
          if (filters.complaintCategory) data = data.filter((c) => c.category === filters.complaintCategory);
          return data;
        } catch { return []; }
      },
    },
  ];

  return (
    <>
      {/* Summary Stats Bar */}
      {!loadingStats && summaryStats && (
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", padding: "12px 24px", background: "var(--bg-card, #fff)", borderBottom: "1px solid var(--border-color, #e5e7eb)" }}>
          {[
            { label: "Today's Visitors", value: summaryStats.visitors?.today || 0, icon: "👥" },
            { label: "Active Visitors", value: summaryStats.visitors?.active || 0, icon: "🏫" },
            { label: "Today's Appointments", value: summaryStats.appointments?.today || 0, icon: "📅" },
            { label: "Pending Appointments", value: summaryStats.appointments?.pending || 0, icon: "⏳" },
            { label: "Open Complaints", value: summaryStats.complaints?.open || 0, icon: "🛠️" },
            { label: "Active Gate Passes", value: summaryStats.gatePasses?.active || 0, icon: "🚪" },
          ].map((stat) => (
            <div key={stat.label} style={{ flex: "1 1 120px", textAlign: "center", padding: "8px", border: "1px solid var(--border-color, #e5e7eb)", borderRadius: "8px" }}>
              <div style={{ fontSize: "20px" }}>{stat.icon}</div>
              <div style={{ fontSize: "18px", fontWeight: "700" }}>{stat.value}</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted, #6b7280)" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}
      <MasterReport
        moduleTitle="Reception Analytics & Reports"
        reports={reports}
        currentUser={currentUser}
      />
    </>
  );
}

export default ReceptionReports;