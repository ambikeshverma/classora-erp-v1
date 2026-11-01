import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppButton from "../../components/AppButton";
import MasterReport from "../../components/reports/MasterReport";
import { Skeleton, SkeletonList } from "../../components/Skeleton";
import { receptionService } from "../../services/api";

const SNO_COLUMN = { key: "sno", label: "S.No", render: (_, index) => index + 1 };

const FOLLOW_UP_STATUSES = ["Interested", "Call Back Later", "No Response", "Not Interested", "Admission Confirmed"];
const FOLLOW_UP_TYPES = ["Call", "WhatsApp", "Visit", "SMS", "Meeting"];
const APPOINTMENT_STATUSES = ["Pending", "Approved", "Rejected", "Completed", "Cancelled"];
const VISITOR_TYPES = ["Walk-In Visitor", "Appointment Visitor"];
const VISITOR_STATUSES = ["Waiting", "Inside Campus", "Exited", "Cancelled"];
const GATE_PASS_STATUSES = ["Issued", "Returned", "Cancelled"];
const COMPLAINT_STATUSES = ["Open", "In Progress", "Resolved", "Closed", "Rejected"];
const COMPLAINT_PRIORITIES = ["Low", "Medium", "High", "Urgent"];

const formatDate = (value) => (value ? String(value).split("-").reverse().join("-") : "-");

function ReceptionReports() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    receptionService
      .getReports()
      .then((res) => {
        if (active) setData(res.data?.data || null);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || "Failed to load reception reports");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const schoolProfiles = useMemo(
    () => [{ schoolId: localStorage.getItem("schoolId") || "SCH001", ...(data?.schoolInfo || {}) }],
    [data]
  );

  const currentUser = useMemo(() => ({ name: data?.schoolInfo?.schoolName || "" }), [data]);

  const reports = useMemo(() => {
    if (!data) return [];

    const { followUps, appointments, visitors, gatePasses, complaints } = data.records;

    // Category options come from what was actually recorded
    const categories = [...new Set(complaints.map((item) => item.category).filter(Boolean))].sort();

    return [
      {
        id: "follow-up-report",
        title: "Follow-Up Report",
        description: "View enquiry follow-up records",
        icon: "🔄",
        filters: [
          { name: "followUpStatus", label: "Follow-Up Status", type: "select", placeholder: "All Status", options: FOLLOW_UP_STATUSES },
          { name: "followUpType", label: "Follow-Up Type", type: "select", placeholder: "All Type", options: FOLLOW_UP_TYPES },
        ],
        columns: [
          SNO_COLUMN,
          { key: "studentName", label: "Student Name" },
          { key: "mobileNumber", label: "Mobile Number" },
          { key: "classInterested", label: "Class Interested" },
          { key: "followUpDateLabel", label: "Follow-Up Date" },
          { key: "followUpType", label: "Follow-Up Type" },
          { key: "followUpStatus", label: "Follow-Up Status" },
          { key: "nextFollowUpLabel", label: "Next Follow-Up Date" },
          { key: "discussionNotes", label: "Discussion Notes" },
        ],
        getData: ({ filters }) =>
          followUps
            .filter((item) => !filters.followUpStatus || item.followUpStatus === filters.followUpStatus)
            .filter((item) => !filters.followUpType || item.followUpType === filters.followUpType)
            .map((item) => ({
              ...item,
              followUpDateLabel: formatDate(item.followUpDate),
              nextFollowUpLabel: formatDate(item.nextFollowUpDate),
              discussionNotes: item.discussionNotes || "-",
            })),
      },

      {
        id: "appointment-report",
        title: "Appointment Report",
        description: "View visitor appointment records",
        icon: "📅",
        filters: [
          { name: "appointmentDate", label: "Appointment Date", type: "date" },
          { name: "appointmentStatus", label: "Status", type: "select", placeholder: "All Status", options: APPOINTMENT_STATUSES },
        ],
        columns: [
          SNO_COLUMN,
          { key: "appointmentId", label: "Appointment ID" },
          { key: "visitorName", label: "Visitor Name" },
          { key: "mobile", label: "Mobile Number" },
          { key: "purpose", label: "Purpose" },
          { key: "departmentName", label: "Department" },
          { key: "personToMeet", label: "Person To Meet" },
          { key: "dateLabel", label: "Appointment Date" },
          { key: "timeSlot", label: "Time Slot" },
          { key: "status", label: "Status" },
        ],
        getData: ({ filters }) =>
          appointments
            .filter((item) => !filters.appointmentDate || item.appointmentDate === filters.appointmentDate)
            .filter((item) => !filters.appointmentStatus || item.status === filters.appointmentStatus)
            .map((item) => ({
              ...item,
              purpose: item.purpose || "-",
              departmentName: item.departmentName || "-",
              personToMeet: item.personToMeet || "-",
              dateLabel: formatDate(item.appointmentDate),
            })),
      },

      {
        id: "visitor-report",
        title: "Visitor Report",
        description: "View visitor entry and exit records",
        icon: "🛂",
        filters: [
          { name: "visitDate", label: "Visit Date", type: "date" },
          { name: "visitorType", label: "Visitor Type", type: "select", placeholder: "All Type", options: VISITOR_TYPES },
          { name: "visitorStatus", label: "Visitor Status", type: "select", placeholder: "All Status", options: VISITOR_STATUSES },
        ],
        columns: [
          SNO_COLUMN,
          { key: "visitorName", label: "Visitor Name" },
          { key: "visitorType", label: "Visitor Type" },
          { key: "mobile", label: "Mobile Number" },
          { key: "purpose", label: "Purpose" },
          { key: "whomToMeet", label: "Whom To Meet" },
          { key: "dateLabel", label: "Visit Date" },
          { key: "inTime", label: "In Time" },
          { key: "outTime", label: "Out Time" },
          { key: "status", label: "Status" },
        ],
        getData: ({ filters }) =>
          visitors
            .filter((item) => !filters.visitDate || item.visitDate === filters.visitDate)
            .filter((item) => !filters.visitorType || item.visitorType === filters.visitorType)
            .filter((item) => !filters.visitorStatus || item.status === filters.visitorStatus)
            .map((item) => ({
              ...item,
              purpose: item.purpose || "-",
              whomToMeet: item.whomToMeet || "-",
              dateLabel: formatDate(item.visitDate),
              inTime: item.inTime || "-",
              outTime: item.outTime || "-",
            })),
      },

      {
        id: "gate-pass-report",
        title: "Gate Pass Report",
        description: "View student gate pass records",
        icon: "🚪",
        filters: [
          { name: "passDate", label: "Pass Date", type: "date" },
          { name: "passStatus", label: "Status", type: "select", placeholder: "All Status", options: GATE_PASS_STATUSES },
        ],
        columns: [
          SNO_COLUMN,
          { key: "passNumber", label: "Pass No" },
          { key: "studentName", label: "Student Name" },
          { key: "classLabel", label: "Class" },
          { key: "guardianName", label: "Guardian" },
          { key: "reason", label: "Reason" },
          { key: "dateLabel", label: "Pass Date" },
          { key: "outTime", label: "Out Time" },
          { key: "inTime", label: "In Time" },
          { key: "status", label: "Status" },
        ],
        getData: ({ filters }) =>
          gatePasses
            .filter((item) => !filters.passDate || item.passDate === filters.passDate)
            .filter((item) => !filters.passStatus || item.status === filters.passStatus)
            .map((item) => ({
              ...item,
              classLabel: [item.className, item.section].filter(Boolean).join(" - ") || "-",
              guardianName: item.guardianName || "-",
              dateLabel: formatDate(item.passDate),
              outTime: item.outTime || "-",
              inTime: item.inTime || "-",
            })),
      },

      {
        id: "support-complaint-report",
        title: "Support & Complaint Report",
        description: "View guardian complaints and support tickets",
        icon: "🛠️",
        filters: [
          { name: "complaintDate", label: "Complaint Date", type: "date" },
          { name: "complaintStatus", label: "Status", type: "select", placeholder: "All Status", options: COMPLAINT_STATUSES },
          { name: "priority", label: "Priority", type: "select", placeholder: "All Priority", options: COMPLAINT_PRIORITIES },
          { name: "complaintCategory", label: "Category", type: "select", placeholder: "All Category", options: categories },
        ],
        columns: [
          SNO_COLUMN,
          { key: "complaintId", label: "Complaint ID" },
          { key: "guardianName", label: "Guardian Name" },
          { key: "studentName", label: "Student Name" },
          { key: "mobile", label: "Mobile Number" },
          { key: "category", label: "Category" },
          { key: "priority", label: "Priority" },
          { key: "assignedUser", label: "Assigned To" },
          { key: "dateLabel", label: "Complaint Date" },
          { key: "resolutionLabel", label: "Resolution Date" },
          { key: "status", label: "Status" },
        ],
        getData: ({ filters }) =>
          complaints
            .filter((item) => !filters.complaintDate || item.complaintDate === filters.complaintDate)
            .filter((item) => !filters.complaintStatus || item.status === filters.complaintStatus)
            .filter((item) => !filters.priority || item.priority === filters.priority)
            .filter((item) => !filters.complaintCategory || item.category === filters.complaintCategory)
            .map((item) => ({
              ...item,
              assignedUser: item.assignedUser || "-",
              dateLabel: formatDate(item.complaintDate),
              resolutionLabel: formatDate(item.resolutionDate),
            })),
      },
    ];
  }, [data]);

  if (loading) {
    return (
      <div style={{ padding: "20px" }}>
        <Skeleton variant="rectangular" height={70} />
        <SkeletonList count={5} />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: "20px" }}>
        <AppButton type="back" onClick={() => navigate("/reception-desk")}>
          ←
        </AppButton>

        <p>{error || "Reception reports are not available"}</p>
      </div>
    );
  }

  const stats = [
    { label: "Today's Visitors", value: data.visitors.today, icon: "👥" },
    { label: "Active Visitors", value: data.visitors.active, icon: "🏫" },
    { label: "Today's Appointments", value: data.appointments.today, icon: "📅" },
    { label: "Pending Appointments", value: data.appointments.pending, icon: "⏳" },
    { label: "Open Complaints", value: data.complaints.open, icon: "🛠️" },
    { label: "Active Gate Passes", value: data.gatePasses.active, icon: "🚪" },
  ];

  return (
    <>
      <div className="reception-report-stats" style={{ display: "flex", gap: "12px", flexWrap: "wrap", padding: "12px 24px", background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
        {stats.map((stat) => (
          <div key={stat.label} style={{ flex: "1 1 120px", textAlign: "center", padding: "8px", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
            <div style={{ fontSize: "20px" }}>{stat.icon}</div>
            <div style={{ fontSize: "18px", fontWeight: "700" }}>{stat.value}</div>
            <div style={{ fontSize: "11px", color: "#6b7280" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <MasterReport
        moduleTitle="Reception Analytics & Reports"
        reports={reports}
        schoolProfiles={schoolProfiles}
        currentUser={currentUser}
      />
    </>
  );
}

export default ReceptionReports;
