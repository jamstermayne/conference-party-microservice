/**
 * Calendar Strip Enhancer — Renders a 7-day strip and hooks to ICS export
 */
const q = (s,r=document)=>r.querySelector(s);

function renderCalendarStrip(container, startDate = new Date()){
  const frag = document.createDocumentFragment();
  for (let i=0;i<7;i++){
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const el = document.createElement('div');
    el.className = 'calendar-day';
    if (i===0) el.dataset.today = "true";
    el.innerHTML = `<div>${d.toLocaleDateString('en-US',{weekday:'short'})}</div>
                    <div>${d.getDate()}</div>`;
    el.addEventListener('click', ()=>selectDate(d));
    frag.appendChild(el);
  }
  container.innerHTML = '';
  container.appendChild(frag);
}

function selectDate(date){
  document.dispatchEvent(new CustomEvent('calendar:select',{detail:{date}}));
}

function addICSLink(container, url){
  const link = document.createElement('a');
  link.className = 'ics-link';
  link.href = url;
  link.innerHTML = `📅 Add to Calendar`;
  container.appendChild(link);
}

document.addEventListener('DOMContentLoaded', ()=>{
  const stripTarget = q('[data-calendar-strip]');
  if (stripTarget) renderCalendarStrip(stripTarget);

  const icsTarget = q('[data-calendar-ics]');
  if (icsTarget) addICSLink(icsTarget, '/calendar.ics');
});