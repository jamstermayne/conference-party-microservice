const hourH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hour-height')) || 240;

const today = [
  { id:'keynote', title:'Gamescom Keynote', venue:'Confex Hall A', start:'09:00', end:'10:00' },
  { id:'indie',   title:'Indie Mixer', venue:'Hall B Patio', start:'10:30', end:'11:00' },
  { id:'biz',     title:'BizDev Roundtable', venue:'Marriott', start:'13:00', end:'14:00' },
  { id:'party',   title:'Evening Party @ Rheinterr', venue:'Rheinterr', start:'20:00', end:'22:30' }
];

function mins(t){ const [h,m]=t.split(':').map(Number); return h*60+m; }
function topFor(t){ return ((mins(t)-8*60)/60)*hourH; }     // grid starts 08:00
function heightFor(a,b){ return ((mins(b)-mins(a))/60)*hourH; }

export async function renderCalendar(mount){
  if(!mount) return;
  mount.innerHTML = `
  <section style="margin:24px">
    <div style="display:flex;gap:8px;margin:12px 0 16px">
      <button class="vbtn primary">Today</button>
      <button class="vbtn">Tomorrow</button>
      <button class="vbtn">This week</button>
    </div>
    <div class="cal-grid" style="position:relative; margin-top:12px; min-height:${hourH*15}px">
      ${Array.from({length:15}).map((_,i)=>`<div class="hour-row" style="position:relative">${8+i<10?'0':''}${8+i}:00</div>`).join('')}
      ${today.map(ev => `
        <div class="cal-event" style="top:${topFor(ev.start)}px; height:${heightFor(ev.start,ev.end)}px">
          <article class="vcard">
            <div class="vcard__head">
              <div class="vcard__title">${ev.title}</div>
              <div class="vcard__badges"><span class="vpill live">live</span></div>
            </div>
            <div class="vmeta">📍 ${ev.venue}  •  🕒 ${ev.start} – ${ev.end}</div>
            <div class="vactions">
              <button class="vbtn primary">Add to Calendar</button>
              <button class="vbtn">Details</button>
            </div>
          </article>
        </div>`).join('')}
    </div>
  </section>`;
}
export default { renderCalendar };