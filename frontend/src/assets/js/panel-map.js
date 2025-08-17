// panel-map.js  /* globals google */
import { loadParties } from './parties-index.js';

const html = (title) => `
  <section class="panel panel--active" data-panel="map" aria-label="${title}">
    <header class="panel__header">
      <button class="btn-back" data-action="back" aria-label="Back">← Back</button>
      <h1>${title}</h1>
    </header>
    <div class="panel__body"><div id="map" class="map-pane" style="height: calc(100vh - 120px)"></div></div>
  </section>`;

export async function mountMapPanel(iso) {
  document.querySelector('.panel.panel--active')?.remove();
  const host = document.getElementById('app') || document.body;
  host.insertAdjacentHTML('beforeend', html(`Map — ${iso}`));

  const map = new google.maps.Map(document.getElementById('map'), {
    zoom: 13,
    center: { lat: 50.9375, lng: 6.9603 },
    mapId: window.__MAP_ID || 'DEMO_MAP_ID'
  });

  const { byDate } = await loadParties();
  const rows = (byDate[iso] || []).filter(r => Number.isFinite(+r.lat) && Number.isFinite(+r.lng));

  const bounds = new google.maps.LatLngBounds();
  for (const r of rows) {
    const pin = document.createElement('div');
    pin.textContent = '●'; pin.style.fontSize = '18px'; pin.style.lineHeight = '18px';
    pin.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,.45))';
    new google.maps.marker.AdvancedMarkerElement({
      map, position: { lat:+r.lat, lng:+r.lng }, content: pin, title: r.title || ''
    });
    bounds.extend({ lat:+r.lat, lng:+r.lng });
  }
  if (rows.length) map.fitBounds(bounds, 48);

  host.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="back"]')) { e.preventDefault(); history.back(); }
  }, { passive: false });
}