import { toast, emptyState } from '/assets/js/ui-feedback.js';

// top of file
const ENV = window.__ENV || {};
const API_BASE = ENV.API_BASE || "/api"; // if you want CF direct, set full URL in env

async function coreFetchJSON(path, fallbackUrl) {
  try {
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, { headers: { 'accept': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    // fallback: try SW-cached static data (if available)
    if (fallbackUrl) {
      const res2 = await fetch(fallbackUrl).catch(() => null);
      if (res2 && res2.ok) {
        const json = await res2.json().catch(() => ({}));
        return { success: true, data: json?.data || json || [] };
      }
    }
    throw e;
  }
}

async function loadParties() {
  const mount = document.querySelector('[data-route="parties"] [data-mount]');
  if (!mount) return;
  mount.innerHTML = '<div class="card card-outlined">Loading events…</div>';

  try {
    const json = await coreFetchJSON('/parties?conference=gamescom2025', '/offline-data/events.json');
    const items = json?.data || [];
    if (!items.length) throw new Error('No events');
    
    // TODO: render pretty cards here – for now list titles
    mount.innerHTML = items.map(e => `<div class="card card-outlined card-compact">${e["Event Name"] || e.title}</div>`).join('');
  } catch (err) {
    console.warn('Failed to load parties:', err);
    mount.replaceChildren(emptyState('No events yet. Check back shortly.'));
  }
}

document.addEventListener('DOMContentLoaded', loadParties);