/**
 * UI feedback utilities shared across controllers
 * - emptyState: returns an accessible empty-state node
 * - toast: dispatches app-wide toast event (non-blocking)
 */

export function emptyState(message = 'Nothing to show yet.') {
  const el = document.createElement('div');
  el.className = 'card card-outlined card-compact text-secondary';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.textContent = message;
  return el;
}

export function toast(message, type = 'ok') {
  try {
    document.dispatchEvent(new CustomEvent('ui:toast', { detail: { type, message } }));
  } catch { /* no-op */ }
}