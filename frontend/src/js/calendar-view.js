/**
 * Calendar v2 polish:
 * - Week strip with selected day persisted in Store('calendar.day') (ISO yyyy-mm-dd)
 * - Event list filtered by day (falls back to all if unknown)
 * - Add to Calendar (ICS) per item and Google quick link
 */
import Store from '/js/store.js';
import { toast, emptyState } from '/js/ui-feedback.js';

const API_BASE = (window.__ENV && window.__ENV.API_BASE) || '/api';

function fmtISO(d){ return d.toISOString().slice(0,10); }
function startOfWeek(d){
  const x = new Date(d); const day = (x.getDay()+6)%7; // Mon=0
  x.setDate(x.getDate()-day); x.setHours(0,0,0,0); return x;
}
function addDays(d,n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }
function el(html){ const t=document.createElement('template'); t.innerHTML=html.trim(); return t.content.firstElementChild; }

async function getJSON(url){
  const r=await fetch(url);
  if(!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

function icsFor(item){
  const dtstamp = new Date().toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
  const uid = `${(item.id||item.title||'event').replace(/\s+/g,'-')}@velocity`;
  const dt = (item.dateISO || new Date().toISOString()).replace(/[-:]/g,'').split('.')[0].replace('Z','');
  return [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//velocity.ai//calendar//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,`DTSTAMP:${dtstamp}`,
    `SUMMARY:${(item.title||'Event')}`,
    item.venue?`LOCATION:${item.venue}`:'',
    `DTSTART:${dt}`,
    'END:VEVENT','END:VCALENDAR'
  ].filter(Boolean).join('\r\n');
}
function download(filename, content, type='text/calendar'){
  const blob=new Blob([content],{type});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename;
  document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();},0);
}

function googleLink(item){
  const text = encodeURIComponent(item.title||'Event');
  const dates = new Date().toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
  const details = encodeURIComponent(`${item.venue||''}`);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}/${dates}&details=${details}`;
}

function dayCell(dISO, activeISO){
  const d=new Date(dISO+'T00:00:00Z');
  const wd=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][(d.getDay()+6)%7];
  const num = d.getUTCDate();
  const active = dISO===activeISO?' active':'';
  return el(`<div class="cal-day${active}" data-date="${dISO}" role="button" tabindex="0" aria-pressed="${active?'true':'false'}"><div class="w">${wd}</div><div class="d">${num}</div></div>`);
}

function itemRow(ev){
  const row = el(`
    <div class="cal-item">
      <div class="left">
        <div class="title">${ev.title||'Untitled'}</div>
        <div class="meta">
          ${ev.time?`<span>${ev.time}</span>`:''}
          ${ev.venue?`<span>${ev.venue}</span>`:''}
        </div>
      </div>
      <div class="right">
        <button class="btn btn-secondary btn-small" data-action="google">Google</button>
        <button class="btn btn-primary btn-small" data-action="ics">ICS</button>
      </div>
    </div>
  `);
  row.addEventListener('click',(e)=>{
    const b=e.target.closest('button[data-action]');
    if(!b) return;
    if(b.dataset.action==='ics'){
      const ics = icsFor(ev);
      const fname=(ev.title||'event').replace(/\s+/g,'_')+'.ics';
      download(fname, ics); toast('ICS downloaded','ok');
    } else {
      window.open(googleLink(ev),'_blank','noopener'); toast('Opening Google Calendar…','ok');
    }
  });
  return row;
}

export async function renderCalendar(){
  const root = document.getElementById('route-calendar') || document.getElementById('main');
  if(!root) return;
  root.innerHTML = `
    <div class="calendar-wrap">
      <div class="calendar-head">
        <div class="cal-title">your calendar</div>
        <div class="cal-controls">
          <button class="btn btn-outline btn-small" data-cal="prev">Prev</button>
          <button class="btn btn-outline btn-small" data-cal="today">Today</button>
          <button class="btn btn-outline btn-small" data-cal="next">Next</button>
        </div>
      </div>
      <div class="cal-week" id="cal-week"></div>
      <section class="cal-list" id="cal-list"></section>
    </div>
  `;

  // Determine active week & day
  const today = new Date();
  let activeISO = Store.get('calendar.day') || fmtISO(today);
  let anchor = startOfWeek(new Date(activeISO));

  function paintWeek(){
    const weekEl = document.getElementById('cal-week');
    weekEl.innerHTML='';
    for(let i=0;i<7;i++){
      const iso = fmtISO(addDays(anchor,i));
      const c = dayCell(iso, activeISO);
      c.addEventListener('click', ()=>{ activeISO=iso; Store.patch('calendar.day', activeISO); paintWeek(); paintList(); });
      c.addEventListener('keydown',(e)=>{ if(e.key==='Enter'||e.key===' ') { e.preventDefault(); c.click(); }});
      weekEl.append(c);
    }
  }

  let events = [];
  async function load(){
    try {
      const json = await getJSON(`${API_BASE}/parties?conference=gamescom2025`);
      events = Array.isArray(json?.data)? json.data : [];
    } catch { events = []; }
  }

  function normalizeISO(ev){
    if(ev.dateISO) return ev.dateISO.slice(0,10);
    // heuristic from "Fri Aug 22" → yyyy-mm-dd for 2025 Gamescom
    const m = String(ev.date||'').match(/(\w{3})\s+(\w{3})\s+(\d{1,2})/i);
    if(m){
      const year='2025';
      const d = new Date(`${m[2]} ${m[3]}, ${year} 12:00:00 GMT`);
      if(!isNaN(d)) return fmtISO(d);
    }
    return null;
  }

  function paintList(){
    const list = document.getElementById('cal-list');
    list.innerHTML='';
    if(!events.length){ list.append(emptyState('No events yet.')); return; }
    const filtered = events.filter(ev => normalizeISO(ev)===activeISO);
    const show = filtered.length? filtered : events; // fallback to all if none that day
    show.forEach(ev => list.append(itemRow(ev)));
  }

  // controls
  root.addEventListener('click',(e)=>{
    const b = e.target.closest('button[data-cal]');
    if(!b) return;
    const act = b.dataset.cal;
    if(act==='prev'){ anchor = addDays(anchor,-7); }
    if(act==='next'){ anchor = addDays(anchor, 7); }
    if(act==='today'){ anchor = startOfWeek(new Date()); activeISO = fmtISO(new Date()); Store.patch('calendar.day', activeISO); }
    paintWeek(); paintList();
  });

  await load();
  paintWeek(); paintList();
}

try{
  document.addEventListener('route:change', (e)=>{
    if((e.detail?.name)==='calendar') renderCalendar();
  });
}catch{}