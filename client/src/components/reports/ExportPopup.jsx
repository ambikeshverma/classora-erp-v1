import React from "react";
import AppButton from "../AppButton";

function ExportPopup({ onClose, onExport }) {
  return (
    <div className="popup-overlay">
      <div className="export-popup">
        <div className="popup-head">
          <h2>Export Report</h2>

          <button
            type="button"
            className="popup-close-btn"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="export-options">
          <AppButton type="primary" onClick={() => onExport("pdf")}>
            PDF
          </AppButton>

          <AppButton type="primary" onClick={() => onExport("excel")}>
            Excel
          </AppButton>
        </div>
      </div>
    </div>
  );
}

export default ExportPopup;