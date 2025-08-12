// public/js/router.js
// Minimal, stable router with single export surface

const VALID_ROUTES = new Set(['parties','hotspots','opportunities','calendar','invites','me','settings']);

function initialRoute() {
  const hash = (location.hash || '').replace(/^#\/?/, '');
  const route = hash.split('?')[0].toLowerCase();
  if (VALID_ROUTES.has(route)) return `#/${route}`;
  return '#/parties'; // safe default
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

// Single export only (avoid duplicate named exports)
export default Router;