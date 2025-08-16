// Panels: Map by Day (MonSat)
// Route: #/map/YYYY-MM-DD

function toISO(d){ return (d||'').slice(0,10); }
function labelFor(iso){
  const dt = new Date(iso + 'T00:00:00');
  const wd = dt.toLocaleDateString(undefined, { weekday:'short' });
  const dd = dt.toLocaleDateString(undefined, { day:'2-digit' });
  return `${wd} ${dd}`;
}

async function fetchParties() {
  const res = await fetch('/api/parties?conference=gamescom2025', {
    headers: { 'accept':'application/json' },
    credentials: 'same-origin'
  });
  let raw=null; try { raw = await res.json(); } catch {}
  const arr = Array.isArray(raw?.data) ? raw.data
           : Array.isArray(raw?.parties) ? raw.parties
           : Array.isArray(raw) ? raw : [];
  return arr;
}

function normalize(p){
  const title = p.title || p.name || 'Party';
  const start = p.start || p.startsAt || p.date || '';
  const date  = toISO(start || p.date || '');
  const lat   = Number(p.lat ?? p.latitude ?? p.location?.lat ?? p.coords?.lat);
  const lng   = Number(p.lng ?? p.longitude ?? p.location?.lng ?? p.coords?.lng);
  return { title, date, lat, lng };
}

export async function mountMapDay(iso) {
  const host = document.getElementById('app') || document.body;
  const wrap = document.createElement('section');
  wrap.className = 'panel panel-map-day';
  wrap.innerHTML = `
    <header class="panel-head">
      <button class="back-btn" aria-label="Back" data-route="#/home">ê</button>
      <h2 class="panel-title">Map  ${labelFor(iso)}</h2>
    </header>
    <div id="map-container" style="height:calc(100vh - 56px);"></div>
  `;
  host.replaceChildren(wrap);

  // guard: require Maps JS (single loader already on page)
  if (!(window.google?.maps?.marker?.AdvancedMarkerElement)) {
    console.warn('Google Maps not ready.');
    return;
  }

  const center = { lat: 50.9375, lng: 6.9603 }; // Cologne
  const map = new google.maps.Map(wrap.querySelector('#map-container'), {
    center, zoom: 12, mapId: 'DEMO_MAP_ID'
  });

  const all = (await fetchParties()).map(normalize);
  const list = all.filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng) && p.date === iso);

  const bounds = new google.maps.LatLngBounds();
  for (const it of list) {
    const pin = document.createElement('div');
    pin.textContent = 'œ';
    pin.style.fontSize = '18px';
    pin.style.lineHeight = '18px';
    pin.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,.45))';
    pin.style.color = '#6b7bff';
    new google.maps.marker.AdvancedMarkerElement({
      map, position: { lat: it.lat, lng: it.lng }, content: pin, title: it.title
    });
    bounds.extend({ lat: it.lat, lng: it.lng });
  }
  if (list.length) map.fitBounds(bounds, 48);

  wrap.addEventListener('click', (e) => {
    const back = e.target.closest('.back-btn');
    if (back) { e.preventDefault(); history.back(); return; }
  });
}