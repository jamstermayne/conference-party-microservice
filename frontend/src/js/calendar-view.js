/**
 * Calendar view (day) — places hero cards by exact start/end times.
 * - 30-minute grid
 * - Calendar grows to fit cards; cards are never shrunk
 */
const BUILD = (window.BUILD || 'b018');

/* idempotent CSS loader */
function ensureCss(href){
  const id = 'cal-css:'+href;
  if (document.getElementById(id)) return;
  const l = document.createElement('link');
  l.id = id; l.rel = 'stylesheet'; l.href = href + (href.includes('?')?'&':'?') + 'v='+BUILD;
  document.head.appendChild(l);
}

/* read a CSS pixel variable from :root */
function cssPx(varName, fallback){
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

/* minutes since 00:00 from "HH:MM" */
function toMin(hhmm){
  const [h,m] = hhmm.split(':').map(x=>parseInt(x,10));
  return (h*60) + (m||0);
}

/* Build demo data if none is provided */
function demoEvents(){
  return [
    { id:'ev-keynote',   title:'Gamescom Keynote',  where:'Confex Hall A', start:'09:00', end:'10:00', badges:['live'] },
    { id:'ev-indie',     title:'Indie Mixer',       where:'Hall B Patio',  start:'10:30', end:'11:00', badges:[] },
    { id:'ev-round',     title:'BizDev Roundtable', where:'Marriott',      start:'13:00', end:'14:00', badges:['free','live'] },
    { id:'ev-party',     title:'Evening Party @ Rheinterr', where:'Rheinterr', start:'20:00', end:'22:30', badges:['free','live'] },
  ];
}

/* hero card HTML (shared look) */
function cardHTML(ev){
  const pills = (ev.badges||[]).map(b=>`<span class="vcard__pill ${b==='live'?'is-live':''} ${b==='free'?'is-free':''}">${b}</span>`).join('');
  return `
    <div class="vcard">
      <div class="vcard__head">
        <div class="vcard__title">${ev.title}</div>
        <div class="vcard__badges">${pills}</div>
      </div>
      <div class="vcard__subtitle">📍 ${ev.where}</div>
      <ul class="vcard__meta">
        <li>⏱️ ${ev.start} – ${ev.end}</li>
      </ul>
      <div class="vcard__actions">
        <button class="btn btn-primary" data-act="save" data-id="${ev.id}">Save & Sync</button>
        <button class="btn" data-act="details" data-id="${ev.id}">Details</button>
      </div>
    </div>
  `;
}

export async function renderCalendar(mount){
  if (!mount) return;

  // Bring in shared styles
  ensureCss('/assets/css/cards.css');
  ensureCss('/assets/css/calendar.css');

  // Config
  const HOUR_PX = cssPx('--cal-hour-px', 320);
  const DAY_START = 8;   // 08:00
  const DAY_END   = 22;  // 22:00
  const pxPerMin  = HOUR_PX / 60;

  // Data source: window.CALENDAR_EVENTS or fallback demo
  const events = (window.CALENDAR_EVENTS && window.CALENDAR_EVENTS.length)
    ? window.CALENDAR_EVENTS
    : demoEvents();

  // Template
  mount.innerHTML = `
    <section class="cal-wrap">
      <div class="cal-head">
        <button class="btn btn-primary">Today</button>
        <button class="btn">Tomorrow</button>
        <button class="btn">This week</button>
      </div>

      <div class="cal-shell">
        <div class="cal-hours" id="cal-hours"></div>
        <div class="cal-track" id="cal-track"></div>
      </div>
    </section>
  `;

  const hoursEl = mount.querySelector('#cal-hours');
  const trackEl = mount.querySelector('#cal-track');

  // Hours column (08 → 22)
  let hoursHtml = '';
  for (let h=DAY_START; h<=DAY_END; h++){
    const label = (h<=12) ? `${h}:00` : `${h-12}:00`;
    hoursHtml += `<div class="tick"><span>${label}</span></div>`;
  }
  hoursEl.innerHTML = hoursHtml;

  // Track height
  const totalHours = (DAY_END - DAY_START);
  trackEl.style.height = (totalHours * HOUR_PX) + 'px';

  // Place events exactly by minute
  const dayMin0 = DAY_START*60;
  for (const ev of events){
    const start = toMin(ev.start);
    const end   = toMin(ev.end);
    const dur   = Math.max(0, end - start);

    const top    = Math.max(0, (start - dayMin0) * pxPerMin);
    const height = Math.max(dur * pxPerMin, 0); // calendar grows; do not shrink cards

    const el = document.createElement('article');
    el.className = 'cal-event';
    el.style.top = `${top}px`;
    el.style.height = `${height}px`;
    el.innerHTML = cardHTML(ev);

    trackEl.appendChild(el);
  }

  // Simple actions (no-ops for now)
  trackEl.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    const act = btn.getAttribute('data-act');
    console.log(`[calendar] ${act}`, id);
  });
}

export default { renderCalendar };