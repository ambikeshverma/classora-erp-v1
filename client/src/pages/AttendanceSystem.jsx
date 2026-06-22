import React from "react";
import "./attendanceSystem.css";

function AttendanceSystem() {
  const cards = [
  {
    title: "Student Attendance",
    icon: "🎓",
    path: "/attendance-system/student-attendance",
  },
  {
    title: "Staff Attendance",
    icon: "👨‍🏫",
    path: "/attendance-system/staff-attendance",
  },
  {
    title: "Bulk Attendance Entry",
    icon: "📝",
    path: "/attendance-system/bulk-attendance-entry",
  },
  {
    title: "Analytics and Reports",
    icon: "📊",
    path: "/attendance-system/attendance-analytics",
  },
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
          <div
  className="attendance-card"
  key={index}
  onClick={() => window.location.href = card.path}
>
            <div className="attendance-icon">{card.icon}</div>
            <h3>{card.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AttendanceSystem;