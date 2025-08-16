// router-lite.js — CSP-safe router that mounts panels for hash routes.
/* globals google */
const APP = () => document.getElementById('app') || document.body;

function clearApp() { APP().innerHTML = ''; }

function headerHTML(title){
  return `
    <header class="panel-header">
      <button class="back-btn" type="button" data-action="back" aria-label="Back">←</button>
      <h1>${title}</h1>
    </header>`;
}
function section(title, bodyHTML='') {
  const s = document.createElement('section');
  s.className = 'panel-section';
  s.innerHTML = `${headerHTML(title)}${bodyHTML}`;
  return s;
}

/* HOME */
function mountHome() {
  clearApp();
  const existing = document.querySelector('.home-panel');
  if (existing) { APP().appendChild(existing); return; }

  const wrap = document.createElement('div');
  wrap.className = 'home-panel';
  wrap.innerHTML = `
    <section class="home-section parties-section"><h2>Parties</h2><div class="day-pills" role="group"></div></section>
    <section class="home-section map-section"><h2>Map</h2><div class="day-pills" role="group"></div></section>
    <section class="home-section channels-section">
      <h2>Channels</h2>
      <nav class="channels-grid" aria-label="Primary">
        <a class="channel-btn" href="#/map">Map</a>
        <a class="channel-btn" href="#/calendar">My calendar</a>
        <a class="channel-btn" href="#/invites">Invites</a>
        <a class="channel-btn" href="#/contacts">Contacts</a>
        <a class="channel-btn" href="#/me">Me</a>
        <a class="channel-btn" href="#/settings">Settings</a>
      </nav>
    </section>`;
  APP().appendChild(wrap);
  window.dispatchEvent(new CustomEvent('home:skeleton-ready'));
}

/* MAP */
function mountMap(dateStr) {
  clearApp();
  const s = section('Map', `<div id="map-container" style="height:50vh;"></div>`);
  APP().appendChild(s);

  if (!(window.google?.maps?.marker?.AdvancedMarkerElement)) {
    const msg = document.createElement('p');
    msg.textContent = 'Loading Maps…';
    s.appendChild(msg);
    return;
  }
  const center = { lat: 50.9375, lng: 6.9603 }; // Cologne fallback
  const MAP_ID = window.__MAP_ID || 'DEMO_MAP_ID';
  const map = new google.maps.Map(s.querySelector('#map-container'), { center, zoom: 12, mapId: MAP_ID });

  fetch('/api/parties?conference=gamescom2025')
    .then(r => r.json())
    .then(raw => {
      const list = Array.isArray(raw?.data) ? raw.data
                : Array.isArray(raw?.parties) ? raw.parties
                : Array.isArray(raw) ? raw : [];
      const pickDate = dateStr || null;
      const norm = e => {
        const lat = Number(e.lat ?? e.latitude ?? e.location?.lat ?? e.coords?.lat);
        const lng = Number(e.lng ?? e.longitude ?? e.location?.lng ?? e.coords?.lng);
        const date = (e.date || e.start || e.startsAt || '').slice(0,10);
        return { ok: Number.isFinite(lat) && Number.isFinite(lng), lat, lng, title: e.title || e.name || 'Party', date };
      };
      const items = list.map(norm).filter(x => x.ok && (!pickDate || x.date === pickDate));
      const bounds = new google.maps.LatLngBounds();
      items.forEach(it => {
        const pin = document.createElement('div');
        pin.textContent = '●';
        pin.style.fontSize = '18px';
        pin.style.lineHeight = '18px';
        pin.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,.45))';
        pin.style.color = '#6b7bff';
        new google.maps.marker.AdvancedMarkerElement({
          map, position: { lat: it.lat, lng: it.lng }, content: pin, title: it.title
        });
        bounds.extend({ lat: it.lat, lng: it.lng });
      });
      if (items.length) map.fitBounds(bounds, 48);
    })
    .catch(()=>{});
}

/* PARTIES */
function mountParties(dateStr) {
  clearApp();
  const s = section('Parties', `<div class="card-grid" id="party-list"></div>`);
  APP().appendChild(s);

  fetch('/api/parties?conference=gamescom2025')
    .then(r => r.json())
    .then(raw => {
      const list = Array.isArray(raw?.data) ? raw.data
                : Array.isArray(raw?.parties) ? raw.parties
                : Array.isArray(raw) ? raw : [];
      const pickDate = dateStr || null;
      const within = e => {
        const d = (e.date || e.start || e.startsAt || '').slice(0,10);
        return !pickDate || d === pickDate;
      };
      const container = s.querySelector('#party-list');
      const fmtTime = iso => iso ? new Date(iso).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '';
      list.filter(within).slice(0,200).forEach(evt => {
        const card = document.createElement('article');
        card.className = 'vcard';
        card.innerHTML = `
          <h3 class="vcard-title">${(evt.title||evt.name||'Party')}</h3>
          <div class="vcard-meta">
            <span>${(evt.venue||evt.location?.name||'')}</span>
            <span>${fmtTime(evt.start || evt.startsAt)} – ${fmtTime(evt.end || evt.endsAt)}</span>
          </div>
          <div class="vcard-actions">
            <button class="btn-add-to-calendar" data-title="${(evt.title||'')}" data-start="${(evt.start||evt.startsAt||'')}" data-end="${(evt.end||evt.endsAt||'')}">Add to Calendar</button>
          </div>`;
        container.appendChild(card);
      });
    })
    .catch(()=>{});
}

/* Placeholders */
function mountPlaceholder(name) {
  clearApp();
  APP().appendChild(section(name, `<p style="padding:var(--s-3)">Coming soon.</p>`));
}

/* Router */
function parseRoute() {
  const h = location.hash || '#/home';
  const m = /^#\/(map|parties)(?:\/(\d{4}-\d{2}-\d{2}))?/.exec(h);
  return { hash: h, base: m?.[1] || h.replace(/^#\//,'') || 'home', date: m?.[2] || null };
}
function route() {
  const { base, date } = parseRoute();
  if (base === 'home' || base === '') return mountHome();
  if (base === 'map') return mountMap(date);
  if (base === 'parties') return mountParties(date);
  if (base === 'calendar') return mountPlaceholder('My calendar');
  if (base === 'invites') return mountPlaceholder('Invites');
  if (base === 'contacts') return mountPlaceholder('Contacts');
  if (base === 'me') return mountPlaceholder('Me');
  if (base === 'settings') return mountPlaceholder('Settings');
  return mountHome();
}

/* Events */
addEventListener('hashchange', route);
addEventListener('DOMContentLoaded', () => {
  if (!location.hash) location.hash = '#/home';
  route();
});
// CSP-safe back handler
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action="back"]');
  if (btn) {
    e.preventDefault();
    history.back();
  }
}, { passive: true });