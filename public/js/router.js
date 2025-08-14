import { ensureShell, setActive } from './shell.js?v=b021';

export const ROUTES = ['parties','calendar','map','hotspots','invites','contacts','me','settings'];
export const currentRoute = () => (location.hash.replace(/^#\/?/, '')||'parties').split('?')[0];

async function go(){
  await ensureShell();
  const r = currentRoute();
  setActive(r);
  const main = document.getElementById('main');
  if (main) main.innerHTML = '';

  switch(r){
    case 'parties':   (await import('./events-controller.js?v=b021')).renderParties(main); break;
    case 'calendar':  (await import('./calendar-view.js?v=b021')).renderCalendar(main); break;
    case 'contacts':  (await import('./contacts-panel.js?v=b021')).renderContacts?.(main); break;
    case 'invites':   (await import('./invite-panel.js?v=b021')).renderInvites?.(main); break;
    case 'map':       (await import('./map-controller.js?v=b021')).renderMap?.(main); break;
    case 'hotspots':  (await import('./hotspots.js?v=b021')).renderHotspots?.(main); break;
    default:          (await import('./events-controller.js?v=b021')).renderParties(main);
  }
}
window.addEventListener('hashchange', go);
window.addEventListener('DOMContentLoaded', go);