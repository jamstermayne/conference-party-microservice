/**
 * UI feedback utilities (shared, production)
 * Exports both named + default so any import style works.
 */
function emptyState(message = 'Nothing to show yet.') {
  const el = document.createElement('div');
  el.className = 'card card-outlined card-compact text-secondary';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.textContent = message;
  return el;
}

function toast(message, type = 'ok') {
  try { document.dispatchEvent(new CustomEvent('ui:toast', { detail: { type, message } })); } catch {}
  const live = document.getElementById('aria-live');
  if (live) { live.textContent = ''; setTimeout(() => (live.textContent = String(message)), 30); }
}

export { emptyState, toast };
export default { emptyState, toast };