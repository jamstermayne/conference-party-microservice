/**
 * events-controller.js
 * Renders party cards consistently with per-card "Save & Sync".
 */
import Events from '/assets/js/events.js';

async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
function h(html){ const d=document.createElement('div'); d.innerHTML=html.trim(); return d.firstChild; }

async function fetchParties() {
  // Prefer hosting endpoint; CF 404s are expected for now
  try {
    const res = await getJSON('/api/parties?conference=gamescom2025');
    return (res && res.data) || [];
  } catch { return []; }
}

function card(p) {
  return h(`
    <article class="card card-elevated party-card">
      <header class="card-header">
        <div class="party-title text-primary">${p.title || p.name || 'Untitled'}</div>
        <div class="party-meta text-secondary">${p.venue || p.location || ''}</div>
      </header>
      <div class="card-body">
        <div class="meta-row">
          <span class="badge badge-primary">${p.date || ''}</span>
          <span class="badge badge-secondary">${p.time || ''}</span>
          ${p.price ? `<span class="badge badge-glass">${p.price}</span>` : ''}
        </div>
      </div>
      <footer class="card-footer">
        <button class="btn btn-primary btn-small" data-action="save" data-id="${p.id}">Save & Sync</button>
        <button class="btn btn-outline btn-small" data-action="details" data-id="${p.id}">Details</button>
      </footer>
    </article>
  `);
}

async function renderParties() {
  const root = ensurePanel();
  root.innerHTML = `
    <div class="page-header">
      <h1 class="page-title text-primary">#parties</h1>
    </div>
    <section class="cards-grid" id="party-grid"></section>
  `;

  const grid = root.querySelector('#party-grid');
  const items = await fetchParties();
  items.forEach(p => grid.appendChild(card(p)));

  grid.querySelectorAll('[data-action="save"]').forEach(b=>{
    b.addEventListener('click', ()=> {
      Events.emit('calendar:save', { id: b.dataset.id });
      Events.emit('ui:toast', { type:'ok', message:'Saved & Sync queued' });
    });
  });
  grid.querySelectorAll('[data-action="details"]').forEach(b=>{
    b.addEventListener('click', ()=> {
      Events.emit('party:details', { id: b.dataset.id });
    });
  });
}

function ensurePanel(){
  let panel = document.querySelector('[data-panel="parties"]');
  if (!panel) {
    panel = document.createElement('main');
    panel.id = 'panel-parties';
    panel.setAttribute('data-panel','parties');
    panel.className = 'main-panel';
    document.querySelector('#app')?.appendChild(panel);
  }
  panel.hidden = false;
  return panel;
}

document.addEventListener('DOMContentLoaded', () => {
  // Render if landing route is parties
  const hash = String(location.hash||'').replace(/^#\/?/, '');
  if (hash === '' || hash === 'parties') renderParties();
});
import EventsBus from '/assets/js/events.js';
EventsBus.on('route', (r)=>{ if (r==='parties') renderParties(); });