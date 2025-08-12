// events-controller.js (drop-in)
import Store from './store.js';
import { toast } from './ui-feedback.js';
import Events from './events.js';

export async function renderParties(rootEl) {
  // section shell
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

  // Load data (already works via /api/parties)
  try {
    const res = await getJSON('https://us-central1-conference-party-app.cloudfunctions.net/api/parties?conference=gamescom2025');
    const items = (res && res.data) || [];
    if (!items.length) {
      list.innerHTML = `<div class="text-secondary">No parties found.</div>`;
      return;
    }
    renderCards(list, items.slice(0, 20)); // cap for perf
  } catch (e) {
    // Try offline fallback
    try {
      const offline = await fetch('/offline-data/events.json').then(r => r.json());
      const items = offline?.events || offline?.data || [];
      if (items.length) {
        renderCards(list, items.slice(0, 20));
        return;
      }
    } catch {}
    list.innerHTML = `<div class="text-secondary">Failed to load events.</div>`;
  }
}

function renderCards(list, items) {
  list.innerHTML = '';
  for (const ev of items) {
    // Handle different data formats
    const title = ev['Event Name'] || ev.title || ev.name || 'Untitled';
    const venue = ev.Venue || ev.venue || ev.location || '';
    const time = ev.Time || ev.time || `${ev.start || ''} – ${ev.end || ''}`.trim() || '';
    const price = ev.Price || ev.price;
    const priceTag = price ? `From ${price}` : 'Free';
    const capacity = ev.Capacity || ev.capacity;
    const id = ev.id || ev['Event ID'] || '';
    const url = ev.url || ev.URL || '#';

    list.insertAdjacentHTML('beforeend', `
      <div class="event-card" data-id="${id}">
        <div class="event-row">
          <div style="flex:1;">
            <div class="event-title">${escapeHtml(title)}</div>
            <div class="event-meta">
              ${time ? `<span>🕒 ${escapeHtml(time)}</span>` : ''}
              ${time && venue ? '<span class="dot"></span>' : ''}
              ${venue ? `<span>📍 ${escapeHtml(venue)}</span>` : ''}
              ${capacity ? `<span class="dot"></span><span>👥 ${capacity}</span>` : ''}
            </div>
            <div class="event-price">${escapeHtml(priceTag)}</div>
          </div>
          <div class="event-actions">
            <button class="btn-sm primary" data-action="rsvp" data-id="${id}">RSVP</button>
            <button class="btn-sm" data-action="save" data-id="${id}">Save</button>
            <button class="btn-sm" data-action="open" data-url="${url}">↗</button>
          </div>
        </div>
      </div>
    `);
  }

  // interactions
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    
    if (action === 'open') {
      const url = btn.dataset.url;
      if (url && url !== '#') window.open(url, '_blank', 'noopener');
    } else if (action === 'rsvp') {
      toast('RSVP saved!', 'success');
      Events.emit('event:rsvp', { id });
    } else if (action === 'save') {
      toast('Event saved to calendar', 'success');
      Events.emit('event:save', { id });
    }
  });

  // Footer actions
  rootEl.querySelector('[data-action="clear"]')?.addEventListener('click', () => {
    Store.set('selectedEvents', []);
    toast('Selection cleared', 'info');
  });

  rootEl.querySelector('[data-action="saveSync"]')?.addEventListener('click', () => {
    toast('Syncing to calendar...', 'info');
    Events.emit('calendar:sync');
  });
}

function escapeHtml(s='') {
  return String(s).replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}

// Simple getJSON helper
async function getJSON(url) {
  try {
    const response = await fetch(url, { credentials: 'omit' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch:', url, error);
    throw error;
  }
}