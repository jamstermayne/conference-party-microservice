// mount-invites.js - Mount invites panel
export function mountInvites(container) {
  // Try to load existing invites panel
  if (window.renderInvites) {
    window.renderInvites(container);
    return;
  }
  
  // Fallback UI
  container.innerHTML = `
    <div class="v-section">
      <h2>Your Invites</h2>
      <p class="text-secondary">You have 5 invites remaining</p>
    </div>
    
    <div class="v-section">
      <button class="btn btn--primary btn--full">
        Send Invite
      </button>
    </div>
    
    <div class="v-section">
      <h3>Sent Invites</h3>
      <div class="empty-state">
        <p>No invites sent yet</p>
        <p class="text-secondary">Share your invite link to bring friends</p>
      </div>
    </div>
  `;
}