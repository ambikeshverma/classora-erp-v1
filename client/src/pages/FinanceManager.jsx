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
          <div
  className="finance-card"
  key={index}
  onClick={() => {
    if (card.title === "Account Groups") {
      window.location.href = "/account-groups";
    }

    else if (card.title === "Account Heads") {
      window.location.href = "/account-heads";
    }

    else if (card.title === "Income Entry") {
      window.location.href = "/income-entry";
    }
    else if (card.title === "Expense Entry") {
  window.location.href = "/expense-entry";
}

  else if (
  card.title === "Analytics and Reports"
) {
  window.location.href =
    "/finance-manager/reports";
}
  }}
>
  
  <div className="finance-icon">{card.icon}</div>
  <h3>{card.title}</h3>
</div>
        ))}
      </div>
    </div>
  );
}

export default FinanceManager;