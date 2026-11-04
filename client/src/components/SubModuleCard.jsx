import React from "react";
import "./SubModuleCard.css";

/**
 * SubModuleCard - Centralized, attractive, enterprise-grade sub-module card
 *
 * @param {Object} props
 * @param {string} [props.title] - Title / name of the sub-module
 * @param {string} [props.name] - Fallback alias for title
 * @param {React.ReactNode|string} props.icon - Emoji or icon component
 * @param {boolean} [props.enabled=true] - Whether the submodule is enabled/unlocked
 * @param {Function} [props.onClick] - Click handler
 * @param {string} [props.badge] - Optional badge text
 * @param {string} [props.className] - Optional extra class names
 */
const SubModuleCard = ({
  title,
  name,
  icon,
  enabled = true,
  onClick,
  badge,
  className = "",
}) => {
  const displayTitle = title || name || "";
  const tooltip = enabled ? displayTitle : `${displayTitle} — Locked by Super Admin`;

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick(e);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={`submodule-card ${!enabled ? "submodule-card-locked" : ""} ${className}`.trim()}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      title={tooltip}
      aria-label={tooltip}
      aria-disabled={!enabled}
    >
      {/* Top subtle gradient sheen */}
      <div className="submodule-card-sheen" />

      {/* Top Header Row: Icon + Status / Lock / Arrow Button */}
      <div className="submodule-card-top-row">
        <div className="submodule-card-icon-wrapper">
          <span className="submodule-card-icon">{icon}</span>
        </div>

        <div className="submodule-card-action-top">
          {!enabled ? (
            <span className="submodule-lock-badge">
              <span className="submodule-lock-icon">🔒</span>
              <span>Locked</span>
            </span>
          ) : badge ? (
            <span className="submodule-custom-badge">{badge}</span>
          ) : (
            <div className="submodule-launch-circle" aria-hidden="true">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area: Title */}
      <div className="submodule-card-body">
        <h3 className="submodule-card-title">{displayTitle}</h3>
      </div>

      {/* Modern Card Bottom Row: Status Tag + Action Prompt */}
      <div className="submodule-card-bottom-row">
        <div className="submodule-status-tag">
          <span
            className={`submodule-status-dot ${!enabled ? "dot-locked" : "dot-active"}`}
          />
          <span>{enabled ? "Ready" : "Locked"}</span>
        </div>

        <div className="submodule-action-prompt">
          <span>{enabled ? "Manage" : "Restricted"}</span>
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="submodule-action-arrow"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default SubModuleCard;
