/**
 * events-controller.js - Parties page controller
 * Build: b017
 */

function basicPartyCard(ev){
  const el = document.createElement('article');
  el.className = 'vcard';
  el.innerHTML = `
    <header class="vcard__head">
      <h3 class="vcard__title">${ev.title}</h3>
      <div class="vcard__badges">
        ${ev.price ? `<span class="vcard__pill">${ev.price}</span>`:''}
        ${ev.live ? `<span class="vcard__pill is-live">live</span>`:''}
      </div>
    </header>
    <ul class="vcard__meta">
      <li>📍 ${ev.venue}</li>
      <li>🗓️ ${new Date(ev.start).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} – ${new Date(ev.end).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</li>
    </ul>
    <div class="vcard__actions">
      <button class="btn btn--primary">Save & Sync</button>
      <button class="btn">Details</button>
    </div>`;
  return el;
}

async function getCardFactory(){
  try {
    const m = await import('./party-card.js?v=b011');
    if (m?.createPartyCard) return m.createPartyCard;
  } catch(e){
    console.warn('[Parties] party-card module unavailable, using basic card', e);
  }
  return basicPartyCard;
}

function ensureCardsCss(){
  const id='cards-css-b011';
  if (!document.getElementById(id)) {
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = '/assets/css/cards.css?v=b011';
    document.head.appendChild(link);
  }
}

// Fallback demo data if API quiet
const DEMO = [
  { id:'meet-2025', title:'MeetToMatch The Cologne Edition 2025', venue:'Koelnmesse Confex',
    start:'2025-08-22T09:00:00+02:00', end:'2025-08-22T18:00:00+02:00', price:'From £127.04', live:true },
  { id:'mixer', title:'Marriott Rooftop Mixer', venue:'Marriott Hotel',
    start:'2025-08-22T20:00:00+02:00', end:'2025-08-22T23:30:00+02:00', price:'Free', live:true }
];

export async function renderParties(mount){
  if (!mount) return;

  ensureCardsCss();

  mount.innerHTML = `
    <div class="hero hero--parties">
      <h2 class="hero__title">Recommended events</h2>
      <div class="hero__hint">Scroll to explore</div>
    </div>
    <div class="parties-grid" id="partiesGrid" role="list"></div>
  `;

  const grid = mount.querySelector('#partiesGrid');

  let items = DEMO;
  try {
    const res = await fetch('/api/parties?conference=gamescom2025');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length) items = data;
    }
  } catch(_) { /* keep DEMO */ }

  const makeCard = await getCardFactory();
  items.forEach(ev => {
    const card = makeCard(ev);
    card.setAttribute('role','listitem');
    grid.appendChild(card);
  });
}

export default { renderParties };