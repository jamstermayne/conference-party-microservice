/**
 * Invites panel
 * Build: b018 - Uses shared ui-card factory
 */

import { ensureCardsCss, renderCards } from './ui-card.js?v=b018';

const TEN = [
  { id: 'VX1-A', title: 'Exclusive Access', from: 'Pat', email: 'pat@example.com', event: 'VIP Opening Night', expires: 'Aug 20', premium: true },
  { id: 'VX1-B', title: 'Developer Meetup', from: 'Jules', email: 'jules@ex.com', event: 'Unity Mixer', expires: 'Aug 22', urgent: true },
  { id: 'VX1-C', title: 'Publisher Party', from: 'Morgan', email: 'morgan@ex.com', event: 'EA Lounge', expires: 'Aug 23' },
  { id: 'VX1-D', title: 'Indies Unite', from: 'Kai', email: 'kai@ex.com', event: 'Indie Showcase', expires: 'Aug 24' },
  { id: 'VX1-E', title: 'Media Preview', from: 'Riley', email: 'riley@ex.com', event: 'Press Conference', expires: 'Expired', urgent: true },
  { id: 'VX1-F', title: 'Networking Night', from: 'Taylor', email: 'taylor@ex.com', event: 'Business Hub', expires: 'Aug 25', premium: true },
  { id: 'VX1-G', title: 'After Party', from: 'Casey', email: 'casey@ex.com', event: 'Closing Celebration', expires: 'Aug 26' },
  { id: 'VX1-H', title: 'Studio Tour', from: 'Jamie', email: 'jamie@ex.com', event: 'Ubisoft Campus', expires: 'Aug 21' },
  { id: 'VX1-I', title: 'Investment Forum', from: 'Devon', email: 'devon@ex.com', event: 'VC Roundtable', expires: 'Aug 22', premium: true },
  { id: 'VX1-J', title: 'Award Ceremony', from: 'Alexis', email: 'alexis@ex.com', event: 'Gamescom Awards', expires: 'Aug 25', urgent: true },
];

export async function renderInvites(mount) {
  if (!mount) return;
  
  // Ensure CSS is loaded
  ensureCardsCss();

  // Render invites using shared factory
  mount.innerHTML = `
    <div class="v-stack">
      <h2 class="section-title">Your Invites</h2>
      <div class="vstack" id="cards-invites">
        ${renderCards(TEN, 'invite')}
      </div>
    </div>
  `;

  // Event delegation for invite actions
  const root = document.getElementById('cards-invites');
  if (root) {
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn');
      if (!btn) return;
      
      const card = btn.closest('.vcard');
      const cardId = card?.dataset.id;
      const action = btn.textContent.toLowerCase();
      
      if (action === 'accept') {
        console.log('Accepting invite:', cardId);
        btn.textContent = 'Accepted!';
        btn.classList.add('saved');
        btn.disabled = true;
        setTimeout(() => {
          btn.textContent = 'Accepted';
        }, 2000);
      } else if (action === 'decline') {
        console.log('Declining invite:', cardId);
        card.style.opacity = '0.5';
        btn.textContent = 'Declined';
        btn.disabled = true;
      }
    });
  }
}

export default { renderInvites };