/**
 * calendar-view.js — Day view using 30-min slots; hero-card sizing from duration.
 */
const DAY_START = 8 * 60;   // minutes from 00:00
const DAY_END   = 20 * 60;  // minutes from 00:00
const SLOT_MIN  = 30;       // 30-minute slots
const PX_PER_SLOT = 44;     // visual height per 30 minutes (tweak to taste)
const MIN_CARD_PX = 72;     // minimum visual height for very short items

function minToY(minFromStart) {
  const slots = minFromStart / SLOT_MIN;
  return Math.round(slots * PX_PER_SLOT);
}
function durationToH(mins) {
  const slots = mins / SLOT_MIN;
  return Math.max(MIN_CARD_PX, Math.round(slots * PX_PER_SLOT) - 10);
}

function fmtTimeRange(startISO, endISO) {
  const s = new Date(startISO);
  const e = new Date(endISO);
  const opt = { hour: '2-digit', minute: '2-digit' };
  return `${s.toLocaleTimeString([], opt)} – ${e.toLocaleTimeString([], opt)}`;
}

function mkCard(ev) {
  const wrap = document.createElement('div');
  wrap.className = 'calendar-card hero-card';
  wrap.innerHTML = `
    <div class="hero-card__inner">
      <div class="hero-card__title">${ev.title}</div>
      <div class="hero-card__meta">
        <span>📍 ${ev.venue || ''}</span>
        <span>🕒 ${fmtTimeRange(ev.start, ev.end)}</span>
      </div>
      <div class="hero-card__actions">
        <button class="btn btn-primary">Save & Sync</button>
        <button class="btn btn-ghost">Details</button>
      </div>
    </div>
  `;
  return wrap;
}

export async function renderCalendar(mount) {
  if (!mount) return;

  // Container + time grid
  mount.innerHTML = `
    <div class="section-card">
      <div class="left-accent" aria-hidden="true"></div>
      <div class="calendar-toolbar">
        <button class="pill is-active">Today</button>
        <button class="pill">Tomorrow</button>
        <button class="pill">This week</button>
      </div>
      <div id="calWrap" class="calendar-wrap"></div>
    </div>
  `;
  const cal = mount.querySelector('#calWrap');
  cal.style.position = 'relative';
  cal.style.padding = '32px 8px 32px 72px';
  cal.style.height = `${minToY(DAY_END - DAY_START) + 64}px`;
  cal.style.background = 'linear-gradient(180deg, rgba(62,68,113,.25), rgba(38,45,72,.15))';
  cal.style.borderRadius = '16px';

  // Hour lines (with 30-min ticks)
  for (let m = DAY_START; m <= DAY_END; m += 60) {
    const y = minToY(m - DAY_START);
    const line = document.createElement('div');
    line.style.position = 'absolute';
    line.style.left = '64px';
    line.style.right = '16px';
    line.style.top = `${y}px`;
    line.style.height = '1px';
    line.style.background = 'rgba(255,255,255,.06)';
    cal.appendChild(line);

    // 30-min tick
    if (m < DAY_END) {
      const y2 = minToY(m - DAY_START + 30);
      const tick = document.createElement('div');
      tick.style.position = 'absolute';
      tick.style.left = '64px';
      tick.style.right = '16px';
      tick.style.top = `${y2}px`;
      tick.style.height = '1px';
      tick.style.background = 'rgba(255,255,255,.04)';
      cal.appendChild(tick);
    }

    // label
    const lbl = document.createElement('div');
    lbl.style.position = 'absolute';
    lbl.style.left = '0';
    lbl.style.top = `${y - 8}px`;
    lbl.style.width = '56px';
    lbl.style.textAlign = 'right';
    lbl.style.opacity = '.6';
    lbl.style.fontSize = '12px';
    const h = String(Math.floor(m / 60)).padStart(2,'0');
    lbl.textContent = `${h}:00`;
    cal.appendChild(lbl);
  }

  // Get events: reuse the same endpoint & seed fallback as parties for consistent demo
  async function safeGet(url){
    try {
      const r = await fetch(url, { cache: 'no-store' });
      if(!r.ok) throw new Error(r.status);
      return await r.json();
    } catch(e){ return null; }
  }
  const api = await safeGet('/api/parties?conference=gamescom2025');
  let events = Array.isArray(api?.events) ? api.events : api;
  if(!events?.length){
    const seed = await safeGet('/assets/seed/events.json');
    events = seed || [];
  }

  // Place each event on the timeline
  for (const ev of events.slice(0, 10)) {
    const s = new Date(ev.start);
    const e = new Date(ev.end);
    const minsFromStart = (s.getHours()*60 + s.getMinutes()) - DAY_START;
    const duration = (e - s) / 60000;

    const top = minToY(Math.max(0, minsFromStart));
    const height = durationToH(Math.max(15, duration));

    const card = mkCard(ev);
    Object.assign(card.style, {
      position: 'absolute',
      left: '88px',
      right: '24px',
      top: `${top}px`,
      height: `${height}px`,
      backdropFilter: 'blur(6px)',
      borderRadius: '16px',
      boxShadow: '0 0 0 1px rgba(120,130,255,.12), 0 20px 40px rgba(30,30,60,.35)'
    });
    cal.appendChild(card);
  }
}

export default { renderCalendar };