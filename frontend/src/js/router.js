// public/js/router.js
// Minimal, stable router with single export surface

const VALID_ROUTES = new Set(['parties','hotspots','map','opportunities','calendar','invites','me','settings']);
const DEFAULT_ROUTE = (window.__ENV?.DEFAULT_ROUTE) || 'parties';

function initialRoute() {
  const hash = (location.hash || '').replace(/^#\/?/, '');
  const route = hash.split('?')[0].toLowerCase().trim();
  if (VALID_ROUTES.has(route)) return `#/${route}`;
  // Only set default if no route present
  const current = (location.hash || '').replace(/^#\/?/, '').trim();
  if (!current) {
    return `#/${DEFAULT_ROUTE}`;
  }
  return `#/${DEFAULT_ROUTE}`; // safe default
}

const Router = (() => {
  const listeners = new Set();
  let current = initialRoute();

  function go(hash) {
    if (hash && hash !== current) {
      current = hash;
      location.hash = hash;
      emit();
    }
  }

  function on(fn) { listeners.add(fn); }
  function off(fn) { listeners.delete(fn); }
  function emit() { listeners.forEach(fn => { try { fn(current); } catch(e) { console.error(e); } }); }

  window.addEventListener('hashchange', () => {
    current = initialRoute(); 
    emit();
  });

  // initial fire
  queueMicrotask(emit);

  return { go, on, off, get route() { return current; } };
})();

// Add initRouter function
export function initRouter() {
  // Respect current hash; fall back to 'parties' only if none
  const raw = (location.hash || '').replace(/^#\/?/, '');
  const initial = raw || 'parties';
  Router.go(`#/${initial}`);
}

// Single export only (avoid duplicate named exports)
export default Router;