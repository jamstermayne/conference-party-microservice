// Progressive enhancement for Hotspots panel.
// Safe to include on all pages: it only runs if the hotspots panel exists.

import Events from './events.js';
import Store from './store.js';

const HAS_API = !!(window.__ENV && window.__ENV.HOTSPOTS_API);

function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

function fmt(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

function paintSkeleton(container, count = 6) {
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const c = document.createElement('div');
    c.className = 'card card-outlined card-compact skeleton';
    c.style.minHeight = '56px';
    c.innerHTML = `<div class="card-body">
      <div class="skeleton-line" style="width:38%"></div>
      <div class="skeleton-line" style="width:24%"></div>
    </div>`;
    container.appendChild(c);
  }
}

function paintList(container, items = []) {
  if (!container) return;
  container.innerHTML = '';
  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'card card-outlined card-compact text-secondary';
    empty.textContent = 'No live heat yet. Check back soon.';
    container.appendChild(empty);
    return;
  }
  for (const v of items) {
    const c = document.createElement('div');
    c.className = 'card card-outlined card-hover';
    c.innerHTML = `<div class="card-body">
      <div class="flex flex-row" style="justify-content:space-between;gap:12px;align-items:center">
        <div class="text-primary" style="font-weight:600">${v.name || 'Venue'}</div>
        <div class="badge badge-gradient">${v.heat ?? 0}%</div>
      </div>
      <div class="text-muted text-caption">${v.area || ''}</div>
    </div>`;
    container.appendChild(c);
  }
}

async function fetchHotspots() {
  // Guard: don't error if API not live yet.
  if (!HAS_API) {
    await new Promise(r => setTimeout(r, 300));
    return { data: [] };
  }
  const u = `/api/hotspots?conference=${encodeURIComponent(window.__ENV.CONFERENCE || 'gamescom2025')}`;
  const res = await fetch(u).catch(() => null);
  if (!res || !res.ok) return { data: [] };
  return res.json().catch(() => ({ data: [] }));
}

async function refreshHotspots(root) {
  const list = qs('#hotspots-list', root);
  const stamp = qs('#hotspots-last-updated', root);
  paintSkeleton(list);
  const { data } = await fetchHotspots();
  paintList(list, data || []);
  const ts = Date.now();
  Store.patch('hotspots.lastUpdated', ts);
  if (stamp) stamp.textContent = `Last updated ${fmt(ts)}`;
}

function wire(root) {
  if (!root) return;
  const btn = qs('[data-action="hotspots-refresh"]', root);
  const stamp = qs('#hotspots-last-updated', root);

  // Initial paint
  refreshHotspots(root);

  // Button
  if (btn) btn.addEventListener('click', () => refreshHotspots(root));

  // Restore timestamp if we have one
  const last = Store.get('hotspots.lastUpdated');
  if (last && stamp) stamp.textContent = `Last updated ${fmt(last)}`;
}

// Run when Hotspots panel is visible
document.addEventListener('DOMContentLoaded', () => {
  // Works whether you use routes or static page.
  const main = document.getElementById('main') || document;
  const hotspotsPanel = qs('[data-panel="hotspots"]') || qs('#panel-hotspots') || qs('[data-route="hotspots"]') || main;
  if (location.hash.includes('hotspots')) wire(hotspotsPanel);

  // Also react to route changes (if your Events bus emits them)
  try {
    Events.on && Events.on('route:change', (name) => {
      if (name === 'hotspots') wire(hotspotsPanel);
    });
  } catch {}
});