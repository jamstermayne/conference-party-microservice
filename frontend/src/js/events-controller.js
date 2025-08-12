import { toast, emptyState } from '/js/ui-feedback.js';
import { openVenue } from '/js/nav-maps.js';
import { Events } from '/js/events.js';

async function fetchEvents() {
  const url = 'https://us-central1-conference-party-app.cloudfunctions.net/api/events?conference=gamescom2025';
  const res = await fetch(url, { credentials: 'omit' });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text().catch(()=> '')}`);
  const json = await res.json();
  return Array.isArray(json?.data) ? json.data : [];
}

async function loadParties() {
  const root = document.querySelector('[data-view="parties"]');
  if (!root) {
    // Fallback to legacy selector
    const mount = document.querySelector('[data-route="parties"]');
    if (!mount) return;
    mount.innerHTML = '<div class="loading">Loading events...</div>';
  } else {
    root.innerHTML = '<div class="loading">Loading events...</div>';
  }

  try {
    let events = await fetchEvents();

    if (!events.length) {
      // offline fallback
      try {
        const offline = await fetch('/offline-data/events.json').then(r => r.json());
        events = offline?.data || offline || [];
      } catch {}
    }

    const targetRoot = root || document.querySelector('[data-route="parties"]');
    
    if (!events.length) {
      targetRoot.replaceChildren(emptyState('No events yet. Check back shortly.'));
      return;
    }

    // Render premium cards
    targetRoot.innerHTML = events.map(ev => `
      <article class="card-pro" data-id="${ev.id || ev['Event ID'] || ''}">
        <div class="card-row">
          <div class="card-left">
            <h3>${ev['Event Name'] || ev.title || 'Untitled Event'}</h3>
            <div class="meta">
              ${ev.Time ? `<span><span class="dot"></span>${ev.Time}</span>` : ''}
              ${ev.Venue ? `<span>• ${ev.Venue}</span>` : ''}
              ${ev.Capacity ? `<span>• ${ev.Capacity} capacity</span>` : ''}
            </div>
            ${ev.Price ? `<span class="price-pill">From ${ev.Price}</span>` : ``}
          </div>
          <div class="card-right actions">
            <button class="btn-soft" data-action="rsvp" data-id="${ev.id || ''}">RSVP</button>
            <button class="btn-soft" data-action="save" data-id="${ev.id || ''}">Save</button>
            <button class="btn-soft" data-action="open" data-id="${ev.id || ''}" title="Open"><span>↗</span></button>
          </div>
        </div>
      </article>
    `).join('');

    // lightweight action hooks
    targetRoot.addEventListener('click', (e)=>{
      const b = e.target.closest('[data-action]');
      if(!b) return;
      const id = b.getAttribute('data-id');
      const action = b.getAttribute('data-action');
      
      if (action === 'rsvp') {
        toast('RSVP saved!', 'success');
      } else if (action === 'save') {
        toast('Event saved to calendar', 'success');
      } else if (action === 'open') {
        const card = b.closest('.card-pro');
        const venue = card?.querySelector('.meta span:nth-child(2)')?.textContent?.replace('• ', '');
        if (venue) openVenue(venue);
      }
      
      Events.emit(`event:${action}`, { id });
    }, { passive:false });
    
  } catch (err) {
    console.error('Failed to load parties:', err);
    toast('Unable to load events. Working from offline data if available.', 'warn');
    try {
      const offline = await fetch('/offline-data/events.json').then(r => r.json());
      const events = offline?.data || offline || [];
      const targetRoot = root || document.querySelector('[data-route="parties"]');
      if (events.length && targetRoot) {
        targetRoot.innerHTML = events.map(e => `
          <article class="card-pro">
            <h3>${e["Event Name"] || e.title || 'Event'}</h3>
          </article>
        `).join('');
        return;
      }
    } catch {}
    const targetRoot = root || document.querySelector('[data-route="parties"]');
    if (targetRoot) targetRoot.replaceChildren(emptyState('Failed to load events.'));
  }
}

// Load on DOM ready and route change
document.addEventListener('DOMContentLoaded', loadParties);
Events.on('navigate', (route) => {
  if (route === 'parties') loadParties();
});