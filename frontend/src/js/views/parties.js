import { equalizeCards, observeEqualize } from '../equalize-cards.js';

const EVENTS = [
  { id:'m2m',  title:'MeetToMatch The Cologne Edition 2025', where:'Kölnmesse Confex', when:'Fri Aug 22 — 09:00 – 18:00', badges:['live'], price:'From £127.04' },
  { id:'mix',  title:'Marriott Rooftop Mixer', where:'Marriott Hotel', when:'Fri Aug 22 — 20:00 – 23:30', badges:['free','live'], price:'Free' },
  { id:'dev',  title:'devcom Developer Conference', where:'Kölnmesse Confex', when:'Mon Aug 18, 09:00 – 23:30', badges:['live'], price:'From €299' },
];
function pill(b){ 
  return `<span class="badge ${b==='live'?'badge-live':''} ${b==='free'?'badge-free':''}">${b}</span>`; 
}

function card(e){
  // Extract time range from when string (e.g., "Fri Aug 22 — 09:00 – 18:00" -> "09:00 – 18:00")
  const timeRange = e.when.includes('—') ? e.when.split('—')[1]?.trim() : e.when;
  const dateInfo = e.when.includes('—') ? e.when.split('—')[0]?.trim() : '';
  
  return `<article class="vcard" data-party-id="${e.id}">
    <header class="vcard__head">
      <h3 class="vcard__title">${e.title}</h3>
      <div class="vcard__badges">${(e.badges||[]).map(pill).join('')}</div>
    </header>

    <div class="vcard__meta">
      <span class="meta"><i class="i-clock"></i>${timeRange}</span>
      <button class="link pin" data-action="open-map" data-venue="${e.where}">
        <i class="i-pin"></i> ${e.where}
      </button>
    </div>

    <div class="vcard__body">
      <p class="vcard__desc">${dateInfo} • ${e.price||'Free'}</p>
    </div>

    <footer class="vcard__foot vcard__actions">
      <button class="btn btn-primary" data-action="add-to-calendar" data-id="${e.id}">
        Add to Calendar
      </button>
      <button class="btn" data-action="details" data-id="${e.id}">Details</button>
    </footer>
  </article>`;
}

export async function renderParties(m){
  m.innerHTML = `
    <h2 style="margin:0 0 14px">Recommended events</h2>
    <section id="parties-list" class="vgrid">
      ${EVENTS.map(card).join('')}
    </section>
  `;
  
  // Equalize card heights after render
  equalizeCards('.vcard, .card');
  
  // Set up observer for dynamic changes (only once per view)
  observeEqualize('.vcard, .card');
}
export default { renderParties };
