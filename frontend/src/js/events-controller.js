import { eventCardHTML } from './ui-cards.js?v=b018';

const FALLBACK = [
  { id:'meet',  title:'MeetToMatch The Cologne Edition 2025', venue:'Kölnmesse Confex', when:'Fri Aug 22 — 09:00–18:00', price:'£127.04', live:true },
  { id:'mixer', title:'Marriott Rooftop Mixer',               venue:'Marriott Hotel',    when:'Fri Aug 22 — 20:00–23:30', free:true, live:true },
];

async function fetchJSON(url){
  try{ const r = await fetch(url, {credentials:'omit'}); if(!r.ok) throw new Error(r.statusText); return await r.json(); }
  catch{ return null; }
}

export async function renderParties(mount){
  if (!mount) return;
  // ensure CSS
  addCss('/assets/css/cards.css?v=b018');

  // fetch from hosting API if present, else fallback
  const res = await fetchJSON('/api/parties?conference=gamescom2025');
  const data = (res && Array.isArray(res.data) && res.data.length) ? res.data : FALLBACK;

  mount.innerHTML = `<div class="v-stack" id="cards-parties"></div>`;
  const root = document.getElementById('cards-parties');
  root.innerHTML = data.map(eventCardHTML).join('');

  root.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-action]');
    if(!btn) return;
    const act = btn.getAttribute('data-action');
    if(act==='sync'){ /* no-op for now */ }
  });
}

function addCss(href){
  if ([...document.styleSheets].some(s=>s.href && s.href.includes('cards.css'))) return;
  const link = document.createElement('link'); link.rel='stylesheet'; link.href=href; document.head.appendChild(link);
}

export default { renderParties };