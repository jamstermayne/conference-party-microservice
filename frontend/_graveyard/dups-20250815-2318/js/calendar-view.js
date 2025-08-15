/**
 * Calendar View (08:00–22:00, 240px per hour)
 * - Sticky toolbar
 * - Hour rows with left gutter labels
 * - Absolute-positioned .vcard events with overlap lanes
 * - "Now" line on Today
 */
import { buildICS, downloadICS, outlookDeeplink } from "./services/ics.js?v=b035";
import * as M2M from "./services/m2m.js?v=b035";
import { openM2MModal } from "./ui/m2m-modal.js?v=b035";
import { toast } from "./ui/toast.js?v=b035";
import { equalizeCards, scheduleEqualize, observeGrid } from './ui/equalize-cards.js';
const HOUR_H = () => parseFloat(getComputedStyle(document.documentElement)
  .getPropertyValue('--hour-height')) || 240;

const BASE = 8;  // 08:00 baseline
const END  = 22; // 22:00 end
const GUTTER = () => parseFloat(getComputedStyle(document.documentElement)
  .getPropertyValue('--cal-gutter')) || 56;

/** Utilities */
const mins = t => { const [h,m] = String(t).split(':').map(Number); return h*60 + (m||0); };
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

/** Demo data (replace with real source when wired) */
const today = [
  { id:'keynote', title:'Gamescom Keynote', venue:'Confex Hall A', start:'09:00', end:'10:00', live:true },
  { id:'indie',   title:'Indie Mixer', venue:'Hall B Patio', start:'10:30', end:'11:00', live:true },
  { id:'biz',     title:'BizDev Roundtable', venue:'Marriott', start:'13:00', end:'14:00' },
  { id:'party',   title:'Evening Party @ Rheinterr', venue:'Rheinterr', start:'20:00', end:'22:30' }
];

/** Build hour rows once */
function hourRows() {
  const rows = [];
  for (let h = BASE; h < END; h++) {
    const label = `${String(h).padStart(2,'0')}:00`;
    rows.push(`<div class="hour-row"><span class="label">${label}</span></div>`);
  }
  return rows.join('');
}

/** Convert events to positioned blocks + simple overlap lanes */
function layoutEvents(items) {
  const hourH = HOUR_H();
  const baseM = BASE * 60, endM = END * 60;

  // Normalize
  const evs = items.map(e => {
    const s = clamp(mins(e.start), baseM, endM);
    const en = clamp(mins(e.end  ), s+15, endM + 180); // allow spill
    return { ...e, _s:s, _e:en };
  }).sort((a,b)=> a._s - b._s || a._e - b._e);

  // Overlap grouping into lanes
  let active = [];
  evs.forEach(e => {
    // remove finished
    active = active.filter(a => a._e > e._s);
    // find available lane
    const used = new Set(active.map(a => a._lane));
    let lane = 0; while (used.has(lane)) lane++;
    e._lane = lane;
    active.push(e);
  });

  // Compute max lane per cluster for width
  // We need cluster sizes; do a second pass
  const clusters = [];
  active = [];
  evs.forEach(e => {
    if (!active.length || active.some(a => a._e > e._s)) {
      active.push(e);
    } else {
      clusters.push(active); active = [e];
    }
  });
  if (active.length) clusters.push(active);
  const widths = new Map();
  clusters.forEach(group => {
    const maxLane = Math.max(...group.map(g => g._lane)) + 1;
    group.forEach(g => widths.set(g.id, maxLane));
  });

  // Produce positioned blocks
  return evs.map(e => {
    const top    = ((e._s - baseM)/60) * hourH;
    const height = ((e._e - e._s)/60) * hourH;
    const cols   = widths.get(e.id) || 1;
    const laneW  = 100/cols;         // percent of the events layer (to the right of gutter)
    const leftPct= e._lane * laneW;

    return {
      id: e.id, top, height, leftPct, widthPct: laneW,
      html: `
        <div class="cal-event" style="
          top:${top}px; height:${height}px;
          left: calc(${GUTTER()}px + ${leftPct}%);
          width: calc(${laneW}% - ${16}px);
        ">
          <article class="vcard">
            <div class="vcard__head">
              <div class="vcard__title">${e.title}</div>
              <div class="vcard__badges">
                ${e.live ? `<span class="vpill live">live</span>` : ``}
              </div>
            </div>
            <div class="vmeta">📍 ${e.venue} • 🕒 ${e.start} – ${e.end}</div>
            <div class="vactions">
              <button class="vbtn primary" data-act="add" data-id="${e.id}">Add to Calendar</button>
              <button class="vbtn" data-act="details" data-id="${e.id}">Details</button>
            </div>
          </article>
        </div>`
    };
  });
}

/** Now line (today only) */
function nowTopPx() {
  const hourH = HOUR_H();
  const m = new Date();
  const minsNow = m.getHours()*60 + m.getMinutes();
  const minRef  = BASE*60;
  return ((minsNow - minRef)/60) * hourH;
}

/** Render entry */
export async function renderCalendar(mount){
  if(!mount) return;
  
  // fetch MeetToMatch events
  let m2m = { events: [], connected: false };
  try { 
    m2m = await M2M.events({}); 
  } catch(e) {}

  mount.innerHTML = `
    <section class="calendar-screen">
      <div class="cal-toolbar">
        <button class="vbtn primary" data-nav="today">Today</button>
        <button class="vbtn" data-nav="tomorrow">Tomorrow</button>
        <button class="vbtn" data-nav="week">This week</button>
        <button class="vbtn" data-m2m-connect>${m2m.connected ? "MeetToMatch ✓" : "Connect MeetToMatch"}</button>
      </div>

      <div class="cal-grid">
        ${hourRows()}
        <div class="cal-events" id="cal-events"></div>
        <div class="cal-now" id="cal-now" style="display:none"><span class="tick">now</span></div>
      </div>
    </section>
  `;

  const layer = mount.querySelector('#cal-events');
  // Merge local events with M2M events
  const allEvents = [...today, ...(m2m.events||[])];
  const blocks = layoutEvents(allEvents);
  layer.innerHTML = blocks.map(b => b.html).join('');
  
  // Equalize card heights after render
  equalizeCards('.vcard, .card');
  
  // Set up observer for dynamic changes (only once per view)
  observeEqualize('.vcard, .card');

  // M2M Connect button handler
  mount.querySelector("[data-m2m-connect]")?.addEventListener("click", ()=>{
    if (m2m.connected){ 
      toast("MeetToMatch already connected"); 
      return; 
    }
    openM2MModal();
  });

  // Handlers (stubs; wire to real hooks later)
  layer.addEventListener('click', e => {
    const btn = e.target.closest('button[data-act]');
    if(!btn) return;
    const id = btn.dataset.id;
    const act = btn.dataset.act;
    if (act === 'add') {
      console.log('[cal] add to calendar', id);
      // TODO: call /googleCalendar/create when auth is wired.
    } else if (act === 'details') {
      console.log('[cal] details', id);
    }
  });

  // Show "now" line if viewing "today"
  const nowEl = mount.querySelector('#cal-now');
  const setNow = () => {
    const top = nowTopPx();
    const min = 0, max = (END-BASE) * HOUR_H();
    if (top >= min && top <= max) {
      nowEl.style.display = 'block';
      nowEl.style.top = `${top}px`;
    } else {
      nowEl.style.display = 'none';
    }
  };
  setNow();
  const timer = setInterval(setNow, 60 * 1000);
  // Clean up if route changes
  window.addEventListener('hashchange', () => clearInterval(timer), { once: true });
}
export default { renderCalendar };