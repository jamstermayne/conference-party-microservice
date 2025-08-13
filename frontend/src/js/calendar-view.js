/**
 * calendar-view.js
 * Build: b016
 */
import Events from '/assets/js/events.js?v=b011';

const SLOT_MINUTES = 30;   // 30-minute granularity
const DAY_START = 8;       // 08:00
const DAY_END   = 20;      // 20:00

function minutesBetween(a,b){
  return (new Date(b) - new Date(a)) / 60000;
}

export async function renderCalendar(mount){
  if (!mount) return;

  mount.innerHTML = `
    <div class="calendar-controls">
      <button class="chip is-active" data-when="today">Today</button>
      <button class="chip" data-when="tomorrow">Tomorrow</button>
      <button class="chip" data-when="week">This week</button>
    </div>
    <div class="calendar-wrap">
      <div class="calendar-grid" id="calGrid" aria-label="Day timeline"></div>
    </div>
  `;

  const grid = mount.querySelector('#calGrid');

  // build time grid with taller rows for cards
  for(let h = DAY_START; h <= DAY_END; h++){
    const row = document.createElement('div');
    row.className = 'cal-row';
    row.dataset.hour = h;
    row.style.height = 'var(--cal-hour-h, 260px)'; // use CSS variable for row height
    row.innerHTML = `<div class="cal-hour">${String(h).padStart(2,'0')}:00</div>`;
    grid.appendChild(row);
  }

  // demo events (same as parties for visual parity)
  const events = [
    { id:'meet-2025', title:'MeetToMatch', venue:'Koelnmesse Confex', start:'2025-08-22T09:00:00+02:00', end:'2025-08-22T10:30:00+02:00' },
    { id:'mixer', title:'Marriott Mixer', venue:'Marriott Hotel', start:'2025-08-22T09:55:00+02:00', end:'2025-08-22T11:30:00+02:00' }
  ];

  // place cards
  events.forEach(ev => {
    const start = new Date(ev.start);
    const end   = new Date(ev.end);
    const totalMin = minutesBetween(start,end);
    const slotHeight = 24; // px per 30 min — keep in sync with CSS
    const blocks = Math.max(1, Math.round(totalMin / SLOT_MINUTES));
    const topBlocks = ((start.getHours() - DAY_START) * 60 + start.getMinutes()) / SLOT_MINUTES;

    const card = document.createElement('div');
    card.className = 'vcard'; // use unified vcard class
    card.style.position = 'absolute';
    card.style.left = '10px';
    card.style.right = '10px';
    card.style.top = `${topBlocks * slotHeight}px`;
    card.style.minHeight = `${blocks * slotHeight}px`;
    card.innerHTML = `
      <header class="vcard__head">
        <h3 class="vcard__title">${ev.title}</h3>
      </header>
      <ul class="vcard__meta">
        <li>📍 ${ev.venue}</li>
        <li>🕓 ${start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} – ${end.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</li>
      </ul>
      <div class="vcard__actions">
        <button class="btn btn--primary">Save & Sync</button>
        <button class="btn">Details</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

export default { renderCalendar };