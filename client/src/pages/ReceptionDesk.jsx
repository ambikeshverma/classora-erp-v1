import React from "react";
import "./receptionDesk.css";

function ReceptionDesk() {
  const cards = [
    { title: "Enquiry Sources", icon: "📰" },
    { title: "Follow-up Management", icon: "🔄" },
    { title: "Gate Pass Management", icon: "🚪" },
    { title: "Student ID Management",icon: "🎓" },
    { title: "Parent ID Management", icon: "👨‍👩‍👧" },
    { title: "Appointment Scheduling", icon: "📅" },
    { title: "Visitor Management", icon: "🛂", },
    { title: "Support & Complaints", icon: "🛠️" },
    { title: "Analytics and Reports", icon: "📊" }
  ];

  return (
    <div className="reception-page">
      <div className="reception-header">
        <button className="back-btn" onClick={() => window.location.href = "/dashboard"}>
          ←
        </button>

        <div>
          <h1>Reception Desk</h1>
          <p>Manage enquiries, visitors, appointments and front office operations</p>
        </div>
      </div>

      <div className="reception-grid">
        {cards.map((card, index) => (
          <div
            className="reception-card"
            key={index}
            onClick={() => {

              if (card.title === "Enquiry Sources") {
                window.location.href = "/enquiry-sources";
              }
              else if (card.title === "Enquiry Management") {
                window.location.href = "/enquiry-management";
              }
              else if (card.title === "Follow-up Management") {
                window.location.href = "/follow-up-management";
              }
              else if (card.title === "Gate Pass Management") {
                window.location.href =
                  "/gate-pass-management";
              }
              else if (card.title === "Student ID Management") {
                window.location.href =
                  "/student-id-management";
              }
              else if (card.title === "Parent ID Management") {
                window.location.href =
                  "/parent-id-management";
              }
              else if (card.title === "Visitor Management") {
                window.location.href =
                  "/visitor-management";
              }
              else if (card.title === "Appointment Scheduling") {
                window.location.href =
                  "/appointment-scheduling";
              }
              else if (card.title === "Support & Complaints") {
                window.location.href =
                  "/support-complaint";
              }
              else if (card.title === "Analytics and Reports") {
                window.location.href =
                  "/reception-reports";
              }

            }}
          >
            <div className="reception-icon">{card.icon}</div>
            <h3>{card.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ReceptionDesk;