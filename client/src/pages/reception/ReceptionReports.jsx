import React from "react";
import MasterReport from "../../components/reports/MasterReport";

function ReceptionReports() {
  // schoolId is available from JWT token via api interceptor (req.schoolId in backend)

  const schoolProfiles = [
    {
      schoolId: "SCH001",
      schoolName: "Chandra Shekhar Azad Inter College",
      address: "Azad Nagar, Barabanki",
      email: "school@gmail.com",
      website: "www.school.com",
      phone: "9876543210",
      logo: "",
    },
  ];

  const currentUser = {
    name: localStorage.getItem("userName") || "School Admin",
  };

  const followUps = [
    {
      id: 1,
      schoolId: "SCH001",
      studentName: "Aman",
      mobileNumber: "9876543210",
      classInterested: "Class 6",
      followUpDate: "2026-06-01",
      followUpType: "Call",
      followUpStatus: "Interested",
      nextFollowUpDate: "2026-06-05",
      discussionNotes: "Parent asked for fee details",
    },
  ];

  const appointments = [
    {
      id: 1,
      schoolId: "SCH001",
      appointmentId: "APT001",
      visitorName: "Ramesh Kumar",
      mobile: "9876543210",
      purpose: "Admission enquiry",
      department: "Administration",
      personToMeet: "Principal",
      appointmentDate: "2026-06-01",
      appointmentTime: "10:00 AM",
      status: "Approved",
    },
  ];

  const visitors = [
    {
      id: 1,
      schoolId: "SCH001",
      visitorName: "Ramesh Kumar",
      visitorType: "Appointment Visitor",
      mobile: "9876543210",
      purpose: "Admission enquiry",
      whomToMeet: "Principal",
      visitDate: "2026-06-01",
      inTime: "10:10 AM",
      outTime: "11:00 AM",
      status: "Exited",
    },
  ];

  const complaints = [
    {
      id: 1,
      schoolId: "SCH001",
      complaintId: "CMP001",
      guardianName: "Suresh Kumar",
      studentName: "Aman",
      mobile: "9876543210",
      category: "Fee Issue",
      priority: "Medium",
      assignedRole: "Accountant",
      complaintDate: "2026-06-01",
      resolutionDate: "",
      status: "Open",
    },
  ];

  const isDateInRange = (date, fromDate, toDate) => {
    if (fromDate && date < fromDate) return false;
    if (toDate && date > toDate) return false;
    return true;
  };

  const reports = [
    {
      id: "follow-up-report",
      title: "Follow-Up Report",
      description: "View enquiry follow-up records",
      icon: "🔄",
      filters: [
        { name: "fromDate", label: "From Date", type: "date" },
        { name: "toDate", label: "To Date", type: "date" },
        {
          name: "followUpStatus",
          label: "Follow-Up Status",
          type: "select",
          placeholder: "All Status",
          options: [
            "Interested",
            "Call Back Later",
            "No Response",
            "Not Interested",
            "Admission Confirmed",
          ],
        },
        {
          name: "followUpType",
          label: "Follow-Up Type",
          type: "select",
          placeholder: "All Type",
          options: ["Call", "WhatsApp", "Visit", "SMS", "Meeting"],
        },
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
      getData: ({ schoolId, filters }) =>
        followUps
          .filter((item) => item.schoolId === schoolId)
          .filter((item) =>
            isDateInRange(item.followUpDate, filters.fromDate, filters.toDate)
          )
          .filter((item) =>
            filters.followUpStatus
              ? item.followUpStatus === filters.followUpStatus
              : true
          )
          .filter((item) =>
            filters.followUpType
              ? item.followUpType === filters.followUpType
              : true
          ),
    },

    {
      id: "appointment-report",
      title: "Appointment Report",
      description: "View visitor appointment records",
      icon: "📅",
      filters: [
        { name: "fromDate", label: "From Date", type: "date" },
        { name: "toDate", label: "To Date", type: "date" },
        {
          name: "appointmentStatus",
          label: "Appointment Status",
          type: "select",
          placeholder: "All Status",
          options: ["Pending", "Approved", "Rejected", "Completed", "Cancelled"],
        },
        {
          name: "department",
          label: "Department",
          type: "select",
          placeholder: "All Department",
          options: ["Administration", "Teaching", "Accounts", "Transport"],
        },
      ],
      columns: [
        { key: "sno", label: "S.No", render: (_, index) => index + 1 },
        { key: "appointmentId", label: "Appointment ID" },
        { key: "visitorName", label: "Visitor Name" },
        { key: "mobile", label: "Mobile Number" },
        { key: "purpose", label: "Purpose" },
        { key: "department", label: "Department" },
        { key: "personToMeet", label: "Person To Meet" },
        { key: "appointmentDate", label: "Appointment Date" },
        { key: "appointmentTime", label: "Appointment Time" },
        { key: "status", label: "Status" },
      ],
      getData: ({ schoolId, filters }) =>
        appointments
          .filter((item) => item.schoolId === schoolId)
          .filter((item) =>
            isDateInRange(
              item.appointmentDate,
              filters.fromDate,
              filters.toDate
            )
          )
          .filter((item) =>
            filters.appointmentStatus
              ? item.status === filters.appointmentStatus
              : true
          )
          .filter((item) =>
            filters.department ? item.department === filters.department : true
          ),
    },

    {
      id: "visitor-report",
      title: "Visitor Report",
      description: "View visitor entry and exit records",
      icon: "🛂",
      filters: [
        { name: "fromDate", label: "From Date", type: "date" },
        { name: "toDate", label: "To Date", type: "date" },
        {
          name: "visitorType",
          label: "Visitor Type",
          type: "select",
          placeholder: "All Type",
          options: ["Walk-In Visitor", "Appointment Visitor"],
        },
        {
          name: "visitorStatus",
          label: "Visitor Status",
          type: "select",
          placeholder: "All Status",
          options: ["Waiting", "Inside Campus", "Exited", "Cancelled"],
        },
      ],
      columns: [
        { key: "sno", label: "S.No", render: (_, index) => index + 1 },
        { key: "visitorName", label: "Visitor Name" },
        { key: "visitorType", label: "Visitor Type" },
        { key: "mobile", label: "Mobile Number" },
        { key: "purpose", label: "Purpose" },
        { key: "whomToMeet", label: "Whom To Meet" },
        { key: "inTime", label: "In Time" },
        { key: "outTime", label: "Out Time" },
        { key: "status", label: "Status" },
      ],
      getData: ({ schoolId, filters }) =>
        visitors
          .filter((item) => item.schoolId === schoolId)
          .filter((item) =>
            isDateInRange(item.visitDate, filters.fromDate, filters.toDate)
          )
          .filter((item) =>
            filters.visitorType ? item.visitorType === filters.visitorType : true
          )
          .filter((item) =>
            filters.visitorStatus ? item.status === filters.visitorStatus : true
          ),
    },

    {
      id: "support-complaint-report",
      title: "Support & Complaint Report",
      description: "View guardian complaints and support tickets",
      icon: "🛠️",
      filters: [
        { name: "fromDate", label: "From Date", type: "date" },
        { name: "toDate", label: "To Date", type: "date" },
        {
          name: "complaintStatus",
          label: "Complaint Status",
          type: "select",
          placeholder: "All Status",
          options: ["Open", "In Progress", "Resolved", "Closed", "Rejected"],
        },
        {
          name: "complaintCategory",
          label: "Complaint Category",
          type: "select",
          placeholder: "All Category",
          options: [
            "Fee Issue",
            "Transport",
            "Teacher Behaviour",
            "Academic",
            "App/ERP Issue",
            "Examination",
            "Result",
            "Admission",
            "Discipline",
            "Other",
          ],
        },
        {
          name: "department",
          label: "Department",
          type: "select",
          placeholder: "All Department",
          options: ["Administration", "Teaching", "Accounts", "Transport"],
        },
        {
          name: "priority",
          label: "Priority",
          type: "select",
          placeholder: "All Priority",
          options: ["Low", "Medium", "High", "Urgent"],
        },
      ],
      columns: [
        { key: "sno", label: "S.No", render: (_, index) => index + 1 },
        { key: "complaintId", label: "Complaint ID" },
        { key: "guardianName", label: "Guardian Name" },
        { key: "studentName", label: "Student Name" },
        { key: "mobile", label: "Mobile Number" },
        { key: "category", label: "Complaint Category" },
        { key: "priority", label: "Priority" },
        { key: "assignedRole", label: "Assigned To" },
        { key: "complaintDate", label: "Complaint Date" },
        { key: "resolutionDate", label: "Resolution Date" },
        { key: "status", label: "Status" },
      ],
      getData: ({ schoolId, filters }) =>
        complaints
          .filter((item) => item.schoolId === schoolId)
          .filter((item) =>
            isDateInRange(item.complaintDate, filters.fromDate, filters.toDate)
          )
          .filter((item) =>
            filters.complaintStatus
              ? item.status === filters.complaintStatus
              : true
          )
          .filter((item) =>
            filters.complaintCategory
              ? item.category === filters.complaintCategory
              : true
          )
          .filter((item) =>
            filters.department ? item.department === filters.department : true
          )
          .filter((item) =>
            filters.priority ? item.priority === filters.priority : true
          ),
    },
  ];

  return (
    <MasterReport
      moduleTitle="Reception Analytics & Reports"
      reports={reports}
      schoolProfiles={schoolProfiles}
      currentUser={currentUser}
    />
  );
}

export default ReceptionReports;