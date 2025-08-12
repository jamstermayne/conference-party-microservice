// router.js (drop-in)
import Events from './events.js';

const routes = ['parties','hotspots','map','calendar','invites','me','settings'];

export function route(to) {
  if (!routes.includes(to)) to = 'parties';

  // update URL hash (no reload)
  if (location.hash !== `#/${to}`) history.replaceState({}, '', `#/${to}`);

  // title + chip
  const titleMap = {
    parties: 'Parties',
    hotspots: 'Hotspots',
    map: 'Map',
    calendar: 'Calendar',
    invites: 'Invites',
    me: 'Account',
    settings: 'Settings'
  };
  document.getElementById('page-title').textContent = titleMap[to];
  document.getElementById('route-chip').textContent = `#${to}`;

  // side nav active state
  document.querySelectorAll('.side-nav .nav-item').forEach(btn => {
    const active = btn.getAttribute('data-route') === to;
    btn.classList.toggle('active', active);
  });

  // render page content ONLY inside #page-root
  const root = document.getElementById('page-root');
  switch (to) {
    case 'parties':
      renderParties(root); break;
    case 'hotspots':
      renderHotspots(root); break;
    case 'map':
      renderMap(root); break;
    case 'calendar':
      renderCalendar(root); break;
    case 'invites':
      renderInvites(root); break;
    case 'me':
      renderAccount(root); break;
    case 'settings':
      renderSettings(root); break;
  }

  Events.emit('route:changed', to);
}

// wire clicks (non-passive, we use preventDefault)
export function initRouter() {
  document.querySelectorAll('.side-nav .nav-item').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      route(el.getAttribute('data-route'));
    }, { passive: false });
  });

  // initial
  const initial = (location.hash.replace('#/','') || 'parties');
  route(initial);
}

// Import render functions
async function renderParties(root) {
  const { renderParties } = await import('./events-controller.js');
  renderParties(root);
}

async function renderHotspots(root) {
  root.innerHTML = '<div class="section-card">Hotspots coming soon...</div>';
}

async function renderMap(root) {
  root.innerHTML = '<div class="section-card">Map coming soon...</div>';
}

async function renderCalendar(root) {
  root.innerHTML = '<div class="section-card">Calendar coming soon...</div>';
}

async function renderInvites(root) {
  root.innerHTML = '<div class="section-card">Invites coming soon...</div>';
}

async function renderAccount(root) {
  const AccountController = (await import('./controllers/account-controller.js')).default;
  if (!root.accountController) {
    root.accountController = new AccountController(root);
    root.accountController.mount();
  }
}

async function renderSettings(root) {
  root.innerHTML = '<div class="section-card">Settings coming soon...</div>';
}

// Export for other modules
export default { route, initRouter };