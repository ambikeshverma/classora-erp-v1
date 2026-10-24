import React from "react";
import { useNavigate } from "react-router-dom";
import "./academicZone.css";
import { MODULES_REGISTRY } from "../constants/modulesRegistry";
import { useModulePermissions } from "../hooks/useModulePermissions";

function AcademicZone() {
  const navigate = useNavigate();
  const MODULE_KEY = "academic_zone";
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
    <div className="academic-page">
      <div className="academic-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ←
        </button>

        <div>
          <h1>Academic Zone</h1>
          <p>Manage subjects, class mappings, student mappings and subject rules</p>
        </div>
      </div>

      <div className="academic-grid">
        {cards.map((card) => {
          const enabled = isSubModuleEnabled(card.key);
          return (
            <div
              className={`academic-card ${!enabled ? "submodule-card-locked" : ""}`}
              key={card.key}
              onClick={() => handleCardClick(card)}
              title={enabled ? card.name : `${card.name} — Locked by Super Admin`}
            >
              {!enabled && <span className="submodule-lock-badge">🔒 Locked</span>}
              <div className="academic-icon">{card.icon}</div>
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

export default AcademicZone;