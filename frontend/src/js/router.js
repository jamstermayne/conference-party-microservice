/**
 * Minimal hash router + sidebar binder (production-safe).
 * Two-panel layout: sidebar + #app main. No third panel.
 */
import Events from '/assets/js/events.js';

const NAV = ['parties','hotspots','map','calendar','invites','me']; // no settings channel

let _sidebar, _app;

function norm(hash) {
  if (!hash) return 'parties';
  return hash.replace(/^#\/?/, '').split('?')[0] || 'parties';
}

export function currentRoute(){ return norm(location.hash); }

function setActive(r){
  if(!_sidebar) _sidebar = document.getElementById('sidebar');
  if(!_sidebar) return;
  _sidebar.querySelectorAll('.channel').forEach(btn=>{
    btn.classList.toggle('active', btn.getAttribute('data-route')===r);
  });
}

export function route(r){
  if(!r || !NAV.includes(r)) r='parties';
  if(location.hash !== `#/${r}`) location.hash = `#/${r}`;
  setActive(r);
  render(r);
  Events.emit?.('navigate', r);
}

async function render(r){
  _app = _app || document.getElementById('app');
  if(!_app) return;
  _app.innerHTML = ''; // no duplicate headings, no stray titles

  if(r==='parties'){
    const m = await import('./events-controller.js');
    return m.renderParties?.(_app);
  }
  if(r==='hotspots'){
    const m = await import('./hotspots.js');
    return m.renderHotspots?.(_app);
  }
  if(r==='calendar'){
    const m = await import('./calendar-view.js');
    return m.renderCalendar?.(_app);
  }
  if(r==='map'){
    const m = await import('./map-controller.js');
    return m.renderMap?.(_app);
  }
  if(r==='invites'){
    const m = await import('./invite-panel.js');
    return m.renderInvites?.(_app);
  }
  if(r==='me'){
    const m = await import('./account.js');
    return m.renderAccount?.(_app);
  }
}

export function bindSidebar(){
  _sidebar = document.getElementById('sidebar');
  if(!_sidebar) return;
  _sidebar.querySelectorAll('.channel').forEach(el=>{
    el.addEventListener('click', e=>{
      e.preventDefault();
      const name = el.getAttribute('data-route');
      route(name);
    }, { passive:false });
  });
}

window.addEventListener('hashchange', ()=>{
  const r = currentRoute();
  setActive(r);
  render(r);
});

document.addEventListener('DOMContentLoaded', ()=>{
  bindSidebar();
  const r = currentRoute();
  setActive(r);
  render(r);
});
