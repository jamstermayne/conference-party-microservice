const H=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hour-height'))||240;
const startHour=8, hours=15;
const today=[
  {id:"keynote", title:"Gamescom Keynote", venue:"Confex Hall A", start:"09:00", end:"10:00"},
  {id:"indie",   title:"Indie Mixer",      venue:"Hall B Patio", start:"10:30", end:"11:00"},
  {id:"biz",     title:"BizDev Roundtable",venue:"Marriott",     start:"13:00", end:"14:00"},
  {id:"party",   title:"Evening Party",    venue:"Rheinterr",    start:"20:00", end:"22:30"}
];
const mins=t=>{const[a,b]=t.split(":").map(Number);return a*60+b};
const topFor=t=>((mins(t)-startHour*60)/60)*H;
const heightFor=(a,b)=>((mins(b)-mins(a))/60)*H;
export async function renderCalendar(mount){
  if(!mount) return;
  const hoursHTML=Array.from({length:hours},(_,i)=>{
    const h=startHour+i; const lbl=(h<10?"0":"")+h+":00";
    return `<div class="hour-row" data-hour="${lbl}"></div>`;
  }).join("");
  const eventsHTML=today.map(ev=>`
    <div class="cal-event" style="top:${topFor(ev.start)}px;height:${heightFor(ev.start,ev.end)}px">
      <article class="vcard">
        <div class="vhead">
          <div class="vtitle">${ev.title}</div>
          <div class="vbadges"><span class="vpill live">live</span></div>
        </div>
        <div class="vmeta">📍 ${ev.venue} • 🕒 ${ev.start} – ${ev.end}</div>
        <div class="vactions">
          <button class="vbtn primary">Add to Calendar</button>
          <button class="vbtn">Details</button>
        </div>
      </article>
    </div>`).join("");
  mount.innerHTML = `
    <section class="cal-wrap">
      <div style="display:flex;gap:8px;margin:0 0 16px">
        <button class="vbtn primary">Today</button>
        <button class="vbtn">Tomorrow</button>
        <button class="vbtn">This week</button>
      </div>
      <div class="cal-grid" style="min-height:${H*hours}px">
        ${hoursHTML}
        ${eventsHTML}
      </div>
    </section>`;
}
export default { renderCalendar };
