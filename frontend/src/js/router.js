/**
 * router.js — minimal hash router
 * Exports: bindSidebar, route, currentRoute
 */
import Events from '/assets/js/events.js';

const NAV = new Set(['parties','hotspots','map','calendar','invites','me','settings']);
let _sidebarEl = null;
let _current = null;

function norm(hash) {
  const clean = String(hash || '').replace(/^#\/?/, '').split('?')[0];
  return NAV.has(clean) ? clean : 'parties';
}

export function bindSidebar(el) {
  _sidebarEl = el;
  el.querySelectorAll('[data-route]').forEach(node => {
    node.addEventListener('click', (e) => {
      e.preventDefault();
      route(node.dataset.route);
    }, { passive:false });
  });
}

export function route(name) {
  if (!NAV.has(name)) return;
  if (name === _current) return;
  window.location.hash = name;
  setActive(name);
  Events.emit('route', name);
}

export function currentRoute() {
  return _current || norm(location.hash) || 'parties';
}

function setActive(name) {
  _current = name;
  if (_sidebarEl) {
    _sidebarEl.querySelectorAll('[data-route]').forEach(n => n.classList.toggle('active', n.dataset.route === name));
  }
  // show/hide panels if they exist
  document.querySelectorAll('[data-panel]').forEach(p => {
    p.hidden = (p.getAttribute('data-panel') !== name);
  });
}

window.addEventListener('hashchange', () => {
  setActive(norm(location.hash));
});

document.addEventListener('DOMContentLoaded', () => {
  setActive(norm(location.hash));
  // Fire initial route for controllers
  Events.emit('route', currentRoute());
});