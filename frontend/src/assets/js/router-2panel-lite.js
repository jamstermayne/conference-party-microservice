/* globals google */
(() => {
  const qs = s => document.querySelector(s);
  const qa = s => [...document.querySelectorAll(s)];
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const APP = () => (qs('#app') || document.body);

  // --- Panel helpers ---------------------------------------------------------
  function closeActivePanel() {
    const p = qs('.panel.panel--active');
    if (!p) return;
    p.classList.remove('panel--active');
    p.addEventListener('transitionend', () => p.remove(), { once: true });
    setTimeout(() => p.remove(), 500); // fallback
  }

  function mountSlidePanel(kind, dateISO) {
    closeActivePanel();

    // container
    const panel = document.createElement('section');
    panel.className = 'panel';
    panel.dataset.panel = kind;

    // header
    const header = document.createElement('header');
    header.className = 'panel__header';
    header.innerHTML = `
      <button class="back-btn" data-action="back" aria-label="Back">← Back</button>
      <h1>${kind === 'parties' ? 'Parties' : 'Map'} — ${dateISO}</h1>
    `;
    panel.appendChild(header);

    // body
    const body = document.createElement('div');
    body.className = 'panel__body';
    if (kind === 'parties') {
      body.innerHTML = `<div class="cards cards--list" data-date="${dateISO}">
        <div class="empty-state">Loading parties…</div>
      </div>`;
      panel.appendChild(body);
      fetchParties(dateISO).then(list => renderPartiesList(body, list));
    } else {
      body.innerHTML = `<div id="_map_panel" style="height:60vh;border-radius:var(--r-3);overflow:hidden"></div>`;
      panel.appendChild(body);
      ensureMaps().then(() => mountMap('#_map_panel', dateISO));
    }

    APP().appendChild(panel);
    requestAnimationFrame(() => panel.classList.add('panel--active'));
  }

  // --- Data + rendering ------------------------------------------------------
  async function fetchParties(dateISO) {
    try {
      const res = await fetch('/api/parties?conference=gamescom2025', { headers:{'accept':'application/json'} });
      const raw = await res.json();
      const rows = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
      return rows.filter(x => (x.date || x.start || '').slice(0,10) === dateISO);
    } catch (e) { return []; }
  }
  function renderPartiesList(el, rows) {
    if (!rows.length) { el.innerHTML = `<div class="empty-state">No parties for this day.</div>`; return; }
    el.innerHTML = rows.map(r => `
      <article class="vcard">
        <h3 class="vcard__title">${(r.title||r.name||'Untitled')}</h3>
        <div class="vcard__meta">${(r.venue||'')}</div>
      </article>
    `).join('');
  }

  // --- Maps ------------------------------------------------------------------
  function ensureMaps() {
    // Use the promise from maps-loader.js
    return window.whenMapsReady || Promise.reject(new Error('Maps loader not initialized'));
  }
  async function mountMap(sel, dateISO) {
    const host = qs(sel); if (!host) return;
    const rows = await fetchParties(dateISO);
    const center = { lat: 50.9375, lng: 6.9603 }; // Cologne
    const map = new google.maps.Map(host, { zoom: 12, center, mapId: window.__MAP_ID || 'DEMO_MAP_ID' });
    const b = new google.maps.LatLngBounds();
    let placed = 0;
    rows.forEach(r => {
      const lat = Number(r.lat ?? r.latitude ?? r.location?.lat);
      const lng = Number(r.lng ?? r.longitude ?? r.location?.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const pin = document.createElement('div'); pin.textContent = '●'; pin.style.fontSize = '18px';
      new google.maps.marker.AdvancedMarkerElement({ map, position: {lat,lng}, content: pin, title: r.title||r.name||'Party' });
      b.extend({lat,lng}); placed++;
    });
    if (placed) map.fitBounds(b, 48);
  }

  // --- Router ----------------------------------------------------------------
  function route() {
    const m = /^#\/([^/]+)\/?([^/]+)?/.exec(location.hash || '');
    const page = m?.[1] || 'home';
    const date = m?.[2] || null;

    if (page === 'home') {
      closeActivePanel();
      return;
    }
    if ((page === 'parties' || page === 'map') && date) {
      mountSlidePanel(page, date);
      return;
    }
    // fallback
    location.hash = '#/home';
  }

  window.addEventListener('hashchange', route, { passive: true });
  document.addEventListener('click', (ev) => {
    const back = ev.target.closest('[data-action="back"]');
    if (back) { ev.preventDefault(); history.back(); return; }

    const pill = ev.target.closest('.day-pill');
    if (pill && pill.closest('.home-section')) {
      ev.preventDefault();
      const sec = pill.closest('.home-section').dataset.section;
      const date = pill.dataset.date;
      if (sec === 'parties') location.hash = `#/parties/${date}`;
      if (sec === 'map')     location.hash = `#/map/${date}`;
    }
  }, { passive: false });

  // kick
  if (!location.hash || location.hash === '#/') location.hash = '#/home';
  route();
})();