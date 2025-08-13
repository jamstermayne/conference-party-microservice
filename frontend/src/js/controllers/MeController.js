/**
 * ME CONTROLLER
 * Manages user profile, settings, and personal data
 */

import { BaseController } from './BaseController.js?v=b023';
import { Store } from '../store.js?v=b023';
import { api } from '../services/api.js?v=b023';
import { renderConnectionCard } from '../ui/connectionCard.js?v=b023';

export class MeController extends BaseController {
  constructor(element) {
    super(element, { name: 'me' });
    
    this.state = {
      profile: {},
      editing: false,
      activeTab: 'profile',
      stats: {
        eventsSaved: 0,
        connections: 0,
        profileViews: 0,
        invitesSent: 0
      },
      settings: {
        notifications: true,
        proximity: false,
        discoverable: false,
        newsletter: true
      }
    };
  }

  /**
   * Initialize controller
   */
  async onInit() {
    this.loadProfile();
    this.loadStats();
    this.loadSettings();
    this.setupTabNavigation();
  }

  /**
   * Load user profile
   */
  loadProfile() {
    const profile = Store.get('profile') || {};
    
    // Initialize profile if empty
    if (!profile.id) {
      profile.id = this.generateProfileId();
      profile.createdAt = Date.now();
      Store.patch('profile', profile);
    }
    
    this.setState({ profile });
  }

  /**
   * Load user statistics
   */
  loadStats() {
    const stats = {
      eventsSaved: (Store.get('events.saved') || []).length,
      connections: (Store.get('connections') || []).length,
      profileViews: Store.get('profile.views') || 0,
      invitesSent: (Store.get('invites.sent') || []).length
    };
    
    this.setState({ stats });
  }

  /**
   * Load user settings
   */
  loadSettings() {
    const settings = Store.get('settings') || {
      notifications: true,
      proximity: false,
      discoverable: false,
      newsletter: true
    };
    
    this.setState({ settings });
  }

  /**
   * Setup tab navigation
   */
  setupTabNavigation() {
    this.on('tab:switch', ({ tab }) => {
      this.setState({ activeTab: tab });
    });
  }

  /**
   * Save profile changes
   */
  async saveProfile(profileData) {
    try {
      // Validate required fields
      if (!profileData.name || !profileData.persona) {
        this.notify('Name and persona are required', 'warning');
        return;
      }
      
      const updatedProfile = {
        ...this.state.profile,
        ...profileData,
        updatedAt: Date.now()
      };
      
      // Save to API
      await api.updateProfile(updatedProfile);
      
      // Save to store
      Store.patch('profile', updatedProfile);
      
      this.setState({ 
        profile: updatedProfile,
        editing: false
      });
      
      this.notify('Profile updated!', 'success');
      
    } catch (error) {
      this.handleError(error);
      this.notify('Failed to save profile', 'error');
    }
  }

  /**
   * Update settings
   */
  async updateSettings(settingsData) {
    try {
      const updatedSettings = {
        ...this.state.settings,
        ...settingsData
      };
      
      Store.patch('settings', updatedSettings);
      this.setState({ settings: updatedSettings });
      
      // Handle proximity toggle
      if ('proximity' in settingsData) {
        Store.patch('proximity.enabled', settingsData.proximity);
      }
      
      // Handle discoverable toggle
      if ('discoverable' in settingsData) {
        Store.patch('opportunities.intentToggle', settingsData.discoverable);
      }
      
      this.notify('Settings updated', 'success');
      
    } catch (error) {
      this.handleError(error);
      this.notify('Failed to update settings', 'error');
    }
  }

  /**
   * Export user data
   */
  async exportData() {
    try {
      const userData = {
        profile: Store.get('profile'),
        events: {
          saved: Store.get('events.saved'),
          history: Store.get('events.history')
        },
        connections: Store.get('connections'),
        invites: Store.get('invites'),
        analytics: Store.get('analytics'),
        settings: Store.get('settings'),
        exportedAt: Date.now()
      };
      
      const blob = new Blob([JSON.stringify(userData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `professional-intelligence-data-${Date.now()}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      this.notify('Data exported!', 'success');
      
    } catch (error) {
      this.handleError(error);
      this.notify('Export failed', 'error');
    }
  }

  /**
   * Delete account
   */
  async deleteAccount() {
    const confirmed = confirm(
      'Are you sure you want to delete your account? This cannot be undone.'
    );
    
    if (!confirmed) return;
    
    try {
      await api.deleteProfile(this.state.profile.id);
      
      // Clear all local data
      localStorage.clear();
      sessionStorage.clear();
      
      this.notify('Account deleted', 'info');
      
      // Redirect to home
      window.location.reload();
      
    } catch (error) {
      this.handleError(error);
      this.notify('Failed to delete account', 'error');
    }
  }

  /**
   * Generate profile ID
   */
  generateProfileId() {
    return 'prof_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Action handlers
   */
  actionEditProfile() {
    this.setState({ editing: true });
  }

  actionSaveProfile(e, target) {
    const form = this.$('.profile-form');
    if (form) {
      const formData = new FormData(form);
      const profileData = Object.fromEntries(formData);
      
      // Handle skills array
      if (profileData.skills) {
        profileData.skills = profileData.skills.split(',').map(s => s.trim());
      }
      
      this.saveProfile(profileData);
    }
  }

  actionCancelEdit() {
    this.setState({ editing: false });
  }

  actionSwitchTab(e, target) {
    const tab = target.dataset.tab;
    this.setState({ activeTab: tab });
  }

  actionUpdateSettings(e, target) {
    const form = this.$('.settings-form');
    if (form) {
      const formData = new FormData(form);
      const settings = {};
      
      // Handle checkboxes
      ['notifications', 'proximity', 'discoverable', 'newsletter'].forEach(key => {
        settings[key] = formData.has(key);
      });
      
      this.updateSettings(settings);
    }
  }

  actionExportData() {
    this.exportData();
  }

  actionDeleteAccount() {
    this.deleteAccount();
  }

  /**
   * Template for rendering
   */
  template(data) {
    const { profile, editing, activeTab, stats, settings } = data;
    
    return `
      <div class="me-controller">
        <div class="profile-header">
          <div class="profile-avatar">
            ${profile.avatar ? 
              `<img src="${profile.avatar}" alt="${profile.name}" />` :
              (profile.name ? profile.name.charAt(0) : '?')
            }
          </div>
          <div class="profile-info">
            <h1>${profile.name || 'Your Name'}</h1>
            <p class="profile-role">${profile.role || 'Professional'}</p>
            <p class="profile-company">${profile.company || 'Add your company'}</p>
            ${profile.persona ? `<span class="persona-badge ${profile.persona}">${profile.persona}</span>` : ''}
          </div>
          <div class="profile-actions">
            ${!editing ? `
              <button data-action="editProfile" class="edit-btn">Edit Profile</button>
            ` : ''}
          </div>
        </div>
        
        <div class="profile-stats">
          <div class="stat">
            <span class="stat-value">${stats.eventsSaved}</span>
            <span class="stat-label">Events Saved</span>
          </div>
          <div class="stat">
            <span class="stat-value">${stats.connections}</span>
            <span class="stat-label">Connections</span>
          </div>
          <div class="stat">
            <span class="stat-value">${stats.profileViews}</span>
            <span class="stat-label">Profile Views</span>
          </div>
          <div class="stat">
            <span class="stat-value">${stats.invitesSent}</span>
            <span class="stat-label">Invites Sent</span>
          </div>
        </div>
        
        <div class="profile-tabs">
          <button 
            data-action="switchTab" 
            data-tab="profile"
            class="${activeTab === 'profile' ? 'active' : ''}"
          >Profile</button>
          <button 
            data-action="switchTab" 
            data-tab="settings"
            class="${activeTab === 'settings' ? 'active' : ''}"
          >Settings</button>
          <button 
            data-action="switchTab" 
            data-tab="data"
            class="${activeTab === 'data' ? 'active' : ''}"
          >Data & Privacy</button>
        </div>
        
        <div class="tab-content">
          ${this.renderTabContent(activeTab, { profile, editing, settings })}
        </div>
      </div>
    `;
  }

  /**
   * Render tab content
   */
  renderTabContent(activeTab, data) {
    switch (activeTab) {
      case 'profile':
        return this.renderProfileTab(data);
      case 'settings':
        return this.renderSettingsTab(data);
      case 'data':
        return this.renderDataTab(data);
      default:
        return '';
    }
  }

  /**
   * Render profile tab
   */
  renderProfileTab({ profile, editing }) {
    if (editing) {
      return `
        <form class="profile-form">
          <div class="form-group">
            <label>Name</label>
            <input type="text" name="name" value="${profile.name || ''}" required />
          </div>
          
          <div class="form-group">
            <label>Role</label>
            <input type="text" name="role" value="${profile.role || ''}" />
          </div>
          
          <div class="form-group">
            <label>Company</label>
            <input type="text" name="company" value="${profile.company || ''}" />
          </div>
          
          <div class="form-group">
            <label>Persona</label>
            <select name="persona" required>
              <option value="">Select persona</option>
              <option value="developer" ${profile.persona === 'developer' ? 'selected' : ''}>Developer</option>
              <option value="publisher" ${profile.persona === 'publisher' ? 'selected' : ''}>Publisher</option>
              <option value="investor" ${profile.persona === 'investor' ? 'selected' : ''}>Investor</option>
              <option value="service" ${profile.persona === 'service' ? 'selected' : ''}>Service Provider</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Skills (comma-separated)</label>
            <input 
              type="text" 
              name="skills" 
              value="${(profile.skills || []).join(', ')}"
              placeholder="JavaScript, Unity, Game Design..."
            />
          </div>
          
          <div class="form-group">
            <label>Bio</label>
            <textarea name="bio" rows="4">${profile.bio || ''}</textarea>
          </div>
          
          <div class="form-group">
            <label>Website</label>
            <input type="url" name="website" value="${profile.website || ''}" />
          </div>
          
          <div class="form-group">
            <label>Twitter</label>
            <input type="text" name="twitter" value="${profile.twitter || ''}" placeholder="@username" />
          </div>
          
          <div class="form-actions">
            <button type="button" data-action="saveProfile" class="save-btn">Save Changes</button>
            <button type="button" data-action="cancelEdit" class="cancel-btn">Cancel</button>
          </div>
        </form>
      `;
    } else {
      return `
        <div class="profile-display">
          <div class="profile-section">
            <h3>About</h3>
            <p>${profile.bio || 'Add a bio to tell people about yourself.'}</p>
          </div>
          
          ${profile.skills?.length ? `
            <div class="profile-section">
              <h3>Skills</h3>
              <div class="skills-list">
                ${profile.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
              </div>
            </div>
          ` : ''}
          
          <div class="profile-section">
            <h3>Links</h3>
            <div class="profile-links">
              ${profile.website ? `<a href="${profile.website}" target="_blank" rel="noopener">🌐 Website</a>` : ''}
              ${profile.twitter ? `<a href="https://twitter.com/${profile.twitter.replace('@', '')}" target="_blank" rel="noopener">🐦 Twitter</a>` : ''}
            </div>
            ${!profile.website && !profile.twitter ? '<p class="empty-state">No links added</p>' : ''}
          </div>
          
          <div class="profile-section">
            <h3>Activity</h3>
            <ul class="activity-summary">
              <li>Member since ${this.formatDate(profile.createdAt)}</li>
              <li>Last updated ${this.formatDate(profile.updatedAt)}</li>
              <li>Profile ${profile.public ? 'public' : 'private'}</li>
            </ul>
          </div>
        </div>
      `;
    }
  }

  /**
   * Render settings tab
   */
  renderSettingsTab({ settings }) {
    return `
      <form class="settings-form">
        <div class="settings-section">
          <h3>Privacy & Discovery</h3>
          
          <label class="setting-item">
            <input 
              type="checkbox" 
              name="proximity"
              ${settings.proximity ? 'checked' : ''}
            />
            <span class="setting-label">
              <strong>Location Tracking</strong>
              <small>Allow proximity detection to find nearby professionals</small>
            </span>
          </label>
          
          <label class="setting-item">
            <input 
              type="checkbox" 
              name="discoverable"
              ${settings.discoverable ? 'checked' : ''}
            />
            <span class="setting-label">
              <strong>Discoverable Profile</strong>
              <small>Let others find you based on your skills and interests</small>
            </span>
          </label>
        </div>
        
        <div class="settings-section">
          <h3>Notifications</h3>
          
          <label class="setting-item">
            <input 
              type="checkbox" 
              name="notifications"
              ${settings.notifications ? 'checked' : ''}
            />
            <span class="setting-label">
              <strong>Push Notifications</strong>
              <small>Get notified about connection requests and events</small>
            </span>
          </label>
          
          <label class="setting-item">
            <input 
              type="checkbox" 
              name="newsletter"
              ${settings.newsletter ? 'checked' : ''}
            />
            <span class="setting-label">
              <strong>Newsletter</strong>
              <small>Receive weekly updates about networking opportunities</small>
            </span>
          </label>
        </div>
        
        <div class="form-actions">
          <button type="button" data-action="updateSettings" class="save-btn">
            Save Settings
          </button>
        </div>
      </form>
    `;
  }

  /**
   * Render data tab
   */
  renderDataTab() {
    return `
      <div class="data-privacy">
        <div class="data-section">
          <h3>Your Data</h3>
          <p>You have full control over your data. Export or delete it anytime.</p>
          
          <div class="data-actions">
            <button data-action="exportData" class="export-btn">
              📥 Export My Data
            </button>
            <p class="data-description">
              Download all your profile data, connections, and activity as a JSON file.
            </p>
          </div>
        </div>
        
        <div class="data-section danger-zone">
          <h3>Danger Zone</h3>
          <p>These actions cannot be undone.</p>
          
          <div class="data-actions">
            <button data-action="deleteAccount" class="delete-btn">
              🗑️ Delete Account
            </button>
            <p class="data-description">
              Permanently delete your account and all associated data.
            </p>
          </div>
        </div>
        
        <div class="data-section">
          <h3>Privacy Policy</h3>
          <p>
            We respect your privacy and never share your personal information without consent.
            Location data is used only for proximity features and is never stored permanently.
          </p>
          <ul class="privacy-points">
            <li>Your email is never shared with third parties</li>
            <li>Location data is processed locally when possible</li>
            <li>You can disable all tracking features anytime</li>
            <li>Data is encrypted in transit and at rest</li>
          </ul>
        </div>
      </div>
    `;
  }

  /**
   * History integration - render network history with connection cards
   */
  renderHistory(){
    const n = Store.get().network;
    const wrap = document.createElement('div');
    wrap.className = 'stack';

    // summary remains
    wrap.innerHTML = `
      <div class="network-summary">
        <div class="network-stats">
          <div class="stat-item"><span class="stat-value">${n.connections||0}</span><span class="stat-label">Connections</span></div>
          <div class="stat-item"><span class="stat-value">${n.events||0}</span><span class="stat-label">Events</span></div>
          <div class="stat-item"><span class="stat-value">${n.messages||0}</span><span class="stat-label">Messages</span></div>
        </div>
      </div>`;

    // timeline cards (if available)
    (n.timeline||[]).forEach(t => {
      wrap.appendChild(renderConnectionCard({
        id: t.userId, name: t.name, role: t.role, picture: t.picture, domain: t.domain,
        conferenceId: t.conferenceId, conferenceLabel: t.conference,
        eventId: t.eventId, eventLabel: t.event,
        metAtLabel: new Date(t.ts).toLocaleString(),
        tags: t.tags||[], viewerId:'me', connected:t.connected, starred:t.starred
      }));
    });

    document.getElementById('history').replaceChildren(wrap);
  }

  /**
   * Store subscriptions
   */
  setupStoreSubscriptions() {
    this.subscribe('profile', (profile) => {
      this.setState({ profile });
    });
    
    this.subscribe('events.saved', () => {
      this.loadStats();
    });
    
    this.subscribe('connections', () => {
      this.loadStats();
    });
    
    this.subscribe('settings', (settings) => {
      this.setState({ settings });
    });
  }
}

export default MeController;