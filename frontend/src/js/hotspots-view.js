/**
 * Hotspots View (no external map libs, CSP-safe)
 * - Fetches /api/hotspots
 * - Renders gradient heat on <canvas>
 * - Lists venues with counts and quick actions
 * - Auto-refresh every 60s
 * - Integrates with Events + Store if present, degrades if not
 */

const API_URL = '/api/hotspots?conference=gamescom2025';
const REFRESH_MS = 60_000;

let state = {
  data: [],
  lastUpdated: null,
  bounds: null, // { minLat, maxLat, minLng, maxLng }
  timer: null
};

function $(sel, root=document){ return root.querySelector(sel); }
function $all(sel, root=document){ return [...root.querySelectorAll(sel)]; }

function computeBounds(points) {
  let minLat=Infinity, maxLat=-Infinity, minLng=Infinity, maxLng=-Infinity;
  points.forEach(p => {
    if (typeof p.lat !== 'number' || typeof p.lng !== 'number') return;
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  });
  if (!isFinite(minLat) || !isFinite(minLng)) return null;
  // pad bounds slightly so edge points are visible
  const padLat = (maxLat - minLat) * 0.08 || 0.01;
  const padLng = (maxLng - minLng) * 0.08 || 0.01;
  return {
    minLat: minLat - padLat,
    maxLat: maxLat + padLat,
    minLng: minLng - padLng,
    maxLng: maxLng + padLng
  };
}

function latLngToXY(lat, lng, canvas, bounds) {
  const {minLat, maxLat, minLng, maxLng} = bounds;
  const x = ((lng - minLng) / (maxLng - minLng)) * canvas.width;
  const y = (1 - (lat - minLat) / (maxLat - minLat)) * canvas.height;
  return { x, y };
}

function drawHeat(ctx, w, h, points) {
  ctx.clearRect(0,0,w,h);

  // subtle background grid (Jobs/Ive vibe)
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--surface') || 'var(--neutral-100)';
  ctx.fillRect(0,0,w,h);

  // Heat draw: concentric radial gradients with additive alpha
  ctx.globalCompositeOperation = 'lighter';

  const maxCount = Math.max(1, ...points.map(p => p.count || 1));
  points.forEach(p => {
    const strength = Math.max(0.35, (p.count || 1) / maxCount);
    // radius scales with count & canvas size
    const base = Math.min(w, h);
    const radius = Math.max(18, base * 0.05 * strength);

    const grad = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, radius);
    // Purple → Magenta gradient, fading to transparent
    grad.addColorStop(0.0, `rgba(107, 123, 255, ${0.50 + 0.25 * strength})`);
    grad.addColorStop(0.5, `rgba(162, 92, 255, ${0.32 + 0.2 * strength})`);
    grad.addColorStop(1.0, `rgba(255, 107, 203, 0)`);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalCompositeOperation = 'source-over';

  // draw small crisp centers for readability
  points.forEach(p => {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  });
}

function renderCanvas(root, data) {
  const card = $('.hotspots-canvas-card', root);
  const canvas = $('.hotspots-canvas', root);
  const ctx = canvas.getContext('2d');

  // DPR-aware sizing
  const dpr = window.devicePixelRatio || 1;
  const rect = card.getBoundingClientRect();
  const cssW = rect.width;
  const cssH = Math.max(260, rect.width * 0.6);
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (!state.bounds) {
    state.bounds = computeBounds(data);
  }
  if (!state.bounds) {
    // nothing to draw
    ctx.clearRect(0,0,canvas.width, canvas.height);
    return;
  }

  const mapped = data
    .filter(p => typeof p.lat === 'number' && typeof p.lng === 'number')
    .map(p => {
      const { x, y } = latLngToXY(p.lat, p.lng, canvas, state.bounds);
      return { ...p, x, y };
    });

  drawHeat(ctx, canvas.width, canvas.height, mapped);
}

function renderList(root, data) {
  const list = $('.hotspots-list', root);
  list.innerHTML = '';

  if (!data || !data.length) {
    const empty = document.createElement('div');
    empty.className = 'hotspots-empty';
    empty.textContent = 'No live hotspots yet. Check back soon.';
    list.appendChild(empty);
    return;
  }

  const sorted = [...data].sort((a,b) => (b.count||0) - (a.count||0));
  const topId = sorted[0]?.id;

  sorted.forEach(item => {
    const row = document.createElement('div');
    row.className = 'hotspot-item' + (item.id === topId ? ' hotspot-top' : '');
    row.innerHTML = `
      <div>
        <div class="hotspot-name">${escapeHtml(item.name || 'Unknown venue')}</div>
        <div class="hotspot-sub">${item.lat?.toFixed(3) || '-'}, ${item.lng?.toFixed(3) || '-'}</div>
      </div>
      <div class="hotspot-actions">
        <div class="hotspot-count">${item.count ?? 0}</div>
        <button class="btn btn-ghost" data-action="map" data-id="${encodeURIComponent(item.id)}">Map</button>
        <button class="btn btn-secondary" data-action="directions" data-lat="${item.lat}" data-lng="${item.lng}">Go</button>
      </div>
    `;
    list.appendChild(row);
  });

  list.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    if (action === 'map') {
      const id = decodeURIComponent(btn.dataset.id);
      try { document.dispatchEvent(new CustomEvent('navigate', { detail: { route: 'hotspots', id } })); } catch {}
      toast(`Focused on ${id}`, 'ok');
    }
    if (action === 'directions') {
      const lat = btn.dataset.lat, lng = btn.dataset.lng;
      if (lat && lng) {
        // open native maps — stays simple & cross-platform
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
  }, { once: true }); // reattached on each render to avoid duplicate handlers
}

function escapeHtml(s='') {
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

async function load() {
  const root = document.getElementById('hotspots-view');
  if (!root) return;

  const metaEl = $('.hotspots-meta', root);
  try {
    const res = await fetch(API_URL, { credentials: 'omit' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    state.data = Array.isArray(json?.data) ? json.data : [];
    state.lastUpdated = json?.lastUpdated || new Date().toISOString();
    state.bounds = computeBounds(state.data);

    metaEl.innerHTML = `
      <span class="badge-live">LIVE</span>
      <span style="margin-left:8px;">Updated ${timeAgo(state.lastUpdated)}</span>
      <span style="margin-left:8px;color:var(--text-secondary)">• ${state.data.length} venues</span>
    `;

    renderCanvas(root, state.data);
    renderList(root, state.data);

  } catch (err) {
    console.error('Hotspots load failed', err);
    metaEl.textContent = 'Offline • Using nothing (no cache yet)';
    const list = $('.hotspots-list', root);
    list.innerHTML = `<div class="hotspots-empty">Unable to load hotspots (network). Try again shortly.</div>`;
    // Canvas cleared
    const canvas = $('.hotspots-canvas', root);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
  }
}

function timeAgo(ts) {
  const delta = Math.max(0, Date.now() - new Date(ts).getTime());
  const m = Math.round(delta / 60000);
  if (m <= 0) return 'just now';
  if (m === 1) return '1 min ago';
  if (m < 60) return `${m} mins ago`;
  const h = Math.round(m/60);
  return h === 1 ? '1 hr ago' : `${h} hrs ago`;
}

function onResize() {
  const root = document.getElementById('hotspots-view');
  if (!root || !state.data.length) return;
  renderCanvas(root, state.data);
}

function startAutoRefresh() {
  stopAutoRefresh();
  state.timer = setInterval(load, REFRESH_MS);
}
function stopAutoRefresh() {
  if (state.timer) clearInterval(state.timer);
  state.timer = null;
}

// Route integration: initialize when route=hotspots is active
function maybeInit() {
  const routeActive = location.hash.replace('#','') || 'parties';
  if (routeActive === 'hotspots') {
    load();
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
}

// Listen to router changes if available
try {
  document.addEventListener('route:change', () => {
    maybeInit();
  });
} catch {}

window.addEventListener('resize', () => {
  // debounce a bit
  clearTimeout(onResize._t);
  onResize._t = setTimeout(onResize, 150);
});

document.addEventListener('DOMContentLoaded', () => {
  // mount if hotspots route exists
  if (document.getElementById('hotspots-view')) {
    maybeInit();
  }
});

// small global toast shim (uses your ui-feedback if available)
function toast(msg, type='ok'){
  const live = document.getElementById('aria-live');
  if (live){ live.textContent=''; setTimeout(()=> live.textContent = String(msg), 30); }
  try { document.dispatchEvent(new CustomEvent('ui:toast',{detail:{type,message:msg}})); } catch {}
}

export default { load, startAutoRefresh, stopAutoRefresh };