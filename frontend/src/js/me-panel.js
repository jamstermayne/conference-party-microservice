/**
 * Me/Profile panel
 * Build: b018 - Uses shared ui-card factory
 */

import { ensureCardsCss, createHeroCard } from './ui-card.js?v=b018';

const FALLBACK = {
  name: 'Your Profile',
  email: 'user@example.com',
  role: 'Attendee',
  company: 'Conference Participant',
  status: 'active',
  linkedin: false
};

export async function renderMe(mount) {
  if (!mount) return;
  
  // Ensure CSS is loaded
  ensureCardsCss();

  // Get user data or use fallback
  const me = window.__USER || FALLBACK;

  // Render profile using shared factory
  mount.innerHTML = `
    <div class="v-stack">
      <h2 class="section-title">Your Profile</h2>
      <div id="cards-me">
        ${createHeroCard('me', me)}
      </div>
      
      <!-- Additional profile sections -->
      <div class="vcard" style="margin-top: 12px">
        <div class="vtitle">Conference Stats</div>
        <ul class="meta">
          <li>Events Saved: ${me.savedEvents || 0}</li>
          <li>Connections: ${me.connections || 0}</li>
          <li>Invites Sent: ${me.invitesSent || 0}</li>
        </ul>
      </div>
      
      <div class="vcard" style="margin-top: 12px">
        <div class="vtitle">Quick Actions</div>
        <div class="actions">
          <button class="btn primary" onclick="location.hash='#settings'">Settings</button>
          <button class="btn ghost" onclick="location.hash='#calendar'">My Calendar</button>
          <button class="btn ghost" id="export-btn">Export Contacts</button>
        </div>
      </div>
    </div>
  `;

  // Event delegation for profile actions
  const root = mount.querySelector('#cards-me');
  if (root) {
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn');
      if (!btn) return;
      
      const action = btn.textContent.toLowerCase();
      
      if (action === 'edit') {
        console.log('Opening profile editor');
        // Could show an edit dialog here
        location.hash = '#settings';
      }
    });
  }

  // Export button handler
  const exportBtn = mount.querySelector('#export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      console.log('Exporting contacts...');
      exportBtn.textContent = 'Exported!';
      setTimeout(() => exportBtn.textContent = 'Export Contacts', 2000);
    });
  }
}

export default { renderMe };