/**
 * Router → Metrics bridge (production)
 * Listens to route:change and forwards to window.Metrics.trackRoute
 */
import Events from '../../js/events.js';

(function initRouteMetrics() {
  const safe = (fn, ...args) => { try { return fn && fn(...args); } catch (_) {} };

  // Initial route at boot
  const initial = (location.hash || '#parties').replace('#','');
  safe(window.Metrics?.trackRoute, initial);

  // Subsequent changes
  Events.on('route:change', ({ route }) => {
    safe(window.Metrics?.trackRoute, route);
  });

  console.log('✅ Router→Metrics bridge loaded');
})();