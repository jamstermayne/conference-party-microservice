// events-controller.js v5 - Complete with selection store and calendar sync
import { applyStateToButtons, toggleSave, countSaved } from './selection-store.js';
import { downloadICS } from './calendar-sync.js';
import Events from './events.js';
import { getJSON } from './http.js';
import { toast } from './ui-feedback.js';

function eventToModel(raw) {
  // Normalize your event object from API
  return {
    id: raw.id || raw['Event ID'] || `event-${Date.now()}`,
    title: raw.title || raw['Event Name'] || raw.name || 'Untitled',
    venue: raw.venue || raw.Venue || raw.location || raw.Hosts || '',
    startsAt: raw.startsAt || raw.starts || raw.dateTimeStart || raw.start || new Date().toISOString(),
    endsAt: raw.endsAt || raw.ends || raw.dateTimeEnd || raw.end || null,
    price: raw.price || raw.Price || 'Free',
    url: raw.url || raw.URL || '#'
  };
}

function cardHTML(m) {
  const priceText = String(m.price).toLowerCase().includes('free') ? 'Free' : 
                    String(m.price).toLowerCase().includes('from') ? m.price : `From ${m.price}`;
  const pricePill = `<span class="pill">${priceText}</span>`;
  
  let timeStr = '🕘 ';
  try {
    const start = new Date(m.startsAt);
    timeStr += start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    if (m.endsAt) {
      const end = new Date(m.endsAt);
      timeStr += ' – ' + end.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    }
  } catch {
    timeStr += 'TBD';
  }

  return `
    <article class="event-card" data-id="${m.id}" data-starts="${m.startsAt}" data-ends="${m.endsAt || ''}">
      <div class="card-top">
        <h3>${m.title}</h3>
      </div>
      <div class="event-meta">
        <span>${timeStr}</span>
        <span>📍 ${m.venue || 'Venue TBD'}</span>
        <span>${pricePill}</span>
      </div>
      <p style="color:#95a0b3;margin:10px 0 4px;">Tap to RSVP, save, or open the event.</p>
      <div class="event-actions">
        <button class="btn-ghost" data-action="rsvp" data-id="${m.id}">RSVP</button>
        <button class="btn-primary" data-action="save" data-id="${m.id}">Save & Sync</button>
        <button class="btn-ghost" data-action="open" data-id="${m.id}" data-url="${m.url}">↗</button>
      </div>
    </article>`;
}

export async function renderParties(rootEl) {
  rootEl.innerHTML = `
    <div class="section-card">
      <div class="left-accent" aria-hidden="true"></div>
      <h2 class="text-heading">Parties</h2>
      <p class="text-secondary" style="margin-top:-6px">Pick 3 parties you like • save & sync to calendar</p>
      <div data-saved-counter style="margin: 10px 0; color: #b9c1ce; font-size: 14px;">${countSaved()}/3 selected</div>
      <div data-events-list></div>
    </div>
  `;
  
  const LIST = rootEl.querySelector('[data-events-list]');
  LIST.innerHTML = '<div class="card-grid"></div>';
  const grid = LIST.querySelector('.card-grid');

  // Try the parties endpoint first
  let data = [];
  try {
    const res = await getJSON('/api/parties?conference=gamescom2025');
    data = (res && res.data) ? res.data : [];
  } catch (e) {
    console.warn('Failed to load parties, trying fallback...', e);
    // Try offline fallback
    try {
      const offline = await fetch('/offline-data/events.json').then(r => r.json());
      data = offline?.events || offline?.data || [];
    } catch {
      data = [];
    }
  }

  if (!data.length) {
    grid.innerHTML = '<div class="text-secondary">No events available at this time.</div>';
    return;
  }

  grid.innerHTML = data.slice(0, 20).map(d => cardHTML(eventToModel(d))).join('');
  bindCardActions(rootEl);
  applyStateToButtons(grid);
}

function bindCardActions(root) {
  const grid = root.querySelector('.card-grid');
  if (!grid) return;

  // Save & Sync
  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    
    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-id');
    const card = btn.closest('.event-card');
    
    if (action === 'save') {
      const m = {
        id,
        title: card.querySelector('h3')?.textContent || 'Event',
        venue: card.querySelector('.event-meta span:nth-child(2)')?.textContent?.replace('📍 ','').trim() || '',
        startsAt: card.dataset.starts || new Date().toISOString(),
        endsAt: card.dataset.ends || null
      };

      const result = toggleSave(m);
      applyStateToButtons(root);
      
      // Update counter
      const counter = root.querySelector('[data-saved-counter]');
      if (counter) counter.textContent = `${countSaved()}/3 selected`;
      
      if (result.ok && result.action === 'added') {
        downloadICS(m); // Save + immediate ICS
        toast('Event saved and calendar file downloaded', 'success');
      } else if (result.action === 'removed') {
        toast('Event removed from selection', 'info');
      }
      return;
    }
    
    if (action === 'open') {
      const url = btn.getAttribute('data-url');
      if (url && url !== '#') {
        window.open(url, '_blank', 'noopener');
      } else {
        toast('Event details coming soon', 'info');
      }
      return;
    }
    
    if (action === 'rsvp') {
      toast('RSVP feature coming soon', 'info');
    }
  });

  // Keep header counter in sync
  Events.on('saved:changed', ({ total }) => {
    const counter = root.querySelector('[data-saved-counter]');
    if (counter) counter.textContent = `${total}/3 selected`;
  });
}