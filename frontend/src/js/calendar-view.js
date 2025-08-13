import '/assets/css/calendar.css?v=b021';

const H = 260; // must match --hour-height

export async function renderCalendar(mount){
  if(!mount) return;
  const events = (await fetch('/assets/data/events-today.json').then(r=>r.json()).catch(()=>[])) || [];
  mount.innerHTML = `
    <section style="padding:12px 20px">
      <div class="tabs"><button class="btn-primary">Today</button> <button class="btn">Tomorrow</button> <button class="btn">This week</button></div>
      <div class="calendar-grid" id="cal">
        ${Array.from({length:15}).map((_,i)=>`<div class="hour-row" data-hour="${8+i}"></div>`).join('')}
      </div>
    </section>`;
  const grid = mount.querySelector('#cal');

  events.forEach(ev=>{
    const top = pxFrom(ev.start);
    const height = pxFrom(ev.end) - pxFrom(ev.start);
    const node = document.createElement('div');
    node.className = 'cal-event';
    node.style.top = top + 'px';
    node.style.height = Math.max(height, 140) + 'px';
    node.innerHTML = eventCard(ev);
    grid.appendChild(node);
  });

  function pxFrom(t){ // "09:30"
    const [h,m]=t.split(':').map(Number);
    return ((h-8)*H) + (m/60)*H;
  }
  function eventCard(ev){
    return `
    <article class="vcard">
      <div class="vcard__head">
        <div class="vcard__title">${ev.title}</div>
        <div class="vcard__badges"><span class="vcard__pill is-live">live</span></div>
      </div>
      <div class="vcard__subtitle">📍 ${ev.venue}</div>
      <ul class="vcard__meta"><li>🕒 ${ev.start} – ${ev.end}</li></ul>
      <div class="vcard__actions"><button class="btn-primary">Add to Calendar</button><button class="btn">Details</button></div>
    </article>`;
  }
}
export default { renderCalendar };