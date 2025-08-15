export async function openInvitesPanel(activator) {
  const content = document.createElement('div');
  content.className = 'v-section';
  
  try {
    // Try to load existing invite panel
    const { renderInvites } = await import('../invite-panel.js');
    renderInvites(content);
  } catch (err) {
    // Fallback placeholder
    content.innerHTML = `
      <h2>Invites</h2>
      <div class="v-item">
        <span>You have 5 invites remaining</span>
        <button class="primary">Send Invite</button>
      </div>
      <div class="v-item">
        <span>Track your invites and see who joined</span>
      </div>
    `;
  }
  
  Stack.push('invites', {
    title: 'Invites',
    content,
    onBack: () => history.back()
  }, activator);
  
  history.pushState(null, '', '#invites');
}