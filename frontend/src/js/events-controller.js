// events-controller.js
import { getJSON } from './http.js';

export async function renderParties(rootEl) {
  rootEl.innerHTML = `
    <div class="section-card" style="position:relative;">
      <div class="left-accent" aria-hidden="true"></div>
      <h2 class="text-heading" style="margin:0 0 12px 0;">Parties</h2>
      <div class="text-secondary" style="margin-bottom:14px;">Pick 3 parties you like • save & sync to calendar</div>
      <div id="events-list" class="events-list"></div>
      <div class="event-footer" style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
        <button class="btn-sm" data-action="clear">Clear</button>
        <button class="btn-sm primary" data-action="saveSync">Save & Sync</button>
      </div>
    </div>
  `;

  const list = rootEl.querySelector('#events-list');

  try {
    const res = await getJSON('/api/parties?conference=gamescom2025');
    const items = (res && res.data) || [];
    if (!items.length) {
      list.innerHTML = `<div class="text-secondary">No parties found.</div>`;
      return;
    }
    renderCards(list, items.slice(0, 20));
  } catch (e) {
    console.error(e);
    list.innerHTML = `<div class="text-secondary">Failed to load events.</div>`;
  }
}

function renderCards(list, items) {
  list.innerHTML = '';
  for (const ev of items) {
    const priceTag = ev.price ? `From ${ev.price}` : 'Free';
    const time = ev.time || `${ev.start || ''} – ${ev.end || ''}`.trim();
    const venue = ev.venue || ev.location || '';

    list.insertAdjacentHTML('beforeend', `
      <div class="event-card">
        <div class="event-row">
          <div style="flex:1;">
            <div class="event-title">${escapeHtml(ev.title || ev.name || 'Untitled')}</div>
            <div class="event-meta">
              <span>🕒 ${escapeHtml(time)}</span>
              <span class="dot"></span>
              <span>📍 ${escapeHtml(venue)}</span>
            </div>
            <div class="event-price">${escapeHtml(priceTag)}</div>
          </div>
          <div class="event-actions">
            <button class="btn-sm primary" data-action="rsvp" data-id="${ev.id}">RSVP</button>
            <button class="btn-sm" data-action="save" data-id="${ev.id}">Save</button>
            <button class="btn-sm" data-action="open" data-url="${ev.url || '#'}">↗</button>
          </div>
        </div>
      </div>
    `);
  }

  list.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'open') {
      const url = btn.dataset.url;
      if (url && url !== '#') window.open(url, '_blank', 'noopener');
    }
  });
}

function escapeHtml(s='') {
  return String(s).replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}