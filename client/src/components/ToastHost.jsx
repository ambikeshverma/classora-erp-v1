import React, { useEffect, useRef, useSyncExternalStore } from "react";
import { subscribe, getToasts, getConfirm, dismiss } from "../utils/toast";
import "./toastHost.css";

const ICONS = { success: "✓", error: "!", warning: "!", info: "i" };

const ConfirmModal = ({ state }) => {
  const cancelRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    (state.input ? inputRef : cancelRef).current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") state.resolve(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [state]);

  return (
    <div className="app-confirm-backdrop" onClick={() => state.resolve(false)}>
      <div
        className="app-confirm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="app-confirm-title"
        aria-describedby="app-confirm-message"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="app-confirm-title">{state.title}</h3>
        <p id="app-confirm-message">{state.message}</p>
        {state.input && (
          <textarea
            ref={inputRef}
            className="app-confirm-input"
            placeholder={state.placeholder}
            onChange={(e) => {
              state.inputState.value = e.target.value;
            }}
            rows={3}
          />
        )}
        <div className="app-confirm-actions">
          <button ref={cancelRef} type="button" className="app-confirm-btn" onClick={() => state.resolve(false)}>
            {state.cancelLabel}
          </button>
          <button
            type="button"
            className={`app-confirm-btn ${state.danger ? "danger" : "primary"}`}
            onClick={() => state.resolve(true)}
          >
            {state.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

function ToastHost() {
  const toasts = useSyncExternalStore(subscribe, getToasts);
  const confirmState = useSyncExternalStore(subscribe, getConfirm);

  return (
    <>
      <div className="app-toast-region" role="region" aria-label="Notifications" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`app-toast ${t.type}`} role={t.type === "error" ? "alert" : "status"}>
            <span className="app-toast-icon" aria-hidden="true">
              {ICONS[t.type]}
            </span>
            <span className="app-toast-message">{t.message}</span>
            <button type="button" className="app-toast-close" onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
              ×
            </button>
          </div>
        ))}
      </div>
      {confirmState && <ConfirmModal state={confirmState} />}
    </>
  );
}

export default ToastHost;
