/**
 * Admin Panel FTUE (First Time User Experience) & Account Management
 * Professional onboarding and account system for admin users
 */

class AdminFTUE {
  constructor() {
    this.storageKey = 'admin_user_data';
    this.ftueKey = 'admin_ftue_completed';
    this.currentStep = 1;
    this.totalSteps = 4;
    this.userData = this.loadUserData();
  }

  /**
   * Check if FTUE should be shown
   */
  shouldShowFTUE() {
    return !localStorage.getItem(this.ftueKey) || !this.userData.name;
  }

  /**
   * Load user data from localStorage
   */
  loadUserData() {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : {
      name: '',
      email: '',
      role: '',
      company: '',
      department: '',
      permissions: [],
      avatar: '',
      theme: 'dark',
      notifications: true,
      createdAt: null,
      lastLogin: null
    };
  }

  /**
   * Save user data
   */
  saveUserData(data) {
    this.userData = { ...this.userData, ...data };
    localStorage.setItem(this.storageKey, JSON.stringify(this.userData));
  }

  /**
   * Start FTUE flow
   */
  startFTUE() {
    this.currentStep = 1;
    this.showFTUEModal();
  }

  /**
   * Show FTUE modal with current step
   */
  showFTUEModal() {
    const modal = document.createElement('div');
    modal.className = 'ftue-modal';
    modal.innerHTML = this.getFTUEContent();
    document.body.appendChild(modal);

    // Animate in
    setTimeout(() => {
      modal.classList.add('active');
    }, 100);

    this.attachFTUEHandlers();
  }

  /**
   * Get FTUE content based on current step
   */
  getFTUEContent() {
    const steps = {
      1: this.getWelcomeStep(),
      2: this.getProfileStep(),
      3: this.getPermissionsStep(),
      4: this.getCompletionStep()
    };

    return `
      <div class="ftue-overlay"></div>
      <div class="ftue-container">
        <div class="ftue-header">
          <div class="ftue-progress">
            <div class="ftue-progress-bar">
              <div class="ftue-progress-fill" style="width: ${(this.currentStep / this.totalSteps) * 100}%"></div>
            </div>
            <div class="ftue-progress-text">Step ${this.currentStep} of ${this.totalSteps}</div>
          </div>
        </div>
        <div class="ftue-content">
          ${steps[this.currentStep]}
        </div>
      </div>
    `;
  }

  /**
   * Welcome step content
   */
  getWelcomeStep() {
    return `
      <div class="ftue-step welcome-step">
        <div class="ftue-icon">🎯</div>
        <h1 class="ftue-title">Welcome to Admin Panel</h1>
        <p class="ftue-subtitle">Let's set up your admin account in just a few steps</p>

        <div class="ftue-features">
          <div class="ftue-feature">
            <span class="feature-icon">🤝</span>
            <span class="feature-text">Manage Matchmaking</span>
          </div>
          <div class="ftue-feature">
            <span class="feature-icon">📊</span>
            <span class="feature-text">View Analytics</span>
          </div>
          <div class="ftue-feature">
            <span class="feature-icon">🏢</span>
            <span class="feature-text">Company Management</span>
          </div>
          <div class="ftue-feature">
            <span class="feature-icon">🔧</span>
            <span class="feature-text">System Control</span>
          </div>
        </div>

        <div class="ftue-actions">
          <button class="ftue-btn primary" onclick="adminFTUE.nextStep()">
            Get Started
            <span class="btn-arrow">→</span>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Profile setup step
   */
  getProfileStep() {
    return `
      <div class="ftue-step profile-step">
        <h2 class="ftue-title">Set Up Your Profile</h2>
        <p class="ftue-subtitle">Tell us about yourself</p>

        <div class="ftue-form">
          <div class="form-group">
            <label for="admin-name">Your Name</label>
            <input type="text" id="admin-name" placeholder="John Doe" value="${this.userData.name || ''}" />
          </div>

          <div class="form-group">
            <label for="admin-email">Email Address</label>
            <input type="email" id="admin-email" placeholder="admin@company.com" value="${this.userData.email || ''}" />
          </div>

          <div class="form-group">
            <label for="admin-role">Your Role</label>
            <select id="admin-role">
              <option value="">Select Role</option>
              <option value="super-admin" ${this.userData.role === 'super-admin' ? 'selected' : ''}>Super Admin</option>
              <option value="admin" ${this.userData.role === 'admin' ? 'selected' : ''}>Administrator</option>
              <option value="manager" ${this.userData.role === 'manager' ? 'selected' : ''}>Manager</option>
              <option value="analyst" ${this.userData.role === 'analyst' ? 'selected' : ''}>Analyst</option>
              <option value="developer" ${this.userData.role === 'developer' ? 'selected' : ''}>Developer</option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="admin-company">Company</label>
              <input type="text" id="admin-company" placeholder="Your Company" value="${this.userData.company || ''}" />
            </div>

            <div class="form-group">
              <label for="admin-department">Department</label>
              <input type="text" id="admin-department" placeholder="e.g., Engineering" value="${this.userData.department || ''}" />
            </div>
          </div>
        </div>

        <div class="ftue-actions">
          <button class="ftue-btn secondary" onclick="adminFTUE.previousStep()">
            <span class="btn-arrow">←</span>
            Back
          </button>
          <button class="ftue-btn primary" onclick="adminFTUE.saveProfile()">
            Continue
            <span class="btn-arrow">→</span>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Permissions step
   */
  getPermissionsStep() {
    const permissions = [
      { id: 'matchmaking', label: 'Matchmaking Management', icon: '🤝', checked: true },
      { id: 'companies', label: 'Company Management', icon: '🏢', checked: true },
      { id: 'analytics', label: 'View Analytics', icon: '📊', checked: true },
      { id: 'users', label: 'User Management', icon: '👥', checked: false },
      { id: 'system', label: 'System Settings', icon: '⚙️', checked: false },
      { id: 'api', label: 'API Access', icon: '🔌', checked: false }
    ];

    return `
      <div class="ftue-step permissions-step">
        <h2 class="ftue-title">Configure Permissions</h2>
        <p class="ftue-subtitle">Select the areas you need access to</p>

        <div class="permissions-grid">
          ${permissions.map(perm => `
            <div class="permission-card ${this.userData.permissions?.includes(perm.id) || perm.checked ? 'selected' : ''}"
                 data-permission="${perm.id}">
              <div class="permission-icon">${perm.icon}</div>
              <div class="permission-label">${perm.label}</div>
              <div class="permission-checkbox">
                <input type="checkbox" id="perm-${perm.id}"
                       ${this.userData.permissions?.includes(perm.id) || perm.checked ? 'checked' : ''} />
                <label for="perm-${perm.id}"></label>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="ftue-note">
          <span class="note-icon">ℹ️</span>
          <span class="note-text">Permissions can be modified later in account settings</span>
        </div>

        <div class="ftue-actions">
          <button class="ftue-btn secondary" onclick="adminFTUE.previousStep()">
            <span class="btn-arrow">←</span>
            Back
          </button>
          <button class="ftue-btn primary" onclick="adminFTUE.savePermissions()">
            Continue
            <span class="btn-arrow">→</span>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Completion step
   */
  getCompletionStep() {
    return `
      <div class="ftue-step completion-step">
        <div class="ftue-success-icon">✨</div>
        <h1 class="ftue-title">You're All Set!</h1>
        <p class="ftue-subtitle">Welcome aboard, ${this.userData.name || 'Admin'}!</p>

        <div class="setup-summary">
          <h3>Your Setup Summary:</h3>
          <div class="summary-items">
            <div class="summary-item">
              <span class="summary-icon">👤</span>
              <span class="summary-text">${this.userData.name || 'Admin'}</span>
            </div>
            <div class="summary-item">
              <span class="summary-icon">💼</span>
              <span class="summary-text">${this.userData.role || 'Administrator'}</span>
            </div>
            <div class="summary-item">
              <span class="summary-icon">🏢</span>
              <span class="summary-text">${this.userData.company || 'Your Company'}</span>
            </div>
            <div class="summary-item">
              <span class="summary-icon">🔐</span>
              <span class="summary-text">${this.userData.permissions?.length || 3} permissions granted</span>
            </div>
          </div>
        </div>

        <div class="quick-tips">
          <h3>Quick Tips to Get Started:</h3>
          <ul>
            <li>Explore the <strong>Algorithm Demo</strong> to see matchmaking in action</li>
            <li>Check the <strong>Dashboard</strong> for real-time metrics</li>
            <li>Visit <strong>Company Management</strong> to view profiles</li>
            <li>Your account settings are in the top-right corner</li>
          </ul>
        </div>

        <div class="ftue-actions">
          <button class="ftue-btn primary large" onclick="adminFTUE.completeFTUE()">
            Launch Admin Panel
            <span class="btn-arrow">→</span>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Save profile data
   */
  saveProfile() {
    const name = document.getElementById('admin-name').value;
    const email = document.getElementById('admin-email').value;
    const role = document.getElementById('admin-role').value;
    const company = document.getElementById('admin-company').value;
    const department = document.getElementById('admin-department').value;

    if (!name || !email) {
      this.showError('Please fill in your name and email');
      return;
    }

    this.saveUserData({
      name,
      email,
      role: role || 'admin',
      company,
      department,
      avatar: name.charAt(0).toUpperCase()
    });

    this.nextStep();
  }

  /**
   * Save permissions
   */
  savePermissions() {
    const permissions = [];
    document.querySelectorAll('.permission-card input:checked').forEach(input => {
      const permId = input.id.replace('perm-', '');
      permissions.push(permId);
    });

    this.saveUserData({ permissions });
    this.nextStep();
  }

  /**
   * Navigate to next step
   */
  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.updateFTUE();
    }
  }

  /**
   * Navigate to previous step
   */
  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateFTUE();
    }
  }

  /**
   * Update FTUE modal content
   */
  updateFTUE() {
    const modal = document.querySelector('.ftue-modal');
    if (modal) {
      modal.innerHTML = this.getFTUEContent();
      this.attachFTUEHandlers();
    }
  }

  /**
   * Complete FTUE
   */
  completeFTUE() {
    localStorage.setItem(this.ftueKey, 'true');
    this.saveUserData({
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    });

    // Update UI with user data
    this.updateUIWithUserData();

    // Remove modal
    const modal = document.querySelector('.ftue-modal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    }

    // Show success notification
    this.showNotification('Welcome to Admin Panel! Your account is ready.');
  }

  /**
   * Skip FTUE (for returning users)
   */
  skipFTUE() {
    const modal = document.querySelector('.ftue-modal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    }
  }

  /**
   * Attach event handlers for FTUE
   */
  attachFTUEHandlers() {
    // Permission cards click handler
    document.querySelectorAll('.permission-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.matches('input')) {
          const checkbox = card.querySelector('input');
          checkbox.checked = !checkbox.checked;
          card.classList.toggle('selected');
        }
      });
    });

    // Enter key handler for inputs
    document.querySelectorAll('.ftue-form input').forEach(input => {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          if (this.currentStep === 2) {
            this.saveProfile();
          }
        }
      });
    });
  }

  /**
   * Update UI with user data
   */
  updateUIWithUserData() {
    // Update avatar
    const avatarElement = document.querySelector('.topbar-avatar');
    if (avatarElement && this.userData.avatar) {
      avatarElement.textContent = this.userData.avatar;
    }

    // Update name
    const nameElement = document.querySelector('.topbar-user span:not(.topbar-avatar)');
    if (nameElement && this.userData.name) {
      nameElement.textContent = this.userData.name;
    }

    // Update role badge if exists
    const roleElement = document.querySelector('.user-role');
    if (roleElement && this.userData.role) {
      roleElement.textContent = this.userData.role;
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'ftue-error';
    errorDiv.textContent = message;

    const container = document.querySelector('.ftue-form');
    if (container) {
      container.insertBefore(errorDiv, container.firstChild);
      setTimeout(() => errorDiv.remove(), 3000);
    }
  }

  /**
   * Show notification
   */
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

  /**
   * Initialize FTUE on page load
   */
  init() {
    // Check if should show FTUE
    if (this.shouldShowFTUE()) {
      setTimeout(() => {
        this.startFTUE();
      }, 1000);
    } else {
      // Update UI with existing user data
      this.updateUIWithUserData();
      this.saveUserData({ lastLogin: new Date().toISOString() });
    }
  }
}

// Create global instance
window.adminFTUE = new AdminFTUE();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.adminFTUE.init();
  });
} else {
  window.adminFTUE.init();
}

console.log('👤 Admin FTUE & Account Management loaded');