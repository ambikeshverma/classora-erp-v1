import React from "react";
import "./receptionDesk.css";

function ReceptionDesk() {
  const cards = [
    { title: "Enquiry Sources", icon: "📰" },
    { title: "Enquiry Management", icon: "👥" },
    { title: "Follow-up Management", icon: "🔄" },
    { title: "Gate Pass Management", icon: "🚪" },
    { title: "Student ID Management", icon: "🪪" },
    { title: "Parent ID Management", icon: "👨‍👩‍👧" },
    { title: "Visitor Management", icon: "🧑‍💼" },
    { title: "Appointment Scheduling", icon: "📅" },
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
          <div className="reception-card" key={index}>
            <div className="reception-icon">{card.icon}</div>
            <h3>{card.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ReceptionDesk;