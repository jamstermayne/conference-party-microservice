/* home-week-inline.js — enforce Mon–Sat pills (buttons only) for Parties & Map */
/* globals google */
const CONF = 'gamescom2025';

const iso10 = d => d.toISOString().slice(0,10);
const pISO  = s => { const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(s||'')); return m?new Date(Date.UTC(+m[1],+m[2]-1,+m[3])):null; };
const eDate = e => pISO(e.date||e.start||e.startsAt||e.startTime||(e.time&&e.time.start));

function monToSat(start){
  const dow = (start.getUTCDay()+6)%7; // Mon=0..Sun=6
  const mon = new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth(),start.getUTCDate()-dow));
  return Array.from({length:6},(_,i)=> new Date(Date.UTC(mon.getUTCFullYear(),mon.getUTCMonth(),mon.getUTCDate()+i)));
}
function label(d){
  const name=['Mon','Tue','Wed','Thu','Fri','Sat'][(d.getUTCDay()+6)%7] || 'Sat';
  return `${name} ${String(d.getUTCDate()).padStart(2,'0')}`;
}

async function pull(){
  try{
    const r = await fetch(`/api/parties?conference=${encodeURIComponent(CONF)}`, { headers:{accept:'application/json'} });
    const j = await r.json().catch(()=>null);
    return Array.isArray(j?.data)?j.data : Array.isArray(j?.parties)?j.parties : Array.isArray(j)?j : [];
  }catch{ return []; }
}

function ensureSection(which){
  let sec = document.querySelector(`.home-section[data-section="${which}"]`);
  if(!sec){
    // if home skeleton missing, create minimal one
    const host = document.querySelector('#app') || document.body;
    const wrap = document.querySelector('.home-panel') || Object.assign(document.createElement('section'),{className:'home-panel'});
    if(!wrap.parentNode) host.appendChild(wrap);
    sec = document.createElement('section');
    sec.className = 'home-section';
    sec.dataset.section = which;
    const h2 = document.createElement('h2'); h2.textContent = which === 'parties' ? 'Parties' : 'Map';
    const pills = document.createElement('div'); pills.className = 'day-pills';
    sec.append(h2,pills);
    wrap.appendChild(sec);
  }
  return sec.querySelector('.day-pills');
}

function render(where, baseRoute, week){
  const group = ensureSection(where);
  group.textContent = '';
  const activeISO = (/^#\/(?:parties|map)\/(\d{4}-\d{2}-\d{2})/.exec(location.hash)?.[1]) || null;

  week.forEach(d=>{
    const iso = iso10(d);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'day-pill';
    btn.textContent = label(d);
    btn.dataset.iso = iso;
    btn.setAttribute('aria-pressed', String(activeISO === iso));
    btn.addEventListener('click', e => { e.preventDefault(); location.hash = `${baseRoute}${iso}`; }, {passive:false});
    group.appendChild(btn);
  });
}

async function ensureWeek(){
  // only care on /#home
  if(!location.hash.startsWith('#/home')) return;
  const list = await pull();
  const dates = list.map(eDate).filter(Boolean);
  if(!dates.length) return;
  const min = dates.reduce((a,b)=> a<b?a:b);
  const week = monToSat(min);
  render('parties', '#/parties/', week);
  render('map',     '#/map/',     week);
}

addEventListener('hashchange', () => { if(location.hash.startsWith('#/home')) ensureWeek(); }, {passive:true});
document.addEventListener('DOMContentLoaded', ensureWeek, {once:true, passive:true});