const BUILD = window.BUILD || String(Date.now());

function ensureCss(href){
  const id='css:'+href; if(document.getElementById(id)) return;
  const l=document.createElement('link'); l.id=id; l.rel='stylesheet';
  l.href = href + (href.includes('?')?'&':'?') + 'b='+BUILD;
  document.head.appendChild(l);
}
function cssPx(varName, fallback){
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  const n = parseFloat(v); return Number.isFinite(n)?n:fallback;
}
const toMin = t => { const [h,m]=(t||'0:0').split(':').map(n=>parseInt(n,10)||0); return h*60+m; };

function cardHTML(ev){
  const pills = (ev.badges||[]).map(b=>`<span class="vcard__pill ${b==='live'?'is-live':''} ${b==='free'?'is-free':''}">${b}</span>`).join('');
  return `<div class="vcard">
    <div class="vcard__head"><div class="vcard__title">${ev.title}</div><div class="vcard__badges">${pills}</div></div>
    <div class="vcard__subtitle">📍 ${ev.where}</div>
    <ul class="vcard__meta"><li>⏱️ ${ev.start} – ${ev.end}</li></ul>
    <div class="vcard__actions"><button class="btn btn-primary">Add to Calendar</button><button class="btn">Details</button></div>
  </div>`;
}

function demoEvents(){
  return [
    { id:'a', title:'Gamescom Keynote', where:'Confex Hall A', start:'09:00', end:'10:00', badges:[] },
    { id:'b', title:'Indie Mixer', where:'Hall B Patio', start:'10:30', end:'11:00', badges:[] },
    { id:'c', title:'BizDev Roundtable', where:'Marriott', start:'13:00', end:'14:00', badges:[] },
    { id:'d', title:'Evening Party @ Rheinterr', where:'Rheinterr', start:'20:00', end:'22:30', badges:['free','live'] },
  ];
}

export async function renderCalendar(mount){
  injectCalendarCSSOnce();
  setCalendarRowHeightFromCard();
  ensureCss('/assets/css/cards.css'); ensureCss('/assets/css/calendar.css');
  const HOUR_PX = cssPx('--cal-hour-px', 300);
  const pxPerMin = HOUR_PX/60;
  const DAY_START = 8, DAY_END = 22;
  const evs = (window.CALENDAR_EVENTS && window.CALENDAR_EVENTS.length)? window.CALENDAR_EVENTS : demoEvents();

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

  let hoursHtml=''; for(let h=DAY_START; h<=DAY_END; h++){ hoursHtml+=`<div class="tick"><span>${h}:00</span></div>`; }
  hoursEl.innerHTML = hoursHtml;

  const totalHours = (DAY_END - DAY_START);
  trackEl.style.height = (totalHours * HOUR_PX) + 'px';

  const dayMin0 = DAY_START*60;
  evs.forEach(ev=>{
    const start=toMin(ev.start), end=toMin(ev.end), dur=Math.max(0,end-start);
    const top = Math.max(0,(start-dayMin0)*pxPerMin);
    const height = Math.max(dur*pxPerMin, 150); // never shorter than a hero card
    const el = document.createElement('article'); el.className='cal-event';
    el.style.top = `${top}px`; el.style.height = `${height}px`;
    el.innerHTML = cardHTML(ev);
    trackEl.appendChild(el);
  });
}
export default { renderCalendar };

function injectCalendarCSSOnce(){
  if (document.querySelector('link[data-cal-fit]')) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = '/assets/css/calendar-fit.css' + (window.BUILD ? `?v=${window.BUILD}` : '');
  l.setAttribute('data-cal-fit','1');
  document.head.appendChild(l);
}
function setCalendarRowHeightFromCard(){
  const probe = document.createElement('div');
  probe.className = 'card vcard';
  probe.style.cssText = 'position:absolute;visibility:hidden;left:-9999px;top:-9999px;width:520px;';
  probe.innerHTML = '<div class="vcard__head"><div class="vcard__title">Probe</div></div><div class="vcard__meta">⏰ 09:00 – 10:00</div>';
  document.body.appendChild(probe);
  const h = Math.ceil(probe.getBoundingClientRect().height);
  probe.remove();
  const row = Math.max(h, 148) + 12; // breathing room
  document.documentElement.style.setProperty('--cal-hour-px', `${row}`);
}
