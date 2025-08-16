/* router-2panel-lite.js - Production 2-panel system with panel stack */
/* globals google */

// ---------- tiny helpers ----------
const qs  = (s, r=document) => r.querySelector(s);
const qsa = (s, r=document) => [...r.querySelectorAll(s)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fmt = d => d.toISOString().slice(0,10);

// ---------- panel stack ----------
function ensureStack(){
  let el = qs('.panel-stack');
  if (!el) {
    el = document.createElement('div');
    el.className = 'panel-stack';
    document.body.appendChild(el);
  }
  return el;
}

function pushPanel(html){
  const stack = ensureStack();
  const panel = document.createElement('section');
  panel.className = 'panel';
  panel.innerHTML = html;
  stack.appendChild(panel);
  // activation + slide-in
  requestAnimationFrame(() => panel.classList.add('panel--active'));
  return panel;
}

function popPanel(){
  const p = qsa('.panel-stack .panel').at(-1);
  if (!p) return;
  p.classList.remove('panel--active');
  p.addEventListener('transitionend', () => p.remove(), { once:true });
}

function resetToHome(){
  const stack = ensureStack();
  stack.innerHTML = '';
}

// ---------- data (Mon–Sat from earliest party) ----------
async function getWeek(){
  try{
    const res = await fetch('/api/parties?conference=gamescom2025', { headers:{accept:'application/json'} });
    const json = await res.json();
    const list = Array.isArray(json?.data) ? json.data : Array.isArray(json?.parties) ? json.parties : Array.isArray(json) ? json : [];
    const dates = list.map(e => (e.date || e.start || e.startsAt || '').slice(0,10)).filter(Boolean).sort();
    const start = dates[0] ? new Date(dates[0] + 'T00:00:00Z') : new Date();
    // move to Monday
    const dow = start.getUTCDay();                // 0=Sun..6=Sat
    const deltaToMon = (dow === 0 ? -6 : 1 - dow);
    const mon = new Date(start); 
    mon.setUTCDate(start.getUTCDate() + deltaToMon);
    return Array.from({length:6}, (_,i)=>{ 
      const d=new Date(mon); 
      d.setUTCDate(mon.getUTCDate()+i); 
      return fmt(d); 
    });
  } catch {
    // fallback: this week Mon–Sat
    const today = new Date();
    const dow = today.getUTCDay();
    const deltaToMon = (dow === 0 ? -6 : 1 - dow);
    const mon = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()+deltaToMon));
    return Array.from({length:6}, (_,i)=>{ 
      const d=new Date(mon); 
      d.setUTCDate(mon.getUTCDate()+i); 
      return fmt(d); 
    });
  }
}

// ---------- UI pieces ----------
function pill(label, date, target){
  const b = document.createElement('button');
  b.className = 'day-pill';
  b.textContent = label;
  b.dataset.date = date;
  b.addEventListener('click', () => { 
    location.hash = `#/${target}/${date}`; 
  });
  return b;
}

function section(title, pillsEl){
  const wrap = document.createElement('section');
  wrap.className = 'home-section';
  wrap.dataset.section = title.toLowerCase();
  wrap.innerHTML = `<h2>${title}</h2>`;
  wrap.appendChild(pillsEl);
  return wrap;
}

function dayRow(){
  const row = document.createElement('div');
  row.className = 'day-pills';
  return row;
}

function channels(){
  const grid = document.createElement('div');
  grid.className = 'channels-grid';
  const items = [
    ['Map', '#/map'],
    ['My calendar', '#/calendar'],
    ['Invites', '#/invites'],
    ['Contacts', '#/contacts'],
    ['Me', '#/me'],
    ['Settings', '#/settings'],
  ];
  for (const [label, route] of items) {
    const b = document.createElement('button');
    b.className = 'channel-btn';
    b.dataset.channel = label.toLowerCase().replace(/\s+/g, '-');
    b.innerHTML = `
      <span class="channel-icon">${getChannelIcon(label)}</span>
      <span class="channel-label">${label}</span>
    `;
    b.addEventListener('click', () => { 
      location.hash = route; 
    });
    grid.appendChild(b);
  }
  return grid;
}

function getChannelIcon(label) {
  const icons = {
    'Map': '📍',
    'My calendar': '📅',
    'Invites': '✉️',
    'Contacts': '👥',
    'Me': '👤',
    'Settings': '⚙️'
  };
  return icons[label] || '📋';
}

// ---------- panels ----------
async function mountHome(){
  resetToHome();
  const stack = ensureStack();
  const home = document.createElement('section');
  home.className = 'panel panel--home panel--active';
  const shell = document.createElement('div');
  shell.className = 'home-panel';
  home.appendChild(shell);
  stack.appendChild(home);

  // Add channels first
  shell.appendChild(channels());

  const days = await getWeek(); // Mon..Sat ISO
  const labels = ['Mon','Tue','Wed','Thu','Fri','Sat'];

  // Parties section (buttons route to #/parties/YYYY-MM-DD)
  const pr = dayRow();
  days.forEach((iso,i) => {
    const day = iso.slice(8,10).replace(/^0/, '');
    pr.appendChild(pill(`${labels[i]} ${day}`, iso, 'parties'));
  });
  shell.appendChild(section('Parties', pr));

  // Map section (buttons route to #/map/YYYY-MM-DD)
  const mr = dayRow();
  days.forEach((iso,i) => {
    const day = iso.slice(8,10).replace(/^0/, '');
    mr.appendChild(pill(`${labels[i]} ${day}`, iso, 'map'));
  });
  shell.appendChild(section('Map', mr));
}

async function mountParties(dateISO){
  const html = `
    <header class="panel-header">
      <button class="btn-back" data-action="back" aria-label="Back">← Back</button>
      <h1>Parties — ${dateISO}</h1>
    </header>
    <div class="panel-body">
      <div class="cards-grid" id="cards"></div>
    </div>`;
  const panel = pushPanel(html);

  panel.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="back"]')) { 
      e.preventDefault(); 
      history.back(); 
    }
  });

  // fetch & list events
  try {
    const res = await fetch('/api/parties?conference=gamescom2025', { headers:{accept:'application/json'} });
    const json = await res.json();
    const list = Array.isArray(json?.data) ? json.data : Array.isArray(json?.parties) ? json.parties : Array.isArray(json) ? json : [];
    const sameDay = list.filter(e => (e.date || e.start || e.startsAt || '').slice(0,10) === dateISO);
    const cards = qs('#cards', panel);
    
    if (!sameDay.length) {
      cards.innerHTML = '<p class="empty-state">No parties for this day (yet).</p>';
    } else {
      // Sort by time
      sameDay.sort((a, b) => {
        const timeA = a.time || a.start || a.startsAt || '';
        const timeB = b.time || b.start || b.startsAt || '';
        return timeA.localeCompare(timeB);
      });
      
      for (const evt of sameDay) {
        const c = document.createElement('article');
        c.className = 'party-card vcard';
        c.innerHTML = `
          <div class="card-header">
            <h3 class="vcard__title">${evt.title || evt.name || 'Party'}</h3>
            ${evt.time ? `<span class="card-time">${evt.time}</span>` : ''}
          </div>
          ${evt.venue || evt.location?.name ? `<div class="vcard__meta card-venue">📍 ${evt.venue || evt.location?.name}</div>` : ''}
          ${evt.description ? `<p class="card-description">${evt.description}</p>` : ''}
          ${evt.tags ? `<div class="card-tags">${evt.tags.split(',').map(t => `<span class="tag">${t.trim()}</span>`).join('')}</div>` : ''}
        `;
        cards.appendChild(c);
      }
    }
  } catch(err) {
    console.warn('[router] Failed to load parties:', err);
    qs('#cards', panel).innerHTML = '<p class="empty-state">Failed to load parties.</p>';
  }
}

async function mountMap(dateISO){
  const html = `
    <header class="panel-header">
      <button class="btn-back" data-action="back" aria-label="Back">← Back</button>
      <h1>Map — ${dateISO}</h1>
    </header>
    <div class="panel-body">
      <div id="map" style="height: 60vh; border-radius: var(--r-lg, 12px); width: 100%;"></div>
    </div>`;
  const panel = pushPanel(html);
  
  panel.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="back"]')) { 
      e.preventDefault(); 
      history.back(); 
    }
  });

  // Ensure Maps API is loaded
  if (!window.google?.maps) {
    const key = qs('meta[name="maps-key"]')?.content;
    if (key && !qs('script[src*="maps.googleapis.com"]')) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&callback=mapsReady`;
        script.async = true;
        script.defer = true;
        window.mapsReady = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
  }

  if (!window.google?.maps) {
    qs('#map', panel).innerHTML = '<p class="empty-state">Map not available.</p>';
    return;
  }

  // init map
  const mapEl = qs('#map', panel);
  const center = { lat: 50.9375, lng: 6.9603 }; // Cologne
  const map = new google.maps.Map(mapEl, {
    center, 
    zoom: 13,
    mapTypeControl: false,
    streetViewControl: false,
    mapId: window.__MAP_ID || 'DEMO_MAP_ID'
  });

  // fetch markers for date
  try {
    const res = await fetch('/api/parties?conference=gamescom2025', { headers:{accept:'application/json'} });
    const json = await res.json();
    const list = Array.isArray(json?.data) ? json.data : Array.isArray(json?.parties) ? json.parties : Array.isArray(json) ? json : [];
    const sameDay = list.filter(e => (e.date || e.start || e.startsAt || '').slice(0,10) === dateISO);

    const bounds = new google.maps.LatLngBounds();
    let hasMarkers = false;
    
    for (const e of sameDay) {
      const lat = Number(e.lat ?? e.latitude ?? e.location?.lat ?? e.coords?.lat);
      const lng = Number(e.lng ?? e.longitude ?? e.lon ?? e.location?.lng ?? e.coords?.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      
      // Use legacy marker for compatibility
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map,
        title: e.title || e.name || 'Party'
      });
      
      // Add info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div class="map-info">
            <h4>${e.title || e.name || 'Party'}</h4>
            ${e.venue ? `<p>${e.venue}</p>` : ''}
            ${e.time ? `<p>${e.time}</p>` : ''}
          </div>
        `
      });
      
      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
      
      bounds.extend({ lat, lng });
      hasMarkers = true;
    }
    
    if (hasMarkers) {
      map.fitBounds(bounds);
    }
  } catch(err) {
    console.warn('[router] Failed to load map markers:', err);
  }
}

async function mountChannel(channel) {
  const html = `
    <header class="panel-header">
      <button class="btn-back" data-action="back" aria-label="Back">← Back</button>
      <h1>${channel.charAt(0).toUpperCase() + channel.slice(1)}</h1>
    </header>
    <div class="panel-body">
      <p class="placeholder">Channel: ${channel}</p>
    </div>`;
  const panel = pushPanel(html);
  
  panel.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="back"]')) { 
      e.preventDefault(); 
      history.back(); 
    }
  });
}

// ---------- router ----------
async function route(){
  const h = location.hash || '#/home';
  const parts = h.slice(2).split('/'); // ['home'] or ['map','YYYY-MM-DD']
  
  if (parts[0] === 'home') return mountHome();
  if (parts[0] === 'parties' && parts[1]) return mountParties(parts[1]);
  if (parts[0] === 'map' && parts[1]) return mountMap(parts[1]);
  if (parts[0] === 'search') {
    // Search is disabled, redirect to home
    location.hash = '#/home';
    return mountHome();
  }
  
  // Channel routes
  if (['calendar', 'invites', 'contacts', 'me', 'settings'].includes(parts[0])) {
    return mountChannel(parts[0]);
  }
  
  // Default to home for unknown routes or missing params
  location.hash = '#/home';
  return mountHome();
}

// ---------- initialization ----------
function init() {
  // Clear any existing app content
  const oldApp = qs('#app');
  if (oldApp) oldApp.remove();
  
  // Set up routing
  window.addEventListener('hashchange', route);
  
  // Disable search hotkey
  window.addEventListener('keydown', e => {
    if (e.key === '/' || (e.ctrlKey && e.key === 'k')) {
      e.preventDefault();
    }
  }, { capture: true });
  
  // Initial route
  if (!location.hash || location.hash === '#' || location.hash === '#/') {
    location.hash = '#/home';
  }
  route();
  
  console.log('[router-2panel] initialized');
}

// Boot when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}