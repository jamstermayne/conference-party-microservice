// public/js/router.js
// Minimal, stable router with single export surface

const Router = (() => {
  const listeners = new Set();
  let current = location.hash || '#/parties';

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
    current = location.hash || '#/parties'; emit();
  });

  // initial fire
  queueMicrotask(emit);

  return { go, on, off, get route() { return current; } };
})();

// Single export only (avoid duplicate named exports)
export default Router;