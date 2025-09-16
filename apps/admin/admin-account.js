/**
 * Admin Account Management System
 * Complete account settings and profile management
 */

class AdminAccount {
  constructor() {
    this.userData = this.loadUserData();
    this.isEditing = false;
  }

  /**
   * Load user data
   */
  loadUserData() {
    const stored = localStorage.getItem('admin_user_data');
    return stored ? JSON.parse(stored) : {
      name: 'Admin',
      email: '',
      role: 'admin',
      company: '',
      department: '',
      permissions: [],
      avatar: 'A',
      theme: 'dark',
      notifications: true,
      twoFactorEnabled: false,
      apiKey: '',
      webhookUrl: '',
      createdAt: null,
      lastLogin: new Date().toISOString()
    };
  }

  /**
   * Save user data
   */
  saveUserData(data) {
    this.userData = { ...this.userData, ...data };
    localStorage.setItem('admin_user_data', JSON.stringify(this.userData));

    // Update UI
    if (window.adminFTUE) {
      window.adminFTUE.updateUIWithUserData();
    }

    this.showNotification('Settings saved successfully');
  }

  /**
   * Create account management interface
   */
  createAccountInterface() {
    return `
      <div class="account-container">
        <!-- Account Header -->
        <div class="account-header">
          <div class="account-title-section">
            <h1 class="account-title">Account Settings</h1>
            <p class="account-subtitle">Manage your profile and preferences</p>
          </div>
          <div class="account-actions">
            <button class="logout-btn" onclick="adminAccount.logout()">
              <span class="logout-icon">🚪</span>
              Logout
            </button>
          </div>
        </div>

        <!-- Account Tabs -->
        <div class="account-tabs">
          <button class="account-tab active" data-tab="profile">
            <span class="tab-icon">👤</span>
            Profile
          </button>
          <button class="account-tab" data-tab="security">
            <span class="tab-icon">🔐</span>
            Security
          </button>
          <button class="account-tab" data-tab="permissions">
            <span class="tab-icon">🔑</span>
            Permissions
          </button>
          <button class="account-tab" data-tab="preferences">
            <span class="tab-icon">⚙️</span>
            Preferences
          </button>
          <button class="account-tab" data-tab="api">
            <span class="tab-icon">🔌</span>
            API Settings
          </button>
          <button class="account-tab" data-tab="activity">
            <span class="tab-icon">📊</span>
            Activity
          </button>
        </div>

        <!-- Account Content -->
        <div class="account-content">
          <div class="account-panel active" id="profile-panel">
            ${this.getProfilePanel()}
          </div>
          <div class="account-panel" id="security-panel">
            ${this.getSecurityPanel()}
          </div>
          <div class="account-panel" id="permissions-panel">
            ${this.getPermissionsPanel()}
          </div>
          <div class="account-panel" id="preferences-panel">
            ${this.getPreferencesPanel()}
          </div>
          <div class="account-panel" id="api-panel">
            ${this.getAPIPanel()}
          </div>
          <div class="account-panel" id="activity-panel">
            ${this.getActivityPanel()}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Profile panel content
   */
  getProfilePanel() {
    return `
      <div class="panel-section">
        <h2 class="section-title">Profile Information</h2>

        <div class="profile-avatar-section">
          <div class="avatar-large">
            <span class="avatar-text">${this.userData.avatar}</span>
          </div>
          <div class="avatar-actions">
            <button class="btn-secondary" onclick="adminAccount.changeAvatar()">
              Change Avatar
            </button>
            <p class="avatar-hint">Click to upload a photo or change initial</p>
          </div>
        </div>

        <div class="profile-form">
          <div class="form-row">
            <div class="form-group">
              <label>Full Name</label>
              <input type="text" id="profile-name" value="${this.userData.name}" ${!this.isEditing ? 'disabled' : ''} />
            </div>
            <div class="form-group">
              <label>Email Address</label>
              <input type="email" id="profile-email" value="${this.userData.email}" ${!this.isEditing ? 'disabled' : ''} />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Role</label>
              <select id="profile-role" ${!this.isEditing ? 'disabled' : ''}>
                <option value="super-admin" ${this.userData.role === 'super-admin' ? 'selected' : ''}>Super Admin</option>
                <option value="admin" ${this.userData.role === 'admin' ? 'selected' : ''}>Administrator</option>
                <option value="manager" ${this.userData.role === 'manager' ? 'selected' : ''}>Manager</option>
                <option value="analyst" ${this.userData.role === 'analyst' ? 'selected' : ''}>Analyst</option>
                <option value="developer" ${this.userData.role === 'developer' ? 'selected' : ''}>Developer</option>
              </select>
            </div>
            <div class="form-group">
              <label>Department</label>
              <input type="text" id="profile-department" value="${this.userData.department}" ${!this.isEditing ? 'disabled' : ''} />
            </div>
          </div>

          <div class="form-group">
            <label>Company</label>
            <input type="text" id="profile-company" value="${this.userData.company}" ${!this.isEditing ? 'disabled' : ''} />
          </div>

          <div class="form-actions">
            ${this.isEditing ? `
              <button class="btn-secondary" onclick="adminAccount.cancelEdit()">Cancel</button>
              <button class="btn-primary" onclick="adminAccount.saveProfile()">Save Changes</button>
            ` : `
              <button class="btn-primary" onclick="adminAccount.editProfile()">
                <span class="edit-icon">✏️</span>
                Edit Profile
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Security panel content
   */
  getSecurityPanel() {
    return `
      <div class="panel-section">
        <h2 class="section-title">Security Settings</h2>

        <div class="security-item">
          <div class="security-header">
            <h3>Password</h3>
            <button class="btn-secondary small" onclick="adminAccount.changePassword()">Change Password</button>
          </div>
          <p class="security-desc">Last changed: ${this.userData.passwordLastChanged || 'Never'}</p>
        </div>

        <div class="security-item">
          <div class="security-header">
            <h3>Two-Factor Authentication</h3>
            <div class="toggle-switch">
              <input type="checkbox" id="2fa-toggle" ${this.userData.twoFactorEnabled ? 'checked' : ''}
                     onchange="adminAccount.toggle2FA(this.checked)" />
              <label for="2fa-toggle"></label>
            </div>
          </div>
          <p class="security-desc">
            ${this.userData.twoFactorEnabled
              ? 'Two-factor authentication is enabled for enhanced security'
              : 'Enable two-factor authentication for additional security'}
          </p>
        </div>

        <div class="security-item">
          <div class="security-header">
            <h3>Login Sessions</h3>
            <button class="btn-secondary small" onclick="adminAccount.viewSessions()">View All Sessions</button>
          </div>
          <p class="security-desc">You're currently logged in from 1 device</p>
        </div>

        <div class="security-item">
          <div class="security-header">
            <h3>Account Recovery</h3>
            <button class="btn-secondary small" onclick="adminAccount.setupRecovery()">Configure</button>
          </div>
          <p class="security-desc">Set up recovery email and backup codes</p>
        </div>

        <div class="danger-zone">
          <h3 class="danger-title">Danger Zone</h3>
          <div class="danger-actions">
            <button class="btn-danger" onclick="adminAccount.deactivateAccount()">
              Deactivate Account
            </button>
            <button class="btn-danger" onclick="adminAccount.deleteAccount()">
              Delete Account
            </button>
          </div>
          <p class="danger-warning">These actions are irreversible. Please proceed with caution.</p>
        </div>
      </div>
    `;
  }

  /**
   * Permissions panel content
   */
  getPermissionsPanel() {
    const allPermissions = [
      { id: 'matchmaking', label: 'Matchmaking Management', desc: 'Create and manage company matches', icon: '🤝' },
      { id: 'companies', label: 'Company Management', desc: 'View and edit company profiles', icon: '🏢' },
      { id: 'analytics', label: 'Analytics Access', desc: 'View platform analytics and metrics', icon: '📊' },
      { id: 'users', label: 'User Management', desc: 'Manage user accounts and permissions', icon: '👥' },
      { id: 'system', label: 'System Settings', desc: 'Configure system-wide settings', icon: '⚙️' },
      { id: 'api', label: 'API Management', desc: 'Manage API keys and webhooks', icon: '🔌' },
      { id: 'billing', label: 'Billing & Subscriptions', desc: 'Manage billing and payment settings', icon: '💳' },
      { id: 'logs', label: 'System Logs', desc: 'View system logs and audit trails', icon: '📝' }
    ];

    return `
      <div class="panel-section">
        <h2 class="section-title">Access Permissions</h2>
        <p class="section-desc">Manage what areas of the admin panel you can access</p>

        <div class="permissions-list">
          ${allPermissions.map(perm => `
            <div class="permission-item ${this.userData.permissions?.includes(perm.id) ? 'active' : ''}">
              <div class="permission-icon">${perm.icon}</div>
              <div class="permission-info">
                <h4>${perm.label}</h4>
                <p>${perm.desc}</p>
              </div>
              <div class="permission-toggle">
                <input type="checkbox" id="perm-${perm.id}"
                       ${this.userData.permissions?.includes(perm.id) ? 'checked' : ''}
                       onchange="adminAccount.togglePermission('${perm.id}', this.checked)" />
                <label for="perm-${perm.id}"></label>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="permissions-footer">
          <p class="permissions-note">
            <span class="note-icon">ℹ️</span>
            Some permissions may require approval from a super administrator
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Preferences panel content
   */
  getPreferencesPanel() {
    return `
      <div class="panel-section">
        <h2 class="section-title">Preferences</h2>

        <div class="preference-group">
          <h3>Appearance</h3>

          <div class="preference-item">
            <label>Theme</label>
            <div class="theme-selector">
              <button class="theme-option ${this.userData.theme === 'dark' ? 'active' : ''}"
                      onclick="adminAccount.setTheme('dark')">
                <span class="theme-icon">🌙</span>
                Dark
              </button>
              <button class="theme-option ${this.userData.theme === 'light' ? 'active' : ''}"
                      onclick="adminAccount.setTheme('light')">
                <span class="theme-icon">☀️</span>
                Light
              </button>
              <button class="theme-option ${this.userData.theme === 'auto' ? 'active' : ''}"
                      onclick="adminAccount.setTheme('auto')">
                <span class="theme-icon">🔄</span>
                Auto
              </button>
            </div>
          </div>

          <div class="preference-item">
            <label>Compact Mode</label>
            <div class="toggle-switch">
              <input type="checkbox" id="compact-toggle" ${this.userData.compactMode ? 'checked' : ''}
                     onchange="adminAccount.toggleCompactMode(this.checked)" />
              <label for="compact-toggle"></label>
            </div>
          </div>
        </div>

        <div class="preference-group">
          <h3>Notifications</h3>

          <div class="preference-item">
            <label>Email Notifications</label>
            <div class="toggle-switch">
              <input type="checkbox" id="email-notif" ${this.userData.emailNotifications ? 'checked' : ''}
                     onchange="adminAccount.toggleEmailNotifications(this.checked)" />
              <label for="email-notif"></label>
            </div>
          </div>

          <div class="preference-item">
            <label>Browser Notifications</label>
            <div class="toggle-switch">
              <input type="checkbox" id="browser-notif" ${this.userData.browserNotifications ? 'checked' : ''}
                     onchange="adminAccount.toggleBrowserNotifications(this.checked)" />
              <label for="browser-notif"></label>
            </div>
          </div>

          <div class="preference-item">
            <label>Activity Digest</label>
            <select id="digest-frequency" onchange="adminAccount.setDigestFrequency(this.value)">
              <option value="daily" ${this.userData.digestFrequency === 'daily' ? 'selected' : ''}>Daily</option>
              <option value="weekly" ${this.userData.digestFrequency === 'weekly' ? 'selected' : ''}>Weekly</option>
              <option value="monthly" ${this.userData.digestFrequency === 'monthly' ? 'selected' : ''}>Monthly</option>
              <option value="never" ${this.userData.digestFrequency === 'never' ? 'selected' : ''}>Never</option>
            </select>
          </div>
        </div>

        <div class="preference-group">
          <h3>Data & Privacy</h3>

          <div class="preference-item">
            <label>Activity Tracking</label>
            <div class="toggle-switch">
              <input type="checkbox" id="tracking-toggle" ${this.userData.activityTracking !== false ? 'checked' : ''}
                     onchange="adminAccount.toggleTracking(this.checked)" />
              <label for="tracking-toggle"></label>
            </div>
          </div>

          <div class="preference-actions">
            <button class="btn-secondary" onclick="adminAccount.exportData()">
              <span class="export-icon">📥</span>
              Export My Data
            </button>
            <button class="btn-secondary" onclick="adminAccount.clearCache()">
              <span class="clear-icon">🗑️</span>
              Clear Cache
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * API Settings panel
   */
  getAPIPanel() {
    return `
      <div class="panel-section">
        <h2 class="section-title">API Settings</h2>

        <div class="api-section">
          <h3>API Key</h3>
          <div class="api-key-container">
            <input type="text" id="api-key" value="${this.userData.apiKey || 'No API key generated'}"
                   readonly class="api-key-input" />
            <button class="btn-secondary" onclick="adminAccount.copyAPIKey()">
              <span class="copy-icon">📋</span>
              Copy
            </button>
            <button class="btn-primary" onclick="adminAccount.generateAPIKey()">
              Generate New
            </button>
          </div>
          <p class="api-note">Use this key to authenticate API requests</p>
        </div>

        <div class="api-section">
          <h3>Webhook URL</h3>
          <div class="webhook-container">
            <input type="url" id="webhook-url" value="${this.userData.webhookUrl || ''}"
                   placeholder="https://your-domain.com/webhook" />
            <button class="btn-primary" onclick="adminAccount.saveWebhook()">
              Save
            </button>
          </div>
          <p class="api-note">Receive real-time notifications at this endpoint</p>
        </div>

        <div class="api-section">
          <h3>Rate Limits</h3>
          <div class="rate-limits">
            <div class="rate-limit-item">
              <span class="limit-label">Requests per minute:</span>
              <span class="limit-value">60</span>
            </div>
            <div class="rate-limit-item">
              <span class="limit-label">Requests per hour:</span>
              <span class="limit-value">1,000</span>
            </div>
            <div class="rate-limit-item">
              <span class="limit-label">Requests per day:</span>
              <span class="limit-value">10,000</span>
            </div>
          </div>
        </div>

        <div class="api-section">
          <h3>API Documentation</h3>
          <div class="api-docs-links">
            <a href="#" class="docs-link">
              <span class="docs-icon">📚</span>
              API Reference
            </a>
            <a href="#" class="docs-link">
              <span class="docs-icon">🚀</span>
              Quick Start Guide
            </a>
            <a href="#" class="docs-link">
              <span class="docs-icon">💡</span>
              Examples
            </a>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Activity panel content
   */
  getActivityPanel() {
    const activities = [
      { action: 'Logged in', time: 'Just now', icon: '🔐' },
      { action: 'Updated profile', time: '2 hours ago', icon: '👤' },
      { action: 'Viewed matchmaking demo', time: '3 hours ago', icon: '🤝' },
      { action: 'Generated API key', time: '1 day ago', icon: '🔑' },
      { action: 'Changed permissions', time: '2 days ago', icon: '⚙️' }
    ];

    return `
      <div class="panel-section">
        <h2 class="section-title">Recent Activity</h2>

        <div class="activity-stats">
          <div class="stat-card">
            <div class="stat-value">127</div>
            <div class="stat-label">Total Actions</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">23</div>
            <div class="stat-label">This Week</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${this.userData.lastLogin ? new Date(this.userData.lastLogin).toLocaleDateString() : 'Today'}</div>
            <div class="stat-label">Last Login</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${this.userData.createdAt ? new Date(this.userData.createdAt).toLocaleDateString() : 'Unknown'}</div>
            <div class="stat-label">Account Created</div>
          </div>
        </div>

        <div class="activity-list">
          <h3>Activity Log</h3>
          ${activities.map(activity => `
            <div class="activity-item">
              <div class="activity-icon">${activity.icon}</div>
              <div class="activity-info">
                <div class="activity-action">${activity.action}</div>
                <div class="activity-time">${activity.time}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="activity-footer">
          <button class="btn-secondary" onclick="adminAccount.downloadActivityLog()">
            <span class="download-icon">📥</span>
            Download Full Log
          </button>
        </div>
      </div>
    `;
  }

  // Action methods

  editProfile() {
    this.isEditing = true;
    document.getElementById('profile-panel').innerHTML = this.getProfilePanel();
  }

  cancelEdit() {
    this.isEditing = false;
    document.getElementById('profile-panel').innerHTML = this.getProfilePanel();
  }

  saveProfile() {
    const name = document.getElementById('profile-name').value;
    const email = document.getElementById('profile-email').value;
    const role = document.getElementById('profile-role').value;
    const department = document.getElementById('profile-department').value;
    const company = document.getElementById('profile-company').value;

    this.saveUserData({
      name,
      email,
      role,
      department,
      company,
      avatar: name.charAt(0).toUpperCase()
    });

    this.isEditing = false;
    document.getElementById('profile-panel').innerHTML = this.getProfilePanel();
  }

  togglePermission(permissionId, enabled) {
    const permissions = this.userData.permissions || [];
    if (enabled && !permissions.includes(permissionId)) {
      permissions.push(permissionId);
    } else if (!enabled) {
      const index = permissions.indexOf(permissionId);
      if (index > -1) permissions.splice(index, 1);
    }
    this.saveUserData({ permissions });
  }

  setTheme(theme) {
    this.saveUserData({ theme });
    document.body.className = `theme-${theme}`;

    // Update theme selector
    document.querySelectorAll('.theme-option').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.toLowerCase().includes(theme));
    });
  }

  generateAPIKey() {
    const key = 'sk_live_' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0')).join('');

    this.saveUserData({ apiKey: key });
    document.getElementById('api-key').value = key;
    this.showNotification('New API key generated successfully');
  }

  copyAPIKey() {
    const input = document.getElementById('api-key');
    input.select();
    document.execCommand('copy');
    this.showNotification('API key copied to clipboard');
  }

  logout() {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('admin_ftue_completed');
      this.showNotification('Logged out successfully');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'admin-notification success';
    notification.innerHTML = `
      <span class="notification-icon">✓</span>
      <span class="notification-text">${message}</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 100);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Initialize tab switching
  initTabs() {
    document.addEventListener('click', (e) => {
      if (e.target.matches('.account-tab')) {
        // Update active tab
        document.querySelectorAll('.account-tab').forEach(tab => {
          tab.classList.remove('active');
        });
        e.target.classList.add('active');

        // Update active panel
        const tabName = e.target.dataset.tab;
        document.querySelectorAll('.account-panel').forEach(panel => {
          panel.classList.remove('active');
        });
        document.getElementById(`${tabName}-panel`).classList.add('active');
      }
    });
  }
}

// Create global instance
window.adminAccount = new AdminAccount();

console.log('⚙️ Admin Account Management loaded');