import React from "react";
import { useNavigate } from "react-router-dom";
import "./attendanceSystem.css";
import { MODULES_REGISTRY } from "../constants/modulesRegistry";
import { useModulePermissions } from "../hooks/useModulePermissions";

function AttendanceSystem() {
  const navigate = useNavigate();
  const MODULE_KEY = "attendance";
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
    <div className="attendance-page">
      <div className="attendance-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ←
        </button>

        <div>
          <h1>Attendance System</h1>
          <p>Manage student attendance, staff attendance, leave and attendance lock</p>
        </div>
      </div>

      <div className="attendance-grid">
        {cards.map((card) => {
          const enabled = isSubModuleEnabled(card.key);
          return (
            <div
              className={`attendance-card ${!enabled ? "submodule-card-locked" : ""}`}
              key={card.key}
              onClick={() => handleCardClick(card)}
              title={enabled ? card.name : `${card.name} — Locked by Super Admin`}
            >
              {!enabled && <span className="submodule-lock-badge">🔒 Locked</span>}
              <div className="attendance-icon">{card.icon}</div>
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

export default AttendanceSystem;