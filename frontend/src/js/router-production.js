// Production Router: Client-side routing for SPA
import Events from './events.js';

// Parse route path into route object
function parse(path) {
  const cleanPath = path.replace(/^#?\/?/, '').replace(/\/+$/, '');
  const parts = cleanPath.split('/').filter(Boolean);
  
  if (!parts.length) return { name: 'home', path: '/' };
  
  // Main routes
  if (parts[0] === 'events') return { name: 'events', path: '/events' };
  if (parts[0] === 'people') return { name: 'people', path: '/people' };
  if (parts[0] === 'opportunities') return { name: 'opportunities', path: '/opportunities' };
  if (parts[0] === 'me' || parts[0] === 'profile') return { name: 'me', path: '/me' };
  if (parts[0] === 'onboarding') return { name: 'onboarding', path: '/onboarding' };
  
  // Special routes with parameters
  if (parts[0] === 'invite' && parts[1]) {
    return { name: 'invite', code: parts[1], path: `/invite/${parts[1]}` };
  }
  
  if (parts[0] === 'event' && parts[1]) {
    return { name: 'event-detail', id: parts[1], path: `/event/${parts[1]}` };
  }
  
  if (parts[0] === 'auth') {
    if (parts[1] === 'linkedin' && parts[2] === 'callback') {
      return { name: 'linkedin-callback', path: '/auth/linkedin/callback' };
    }
    return { name: 'auth', path: '/auth' };
  }
  
  // Calendar routes
  if (parts[0] === 'calendar') {
    if (parts[1] === 'sync') return { name: 'calendar-sync', path: '/calendar/sync' };
    return { name: 'calendar', path: '/calendar' };
  }
  
  // Settings routes
  if (parts[0] === 'settings') {
    if (parts[1]) return { name: 'settings-section', section: parts[1], path: `/settings/${parts[1]}` };
    return { name: 'settings', path: '/settings' };
  }
  
  return { name: 'unknown', path: cleanPath };
}

// Navigate to a new route
export function navigate(path, options = {}) {
  const { replace = false, state = {} } = options;
  
  // Normalize path
  if (!path.startsWith('/') && !path.startsWith('#')) {
    path = '/' + path;
  }
  
  // Use hash routing for better compatibility
  const hashPath = path.startsWith('#') ? path : '#' + path;
  
  if (replace) {
    history.replaceState(state, '', hashPath);
  } else {
    history.pushState(state, '', hashPath);
  }
  
  route();
}

// Process current route
export function route() {
  const hash = window.location.hash.slice(1) || '/';
  const routeInfo = parse(hash);
  
  // Add query parameters to route info
  const queryString = window.location.search;
  if (queryString) {
    const params = new URLSearchParams(queryString);
    routeInfo.params = Object.fromEntries(params);
  }
  
  // Add state from history
  routeInfo.state = history.state || {};
  
  // Emit route change event
  Events.emit('route:change', routeInfo);
  
  // Update active nav items
  updateNavigation(routeInfo);
  
  return routeInfo;
}

// Update navigation UI based on current route
function updateNavigation(routeInfo) {
  // Remove all active classes
  document.querySelectorAll('.nav-item, .tab-item, [data-route]').forEach(el => {
    el.classList.remove('active', 'is-active');
  });
  
  // Add active class to matching elements
  const routeName = routeInfo.name;
  
  // Update nav items
  document.querySelectorAll(`[data-route="${routeName}"]`).forEach(el => {
    el.classList.add('active', 'is-active');
  });
  
  // Update tab bar if present
  const tabMap = {
    'home': 'now',
    'people': 'people',
    'opportunities': 'opportunities', 
    'events': 'events',
    'me': 'me'
  };
  
  const tabName = tabMap[routeName];
  if (tabName) {
    document.querySelectorAll(`[data-tab="${tabName}"]`).forEach(el => {
      el.classList.add('active');
    });
  }
}

// Go back in history
export function back() {
  history.back();
}

// Go forward in history
export function forward() {
  history.forward();
}

// Get current route
export function getCurrentRoute() {
  const hash = window.location.hash.slice(1) || '/';
  return parse(hash);
}

// Check if a route matches current route
export function isCurrentRoute(path) {
  const current = getCurrentRoute();
  const check = parse(path);
  return current.name === check.name;
}

// Route guards
const guards = new Map();

export function addGuard(routeName, guardFn) {
  if (!guards.has(routeName)) {
    guards.set(routeName, new Set());
  }
  guards.get(routeName).add(guardFn);
}

export function removeGuard(routeName, guardFn) {
  guards.get(routeName)?.delete(guardFn);
}

// Check route guards before navigation
async function checkGuards(routeInfo) {
  const routeGuards = guards.get(routeInfo.name);
  if (!routeGuards) return true;
  
  for (const guard of routeGuards) {
    const canProceed = await guard(routeInfo);
    if (!canProceed) return false;
  }
  
  return true;
}

// Enhanced route with guards
async function routeWithGuards() {
  const routeInfo = getCurrentRoute();
  const canProceed = await checkGuards(routeInfo);
  
  if (!canProceed) {
    // Navigation was prevented by guard
    Events.emit('route:blocked', routeInfo);
    return;
  }
  
  route();
}

// Initialize router
export function init() {
  // Listen for browser navigation
  window.addEventListener('popstate', routeWithGuards);
  window.addEventListener('hashchange', routeWithGuards);
  
  // Handle link clicks
  document.addEventListener('click', (e) => {
    // Check if it's a route link
    const link = e.target.closest('a[href^="#"], [data-navigate]');
    if (!link) return;
    
    e.preventDefault();
    
    const href = link.getAttribute('href') || link.dataset.navigate;
    if (href) {
      navigate(href.replace(/^#/, ''));
    }
  });
  
  // Listen for navigation events
  Events.on('navigate', (path) => {
    if (typeof path === 'string') {
      navigate(path);
    } else if (path && path.route) {
      navigate(path.route, path.options);
    }
  });
  
  // Add default auth guard for protected routes
  const protectedRoutes = ['people', 'opportunities', 'me', 'calendar', 'settings'];
  protectedRoutes.forEach(route => {
    addGuard(route, (routeInfo) => {
      const user = window.Store?.get('user');
      if (!user) {
        Events.emit('auth:required', { from: routeInfo });
        navigate('/', { replace: true });
        return false;
      }
      return true;
    });
  });
  
  // Initial route
  routeWithGuards();
}

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);

// Export router API
export default {
  navigate,
  route,
  back,
  forward,
  getCurrentRoute,
  isCurrentRoute,
  addGuard,
  removeGuard,
  init,
  parse
};