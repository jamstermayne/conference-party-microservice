/* home-parties-pills-lite.js — CSP-safe, buttons only (no <a>) */
/* globals google */
const CONF = 'gamescom2025';

function parseISO10(s){ if(!s) return null; const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(s)); if(!m) return null;
  return new Date(Date.UTC(+m[1], +m[2]-1, +m[3])); }
function iso10(d){ return d.toISOString().slice(0,10); }
function getEventDate(ev){
  return parseISO10(ev.date || ev.start || ev.startsAt || ev.startTime || (ev.time && ev.time.start));
}
function mondayToSaturdayAround(minDate){
  // Monday=0 .. Saturday=5 in this scheme
  const dow = (minDate.getUTCDay()+6)%7;
  const start = new Date(Date.UTC(minDate.getUTCFullYear(), minDate.getUTCMonth(), minDate.getUTCDate()-dow));
  return Array.from({length:6},(_,i)=> new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth(),start.getUTCDate()+i)));
}
function dayLabel(d){
  return ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][d.getUTCDay()===0?7:d.getUTCDay()-1] + ' ' + String(d.getUTCDate()).padStart(2,' ');
}
function ensurePartiesSection(){
  let sec = document.querySelector('.home-section[data-section="parties"]');
  if (sec) return sec;
  const home = document.querySelector('.home-panel') || document.body;
  const wrap = document.createElement('section');
  wrap.className = 'home-section';
  wrap.dataset.section = 'parties';
  wrap.innerHTML = `
    <h2 class="home-h2">Parties</h2>
    <div class="day-pills" role="group" aria-label="Pick a day for Parties"></div>
  `;
  // Ensure Parties appears before Map if Map section exists
  const mapSec = document.querySelector('.home-section[data-section="map"]');
  if (home.contains(mapSec)) home.insertBefore(wrap, mapSec); else home.appendChild(wrap);
  return wrap;
}
function renderButtons(dates){
  const sec = ensurePartiesSection();
  const group = sec.querySelector('.day-pills');
  group.textContent = '';
  const todayHash = location.hash;
  const activeISO = (/#\/parties\/(\d{4}-\d{2}-\d{2})/.exec(todayHash)?.[1]) || null;

  dates.forEach(d=>{
    const btn = document.createElement('button');
    btn.className = 'day-pill';
    btn.type = 'button';
    const iso = iso10(d);
    btn.textContent = dayLabel(d);
    btn.setAttribute('aria-pressed', String(activeISO === iso));
    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      location.hash = `#/parties/${iso}`;
    }, {passive:false});
    group.appendChild(btn);
  });
}
async function fetchParties(){
  const res = await fetch(`/api/parties?conference=${encodeURIComponent(CONF)}`, {headers:{accept:'application/json'}});
  let json; try { json = await res.json(); } catch { json = null; }
  const list = Array.isArray(json?.data) ? json.data : Array.isArray(json?.parties) ? json.parties : Array.isArray(json) ? json : [];
  return list;
}
async function init(){
  if (!location.hash || location.hash === '#') location.hash = '#/home';
  const list = await fetchParties();
  const dates = list.map(getEventDate).filter(Boolean);
  if (!dates.length) return; // quietly bail; no pills when no data
  const min = dates.reduce((a,b)=> a<b?a:b);
  renderButtons(mondayToSaturdayAround(min));
}
function onHash(){
  if (location.hash.startsWith('#/home')) init();
}
window.addEventListener('hashchange', onHash, {passive:true});
document.addEventListener('DOMContentLoaded', onHash, {once:true, passive:true});