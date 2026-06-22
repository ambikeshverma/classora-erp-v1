import React from "react";
import "./studentAppAccess.css";

function StudentAppAccess() {

  const cards = [
    {
      title: "Student Login Management",
      icon: "📱",
      route: "/student-login-management",
    },

    {
      title: "App Banners",
      icon: "🖼️",
      route: "/app-banners",
    },

    {
      title: "Teacher Circulars",
      icon: "📢",
      route: "/teacher-circulars",
    },

    {
      title: "App News",
      icon: "📰",
      route: "/app-news",
    },

    {
      title: "App Notice Board",
      icon: "🔔",
      route: "/app-notice-board",
    },

    {
      title: "Fee Due Notice",
      icon: "💳",
      route: "/fee-due-notice",
    },

    {
      title: "App Permissions",
      icon: "🔐",
      route: "/app-permissions",
    },

    {
      title: "Analytics and Reports",
      icon: "📊",
      route: "/student-app-analytics-reports",
    },
  ];

  return (
    <div className="student-app-page">

      <div className="student-app-header">

        <button
          className="back-btn"
          onClick={() =>
            (window.location.href = "/dashboard")
          }
        >
          ←
        </button>

        <div>
          <h1>Student App Access</h1>

          <p>
            Manage student app login,
            banners, notices, news and permissions
          </p>
        </div>

      </div>

      <div className="student-app-grid">

        {cards.map((card, index) => (

          <div
            className="student-app-card"
            key={index}
            onClick={() => {
              window.location.href =
                card.route;
            }}
          >
            <div className="student-app-icon">
              {card.icon}
            </div>

            <h3>{card.title}</h3>
          </div>

        ))}

      </div>
    </div>
  );
}

export default StudentAppAccess;