// Central, dependency-free toast + confirmation service.
// Rendered by <ToastHost /> (mounted once in App). Replaces native alert() / confirm().

const DEFAULT_DURATION = { success: 4000, info: 4500, warning: 6000, error: 7000 };
const DEDUPE_MS = 1500;
const MAX_VISIBLE = 4;

let toasts = [];
let confirmState = null;
let nextId = 1;
const listeners = new Set();
const timers = new Map();

const emit = () => listeners.forEach((fn) => fn());

export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const getToasts = () => toasts;
export const getConfirm = () => confirmState;

// Keep raw server/stack details out of the UI
const clean = (message) => {
  let text = typeof message === "string" ? message : message?.message || String(message ?? "");
  text = text.split("\n    at ")[0].trim();
  if (/^Request failed with status code \d+/.test(text)) text = "Something went wrong. Please try again.";
  if (/^Network Error$/i.test(text)) text = "Cannot reach the server. Check your connection and try again.";
  if (text.length > 300) text = `${text.slice(0, 297)}...`;
  return text || "Something went wrong. Please try again.";
};

export const dismiss = (id) => {
  clearTimeout(timers.get(id));
  timers.delete(id);
  toasts = toasts.filter((t) => t.id !== id);
  emit();
};

const show = (message, type = "info", options = {}) => {
  const text = clean(message);
  const now = Date.now();

  const duplicate = toasts.find((t) => t.message === text && t.type === type && now - t.at < DEDUPE_MS);
  if (duplicate) return duplicate.id;

  const id = nextId++;
  toasts = [...toasts, { id, type, message: text, at: now }].slice(-MAX_VISIBLE);
  emit();

  const duration = options.duration ?? DEFAULT_DURATION[type] ?? 4500;
  if (duration > 0) timers.set(id, setTimeout(() => dismiss(id), duration));
  return id;
};

export const toast = {
  show,
  success: (message, options) => show(message, "success", options),
  error: (message, options) => show(message, "error", options),
  warning: (message, options) => show(message, "warning", options),
  info: (message, options) => show(message, "info", options),
  dismiss,
};

const ERROR_HINT = /\b(fail|failed|error|invalid|cannot|can't|unable|not found|denied|forbidden|unauthori[sz]ed|wrong|duplicate|already exists)\b/i;
const WARN_HINT = /\b(please|select|enter|required|must|missing|choose|fill|no .* (selected|available)|upload|only|maximum|minimum|at least)\b/i;
const SUCCESS_HINT = /\b(success|successfully|saved|created|added|updated|deleted|removed|assigned|generated|issued|done|completed|sent|approved|verified)\b/i;

// Drop-in replacement for alert(): picks a sensible type from the wording
export const notifyAlert = (message) => {
  const text = clean(message);
  if (ERROR_HINT.test(text) && !SUCCESS_HINT.test(text)) return toast.error(text);
  if (WARN_HINT.test(text) && !SUCCESS_HINT.test(text)) return toast.warning(text);
  if (SUCCESS_HINT.test(text)) return toast.success(text);
  return toast.info(text);
};

/**
 * Drop-in replacement for window.confirm(): `if (!(await confirmDialog("Delete this?"))) return;`
 * Resolves true on confirm, false on cancel / Escape / backdrop click.
 */
export const confirmDialog = (message, options = {}) =>
  new Promise((resolve) => {
    const text = clean(message);
    // Only one dialog at a time: a newer request cancels the older one
    if (confirmState) confirmState.resolve(false);
    confirmState = {
      message: text,
      title: options.title || "Please confirm",
      confirmLabel: options.confirmLabel || "Confirm",
      cancelLabel: options.cancelLabel || "Cancel",
      input: Boolean(options.input),
      inputState: options.__state || null,
      placeholder: options.placeholder || "",
      danger: options.danger ?? /\b(delete|remove|cancel|reset|suspend|deactivate|discard|permanent)/i.test(text),
      resolve: (value) => {
        confirmState = null;
        emit();
        resolve(value);
      },
    };
    emit();
  });

/**
 * Drop-in replacement for window.prompt() for a required free-text reason.
 * Resolves the entered text, or null when cancelled.
 */
export const promptDialog = async (message, options = {}) => {
  const state = { value: "" };
  const result = await confirmDialog(message, { title: "Enter details", confirmLabel: "Submit", ...options, input: true, __state: state });
  return result ? state.value : null;
};
