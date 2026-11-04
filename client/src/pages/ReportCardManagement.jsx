import React from "react";
import { useNavigate } from "react-router-dom";
import "./reportCardManagement.css";
import { MODULES_REGISTRY } from "../constants/modulesRegistry";
import { useModulePermissions } from "../hooks/useModulePermissions";
import SubModuleCard from "../components/SubModuleCard";

function ReportCardManagement() {
  const navigate = useNavigate();
  const MODULE_KEY = "report_cards";
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
    <div className="report-card-page">
      <div className="report-card-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ←
        </button>

        <div>
          <h1>Report Card Management</h1>
          <p>Manage marks entry, result generation and report cards</p>
        </div>
      </div>

      <div className="report-card-grid">
        {cards.map((card) => {
          const enabled = isSubModuleEnabled(card.key);
          return (
            <SubModuleCard
              key={card.key}
              title={card.name}
              icon={card.icon}
              enabled={enabled}
              onClick={() => handleCardClick(card)}
            />
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

export default ReportCardManagement;