import { groupPartiesByDay } from './services/parties-utils.js?v=b037';
import { equalizeCards, scheduleEqualize, observeGrid } from './ui/equalize-cards.js';

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
    const timeRange = startTime + (endTime ? ` – ${endTime}` : "");
    
    return `
    <article class="vcard" data-party-id="${ev.id||""}" 
             data-start-iso="${ev.start||''}" 
             data-end-iso="${ev.end||''}">
      <header class="vcard__head">
        <h3 class="vcard__title">${ev.title||"Event"}</h3>
        <div class="vcard__badges">
          ${ev.price ? `<span class="badge ${/free/i.test(ev.price)?"badge-free":""}">${ev.price}</span>` : ""}
          ${ev.live ? `<span class="badge badge-live">live</span>` : ""}
        </div>
      </header>
      
      <div class="vcard__meta">
        <span class="meta"><i class="i-clock"></i>${timeRange}</span>
        <button class="link pin" data-action="open-map" 
                data-lat="${ev.lat||''}" 
                data-lng="${ev.lon||ev.lng||''}">
          <i class="i-pin"></i> ${ev.venue||"TBA"}
        </button>
      </div>
      
      <div class="vcard__body">
        <p class="vcard__desc">${ev.description || ''}</p>
      </div>
      
      <footer class="vcard__foot">
        <button class="btn btn-primary" 
                data-action="add-to-calendar" 
                data-id="${ev.id||''}"
                data-start-iso="${ev.start||''}"
                data-end-iso="${ev.end||''}">
          Add to Calendar
        </button>
        <button class="btn" data-action="details" data-id="${ev.id||''}">
          Details
        </button>
      </footer>
    </article>`;
  }).join("");
  
  // Find and observe the grid
  const grid = mount.querySelector('.vgrid');
  if (grid) {
    observeGrid(grid);
  }
  
  // Schedule equalization after paint
  scheduleEqualize();
}
export default { renderParties };
function normalizeSource(ev){
  if(ev.source) return ev;
  const link=(ev.url||ev.link||"").toLowerCase();
  ev.source = /meet.?to.?match|meettomatch|m2m/.test(link) ? "m2m" : (ev.source||"");
  return ev;
}
