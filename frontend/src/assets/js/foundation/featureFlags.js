// Flags with TTL cache; exposes flag(key, default)
import Store from './store.js';
import { getJSON } from './http.js';
import Logger from './logger.js';

const TTL_MS = 5*60*1000;
async function refresh(){
  const last = Store.get('flags._fetchedAt') || 0;
  if (Date.now() - last < TTL_MS) return Store.get('flags.map')||{};
  try {
    const data = await getJSON('/api/flags');
    Store.patch('flags', { map:data||{}, _fetchedAt: Date.now() });
    return data||{};
  } catch (e){ 
    // Don't warn on 404 - feature flags endpoint not required in production
    if (e.message && e.message.includes('404')) {
      return Store.get('flags.map') || {};
    }
    Logger.warn('flags fetch fail', e); 
    return Store.get('flags.map')||{}; 
  }
}
function flag(key, fallback=false){ const map = Store.get('flags.map')||{}; return (key in map) ? !!map[key] : fallback; }

const Flags = { refresh, flag, __verified:true };
if (!window.Flags) window.Flags = Flags;
export default Flags;