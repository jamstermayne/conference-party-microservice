import { eventCardHTML } from './ui-cards.js?v=b018';

const DAY_EVENTS = [
  { id:'e1', title:'Gamescom Keynote',         venue:'Confex Hall A', when:'09:00–10:00' },
  { id:'e2', title:'Indie Mixer',              venue:'Hall B Patio',  when:'10:30–11:00' },
  { id:'e3', title:'BizDev Roundtable',        venue:'Marriott',      when:'13:00–14:00' },
  { id:'e4', title:'Evening Party @ Rheinterr',venue:'Rheinterr',     when:'20:00–22:30', free:true },
];

export async function renderCalendar(mount){
  if(!mount) return;
  addCss('/assets/css/cards.css?v=b018');
  addCss('/assets/css/calendar.css?v=b018');

  // Simple day grid with 30-min ticks. We place full cards inside slots.
  mount.innerHTML = `
  <div class="cal-wrap">
    <div class="cal-grid">
      <div class="cal-hour-labels">
        ${['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00'].map(h=>`<div>${h}</div>`).join('')}
      </div>
      <div class="cal-hours">
        ${Array.from({length:8}).map(()=>`<div class="slot"></div>`).join('')}
      </div>
      <div class="cal-events" id="cal-events"></div>
    </div>
  </div>`;

  const layer = document.getElementById('cal-events');
  // Place cards in order (not precise positioning to the minute—keeps simple & stable)
  layer.innerHTML = DAY_EVENTS.map((e, i)=>{
    const top = i * (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hour-h')) || 240);
    return `<div class="cal-event" style="top:${top}px">${eventCardHTML(e)}</div>`;
  }).join('');
}

function addCss(href){
  if ([...document.styleSheets].some(s=>s.href && s.href.includes(href.split('?')[0]))) return;
  const link = document.createElement('link'); link.rel='stylesheet'; link.href=href; document.head.appendChild(link);
}

export default { renderCalendar };