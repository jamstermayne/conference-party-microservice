import { openICS, openGoogle } from './calendar-lite.js';
export function cardFor(ev){
  const div = document.createElement('div'); div.className='card';
  div.innerHTML = `
    <h3 class="card__title">${ev.title||'Party'}</h3>
    <div class="card__meta">${ev.date||''} ${ev.time||''} — ${ev.venue||''}</div>
    <div class="card__actions">
      <button class="btn btn--primary" data-action="cal-ics">Add to Calendar</button>
      <button class="btn btn--ghost" data-action="cal-google">Google</button>
    </div>`;
  div.addEventListener('click', (e)=>{
    const a=e.target.closest('[data-action]'); if(!a) return;
    if(a.dataset.action==='cal-ics') openICS(ev);
    if(a.dataset.action==='cal-google') openGoogle(ev);
  }, { passive:true });
  return div;
}
