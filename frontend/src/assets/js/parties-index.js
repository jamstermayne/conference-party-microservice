// parties-index.js — client-only, CSP-safe
const ENDPOINT = '/api/parties?conference=gamescom2025';

const toISO = (v) => {
  const d = new Date(v || 0);
  if (isNaN(d)) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    .toISOString().slice(0,10);
};

let _cache;
export async function loadParties() {
  if (_cache) return _cache;
  const r = await fetch(ENDPOINT, { headers: { accept: 'application/json' } });
  const raw = await r.json();
  const rows = Array.isArray(raw) ? raw : (raw?.data ?? raw?.parties ?? []);
  const byDate = rows.reduce((m, e) => {
    const iso = toISO(e.date || e.start || e.startsAt || e.datetime);
    if (!iso) return m;
    (m[iso] ||= []).push(e);
    return m;
  }, {});
  const dates = Object.keys(byDate).sort();
  _cache = { rows, byDate, dates };
  return _cache;
}

export function weekMonFriFromEarliest(dates) {
  if (!dates.length) return [];
  const first = new Date(dates[0] + 'T00:00:00Z');
  const toMon = (7 + 1 - first.getUTCDay()) % 7; // 1=Mon
  const monday = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), first.getUTCDate() + toMon));
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    return d.toISOString().slice(0,10);
  });
}