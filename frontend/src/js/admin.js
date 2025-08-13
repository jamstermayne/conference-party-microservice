/**
 * Admin helpers (vanilla JS, production-safe)
 * - Whitelists your emails for the "Promote to Admin" control
 * - Persists admin flag in Store.profile.admin and localStorage
 * - Broadcasts Events for UI updates
 */
import Store from '/js/store.js';
import Events from '/assets/js/events.js';

const ADMIN_WHITELIST = new Set([
  'jamynigri@gmail.com',
  'jamy@nigriconsulting.com'
]);

export function getProfile() {
  return Store.get('profile') || {};
}

export function isWhitelistedEmail(email) {
  if (!email) return false;
  return ADMIN_WHITELIST.has(String(email).toLowerCase());
}

export function isAdmin() {
  const p = getProfile();
  return !!p.admin;
}

export function persistProfile(patch) {
  const current = getProfile();
  const next = { ...current, ...patch };
  Store.set('profile', next);
  try { localStorage.setItem('profile', JSON.stringify(next)); } catch {}
  Events.emit?.('profile:updated', next);
  return next;
}

export function promoteToAdmin() {
  const p = persistProfile({ admin: true });

  // Unlimited single-use invites flag (UI shows ∞)
  Store.set('invites.unlimited', true);
  Store.set('invites.left', Infinity);
  Events.emit?.('invite:quota:updated', { unlimited: true });

  // Nice toast & badge updates
  try { document.dispatchEvent(new CustomEvent('ui:toast', { detail: { type: 'ok', message: 'Admin mode enabled (unlimited invites).' }})); } catch {}

  return p;
}

export function demoteAdmin() {
  const p = persistProfile({ admin: false });
  // Fall back to normal pool if we previously toggled unlimited
  Store.set('invites.unlimited', false);
  if (!Number.isFinite(Store.get('invites.left'))) {
    Store.set('invites.left', 11); // sensible default; backend can overwrite
  }
  Events.emit?.('invite:quota:updated', { unlimited: false });
  try { document.dispatchEvent(new CustomEvent('ui:toast', { detail: { type: 'ok', message: 'Admin mode disabled.' }})); } catch {}
  return p;
}

export function ensureProfileFromEnv() {
  // If auth hasn't filled profile yet, try env (useful in early dev)
  const p = getProfile();
  if (!p.email && window.__ENV?.DEV_EMAIL) {
    persistProfile({
      email: window.__ENV.DEV_EMAIL,
      name: window.__ENV.DEV_NAME || 'Velocity User'
    });
  }
}

export default {
  isAdmin,
  isWhitelistedEmail,
  promoteToAdmin,
  demoteAdmin,
  ensureProfileFromEnv
};