import Events from '/assets/js/events.js';
const ROUTES = ['parties','hotspots','map','calendar','invites','me'];
const appEl = ()=>document.getElementById('app');
const norm = h => (h||'parties').replace(/^#\/?/, '').split('?')[0] || 'parties';
function setActive(r){
  document.querySelectorAll('#sidenav [data-route]').forEach(a=>{
    const on = a.getAttribute('data-route')===r;
    a.classList.toggle('active', on);
    a.setAttribute('aria-current', on?'page':'false');
  });
}
export function bindSidebar(){
  document.querySelectorAll('#sidenav [data-route]').forEach(a=>{
    a.addEventListener('click', e=>{
      e.preventDefault();
      const r=a.getAttribute('data-route');
      if(location.hash!=='#/'+r) location.hash='#/'+r;
      route('#/'+r);
    }, {passive:false});
  });
}
export async function route(hash){
  const r = norm(hash); const app = appEl(); if(!app) return;
  setActive(r); app.innerHTML='';
  switch(r){
    case 'parties':   (await import('./events-controller.js')).renderParties?.(app); break;
    case 'hotspots':  (await import('./hotspots.js')).renderHotspots?.(app); break;
    case 'map':       (await import('./map-controller.js')).renderMap?.(app); break;
    case 'calendar':  (await import('./calendar-view.js')).renderCalendar?.(app); break;
    case 'invites':   (await import('./invite-panel.js')).renderInvites?.(app); break;
    case 'me':        (await import('./me-controller.js')).renderMe?.(app); break;
    default:          (await import('./events-controller.js')).renderParties?.(app);
  }
  Events?.emit?.('route:enter', r);
}
