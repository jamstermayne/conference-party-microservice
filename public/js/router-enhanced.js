// Router wiring (vanilla, Slack-style)
import Events from '/assets/js/events.js';
import { mountHotspots, unmountHotspots } from '/js/hotspots-controller.js';

const ROUTES = ['parties','hotspots','calendar','invites','opportunities','me','settings'];
const VALID_ROUTES = new Set(ROUTES);

export function navigate(route) {
  if (!ROUTES.includes(route)) route = 'parties';

  // Toggle sections
  document.querySelectorAll('[data-route]').forEach(sec => {
    if (sec.tagName === 'SECTION') {
      sec.hidden = sec.getAttribute('data-route') !== route;
    }
  });

  // Toggle left-nav active state
  document.querySelectorAll('.side-nav .nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.route === route);
  });

  // Update page title
  const pageTitle = document.getElementById('page-title');
  if (pageTitle) {
    pageTitle.textContent = route.charAt(0).toUpperCase() + route.slice(1);
  }

  // Route-specific mounts/unmounts
  try {
    // Track route change
    if (window.Metrics?.trackRoute) {
      window.Metrics.trackRoute(route);
    }
  } catch {}

  // Handle route-specific mounting
  if (route === 'hotspots') {
    requestAnimationFrame(() => mountHotspots());
  } else {
    unmountHotspots();
  }

  if (route === 'calendar' && window.mountCalendar) {
    requestAnimationFrame(() => window.mountCalendar());
  }

  // Emit for controllers that listen
  Events.emit('route:changed', { route });

  // Reflect in URL (hash-based for your app)
  if (location.hash !== `#/${route}`) {
    history.replaceState({}, '', `#/${route}`);
  }
}

// Safe bind for sidebar clicks (runs once)
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.nav-item[data-route]');
  if (!btn) return;
  const route = btn.getAttribute('data-route');
  if (!route) return;
  e.preventDefault();
  
  // Update URL
  window.history.replaceState({}, '', `#/${route}`);
  
  // Update active states
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  btn.classList.add('active');
  
  // Navigate to route
  navigate(route);
  
  // Close mobile menu if open
  const sidenav = document.getElementById('sidenav');
  const overlay = document.getElementById('overlay');
  if (sidenav && sidenav.classList.contains('open')) {
    sidenav.classList.remove('open');
    if (overlay) overlay.hidden = true;
  }
});

// Helper to determine initial route from URL
function initialRoute() {
  const hash = (location.hash || '').replace(/^#\/?/, '');
  const route = hash.split('?')[0].toLowerCase();
  if (VALID_ROUTES.has(route)) return route;
  return 'parties'; // safe default
}

// Handle hash changes
window.addEventListener('hashchange', () => {
  const route = initialRoute();
  navigate(route);
});

// Initial boot - don't force navigation if already on a valid route
export function bootRouter() {
  const start = initialRoute();
  // Avoid double-pushing if we're already on that route
  const currentHash = location.hash.replace(/^#\/?/, '').split('?')[0];
  if (!location.hash || currentHash !== start) {
    location.hash = `#/${start}`;
  } else {
    // Already on the route, just navigate to set up the UI
    navigate(start);
  }
}

// Auto-boot on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootRouter);
} else {
  bootRouter();
}

export default { navigate, bootRouter };