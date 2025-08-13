import Events from '/assets/js/events.js?v=b023'; // uses current backend wiring if available
const demo=[
  {id:"meet", title:"MeetToMatch The Cologne Edition 2025", venue:"Kölnmesse Confex", start:"09:00", end:"18:00", price:"From £127.04", live:true},
  {id:"mix",  title:"Marriott Rooftop Mixer", venue:"Marriott Hotel", start:"20:00", end:"23:30", price:"Free", live:true}
];
export async function renderParties(mount){
  if(!mount) return;
  let items=[];
  try{ items = await (Events?.getParties?.("gamescom2025")||[]);}catch(_){}
  if(!Array.isArray(items) || !items.length) items = demo;
  mount.innerHTML = `<section class="vlist"><h2 class="vh2">Recommended events</h2><div id="party-list"></div></section>`;
  const list=document.getElementById("party-list");
  list.innerHTML = items.map(ev=>`
    <article class="vcard" data-id="${ev.id||""}">
      <div class="vhead">
        <div class="vtitle">${ev.title||""}</div>
        <div class="vbadges">
          ${ev.price?`<span class="vpill ${/free/i.test(ev.price)?"free":""}">${ev.price}</span>`:""}
          ${ev.live?`<span class="vpill live">live</span>`:""}
        </div>
      </div>
      <div class="vmeta">📍 ${ev.venue||""}  •  🕒 ${(ev.start||"").slice(0,5)} – ${(ev.end||"").slice(0,5)}</div>
      <div class="vactions">
        <button class="vbtn primary" data-act="save">Save & Sync</button>
        <button class="vbtn" data-act="details">Details</button>
      </div>
    </article>`).join("");
}
export default { renderParties };
