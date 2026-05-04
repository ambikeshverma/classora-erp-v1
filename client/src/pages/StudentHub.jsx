import React from "react";
import "./studentHub.css";

function StudentHub() {
  const cards = [
    { title: "Class Management", icon: "🏫" },
    { title: "Section Management", icon: "🧩" },
    { title: "Medium Management", icon: "🌐" },
    { title: "House Management", icon: "🏠" },
    { title: "House Allocation", icon: "🏠" },
    { title: "Sibling Management", icon: "👨‍👩‍👧‍👦" },
    { title: "Student Search", icon: "🔍" },
    { title: "Inactive Students", icon: "🚫" },
    { title: "Student Documents", icon: "📁" },
    { title: "Roll Number Update", icon: "🔢" },
    { title: "Section Transfer", icon: "🔄" },
    { title: "Promotion Management", icon: "⬆️" },
    { title: "Alumni Management", icon: "🎓" },
    { title: "Bulk Student Update", icon: "🛠️" },
    { title: "Data Export", icon: "📤" },
    { title: "Analytics & Reports", icon: "📊" }
  ];

  return (
    <div className="student-hub-page">
      <div className="student-hub-header">
        <button className="back-btn" onClick={() => window.location.href = "/dashboard"}>
          ←
        </button>

        <div>
          <h1>Student Hub</h1>
          <p>Manage classes, sections, students, documents and reports</p>
        </div>
      </div>

      <div className="student-hub-grid">
        {cards.map((card, index) => (
          <div className="student-hub-card" key={index}>
            <div className="student-hub-icon">{card.icon}</div>
            <h3>{card.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StudentHub;