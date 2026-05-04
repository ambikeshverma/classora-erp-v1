import React from "react";
import "./feeManager.css";

function FeeManager() {
  const cards = [
    { title: "Fee Collection", icon: "💰" },
    { title: "Student Fee Ledger", icon: "📒" },
    { title: "Fee Receipt Management", icon: "🧾" },
    { title: "Fine Management", icon: "⚠️" },
    { title: "Transport Fee Management", icon: "🚌" },
    { title: "Class-wise Fee Details", icon: "🏫" },
    { title: "Analytics and Reports", icon: "📊" }
  ];

  return (
    <div className="fee-page">
      <div className="fee-header">
        <button className="back-btn" onClick={() => window.location.href = "/dashboard"}>
          ←
        </button>

        <div>
          <h1>Fee Manager</h1>
          <p>Manage fee collection, receipts, fines, transport fee and fee reports</p>
        </div>
      </div>

      <div className="fee-grid">
        {cards.map((card, index) => (
          <div className="fee-card" key={index}>
            <div className="fee-icon">{card.icon}</div>
            <h3>{card.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FeeManager;