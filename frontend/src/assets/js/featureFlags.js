// Production Feature Flags (env-guarded)
import { getJSON } from '/assets/js/http.js';

const cache = Object.create(null);

async function refresh() {
  const env = window.__ENV || {};
  if (!env.FLAGS_API) {
    // fallback to local defaults
    return cache;
  }
  const url = env.FLAGS_URL || '/api/flags';
  const data = await getJSON(url).catch(() => ({}));
  Object.assign(cache, data || {});
  return cache;
}

function get(name, defaultVal = false) {
  const v = cache[name];
  return typeof v === 'undefined' ? defaultVal : v;
}

function all() { return { ...cache }; }

export default { refresh, get, all };