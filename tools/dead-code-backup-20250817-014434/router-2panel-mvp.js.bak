/* 2-Panel MVP Router - All Dependencies Inline */

// DOM utilities
const $ = (sel,root=document)=>root.querySelector(sel);
const $$ = (sel,root=document)=>Array.from(root.querySelectorAll(sel));
const html = (s)=>{ const t=document.createElement('template'); t.innerHTML=s.trim(); return t.content.firstElementChild; };
function delegate(root, type, sel, fn, opts){ root.addEventListener(type, e=>{ const m=e.target.closest(sel); if(m && root.contains(m)) fn(e,m); }, opts); }
function mountOverlay(node){
  node.classList.add('panel'); document.body.appendChild(node);
  requestAnimationFrame(()=>node.classList.add('panel--active'));
  return node;
}
function unmountOverlay(node){ node?.classList.remove('panel--active'); setTimeout(()=>node?.remove(), 220); }

// API utilities
const API_BASE = 'https://us-central1-conference-party-app.cloudfunctions.net';
async function getJSON(url){
  const res = await fetch(url, { headers:{ 'accept':'application/json' }});
  if(!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.json().catch(()=> ({}));
}
async function fetchParties(){
  const raw = await getJSON(`${API_BASE}/api/parties?conference=gamescom2025`);
  return Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : raw?.parties || [];
}

// Calendar utilities
function pad(n){ return String(n).padStart(2,'0'); }
function toICS(dt){ const d=new Date(dt); const y=d.getUTCFullYear(), m=pad(d.getUTCMonth()+1), day=pad(d.getUTCDate()), h=pad(d.getUTCHours()), min=pad(d.getUTCMinutes()); return `${y}${m}${day}T${h}${min}00Z`; }
function openICS(ev){
  if(ev.id){ window.open(`/api/calendar/ics?partyId=${encodeURIComponent(ev.id)}`, '_blank'); return; }
  const uid = crypto.randomUUID();
  const dtstart = toICS(ev.start||ev.date), dtend = toICS(ev.end||ev.start||ev.date);
  const ics = [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//ConferenceParty//EN','BEGIN:VEVENT',
    `UID:${uid}`, `DTSTART:${dtstart}`, `DTEND:${dtend}`, `SUMMARY:${ev.title||'Party'}`,
    `LOCATION:${ev.venue||''}`, `DESCRIPTION:${(ev.desc||'').replace(/\n/g,'\\n')}`, 'END:VEVENT','END:VCALENDAR'
  ].join('\r\n');
  const blob = new Blob([ics],{type:'text/calendar'}); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=`${(ev.title||'event')}.ics`; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
}
function openGoogle(ev){
  const params = new URLSearchParams({
    action:'TEMPLATE',
    text: ev.title||'Party',
    dates: `${toICS(ev.start||ev.date)}/${toICS(ev.end||ev.start||ev.date)}`,
    details: ev.desc||'',
    location: ev.venue||''
  });
  window.open(`https://calendar.google.com/calendar/render?${params}`, '_blank');
}

// Card component
function cardFor(ev){
  const div = document.createElement('div'); div.className='card';
  div.innerHTML = `
    <h3 class="card__title">${ev.title||'Party'}</h3>
    <div class="card__meta">${ev.date||''} ${ev.time||''} — ${ev.venue||''}</div>
    <div class="card__actions">
      <button class="btn btn--primary" data-action="cal-ics">Add to Calendar</button>
      <button class="btn btn--ghost" data-action="cal-google">Google</button>
    </div>`;
  div.addEventListener('click', (e)=>{
    const a=e.target.closest('[data-action]'); if(!a) return;
    if(a.dataset.action==='cal-ics') openICS(ev);
    if(a.dataset.action==='cal-google') openGoogle(ev);
  }, { passive:true });
  return div;
}

// State management
const state = { week: null }; // {days:[{iso,label}], selected:iso}

function startOfWeekMonday(d){
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay(); // 0..6
  const diff = (day+6)%7; // days since Monday
  x.setUTCDate(x.getUTCDate()-diff);
  return x;
}

function fmtDayLabel(iso){
  const d = new Date(iso+'T00:00:00Z');
  return d.toLocaleDateString(undefined,{ weekday:'short', day:'2-digit' }).replace(',', '');
}

async function computeWeek(){
  if(state.week) return state.week;
  const items = await fetchParties();
  const dates = items.map(e=> (e.date||e.start||'').slice(0,10)).filter(Boolean).sort();
  const base = dates[0] ? new Date(dates[0]+'T00:00:00Z') : new Date();
  const mon = startOfWeekMonday(base);
  const days = Array.from({length:6},(_,i)=>{ const d=new Date(mon); d.setUTCDate(mon.getUTCDate()+i); const iso=d.toISOString().slice(0,10); return { iso, label: fmtDayLabel(iso) }; });
  state.week = { days, selected: days[0].iso };
  return state.week;
}

// Home rendering
function ensureHome(){
  const root = $('.home-wrap') || document.body.appendChild(html(`<main class="home-wrap"></main>`));
  if(!$('.home-section[data-section="parties"]', root)){
    root.appendChild(html(`<section class="home-section" data-section="parties"><h2>Parties</h2><div class="day-pills" data-target="parties"></div></section>`));
  }
  if(!$('.home-section[data-section="map"]', root)){
    root.appendChild(html(`<section class="home-section" data-section="map"><h2>Map</h2><div class="day-pills" data-target="map"></div></section>`));
  }
  if(!$('.channels-grid', root)){
    const grid = html(`<section class="home-section"><div class="channels-grid">
      <a class="channel-btn" data-route="#/map"><div>📍</div><strong>Map</strong></a>
      <a class="channel-btn" data-route="#/calendar"><div>📅</div><strong>My calendar</strong></a>
      <a class="channel-btn" data-route="#/invites"><div>✉️</div><strong>Invites</strong></a>
      <a class="channel-btn" data-route="#/contacts"><div>👥</div><strong>Contacts</strong></a>
      <a class="channel-btn" data-route="#/me"><div>👤</div><strong>Me</strong></a>
      <a class="channel-btn" data-route="#/settings"><div>⚙️</div><strong>Settings</strong></a>
    </div></section>`);
    root.prepend(grid);
  }
  return root;
}

async function renderHome(){
  const root = ensureHome();
  const { days, selected } = await computeWeek();
  for(const tgt of ['parties','map']){
    const wrap = $(`.day-pills[data-target="${tgt}"]`, root);
    wrap.innerHTML = days.map(d=> `<button class="day-pill" data-target="${tgt}" data-date="${d.iso}" aria-pressed="${d.iso===selected}">${d.label}</button>`).join('');
  }
}

// Panel utilities
function headerHTML(title){
  return `<header class="panel__header"><button class="panel__back" data-action="back">← Back</button><h1 class="panel__title">${title}</h1></header>`;
}

function mountPanel(title){
  const panel = html(`<section class="panel" role="dialog" aria-modal="true">${headerHTML(title)}<div class="panel__body"></div></section>`);
  mountOverlay(panel);
  delegate(panel,'click','[data-action="back"]',()=>unmountOverlay(panel));
  return panel.querySelector('.panel__body');
}

// Panel implementations
async function mountParties(dateISO){
  const body = mountPanel(`Parties — ${fmtDayLabel(dateISO)}`);
  const list = html(`<div class="card-list" />`); body.appendChild(list);
  const all = await fetchParties();
  const todays = all.filter(e => (e.date||e.start||'').slice(0,10) === dateISO);
  if(!todays.length){ list.appendChild(html(`<div class="card"><p>No parties for ${fmtDayLabel(dateISO)}.</p></div>`)); return; }
  for(const ev of todays){ list.appendChild(cardFor(ev)); }
}

async function mountMap(dateISO){
  const body = mountPanel(`Map — ${fmtDayLabel(dateISO)}`);
  
  // Map box
  const box = html(`<div id="map" style="height:60vh;border-radius:16px;overflow:hidden;"></div>`);
  body.appendChild(box);

  // Wait for Maps API
  const checkMaps = () => window.google?.maps?.Map;
  let maps = checkMaps();
  if (!maps) {
    await new Promise(resolve => {
      const interval = setInterval(() => {
        if (checkMaps()) {
          clearInterval(interval);
          resolve(null);
        }
      }, 100);
    });
    maps = window.google.maps;
  }

  // init map
  const center = { lat: 50.9375, lng: 6.9603 };
  const map = new maps.Map(box, { center, zoom: 12, mapId: 'DEMO_MAP_ID' });

  // markers
  const all = await fetchParties();
  const todays = all.map(e=>{
    const lat = Number(e.lat ?? e.latitude ?? e.location?.lat ?? e.coords?.lat);
    const lng = Number(e.lng ?? e.longitude ?? e.location?.lng ?? e.coords?.lng);
    return { ...e, ok: Number.isFinite(lat)&&Number.isFinite(lng), lat, lng, date:(e.date||e.start||'').slice(0,10) };
  }).filter(x=>x.ok && x.date===dateISO);
  
  const bounds = new maps.LatLngBounds();
  for(const p of todays){
    if(maps.marker?.AdvancedMarkerElement) {
      const pin = document.createElement('div'); 
      pin.textContent='●'; 
      pin.style.fontSize='18px'; 
      pin.style.color='#6b7bff';
      new maps.marker.AdvancedMarkerElement({ map, position:{lat:p.lat,lng:p.lng}, content:pin, title:p.title||'Party' });
    }
    bounds.extend({lat:p.lat,lng:p.lng});
  }
  if(todays.length) map.fitBounds(bounds, 48);
}

// Stub panels
function mountStub(title, message){
  const b = mountPanel(title);
  b.innerHTML = `<p>${message}</p>`;
}

// Router
function go(hash){
  if(!hash || hash==='#' || hash==='#/'){ location.hash='#/home'; return; }
  const parts = hash.slice(2).split('/'); // e.g. ['parties','YYYY-MM-DD']
  const [route, param] = parts;
  if(route==='home'){ renderHome(); return; }
  if(route==='parties'){ mountParties(param || state.week?.selected || new Date().toISOString().slice(0,10)); return; }
  if(route==='map'){ mountMap(param || state.week?.selected || new Date().toISOString().slice(0,10)); return; }
  if(route==='calendar'){ mountStub('My calendar', 'Calendar view coming soon.'); return; }
  if(route==='invites'){ mountStub('Invites', 'Invitations coming soon.'); return; }
  if(route==='contacts'){ mountStub('Contacts', 'Contacts coming soon.'); return; }
  if(route==='me'){ mountStub('Me', 'Profile coming soon.'); return; }
  if(route==='settings'){ mountStub('Settings', 'Settings coming soon.'); return; }
}

// Event listeners
window.addEventListener('hashchange', ()=>go(location.hash));
document.addEventListener('DOMContentLoaded', ()=>{ if(!location.hash) location.hash='#/home'; go(location.hash); });

// Home interactions (channel taps + home pills)
document.addEventListener('click', (e)=>{
  const a=e.target.closest('[data-route]'); if(a){ e.preventDefault(); location.hash = a.dataset.route; }
  const p=e.target.closest('.day-pill[data-target][data-date]'); if(p && p.closest('.home-wrap')){
    const iso=p.dataset.date, tgt=p.dataset.target;
    if(tgt==='parties') location.hash = `#/parties/${iso}`;
    if(tgt==='map')     location.hash = `#/map/${iso}`;
  }
},{ passive:true });