/**
 * router.js – tiny hash router with sidebar binding.
 * Guarantees at most one render per tick.
 */

import Events from '/assets/js/events.js';

const NAV = ['parties','calendar','map','hotspots','invites','contacts','me','settings'];
let ticking = false;

export function currentRoute(){
  return (location.hash.replace(/^#\/?/, '') || 'parties').split('?')[0];
}

function normRoute(h){
  return (h || '').replace(/^#\/?/, '') || 'parties';
}

export function bindSidebar(){
  const list = document.querySelector('.sidebar nav, .sidebar');
  if (!list) return;

  list.querySelectorAll('[data-route]').forEach(el=>{
    el.addEventListener('click', (e)=>{
      e.preventDefault();
      const r = el.getAttribute('data-route');
      if (!r) return;
      if (currentRoute() === r) return;
      location.hash = `#${r}`;
    }, { passive:false });
  });
}

async function dispatch(route){
  const app = document.getElementById('app') || document.getElementById('main');
  if (app) app.innerHTML = '';
  switch(route){
    case 'parties':
      (await import('./events-controller.js')).renderParties(app);
      Events.emit?.('route:parties');
      break;
    case 'hotspots':
      (await import('./hotspots.js')).renderHotspots?.(app);
      Events.emit?.('route:hotspots');
      break;
    case 'calendar':
      (await import('./calendar-view.js')).renderCalendar?.(app);
      Events.emit?.('route:calendar');
      break;
    case 'map':
      (await import('./map-controller.js')).renderMap?.(app);
      Events.emit?.('route:map');
      break;
    case 'invites':
      (await import('./invite-panel.js')).renderInvites?.(app);
      Events.emit?.('route:invites');
      break;
    default:
      (await import('./events-controller.js')).renderParties(app);
      Events.emit?.('route:parties');
      break;
  }
}

function tick(){
  if (ticking) return;
  ticking = true;
  queueMicrotask(()=>{
    ticking = false;
    const r = normRoute(location.hash).split('?')[0];
    dispatch(r);
  });
}

window.addEventListener('hashchange', tick);
window.addEventListener('DOMContentLoaded', ()=>{
  bindSidebar();
  tick();
});

export function route(name){
  if (!name) return;
  location.hash = `#${name}`;
}