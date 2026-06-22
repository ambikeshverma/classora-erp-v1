import React from "react";
import AppButton from "../AppButton";

function ColumnSetupPopup({
  allColumns = [],
  selectedColumns = [],
  setSelectedColumns,
  onClose,
}) {
  const availableColumns = allColumns.filter(
    (column) =>
      !selectedColumns.some(
        (selected) => selected.key === column.key
      )
  );

  const handleAddColumn = (column) => {
    setSelectedColumns([...selectedColumns, column]);
  };

  const handleRemoveColumn = (column) => {
    if (selectedColumns.length === 1) {
      alert("At least one column is required in the report.");
      return;
    }

    setSelectedColumns(
      selectedColumns.filter((item) => item.key !== column.key)
    );
  };

  const moveColumnUp = (index) => {
    if (index === 0) return;

    const updated = [...selectedColumns];

    [updated[index - 1], updated[index]] = [
      updated[index],
      updated[index - 1],
    ];

    setSelectedColumns(updated);
  };

  const moveColumnDown = (index) => {
    if (index === selectedColumns.length - 1) return;

    const updated = [...selectedColumns];

    [updated[index + 1], updated[index]] = [
      updated[index],
      updated[index + 1],
    ];

    setSelectedColumns(updated);
  };

  return (
    <div className="popup-overlay">
      <div className="column-popup">
        <div className="popup-head">
          <h2>Select Fields</h2>

          <button
            type="button"
            className="popup-close-btn"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="column-popup-section">
          <h3>Available Fields</h3>

          <div className="field-list">
            {availableColumns.length === 0 ? (
              <p className="empty-small">No available field</p>
            ) : (
              availableColumns.map((column) => (
                <button
                  type="button"
                  key={column.key}
                  onClick={() => handleAddColumn(column)}
                >
                  {column.label}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="column-popup-section">
          <h3>Selected Fields</h3>

          <div className="field-list selected">
            {selectedColumns.map((column, index) => (
              <div className="selected-field-row" key={column.key}>
                <button
                  type="button"
                  onClick={() => handleRemoveColumn(column)}
                >
                  ✓ {column.label}
                </button>

                <div className="move-buttons">
                  <button
                    type="button"
                    onClick={() => moveColumnUp(index)}
                    disabled={index === 0}
                  >
                    ↑
                  </button>

                  <button
                    type="button"
                    onClick={() => moveColumnDown(index)}
                    disabled={index === selectedColumns.length - 1}
                  >
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <AppButton type="primary" onClick={onClose}>
            Apply
          </AppButton>
        </div>
      </div>
    </div>
  );
}

export default ColumnSetupPopup;