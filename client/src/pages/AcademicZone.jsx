import React from "react";
import "./academicZone.css";
import { useNavigate } from "react-router-dom";

function AcademicZone() {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Subject Setup",
      icon: "📘",
      path: "/academic-zone/subject-setup"
    },
    {
      title: "Class Subject Mapping",
      icon: "🏫",
      path: "/academic-zone/class-subject-mapping"
    },
    {
      title: "Student Subject Mapping",
      icon: "🎓",
      path: "/academic-zone/student-subject-mapping"
    },
    {
  title: "Analytics and Reports",
  icon: "📊",
  path: "/academic-zone/reports"
}
  ];

  return (
    <div className="academic-page">
      <div className="academic-header">
        <button
          className="back-btn"
          onClick={() => navigate("/dashboard")}
        >
          ←
        </button>

        <div>
          <h1>Academic Zone</h1>
          <p>
            Manage subjects, class mappings, student mappings and subject rules
          </p>
        </div>
      </div>

      <div className="academic-grid">
        {cards.map((card, index) => (
          <div
            className="academic-card"
            key={index}
            onClick={() => navigate(card.path)}
          >
            <div className="academic-icon">{card.icon}</div>
            <h3>{card.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AcademicZone;