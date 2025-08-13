function cssNum(v,def){ const n=parseFloat(v); return Number.isFinite(n)?n:def; }
function mins(t){ const [h,m]=String(t).split(":").map(Number); return (h*60 + (m||0)); }
function topFor(t,hourH){ return ((mins(t)-8*60)/60)*hourH; }           // day starts 08:00
function heightFor(a,b,hourH){ return ((mins(b)-mins(a))/60)*hourH; }

const sampleDay = [
  { id:"key", title:"Gamescom Keynote", venue:"Confex Hall A", start:"09:00", end:"10:00" },
  { id:"ind", title:"Indie Mixer", venue:"Hall B Patio", start:"10:30", end:"11:00" },
  { id:"biz", title:"BizDev Roundtable", venue:"Marriott", start:"13:00", end:"14:00" },
  { id:"eve", title:"Evening Party @ Rheinterr", venue:"Rheinterr", start:"20:00", end:"22:30" }
];

export async function renderCalendar(mount){
  if(!mount) return;
  const cs = getComputedStyle(document.documentElement);
  const hourH = cssNum(cs.getPropertyValue("--hour-height"), 240);

  mount.innerHTML = `
    <section class="vwrap">
      <div class="vactions" style="margin-bottom:12px">
        <button class="vbtn primary">Today</button>
        <button class="vbtn">Tomorrow</button>
        <button class="vbtn">This week</button>
      </div>
      <div class="cal-grid" style="min-height:${hourH*15}px">
        ${Array.from({length:15}).map((_,i)=>`<div class="hour-row">${(8+i).toString().padStart(2,"0")}:00</div>`).join("")}
        ${sampleDay.map(ev => `
          <div class="cal-event" style="top:${topFor(ev.start,hourH)}px; height:${heightFor(ev.start,ev.end,hourH)}px">
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
          </div>`).join("")}
      </div>
    </section>`;
}
export default { renderCalendar };