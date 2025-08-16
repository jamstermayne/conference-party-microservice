/* home-week-ensure.js — ensure exactly Mon–Sat pills for Parties & Map (buttons only) */
const CONF = 'gamescom2025';

function iso10(d){ return d.toISOString().slice(0,10); }
function parseISO10(s){ const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(s||'')); return m?new Date(Date.UTC(+m[1],+m[2]-1,+m[3])):null; }
function eventDate(ev){
  return parseISO10(ev.date || ev.start || ev.startsAt || ev.startTime || (ev.time && ev.time.start));
}
function mondayThroughSaturday(min){
  const dow = (min.getUTCDay()+6)%7; // Mon=0 … Sun=6
  const mon = new Date(Date.UTC(min.getUTCFullYear(),min.getUTCMonth(),min.getUTCDate()-dow));
  return Array.from({length:6},(_,i)=> new Date(Date.UTC(mon.getUTCFullYear(),mon.getUTCMonth(),mon.getUTCDate()+i)));
}
function label(d){
  const names = ['Mon','Tue','Wed','Thu','Fri','Sat'];
  const idx = (d.getUTCDay()+6)%7; // 0..6 with Sun=6
  return `${names[idx]||'Sat'} ${String(d.getUTCDate()).padStart(2,'0')}`;
}

async function fetchParties(){
  try{
    const r = await fetch(`/api/parties?conference=${encodeURIComponent(CONF)}`, {headers:{accept:'application/json'}});
    const j = await r.json().catch(()=>null);
    const list = Array.isArray(j?.data)?j.data : Array.isArray(j?.parties)?j.parties : Array.isArray(j)?j : [];
    return list;
  }catch{ return []; }
}

function renderSection(sectionName, baseRoute, dates){
  const sec = document.querySelector(`.home-section[data-section="${sectionName}"]`);
  if(!sec) return;
  const group = sec.querySelector('.day-pills') || (()=>{ const d=document.createElement('div'); d.className='day-pills'; sec.appendChild(d); return d; })();
  group.textContent = '';
  const activeISO = (new RegExp(`^#\\/${sectionName}\\/([0-9]{4}-[0-9]{2}-[0-9]{2})`)).exec(location.hash)?.[1] || null;

  dates.forEach(d=>{
    const btn = document.createElement('button');
    btn.className = 'day-pill';
    btn.type = 'button';
    const iso = iso10(d);
    btn.textContent = label(d);
    btn.setAttribute('aria-pressed', String(activeISO === iso));
    btn.addEventListener('click', (e)=>{ e.preventDefault(); location.hash = `${baseRoute}${iso}`; }, {passive:false});
    group.appendChild(btn);
  });
}

async function ensureWeek(){
  const data = await fetchParties();
  const dates = data.map(eventDate).filter(Boolean);
  if(!dates.length) return; // nothing to do
  const min = dates.reduce((a,b)=> a<b?a:b);
  const week = mondayThroughSaturday(min);      // always 6 pills

  renderSection('parties', '#/parties/', week);
  renderSection('map', '#/map/', week);
}

function syncPressed(){
  const update = (name, base) => {
    const sec = document.querySelector(`.home-section[data-section="${name}"]`);
    if(!sec) return;
    const activeISO = (new RegExp(`^#\\/${name}\\/([0-9]{4}-[0-9]{2}-[0-9]{2})`)).exec(location.hash)?.[1] || null;
    sec.querySelectorAll('.day-pill').forEach(b=>{
      const m = /(\d{2})$/.exec(b.textContent||''); // visual only; aria-pressed stays via click too
      b.setAttribute('aria-pressed', String(b.dataset.iso === activeISO));
    });
  };
  update('parties', '#/parties/');
  update('map', '#/map/');
}

window.addEventListener('hashchange', ()=>{ if(location.hash.startsWith('#/home')||location.hash.startsWith('#/map')||location.hash.startsWith('#/parties')) syncPressed(); }, {passive:true});
document.addEventListener('DOMContentLoaded', ()=>{ if(location.hash.startsWith('#/home')) ensureWeek(); }, {once:true, passive:true});