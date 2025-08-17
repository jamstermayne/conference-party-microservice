/* overlay-live.js — Wires existing Mon–Fri pills to slide-in overlay panels.
   - Parties pills → Parties overlay with live cards + ICS
   - Map pills     → Map overlay with live markers (AdvancedMarkerElement)
   - No new routes, no inline handlers, CSP-safe: type="module" + defer
   - Uses /api/parties?conference=gamescom2025 (live)
   - Respects existing design tokens and cards-final.css
*/

/* globals google */
const CONF = 'gamescom2025';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const on = (el, ev, fn, opt) => el.addEventListener(ev, fn, opt);

const state = {
  parties: null,              // full list (normalized)
  byDate: new Map(),          // date -> party[]
  loadedAt: 0,
  overlay: null,
  content: null
};

// ========= Data layer =========
function normParty(p) {
  const date = String(p.date || p.start || p.startsAt || '').slice(0,10);
  const lat = Number(p.lat ?? p.latitude ?? p.location?.lat ?? p.coords?.lat);
  const lng = Number(p.lng ?? p.longitude ?? p.location?.lng ?? p.coords?.lng);
  return {
    id: p.id || p._id || p.slug || `${date}:${p.title || 'party'}`,
    title: p.title || p.name || 'Untitled party',
    venue: p.venue || p.locationName || '',
    startISO: p.start || p.startsAt || (date ? `${date}T20:00:00Z` : ''),
    endISO: p.end || p.endsAt || '',
    date,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    raw: p
  };
}

async function fetchParties() {
  if (state.parties && Date.now() - state.loadedAt < 60_000) return state.parties;
  const res = await fetch(`/api/parties?conference=${encodeURIComponent(CONF)}`, {
    headers: { accept: 'application/json' }
  });
  const data = await res.json();
  const list = Array.isArray(data) ? data
            : Array.isArray(data?.data) ? data.data
            : Array.isArray(data?.parties) ? data.parties
            : [];
  state.parties = list.map(normParty).filter(p => p.date);
  state.byDate.clear();
  for (const p of state.parties) {
    if (!state.byDate.has(p.date)) state.byDate.set(p.date, []);
    state.byDate.get(p.date).push(p);
  }
  state.loadedAt = Date.now();
  return state.parties;
}

// ========= Overlay (2nd panel) =========
function ensureOverlay() {
  if (state.overlay) return state.overlay;

  const overlay = document.createElement('section');
  overlay.className = 'panel overlay';             // styled by panels-2panel.css
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <div class="panel__wrap">
      <header class="panel__header">
        <button class="btn-back" data-action="back" aria-label="Back">←</button>
        <h1 class="panel__title"></h1>
      </header>
      <div class="panel__body" id="overlay-body"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  state.overlay = overlay;
  state.content = overlay.querySelector('#overlay-body');

  // Close/back
  on(overlay, 'click', (e) => {
    if (e.target.closest('[data-action="back"]')) closeOverlay();
  }, { passive: true });

  // Click outside to close
  on(document.body, 'click', (e) => {
    if (!state.overlay.classList.contains('panel--active')) return;
    const wrap = e.target.closest('.panel__wrap');
    if (!wrap) closeOverlay();
  }, { passive: true });

  // ESC to close
  on(document, 'keydown', (e) => { if (e.key === 'Escape') closeOverlay(); });

  return overlay;
}

function openOverlay(title) {
  ensureOverlay();
  state.overlay.querySelector('.panel__title').textContent = title || '';
  state.overlay.classList.add('panel--active');
  state.overlay.setAttribute('aria-hidden', 'false');
}

function closeOverlay() {
  if (!state.overlay) return;
  state.overlay.classList.remove('panel--active');
  state.overlay.setAttribute('aria-hidden', 'true');
  state.content.innerHTML = '';
}

// ========= Parties view =========
function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function escapeICS(s){ return String(s).replace(/[,;]/g, m => ({',':'\\,',';':'\\;'}[m])); }
function toICSDate(iso){
  const d = new Date(iso);
  const pad = n => String(n).padStart(2,'0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}
function buildICS(p) {
  const uid = `${p.id}@conference-party`;
  const dtStart = toICSDate(p.startISO || `${p.date}T20:00:00Z`);
  const dtEnd   = toICSDate(p.endISO   || `${p.date}T23:00:00Z`);
  const lines = [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//conference-party//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toICSDate(new Date().toISOString())}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeICS(p.title)}`,
    p.venue ? `LOCATION:${escapeICS(p.venue)}` : '',
    'END:VEVENT','END:VCALENDAR'
  ].filter(Boolean);
  return lines.join('\r\n');
}

function partyCardHTML(p) {
  const when = p.startISO ? new Date(p.startISO).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : p.date;
  return `
    <article class="vcard party-card" data-id="${p.id}">
      <div class="party-card__main">
        <h3 class="party-card__title">${escapeHTML(p.title)}</h3>
        <div class="party-card__meta">${escapeHTML(p.venue || '')}</div>
        <div class="party-card__when">${when}</div>
      </div>
      <div class="party-card__actions">
        <button class="btn btn-cta" data-action="ics">Add to Calendar</button>
      </div>
    </article>
  `;
}

function renderPartiesList(date) {
  const items = state.byDate.get(date) || [];
  if (!items.length) {
    state.content.innerHTML = `<p style="padding: var(--s-3)">No parties for ${date}.</p>`;
    return;
  }
  state.content.innerHTML = `
    <div class="party-list" style="display:grid;gap:var(--s-3)">
      ${items.map(partyCardHTML).join('')}
    </div>
  `;

  // Wire ICS download
  on(state.content, 'click', async (e) => {
    const btn = e.target.closest('[data-action="ics"]');
    if (!btn) return;
    const card = btn.closest('.party-card');
    const id = card?.dataset?.id;
    if (!id) return;

    // Prefer backend ICS if exists
    const url = `/api/calendar/ics?partyId=${encodeURIComponent(id)}`;
    try {
      const head = await fetch(url, { method: 'HEAD' });
      if (head.ok) {
        window.open(url, '_blank', 'noopener');
        return;
      }
    } catch {}

    // Fallback: client ICS
    const p = (state.byDate.get(date) || []).find(x => x.id === id);
    if (!p) return;
    const ics = buildICS(p);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${p.title || 'party'}.ics`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, { passive: true });
}

async function openPartiesPanel(date) {
  await fetchParties();
  openOverlay('Parties');
  renderPartiesList(date);
}

// ========= Map view =========
function mapsReady() { return !!(window.google?.maps?.marker?.AdvancedMarkerElement); }

function renderMap(date) {
  state.content.innerHTML = `<div id="overlay-map" style="height:70vh;min-height:420px"></div>`;
  const el = $('#overlay-map', state.overlay);
  const items = (state.byDate.get(date) || []).filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));

  const map = new google.maps.Map(el, {
    zoom: 12,
    center: items[0] ? { lat: items[0].lat, lng: items[0].lng } : { lat: 50.9375, lng: 6.9603 },
    mapId: window.__MAP_ID || 'DEMO_MAP_ID'
  });

  const bounds = new google.maps.LatLngBounds();
  for (const it of items) {
    const pin = document.createElement('div');
    pin.textContent = '●';
    pin.style.fontSize = '18px';
    pin.style.lineHeight = '18px';
    pin.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,.45))';
    pin.style.color = '#6b7bff';
    new google.maps.marker.AdvancedMarkerElement({
      map, position: { lat: it.lat, lng: it.lng }, content: pin, title: it.title
    });
    bounds.extend({ lat: it.lat, lng: it.lng });
  }
  if (items.length) map.fitBounds(bounds, 48);
  else map.setZoom(11);
}

async function openMapPanel(date) {
  await fetchParties();
  openOverlay('Map');
  if (!mapsReady()) {
    state.content.innerHTML = `<p style="padding:var(--s-3)">Maps not ready. Check API key/loader.</p>`;
    return;
  }
  renderMap(date);
}

// ========= Pill wiring (uses existing DOM) =========
function findHomeSections() {
  return {
    partiesSec: document.querySelector('.home-section[data-section="parties"]') || document,
    mapSec:     document.querySelector('.home-section[data-section="map"]')     || document
  };
}

function pickDateFromLabel(label) {
  // Get day-of-month from "Mon 18"
  const d2 = (label.match(/\b(\d{1,2})\b/) || [])[1];
  if (!d2) return null;
  for (const date of state.byDate.keys()) {
    const day = new Date(date + 'T00:00:00Z').getUTCDate();
    if (String(day) === String(d2)) return date;
  }
  return null;
}

function wirePills() {
  const { partiesSec, mapSec } = findHomeSections();

  // Parties pill buttons (Mon–Fri). Must be <button class="day-pill">.
  $$('.day-pill', partiesSec).forEach(btn => {
    if (btn.dataset._wired === '1') return;
    btn.dataset._wired = '1';
    on(btn, 'click', async (e) => {
      e.preventDefault();
      const date = btn.dataset.date || btn.dataset.iso || pickDateFromLabel(btn.textContent);
      if (!date) return;
      await openPartiesPanel(date);
    }, { passive: true });
  });

  // Map pill buttons
  $$('.day-pill', mapSec).forEach(btn => {
    if (btn.dataset._wired === '1') return;
    btn.dataset._wired = '1';
    on(btn, 'click', async (e) => {
      e.preventDefault();
      const date = btn.dataset.date || btn.dataset.iso || pickDateFromLabel(btn.textContent);
      if (!date) return;
      await openMapPanel(date);
    }, { passive: true });
  });
}

// ========= Boot =========
async function boot() {
  await fetchParties();
  wirePills();
}
boot().catch(console.error);