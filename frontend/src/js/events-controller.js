/**
 * events-controller.js — Parties page controller (hero cards)
 */
import { createPartyCard } from './party-card.js?v=b011';

export async function renderParties(mount) {
  if (!mount) return;

  // Ensure parties CSS is loaded once
  if (!document.querySelector('link[data-css="cards-parties"]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = '/assets/css/cards-parties.css?v=b011';
    l.setAttribute('data-css','cards-parties');
    document.head.appendChild(l);
  }

  mount.innerHTML = `
    <section>
      <header class="section-header">
        <h2 class="section-title">Recommended events</h2>
        <span class="section-subtle">Scroll to explore</span>
      </header>
      <div class="party-list" id="partyList"></div>
    </section>
  `;

  const list = mount.querySelector('#partyList');

  // Fetch parties (your existing endpoint/service can be swapped in)
  let events = [];
  try {
    const res = await fetch('/api/parties?conference=gamescom2025');
    if (res.ok) events = await res.json();
  } catch (e) {
    // fallback demo
    events = [
      { id:'meet-2025', title:'MeetToMatch The Cologne Edition 2025', venue:'Koelnmesse Confex', datePretty:'Fri Aug 22', timePretty:'09:00 – 18:00', price:127.04, live:true },
      { id:'mixer',     title:'Marriott Rooftop Mixer', venue:'Marriott Hotel', datePretty:'Fri Aug 22', timePretty:'20:00 – 23:30', price:null, live:true },
      { id:'devconf',   title:'devcom Developer Conference', venue:'Koelnmesse Confex', datePretty:'Mon Aug 18', timePretty:'09:00 – 23:30', price:299, live:true },
      { id:'launch',    title:'Gamescom Launch Party', venue:'rooftop58', datePretty:'Tue Aug 19', timePretty:'20:00 – 00:00', price:null, live:true },
    ];
  }

  list.innerHTML = events.map(createPartyCard).join('');

  // Wire actions
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    console.log('[UI] %s %s', action, id);
    // TODO: call RSVP/sync/detail handlers
  });
}

export default { renderParties };