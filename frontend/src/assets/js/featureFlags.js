// featureFlags.js (production-safe)
import { getJSON } from './http.js';
import logger from './logger.js';

const Flags = {
  _cache: {},
  async refresh() {
    try {
      const url = (window.__ENV && window.__ENV.FLAGS_URL) || '/api/flags';
      const data = await getJSON(url);
      this._cache = data || {};
      return this._cache;
    } catch (err) {
      // Only log at debug; don't pollute console in prod when endpoint not present.
      try { logger.debug && logger.debug('flags skipped (no endpoint)'); } catch {}
      this._cache = {};
      return this._cache;
    }
  },
  get(key, fallback = undefined) {
    return (key in this._cache) ? this._cache[key] : fallback;
  }
};

export default Flags;