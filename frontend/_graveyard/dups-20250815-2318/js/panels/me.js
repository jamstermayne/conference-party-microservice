export async function openMePanel(activator) {
  const content = document.createElement('div');
  content.className = 'v-section';
  
  try {
    // Try to load existing me panel
    const { renderMe } = await import('../me-panel.js');
    renderMe(content);
  } catch (err) {
    // Fallback placeholder with profile info
    const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    content.innerHTML = `
      <h2>Profile</h2>
      <div class="v-item">
        <span>Name</span>
        <span>${profile.name || 'Not set'}</span>
      </div>
      <div class="v-item">
        <span>Email</span>
        <span>${profile.email || 'Not set'}</span>
      </div>
      <div class="v-item">
        <span>Role</span>
        <span>${profile.role || 'Attendee'}</span>
      </div>
      <div class="v-item">
        <button class="primary">Edit Profile</button>
      </div>
    `;
  }
  
  Stack.push('me', {
    title: 'Me',
    content,
    onBack: () => history.back()
  }, activator);
  
  history.pushState(null, '', '#me');
}