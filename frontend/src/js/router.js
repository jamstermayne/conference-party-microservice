/**
 * Router - robust mount resolver (no wrapper injection)
 * Build: b017
 */
import Events from '/assets/js/events.js?v=b011';
import { ensureShell, setActive } from './shell.js?v=b011';

export const ROUTES = ['parties','calendar','map','hotspots','invites','contacts','me','settings'];
export const currentRoute = () => (location.hash.replace(/^#\/?/, '')||'parties').split('?')[0];

function resolveMount(){
  let el = document.getElementById('main') || document.getElementById('app') || document.getElementById('view');
  if (!el) {
    el = document.createElement('div');
    el.id = 'main';
    document.body.appendChild(el);
  }
  el.innerHTML = '';
  return el;
}

export async function route(){
  await ensureShell();
  const r = currentRoute();
  setActive(r);

  const mount = resolveMount();

  try {
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
  } catch (e) {
    console.error('[ROUTER] route error', e);
    mount.innerHTML = `<div style="padding:1rem;color:#f88">⚠️ Failed to load view: ${r}</div>`;
  }

  Events.emit?.(`route:${r}`);
}

window.addEventListener('hashchange', route, { passive:true });
window.addEventListener('DOMContentLoaded', route, { passive:true });