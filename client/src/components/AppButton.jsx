import React from "react";
import "./AppButton.css";

function AppButton({ type = "primary", children, onClick, disabled = false }) {
  return (
    <button
      className={`app-btn app-btn-${type}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default AppButton;