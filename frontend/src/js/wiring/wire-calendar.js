// Delegated click handlers for calendar + map buttons (single source of truth)
import { createFromParty, startOAuth, isConnected } from '../services/gcal.js';
import { downloadIcs } from '../services/ics.js';

const M2M_LOGIN = 'https://app.meettomatch.com/cologne2025/site/signin/selector/';

function getPartyFromEl(el) {
  const card = el.closest('[data-party-id]');
  if (!card) return null;
  // Read attributes the cards already render:
  const id   = card.dataset.partyId;
  const t    = card.dataset.title;
  const s    = card.dataset.start; // ISO
  const e    = card.dataset.end;   // ISO
  const loc  = card.dataset.location;
  const desc = card.dataset.desc || '';
  const lat  = card.dataset.lat ? Number(card.dataset.lat) : undefined;
  const lon  = card.dataset.lon ? Number(card.dataset.lon) : undefined;
  return { id, title: t, start: s, end: e, location: loc, description: desc, lat, lon };
}

function openM2M() {
  // Open immediately on user gesture to avoid popup blockers
  window.open(M2M_LOGIN, '_blank', 'noopener');
}

async function handleGoogle(el) {
  const party = getPartyFromEl(el);
  if (!party) return;
  
  try {
    // Check if already connected
    const connected = await isConnected();
    if (!connected) {
      // Start OAuth with popup
      await startOAuth({ usePopup: true });
    }
    
    // Create calendar event
    await createFromParty(party);
    console.log('[gcal] Event created successfully');
  } catch (err) {
    console.error('[gcal] failed', err);
  }
}

function handleOutlook(el) {
  const party = getPartyFromEl(el);
  if (!party) return;
  downloadIcs(party); // triggers file save; works without auth
}

function handlePin(el) {
  const party = getPartyFromEl(el);
  if (!party || party.lat == null || party.lon == null) return;
  // Route to the map with a focus param
  window.location.hash = `#/map?focus=${party.lat},${party.lon}&id=${encodeURIComponent(party.id)}`;
}

async function handleAddToCalendar(el) {
  // Smart split: if Google already connected → save directly; else show provider menu
  const menu = el.closest('.card-actions')?.querySelector('.cal-menu');
  if (menu) {
    menu.classList.toggle('is-open');
    return;
  }
  
  // Check if Google Calendar is connected - if so, add directly
  try {
    const connected = await isConnected();
    if (connected) {
      const party = getPartyFromEl(el);
      if (party) {
        await createFromParty(party);
        console.log('[gcal] Event created successfully');
      }
    }
  } catch (err) {
    console.error('[gcal] Connection check failed', err);
  }
}

export function wireCalendarButtons(root = document) {
  root.addEventListener('click', (e) => {
    const t = e.target.closest('.btn-add-to-calendar,.btn-cal-google,.btn-cal-outlook,.btn-cal-m2m,.btn-pin,.day-pill');
    if (!t) return;

    if (t.matches('.btn-add-to-calendar')) { e.preventDefault(); handleAddToCalendar(t); }
    else if (t.matches('.btn-cal-google'))  { e.preventDefault(); handleGoogle(t); }
    else if (t.matches('.btn-cal-outlook')) { e.preventDefault(); handleOutlook(t); }
    else if (t.matches('.btn-cal-m2m'))     { e.preventDefault(); openM2M(); }
    else if (t.matches('.btn-pin'))         { e.preventDefault(); handlePin(t); }
    else if (t.matches('.day-pill'))        { e.preventDefault(); window.location.hash = t.dataset.href; }
  }, { passive: false });
}