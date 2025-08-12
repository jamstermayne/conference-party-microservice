/**
 * Parties / Events Controller (uniform cards + per-card Save & Sync)
 */
import Events from '/assets/js/events.js';
import Store from '/js/store.js';
import { toast, emptyState } from '/js/ui-feedback.js';

const API_BASE = (window.__ENV && window.__ENV.API_BASE) || '/api';

function el(html){ const t=document.createElement('template'); t.innerHTML=html.trim(); return t.content.firstElementChild; }

async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text().catch(()=>r.statusText)}`);
  return r.json();
}

function icsFor(item) {
  // Minimal ICS per event; caller triggers download
  const dtstamp = new Date().toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
  const uid = `${item.id || (item.title||'event').replace(/\s+/g,'-')}@velocity`;
  const dt = item.dateISO || new Date().toISOString();
  // Without precise times, still valid ICS (all-day)
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//velocity.ai//events//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `SUMMARY:${(item.title||'Party').replace(/\n/g,' ')}`,
    item.venue ? `LOCATION:${item.venue}` : '',
    `DTSTART:${dt.replace(/[-:]/g,'').split('.')[0].replace('Z','')}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');
}

function download(filename, content, type='text/calendar') {
  const blob = new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 0);
}

function card(item) {
  const tags = [
    item.date && `<span class="badge-pill">${item.date}</span>`,
    item.time && `<span class="badge-pill">${item.time}</span>`,
    item.venue && `<span class="badge-pill">${item.venue}</span>`,
    item.price && `<span class="badge-pill">${item.price}</span>`
  ].filter(Boolean).join('');

  const c = el(`
    <article class="event-card">
      <div class="event-head">
        <h3 class="event-title">${(item.title||'Untitled')}</h3>
      </div>
      <div class="event-meta">${tags}</div>
      <div class="event-body">${item.description ? item.description : ''}</div>
      <div class="event-actions">
        <div class="left">
          <button class="btn btn-primary btn-xs" data-action="save" data-id="${item.id}">Save</button>
          <button class="btn btn-secondary btn-xs" data-action="sync" data-id="${item.id}">Sync</button>
        </div>
        <div class="right">
          <button class="btn btn-outline btn-xs" data-action="share" data-id="${item.id}">Share</button>
        </div>
      </div>
    </article>
  `);

  c.addEventListener('click', async (e)=>{
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'save') {
      // Local save
      const saved = Store.get('events.saved') || [];
      if (!saved.find(x=>x.id===item.id)) {
        saved.push({ id:item.id, title:item.title, date:item.date, time:item.time, venue:item.venue });
        Store.patch('events.saved', saved);
      }
      toast('Saved', 'ok');
    }
    if (action === 'sync') {
      // ICS per event
      const ics = icsFor(item);
      const fname = (item.title || 'event').replace(/\s+/g,'_') + '.ics';
      download(fname, ics);
      toast('Opening calendar…', 'ok');
    }
    if (action === 'share') {
      const text = `${item.title} @ ${item.venue || ''} ${item.date||''} ${item.time||''}`.trim();
      try {
        await navigator.share({ title: item.title, text, url: location.href });
      } catch { navigator.clipboard?.writeText(text).then(()=>toast('Copied', 'ok')); }
    }
  });

  return c;
}

export async function renderParties() {
  const root = document.getElementById('route-parties') || document.getElementById('main');
  if (!root) return;

  root.innerHTML = `
    <div class="events-wrap">
      <div class="events-grid" id="events-grid"></div>
    </div>
  `;

  const grid = document.getElementById('events-grid');

  // Prefer hosting path that's confirmed working:
  // /api/parties?conference=gamescom2025  (works via hosting rewrite)
  const url = `${API_BASE}/parties?conference=gamescom2025`;

  let data = [];
  try {
    const json = await getJSON(url);
    data = Array.isArray(json?.data) ? json.data : [];
  } catch (e) {
    console.warn('Failed to fetch parties:', e);
  }

  if (!data.length) {
    grid.append(emptyState('No events yet.')); 
    return;
  }

  data.forEach(item => grid.append(card(item)));
}

// Boot on route
try {
  document.addEventListener('route:change', (e)=>{
    if ((e.detail?.name) === 'parties') renderParties();
  });
} catch {}

// Keep existing exports for compatibility
export async function initPartiesView() {
  return renderParties();
}

export async function initEventsController(containerId) {
  // Legacy compatibility
  if (containerId === 'parties-list') {
    return renderParties();
  }
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`initEventsController: No container with id ${containerId}`);
    return;
  }
  return renderParties();
}

export default { renderParties, initEventsController, initPartiesView };