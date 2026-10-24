import React from "react";
import { useNavigate } from "react-router-dom";
import "./examTools.css";
import { MODULES_REGISTRY } from "../constants/modulesRegistry";
import { useModulePermissions } from "../hooks/useModulePermissions";

function ExamTools() {
  const navigate = useNavigate();
  const MODULE_KEY = "exam_tools";
  const { isSubModuleEnabled, showLockNotice, toastMessage } = useModulePermissions(MODULE_KEY);

  const moduleDef = MODULES_REGISTRY.find((m) => m.key === MODULE_KEY);
  const cards = moduleDef ? moduleDef.subModules : [];

  const handleCardClick = (card) => {
    if (!isSubModuleEnabled(card.key)) {
      showLockNotice(card.name);
      return;
    }
    navigate(card.route);
  };

  return (
    <div className="exam-page">
      <div className="exam-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ←
        </button>

        <div>
          <h1>Exam Tools</h1>
          <p>Manage exams, timetable and admit cards</p>
        </div>
      </div>

      <div className="exam-grid">
        {cards.map((card) => {
          const enabled = isSubModuleEnabled(card.key);
          return (
            <div
              className={`exam-card ${!enabled ? "submodule-card-locked" : ""}`}
              key={card.key}
              onClick={() => handleCardClick(card)}
              title={enabled ? card.name : `${card.name} — Locked by Super Admin`}
            >
              {!enabled && <span className="submodule-lock-badge">🔒 Locked</span>}
              <div className="exam-icon">{card.icon}</div>
              <h3>{card.name}</h3>
            </div>
          );
        })}
      </div>

      {toastMessage && (
        <div className="submodule-toast-banner">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default ExamTools;