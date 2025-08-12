// Production Metrics (env-aware, no-throw)
const q = [];
let flushed = false;

function now() { return new Date().toISOString(); }

function track(event, payload = {}) {
  q.push({ event, payload, ts: now() });
  if (!flushed) tryFlush();
}

function tryFlush() {
  const env = window.__ENV || {};
  if (!env.METRICS_API) {
    if (!flushed) { flushed = true; console.debug('📊 Metrics in-memory only (METRICS_API=false).'); }
    return;
  }
  if (q.length === 0) return;

  const url = env.METRICS_URL || '/api/metrics';
  const batch = q.splice(0, q.length);
  fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ app: 'velocity', batch })
  }).catch(() => {
    // put back on failure (best-effort)
    q.unshift(...batch);
  });
}

// Background flush every 15s when enabled
setInterval(tryFlush, 15000);

// ES module Metrics; attaches to window and exports (for imports)
const Metrics = {
  track,
  trackRoute: (route) => track('route', { route }),
  trackInstallPromptShown: () => track('install_prompt_shown'),
  trackInstallAccepted: () => track('install_accept'),
  trackInstallDismissed: () => track('install_dismiss'),
  flush: tryFlush
};

// Expose globally for existing calls
if (typeof window !== 'undefined') {
  window.Metrics = Metrics;
}

export default Metrics;
export { track };