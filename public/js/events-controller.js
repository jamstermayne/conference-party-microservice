import { toast, emptyState } from '/js/ui-feedback.js';

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
  } catch (err) {
    console.error('Failed to load parties:', err);
    toast('Unable to load events. Working from offline data if available.', 'warn');
    try {
      const offline = await fetch('/offline-data/events.json').then(r => r.json());
      const events = offline?.data || offline || [];
      if (events.length) {
        mount.innerHTML = events.map(e => `<div class="card card-outlined card-compact">${e["Event Name"] || e.title}</div>`).join('');
        return;
      }
    } catch {}
    mount.replaceChildren(emptyState('Failed to load events.'));
  }
}

document.addEventListener('DOMContentLoaded', loadParties);