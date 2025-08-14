function cssNum(v,def){ const n=parseFloat(v); return Number.isFinite(n)?n:def; }
function mins(t){ 
  if (t.includes('T')) {
    const d = new Date(t);
    return d.getHours()*60 + d.getMinutes();
  }
  const [h,m]=String(t).split(":").map(Number); 
  return (h*60 + (m||0)); 
}
function topFor(t,hourH){ return ((mins(t)-8*60)/60)*hourH; }           // day starts 08:00
function heightFor(a,b,hourH){ return ((mins(b)-mins(a))/60)*hourH; }

const sampleDay = [
  { id:"key", title:"Gamescom Keynote", venue:"Confex Hall A", start:"2025-08-21T09:00:00", end:"2025-08-21T10:00:00" },
  { id:"ind", title:"Indie Mixer", venue:"Hall B Patio", start:"2025-08-21T10:30:00", end:"2025-08-21T11:00:00" },
  { id:"biz", title:"BizDev Roundtable", venue:"Marriott", start:"2025-08-21T13:00:00", end:"2025-08-21T14:00:00" },
  { id:"eve", title:"Evening Party @ Rheinterr", venue:"Rheinterr", start:"2025-08-21T20:00:00", end:"2025-08-21T22:30:00" }
];

export async function renderCalendar(mount){
  if(!mount) return;
  const cs = getComputedStyle(document.documentElement);
  const hourH = cssNum(cs.getPropertyValue("--hour-height"), 240);

  mount.innerHTML = `
    <section class="vwrap">
      <div class="vactions" style="margin-bottom:12px">
        <button class="vbtn primary" data-gcal-start>Connect Google Calendar</button>
        <button class="vbtn">Today</button>
        <button class="vbtn">Tomorrow</button>
      </div>
      <div class="cal-grid" style="min-height:${hourH*15}px">
        ${Array.from({length:15}).map((_,i)=>`<div class="hour-row">${(8+i).toString().padStart(2,"0")}:00</div>`).join("")}
        ${sampleDay.map(ev => {
          const startTime = new Date(ev.start).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
          const endTime = new Date(ev.end).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
          return `
          <div class="cal-event" style="top:${topFor(ev.start,hourH)}px; height:${heightFor(ev.start,ev.end,hourH)}px">
            <article class="vcard">
              <div class="vhead">
                <div class="vtitle">${ev.title}</div>
                <div class="vbadges"><span class="vpill live">live</span></div>
              </div>
              <div class="vmeta">📍 ${ev.venue} • 🕒 ${startTime} – ${endTime}</div>
              <div class="vactions">
                <button class="vbtn primary"
                        data-gcal-add
                        data-title="${ev.title}"
                        data-venue="${ev.venue}"
                        data-start="${ev.start}"
                        data-end="${ev.end}">Add to Calendar</button>
                <button class="vbtn">Details</button>
              </div>
            </article>
          </div>`;
        }).join("")}
      </div>
    </section>`;
}
export default { renderCalendar };