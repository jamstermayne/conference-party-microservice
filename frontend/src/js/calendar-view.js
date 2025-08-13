import Events from '/assets/js/events.js';

const KEY='calendar.selectedDay'; // Store key (string date)

function el(t,c,h){ const n=document.createElement(t); if(c) n.className=c; if(h!=null) n.innerHTML=h; return n; }
function fmt(d){ return d.toLocaleDateString(undefined,{weekday:'short', month:'short', day:'numeric'}); }
function ymd(d){ return d.toISOString().slice(0,10); }

function weekDays(start=new Date()){
  const s=new Date(start); s.setHours(12,0,0,0); // noon avoids DST edges
  // start week on Mon
  const day=(s.getDay()+6)%7; s.setDate(s.getDate()-day);
  return Array.from({length:7},(_,i)=>{const d=new Date(s); d.setDate(s.getDate()+i); return d;});
}

function card(ev){
  const c=el('article','card');
  c.innerHTML=`
    <div class="card-header">
      <div class="card-title">${ev.title||'Untitled'}</div>
      <div class="badges"><span class="badge">${ev.date||''}</span></div>
    </div>
    <div class="card-body">
      <div class="card-row">📍 ${ev.venue||'TBA'}</div>
      <div class="card-row">🕒 ${ev.time||''}</div>
    </div>
    <div class="card-actions">
      <button class="btn btn-primary" data-action="add">Save & Sync</button>
      <a class="btn btn-outline" href="${icsHref(ev)}" download="${safe(ev.title)}.ics">Download .ics</a>
    </div>
  `;
  c.querySelector('[data-action="add"]').addEventListener('click', ()=> {
    Events.emit?.('calendar:add',{event:ev});
  }, {passive:true});
  return c;
}

function safe(s='event'){ return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
function icsHref(ev){
  const dt = new Date(); // placeholder datetime; a real backend can provide exact ISO
  const uid = crypto?.randomUUID?.() || Date.now();
  const ics = [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//velocity.ai//calendar//EN',
    'BEGIN:VEVENT',
    `UID:${uid}@velocity.ai`,
    `DTSTAMP:${dt.toISOString().replace(/[-:]/g,'').split('.')[0]}Z`,
    `SUMMARY:${(ev.title||'Event').replace(/\n/g,' ')}`,
    `LOCATION:${(ev.venue||'TBA').replace(/\n/g,' ')}`,
    'END:VEVENT','END:VCALENDAR'
  ].join('\r\n');
  return 'data:text/calendar;charset=utf-8,'+encodeURIComponent(ics);
}

async function fetchByDay(_day){
  // placeholder: get all and filter client-side; backend route can be added later
  const resp=await fetch('/api/parties?conference=gamescom2025').catch(()=>null);
  if(!resp||!resp.ok) return [];
  const json=await resp.json().catch(()=>({data:[]}));
  const items=json.data||[];
  if(!_day) return items;
  return items.filter(e=> (e.date||'').toLowerCase().includes(_day.toLowerCase()));
}

export async function renderCalendar(root){
  const wrap = el('section','section-card');
  wrap.appendChild(el('div','left-accent'));
  const body = el('div','section-body');

  const header = el('div','header-row');
  header.innerHTML = `
    <div class="header-title">Calendar</div>
    <div class="header-meta muted">Select a day • Add events to your calendar</div>
  `;
  body.appendChild(header);

  // Week strip
  const strip = el('div','chips'); strip.setAttribute('role','tablist'); strip.setAttribute('aria-label','Week');
  const days = weekDays();
  const saved = localStorage.getItem(KEY);
  let selected = saved ? new Date(saved) : days[0];

  days.forEach(d=>{
    const b=el('button','chip'+(ymd(d)===ymd(selected)?' active':''), fmt(d));
    b.setAttribute('role','tab');
    b.addEventListener('click', async ()=>{
      selected=d;
      localStorage.setItem(KEY, ymd(selected));
      strip.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      await renderList();
    }, {passive:true});
    strip.appendChild(b);
  });
  body.appendChild(strip);

  const grid = el('div','calendar-grid');
  body.appendChild(grid);

  wrap.appendChild(body);
  root.appendChild(wrap);

  // initial
  await renderList();

  async function renderList(){
    grid.innerHTML='';
    for(let i=0;i<4;i++){ const s=el('div','skeleton'); s.style.height='140px'; grid.appendChild(s); }
    const label = selected.toLocaleDateString(undefined,{weekday:'short'});
    const items = await fetchByDay(label);
    grid.innerHTML='';
    if(!items.length){
      const empty=el('div','muted','No events for this day yet.');
      empty.style.padding='24px'; grid.appendChild(empty); return;
    }
    items.slice(0,8).forEach(ev=>grid.appendChild(card(ev)));
  }
}