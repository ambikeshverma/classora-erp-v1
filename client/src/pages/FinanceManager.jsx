import React from "react";
import { useNavigate } from "react-router-dom";
import "./financeManager.css";
import { MODULES_REGISTRY } from "../constants/modulesRegistry";
import { useModulePermissions } from "../hooks/useModulePermissions";
import SubModuleCard from "../components/SubModuleCard";

function FinanceManager() {
  const navigate = useNavigate();
  const MODULE_KEY = "finance";
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
    <div className="finance-page">
      <div className="finance-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ←
        </button>

        <div>
          <h1>Finance Manager</h1>
          <p>Manage income, expenses and accounting structure</p>
        </div>
      </div>

      <div className="finance-grid">
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

export default FinanceManager;