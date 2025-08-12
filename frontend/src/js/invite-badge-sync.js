/**
 * Invite badge sync (production)
 * - Listens to invites:changed and patches sidebar badge
 * - Announces changes via #aria-live if present
 */
import Store from './store.js';
import Events from './events.js';

const BADGE_SEL = '[data-route="invites"], .nav-item[data-route="invites"]';

function renderBadge(left) {
  const btn = document.querySelector(BADGE_SEL);
  if (!btn) return;
  let badge = btn.querySelector('.badge');
  if (!badge) {
    badge = document.createElement('span');
    badge.className = 'badge badge-primary';
    btn.appendChild(badge);
  }
  badge.textContent = String(left);
  // ARIA announce
  const live = document.getElementById('aria-live');
  if (live) { live.textContent = ''; setTimeout(() => (live.textContent = `You have ${left} invites`), 24); }
}

function sync() {
  const left = Number(Store.get('invites.left') || 0);
  renderBadge(left);
}

Events.on && Events.on('invites:changed', ({ left }) => renderBadge(Number(left || 0)));
document.addEventListener('visibilitychange', () => { if (!document.hidden) sync(); });

// Initial
sync();
console.log('✅ Invite badge sync loaded');