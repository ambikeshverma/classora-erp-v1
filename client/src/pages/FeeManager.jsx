import React from "react";
import "./feeManager.css";

function FeeManager() {
  const cards = [
    {
      title: "Fee Collection",
      icon: "💰",
      route: "/fee-collection",
    },
    {
      title: "Fee Receipt",
      icon: "🧾",
      route: "/fee-receipt",
    },
    {
      title: "Analytics and Reports",
      icon: "📊",
      route: "/fee-analytics-reports",
    },
  ];

  return (
    <div className="fee-page">
      <div className="fee-header">
        <button
          className="back-btn"
          onClick={() => (window.location.href = "/dashboard")}
        >
          ←
        </button>

        <div>
          <h1>Fee Manager</h1>
          <p>Manage fee collection, receipts, fines, transport fee and fee reports</p>
        </div>
      </div>

      <div className="fee-grid">
        {cards.map((card, index) => (
          <div
            className="fee-card"
            key={index}
            onClick={() => (window.location.href = card.route)}
          >
            <div className="fee-icon">{card.icon}</div>
            <h3>{card.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FeeManager;