/**
 * events-controller.js — Parties (hero cards) with resilient data fetch.
 * Guarantees cards render by falling back to /assets/seed/events.json when API is empty or fails.
 */
import { createPartyCard } from './party-card.js?v=b011';

const API_URL = '/api/parties?conference=gamescom2025';
const SEED_URL = '/assets/seed/events.json';

/** Fetch JSON with guardrails. */
async function safeGet(url) {
  try {
    const r = await fetch(url, { credentials: 'include', cache: 'no-store' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch (e) {
    console.warn('[parties] fetch failed:', url, e.message || e);
    return null;
  }
}

/** Normalize API/seed shapes into a common event model the card understands. */
function normalize(list = []) {
  return list.map(ev => ({
    id: ev.id || crypto.randomUUID(),
    title: ev.title || ev.name || 'Untitled',
    venue: ev.venue || ev.location || '',
    priceLabel: ev.priceLabel || ev.price || '',
    isLive: Boolean(ev.isLive ?? true),
    start: ev.start || ev.startTime,
    end: ev.end || ev.endTime,
    rsvpUrl: ev.rsvpUrl || ev.url || '#',
    detailUrl: ev.detailUrl || ev.url || '#'
  }));
}

export async function renderParties(mount) {
  if (!mount) return;

  // Header
  mount.innerHTML = `
    <div class="section-card">
      <div class="left-accent" aria-hidden="true"></div>
      <h2 class="text-heading">Recommended events</h2>
      <div class="text-subtle">Scroll to explore</div>
      <div id="party-cards" class="cards-grid" style="margin-top:16px;"></div>
    </div>
  `;

  const grid = mount.querySelector('#party-cards');

  // Try API, then seed. Always render something.
  let data = await safeGet(API_URL);
  let events = normalize(Array.isArray(data?.events) ? data.events : data);

  if (!events?.length) {
    const fallback = await safeGet(SEED_URL);
    events = normalize(fallback);
  }

  if (!events?.length) {
    grid.innerHTML = `<div class="text-subtle">No events available.</div>`;
    return;
  }

  // Render hero cards
  const frag = document.createDocumentFragment();
  events.slice(0, 20).forEach(ev => {
    const card = createPartyCard(ev); // uses existing beautiful card component & CSS
    frag.appendChild(card);
  });
  grid.appendChild(frag);
}

export default { renderParties };