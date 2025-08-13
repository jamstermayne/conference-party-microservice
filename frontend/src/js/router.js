import Events from '/assets/js/events.js';
import { ensureShell, setActive } from './shell.js';

export const ROUTES = ['parties','calendar','map','hotspots','invites','contacts','me','settings'];
export const currentRoute = () => (location.hash.replace(/^#\/?/, '')||'parties').split('?')[0];

let ticking=false;
function tick(){
  if(ticking) return; ticking=true;
  queueMicrotask(async ()=>{
    ticking=false;
    await ensureShell();
    const r = currentRoute();
    setActive(r);
    const app = document.getElementById('app'); if(app) app.innerHTML='';
    switch(r){
      case 'parties': (await import('./events-controller.js')).renderParties(app); break;
      case 'calendar': (await import('./calendar-view.js')).renderCalendar?.(app); break;
      case 'map': (await import('./map-controller.js')).renderMap?.(app); break;
      case 'hotspots': (await import('./hotspots.js')).renderHotspots?.(app); break;
      case 'invites': (await import('./invite-panel.js')).renderInvites?.(app); break;
      default: (await import('./events-controller.js')).renderParties(app); break;
    }
    Events.emit?.(`route:${r}`);
  });
}
export const route=(name)=>{ if(!name) return; location.hash = `#${name}`; };
addEventListener('hashchange',tick); addEventListener('DOMContentLoaded',tick);