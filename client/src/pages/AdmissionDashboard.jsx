import React from "react";
import "./admission.css";

function AdmissionDashboard() {
  const cards = [
    { title: "New Admission", icon: "➕" },
    { title: "Admission Enquiries", icon: "📝" },
    { title: "Bulk Import", icon: "⬇️" },
    { title: "Analytics & Reports", icon: "📊" }
  ];

  return (
    <div className="admission-page">
      <div className="admission-header">
        <button className="back-btn" onClick={() => window.location.href = "/dashboard"}>
          ←
        </button>

        <div>
          <h1>Admission Dashboard</h1>
          <p>Manage student admissions, enquiries, imports and reports</p>
        </div>
      </div>

      <div className="admission-grid">
        {cards.map((card, index) => (
          <div
  className="admission-card"
  key={index}
  onClick={() => {
    if (card.title === "New Admission") {
      window.location.href = "/admission/new";
    }
  }}
>
            <div className="admission-icon">{card.icon}</div>
            <h3>{card.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdmissionDashboard;