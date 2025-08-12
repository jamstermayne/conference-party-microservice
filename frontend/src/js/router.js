// router.js  v3
import Events from './events.js';
import { renderParties } from './events-controller.js';
import { renderHotspots } from './hotspots-controller.js';
import { renderMap } from './map-controller.js';
import { renderCalendar } from './calendar-view.js';
import { renderInvites } from './invite-panel.js';
import { renderAccount } from './account.js';
import setTitles from './route-title.js';

const routes = ['parties','hotspots','map','calendar','invites','me','settings'];
const root = () => document.getElementById('page-root');

export function route(to) {
  // accept '#/parties', 'parties', '/parties'
  const clean = String(to || '').replace(/^#\/?/, '').replace(/^\//, '');
  const r = routes.includes(clean) ? clean : 'parties';

  const el = root();
  if (!el) return;
  switch (r) {
    case 'hotspots': renderHotspots(el); break;
    case 'map':      renderMap(el); break;
    case 'calendar': renderCalendar(el); break;
    case 'invites':  renderInvites(el); break;
    case 'me':       renderAccount(el); break;
    case 'settings': el.innerHTML = `<div class="section-card"><h2>Settings</h2></div>`; break;
    default:         renderParties(el);
  }

  // update titles + sidebar
  Events.emit('route:changed', r);
  highlightSidebar(r);
}

function highlightSidebar(r) {
  document.querySelectorAll('[data-route]').forEach(btn=>{
    btn.classList.toggle('active', btn.dataset.route === r);
    // ensure single '#'
    const label = btn.querySelector('.label');
    if (label) {
      const name = btn.dataset.route || '';
      label.textContent = name;
    }
  });
}

export function initRouter() {
  // bind sidebar buttons
  document.querySelectorAll('[data-route]').forEach(el=>{
    // structure expected: <button data-route="map"><span class="hash">#</span><span class="label">map</span></button>
    el.addEventListener('click', (e)=>{
      e.preventDefault();
      route(el.dataset.route);
    }, { passive:false });
  });

  // initial route
  const hash = location.hash.replace(/^#\/?/, '');
  route(hash || 'parties');

  // hash navigation
  window.addEventListener('hashchange', ()=>{
    const h = location.hash.replace(/^#\/?/, '');
    route(h || 'parties');
  });
}

export default { route, initRouter };