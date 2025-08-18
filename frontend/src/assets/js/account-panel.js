/**
 * Account Panel
 * User profile and settings management
 */

class AccountPanel {
  constructor() {
    this.panel = null;
    this.userData = this.loadUserData();
    this.isActive = false;
  }

  init() {
    this.createPanel();
    this.setupHashListener();
  }

  loadUserData() {
    // Load from localStorage or use defaults
    return {
      name: localStorage.getItem('user_name') || '',
      email: localStorage.getItem('user_email') || '',
      company: localStorage.getItem('user_company') || '',
      role: localStorage.getItem('user_role') || '',
      linkedin: localStorage.getItem('user_linkedin') || '',
      savedEvents: JSON.parse(localStorage.getItem('saved_events') || '[]'),
      invitesSent: JSON.parse(localStorage.getItem('invites_sent') || '[]').length,
      connectionsCount: JSON.parse(localStorage.getItem('connections') || '[]').length
    };
  }

  createPanel() {
    if (document.getElementById('panel-account')) return;

    this.panel = document.createElement('section');
    this.panel.id = 'panel-account';
    this.panel.className = 'panel panel--overlay';
    this.panel.innerHTML = `
      <div class="account-panel-header">
        <button class="btn-close-panel" data-action="close-panel" aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
          </svg>
        </button>
        <h1>Account</h1>
        <button class="btn-save" data-action="save">Save</button>
      </div>
      <div class="account-panel-body">
        ${this.renderContent()}
      </div>
    `;

    document.body.appendChild(this.panel);
    this.bindEvents();
  }

  renderContent() {
    return `
      <div class="account-content">
        <!-- Profile Card -->
        <div class="card-modern account-profile-card">
          <div class="card-modern__header">
            <div class="account-avatar-section">
              <div class="account-avatar">
                ${this.userData.name ? this.userData.name[0].toUpperCase() : '👤'}
              </div>
              <div class="account-basic-info">
                <h3 class="card-modern__title">${this.userData.name || 'Gaming Professional'}</h3>
                <div class="card-modern__subtitle">${this.userData.role || 'Set your role'} ${this.userData.company ? `at ${this.userData.company}` : ''}</div>
              </div>
            </div>
            <button class="btn-avatar-change">Change Photo</button>
          </div>
          
          <div class="card-modern__body">
            <div class="account-form">
              <div class="form-row">
                <div class="form-group">
                  <label for="account-name">Name</label>
                  <input type="text" id="account-name" value="${this.escapeHtml(this.userData.name)}" placeholder="Your name">
                </div>
                <div class="form-group">
                  <label for="account-email">Email</label>
                  <input type="email" id="account-email" value="${this.escapeHtml(this.userData.email)}" placeholder="your@email.com">
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="account-company">Company</label>
                  <input type="text" id="account-company" value="${this.escapeHtml(this.userData.company)}" placeholder="Your company">
                </div>
                <div class="form-group">
                  <label for="account-role">Role</label>
                  <select id="account-role">
                    <option value="">Select role...</option>
                    <option value="developer" ${this.userData.role === 'developer' ? 'selected' : ''}>Developer</option>
                    <option value="designer" ${this.userData.role === 'designer' ? 'selected' : ''}>Designer</option>
                    <option value="publisher" ${this.userData.role === 'publisher' ? 'selected' : ''}>Publisher</option>
                    <option value="investor" ${this.userData.role === 'investor' ? 'selected' : ''}>Investor</option>
                    <option value="media" ${this.userData.role === 'media' ? 'selected' : ''}>Media</option>
                    <option value="other" ${this.userData.role === 'other' ? 'selected' : ''}>Other</option>
                  </select>
                </div>
              </div>
              
              <div class="form-group">
                <label for="account-linkedin">LinkedIn Profile</label>
                <input type="url" id="account-linkedin" value="${this.escapeHtml(this.userData.linkedin)}" placeholder="https://linkedin.com/in/...">
              </div>
            </div>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="card-modern-grid stats-grid">
          <div class="card-modern stats-card">
            <div class="card-modern__header">
              <div class="stats-icon">📅</div>
              <h3 class="card-modern__title">Events Saved</h3>
            </div>
            <div class="card-modern__body">
              <div class="stats-number">${this.userData.savedEvents.length}</div>
              <div class="stats-label">Ready for Gamescom</div>
            </div>
          </div>

          <div class="card-modern stats-card">
            <div class="card-modern__header">
              <div class="stats-icon">📧</div>
              <h3 class="card-modern__title">Invites Sent</h3>
            </div>
            <div class="card-modern__body">
              <div class="stats-number">${this.userData.invitesSent}</div>
              <div class="stats-label">Networking power</div>
            </div>
          </div>

          <div class="card-modern stats-card">
            <div class="card-modern__header">
              <div class="stats-icon">👥</div>
              <h3 class="card-modern__title">Connections</h3>
            </div>
            <div class="card-modern__body">
              <div class="stats-number">${this.userData.connectionsCount}</div>
              <div class="stats-label">Professional network</div>
            </div>
          </div>
        </div>

        <!-- Settings Card -->
        <div class="card-modern">
          <div class="card-modern__header">
            <div class="settings-icon">⚙️</div>
            <h3 class="card-modern__title">App Settings</h3>
            <div class="card-modern__subtitle">Customize your experience</div>
          </div>
          
          <div class="card-modern__body">
            <div class="settings-list">
              <label class="setting-item">
                <div class="setting-info">
                  <span class="setting-name">Push Notifications</span>
                  <span class="setting-desc">Get alerts for new invites and events</span>
                </div>
                <input type="checkbox" id="setting-notifications" checked>
                <span class="setting-toggle"></span>
              </label>
              
              <label class="setting-item">
                <div class="setting-info">
                  <span class="setting-name">Location Services</span>
                  <span class="setting-desc">Find nearby events and networking opportunities</span>
                </div>
                <input type="checkbox" id="setting-location" checked>
                <span class="setting-toggle"></span>
              </label>
              
              <label class="setting-item">
                <div class="setting-info">
                  <span class="setting-name">Calendar Auto-Sync</span>
                  <span class="setting-desc">Automatically add saved events to your calendar</span>
                </div>
                <input type="checkbox" id="setting-calendar-sync" checked>
                <span class="setting-toggle"></span>
              </label>
              
              <label class="setting-item">
                <div class="setting-info">
                  <span class="setting-name">Public Profile</span>
                  <span class="setting-desc">Let other attendees find and connect with you</span>
                </div>
                <input type="checkbox" id="setting-public-profile">
                <span class="setting-toggle"></span>
              </label>
            </div>
          </div>
        </div>

        <!-- Actions Card -->
        <div class="card-modern">
          <div class="card-modern__header">
            <h3 class="card-modern__title">Account Actions</h3>
            <div class="card-modern__subtitle">Manage your data and account</div>
          </div>
          
          <div class="card-modern__footer account-actions-footer">
            <button class="card-modern__action card-modern__action--secondary" data-action="export">
              📄 Export Data
            </button>
            <button class="card-modern__action card-modern__action--secondary" data-action="clear-cache">
              🗑️ Clear Cache
            </button>
            <button class="card-modern__action account-action-danger" data-action="sign-out">
              🚪 Sign Out
            </button>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // Close button
    this.panel.querySelector('[data-action="close-panel"]').addEventListener('click', () => {
      this.close();
      location.hash = '#/home';
    });

    // Save button
    this.panel.querySelector('[data-action="save"]').addEventListener('click', () => {
      this.saveProfile();
    });

    // Action buttons
    this.panel.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      
      switch (action) {
        case 'export':
          this.exportData();
          break;
        case 'clear-cache':
          this.clearCache();
          break;
        case 'sign-out':
          this.signOut();
          break;
      }
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isActive) {
        this.close();
        location.hash = '#/home';
      }
    });
  }

  setupHashListener() {
    const checkHash = () => {
      const shouldShow = location.hash === '#/me' || location.hash === '#/account';
      if (shouldShow && !this.isActive) {
        this.open();
      } else if (!shouldShow && this.isActive) {
        this.close();
      }
    };

    window.addEventListener('hashchange', checkHash);
    checkHash();
  }

  open() {
    this.panel.classList.add('panel--active');
    this.isActive = true;
    this.userData = this.loadUserData();
    this.updateContent();
  }

  close() {
    this.panel.classList.remove('panel--active');
    this.isActive = false;
  }

  updateContent() {
    const body = this.panel.querySelector('.account-panel-body');
    if (body) {
      body.innerHTML = this.renderContent();
    }
  }

  saveProfile() {
    // Get form values
    const name = document.getElementById('account-name').value;
    const email = document.getElementById('account-email').value;
    const company = document.getElementById('account-company').value;
    const role = document.getElementById('account-role').value;
    const linkedin = document.getElementById('account-linkedin').value;

    // Save to localStorage
    localStorage.setItem('user_name', name);
    localStorage.setItem('user_email', email);
    localStorage.setItem('user_company', company);
    localStorage.setItem('user_role', role);
    localStorage.setItem('user_linkedin', linkedin);

    // Update userData
    this.userData = this.loadUserData();

    // Show success message
    this.showMessage('Profile saved successfully!', 'success');
  }

  exportData() {
    const data = {
      profile: this.userData,
      savedEvents: JSON.parse(localStorage.getItem('saved_events') || '[]'),
      invites: JSON.parse(localStorage.getItem('invites_sent') || '[]'),
      connections: JSON.parse(localStorage.getItem('connections') || '[]'),
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gamescom-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    this.showMessage('Data exported successfully!', 'success');
  }

  clearCache() {
    if (confirm('Clear all cached data? This cannot be undone.')) {
      // Clear service worker caches
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }

      // Clear memory caches
      if (window.apiIntegration) {
        window.apiIntegration.cache.clear();
      }

      this.showMessage('Cache cleared successfully!', 'success');
    }
  }

  signOut() {
    if (confirm('Sign out and clear all local data?')) {
      // Clear all localStorage
      localStorage.clear();
      
      // Redirect to home
      location.hash = '#/home';
      location.reload();
    }
  }

  showMessage(message, type = 'info') {
    const msg = document.createElement('div');
    msg.className = `account-message ${type}`;
    msg.textContent = message;
    msg.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === 'success' ? 'rgba(34, 197, 94, 0.9)' : 'rgba(59, 130, 246, 0.9)'};
      color: white;
      border-radius: 8px;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.accountPanel = new AccountPanel();
    window.accountPanel.init();
  });
} else {
  window.accountPanel = new AccountPanel();
  window.accountPanel.init();
}

export default AccountPanel;