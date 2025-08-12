// public/js/router.js
// Minimal, stable router with single export surface

const APP_NAME = 'Velocity';
const ROUTES = ['parties','hotspots','map','calendar','invites','me','settings'];
const VALID_ROUTES = new Set(ROUTES);
const DEFAULT_ROUTE = (window.__ENV?.DEFAULT_ROUTE) || 'parties';

export function route(to) {
  if (!to || !ROUTES.includes(to)) to = 'parties';
  window.location.hash = `#/${to}`;
  document.dispatchEvent(new CustomEvent('navigate', { detail: { to }}));
}

// util: set active channel + section rail
function applyActiveUI(routeId) {
  // Sidebar
  document.querySelectorAll('.side-nav .nav-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-route') === routeId);
  });
  
  // Sections: mark the one in view with rail
  document.querySelectorAll('main .section-rail').forEach(sec => {
    const route = sec.getAttribute('data-route');
    const isCurrent = route === routeId;
    sec.toggleAttribute('hidden', !isCurrent);
    sec.classList.toggle('is-current', isCurrent);
  });
}

// bind on load + hashchange
export function initRouter() {
  const apply = () => {
    const hash = (location.hash.replace('#/','') || 'parties');
    // sidebar active state
    document.querySelectorAll('[data-route]').forEach(el=>{
      el.classList.toggle('active', el.getAttribute('data-route')===hash);
    });
    // page title h1
    document.getElementById('page-title')?.replaceChildren(document.createTextNode(cap(hash)));
    // **browser tab title**
    document.title = `${APP_NAME} — ${cap(hash)}`;
    
    // Show/hide sections based on route
    document.querySelectorAll('section[data-route]').forEach(section => {
      const route = section.getAttribute('data-route');
      section.hidden = route !== hash;
    });
    
    // Apply active UI with rails
    applyActiveUI(hash);
    
    document.dispatchEvent(new CustomEvent('route:changed', { detail: { hash }}));
  };
  window.addEventListener('hashchange', apply);
  apply();
}

function cap(s){ return s.charAt(0).toUpperCase()+s.slice(1); }

// wire sidebar buttons once (app-wireup.js calls this)
export function bindSidebar() {
  document.querySelectorAll('[data-route]').forEach(el=>{
    el.addEventListener('click', e=>{
      e.preventDefault();
      route(el.getAttribute('data-route'));
    }, { passive: false });
  });
}

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

// Single export only (avoid duplicate named exports)
export default Router;