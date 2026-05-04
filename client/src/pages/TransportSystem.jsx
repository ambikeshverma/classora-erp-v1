import React from "react";
import "./transportSystem.css";

function TransportSystem() {
  const cards = [
    { title: "Route Management", icon: "🛣️" },
    { title: "Vehicle Management", icon: "🚌" },
    { title: "Driver Management", icon: "👨‍✈️" },
    { title: "Student Transport Allocation", icon: "🎒" },
    { title: "Student Vehicle Allocation", icon: "🚍" },
    { title: "Analytics and Reports", icon: "📊" }
  ];

  return (
    <div className="transport-page">
      <div className="transport-header">
        <button className="back-btn" onClick={() => window.location.href = "/dashboard"}>
          ←
        </button>

        <div>
          <h1>Transport System</h1>
          <p>Manage routes, vehicles, drivers and student transport allocation</p>
        </div>
      </div>

      <div className="transport-grid">
        {cards.map((card, index) => (
          <div className="transport-card" key={index}>
            <div className="transport-icon">{card.icon}</div>
            <h3>{card.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TransportSystem;