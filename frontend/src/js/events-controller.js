/**
 * Parties list (cards grid) — unlimited items
 * Data priority:
 *   1) /api/parties?conference=gamescom2025
 *   2) window.__SEARCH_CACHE?.events
 *   3) window.__EVENTS_FALLBACK (baked minimal seed)
 */
import Events from '/assets/js/events.js';

const CONFERENCE = 'gamescom2025';
const API = `/api/parties?conference=${CONFERENCE}`;

function badge(txt){ return `<span class="chip">${txt}</span>`; }

function card(event){
  const price = event.price || 'Free';
  const venue = event.venue || '';
  const time  = event.time  || event.datetime || '';
  return `
    <article class="party-card">
      <div class="pc-top">
        <h3 class="pc-title">${event.title || 'Untitled'}</h3>
        <div class="pc-badges">
          ${badge(price.startsWith('From') ? price : price === 'Free' ? 'Free' : price)}
          ${badge('live')}
        </div>
      </div>
      <div class="pc-meta">
        <div class="pc-row">
          <span class="pc-ico">📍</span><span>${venue}</span>
        </div>
        <div class="pc-row">
          <span class="pc-ico">🗓️</span><span>${time}</span>
        </div>
      </div>
      <div class="pc-actions">
        <button class="btn btn-primary">Save & Sync</button>
        <button class="btn btn-ghost">Details</button>
      </div>
    </article>
  `;
}

function section(title, items){
  return `
    <section class="section-card">
      <div class="left-accent" aria-hidden="true"></div>
      <header class="section-head">
        <h2 class="text-heading">${title}</h2>
        <div class="subtle">Scroll to explore</div>
      </header>
      <div class="cards-grid">
        ${items.map(card).join('')}
      </div>
    </section>
  `;
}

function getCached(){
  const c1 = window.__SEARCH_CACHE?.events;
  if (Array.isArray(c1) && c1.length) return c1;
  const c2 = window.__EVENTS_FALLBACK;
  if (Array.isArray(c2) && c2.length) return c2;
  return [];
}

async function fetchParties(){
  try{
    const r = await fetch(API, { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP '+r.status);
    const j = await r.json();
    if (Array.isArray(j?.data) && j.data.length) return j.data;
  }catch(e){}
  return getCached();
}

export async function renderParties(root){
  const mount = root || document.getElementById('app') || document.getElementById('main');
  if (!mount) return;
  mount.innerHTML = `<div class="section-card"><div class="left-accent"></div><div class="skeleton">Loading events…</div></div>`;
  const items = await fetchParties();
  if (!items.length){
    mount.innerHTML = `<div class="section-card"><div class="left-accent"></div><div class="empty">No events yet.</div></div>`;
    return;
  }
  // Show ALL items (no cap)
  mount.innerHTML = section('Recommended events', items);
  Events.emit?.('parties:rendered', { count: items.length });
}

export default { renderParties };