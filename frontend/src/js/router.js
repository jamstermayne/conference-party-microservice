/**
 * Minimal hash router + sidebar binder (production-safe).
 * Exports: bindSidebar, route, currentRoute
 */
import Events from '/assets/js/events.js';

const NAV = ['parties','hotspots','map','calendar','invites','me','settings'];
let _sidebarEl = null;
let _current = null;

/** Normalize "#/name" → "name" */
function norm(hash) {
  if (!hash) return 'parties';
  return hash.replace(/^#\/?/, '').split('?')[0] || 'parties';
}

/** Route change handler */
function route(to) {
  _current = norm(to || location.hash);
  if (_sidebarEl) {
    _sidebarEl.querySelectorAll('[data-nav]').forEach(el => {
      el.classList.toggle('active', el.dataset.nav === _current);
    });
  }
  document.querySelectorAll('[data-panel]').forEach(p => {
    p.style.display = (p.dataset.panel === _current) ? 'block' : 'none';
  });
}

/** Bind sidebar nav clicks */
export function bindSidebar(sidebarEl) {
  _sidebarEl = sidebarEl;
  _sidebarEl.addEventListener('click', e => {
    const btn = e.target.closest('[data-nav]');
    if (btn) {
      location.hash = btn.dataset.nav;
    }
  });
  window.addEventListener('hashchange', () => route());
  route();
}

export function currentRoute() {
  return _current;
}