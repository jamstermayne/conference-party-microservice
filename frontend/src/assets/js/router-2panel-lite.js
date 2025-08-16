/* globals google */
import { $, $$, html, delegate, mountOverlay, unmountOverlay } from './dom-lite.js';
import { fetchParties } from './api-lite.js';
import { cardFor } from './cards-lite.js';
import { renderInvites } from './invites-lite.js';

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

function headerHTML(title){
  return `<header class="panel__header"><button class="panel__back" data-action="back">← Back</button><h1 class="panel__title">${title}</h1></header>`;
}

function mountPanel(title){
  const panel = html(`<section class="panel" role="dialog" aria-modal="true">${headerHTML(title)}<div class="panel__body"></div></section>`);
  mountOverlay(panel);
  delegate(panel,'click','[data-action="back"]',()=>unmountOverlay(panel));
  return panel.querySelector('.panel__body');
}

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
  // Subnav pills inside panel
  const sub = html(`<div class="panel__subnav"><div class="day-pills"></div></div>`);
  const { days } = await computeWeek();
  sub.querySelector('.day-pills').innerHTML = days.map(d => `<button class="day-pill" data-target="map" data-date="${d.iso}" aria-pressed="${d.iso===dateISO}">${d.label}</button>`).join('');
  body.appendChild(sub);

  // Map box
  const box = html(`<div id="map" style="height:60vh;border-radius:16px;overflow:hidden;"></div>`);
  body.appendChild(box);

  // init map
  const maps = await (window.whenMapsReady || Promise.resolve(window.google?.maps));
  const center = { lat: 50.9375, lng: 6.9603 };
  const map = new maps.Map(box, { center, zoom: 12, mapId: window.__MAP_ID || 'DEMO_MAP_ID' });

  // markers
  const all = await fetchParties();
  const todays = all.map(e=>{
    const lat = Number(e.lat ?? e.latitude ?? e.location?.lat ?? e.coords?.lat);
    const lng = Number(e.lng ?? e.longitude ?? e.location?.lng ?? e.coords?.lng);
    return { ...e, ok: Number.isFinite(lat)&&Number.isFinite(lng), lat, lng, date:(e.date||e.start||'').slice(0,10) };
  }).filter(x=>x.ok && x.date===dateISO);
  const bounds = new maps.LatLngBounds();
  for(const p of todays){
    const pin = document.createElement('div'); pin.textContent='●'; pin.style.fontSize='18px'; pin.style.color='#6b7bff';
    new maps.marker.AdvancedMarkerElement({ map, position:{lat:p.lat,lng:p.lng}, content:pin, title:p.title||'Party' });
    bounds.extend({lat:p.lat,lng:p.lng});
  }
  if(todays.length) map.fitBounds(bounds, 48);

  // interactions
  body.addEventListener('click', (e)=>{
    const b=e.target.closest('.day-pill[data-date]'); if(!b) return;
    const next=b.dataset.date; location.hash = `#/map/${next}`;
    unmountOverlay(body.closest('.panel'));
  }, { passive:true });
}

/* Router */
function go(hash){
  if(!hash || hash==='#' || hash==='#/'){ location.hash='#/home'; return; }
  const parts = hash.slice(2).split('/'); // e.g. ['parties','YYYY-MM-DD']
  const [route, param] = parts;
  if(route==='home'){ renderHome(); return; }
  if(route==='parties'){ mountParties(param || state.week?.selected); return; }
  if(route==='map'){ mountMap(param || state.week?.selected); return; }
  if(route==='calendar'){ const b=mountPanel('My calendar'); b.innerHTML='<p>Calendar view coming soon.</p>'; return; }
  if(route==='invites'){ const b=mountPanel('Invites'); renderInvites(b); return; }
  if(route==='contacts'){ const b=mountPanel('Contacts'); b.innerHTML='<p>Contacts coming soon.</p>'; return; }
  if(route==='me'){ const b=mountPanel('Me'); b.innerHTML='<p>Profile coming soon.</p>'; return; }
  if(route==='settings'){ const b=mountPanel('Settings'); b.innerHTML='<p>Email & preferences coming soon.</p>'; return; }
}

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