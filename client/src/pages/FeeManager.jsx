import React from "react";
import { useNavigate } from "react-router-dom";
import "./feeManager.css";
import { MODULES_REGISTRY } from "../constants/modulesRegistry";
import { useModulePermissions } from "../hooks/useModulePermissions";
import SubModuleCard from "../components/SubModuleCard";

function FeeManager() {
  const navigate = useNavigate();
  const MODULE_KEY = "fee_manager";
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
    <div className="fee-page">
      <div className="fee-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ←
        </button>

        <div>
          <h1>Fee Manager</h1>
          <p>Manage fee collection, receipts, fines, transport fee and fee reports</p>
        </div>
      </div>

      <div className="fee-grid">
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

export default FeeManager;