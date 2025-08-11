// metrics.js (production-safe, backend-optional)
import logger from './logger.js';

const cfg = (window.__ENV || {});
const METRICS_ENABLED = cfg.METRICS_ENABLED === true;
const METRICS_URL = cfg.METRICS_URL || '/api/metrics'; // only used if enabled

const queue = [];
let flushTimer = null;

function startFlush() {
  if (flushTimer) return;
  flushTimer = setInterval(async () => {
    if (!METRICS_ENABLED || queue.length === 0) return;
    const batch = queue.splice(0, queue.length);
    try {
      const res = await fetch(METRICS_URL, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ batch, ts: Date.now() })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      logger.info && logger.info(`📤 Flushed ${batch.length} metrics`);
    } catch (e) {
      // Put back if failed; but don't spam errors when backend isn't ready
      queue.unshift(...batch);
      logger.debug && logger.debug('metrics skipped (no endpoint yet)');
    }
  }, 15000);
}

const Metrics = {
  track(event, payload = {}) {
    const rec = { event, payload, at: Date.now(), route: location.hash || '#' };
    if (!METRICS_ENABLED) {
      // No backend: keep it quiet; tiny hint for dev only
      logger.debug && logger.debug('📊 Metric tracked:', rec);
      return;
    }
    queue.push(rec);
  },
  trackRoute(route) {
    this.track('route_change', { route });
  },
  trackInstallPromptShown(meta = {}) {
    this.track('install_prompt_shown', meta);
  }
};

startFlush();
window.Metrics = Metrics;
export default Metrics;