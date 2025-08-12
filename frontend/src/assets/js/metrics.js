// production-safe metrics (no network unless enabled)
const ENV = window.__ENV || {};
const ENABLED = !!ENV.METRICS_ENABLED;             // defaults false in env.js
const ENDPOINT = ENV.METRICS_ENDPOINT || '';       // set when backend is ready

const queue = [];
let started = false;

function flush() {
  if (!ENABLED || !ENDPOINT || queue.length === 0) return;
  const batch = queue.splice(0, queue.length);
  fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ batch, ts: Date.now() })
  }).then(() => {
    console.log('📤 Flushed', batch.length, 'metrics');
  }).catch(() => {
    // put back if fail
    queue.unshift(...batch);
  });
}

function start() {
  if (started) return;
  started = true;
  setInterval(flush, 15000);
}

function track(name, payload = {}) {
  const evt = { name, payload, t: Date.now() };
  queue.push(evt);
  console.log('📊 Metric tracked:', name, payload);
  if (ENABLED) start();
}

// Expose a tiny API used by other modules
window.Metrics = {
  track,
  trackRoute: (route) => track('route', { route }),
  trackInstallPromptShown: () => track('install_prompt_shown'),
  trackInstallAccepted: () => track('install_accepted'),
  trackInstallDismissed: () => track('install_dismissed')
};

export default window.Metrics;