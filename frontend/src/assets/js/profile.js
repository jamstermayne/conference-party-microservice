import { API } from './api.js';
import { Store, Events, EVENTS } from './state.js';
import { qs, toast } from './ui.js';

export function ProfileView(){
  const wrap = document.createElement('section');
  wrap.innerHTML = `
    <div class="card-row">
      <div>
        <div class="h1">My Profile</div>
        <div class="sub">Professional networking identity</div>
      </div>
      <div class="cta">
        <button id="btn-edit" class="btn btn-small btn-ghost">Edit</button>
      </div>
    </div>
    
    ${renderProfileCard()}
    ${renderStatsCard()}
    ${renderConnectionsCard()}
    ${renderActivityCard()}
    
    <div id="edit-form" class="card" hidden>
      <div class="card-title">Edit Profile</div>
      <div class="form">
        <input type="text" id="edit-name" placeholder="Full Name" class="input" value="${escapeHTML(Store.profile?.name || '')}">
        <input type="text" id="edit-title" placeholder="Job Title" class="input" value="${escapeHTML(Store.profile?.title || '')}">
        <input type="text" id="edit-company" placeholder="Company" class="input" value="${escapeHTML(Store.profile?.company || '')}">
        <select id="edit-persona" class="input">
          <option value="">Select Primary Persona</option>
          <option value="dev" ${Store.profile?.persona === 'dev' ? 'selected' : ''}>Developer</option>
          <option value="pub" ${Store.profile?.persona === 'pub' ? 'selected' : ''}>Publishing</option>
          <option value="inv" ${Store.profile?.persona === 'inv' ? 'selected' : ''}>Investor</option>
          <option value="sp" ${Store.profile?.persona === 'sp' ? 'selected' : ''}>Service Provider</option>
        </select>
        <textarea id="edit-bio" placeholder="Bio (optional)" class="input" rows="3">${escapeHTML(Store.profile?.bio || '')}</textarea>
        <div class="form-row">
          <button id="btn-cancel" class="btn btn-ghost">Cancel</button>
          <button id="btn-save" class="btn btn-primary">Save Changes</button>
        </div>
      </div>
    </div>
  `;
  
  setupProfileHandlers(wrap);
  return wrap;
}

function renderProfileCard() {
  const profile = Store.profile;
  
  if (!profile) {
    return `
      <div class="card">
        <div class="card-row">
          <div>
            <div class="card-title">Create Your Profile</div>
            <div class="meta">Set up your professional identity for networking</div>
          </div>
          <button id="btn-create" class="btn btn-primary btn-small">Get Started</button>
        </div>
      </div>
    `;
  }
  
  return `
    <div class="card">
      <div class="profile-header">
        <div class="avatar">${getInitials(profile.name)}</div>
        <div class="profile-info">
          <div class="profile-name">${escapeHTML(profile.name || 'Anonymous')}</div>
          <div class="profile-title">${escapeHTML(profile.title || 'Professional')}</div>
          <div class="profile-company">${escapeHTML(profile.company || '')}</div>
          ${profile.persona ? `<div class="badge ${profile.persona}">${getPersonaLabel(profile.persona)}</div>` : ''}
        </div>
      </div>
      ${profile.bio ? `<div class="profile-bio">${escapeHTML(profile.bio)}</div>` : ''}
    </div>
  `;
}

function renderStatsCard() {
  const stats = {
    parties: Store.savedPartyIds.size,
    invites: Store.invites.sent?.length || 0,
    connections: Store.connections?.length || 0,
    redeemed: Store.invites.redeemed || 0
  };
  
  return `
    <div class="card">
      <div class="card-title">Activity Summary</div>
      <div class="stats-grid">
        <div class="stat">
          <div class="stat-number">${stats.parties}</div>
          <div class="stat-label">Parties Saved</div>
        </div>
        <div class="stat">
          <div class="stat-number">${stats.connections}</div>
          <div class="stat-label">Connections</div>
        </div>
        <div class="stat">
          <div class="stat-number">${stats.invites}</div>
          <div class="stat-label">Invites Sent</div>
        </div>
        <div class="stat">
          <div class="stat-number">${stats.redeemed}</div>
          <div class="stat-label">Redeemed</div>
        </div>
      </div>
    </div>
  `;
}

function renderConnectionsCard() {
  const connections = Store.connections || [];
  
  return `
    <div class="card">
      <div class="card-row">
        <div>
          <div class="card-title">Recent Connections</div>
          <div class="meta">${connections.length} professional connections</div>
        </div>
        <button class="btn btn-small btn-ghost" disabled>View All</button>
      </div>
      <div class="list">
        ${connections.length ? connections.slice(0, 5).map(conn => `
          <div class="list-item">
            <div class="avatar small">${getInitials(conn.name)}</div>
            <div>
              <div class="list-title">${escapeHTML(conn.name)}</div>
              <div class="list-sub">${escapeHTML(conn.title)} • ${escapeHTML(conn.company)}</div>
            </div>
            <div class="cta">
              <span class="badge ${conn.persona || ''}">${getPersonaLabel(conn.persona)}</span>
            </div>
          </div>
        `).join('') : '<div class="meta">No connections yet</div>'}
      </div>
    </div>
  `;
}

function renderActivityCard() {
  const activities = generateRecentActivity();
  
  return `
    <div class="card">
      <div class="card-title">Recent Activity</div>
      <div class="list">
        ${activities.length ? activities.map(activity => `
          <div class="list-item">
            <div>
              <div class="list-title">${activity.title}</div>
              <div class="list-sub">${activity.time}</div>
            </div>
            <div class="cta">
              <span class="activity-icon">${activity.icon}</span>
            </div>
          </div>
        `).join('') : '<div class="meta">No recent activity</div>'}
      </div>
    </div>
  `;
}

function setupProfileHandlers(root) {
  // Edit profile
  root.querySelector('#btn-edit')?.addEventListener('click', () => {
    root.querySelector('#edit-form').hidden = false;
  });
  
  // Create profile (first time)
  root.querySelector('#btn-create')?.addEventListener('click', () => {
    // Initialize empty profile
    Store.profile = {
      name: '',
      title: '',
      company: '',
      persona: '',
      bio: ''
    };
    root.querySelector('#edit-form').hidden = false;
  });
  
  // Cancel edit
  root.querySelector('#btn-cancel')?.addEventListener('click', () => {
    root.querySelector('#edit-form').hidden = true;
    // Reset form values
    if (Store.profile) {
      root.querySelector('#edit-name').value = Store.profile.name || '';
      root.querySelector('#edit-title').value = Store.profile.title || '';
      root.querySelector('#edit-company').value = Store.profile.company || '';
      root.querySelector('#edit-persona').value = Store.profile.persona || '';
      root.querySelector('#edit-bio').value = Store.profile.bio || '';
    }
  });
  
  // Save profile
  root.querySelector('#btn-save')?.addEventListener('click', async () => {
    const name = root.querySelector('#edit-name').value.trim();
    const title = root.querySelector('#edit-title').value.trim();
    const company = root.querySelector('#edit-company').value.trim();
    const persona = root.querySelector('#edit-persona').value;
    const bio = root.querySelector('#edit-bio').value.trim();
    
    if (!name) {
      toast('Name is required');
      return;
    }
    
    const updatedProfile = {
      ...Store.profile,
      name,
      title,
      company,
      persona,
      bio,
      updatedAt: Date.now()
    };
    
    try {
      // Update local state
      Store.profile = updatedProfile;
      
      // Hide form and refresh view
      root.querySelector('#edit-form').hidden = true;
      refreshProfileView(root);
      
      toast('✅ Profile updated');
      Events.emit(EVENTS.PROFILE_UPDATED, { profile: updatedProfile });
      
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast('Failed to save profile');
    }
  });
}

function refreshProfileView(root) {
  const newView = ProfileView();
  root.parentNode.replaceChild(newView, root);
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2);
}

function getPersonaLabel(persona) {
  const labels = {
    dev: 'Developer',
    pub: 'Publishing', 
    inv: 'Investor',
    sp: 'Service Provider'
  };
  return labels[persona] || 'Professional';
}

function generateRecentActivity() {
  const activities = [];
  
  // Add recent party saves
  if (Store.savedPartyIds.size) {
    activities.push({
      title: `Saved ${Store.savedPartyIds.size} parties`,
      time: 'Recently',
      icon: '🎉'
    });
  }
  
  // Add recent invites
  if (Store.invites.sent?.length) {
    activities.push({
      title: `Sent ${Store.invites.sent.length} invites`,
      time: 'Recently',
      icon: '✉️'
    });
  }
  
  // Add calendar sync
  if (Store.calendar.lastSync) {
    activities.push({
      title: 'Synced calendar',
      time: formatActivityTime(Store.calendar.lastSync),
      icon: '📅'
    });
  }
  
  // Add connections
  if (Store.connections?.length) {
    activities.push({
      title: `Connected with ${Store.connections.length} professionals`,
      time: 'This week',
      icon: '🤝'
    });
  }
  
  return activities.slice(0, 4);
}

function formatActivityTime(ts) {
  try {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

function escapeHTML(s) {
  return String(s ?? '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

// Listen for profile updates
Events.on(EVENTS.PROFILE_UPDATED, () => {
  // Profile view will auto-refresh due to the event handler above
});