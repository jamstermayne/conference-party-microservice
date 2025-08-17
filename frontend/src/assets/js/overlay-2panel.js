/* globals google */
import { getPartiesByDate } from './parties-data.js';
import { cleanupManager } from './cleanup-manager.js';

const SEL_PARTIES_PILL = '.home-section[data-section="parties"] .day-pill';
const SEL_MAP_PILL     = '.home-section[data-section="map"] .day-pill';

const OVERLAY_ID = '_overlay_panel';
const MAP_ID_DEMO = 'DEMO_MAP_ID';

function ensureOverlay() {
  let el = document.getElementById(OVERLAY_ID);
  if (el) return el;
  el = document.createElement('section');
  el.id = OVERLAY_ID;
  el.className = 'panel overlay';
  el.innerHTML = `
    <header class="panel__head">
      <button class="btn btn--ghost btn-back" data-action="back" aria-label="Back">←</button>
      <h1 class="panel__title"></h1>
    </header>
    <div class="panel__body"></div>
  `;
  document.body.appendChild(el);
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-action="back"], .btn-back');
    if (b) hideOverlay();
  }, { passive: true });
  return el;
}
function showOverlay(title) {
  const el = ensureOverlay();
  el.querySelector('.panel__title').textContent = title || '';
  el.classList.add('panel--active');
  return el.querySelector('.panel__body');
}
function hideOverlay() {
  document.getElementById(OVERLAY_ID)?.classList.remove('panel--active');
}

/* RENDER: Parties list with modern cards */
function cardHTML(e) {
  const dateObj = e.date ? new Date(e.date) : null;
  const dateStr = dateObj ? dateObj.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  }) : '';
  const timeStr = e.start ? new Date(e.start).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : '';
  const venue = e.venue || '';
  const price = e.price || '';
  
  return `
    <article class="card-modern card-modern--event party-card" data-id="${e.id}">
      ${price ? `
        <span class="card-modern__badge ${price.toLowerCase() === 'free' ? 'card-modern__badge--free' : ''}">
          ${price}
        </span>
      ` : ''}
      
      <header class="card-modern__header">
        <div class="card-modern__eyebrow">
          <span>${dateStr}</span>
          ${timeStr ? `<span>•</span><span>${timeStr}</span>` : ''}
        </div>
        <h3 class="card-modern__title">${e.title || 'Party'}</h3>
        ${venue ? `<p class="card-modern__subtitle">${venue}</p>` : ''}
      </header>
      
      ${e.description ? `
        <div class="card-modern__body">
          <p class="card-modern__description">${e.description}</p>
        </div>
      ` : ''}
      
      <footer class="card-modern__footer">
        <button class="card-modern__action card-modern__action--primary btn-cta" data-action="ics" data-id="${e.id}">
          Add to Calendar
        </button>
        <button class="card-modern__action card-modern__action--secondary" data-action="google" data-id="${e.id}">
          Google
        </button>
      </footer>
    </article>
  `;
}
async function mountParties(dateStr) {
  const body = showOverlay(`Parties · ${dateStr}`);
  body.innerHTML = '<div class="card-modern-grid" style="grid-template-columns: repeat(2, 1fr);"></div>';
  const listEl = body.querySelector('.card-modern-grid');

  // Endless list (very simple: append in chunks of 20)
  const all = await getPartiesByDate(dateStr);
  
  // If no parties, show message
  if (!all || all.length === 0) {
    body.innerHTML = `<p style="text-align: center; margin-top: 2rem; opacity: 0.7;">No parties for ${dateStr}</p>`;
    return;
  }
  
  let idx = 0, CHUNK = 20;
  function appendChunk() {
    const slice = all.slice(idx, idx + CHUNK);
    listEl.insertAdjacentHTML('beforeend', slice.map(cardHTML).join(''));
    idx += CHUNK;
  }
  appendChunk();
  body.addEventListener('scroll', () => {
    if (body.scrollTop + body.clientHeight >= body.scrollHeight - 200) {
      if (idx < all.length) appendChunk();
    }
  }, { passive:true });

  // Calendar button wiring
  body.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    
    const card = btn.closest('.card-modern');
    const title = card.querySelector('.card-modern__title')?.textContent || 'Party';
    
    if (btn.dataset.action === 'ics') {
      // Fire minimal ICS download
      const ics = [
        'BEGIN:VCALENDAR','VERSION:2.0','PRODID:party-app',
        'BEGIN:VEVENT',
        `SUMMARY:${title}`,
        `DTSTART:${dateStr.replace(/-/g,'')}T180000Z`,
        `DTEND:${dateStr.replace(/-/g,'')}T210000Z`,
        'END:VEVENT','END:VCALENDAR'
      ].join('\r\n');
      const blob = new Blob([ics], {type:'text/calendar'});
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${title}.ics` });
      a.click();
      URL.revokeObjectURL(a.href);
    } else if (btn.dataset.action === 'google') {
      // Open Google Calendar
      const url = new URL('https://calendar.google.com/calendar/render');
      url.searchParams.set('action', 'TEMPLATE');
      url.searchParams.set('text', title);
      url.searchParams.set('dates', `${dateStr.replace(/-/g,'')}T180000Z/${dateStr.replace(/-/g,'')}T210000Z`);
      window.open(url.toString(), '_blank');
    }
  });
}

/* MAP loader (single) */
function ensureMapsLoader() {
  if (window.google?.maps?.version) return Promise.resolve();
  // Use existing Maps loader if present
  const existing = document.getElementById('maps-loader');
  if (existing) {
    return new Promise((res) => {
      const check = () => {
        if (window.google?.maps?.Map) res();
        else setTimeout(check, 100);
      };
      check();
    });
  }
  // Fallback: create new loader from localStorage key
  const key = localStorage.getItem('GMAPS_BROWSER_KEY') || 'AIzaSyD5Zj_Hj31Vda3bcybxX6W4zmDlg8cotgc';
  if (!key) { console.warn('No GMAPS_BROWSER_KEY in localStorage'); return Promise.resolve(); }
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    const u = new URL('https://maps.googleapis.com/maps/api/js');
    u.searchParams.set('key', key);
    u.searchParams.set('v', 'weekly');
    u.searchParams.set('libraries','marker');
    u.searchParams.set('loading','async');
    s.src = u.toString(); s.defer = true;
    s.onload = () => res(); s.onerror = rej;
    document.head.appendChild(s);
  });
}

async function mountMap(dateStr) {
  await ensureMapsLoader();
  const body = showOverlay(`Map · ${dateStr}`);
  body.innerHTML = `<div id="overlay-map"></div>`;
  if (!window.google?.maps) {
    body.insertAdjacentHTML('beforeend','<p>Map failed to load.</p>');
    return;
  }
  const mapEl = body.querySelector('#overlay-map');
  const map = new google.maps.Map(mapEl, {
    zoom: 12,
    center: { lat: 50.9375, lng: 6.9603 },
    mapId: window.__MAP_ID || MAP_ID_DEMO
  });

  const items = await getPartiesByDate(dateStr);
  const bounds = new google.maps.LatLngBounds();
  for (const it of items) {
    if (it.lat==null || it.lng==null) continue;
    const dot = document.createElement('div');
    dot.textContent = '●';
    dot.style.fontSize = '18px';
    dot.style.lineHeight = '18px';
    dot.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,.45))';
    dot.style.color = '#6b7bff';

    new google.maps.marker.AdvancedMarkerElement({
      map, position: {lat: it.lat, lng: it.lng}, content: dot, title: it.title
    });
    bounds.extend({lat: it.lat, lng: it.lng});
  }
  if (!bounds.isEmpty()) map.fitBounds(bounds, 64);
}

/* Pill wiring (no inline href reliance; use dataset or text) */
function wirePills() {
  // Parties pills
  document.querySelectorAll(SEL_PARTIES_PILL).forEach(btn => {
    if (btn.__wired) return;
    btn.__wired = true;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const date = btn.dataset.iso || btn.dataset.date || (btn.getAttribute('aria-label')||'').slice(-10);
      if (!date) return;
      mountParties(date);
    }, { passive:false });
  });

  // Map pills
  document.querySelectorAll(SEL_MAP_PILL).forEach(btn => {
    if (btn.__wired) return;
    btn.__wired = true;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const date = btn.dataset.iso || btn.dataset.date || (btn.getAttribute('aria-label')||'').slice(-10);
      if (!date) return;
      mountMap(date);
    }, { passive:false });
  });
}

/* Boot */
function initWiring() {
  // Wait for pills to exist
  const checkPills = () => {
    const pills = document.querySelectorAll('.day-pill');
    if (pills.length > 0) {
      console.log('[overlay-2panel] Found', pills.length, 'pills, wiring...');
      wirePills();
    } else {
      console.log('[overlay-2panel] No pills yet, waiting...');
      setTimeout(checkPills, 200);
    }
  };
  checkPills();
}

// Try multiple init strategies
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWiring);
} else {
  // DOM already loaded, wait a bit for pills to render
  setTimeout(initWiring, 100);
}

// Also watch for dynamic updates
const mo = new MutationObserver(() => {
  const pills = document.querySelectorAll('.day-pill:not([__wired])');
  if (pills.length > 0) wirePills();
});
mo.observe(document.body, { childList:true, subtree:true });

/* ESC to close */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') hideOverlay();
}, { passive: true });