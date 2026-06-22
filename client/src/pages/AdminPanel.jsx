import React from "react";
import "./adminPanel.css";

function AdminPanel() {

  const cards = [

    {
      title: "Fee Scheme",
      icon: "🧾",
      route: "/fee-scheme",
    },

    {
      title: "Fee Plan Name Setup",
      icon: "🏷️",
      route: "/fee-plan-name-setup",
    },

    {
      title: "Fee Plan Management",
      icon: "💳",
      route: "/fee-plan-management",
    },

    {
      title: "Concession Management",
      icon: "🎁",
      route: "/concession-management",
    },

    {
      title: "Subscription & Billing",
      icon: "💼",
      route: "/subscription-billing",
    },

    {
      title: "Analytics & Reports",
      icon: "📊",
      route: "/admin-reports"
    },

  ];

  return (

    <div className="admin-panel-page">

      <div className="admin-panel-header">

        <button
          className="back-btn"
          onClick={() =>
            window.location.href =
              "/dashboard"
          }
        >
          ←
        </button>

        <div>

          <h1>
            Admin Panel
          </h1>

          <p>
            Manage school profile,
            fees, concessions
            and billing
          </p>

        </div>

      </div>

      <div className="admin-panel-grid">

        {cards.map(
          (card, index) => (

            <div
              className="admin-panel-card"
              key={index}
              onClick={() => {

                window.location.href =
                  card.route;

              }}
            >

              <div className="admin-panel-icon">

                {card.icon}

              </div>

              <h3>
                {card.title}
              </h3>

            </div>

          )
        )}

      </div>

    </div>

  );

}

export default AdminPanel;