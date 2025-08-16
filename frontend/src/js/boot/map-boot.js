(() => {
  const ready = (cb) => (document.readyState === 'loading')
    ? document.addEventListener('DOMContentLoaded', cb, {once:true})
    : cb();

  const waitForMaps = async (ms=3000) => {
    const t0 = performance.now();
    while (performance.now()-t0 < ms) {
      if (window.google?.maps?.Map && (google.maps.marker?.AdvancedMarkerElement || google.maps.Marker))
        return true;
      await new Promise(r=>setTimeout(r,100));
    }
    return false;
  };

  const normList = (raw) => {
    const arr = Array.isArray(raw?.data) ? raw.data
            : Array.isArray(raw?.parties) ? raw.parties
            : Array.isArray(raw) ? raw : [];
    return arr.map(e => {
      const lat = Number(e.lat ?? e.latitude ?? e.location?.lat ?? e.coords?.lat);
      const lng = Number(e.lng ?? e.longitude ?? e.lon ?? e.location?.lng ?? e.coords?.lng);
      const date = String(e.date || e.start || e.startsAt || '').slice(0,10);
      return { ok: Number.isFinite(lat)&&Number.isFinite(lng), lat, lng, title: e.title || e.name || 'Party', date };
    }).filter(x=>x.ok);
  };

  let _map, _bounds, _markers = [];

  const ensurePanel = (iso) => {
    let panel = document.querySelector('.map-panel');
    if (!panel) {
      panel = document.createElement('section');
      panel.className = 'map-panel';
      panel.innerHTML = `
        <header class="map-header"><button class="btn-back" aria-label="Back">← Back</button><h2 class="map-title"></h2></header>
        <div id="map-container" style="width:100%;height:calc(100vh - 64px);"></div>
      `;
      (document.getElementById('app') || document.body).appendChild(panel);
      panel.querySelector('.btn-back').addEventListener('click', ()=> history.back());
    }
    panel.querySelector('.map-title').textContent = iso ? `Map — ${iso}` : 'Map';
    return panel;
  };

  const mountMap = async (iso) => {
    const ok = await waitForMaps();
    const panel = ensurePanel(iso);
    const box = panel.querySelector('#map-container');
    if (!ok) {
      box.textContent = 'Google Maps failed to load.';
      return;
    }
    if (!_map) {
      _map = new google.maps.Map(box, { center:{lat:50.9375,lng:6.9603}, zoom:12 });
    }
    // clear old markers
    _markers.forEach(m => m.map && m.setMap?.(null));
    _markers = [];
    _bounds = new google.maps.LatLngBounds();

    let list=[];
    try {
      const r = await fetch('/api/parties?conference=gamescom2025', {headers:{accept:'application/json'}});
      const j = await r.json();
      list = normList(j);
    } catch (e) {}

    if (iso) list = list.filter(x => x.date === iso);
    list.forEach(it => {
      let m;
      if (google.maps.marker?.AdvancedMarkerElement) {
        const pin = document.createElement('div');
        pin.textContent = '●'; pin.style.fontSize='18px'; pin.style.lineHeight='18px';
        pin.style.filter='drop-shadow(0 2px 4px rgba(0,0,0,.45))'; pin.style.color='#6b7bff';
        m = new google.maps.marker.AdvancedMarkerElement({ map:_map, position:{lat:it.lat,lng:it.lng}, content:pin, title:it.title });
      } else {
        m = new google.maps.Marker({ map:_map, position:{lat:it.lat,lng:it.lng}, title:it.title });
      }
      _markers.push(m);
      _bounds.extend({lat:it.lat,lng:it.lng});
    });

    if (_markers.length) _map.fitBounds(_bounds, 48);
  };

  const isMapRoute = (h) => /^#\/map(\/\d{4}-\d{2}-\d{2})?$/.test(h||location.hash);
  const isoFromHash = (h) => (/#\/map\/(\d{4}-\d{2}-\d{2})/.exec(h||location.hash)?.[1]) || null;

  const onRoute = () => {
    if (!isMapRoute()) return;
    // show the day subnav if present
    document.querySelector('[data-subnav="map"] .v-day-subnav')?.classList?.add('is-visible');
    mountMap(isoFromHash());
  };

  ready(onRoute);
  window.addEventListener('hashchange', onRoute, {passive:true});
})();