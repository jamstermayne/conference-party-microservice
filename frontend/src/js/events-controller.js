import { cardGrid, partyCard } from './components/cards.js?v=b018';

export async function renderParties(mount){
  if(!mount) return;
  
  // Create container with header
  const container = document.createElement('div');
  container.innerHTML = `<div class="section-card"><div class="section-head"><div>Recommended events</div><span style="opacity:.6;font-size:.85rem">Scroll to explore</span></div></div>`;
  mount.appendChild(container);
  
  // Create grid for cards
  const grid = cardGrid(document.createElement('div'));
  mount.appendChild(grid);

  // Mock data for now - replace with API call later
  const mockEvents = [
    {
      id: 'meet-2025',
      title: 'MeetToMatch The Cologne Edition 2025',
      venue: 'Kölnmesse Confex',
      when: 'Fri Aug 22, 09:00 – 18:00',
      price: '£127.04',
      live: true
    },
    {
      id: 'marriott-mixer',
      title: 'Marriott Rooftop Mixer',
      venue: 'Marriott Hotel',
      when: 'Fri Aug 22, 20:00 – 23:30',
      live: true
    },
    {
      id: 'dev-conf',
      title: 'devcom Developer Conference',
      venue: 'Koelnmesse Confex',
      when: 'Mon Aug 18, 09:00 – 23:30',
      price: '€299'
    },
    {
      id: 'gamescom-launch',
      title: 'Gamescom Launch Party',
      venue: 'rooftop58',
      when: 'Tue Aug 19, 20:00 – 00:00',
      live: true
    }
  ];
  
  // Render cards
  mockEvents.forEach(evt => grid.appendChild(partyCard(evt)));

  // Wire up actions
  wirePartyActions(mount);
}

function wirePartyActions(root){
  root.addEventListener('click', e=>{
    const el = e.target.closest('[data-action]');
    if(!el) return;
    const act = el.dataset.action;
    const id = el.dataset.id;
    if(act==='saveSync'){ console.log('[UI] Save & Sync', id); /* call your calendar sync here */ }
    if(act==='details'){ console.log('[UI] Details', id); /* open modal */ }
  });
}

export default { renderParties };