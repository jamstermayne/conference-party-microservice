// selection-store.js (ESM)
import Events from './events.js';

const KEY = 'savedEvents_v1';
const LIMIT = 3;

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function write(arr) { localStorage.setItem(KEY, JSON.stringify(arr)); }

let saved = read(); // [{id, title, startsAt, endsAt, venue}]

export function getSaved() { return [...saved]; }
export function countSaved() { return saved.length; }
export function canSaveMore() { return saved.length < LIMIT; }
export function isSaved(id) { return saved.some(e => e.id === id); }

export function toggleSave(eventObj) {
  const idx = saved.findIndex(e => e.id === eventObj.id);
  if (idx >= 0) {
    saved.splice(idx, 1);
    write(saved);
    Events.emit('saved:changed', { type: 'removed', id: eventObj.id, total: saved.length });
    return { ok: true, action: 'removed', total: saved.length };
  }
  if (!canSaveMore()) {
    Events.emit('ui:toast', { message: 'You can only save 3 events', type: 'warn' });
    return { ok: false, action: 'limit', total: saved.length };
  }
  saved.push({
    id: eventObj.id,
    title: eventObj.title,
    startsAt: eventObj.startsAt,
    endsAt: eventObj.endsAt,
    venue: eventObj.venue
  });
  write(saved);
  Events.emit('saved:changed', { type: 'added', id: eventObj.id, total: saved.length });
  return { ok: true, action: 'added', total: saved.length };
}

// Utility for UI to refresh button states across the page
export function applyStateToButtons(root = document) {
  const total = countSaved();
  root.querySelectorAll('[data-action="save"]').forEach(btn => {
    const id = btn.getAttribute('data-id');
    const active = isSaved(id);
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));

    // Disable if at limit and this one isn't saved yet
    const disable = !active && total >= 3;
    btn.disabled = disable;
    btn.classList.toggle('is-disabled', disable);
    btn.textContent = active ? 'Saved' : 'Save & Sync';
  });

  const counterEl = root.querySelector('[data-saved-counter]');
  if (counterEl) counterEl.textContent = `${total}/3 selected`;
}