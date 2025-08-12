// Router metrics tracking module
export function trackRouteChange(route) {
  if (window.Metrics?.trackRoute) {
    window.Metrics.trackRoute(route);
  }
}

// Auto-track on hash change
window.addEventListener('hashchange', () => {
  const route = location.hash || '#/parties';
  trackRouteChange(route);
});

// Track initial route
document.addEventListener('DOMContentLoaded', () => {
  const route = location.hash || '#/parties';
  trackRouteChange(route);
});

export default { trackRouteChange };