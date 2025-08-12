// router.js (patch: canonical route titles + header + sidebar labels)
import { Events } from './events.js';

const ROUTE_META = {
  parties:   { title: 'parties' },
  hotspots:  { title: 'hotspots' },
  map:       { title: 'map' },
  calendar:  { title: 'calendar' },
  invites:   { title: 'invites' },
  me:        { title: 'me' },
  settings:  { title: 'settings' },
};

export function route(to) {
  const name = (to || 'parties').replace('#','');
  const meta = ROUTE_META[name] || ROUTE_META.parties;

  // update URL fragment
  if (location.hash !== `#/${name}`) location.hash = `#/${name}`;

  // update header chip and H1 once
  const h1 = document.querySelector('.section-header .section-title-text');
  const chip = document.querySelector('.section-header .section-chip');
  if (h1 && chip) {
    h1.textContent = capitalize(meta.title);
    chip.textContent = `#${meta.title}`;
  }

  // ensure sidebar labels are "#channel"
  document.querySelectorAll('[data-route]').forEach(el => {
    const r = el.getAttribute('data-route');
    const lab = el.querySelector('.nav-label');
    if (lab) lab.textContent = `#${(ROUTE_META[r]?.title || r)}`;
    el.classList.toggle('active', r === name);
  });

  // Show/hide sections based on route
  document.querySelectorAll('section[data-route]').forEach(section => {
    const sectionRoute = section.getAttribute('data-route');
    section.hidden = sectionRoute !== name;
  });

  // let the page controller render into #content
  Events.emit('navigate', { route: name, container: document.getElementById('content') });
}

function capitalize(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

// wire clicks (passive must be false if we call preventDefault)
export function initRouter() {
  document.querySelectorAll('[data-route]').forEach(el=>{
    el.addEventListener('click', e=>{
      e.preventDefault();
      route(el.getAttribute('data-route'));
    }, { passive: false });
  });

  // initial route
  const frag = (location.hash || '#/parties').replace('#/','');
  route(frag);
}

window.addEventListener('hashchange', ()=> {
  const frag = (location.hash || '#/parties').replace('#/','');
  route(frag);
});

// Export for other modules
export default { route, initRouter };