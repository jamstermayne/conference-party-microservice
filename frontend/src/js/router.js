import { ensureShell, setActive } from './shell.js?v=b022';

const ROUTES = ['parties','calendar','map','hotspots','invites','contacts','me','settings'];
const currentRoute = () => (location.hash.replace(/^#\/?/, '')||'parties').split('?')[0];

export async function route(){
  await ensureShell();
  const r = currentRoute();
  setActive?.(r);
  const mount = document.getElementById('main'); 
  if (mount) mount.innerHTML = '';

  switch(r){
    case 'parties':   (await import('./events-controller.js?v=b022')).renderParties(mount); break;
    case 'calendar':  (await import('./calendar-view.js?v=b022')).renderCalendar(mount);   break;
    case 'contacts':  (await import('./contacts-panel.js?v=b022')).renderContacts(mount); break;
    case 'invites':   (await import('./invite-panel.js?v=b022')).renderInvites(mount);     break;
    case 'map':       (await import('./map-controller.js?v=b022')).renderMap(mount);       break;
    case 'hotspots':  (await import('./hotspots.js?v=b022')).renderHotspots(mount);        break;
    case 'me':        (await import('./me-panel.js?v=b022')).renderMe(mount);              break;
    case 'settings':  (await import('./settings-panel.js?v=b022')).renderSettings(mount);  break;
    default:          (await import('./events-controller.js?v=b022')).renderParties(mount);
  }
}
window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', route);