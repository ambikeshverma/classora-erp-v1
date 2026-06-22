import React from "react";
import "./studentHub.css";

function StudentHub() {

  const cards = [

    {
      title: "Class Management",
      icon: "🏫",
      route: "/class-management"
    },

    {
      title: "Section Management",
      icon: "🧩",
      route: "/section-management"
    },

    {
      title: "Medium Management",
      icon: "🌐",
      route: "/medium-management"
    },

    {
      title: "House Management",
      icon: "🏠",
      route: "/house-management"
    },

    {
      title: "House Allocation",
      icon: "🏠",
      route: "/house-allocation"
    },

    {
      title: "Sibling Management",
      icon: "👨‍👩‍👧‍👦",
      route: "/sibling-management"
    },

    {
      title: "Student Search",
      icon: "🔍",
      route: "/student-search"
    },

    {
      title: "Inactive Students",
      icon: "🚫",
      route: "/inactive-students"
    },

    {
      title: "Student Documents",
      icon: "📁",
      route: "/student-documents"
    },

    {
      title: "Roll Number Update",
      icon: "🔢",
      route: "/roll-number-update"
    },

    {
      title: "Section Transfer",
      icon: "🔄",
      route: "/section-transfer"
    },

    {
      title: "Promotion Management",
      icon: "⬆️",
      route: "/promotion-management"
    },

    {
      title: "Alumni Management",
      icon: "🎓",
      route: "/alumni-management"
    },

    {
      title: "Bulk Student Update",
      icon: "🛠️",
      route: "/bulk-student-update"
    },

    {
      title: "Data Export",
      icon: "📤",
      route: "/data-export"
    },

    {
      title: "Analytics & Reports",
      icon: "📊",
      route: "/student-reports"
    }

  ];

  return (
    <div className="student-hub-page">

      <div className="student-hub-header">

        <button
          className="back-btn"
          onClick={() => window.location.href = "/dashboard"}
        >
          ←
        </button>

        <div>
          <h1>Student Hub</h1>
          <p>
            Manage classes, sections, students,
            documents and reports
          </p>
        </div>

      </div>

      <div className="student-hub-grid">

        {cards.map((card, index) => (

          <div
            className="student-hub-card"
            key={index}

            onClick={() => {
              window.location.href = card.route;
            }}
          >

            <div className="student-hub-icon">
              {card.icon}
            </div>

            <h3>{card.title}</h3>

          </div>

        ))}

      </div>

    </div>
  );
}

export default StudentHub;