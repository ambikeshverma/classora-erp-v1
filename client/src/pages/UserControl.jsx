import React from "react";
import "./userControl.css";

function UserControl() {
  const cards = [
    { title: "User Type Management", icon: "🧩" },
    { title: "User Management", icon: "👤" },
    { title: "Class Teacher Assignment", icon: "🏫" },
    { title: "Subject Teacher Assignment", icon: "📚" },
    { title: "Coordinator Assignment", icon: "🧑‍💼" }
  ];

  return (
    <div className="user-control-page">
      <div className="user-control-header">
        <button className="back-btn" onClick={() => window.location.href = "/dashboard"}>
          ←
        </button>

        <div>
          <h1>User Control</h1>
          <p>Manage user types, users and teacher/coordinator assignments</p>
        </div>
      </div>

      <div className="user-control-grid">
        {cards.map((card, index) => (
          <div className="user-control-card" key={index}>
            <div className="user-control-icon">{card.icon}</div>
            <h3>{card.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UserControl;