// public/js/app-wireup.js
// Minimal app bootstrap: installs listeners, triggers initial route, confirms boot.

import Router, { initRouter, bindSidebar } from '/js/router.js';
import Flags from '/assets/js/featureFlags.js';

// PATCH 3: Sidebar visibility based on feature flags
function hydrateSidebar() {
  const map = [
    { sel: '[data-route="parties"]', key: 'nav.parties' },
    { sel: '[data-route="hotspots"]', key: 'nav.hotspots' },
    { sel: '[data-route="map"]', key: 'nav.map' },
    { sel: '[data-route="opportunities"]', key: 'nav.opportunities' },
    { sel: '[data-route="calendar"]', key: 'nav.calendar' },
    { sel: '[data-route="invites"]', key: 'nav.invites' },
    { sel: '[data-route="me"]', key: 'nav.me' },
    { sel: '[data-route="settings"]', key: 'nav.settings' },
  ];

  map.forEach(({ sel, key }) => {
    const el = document.querySelector(sel);
    if (!el) return;
    const allowed = Flags.get(key, true); // ✅ default true
    el.style.display = allowed === false ? 'none' : '';
  });
}

// PATCH 4: Safe routing helper
function safeRouteTo(route) {
  const current = (location.hash || '').replace(/^#\/?/, '').split('?')[0];
  if (current !== route) location.hash = `#/${route}`;
}

(function boot() {
  try {
    // route change → metrics
    window.addEventListener('hashchange', () => {
      try { window.Metrics?.trackRoute?.(location.hash || '#/parties'); } catch {}
    });

    // first paint
    window.Metrics?.track?.('app_boot', { ts: Date.now() });

    // PATCH 4: Don't force route if already on a valid one
    const currentRoute = (location.hash || '').replace(/^#\/?/, '').split('?')[0].trim();
    const validRoutes = ['parties', 'hotspots', 'calendar', 'invites', 'opportunities', 'me', 'settings'];
    const DEFAULT_ROUTE = (window.__ENV?.DEFAULT_ROUTE) || 'parties';
    
    // Only navigate if no hash present or invalid route
    if (!location.hash || !validRoutes.includes(currentRoute)) {
      if (!currentRoute) {
        Router.go(`#/${DEFAULT_ROUTE}`);
      }
    }

    // Set up sidebar hydration
    document.addEventListener('flags:ready', hydrateSidebar);
    document.addEventListener('DOMContentLoaded', () => {
      hydrateSidebar();
      bindSidebar();
      initRouter();
      // force sidebar visible on first load
      document.documentElement.classList.remove('sidenav-collapsed');
    });

    console.log('✅ App wire-up complete');
  } catch (e) {
    console.error('wire-up error', e);
  }
})();

// PATCH 5: Ensure router respects current hash after all initializers
window.addEventListener('load', () => {
  const r = (location.hash || '').replace(/^#\/?/, '').split('?')[0];
  if (r && r !== 'parties') {
    // Re-emit a hashchange to force the right panel without redirect
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }
});

// Export helpers for other modules
window.safeRouteTo = safeRouteTo;

// Active-state sync on route changes + invite badge wiring
(function initSidebarActive() {
  const list = document.getElementById('sidenav-list');
  if (!list) return;

  function setActiveFromHash() {
    const r = (location.hash || '').replace(/^#\/?/, '').split('?')[0] || 'parties';
    list.querySelectorAll('.nav-item').forEach(btn => {
      const isActive = btn.dataset.route === r;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
  }

  // Click → navigate without extra work
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('.nav-item');
    if (!btn) return;
    const route = btn.dataset.route;
    if (route) location.hash = `#/${route}`;
  });

  window.addEventListener('hashchange', setActiveFromHash);
  document.addEventListener('DOMContentLoaded', setActiveFromHash);
  setActiveFromHash();

  // Invite badge (shows remaining invites if available)
  const badgeInv = document.getElementById('badge-invites');
  try {
    const invitesLeft = window.Store?.get?.('invites.left');
    if (typeof invitesLeft === 'number') {
      badgeInv.textContent = String(invitesLeft);
      badgeInv.hidden = invitesLeft <= 0;
    }
    document.addEventListener('invites:updated', (e) => {
      const n = e.detail?.left ?? 0;
      badgeInv.textContent = String(n);
      badgeInv.hidden = n <= 0;
    });
  } catch {}
})();

// Initialize calendar features
import { calendarWireup } from '/js/calendar-integration.js';
document.addEventListener('DOMContentLoaded', () => {
  try { calendarWireup(); } catch(e) { console.warn('Calendar wireup failed:', e); }
});