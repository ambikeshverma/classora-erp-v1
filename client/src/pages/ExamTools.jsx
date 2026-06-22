import React from "react";
import "./examTools.css";

function ExamTools() {

  const cards = [
    {
      title: "Exam Setup",
      icon: "🧾",
      path: "/exam-setup",
    },

    {
      title: "Exam Marks Setup",
      icon: "📘",
      path: "/exam-marks-setup",
    },

    {
      title: "Exam Timetable",
      icon: "🗓️",
      path: "/exam-timetable",
    },

    {
      title: "Admit Card and Deskslip",
      icon: "🎫",
      path: "/admit-card",
    },
  ];

  return (
    <div className="exam-page">

      <div className="exam-header">

        <button
          className="back-btn"
          onClick={() =>
            (window.location.href =
              "/dashboard")
          }
        >
          ←
        </button>

        <div>

          <h1>
            Exam Tools
          </h1>

          <p>
            Manage exams, timetable and
            admit cards
          </p>

        </div>

      </div>

      <div className="exam-grid">

        {cards.map((card, index) => (

          <div
            className="exam-card"
            key={index}
            onClick={() =>
              (window.location.href =
                card.path)
            }
          >

            <div className="exam-icon">
              {card.icon}
            </div>

            <h3>
              {card.title}
            </h3>

          </div>

        ))}

      </div>

    </div>
  );
}

export default ExamTools;