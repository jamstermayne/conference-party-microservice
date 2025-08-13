import Events from '/assets/js/events.js';
import { mountSidebar } from '/js/sidebar.js';
const ROUTES = ['parties','hotspots','map','calendar','invites','me','settings','contacts'];
const appEl = ()=>document.getElementById('app');
const norm = h => (h||'parties').replace(/^#\/?/, '').split('?')[0] || 'parties';
// Mount sidebar once on DOM ready
document.addEventListener('DOMContentLoaded', ()=>{
  try { mountSidebar('#sidebar'); } catch(e){console.error('Sidebar mount error:', e);}
});
export async function route(hash){
  const r = norm(hash); 
  const app = appEl() || document.getElementById('main');
  if(!app) return;
  app.innerHTML = '';
  switch(r){
    case 'parties':   (await import('./events-controller.js')).renderParties?.(app); break;
    case 'hotspots':  (await import('./hotspots.js')).renderHotspots?.(app); break;
    case 'map':       (await import('./map-controller.js')).renderMap?.(app); break;
    case 'calendar':  (await import('./calendar-view.js')).renderCalendar?.(app); break;
    case 'invites':   (await import('./invite-panel.js')).renderInvites?.(app); break;
    case 'contacts':  (await import('./contacts.js')).renderContacts?.(app); break;
    case 'me':        (await import('./me-controller.js')).renderMe?.(app); break;
    case 'settings':  (await import('./settings-panel.js')).renderSettings?.(app); break;
    default:          (await import('./events-controller.js')).renderParties?.(app);
  }
  Events?.emit?.('route:changed', { route: r });
}

// Handle hash changes
window.addEventListener('hashchange', ()=> route(location.hash));

// Initial route on load
window.addEventListener('DOMContentLoaded', ()=> route(location.hash));

// Export for backwards compatibility
export function bindSidebar() {
  // No-op, sidebar is now self-mounting
}
