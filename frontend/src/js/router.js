// Minimal hash router + sidebar binder (production)
import Events from './events.js';

const ROUTES = [
  { id:'parties',   label:'#parties'   },
  { id:'hotspots',  label:'#hotspots'  },
  { id:'map',       label:'#map'       },
  { id:'calendar',  label:'#calendar'  },
  { id:'invites',   label:'#invites'   },
  { id:'me',        label:'#me'        },
  { id:'account',   label:'account'    }, // icon-only item (no '#')
];

const views = {
  parties:  () => import('./events-controller.js').then(m=>m.renderParties()),
  hotspots: () => import('./hotspots-controller.js').then(m=>m.renderHotspots?.()),
  map:      () => import('./map-controller.js').then(m=>m.renderMap?.()),
  calendar: () => import('./calendar-integration.js').then(m=>m.renderCalendar?.()),
  invites:  () => import('./invite-panel.js').then(m=>m.renderInvites?.()),
  me:       () => import('./profile-controller.js').then(m=>m.renderProfile?.()),
  account:  () => import('./account-controller.js').then(m=>m.renderAccount()),
};

function setActive(routeId) {
  document.querySelectorAll('.side-nav .nav-item').forEach(el=>{
    el.classList.toggle('active', el.dataset.route === routeId);
  });
}

export function navigate(routeId) {
  const id = ROUTES.some(r=>r.id===routeId) ? routeId : 'parties';
  if (location.hash !== `#/${id}`) location.hash = `#/${id}`;
  setActive(id);
  // Clean, single title region
  const h = document.getElementById('page-title');
  if (h) h.textContent = id === 'account' ? 'Account' : id.charAt(0).toUpperCase()+id.slice(1);
  // load view
  return views[id]?.().catch(()=> {
    const main = document.getElementById('main') || document.getElementById('page-root');
    if (main) main.innerHTML = `<div class="card card-outlined"><div class="text-secondary">This feature isn't available yet.</div></div>`;
  });
}

export function route(name) { return navigate(name); }

export function bindSidebar() {
  const nav = document.querySelector('.side-nav');
  if (!nav) return;
  // rebuild once to prevent duplicates/bleed
  nav.innerHTML = '';
  for (const r of ROUTES) {
    const btn = document.createElement('button');
    btn.className = 'nav-item';
    btn.dataset.route = r.id;
    btn.innerHTML = `<span class="label">${r.label}</span>`;
    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      navigate(r.id);
    }, { passive:false });
    nav.appendChild(btn);
  }
  // mark active by hash
  const id = (location.hash.replace('#/','')||'parties');
  setActive(id);
}

function routeFromHash() {
  return (location.hash.replace('#/','') || 'parties');
}

// boot
window.addEventListener('hashchange', ()=> navigate(routeFromHash()));
export function startRouter() { bindSidebar(); return navigate(routeFromHash()); }
export default { navigate, bindSidebar, startRouter, route };