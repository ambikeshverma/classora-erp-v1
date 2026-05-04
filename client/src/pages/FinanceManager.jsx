import React from "react";
import "./financeManager.css";

function FinanceManager() {
  const cards = [
    { title: "Account Groups", icon: "📂" },
    { title: "Account Heads", icon: "🧾" },
    { title: "Income Entry", icon: "📥" },
    { title: "Expense Entry", icon: "📤" },
    { title: "Analytics and Reports", icon: "📊" }
  ];

  return (
    <div className="finance-page">
      <div className="finance-header">
        <button className="back-btn" onClick={() => window.location.href = "/dashboard"}>
          ←
        </button>

        <div>
          <h1>Finance Manager</h1>
          <p>Manage income, expenses and accounting structure</p>
        </div>
      </div>

      <div className="finance-grid">
        {cards.map((card, index) => (
          <div className="finance-card" key={index}>
            <div className="finance-icon">{card.icon}</div>
            <h3>{card.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FinanceManager;