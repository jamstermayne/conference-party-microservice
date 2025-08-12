// events-controller.js  v4 — per-card Save & Sync + uniform cards
import { getJSON } from './http.js';

// light ICS fallback if Calendar module not present
function buildICS(ev) {
  const dt = (s) => (s || '').replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const uid = ev.id || `${Date.now()}@velocity.ai`;
  return [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//velocity.ai//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    ev.start ? `DTSTART:${dt(ev.start)}` : '',
    ev.end   ? `DTEND:${dt(ev.end)}`     : '',
    `SUMMARY:${ev.title || ev.name || 'Event'}`,
    ev.venue ? `LOCATION:${ev.venue}` : '',
    'END:VEVENT','END:VCALENDAR'
  ].filter(Boolean).join('\r\n');
}
function downloadICS(ev) {
  const blob = new Blob([buildICS(ev)], { type:'text/calendar' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${(ev.title || ev.name || 'event').replace(/\s+/g,'_')}.ics`;
  document.body.appendChild(a); a.click(); a.remove();
}

export async function renderParties(rootEl) {
  rootEl.innerHTML = `
    <div class="section-card">
      <div class="left-accent" aria-hidden="true"></div>
      <h2 class="text-heading">Parties</h2>
      <p class="text-secondary" style="margin-top:-6px">Pick 3 parties you like • save & sync to calendar</p>
      <div id="events-list" class="cards-grid"></div>
    </div>
  `;
  const list = rootEl.querySelector('#events-list');

  try {
    // Use hosting endpoint (not CF)
    const res = await getJSON('/api/parties?conference=gamescom2025');
    const items = (res && res.data) || [];
    if (!items.length) {
      list.innerHTML = `<div class="text-secondary">Failed to load events.</div>`;
      return;
    }
    list.innerHTML = items.map(toCard).join('');
    list.addEventListener('click', (e)=>{
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const ev = JSON.parse(decodeURIComponent(btn.dataset.ev));

      if (action === 'open') {
        if (ev.url) window.open(ev.url, '_blank', 'noopener');
      } else if (action === 'save') {
        // simple local "saved" affordance
        btn.classList.add('primary'); btn.textContent = 'Saved';
        // TODO: persist selection (Store) and cap at 3
      } else if (action === 'saveSync') {
        // First try Calendar module if present; else ICS fallback
        if (window.Calendar && typeof window.Calendar.addEvent === 'function') {
          window.Calendar.addEvent(ev);
        } else {
          downloadICS(ev);
        }
      } else if (action === 'rsvp') {
        if (ev.url) window.open(ev.url, '_blank', 'noopener'); // placeholder
      }
    });
  } catch (e) {
    console.error('Failed to fetch:', e);
    list.innerHTML = `<div class="text-secondary">Failed to load events.</div>`;
  }
}

function cleanPrice(price) {
  if (!price) return 'Free';
  const s = String(price);
  return /from/i.test(s) ? s : `From ${s}`;
}

function toCard(ev) {
  const title = esc(ev.title || ev.name || 'Untitled');
  const venue = esc(ev.venue || ev.location || '');
  const time  = esc(ev.time || `${ev.start || ''} – ${ev.end || ''}`.trim());
  const price = esc(cleanPrice(ev.price));
  const payload = encodeURIComponent(JSON.stringify(ev));

  return `
  <article class="event-card">
    <div class="card-head">
      <h3 class="event-title">${title}</h3>
      <span class="badge subtle">${price}</span>
    </div>
    <div class="event-meta">
      <span>🕒 ${time}</span><span class="dot"></span><span>📍 ${venue}</span>
    </div>
    <p class="event-desc">Tap to RSVP, save, or open the event.</p>
    <div class="card-actions">
      <button class="btn ghost" data-action="rsvp" data-ev="${payload}">RSVP</button>
      <button class="btn"        data-action="save" data-ev="${payload}">Save</button>
      <button class="btn primary" data-action="saveSync" data-ev="${payload}">Save & Sync</button>
      <button class="btn ghost"  data-action="open" data-ev="${payload}" aria-label="Open">↗</button>
    </div>
  </article>`;
}

function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}