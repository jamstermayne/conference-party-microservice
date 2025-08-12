/**
 * Hotspots Controller (vanilla, production)
 * - Fetches /api/hotspots?conference=gamescom2025
 * - Renders canvas glow heatmap + ranked venue list
 * Dependencies: Events (pub/sub), Store (state), ui-feedback (toast/empty state)
 */

import Events from '/assets/js/events.js';
import Store from '/assets/js/store.js';
import { toast } from '/assets/js/ui-feedback.js';

const API = '/api/hotspots?conference=gamescom2025';

let ctx, canvas, rafId, points = [], mounted = false;
let scaleX = 1, scaleY = 1;

function resize() {
  if (!canvas) return;
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  scaleX = rect.width / 1000;   // logical space → px
  scaleY = rect.height / 600;
}

function clear() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
  if (ctx && canvas) ctx.clearRect(0,0,canvas.width,canvas.height);
}

function pickSlot(i, total) {
  // Evenly place venues in a logical grid (no geo required)
  const cols = 4;
  const w = 1000, h = 600;
  const col = i % cols;
  const row = Math.floor(i / cols);
  const cellW = w / cols;
  const rows = Math.ceil(total / cols);
  const cellH = h / Math.max(1, rows);
  return {
    x: (col + 0.5) * cellW,
    y: (row + 0.5) * cellH
  };
}

function paint() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0,0,canvas.width, canvas.height);
  const dpr = Math.max(1, window.devicePixelRatio || 1);

  for (const p of points) {
    // Gradient glow per point
    const r = (20 + p.weight * 18) * dpr;
    const gx = Math.floor(p.x * scaleX * dpr);
    const gy = Math.floor(p.y * scaleY * dpr);

    const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
    grad.addColorStop(0, `rgba(107,123,255, ${Math.min(0.85, 0.25 + p.weight * 0.1)})`);
    grad.addColorStop(1, 'rgba(107,123,255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(gx, gy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  rafId = requestAnimationFrame(paint);
}

function rankToWeight(rank, maxRank) {
  // normalize 1..N to 0.3..1.0
  if (maxRank <= 1) return 1;
  const inv = (maxRank - rank) / (maxRank - 1); // 0..1
  return 0.3 + inv * 0.7;
}

function renderList(data) {
  const list = document.getElementById('hotspots-list');
  if (!list) return;
  if (!data || data.length === 0) {
    list.innerHTML = `<div class="hotspot-empty">No hotspots yet. Check back tonight.</div>`;
    return;
  }
  const rows = data.map(h => {
    const p = h.persona || { dev:0, pub:0, inv:0, sp:0 };
    return `
      <div class="hotspot-item" data-venue="${h.venue}">
        <div>
          <div class="hotspot-name">${h.venue}</div>
          <div class="hotspot-meta">${h.sampleEvent?.title ? h.sampleEvent.title + ' • ' : ''}${h.sampleEvent?.start ? new Date(h.sampleEvent.start).toLocaleString() : ''}</div>
          <div class="badge-row">
            <span class="badge-pill dev">Dev ${p.dev||0}</span>
            <span class="badge-pill pub">Pub ${p.pub||0}</span>
            <span class="badge-pill inv">Inv ${p.inv||0}</span>
            <span class="badge-pill sp">SP ${p.sp||0}</span>
          </div>
        </div>
        <div class="hotspot-count">${h.total}</div>
      </div>
    `;
  }).join('');
  list.innerHTML = rows;

  list.querySelectorAll('.hotspot-item').forEach(el => {
    el.addEventListener('mouseenter', () => {
      const venue = el.getAttribute('data-venue');
      points.forEach(p => p.hover = (p.venue === venue));
    });
    el.addEventListener('mouseleave', () => {
      points.forEach(p => p.hover = false);
    });
  });
}

async function fetchHotspots() {
  try {
    const res = await fetch(API, { credentials: 'omit' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const data = json?.data || [];
    Store.patch('hotspots', data);
    return data;
  } catch (err) {
    console.warn('hotspots fetch failed:', err);
    toast('Unable to load hotspots right now', 'warn');
    return [];
  }
}

function buildPoints(data) {
  points = [];
  const max = data.length;
  data.forEach((h, i) => {
    const slot = pickSlot(i, max);
    const weight = rankToWeight(i, max); // already sorted by server
    points.push({
      venue: h.venue,
      x: slot.x,
      y: slot.y,
      weight,
      hover: false
    });
  });
}

function legendHTML() {
  return `
    <div class="legend">
      <span>Intensity:</span>
      <span class="legend-swatch low"></span> Low
      <span class="legend-swatch medium"></span> Med
      <span class="legend-swatch high"></span> High
    </div>
  `;
}

// Public mount for route activation
export async function mountHotspots() {
  if (mounted) return;
  mounted = true;

  // Wire DOM
  canvas = document.getElementById('hotspots-canvas');
  const legend = document.getElementById('hotspots-legend');
  if (!canvas || !legend) return;
  legend.innerHTML = legendHTML();

  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize, { passive: true });

  // Wire refresh button
  const refreshBtn = document.querySelector('[data-action="refresh-hotspots"]');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.disabled = true;
      const data = await fetchHotspots();
      buildPoints(data);
      renderList(data);
      clear();
      paint();
      setTimeout(() => { refreshBtn.disabled = false; }, 1000);
    });
  }

  // Load, build, render
  const data = await fetchHotspots();
  buildPoints(data);
  renderList(data);

  // Kick paint loop
  clear();
  paint();

  Events.emit('metrics', { name: 'hotspots_view', ts: Date.now(), count: data.length });
}

export function unmountHotspots() {
  mounted = false;
  window.removeEventListener('resize', resize);
  clear();
}

document.addEventListener('visibilitychange', () => {
  if (!mounted) return;
  if (document.hidden) clear(); else paint();
});