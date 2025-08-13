/**
 * Invite Controller - Manage invites
 */

import Store from '/js/store.js?v=b023';

export async function renderInvites(mount) {
  if (!mount) mount = document.getElementById('invites-root') || document.getElementById('main');
  if (!mount) return;
  
  const invites = Store.get('invites') || { sent: 0, remaining: 10 };
  
  mount.innerHTML = `
    <div class="invites-container">
      <div class="section-card">
        <div class="left-accent" aria-hidden="true"></div>
        <h2 class="text-heading">Invites</h2>
        
        <div class="invite-stats">
          <div class="stat-item">
            <span class="stat-label">Sent</span>
            <span class="stat-value">${invites.sent}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Remaining</span>
            <span class="stat-value">${invites.remaining}</span>
          </div>
        </div>
        
        <button class="btn btn-primary" onclick="navigator.share({title:'Join velocity.ai',text:'Join the exclusive network',url:location.href})">
          Send Invite
        </button>
      </div>
    </div>
  `;
}

export default { renderInvites };