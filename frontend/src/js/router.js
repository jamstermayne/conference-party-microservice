import { ensureShell, setActive } from './shell.js?v=b031';
import "./gcal-hooks.js?v=b031";
import "./map-hooks.js?v=b031";
import { scheduleEqualize } from './ui/equalize-cards.js';

export const ROUTES = ['parties','calendar','map','invites','contacts','me','settings'];
export const currentRoute = () => {
  const hash = location.hash.replace(/^#\/?/, '') || 'parties';
  // Extract base route (e.g., 'map' from 'map/2025-08-22')
  const route = hash.split('/')[0].split('?')[0];
  return route;
};

async function go(){
  await ensureShell();
  const r = currentRoute();
  setActive(r);
  const main = document.getElementById('main');
  if (main) main.innerHTML = '';

  // Update sidebar data-subnav attribute for route-scoped subnav
  const sidebar = document.getElementById('sidebar') || document.querySelector('.v-sidenav');
  if (sidebar) {
    // Only show subnav on map route
    sidebar.setAttribute('data-subnav', r === 'map' ? 'map' : '');
  }

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

// Sync sidebar active state with current route
(function syncSidebarActive(){
  const links = [...document.querySelectorAll('.v-nav__link[data-route]')];
  if (!links.length) return;

  const apply = () => {
    const h = location.hash || '#/parties';
    // Match routes - handle both #/route and #route formats
    const currentPath = h.replace(/^#\/?/, '').split('?')[0];
    links.forEach(a => {
      const linkRoute = a.dataset.route;
      const isActive = currentPath === linkRoute || 
                      (currentPath === '' && linkRoute === 'parties'); // Default route
      a.classList.toggle('active', isActive);
      // Set aria-current for accessibility
      if (isActive) {
        a.setAttribute('aria-current', 'page');
      } else {
        a.removeAttribute('aria-current');
      }
    });
  };

  window.addEventListener('hashchange', apply);
  document.addEventListener('DOMContentLoaded', apply);
  apply();
})();