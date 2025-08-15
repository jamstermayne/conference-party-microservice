import { ensureShell, setActive } from './shell.js?v=b031';
import "./gcal-hooks.js?v=b031";
import { scheduleEqualize } from './ui/equalize-cards.js';

export const ROUTES = ['parties','calendar','map','invites','contacts','me','settings'];
export const currentRoute = () => (location.hash.replace(/^#\/?/, '')||'parties').split('?')[0];

async function go(){
  await ensureShell();
  const r = currentRoute();
  setActive(r);
  const main = document.getElementById('main');
  if (main) main.innerHTML = '';

  switch(r){
    case 'parties':   await (await import('./events-controller.js?v=b031')).renderParties(main); break;
    case 'calendar':  await (await import('./views/calendar-providers.js?v=b031')).renderCalendar(main); break;
    case 'contacts':  await (await import('./contacts-panel.js?v=b031')).renderContacts?.(main); break;
    case 'invites':   await (await import('./invite-panel.js?v=b031')).renderInvites?.(main); break;
    case 'map':       await (await import('./views/map.js?v=b031')).renderMap?.(main); break;
    case 'me':        await (await import('./me-panel.js?v=b031')).renderMe?.(main); break;
    case 'settings':  await (await import('./settings-panel.js?v=b031')).renderSettings?.(main); break;
    default:          await (await import('./events-controller.js?v=b031')).renderParties(main);
  }
  
  // Schedule card equalization after view is mounted
  scheduleEqualize();
}
window.addEventListener('hashchange', go);
window.addEventListener('DOMContentLoaded', go);