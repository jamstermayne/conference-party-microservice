/* @sentinel router-2panel-lite v1 */
/* globals google */
(() => {
  const HOST_ID = 'panel-host';
  const ensureHost = () => {
    let h = document.getElementById(HOST_ID);
    if (!h) { h = Object.assign(document.createElement('div'), { id: HOST_ID, className: 'panel-host' }); document.body.appendChild(h); }
    return h;
  };
  const clearActive = () => {
    const h = ensureHost();
    const prev = h.querySelector('.panel.is-active');
    if (prev) { prev.classList.remove('is-active'); prev.classList.add('is-exit'); setTimeout(()=>prev.remove(), 300); }
  };
  const headerHTML = (title) => `
    <header class="panel__header">
      <button class="panel__back" data-action="back" aria-label="Back">← Back</button>
      <h2 class="panel__title">${title}</h2>
    </header>`;

  // Week helpers
  const fmt = (d) => d.toLocaleDateString('en-US',{weekday:'short', day:'2-digit'}).replace(',', '');
  const iso = (d) => d.toISOString().slice(0,10);
  const mondayOf = (d) => { const x=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())); const wd=(x.getUTCDay()+6)%7; x.setUTCDate(x.getUTCDate()-wd); return x; };

  async function weekFromAPI() {
    let base = new Date();
    try {
      const r = await fetch('/api/parties?conference=gamescom2025', { headers:{ accept:'application/json' }});
      const j = await r.json().catch(()=>null);
      const arr = Array.isArray(j?.data) ? j.data : Array.isArray(j?.parties) ? j.parties : Array.isArray(j) ? j : [];
      const dates = arr.map(e => String(e.date || e.start || e.startsAt || '').slice(0,10)).filter(Boolean);
      if (dates.length) base = new Date(dates.sort()[0]+'T00:00:00Z');
    } catch {}
    const mon = mondayOf(base);
    return Array.from({length:6},(_,i)=>{ const d=new Date(mon); d.setUTCDate(mon.getUTCDate()+i); return d; }); // Mon..Sat
  }

  // Panels
  async function mountHome() {
    clearActive();
    const h = ensureHost();
    const p = document.createElement('section');
    p.className = 'panel is-active panel--home';
    p.innerHTML = `${headerHTML('Home')}
      <div class="panel__body">
        <div class="home-panel">
          <section class="home-section" data-section="parties">
            <h2>Parties</h2>
            <div class="day-pills" data-role="parties"></div>
          </section>
          <section class="home-section" data-section="map">
            <h2>Map</h2>
            <div class="day-pills" data-role="map"></div>
          </section>
          <section class="home-section" data-section="channels">
            <div class="channels-grid"></div>
          </section>
        </div>
      </div>`;
    h.appendChild(p);

    // Back button (to no-op on home — keeps handler consistent)
    p.addEventListener('click', (ev) => {
      const a = ev.target.closest('[data-action="back"]'); if (!a) return;
      ev.preventDefault(); history.back();
    }, { passive: false });

    const days = await weekFromAPI();
    const renderPills = (node, kind) => {
      node.textContent = '';
      for (const d of days) {
        const b = document.createElement('button');
        b.className = 'day-pill';
        b.type = 'button';
        b.dataset.date = iso(d);
        b.textContent = fmt(d);
        b.addEventListener('click', () => {
          location.hash = kind === 'map' ? `#/map/${b.dataset.date}` : `#/parties/${b.dataset.date}`;
        }, { passive: true });
        node.appendChild(b);
      }
      node.querySelector('.day-pill')?.setAttribute('aria-pressed','true');
    };
    renderPills(p.querySelector('[data-role="parties"]'), 'parties');
    renderPills(p.querySelector('[data-role="map"]'), 'map');

    const channels = [
      ['Map',       '#/map'],
      ['My calendar', '#/calendar'],
      ['Invites',   '#/invites'],
      ['Contacts',  '#/contacts'],
      ['Me',        '#/me'],
      ['Settings',  '#/settings'],
    ];
    const grid = p.querySelector('.channels-grid');
    grid.textContent = '';
    for (const [label, route] of channels) {
      const btn = document.createElement('button');
      btn.className = 'channel-btn';
      btn.type = 'button';
      btn.textContent = label;
      btn.addEventListener('click', () => { location.hash = route; }, { passive: true });
      grid.appendChild(btn);
    }
  }

  async function mountParties(dateStr) {
    clearActive();
    const h = ensureHost();
    const p = document.createElement('section');
    p.className = 'panel is-active panel--parties';
    p.innerHTML = `${headerHTML(`Parties — ${dateStr||''}`)}
      <div class="panel__body">
        <div class="cards-grid" id="parties-list" style="display:grid; gap:var(--s-3)"></div>
      </div>`;
    h.appendChild(p);

    p.addEventListener('click', (ev) => {
      if (ev.target.closest('[data-action="back"]')) { ev.preventDefault(); location.hash = '#/home'; }
    }, { passive: false });

    // Fetch + render simple cards
    let list = [];
    try {
      const r = await fetch('/api/parties?conference=gamescom2025', { headers:{accept:'application/json'}});
      const j = await r.json().catch(()=>null);
      const arr = Array.isArray(j?.data) ? j.data : Array.isArray(j?.parties) ? j.parties : Array.isArray(j) ? j : [];
      list = arr.filter(e => String(e.date || e.start || e.startsAt || '').slice(0,10) === dateStr);
    } catch {}
    const host = p.querySelector('#parties-list');
    if (!list.length) { host.innerHTML = `<p>No parties found for ${dateStr}.</p>`; return; }
    host.innerHTML = list.map(e => `
      <article class="vcard">
        <header><h3>${(e.title||e.name||'Party')}</h3></header>
        <div class="event-meta">${(e.venue||'')} ${(e.time||'')}</div>
        <div class="event-actions"><button class="btn-add-to-calendar" data-id="${e.id||''}">Add to Calendar</button></div>
      </article>`).join('');
  }

  async function mountMap(dateStr) {
    clearActive();
    const h = ensureHost();
    const p = document.createElement('section');
    p.className = 'panel is-active panel--map';
    p.innerHTML = `${headerHTML(`Map — ${dateStr||''}`)}
      <div class="panel__body">
        <div id="map-container" style="height:60vh; border-radius:var(--r-3); overflow:hidden"></div>
      </div>`;
    h.appendChild(p);

    p.addEventListener('click', (ev) => {
      if (ev.target.closest('[data-action="back"]')) { ev.preventDefault(); location.hash = '#/home'; }
    }, { passive: false });

    // Simple map init (works with single loader on page)
    const el = p.querySelector('#map-container');
    if (!(window.google?.maps)) { el.innerHTML = '<p>Loading map…</p>'; return; }
    const center = { lat: 50.9375, lng: 6.9603 };
    const map = new google.maps.Map(el, { center, zoom: 12, mapId: window.__MAP_ID || 'DEMO_MAP_ID' });

    // Markers from API (filter by date)
    try {
      const r = await fetch('/api/parties?conference=gamescom2025', { headers:{accept:'application/json'}});
      const j = await r.json().catch(()=>null);
      const arr = Array.isArray(j?.data) ? j.data : Array.isArray(j?.parties) ? j.parties : Array.isArray(j) ? j : [];
      const list = arr.filter(e => String(e.date || e.start || e.startsAt || '').slice(0,10) === dateStr);
      const b = new google.maps.LatLngBounds();
      for (const e of list) {
        const lat = Number(e.lat ?? e.latitude ?? e.location?.lat ?? e.coords?.lat);
        const lng = Number(e.lng ?? e.longitude ?? e.location?.lng ?? e.coords?.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
        const pin = document.createElement('div'); pin.textContent='●'; pin.style.fontSize='18px';
        new google.maps.marker.AdvancedMarkerElement({ map, position: {lat,lng}, content: pin, title: e.title||e.name||'Party' });
        b.extend({lat,lng});
      }
      if (!b.isEmpty?.() && list.length) map.fitBounds(b, 48);
    } catch {}
  }

  // Router
  function route() {
    const h = location.hash.replace(/^#\/?/, '');
    if (!h) { location.hash = '#/home'; return; }
    const [name, arg] = h.split('/');
    if (name === 'home') return mountHome();
    if (name === 'parties' && /^\d{4}-\d{2}-\d{2}$/.test(arg||'')) return mountParties(arg);
    if (name === 'map' && (!arg || /^\d{4}-\d{2}-\d{2}$/.test(arg))) return mountMap(arg || new Date().toISOString().slice(0,10));
    // simple placeholders
    clearActive();
    const host = ensureHost();
    const p = document.createElement('section');
    p.className = 'panel is-active';
    p.innerHTML = `${headerHTML(name.charAt(0).toUpperCase()+name.slice(1))}<div class="panel__body"><p>Coming soon.</p></div>`;
    p.addEventListener('click', (ev) => { if (ev.target.closest('[data-action="back"]')) { ev.preventDefault(); location.hash = '#/home'; } }, {passive:false});
    host.appendChild(p);
  }

  window.addEventListener('hashchange', route, { passive:true });
  document.addEventListener('DOMContentLoaded', route, { passive:true });
})();