// events-controller.js  v3
import { getJSON } from './http.js';

export async function renderParties(rootEl) {
  rootEl.innerHTML = `
    <div class="section-card">
      <div class="left-accent" aria-hidden="true"></div>
      <h2 class="text-heading">Parties</h2>
      <p class="text-secondary" style="margin-top:-6px">Pick 3 parties you like • save & sync to calendar</p>
      <div id="events-list" class="cards-grid"></div>
      <div class="stack mt-16" style="justify-content:flex-end;gap:8px;">
        <button class="btn-sm" data-action="clear">Clear</button>
        <button class="btn-sm primary" data-action="saveSync">Save & Sync</button>
      </div>
    </div>
  `;

  const list = rootEl.querySelector('#events-list');

  try {
    // HOSTING, not CF:
    const res = await getJSON('/api/parties?conference=gamescom2025');
    const items = (res && res.data) || [];
    if (!items.length) {
      list.innerHTML = `<div class="text-secondary">Failed to load events.</div>`;
      return;
    }
    list.innerHTML = items.map(toCard).join('');
    list.addEventListener('click', onCardClick);
  } catch (e) {
    console.error('Failed to fetch:', e);
    list.innerHTML = `<div class="text-secondary">Failed to load events.</div>`;
  }
}

function toCard(ev) {
  const title = esc(ev.title || ev.name || 'Untitled');
  const venue = esc(ev.venue || ev.location || '');
  const time  = esc(ev.time || `${ev.start || ''} – ${ev.end || ''}`.trim());
  const price = esc(ev.price ? `From ${ev.price}` : 'Free');

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
      <button class="btn ghost" data-action="rsvp" data-id="${esc(ev.id)}">RSVP</button>
      <button class="btn" data-action="save" data-id="${esc(ev.id)}">Save</button>
      <button class="btn ghost" data-action="open" data-url="${esc(ev.url || '#')}" aria-label="Open">↗</button>
    </div>
  </article>`;
}

function onCardClick(e) {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const a = btn.dataset.action;
  if (a === 'open') {
    const url = btn.dataset.url;
    if (url && url !== '#') window.open(url, '_blank','noopener');
  }
}
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}