import React from "react";
import "./admissions.css";

function Admissions() {

  const cards = [
    {
      title: "New Admission",
      icon: "➕",
      route: "/admission/new",
    },

    {
      title: "Admission Enquiries",
      icon: "📝",
      route: "/admission-enquiries",
    },

    {
      title: "Bulk Import",
      icon: "⬇️",
      route: "/admission-bulk-import",
    },

    {
      title: "Analytics & Reports",
      icon: "📊",
      route: "/admission-analytics-reports",
    },
  ];

  return (
    <div className="admission-page">

      <div className="admission-header">

        <button
          className="back-btn"
          onClick={() =>
            (window.location.href = "/dashboard")
          }
        >
          ←
        </button>

        <div>
          <h1>Admission Dashboard</h1>

          <p>
            Manage student admissions,
            enquiries, imports and reports
          </p>
        </div>
      </div>

      <div className="admission-grid">

        {cards.map((card, index) => (

          <div
            className="admission-card"
            key={index}
            onClick={() => {
              window.location.href =
                card.route;
            }}
          >
            <div className="admission-icon">
              {card.icon}
            </div>

            <h3>{card.title}</h3>
          </div>

        ))}

      </div>
    </div>
  );
}

export default Admissions;