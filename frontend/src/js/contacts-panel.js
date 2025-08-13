/**
 * Contacts panel
 * Build: b018 - Uses shared ui-card factory
 */

import { ensureCardsCss, renderCards } from './ui-card.js?v=b018';

const SEED = [
  { id: 'c1', name: 'Alex Chen', role: 'Producer', company: 'Nebula Games', location: 'Hall 7, Booth A23', status: 'online' },
  { id: 'c2', name: 'Sam Rivera', role: 'Biz Dev', company: 'Solar Forge', location: 'Business Area', verified: true },
  { id: 'c3', name: 'Dana Patel', role: 'Publisher', company: 'Blue Owl', linkedin: 'linkedin.com/in/danapatel' },
  { id: 'c4', name: 'Jordan Kim', role: 'Investor', company: 'GameVentures', location: 'VIP Lounge', status: 'online', verified: true },
  { id: 'c5', name: 'Morgan Lee', role: 'Developer', company: 'Indie Studio', linkedin: 'linkedin.com/in/morganlee' },
];

export async function renderContacts(mount) {
  if (!mount) return;
  
  // Ensure CSS is loaded
  ensureCardsCss();

  // Render contacts using shared factory
  mount.innerHTML = `
    <div class="v-stack">
      <h2 class="section-title">Professional Network</h2>
      <div class="vstack" id="cards-contacts">
        ${renderCards(SEED, 'contact')}
      </div>
    </div>
  `;

  // Event delegation for contact actions
  const root = document.getElementById('cards-contacts');
  if (root) {
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn');
      if (!btn) return;
      
      const card = btn.closest('.vcard');
      const cardId = card?.dataset.id;
      const action = btn.textContent.toLowerCase();
      
      if (action === 'connect') {
        console.log('Connecting with:', cardId);
        btn.textContent = 'Connected!';
        btn.disabled = true;
        setTimeout(() => {
          btn.textContent = 'Connected';
        }, 2000);
      } else if (action === 'message') {
        console.log('Messaging:', cardId);
        // Could open a message dialog here
      }
    });
  }
}

export default { renderContacts };