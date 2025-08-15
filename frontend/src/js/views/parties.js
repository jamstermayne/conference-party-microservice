import { equalizeCards, observeEqualize } from '../equalize-cards.js';

const EVENTS = [
  { id:'m2m',  title:'MeetToMatch The Cologne Edition 2025', where:'Kölnmesse Confex', when:'Fri Aug 22 — 09:00 – 18:00', badges:['live'], price:'From £127.04' },
  { id:'mix',  title:'Marriott Rooftop Mixer', where:'Marriott Hotel', when:'Fri Aug 22 — 20:00 – 23:30', badges:['free','live'], price:'Free' },
  { id:'dev',  title:'devcom Developer Conference', where:'Kölnmesse Confex', when:'Mon Aug 18, 09:00 – 23:30', badges:['live'], price:'From €299' },
];
function pill(b){ return `<span class="vcard__pill ${b==='live'?'is-live':''} ${b==='free'?'is-free':''}">${b}</span>`; }
function card(e){
  return `<article class="vcard">
    <div class="vcard__head">
      <div class="vcard__title">${e.title}</div>
      <div class="vcard__badges">${(e.badges||[]).map(pill).join('')}</div>
    </div>
    <div class="vcard__subtitle">📍 ${e.where}</div>
    <ul class="vcard__meta"><li>${e.when}</li><li>${e.price||''}</li></ul>
    <div class="vcard__actions">
      <button class="btn btn-primary">Save & Sync</button>
      <button class="btn">Details</button>
    </div>
  </article>`;
}
export async function renderParties(m){
  m.innerHTML = `<h2 style="margin:0 0 14px">Recommended events</h2><div class="vstack">${EVENTS.map(card).join('')}</div>`;
  
  // Equalize card heights after render
  equalizeCards('.vcard, .card');
  
  // Set up observer for dynamic changes (only once per view)
  observeEqualize('.vcard, .card');
}
export default { renderParties };
