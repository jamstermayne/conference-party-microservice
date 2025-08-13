/**
 * Velocity Router (hash-based, stable)
 * Exports: bindSidebar, route, currentRoute
 */
import Events from '/assets/js/events.js';

const ROUTES = ['parties','hotspots','map','calendar','invites','contacts','me','settings'];
let _mount = null;

/** Normalize "#/name" → "name" (default 'parties') */
function normalize(hash) {
  if (!hash) return 'parties';
  return hash.replace(/^#\/?/, '').split('?')[0] || 'parties';
}

export function currentRoute() {
  return normalize(location.hash);
}

export function route(name) {
  const r = normalize('#/'+name);
  if (!ROUTES.includes(r)) return;
  if (location.hash !== '#/'+r) location.hash = '#/'+r;
  render(r);
}

export function bindSidebar() {
  _mount = document.getElementById('app') || document.getElementById('main');
  const sidebar = document.getElementById('sidebar') || document.querySelector('.channels');
  if (!sidebar) return;

  // click binding
  sidebar.querySelectorAll('[data-route]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const r = el.getAttribute('data-route');
      route(r);
    }, { passive:false });
  });

  // active state sync
  const applyActive = (r) => {
    sidebar.querySelectorAll('[data-route]').forEach(el => {
      const match = el.getAttribute('data-route') === r;
      el.classList.toggle('active', match);
      el.setAttribute('aria-current', match ? 'page' : 'false');
    });
    // Update route title
    Events.emit?.('navigate', r);
  };

  window.addEventListener('hashchange', () => {
    const r = currentRoute();
    applyActive(r);
    render(r);
  });

  const r0 = currentRoute();
  applyActive(r0);
  render(r0);
}

async function render(r) {
  _mount = _mount || document.getElementById('app') || document.getElementById('main');
  if (!_mount) return;
  _mount.innerHTML = ''; // always clear

  try {
    if (r === 'parties') {
      const m = await import('/js/events-controller.js');
      return m.renderParties?.(_mount);
    }
    if (r === 'hotspots') {
      const m = await import('/js/hotspots.js');
      return m.renderHotspots?.(_mount);
    }
    if (r === 'map') {
      const m = await import('/js/map-controller.js');
      return m.renderMap?.(_mount);
    }
    if (r === 'calendar') {
      const m = await import('/js/calendar-view.js'); // view has renderCalendar
      return m.renderCalendar?.(_mount);
    }
    if (r === 'invites') {
      const m = await import('/js/invite-panel.js');
      return m.renderInvites?.(_mount);
    }
    if (r === 'contacts') {
      const m = await import('/js/contacts-panel.js');
      return m.renderContacts?.(_mount);
    }
    if (r === 'me') {
      const m = await import('/js/account-panel.js');
      return m.renderAccount?.(_mount);
    }
    if (r === 'settings') {
      const m = await import('/js/settings-panel.js');
      return m.renderSettings?.(_mount);
    }
    // Fallback
    _mount.innerHTML = `<div class="section-card"><h2 class="text-heading">Not found</h2></div>`;
  } catch (e) {
    console.error('[router] render error', e);
    _mount.innerHTML = `<div class="section-card"><h2 class="text-heading">Loading error</h2><p class="text-secondary">${String(e)}</p></div>`;
  }
}

// Auto-bind on DOM ready if included via index.html
document.addEventListener('DOMContentLoaded', () => {
  try { bindSidebar(); } catch (e) { console.error('[router] bind error', e); }
});