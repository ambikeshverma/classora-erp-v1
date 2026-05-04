import React from "react";
import "./reportCardManagement.css";

function ReportCardManagement() {
  const cards = [
    { title: "Scholastic Marks Entry", icon: "✍️" },
    { title: "Co-Scholastic Marks Entry", icon: "🎨" },
    { title: "Result Generation", icon: "⚙️" },
    { title: "Report Cards", icon: "📄" },
    { title: "Analytics and Reports", icon: "📊" }
  ];

  return (
    <div className="report-card-page">
      <div className="report-card-header">
        <button className="back-btn" onClick={() => window.location.href = "/dashboard"}>
          ←
        </button>

        <div>
          <h1>Report Card Management</h1>
          <p>Manage marks entry, result generation and report cards</p>
        </div>
      </div>

      <div className="report-card-grid">
        {cards.map((card, index) => (
          <div className="report-card-card" key={index}>
            <div className="report-card-icon">{card.icon}</div>
            <h3>{card.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ReportCardManagement;