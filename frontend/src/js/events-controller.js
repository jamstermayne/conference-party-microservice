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
  mount.innerHTML = `
    <section class="vwrap">
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <button class="vbtn primary" data-gcal-start>Connect Google Calendar</button>
      </div>
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
      <div class="vmeta">📍 ${ev.venue||"TBA"} • 🕒 ${startTime}${endTime?` – ${endTime}`:""}</div>
      <div class="vactions">
        <button class="vbtn primary"
                data-gcal-add
                data-title="${ev.title}"
                data-venue="${ev.venue}"
                data-start="${ev.start}"
                data-end="${ev.end}">Add to Calendar</button>
        <button class="vbtn" data-act="details">Details</button>
      </div>
    </article>`;
  }).join("");
}
export default { renderParties };