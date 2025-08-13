// Lightweight map scaffold to keep parity with hotspots panel.
// If a real map SDK is not loaded yet, we show a polished placeholder.

import Events from './events.js?v=b022';
import Store from './store.js?v=b022';

function qs(s, r=document){return r.querySelector(s);}

function paintPlaceholder(canvas) {
  if (!canvas) return;
  canvas.innerHTML = `
    <div class="card card-outlined card-glass" style="min-height:280px;display:flex;align-items:center;justify-content:center">
      <div class="text-muted">Map will appear here • using live venues soon</div>
    </div>`;
}

function paintList(list, items=[]) {
  if (!list) return;
  list.innerHTML = '';
  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'card card-outlined card-compact text-secondary';
    empty.textContent = 'No venues to show yet.';
    list.appendChild(empty);
    return;
  }
  for (const v of items) {
    const c = document.createElement('div');
    c.className = 'card card-outlined card-hover';
    c.innerHTML = `<div class="card-body">
      <div class="text-primary" style="font-weight:600">${v.name || 'Venue'}</div>
      <div class="text-muted text-caption">${v.area || ''}</div>
    </div>`;
    list.appendChild(c);
  }
}

async function hydrate(root) {
  const canvas = qs('#map-canvas', root);
  const list = qs('#map-venues', root);

  paintPlaceholder(canvas);

  // Reuse hotspots data if available so both panels stay consistent
  const venues = (Store.get('hotspots.cache') || Store.get('hotspots.data') || []).map(v => ({
    name: v.name, area: v.area
  }));
  paintList(list, venues);
}

function wire(root) {
  if (!root) return;
  hydrate(root);
}

document.addEventListener('DOMContentLoaded', () => {
  const main = document.getElementById('main') || document;
  const mapPanel = qs('[data-panel="map"]') || qs('#panel-map') || qs('[data-route="map"]') || main;

  if (location.hash.includes('map')) wire(mapPanel);
  try {
    Events.on && Events.on('route:change', (name) => {
      if (name === 'map') wire(mapPanel);
    });
  } catch {}
});