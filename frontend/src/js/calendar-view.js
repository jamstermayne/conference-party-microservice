/**
 * calendar-view.js — day view with 30-minute increments, hero card blocks
 */
import Events from '/assets/js/events.js?v=b011';

export async function renderCalendar(mount){
  if(!mount) return;

  // Ensure calendar CSS is loaded once
  if (!document.querySelector('link[data-css="calendar-css"]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = '/assets/css/calendar.css?v=b011';
    l.setAttribute('data-css','calendar-css');
    document.head.appendChild(l);
  }

  // Day bounds (e.g., 08:00–20:00)
  const startMinutes = 8 * 60;

  // Demo data — replace with real calendar aggregation
  const items = [
    { id:'meet',   title:'MeetToMatch',       venue:'Koelnmesse Confex', start:'09:00', end:'10:30' },
    { id:'mixer',  title:'Marriott Mixer',    venue:'Marriott Hotel',    start:'09:55', end:'11:30' }
  ];

  // Helpers
  const toMin = (hhmm) => {
    const [h,m] = hhmm.split(':').map(Number);
    return h*60 + m;
  };

  // Render shell
  mount.innerHTML = `
    <div class="calendar-wrap">
      <div class="calendar-grid" aria-hidden="true"></div>
      <div id="calEvents"></div>
    </div>
  `;

  const host = mount.querySelector('#calEvents');

  host.innerHTML = items.map(ev => {
    const topMin  = toMin(ev.start) - startMinutes;
    const durMin  = Math.max(15, toMin(ev.end) - toMin(ev.start));
    // Position by CSS var math (see calendar.css)
    const style = `top: calc(var(--px-per-minute) * ${topMin} * 1px);
                   height: calc(var(--px-per-minute) * ${durMin} * 1px);`;
    return `
      <article class="calendar-event" style="${style}">
        <h3 class="title">${ev.title}</h3>
        <div class="meta">📍 ${ev.venue} ⏱️ ${ev.start} – ${ev.end}</div>
        <div class="actions">
          <button class="btn--primary" data-id="${ev.id}" data-action="save-sync">Save & Sync</button>
          <button class="btn--ghost"   data-id="${ev.id}" data-action="details">Details</button>
        </div>
      </article>`;
  }).join('');

  host.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-action]');
    if (!b) return;
    console.log('[CAL] %s %s', b.dataset.action, b.dataset.id);
  });

  Events.emit?.('calendar:rendered');
}