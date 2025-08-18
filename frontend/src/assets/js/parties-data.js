// parties-data.js — single source of truth for live parties
const ENDPOINT = '/api/parties?conference=gamescom2025';

let _cache = null; // { list:[], byDate: Map<string,Array>, dates: string[] }

function normalize(p) {
  const start = p.start || p.startsAt || p.time || '';
  const date = (p.date || start || '').slice(0,10);
  const lat = Number(p.lat ?? p.latitude ?? p.location?.lat ?? p.coords?.lat);
  const lng = Number(p.lng ?? p.longitude ?? p.location?.lng ?? p.coords?.lng);
  return {
    id: p.id || `${date}-${(p.title||'').slice(0,24)}`,
    title: p.title || p.name || 'Party',
    venue: p.venue || p.locationName || '',
    start, end: p.end || '',
    date,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    description: p.description || '',
    price: p.price || '',
    url: p.url || p.link || ''
  };
}

export async function fetchAll() {
  // Try API first
  if (window.apiIntegration) {
    try {
      const apiData = await window.apiIntegration.getParties();
      if (apiData && apiData.length > 0) {
        const list = apiData.map(normalize);
        const byDate = new Map();
        for (const e of list) {
          if (!e.date) continue;
          if (!byDate.has(e.date)) byDate.set(e.date, []);
          byDate.get(e.date).push(e);
        }
        const dates = [...byDate.keys()].sort();
        _cache = { list, byDate, dates };
        return _cache;
      }
    } catch (err) {
      console.log('[parties-data] API failed, trying direct fetch:', err);
    }
  }
  
  // Fallback to direct fetch
  try {
    const res = await fetch(ENDPOINT, { headers: { 'accept':'application/json' }});
    const data = await res.json();
    console.log('[parties-data] API response:', data);
    
    const list = (Array.isArray(data?.data) ? data.data
      : Array.isArray(data?.events) ? data.events
      : Array.isArray(data?.parties) ? data.parties
      : Array.isArray(data) ? data : []).map(normalize);

    const byDate = new Map();
    for (const e of list) {
      if (!e.date) continue;
      if (!byDate.has(e.date)) byDate.set(e.date, []);
      byDate.get(e.date).push(e);
    }
    // stable, sorted dates
    const dates = [...byDate.keys()].sort();
    _cache = { list, byDate, dates };
    return _cache;
  } catch (err) {
    console.error('[parties-data] Failed to fetch:', err);
    // Return empty cache
    _cache = { list: [], byDate: new Map(), dates: [] };
    return _cache;
  }
}

export async function getPartiesByDate(dateStr) {
  if (!_cache) await fetchAll();
  return _cache.byDate.get(dateStr) || [];
}
export async function getAllDates() {
  if (!_cache) await fetchAll();
  return _cache.dates;
}
export function __debugCache() { return _cache; }