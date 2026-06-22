import React from "react";
import "./userControl.css";

function UserControl() {

  const cards = [

    {
      title: "User Management",
      icon: "👤",
      route: "/user-management",
    },

    {
      title: "Class Teacher Assignment",
      icon: "🏫",
      route: "/class-teacher-assignment",
    },

    {
      title: "Subject Teacher Assignment",
      icon: "📚",
      route: "/subject-teacher-assignment",
    },

  ];

  return (

    <div className="user-control-page">

      <div className="user-control-header">

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
            User Control
          </h1>

          <p>
            Manage user types, users and teacher/coordinator assignments
          </p>

        </div>

      </div>

      <div className="user-control-grid">

        {cards.map((card, index) => (

          <div
            className="user-control-card"
            key={index}
            onClick={() =>
              (window.location.href =
                card.route)
            }
          >

            <div className="user-control-icon">
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

export default UserControl;