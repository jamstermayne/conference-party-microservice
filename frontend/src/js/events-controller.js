/**
 * Events/Parties controller
 * Build: b018 - Uses shared ui-card factory
 */

import { ensureCardsCss, partyCard, renderCards } from './ui-card.js?v=b018';

const FALLBACK = [
  { id: 'meet', title: 'MeetToMatch The Cologne Edition 2025', venue: 'Kölnmesse Confex', when: 'Fri Aug 22 — 09:00–18:00', price: '£127.04', live: true },
  { id: 'mixer', title: 'Marriott Rooftop Mixer', venue: 'Marriott Hotel', when: 'Fri Aug 22 — 20:00–23:30', free: true, live: true },
  { id: 'indie', title: 'Indie Games Poland Party', venue: 'Rheinterrassen', when: 'Sat Aug 23 — 19:00–02:00', free: true },
  { id: 'xbox', title: 'Xbox Developer Direct', venue: 'Microsoft Lounge', when: 'Sun Aug 24 — 14:00–18:00', price: '€45', live: true },
  { id: 'unity', title: 'Unity Networking Night', venue: 'Cologne Tower', when: 'Mon Aug 25 — 18:00–23:00', free: true },
];

async function fetchJSON(url) {
  try {
    const r = await fetch(url, { credentials: 'omit' });
    if (!r.ok) throw new Error(r.statusText);
    return await r.json();
  } catch {
    return null;
  }
}

export async function renderParties(mount) {
  if (!mount) return;
  
  // Ensure CSS is loaded
  ensureCardsCss();

  // Show loading state
  mount.innerHTML = '<div class="v-stack"><p style="color:#8b95a7">Loading events...</p></div>';

  // Fetch from API or use fallback
  const res = await fetchJSON('/api/parties?conference=gamescom2025');
  const data = (res && Array.isArray(res.data) && res.data.length) ? res.data : FALLBACK;

  // Render cards using shared factory
  mount.innerHTML = `
    <div class="v-stack">
      <h2 class="section-title">Parties & Events</h2>
      <div class="grid-auto" id="cards-parties">
        ${renderCards(data, 'party')}
      </div>
    </div>
  `;

  // Event delegation for card actions
  const root = document.getElementById('cards-parties');
  if (root) {
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn');
      if (!btn) return;
      
      const card = btn.closest('.vcard');
      const cardId = card?.dataset.id;
      const action = btn.textContent.toLowerCase();
      
      if (action === 'save') {
        console.log('Saving party:', cardId);
        btn.textContent = 'Saved!';
        btn.classList.add('saved');
        setTimeout(() => {
          btn.textContent = 'Save';
          btn.classList.remove('saved');
        }, 2000);
      } else if (action === 'sync') {
        console.log('Syncing party:', cardId);
        btn.textContent = 'Synced!';
        setTimeout(() => btn.textContent = 'Sync', 2000);
      }
    });
  }
}

export default { renderParties };