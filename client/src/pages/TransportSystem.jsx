import React from "react";
import "./transportSystem.css";

function TransportSystem() {
  const cards = [
    {
      title: "Route Management",
      icon: "🛣️",
      route: "/route-management",
    },

    {
      title: "Vehicle Management",
      icon: "🚌",
      route: "/vehicle-management",
    },

    {
      title: "Student Transport Allocation",
      icon: "🎒",
      route: "/student-transport-allocation",
    },

    {
      title: "Analytics and Reports",
      icon: "📊",
      route: "/transport-analytics-reports",
    },
  ];

  return (
    <div className="transport-page">
      <div className="transport-header">
        <button
          className="back-btn"
          onClick={() => {
            window.location.href = "/dashboard";
          }}
        >
          ←
        </button>

        <div>
          <h1>Transport System</h1>
          <p>
            Manage routes, vehicles and student transport allocation
          </p>
        </div>
      </div>

      <div className="transport-grid">
        {cards.map((card, index) => (
          <div
            className="transport-card"
            key={index}
            onClick={() => {
              window.location.href = card.route;
            }}
          >
            <div className="transport-icon">
              {card.icon}
            </div>

            <h3>{card.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TransportSystem;