const CHANNELS = [
  'parties','calendar','map','hotspots','invites','contacts','me','settings'
];

export function renderNav(){
  const nav = document.getElementById('nav');
  if(!nav) return;
  nav.innerHTML = CHANNELS.map(c => `
    <a href="#/${c}" data-route="${c}" class="v-link" id="nav-${c}">
      <span class="hash">#</span><span class="label">${c}</span>
    </a>
  `).join('');
}

export function bindSidebar(){
  const nav = document.getElementById('nav');
  if(!nav) return;
  nav.querySelectorAll('a.v-link').forEach(a=>{
    a.addEventListener('click', e=>{
      e.preventDefault();
      const r = a.getAttribute('data-route');
      route('#/'+r);
    }, { passive:false });
  });
}

export function currentRoute(){
  const h = location.hash.replace(/^#\/?/, '').split('?')[0];
  return h || 'parties';
}

export function route(hash){
  if (hash) location.hash = hash;
  const r = currentRoute();
  // highlight active
  document.querySelectorAll('.v-nav a').forEach(a => a.classList.remove('active'));
  const active = document.getElementById('nav-'+r);
  active?.classList.add('active');
  // set title
  const title = document.getElementById('routeTitle');
  if (title) title.textContent = '#'+r;

  // mount view
  const app = document.getElementById('app');
  if (!app) return;
  app.innerHTML = '';

  const routes = {
    parties: () => import('./events-controller.js').then(m => m.renderParties?.(app)),
    calendar: () => import('./calendar-view.js').then(m => m.renderCalendar?.(app)),
    map: () => import('./map-controller.js').then(m => m.renderMap?.(app)),
    hotspots: () => import('./hotspots.js').then(m => m.renderHotspots?.(app)),
    invites: () => import('./invite-panel.js').then(m => m.renderInvites?.(app)),
    contacts: () => import('./contacts.js').then(m => m.renderContacts?.(app)),
    me: () => import('./account.js').then(m => m.renderAccount?.(app)),
    settings: () => import('./settings.js').then(m => m.renderSettings?.(app)),
  };
  (routes[r] || routes['parties'])?.();
}