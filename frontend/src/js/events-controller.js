import { toast, emptyState } from '/js/ui-feedback.js';
import FTUEProgress from '/js/ftue-progress.js';
// events-controller.js — patch: add imports near top
import { paintSkeleton, paintEmpty } from '/js/events-empty-state.js';
import { swap } from '/js/viewtx-lite.js';

async function fetchEvents() {
  const url = 'https://us-central1-conference-party-app.cloudfunctions.net/api/events?conference=gamescom2025';
  const res = await fetch(url, { credentials: 'omit' });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text().catch(()=> '')}`);
  const json = await res.json();
  return Array.isArray(json?.data) ? json.data : [];
}

async function loadParties() {
  const mount = document.querySelector('[data-route="parties"] [data-mount]');
  if (!mount) return;
  mount.innerHTML = '<div class="card card-outlined">Loading events…</div>';

  // FTUE: Initialize progress bar
  FTUEProgress.init(mount);

  try {
    let events = await fetchEvents();

    if (!events.length) {
      // offline fallback
      try {
        const offline = await fetch('/offline-data/events.json').then(r => r.json());
        events = offline?.data || offline || [];
      } catch {}
    }

    if (!events.length) {
      mount.replaceChildren(emptyState('No events yet. Check back shortly.'));
      return;
    }

    // TODO: render pretty cards here – for now list titles
    mount.innerHTML = events.map(e => `<div class="card card-outlined card-compact">${e["Event Name"] || e.title}</div>`).join('');
    
    // FTUE: Re-initialize progress bar after content load
    FTUEProgress.init(mount);
  } catch (err) {
    console.error('Failed to load parties:', err);
    toast('Unable to load events. Working from offline data if available.', 'warn');
    try {
      const offline = await fetch('/offline-data/events.json').then(r => r.json());
      const events = offline?.data || offline || [];
      if (events.length) {
        mount.innerHTML = events.map(e => `<div class="card card-outlined card-compact">${e["Event Name"] || e.title}</div>`).join('');
        // FTUE: Re-initialize progress bar for offline content
        FTUEProgress.init(mount);
        return;
      }
    } catch {}
    mount.replaceChildren(emptyState('Failed to load events.'));
  }
}

// ... inside your init/onEnter or DOMContentLoaded:
document.addEventListener('DOMContentLoaded', () => {
  const route = location.hash.replace('#', '').split('?')[0] || 'parties';
  if (route !== 'parties') return;

  const list = document.querySelector('[data-list="events"]') || document.getElementById('events-list') || document.getElementById('main');

  // show skeleton while fetching
  if (list) paintSkeleton(list, 8);

  // hook: when your fetch completes, call onEventsLoaded(data)
  document.addEventListener('events:data', (e) => {
    const items = Array.isArray(e.detail?.events) ? e.detail.events : [];
    if (!items.length) {
      paintEmpty(list, 'No parties found. Try "Today" or pick another day.');
      return;
    }
    // Your existing render(list, items) should already exist.
    // If not, assume there is a function renderEvents(list, items)
    try {
      if (typeof renderEvents === 'function') renderEvents(list, items);
    } catch {}
  }, { once: true });

  // graceful card → detail transition (delegate by data-party-id)
  document.addEventListener('click', (ev) => {
    const card = ev.target.closest('[data-party-id]');
    if (!card || !card.hasAttribute('data-open-detail')) return;
    const partyId = card.getAttribute('data-party-id');
    if (!partyId) return;

    ev.preventDefault();
    swap(() => {
      // naive detail render; if you have a controller method, call it here
      const root = document.getElementById('main') || document.body;
      const shell = document.createElement('section');
      shell.className = 'card card-filled';
      shell.style.padding = '16px';
      shell.innerHTML = `
        <button class="btn btn-ghost" data-action="back">&larr; Back</button>
        <h2 class="text-heading" style="margin-top:8px">Party Details</h2>
        <div class="text-secondary" style="margin-top:6px">Loading details...</div>
      `;
      root.replaceChildren(shell);
      document.dispatchEvent(new CustomEvent('party:open', { detail: { id: partyId } }));
    });
  });

  // back button handler for the naive detail view
  document.addEventListener('click', (ev) => {
    const back = ev.target.closest('[data-action="back"]');
    if (!back) return;
    ev.preventDefault();
    swap(() => {
      // Trigger your list render again; ideally call your controller's list paint
      location.hash = '#parties';
      // optional: refetch or re-render from cache
      document.dispatchEvent(new CustomEvent('events:list:reload'));
    });
  });
  
  // Also call the existing loadParties function
  loadParties();
});