import React from "react";
import "./hrStaffManagement.css";

function StaffControl() {
  const cards = [
    { title: "Department Management", icon: "🏢" },
    { title: "Position Management", icon: "🎯" },
    { title: "Staff Management", icon: "👨‍🏫" },
    { title: "Leave Management", icon: "📅" },
    { title: "Salary Management", icon: "💰" },
    { title: "Document Management", icon: "📂" },
    { title: "Analytics and Reports", icon: "📊" }
  ];

  return (
    <div className="staff-page">
      <div className="staff-header">
        <button className="back-btn" onClick={() => window.location.href = "/dashboard"}>
          ←
        </button>

        <div>
          <h1>HR & Staff Management</h1>
          <p>Manage staff, departments, positions, salary and documents</p>
        </div>
      </div>

      <div className="staff-grid">
        {cards.map((card, index) => (
          <div className="staff-card" key={index}>
            <div className="staff-icon">{card.icon}</div>
            <h3>{card.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StaffControl;