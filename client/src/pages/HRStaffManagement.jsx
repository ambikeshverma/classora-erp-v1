import React from "react";
import "./hrStaffManagement.css";

function StaffControl() {
  const cards = [
    {
      title: "Department Management",
      icon: "🏢",
      path: "/department-management",
    },
    {
      title: "Position Management",
      icon: "🎯",
      path: "/position-management",
    },
    {
      title: "Staff Management",
      icon: "👨‍🏫",
      path: "/staff-management",
    },
    {
      title: "Leave Management",
      icon: "📅",
      path: "/leave-management",
    },
    {
      title: "Salary Management",
      icon: "💰",
      path: "/salary-management",
    },
    {
      title: "Analytics and Reports",
      icon: "📊",
      path: "/staff-analytics-reports",
    },
  ];

  return (
    <div className="staff-page">
      <div className="staff-header">
        <button
          className="back-btn"
          onClick={() => {
            window.location.href = "/dashboard";
          }}
        >
          ←
        </button>

        <div>
          <h1>HR & Staff Management</h1>
          <p>Manage staff, departments, positions, salary and documents</p>
        </div>
      </div>

      <div className="staff-grid">
        {cards.map((card, index) => (
          <div
            className="staff-card"
            key={index}
            onClick={() => {
              window.location.href = card.path;
            }}
          >
            <div className="staff-icon">{card.icon}</div>
            <h3>{card.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StaffControl;