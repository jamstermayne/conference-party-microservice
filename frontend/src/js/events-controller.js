/**
 * events-controller.js - Parties page controller
 * Build: b016
 */
import { createPartyCard } from './party-card.js?v=b011';

export async function renderParties(mount){
  if (!mount) return;

  mount.innerHTML = `
    <div class="hero hero--parties">
      <h2 class="hero__title">Recommended events</h2>
      <div class="hero__hint">Scroll to explore</div>
    </div>
    <div class="parties-grid" id="partiesGrid" role="list"></div>
  `;

  const grid = mount.querySelector('#partiesGrid');

  // fetch parties (cached SW will serve fallback)
  const res = await fetch('/api/parties?conference=gamescom2025').catch(()=>null);
  const data = res && res.ok ? await res.json() : [];
  // Fallback demo cards if API quiet:
  const items = (data && data.length ? data : [
    { id:'meet-2025', title:'MeetToMatch The Cologne Edition 2025', venue:'Koelnmesse Confex', start:'2025-08-22T09:00:00+02:00', end:'2025-08-22T18:00:00+02:00', price:'From £127.04', live:true },
    { id:'mixer', title:'Marriott Rooftop Mixer', venue:'Marriott Hotel', start:'2025-08-22T20:00:00+02:00', end:'2025-08-22T23:30:00+02:00', price:'Free', live:true }
  ]);

  items.forEach(ev => {
    const card = createPartyCard(ev);
    card.setAttribute('role','listitem');
    grid.appendChild(card);
  });
}

export default { renderParties };