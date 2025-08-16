import { navigateTo } from '../router-stack.js';

// Derive Mon→Sat from API, else fallback to Gamescom week
async function getWeekDays() {
  try {
    const res = await fetch('/api/parties?conference=gamescom2025', { headers: {accept:'application/json'}});
    const raw = await res.json().catch(()=>null) || {};
    const arr = Array.isArray(raw?.data) ? raw.data
              : Array.isArray(raw?.parties) ? raw.parties
              : Array.isArray(raw) ? raw : [];
    const dates = [...new Set(arr
      .map(e => (e.date || e.start || e.startsAt || '').slice(0,10))
      .filter(Boolean))].sort();
    // Prefer exactly 6 unique days if available
    if (dates.length >= 6) return dates.slice(0,6);
  } catch {}
  // Fallback Mon→Sat (Gamescom week)
  return ['2025-08-18','2025-08-19','2025-08-20','2025-08-21','2025-08-22','2025-08-23'];
}

function labelFor(iso) {
  const dt = new Date(iso + 'T00:00:00');
  const wd = dt.toLocaleDateString(undefined, { weekday:'short' }); // Mon
  const dd = dt.toLocaleDateString(undefined, { day:'2-digit' });   // 18
  return `${wd} ${dd}`;
}

export async function renderHomeSections(host) {
  const days = await getWeekDays();
  const $ = document.createElement('section');
  $.className = 'home-panel';
  $.innerHTML = `
    <header class="home-head"><h1 class="home-title">Parties</h1></header>
    <div class="home-days" role="group" aria-label="Parties by day">
      ${days.map(d => `<button class="channel-btn" data-route="#/parties/${d}">${labelFor(d)}</button>`).join('')}
    </div>

    <header class="home-head"><h1 class="home-title">Map</h1></header>
    <div class="home-days" role="group" aria-label="Map by day">
      ${days.map(d => `<button class="channel-btn" data-route="#/map/${d}">${labelFor(d)}</button>`).join('')}
    </div>
  `;

  host.replaceChildren($);
  $.addEventListener('click', (e) => {
    const btn = e.target.closest('.channel-btn');
    if (!btn) return;
    navigateTo(btn.dataset.route);
  });
}