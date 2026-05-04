import React from "react";
import "./adminPanel.css";

function AdminPanel() {
  const cards = [
    { title: "School Profile", icon: "🏫" },
    { title: "Fee Scheme", icon: "🧾" },
    { title: "Fee Plan Management", icon: "💳" },
    { title: "Concession Management", icon: "🎁" },
    { title: "Subscription & Billing", icon: "💼" },
    { title: "Analytics & Reports", icon: "📊" }
  ];

  return (
    <div className="admin-panel-page">
      <div className="admin-panel-header">
        <button className="back-btn" onClick={() => window.location.href = "/dashboard"}>
          ←
        </button>

        <div>
          <h1>Admin Panel</h1>
          <p>Manage school profile, fees, concessions and billing</p>
        </div>
      </div>

      <div className="admin-panel-grid">
        {cards.map((card, index) => (
          <div className="admin-panel-card" key={index}>
            <div className="admin-panel-icon">{card.icon}</div>
            <h3>{card.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminPanel;