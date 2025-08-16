// Panels: Parties by Day (Mon–Sat)
// Route: #/parties/YYYY-MM-DD

function toISO(d) {
  return (d || '').slice(0, 10);
}

function labelFor(iso) {
  const dt = new Date(iso + 'T00:00:00');
  const wd = dt.toLocaleDateString(undefined, { weekday:'short' }); // Mon
  const dd = dt.toLocaleDateString(undefined, { day:'2-digit' });   // 18
  return `${wd} ${dd}`;
}

async function fetchParties() {
  const res = await fetch('/api/parties?conference=gamescom2025', {
    headers: { 'accept': 'application/json' },
    credentials: 'same-origin'
  });
  let raw = null;
  try { raw = await res.json(); } catch {}
  const arr = Array.isArray(raw?.data) ? raw.data
           : Array.isArray(raw?.parties) ? raw.parties
           : Array.isArray(raw) ? raw : [];
  return arr;
}

function normalize(p) {
  const title = p.title || p.name || 'Party';
  const start = p.start || p.startsAt || p.date || '';
  const end   = p.end   || p.endsAt   || '';
  const date  = toISO(start || p.date || '');
  const venue = p.venue || p.locationName || p.place || p.location?.name || '';
  const lat   = Number(p.lat ?? p.latitude ?? p.location?.lat ?? p.coords?.lat);
  const lng   = Number(p.lng ?? p.longitude ?? p.location?.lng ?? p.coords?.lng);
  return { title, start, end, date, venue, lat, lng };
}

function cardHTML(evt) {
  const t = (s) => s ? new Date(s).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '';
  const dateLine = evt.start ? new Date(evt.start).toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric' }) : evt.date;
  return `
    <article class="vcard party-card" data-id="${evt.id || ''}">
      <header class="vcard-head">
        <h3 class="vcard-title">${evt.title}</h3>
        <div class="vcard-meta">${dateLine}${evt.venue ? ` • ${evt.venue}` : ''}</div>
      </header>
      <div class="vcard-body">
        ${evt.start ? `<div class="time"><time>${t(evt.start)}${evt.end ? `–${t(evt.end)}` : ''}</time></div>` : ''}
      </div>
      <footer class="vcard-actions">
        <button class="btn-add-to-calendar"
          data-title="${evt.title}"
          data-start="${evt.start || ''}"
          data-end="${evt.end || ''}"
          data-venue="${evt.venue || ''}"
          aria-label="Add ${evt.title} to calendar">Add to Calendar</button>
      </footer>
    </article>
  `;
}

export async function mountPartiesDay(iso) {
  const host = document.getElementById('app') || document.body;
  const wrap = document.createElement('section');
  wrap.className = 'panel panel-parties-day';
  wrap.innerHTML = `
    <header class="panel-head">
      <button class="back-btn" aria-label="Back" data-route="#/home">←</button>
      <h2 class="panel-title">Parties — ${labelFor(iso)}</h2>
    </header>
    <div class="card-grid" id="parties-list" role="list"></div>
  `;
  host.replaceChildren(wrap);

  const all = (await fetchParties()).map(normalize);
  const list = all.filter(p => p.date === iso);
  const grid = wrap.querySelector('#parties-list');
  grid.innerHTML = list.length ? list.map(cardHTML).join('') : `<div class="empty-state">No parties for ${labelFor(iso)}.</div>`;

  // simple delegation: back + calendar
  wrap.addEventListener('click', (e) => {
    const back = e.target.closest('.back-btn');
    if (back) {
      e.preventDefault();
      history.back();
      return;
    }
  });
}