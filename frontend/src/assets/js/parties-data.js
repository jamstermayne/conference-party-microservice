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
  const res = await fetch(ENDPOINT, { headers: { 'accept':'application/json' }});
  const data = await res.json().catch(()=>[]);
  const list = (Array.isArray(data?.data) ? data.data
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