// router.js (patch: canonical route titles + header + sidebar labels)
import { Events } from './events.js';
import AccountController from './controllers/account-controller.js';

// --- Sidebar model (single source of truth) ---
const NAV_ITEMS = [
  { id: 'parties',   label: '#parties'   },
  { id: 'hotspots',  label: '#hotspots'  },
  { id: 'map',       label: '#map'       },
  { id: 'calendar',  label: '#calendar'  },
  { id: 'invites',   label: '#invites'   },
  { id: 'me',        label: '#me'        },
  { id: 'account',   label: 'account', icon: '/assets/svg/user.svg' },
];

function renderSidebar() {
  const side = document.querySelector('[data-sidebar]');
  if (!side) return;
  side.innerHTML = `
    <nav class="side-nav">
      ${NAV_ITEMS.map(item => {
        if (item.icon) {
          return `
            <button class="side-item" data-route="${item.id}" aria-label="${item.id}">
              <img src="${item.icon}" alt="" class="nav-ico" aria-hidden="true" />
              <span class="name">${item.label}</span>
            </button>
          `;
        }
        return `
          <button class="side-item" data-route="${item.id}" aria-label="${item.id}">
            <span class="hash">#</span><span class="name">${item.id}</span>
          </button>
        `;
      }).join('')}
    </nav>`;
}

function setActive(routeId) {
  document.querySelectorAll('.side-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-route') === routeId);
  });
}

export function route(to) {
  const name = (to || 'parties').replace('#','');
  
  // update URL fragment
  if (location.hash !== `#/${name}`) location.hash = `#/${name}`;

  // update header chip and H1 once
  const h1 = document.querySelector('.section-header .section-title-text');
  const chip = document.querySelector('.section-header .section-chip');
  if (h1 && chip) {
    h1.textContent = capitalize(name);
    chip.textContent = `#${name}`;
  }

  // Update active sidebar
  setActive(name);

  // Show/hide sections based on route
  document.querySelectorAll('[data-view]').forEach(section => {
    const sectionRoute = section.getAttribute('data-view');
    section.hidden = sectionRoute !== name;
  });
  
  // Legacy sections support
  document.querySelectorAll('section[data-route]').forEach(section => {
    const sectionRoute = section.getAttribute('data-route');
    section.hidden = sectionRoute !== name;
  });

  // let the page controller render
  Events.emit('navigate', name);
  
  // Handle account controller
  if (name === 'account') {
    const root = document.querySelector('[data-view="account"]');
    if (root && !root.accountController) {
      root.accountController = new AccountController(root);
      root.accountController.mount();
    }
  }
}

function capitalize(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

// wire clicks (passive must be false if we call preventDefault)
let routerInitialized = false;
export function initRouter() {
  if (routerInitialized) return;
  routerInitialized = true;
  
  // Render sidebar on boot
  renderSidebar();
  
  // Click delegation
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-route]');
    if (!el) return;
    e.preventDefault();
    route(el.getAttribute('data-route'));
  }, { passive: false });

  // initial route
  const frag = (location.hash || '#/parties').replace('#/','');
  route(frag);
}

window.addEventListener('hashchange', ()=> {
  const frag = (location.hash || '#/parties').replace('#/','');
  route(frag);
});

// when routing changes, update active
Events.on('navigate', (path) => {
  const id = String(path || '').replace(/^#?\/?/, '') || 'parties';
  setActive(id);
});

// Export for other modules
export default { route, initRouter };