/**
 * Router - Single mount point, consistent versioning
 * Build: b016
 */
import Events from '/assets/js/events.js?v=b011';
import { ensureShell, setActive } from './shell.js?v=b011';

export const ROUTES = ['parties','calendar','map','hotspots','invites','contacts','me','settings'];
export const currentRoute = () => (location.hash.replace(/^#\/?/, '')||'parties').split('?')[0];

export async function route(){
  await ensureShell();
  const r = currentRoute();
  setActive(r);

  const main = document.getElementById('main');
  if (!main) return;

  // hard reset the mount and inject a namespaced wrapper
  main.innerHTML = `<div id="view" class="view view--${r}"></div>`;
  const mount = document.getElementById('view');

  switch(r){
    case 'parties':
      (await import('./events-controller.js?v=b011')).renderParties(mount);
      break;
    case 'calendar':
      (await import('./calendar-view.js?v=b011')).renderCalendar?.(mount);
      break;
    case 'map':
      (await import('./map-controller.js?v=b011')).renderMap?.(mount);
      break;
    case 'hotspots':
      (await import('./hotspots.js?v=b011')).renderHotspots?.(mount);
      break;
    case 'invites':
      (await import('./invite-panel.js?v=b011')).renderInvites?.(mount);
      break;
    case 'contacts':
      (await import('./contacts-panel.js?v=b011')).renderContacts?.(mount);
      break;
    case 'me':
      (await import('./me-panel.js?v=b011')).renderMe?.(mount);
      break;
    case 'settings':
      (await import('./settings-panel.js?v=b011')).renderSettings?.(mount);
      break;
    default:
      (await import('./events-controller.js?v=b011')).renderParties(mount);
      break;
  }
  Events.emit?.(`route:${r}`);
}

window.addEventListener('hashchange', route, { passive:true });
window.addEventListener('DOMContentLoaded', route, { passive:true });