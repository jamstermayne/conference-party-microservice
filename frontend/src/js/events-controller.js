/**
 * Parties Controller — infinite scroll + per-card actions
 * Vanilla JS, Slack-dark polish, safe against missing APIs.
 */
import Events from '/assets/js/events.js';
import Store from '/js/store.js';
import { toast, emptyState } from '/js/ui-feedback.js';

const API_BASE = (window.__ENV && window.__ENV.API_BASE) || '/api';
const CONFERENCE = (window.__ENV && window.__ENV.CONFERENCE) || 'gamescom2025';

let page = 1;
let loading = false;
let done = false;
let observer = null;
let rootEl = null;
let gridEl = null;
let sentinelEl = null;

function api(url) {
  return `${API_BASE}${url}`;
}

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function cardSkeleton(count = 6) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const sk = document.createElement('div');
    sk.className = 'party-card skeleton';
    sk.innerHTML = `
      <div class="pc-top">
        <div class="pc-title shimmer"></div>
        <div class="pc-meta shimmer"></div>
      </div>
      <div class="pc-bottom">
        <div class="pc-btn shimmer"></div>
        <div class="pc-btn shimmer"></div>
      </div>`;
    frag.appendChild(sk);
  }
  return frag;
}

function partyCard(item) {
  // expected item fields are guarded with fallbacks
  const id = item.id || crypto.randomUUID();
  const title = item.title || item['Event Name'] || 'Untitled Event';
  const venue = item.venue || item['Hosts'] || '—';
  const date = item.date || item['Date'] || '';
  const time = item.time || item['Time'] || '';
  const price = item.price || item['Price'] || '';
  const url = item.url || item['URL'] || '#';

  const el = document.createElement('article');
  el.className = 'party-card card card-elevated card-interactive';
  el.setAttribute('data-id', id);
  el.innerHTML = `
    <div class="pc-top">
      <a class="pc-title" href="${url}" target="_blank" rel="noopener">${title}</a>
      <div class="pc-meta">
        <span class="pc-chip">${venue}</span>
        <span class="pc-dot">•</span>
        <span class="pc-chip">${date} ${time ? `· ${time}` : ''}</span>
        ${price ? `<span class="pc-price">${price}</span>` : ''}
      </div>
    </div>
    <div class="pc-bottom">
      <button class="btn btn-primary btn-small" data-action="save" aria-label="Save ${title}">Save</button>
      <button class="btn btn-secondary btn-small" data-action="calendar" aria-label="Sync ${title} to calendar">Save & Sync</button>
    </div>
  `;
  return el;
}

function bindCardActions(cardEl, item) {
  cardEl.addEventListener('click', async (e) => {
    const target = e.target.closest('button[data-action]');
    if (!target) return;
    const action = target.getAttribute('data-action');

    if (action === 'save') {
      try {
        const saved = Store.get('saved') || [];
        if (!saved.find(s => s.id === item.id)) {
          saved.push({ id: item.id, title: item.title || item['Event Name'] });
          Store.patch('saved', saved);
        }
        toast('Saved to your list', 'ok');
        Events.emit('events:saved', { id: item.id });
      } catch {
        toast('Could not save event', 'error');
      }
    }

    if (action === 'calendar') {
      try {
        Events.emit('calendar:add', { item }); // handled by calendar-integration.js
        toast('Opening calendar sync…', 'ok');
      } catch {
        toast('Calendar sync unavailable', 'error');
      }
    }
  });
}

async function loadNextPage() {
  if (loading || done) return;
  loading = true;

  // skeletons while loading
  gridEl.appendChild(cardSkeleton());

  try {
    // Parties endpoint is implemented on hosting: /api/parties
    // We page client-side by slicing, since API is flat; safe fallback
    const data = await getJSON(api(`/parties?conference=${encodeURIComponent(CONFERENCE)}`));
    const items = Array.isArray(data?.data) ? data.data : [];
    if (!items.length) {
      if (page === 1) {
        gridEl.innerHTML = '';
        gridEl.appendChild(emptyState('No events available yet.'));
      }
      done = true;
      return;
    }

    // naive paging: 12 per "page"
    const PAGE_SIZE = 12;
    const start = (page - 1) * PAGE_SIZE;
    const slice = items.slice(start, start + PAGE_SIZE);

    // remove skeletons
    gridEl.querySelectorAll('.party-card.skeleton').forEach(n => n.remove());

    if (!slice.length) {
      done = true;
      return;
    }

    const frag = document.createDocumentFragment();
    for (const item of slice) {
      const card = partyCard(item);
      bindCardActions(card, item);
      frag.appendChild(card);
    }
    gridEl.appendChild(frag);

    page += 1;
  } catch (err) {
    console.error('Failed to load parties:', err);
    toast('Could not load events', 'error');
    // clean any skeletons left
    gridEl.querySelectorAll('.party-card.skeleton').forEach(n => n.remove());
    if (page === 1) {
      gridEl.appendChild(emptyState('Could not load events. Try again later.'));
    }
    done = true; // prevent hammering
  } finally {
    loading = false;
  }
}

function ensureHeader() {
  const hdr = rootEl.querySelector('.parties-header');
  if (hdr) return;
  const header = document.createElement('header');
  header.className = 'parties-header';
  header.innerHTML = `
    <div class="ph-left">
      <div class="hash-tag">#</div>
      <h1 class="ph-title">parties</h1>
    </div>
    <div class="ph-right">
      <span class="ph-hint">Scroll & pick what you like</span>
    </div>
  `;
  rootEl.prepend(header);
}

function attachObserver() {
  if (observer) observer.disconnect();
  observer = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        loadNextPage();
      }
    }
  }, { root: null, rootMargin: '600px 0px 600px 0px', threshold: 0 });
  observer.observe(sentinelEl);
}

export async function initPartiesView() {
  // route container pattern: <section id="route-parties">
  rootEl = document.getElementById('route-parties') || document.querySelector('[data-route="parties-root"]') || document.getElementById('main');
  if (!rootEl) return;
  rootEl.innerHTML = `
    <div class="parties-view">
      <div class="parties-grid" id="parties-grid"></div>
      <div id="parties-sentinel" class="sentinel" aria-hidden="true"></div>
    </div>
  `;
  ensureHeader();

  gridEl = rootEl.querySelector('#parties-grid');
  sentinelEl = rootEl.querySelector('#parties-sentinel');

  page = 1; loading = false; done = false;

  // first load
  await loadNextPage();
  attachObserver();

  // optional: re-flow on theme/resize
  window.addEventListener('resize', () => {
    // noop for now; reserved for masonry tweaks
  }, { passive: true });
}

// Auto-init when route changes to 'parties'
try {
  document.addEventListener('route:change', (e) => {
    const { name } = e.detail || {};
    if (name === 'parties') initPartiesView();
  });
} catch {}

// Keep existing exports for compatibility
export async function renderParties(){
  return initPartiesView();
}

export async function initEventsController(containerId) {
  // Legacy compatibility
  if (containerId === 'parties-list') {
    return initPartiesView();
  }
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`initEventsController: No container with id ${containerId}`);
    return;
  }
  return initPartiesView();
}

export default { renderParties, initEventsController, initPartiesView };