/**
 * Home panel: two sections (Parties / Map), each with Mon–Sat pills.
 * Routes: #/parties/YYYY-MM-DD and #/map/YYYY-MM-DD
 */
export async function getMonSatDates() {
  let data = [];
  try {
    const r = await fetch('/api/parties?conference=gamescom2025', { headers: { accept: 'application/json' }});
    const raw = await r.json();
    const list = Array.isArray(raw?.data) ? raw.data
               : Array.isArray(raw?.parties) ? raw.parties
               : Array.isArray(raw) ? raw : [];
    data = list;
  } catch { /* fallback below */ }

  const toISO = s => (s || '').slice(0,10);
  const day = iso => new Date(iso + 'T00:00:00').getDay(); // 0..6
  let uniq = Array.from(new Set(
    data.map(p => toISO(p.start || p.startsAt || p.date || ''))
  )).filter(Boolean).sort();

  // Keep Mon..Sat; fallback to next Mon..Sat if empty
  let monSat = uniq.filter(iso => (day(iso) >= 1 && day(iso) <= 6));
  if (!monSat.length) {
    const now = new Date();
    const nextMon = new Date(now);
    nextMon.setDate(now.getDate() + ((1 - now.getDay() + 7) % 7 || 7)); // next Monday
    monSat = Array.from({length:6}, (_,i) => {
      const d = new Date(nextMon); d.setDate(nextMon.getDate()+i);
      return d.toISOString().slice(0,10);
    });
  }
  return monSat.slice(0,6);
}

function pillLabel(iso) {
  const d = new Date(iso + 'T00:00:00');
  const w = d.toLocaleDateString(undefined, { weekday:'short' });
  const dd = d.toLocaleDateString(undefined, { day:'2-digit' });
  return `${w} ${dd}`;
}

export function renderHomePanel(root, dates) {
  root.innerHTML = `
    <section class="home-panel">
      <div class="home-section">
        <h2 class="home-h2">Parties</h2>
        <div class="pill-row" data-kind="parties">
          ${dates.map(iso => `
            <button class="day-pill" data-route="#/parties/${iso}" aria-pressed="false">${pillLabel(iso)}</button>
          `).join('')}
        </div>
      </div>
      <div class="home-section">
        <h2 class="home-h2">Map</h2>
        <div class="pill-row" data-kind="map">
          ${dates.map((iso,i) => `
            <button class="day-pill" data-route="#/map/${iso}" aria-pressed="${i===0?'true':'false'}">${pillLabel(iso)}</button>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

export function wireHomePanel(root) {
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('.day-pill');
    if (!btn) return;
    const to = btn.dataset.route;
    if (to) location.hash = to;
  });
}