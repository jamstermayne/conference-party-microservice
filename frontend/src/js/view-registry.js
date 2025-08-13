/**
 * VIEW REGISTRY — single source of truth for mount + loader (idempotent)
 */

const V = window.__ENV?.BUILD ? `?v=${window.__ENV.BUILD}` : '';

// Map routes to their mount element and loader
const VIEWS = {
  'parties': {
    mount: '#events-list',
    loader: () => import('/js/events-controller.js?v=b022' + V).then(m => m.renderEvents)
  },
  'hotspots': {
    mount: '#hotspots-root',
    loader: () => import('/js/hotspot-controller.js?v=b022' + V).then(m => m.renderHotspots)
  },
  'map': {
    mount: '#map-root',
    loader: () => import('/js/map-controller.js?v=b022' + V).then(m => m.renderMap)
  },
  'calendar': {
    mount: '#calendar-root',
    loader: () => import('/js/calendar-view.js?v=b022' + V).then(m => m.renderCalendar)
  },
  'invites': {
    mount: '#invites-root',
    loader: () => import('/js/invite-controller.js?v=b022' + V).then(m => m.renderInvites)
  },
  'me': {
    mount: '#account-root',
    loader: () => import('/js/account.js?v=b022' + V).then(m => m.renderAccount)
  },
  'settings': {
    mount: '#account-root',  // Same as 'me'
    loader: () => import('/js/account.js?v=b022' + V).then(m => m.renderAccount)
  }
};

// Track what's been rendered to avoid re-renders
const rendered = new Set();

export async function renderActive(route) {
  const view = VIEWS[route];
  if (!view) {
    console.warn(`No view registered for route: ${route}`);
    return;
  }

  // Skip if already rendered (idempotent)
  const key = `${route}:${view.mount}`;
  if (rendered.has(key)) return;

  try {
    const mountEl = document.querySelector(view.mount);
    if (!mountEl) {
      console.warn(`Mount element not found: ${view.mount}`);
      return;
    }

    // Load and execute the render function
    const renderFn = await view.loader();
    if (typeof renderFn === 'function') {
      await renderFn(mountEl);
      rendered.add(key);
    }
  } catch (e) {
    console.error(`Failed to render view ${route}:`, e);
  }
}

// Clear render cache on significant navigation
export function clearCache() {
  rendered.clear();
}

export default { renderActive, clearCache };