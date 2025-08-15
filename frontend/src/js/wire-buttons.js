// Minimal, surgical wiring. No style changes.
import { addToGoogleCalendar, ensureGoogleConnected } from './calendar/google-calendar.js';
import { makeIcsAndDownload } from './calendar/ics.js';

// Helper: read party payload from the card
function readPartyPayload(el) {
  // Expect data attributes on the card (don't change markup; just read what exists)
  const card = el.closest('[data-party-id]');
  if (!card) throw new Error('Party card not found for button');
  return {
    id: card.dataset.partyId,
    title: card.dataset.title,
    description: card.dataset.desc || '',
    location: card.dataset.location || '',
    start: card.dataset.start,   // ISO string
    end: card.dataset.end,       // ISO string
    timezone: card.dataset.tz || 'Europe/Berlin',
    lat: card.dataset.lat ? Number(card.dataset.lat) : undefined,
    lng: card.dataset.lng ? Number(card.dataset.lng) : undefined,
    conference: card.dataset.conference || 'gamescom2025',
  };
}

async function handleAddToCalendar(btn) {
  const party = readPartyPayload(btn);
  // Check status; if connected call create; else open provider chooser
  const res = await fetch('/api/googleCalendar/status', { credentials: 'include' });
  const { connected } = await res.json().catch(() => ({ connected:false }));
  if (connected) {
    await addToGoogleCalendar(party);
  } else {
    document.querySelector('#calendar-provider-modal')?.classList.add('open');
  }
}

async function handleGoogle(btn) {
  const party = readPartyPayload(btn);
  await ensureGoogleConnected();            // popup → status poll
  await addToGoogleCalendar(party);         // create event
}

function handleOutlook(btn) {
  const party = readPartyPayload(btn);
  makeIcsAndDownload(party);
}

function handleM2M() {
  window.open('https://app.meettomatch.com/cologne2025/site/signin/selector/', '_blank', 'noopener,noreferrer');
}

function handleDisconnect() {
  fetch('/api/googleCalendar/disconnect', { method:'POST', credentials:'include' })
    .catch(()=>{}).finally(()=>location.reload());
}

function handlePin(btn) {
  const party = readPartyPayload(btn);
  if (party.lat && party.lng) {
    const id = encodeURIComponent(party.id || '');
    location.hash = `#/map?center=${party.lat},${party.lng}&id=${id}`;
  }
}

function handleDayPill(btn) {
  const iso = btn.getAttribute('data-iso');
  if (iso) location.hash = `#/map/${iso}`;
}

// Event delegation: one listener
export function wireGlobalButtons(root = document) {
  root.addEventListener('click', async (e) => {
    const t = e.target.closest('button,a');
    if (!t) return;

    if (t.classList.contains('btn-add-to-calendar')) {
      e.preventDefault(); await handleAddToCalendar(t);
    } else if (t.classList.contains('btn-cal-google')) {
      e.preventDefault(); await handleGoogle(t);
    } else if (t.classList.contains('btn-cal-outlook')) {
      e.preventDefault(); handleOutlook(t);
    } else if (t.classList.contains('btn-cal-m2m')) {
      e.preventDefault(); handleM2M();
    } else if (t.classList.contains('btn-disconnect-google')) {
      e.preventDefault(); handleDisconnect();
    } else if (t.classList.contains('btn-pin')) {
      e.preventDefault(); handlePin(t);
    } else if (t.classList.contains('day-pill')) {
      e.preventDefault(); handleDayPill(t);
    }
  }, { passive: false });
}