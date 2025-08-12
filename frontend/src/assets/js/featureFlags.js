// production-safe feature flags
import { getJSON } from './http.js';

const ENV = window.__ENV || {};
const ENABLED = !!ENV.FLAGS_API_ENABLED;            // defaults false in env.js
const API_BASE = ENV.API_BASE || '/api';

const Flags = {
  cache: Object.create(null),

  async refresh() {
    if (!ENABLED) {
      // no network in prod until backend landing
      console.info('[flags] disabled (FLAGS_API_ENABLED=false)');
      return this.cache;
    }
    try {
      const res = await getJSON(`${API_BASE}/flags`);
      this.cache = res?.data || Object.create(null);
      return this.cache;
    } catch (err) {
      console.warn('[flags] fetch fail', err);
      return this.cache;
    }
  },

  get(key, fallback = false) {
    return Object.prototype.hasOwnProperty.call(this.cache, key)
      ? this.cache[key]
      : fallback;
  }
};

export default Flags;