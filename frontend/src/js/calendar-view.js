const H = 260; // must match --hour-height in CSS

const DAY_EVENTS = [
  { id: 'e1', title: 'Gamescom Keynote', venue: 'Confex Hall A', start: '09:00', end: '10:00', live: true },
  { id: 'e2', title: 'Indie Mixer', venue: 'Hall B Patio', start: '10:30', end: '11:00' },
  { id: 'e3', title: 'BizDev Roundtable', venue: 'Marriott', start: '13:00', end: '14:00' },
  { id: 'e4', title: 'Evening Party @ Rheinterr', venue: 'Rheinterrassen', start: '20:00', end: '22:30', free: true, live: true },
];

export async function renderCalendar(mount){
  if(!mount) return;
  
  mount.innerHTML = `
    <section style="padding:12px 20px">
      <div class="tabs">
        <button class="btn-primary">Today</button>
        <button class="btn">Tomorrow</button>
        <button class="btn">This week</button>
      </div>
      <div class="calendar-grid" id="cal" style="position:relative;">
        ${Array.from({length:15}).map((_,i)=>`<div class="hour-row" data-hour="${8+i}" style="height:${H}px;border-bottom:1px solid rgba(255,255,255,.04);"></div>`).join('')}
      </div>
    </section>`;
  
  const grid = mount.querySelector('#cal');

  DAY_EVENTS.forEach(ev=>{
    const top = pxFrom(ev.start);
    const height = pxFrom(ev.end) - pxFrom(ev.start);
    const node = document.createElement('div');
    node.className = 'cal-event';
    node.style.cssText = `position:absolute;left:8px;right:8px;top:${top}px;height:${Math.max(height, 140)}px;`;
    node.innerHTML = eventCard(ev);
    grid.appendChild(node);
  });

  function pxFrom(t){ // "09:30"
    const [h,m] = t.split(':').map(Number);
    return ((h-8)*H) + (m/60)*H;
  }
  
  function eventCard(ev){
    return `
    <article class="vcard">
      <div class="vcard__head">
        <div class="vcard__title">${ev.title}</div>
        <div class="vcard__badges">
          ${ev.free?'<span class="vcard__pill is-free">free</span>':''}
          ${ev.live?'<span class="vcard__pill is-live">live</span>':''}
        </div>
      </div>
      <div class="vcard__subtitle">📍 ${ev.venue}</div>
      <ul class="vcard__meta">
        <li>🕒 ${ev.start} – ${ev.end}</li>
      </ul>
      <div class="vcard__actions">
        <button class="btn-primary">Add to Calendar</button>
        <button class="btn">Details</button>
      </div>
    </article>`;
  }
}
export default { renderCalendar };