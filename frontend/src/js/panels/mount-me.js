// mount-me.js - Mount profile/me panel
export async function mountMe(container) {
  // Try to load existing me panel
  try {
    const { renderMe } = await import('../me-panel.js');
    renderMe(container);
    return;
  } catch (err) {
    console.log('Using fallback profile UI');
  }
  
  // Get profile from localStorage
  const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
  
  container.innerHTML = `
    <div class="v-section">
      <h2>Profile</h2>
      <div class="profile-header">
        <div class="avatar-large">${getInitials(profile.name)}</div>
        <h3>${profile.name || 'Guest User'}</h3>
        <p class="text-secondary">${profile.role || 'Attendee'}</p>
      </div>
    </div>
    
    <div class="v-section">
      <div class="field-list">
        <div class="field">
          <label>Email</label>
          <p>${profile.email || 'Not set'}</p>
        </div>
        <div class="field">
          <label>Company</label>
          <p>${profile.company || 'Not set'}</p>
        </div>
        <div class="field">
          <label>LinkedIn</label>
          <p>${profile.linkedin || 'Not connected'}</p>
        </div>
      </div>
      <button class="btn btn--primary btn--full">Edit Profile</button>
    </div>
    
    <div class="v-section">
      <h3>Stats</h3>
      <div class="stats-grid">
        <div class="stat">
          <div class="stat__value">0</div>
          <div class="stat__label">Events</div>
        </div>
        <div class="stat">
          <div class="stat__value">0</div>
          <div class="stat__label">Connections</div>
        </div>
        <div class="stat">
          <div class="stat__value">5</div>
          <div class="stat__label">Invites</div>
        </div>
      </div>
    </div>
  `;
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}