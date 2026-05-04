import React from "react";
import "./attendanceSystem.css";

function AttendanceSystem() {
  const cards = [
    { title: "Student Attendance", icon: "🎓" },
    { title: "Staff Attendance", icon: "👨‍🏫" },
    { title: "Bulk Attendance Entry", icon: "📝" },
    { title: "Leave Management", icon: "📅" },
    { title: "Attendance Lock / Freeze", icon: "🔒" },
    { title: "Analytics and Reports", icon: "📊" }
  ];

  return (
    <div className="attendance-page">
      <div className="attendance-header">
        <button className="back-btn" onClick={() => window.location.href = "/dashboard"}>
          ←
        </button>

        <div>
          <h1>Attendance System</h1>
          <p>Manage student attendance, staff attendance, leave and attendance lock</p>
        </div>
      </div>

      <div className="attendance-grid">
        {cards.map((card, index) => (
          <div className="attendance-card" key={index}>
            <div className="attendance-icon">{card.icon}</div>
            <h3>{card.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AttendanceSystem;