/**
 * Calendar View — 30-minute grid
 * Build: b017
 */
import Events from '/assets/js/events.js?v=b011';

const START_MIN = 8*60;   // 08:00
const END_MIN   = 24*60;  // 24:00
const STEP      = 30;     // 30-min increments
const ROW_H     = 40;     // 40px per step (80px/hr) - matches CSS var(--slot-height)

function mm(n){ return String(n).padStart(2,'0'); }
function labelFor(mins){
  const h = Math.floor(mins/60), m = mins%60;
  return `${h}:${mm(m)}`;
}
function minutesBetween(a,b){ return b-a; }

function ensureCss(){
  if (![...document.styleSheets].some(s => (s.href||'').includes('/assets/css/calendar.css'))) {
    const l=document.createElement('link');
    l.rel='stylesheet';
    l.href='/assets/css/calendar.css?v=b017';
    document.head.appendChild(l);
  }
}

/** Convert an event with ISO datetimes to {top, height} in px */
function place(event){
  const start = new Date(event.start).getHours()*60 + new Date(event.start).getMinutes();
  const end   = new Date(event.end).getHours()*60 + new Date(event.end).getMinutes();
  const top   = Math.max(0, (start-START_MIN)/STEP) * ROW_H;
  const h     = Math.max(ROW_H/2, (minutesBetween(start,end)/STEP) * ROW_H);
  return { top, height: h };
}

/** Minimal sample mapping when events feed is not wired */
function normalize(parties){
  return parties.map(p => ({
    id: p.id,
    title: p.title,
    venue: p.venue || p.location || 'Venue TBA',
    start: p.start || p.dateStart || new Date().toISOString(),
    end:   p.end   || p.dateEnd   || new Date(Date.now()+60*60*1000).toISOString()
  }));
}

export async function renderCalendar(mount){
  ensureCss();
  const root = mount || document.getElementById('main') || document.getElementById('app');
  if(!root) return;

  // SOURCE: prefer a preloaded parties list via a custom event; fallback to local demo
  // Listen once for a parties payload (if Events/parties already emitted elsewhere)
  let parties = [];
  const got = new Promise(res=>{
    const handler = (list)=>{ parties=list; res(); Events.off?.('parties:data', handler); };
    Events.on?.('parties:data', handler);
    setTimeout(res,120); // continue if nothing arrives
  });
  await got;

  if (!parties || !parties.length){
    // tiny demo data to prove visuals
    const d = new Date(); d.setHours(9,0,0,0);
    parties = [
      {id:'cal-1', title:'MeetToMatch', venue:'Koelnmesse Confex',
       start: new Date(d).toISOString(),
       end:   new Date(d.getTime()+90*60*1000).toISOString()},
      {id:'cal-2', title:'Marriott Mixer', venue:'Marriott Hotel',
       start: new Date(d.getTime()+11*60*1000*5).toISOString(), // ~ 10:55
       end:   new Date(d.getTime()+150*60*1000).toISOString()}
    ];
  }

  const items = normalize(parties);

  // Build grid
  const ticks = [];
  for(let m=START_MIN; m<END_MIN; m+=STEP){
    const half = m%60===30;
    // label once per hour line (at :00)
    ticks.push(`<div class="tick"><span class="lbl">${half? '' : labelFor(m)}</span></div>`);
  }

  const rows = new Array(Math.floor((END_MIN-START_MIN)/STEP)).fill(0).map(() => `<div class="slot-row"></div>`).join('');

  root.innerHTML = `
    <div class="calendar-wrap">
      <div class="calendar-header">
        <div class="calendar-week">
          <div class="calendar-chip is-today">Today</div>
          <div class="calendar-chip">Tomorrow</div>
          <div class="calendar-chip">This week</div>
        </div>
      </div>

      <div class="calendar-shell">
        <div class="calendar-grid">
          <div class="time-col">${ticks.join('')}</div>
          <div class="day-col">${rows}</div>
        </div>
      </div>
    </div>
  `;

  // Paint events
  const dayCol = root.querySelector('.day-col');
  items.forEach(ev=>{
    const { top, height } = place(ev);
    const card = document.createElement('div');
    card.className='cal-card';
    card.style.top  = `${8 + top}px`;      // +8 to offset header
    card.style.height = `${height}px`;
    card.innerHTML = `
      <h4>${ev.title}</h4>
      <div class="cal-meta">
        <span>📍 ${ev.venue}</span>
        <span>🕒 ${new Date(ev.start).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
         – ${new Date(ev.end).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
      </div>
      <div class="cal-actions">
        <button class="btn primary">Save & Sync</button>
        <button class="btn">Details</button>
      </div>
    `;
    dayCol.appendChild(card);
  });
}

export default { renderCalendar };