/**
 * Lightweight route → metrics bridge.
 * Call once after router initializes; listens for your route events.
 */
(function wireRouteMetrics(){
  document.addEventListener('navigate', (e) => {
    const route = (e?.detail && (e.detail.route || e.detail)) || location.hash || '/';
    try { window.Metrics?.trackRoute?.(String(route)); } catch {}
  }, { passive: true });

  // First paint route
  try { window.Metrics?.trackRoute?.(location.hash || '/'); } catch {}
})();