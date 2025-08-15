import { groupPartiesByDay } from './services/parties-utils.js?v=b037';
import { equalizeCards, observeEqualize } from './equalize-cards.js';

const demo = [
  { id:"meet", title:"MeetToMatch • Cologne Edition 2025", venue:"Kölnmesse Confex", start:"2025-08-21T09:00:00", end:"2025-08-21T18:00:00", price:"From £127.04", live:true },
  { id:"mixer", title:"Marriott Rooftop Mixer", venue:"Marriott Hotel", start:"2025-08-21T20:00:00", end:"2025-08-21T23:30:00", price:"Free", live:true }
];
async function fetchParties(){
  try{
    const r = await fetch("/api/parties?conference=gamescom2025");
    if(!r.ok) throw new Error("HTTP "+r.status);
    const data = await r.json();
    return data?.data || demo;
  }catch(_){ return demo; }
}
export async function renderParties(mount){
  if(!mount) return;
  const items = await fetchParties();
  
  // Broadcast days for sidebar update
  const { days } = groupPartiesByDay(items);
  window.dispatchEvent(new CustomEvent('parties:loaded', { detail: { days } }));
  mount.innerHTML = `
    <section class="vwrap">
      <h2 class="vh1">Recommended events</h2>
      <div class="vgrid" id="party-list"></div>
    </section>`;
  const list = document.getElementById("party-list");
  list.innerHTML = items.map(ev => {
    const startDate = ev.start?.includes('T') ? new Date(ev.start) : null;
    const endDate = ev.end?.includes('T') ? new Date(ev.end) : null;
    const startTime = startDate ? startDate.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : ev.start || "";
    const endTime = endDate ? endDate.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : ev.end || "";
    return `
    <article class="vcard" data-id="${ev.id||""}">
      <div class="vhead">
        <div class="vtitle">${ev.title||"Event"}</div>
        <div class="vbadges">
          ${ev.price ? `<span class="vpill ${/free/i.test(ev.price)?"free":""}">${ev.price}</span>` : ""}
          ${ev.live ? `<span class="vpill live">live</span>` : ""}
        </div>
      </div>
      <div class="vmeta">
        <button class="pin-to-map"
                aria-label="Open on map"
                data-id="${ev.id||''}"
                data-day="${ev.start ? ev.start.slice(0,10) : ''}"
                data-lat="${ev.lat||''}"
                data-lon="${ev.lon||ev.lng||''}">📍</button>
        ${ev.venue||"TBA"} • 🕒 ${startTime}${endTime?` – ${endTime}`:""}
      </div>
      <div class="vactions">
        <button class="btn add-to-calendar"
                data-party-id="${ev.id||''}"
                data-action="addCalendar"
                data-title="${ev.title}"
                data-venue="${ev.venue}"
                data-start="${ev.start}"
                data-end="${ev.end}">Add to Calendar</button>
        <a class="btn btn--secondary"
           href="${ev.eventUrl || ev.sourceUrl || ev.url || `#/party/${ev.id||''}`}"
           ${ev.eventUrl || ev.sourceUrl || ev.url ? 'target="_blank"' : ''}
           ${ev.eventUrl || ev.sourceUrl || ev.url ? 'rel="noopener"' : ''}>
           Details
        </a>
      </div>
    </article>`;
  }).join("");
  
  // Equalize card heights after render
  equalizeCards('.vcard, .card');
  
  // Set up observer for dynamic changes (only once per view)
  observeEqualize('.vcard, .card');
}
export default { renderParties };
function normalizeSource(ev){
  if(ev.source) return ev;
  const link=(ev.url||ev.link||"").toLowerCase();
  ev.source = /meet.?to.?match|meettomatch|m2m/.test(link) ? "m2m" : (ev.source||"");
  return ev;
}
