/**
 * Events Controller
 * Handles party/hotspot/calendar rendering
 * Combines existing renderParties with new initEventsController
 */
import { renderPartiesInfinite } from '/js/parties-infinite.js';
import { getJSON } from '/js/http.js';
const Store = window.Store;

async function fetchEvents(){
  // Prefer your /api/parties if available; fallback to cached list
  const url = '/api/parties?conference=gamescom2025';
  try{
    const res = await getJSON(url); // { success, data: [...] }
    if(res?.success && Array.isArray(res.data)) return res.data;
  }catch(e){ console.warn('Parties API not available; using local cache', e); }
  return Store.get('events.all') || [];
}

export async function renderParties(){
  const main = document.getElementById('main') || document.getElementById('page-root');
  if (!main) return;
  
  try {
    main.innerHTML = `
      <section class="panel">
        <div class="panel-head">
          <h2>Parties</h2>
          <p class="subtle">Pick 3 parties you like • save & sync to calendar</p>
        </div>
        <div id="parties-list" data-parties-root></div>
      </section>`;
      
    const wrap = document.getElementById('parties-list');
    const events = await fetchEvents();
    Store.set('events.all', events);
    await renderPartiesInfinite(wrap, events);
    console.log('✅ Parties rendered (infinite)');
  } catch (error) {
    console.error('Failed to render parties:', error);
    main.innerHTML = `
      <section class="panel">
        <div class="panel-head">
          <h2>Parties</h2>
        </div>
        <div class="card card-outlined">
          <div class="text-secondary">Unable to load parties. Please refresh the page.</div>
        </div>
      </section>`;
  }
}

// New initEventsController function for simple index.html compatibility
export async function initEventsController(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`initEventsController: No container with id ${containerId}`);
    return;
  }

  try {
    const events = await fetchEvents();
    container.innerHTML = events.map(event => renderEventCard(event)).join('');
    container.querySelectorAll('.save-sync').forEach(btn => {
      btn.addEventListener('click', e => {
        const id = e.target.dataset.id;
        // saveEvent and syncEvent would need to be imported from save-sync.js
        console.log(`Save & sync event ${id}`);
      });
    });
  } catch (err) {
    console.error('Error loading events:', err);
    container.innerHTML = `<div class="error">Unable to load events. Please try again later.</div>`;
  }
}

function renderEventCard(event) {
  return `
    <div class="party-card">
      <h3>${event.name || event["Event Name"] || event.title || 'Unnamed Event'}</h3>
      <p>${event.description || ''}</p>
      <button class="save-sync" data-id="${event.id || event.ID}">Save & Sync</button>
    </div>
  `;
}

export default { renderParties, initEventsController };