/**
 * Router - Single mount point, consistent versioning
 * Build: b011
 */

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
    const app = document.getElementById('app'); 
    if(app) app.innerHTML='';
    
    console.log(`[ROUTER b011] Loading route: ${r}`);
    
    switch(r){
      case 'parties': 
        (await import('./events-controller.js?v=b011')).renderParties(app); 
        break;
      case 'calendar': 
        (await import('./calendar-view.js?v=b011')).renderCalendar?.(app); 
        break;
      case 'map': 
        (await import('./map-controller.js?v=b011')).renderMap?.(app); 
        break;
      case 'hotspots': 
        (await import('./hotspots.js?v=b011')).renderHotspots?.(app); 
        break;
      case 'invites': 
        (await import('./invite-panel.js?v=b011')).renderInvites?.(app); 
        break;
      case 'contacts':
        (await import('./contacts-panel.js?v=b011')).renderContacts?.(app);
        break;
      case 'me':
        (await import('./me-panel.js?v=b011')).renderMe?.(app);
        break;
      case 'settings':
        (await import('./settings-panel.js?v=b011')).renderSettings?.(app);
        break;
      default: 
        (await import('./events-controller.js?v=b011')).renderParties(app); 
        break;
    }
    Events.emit?.(`route:${r}`);
  });
}

export const route=(name)=>{ 
  if(!name) return; 
  location.hash = `#${name}`; 
};

addEventListener('hashchange',tick); 
addEventListener('DOMContentLoaded',tick);