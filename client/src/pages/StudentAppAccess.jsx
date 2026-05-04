import React from "react";
import "./studentAppAccess.css";

function StudentAppAccess() {
  const cards = [
    { title: "Student Login Management", icon: "📱" },
    { title: "App Banners", icon: "🖼️" },
    { title: "Teacher Circulars", icon: "📢" },
    { title: "App News", icon: "📰" },
    { title: "App Notice Board", icon: "🔔" },
    { title: "Fee Due Notice", icon: "💳" },
    { title: "App Permissions", icon: "🔐" },
    { title: "Exam & Result Updates", icon: "📊" },
    { title: "Analytics and Reports", icon: "📈" }
  ];

  return (
    <div className="student-app-page">
      <div className="student-app-header">
        <button className="back-btn" onClick={() => window.location.href = "/dashboard"}>
          ←
        </button>

        <div>
          <h1>Student App Access</h1>
          <p>Manage student app login, banners, notices, news and permissions</p>
        </div>
      </div>

      <div className="student-app-grid">
        {cards.map((card, index) => (
          <div className="student-app-card" key={index}>
            <div className="student-app-icon">{card.icon}</div>
            <h3>{card.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StudentAppAccess;