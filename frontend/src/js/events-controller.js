const demo = [
  { id:"meet", title:"MeetToMatch • Cologne Edition 2025", venue:"Kölnmesse Confex", start:"09:00", end:"18:00", price:"From £127.04", live:true },
  { id:"mixer", title:"Marriott Rooftop Mixer", venue:"Marriott Hotel", start:"20:00", end:"23:30", price:"Free", live:true }
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
      <h2 class="vh1">Recommended events</h2>
      <div class="vgrid" id="party-list"></div>
    </section>`;
  const list = document.getElementById("party-list");
  list.innerHTML = items.map(ev => `
    <article class="vcard" data-id="${ev.id||""}">
      <div class="vhead">
        <div class="vtitle">${ev.title||"Event"}</div>
        <div class="vbadges">
          ${ev.price ? `<span class="vpill ${/free/i.test(ev.price)?"free":""}">${ev.price}</span>` : ""}
          ${ev.live ? `<span class="vpill live">live</span>` : ""}
        </div>
      </div>
      <div class="vmeta">📍 ${ev.venue||"TBA"} • 🕒 ${(ev.start||"")}${ev.end?` – ${ev.end}`:""}</div>
      <div class="vactions">
        <button class="vbtn primary" data-act="save">Save & Sync</button>
        <button class="vbtn" data-act="details">Details</button>
      </div>
    </article>`).join("");
}
export default { renderParties };