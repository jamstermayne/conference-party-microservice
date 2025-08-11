/**
 * 👤 PROFESSIONAL INTELLIGENCE PLATFORM - PROFILE PAGE
 * User profile management and professional networking settings
 */

export class ProfilePage {
  constructor() {
    this.profile = {};
    this.isEditing = false;
  }

  async render() {
    return `
      <div class="profile-page">
        <header class="page-header">
          <div class="header-content">
            <div class="header-title">
              <h1>Your Profile</h1>
              <p class="header-subtitle">Manage your professional presence</p>
            </div>
            <button class="btn btn-primary" id="edit-profile">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Edit Profile
            </button>
          </div>
        </header>

        <div class="profile-container">
          <div class="profile-card glass-card">
            <div class="profile-avatar">
              <div class="avatar-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <button class="avatar-upload btn btn-glass">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
              </button>
            </div>

            <div class="profile-info">
              <h2 id="profile-name">Gaming Professional</h2>
              <p id="profile-role" class="profile-role">Game Developer</p>
              <p id="profile-company" class="profile-company">Indie Studio</p>
            </div>

            <div class="profile-stats">
              <div class="stat-item">
                <span class="stat-value">12</span>
                <span class="stat-label">Events Attended</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">48</span>
                <span class="stat-label">Connections</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">5</span>
                <span class="stat-label">Reviews</span>
              </div>
            </div>
          </div>

          <div class="profile-sections">
            <div class="section-card glass-card">
              <h3>Professional Interests</h3>
              <div class="interests-tags" id="interests-display">
                <span class="interest-tag">Mobile Games</span>
                <span class="interest-tag">Unity</span>
                <span class="interest-tag">Indie Development</span>
                <span class="interest-tag">VR/AR</span>
              </div>
            </div>

            <div class="section-card glass-card">
              <h3>Networking Preferences</h3>
              <div class="preferences-list">
                <div class="preference-item">
                  <span>Available for collaborations</span>
                  <label class="toggle">
                    <input type="checkbox" checked>
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                <div class="preference-item">
                  <span>Open to mentoring</span>
                  <label class="toggle">
                    <input type="checkbox">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                <div class="preference-item">
                  <span>Seeking investment</span>
                  <label class="toggle">
                    <input type="checkbox">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>

            <div class="section-card glass-card">
              <h3>Privacy Settings</h3>
              <div class="preferences-list">
                <div class="preference-item">
                  <span>Show profile to other attendees</span>
                  <label class="toggle">
                    <input type="checkbox" checked>
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                <div class="preference-item">
                  <span>Allow direct messages</span>
                  <label class="toggle">
                    <input type="checkbox" checked>
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                <div class="preference-item">
                  <span>Share attendance status</span>
                  <label class="toggle">
                    <input type="checkbox">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async initialize() {
    console.log('👤 Profile page initialized');
    await this.loadProfile();
    this.setupEventListeners();
  }

  async loadProfile() {
    try {
      const stored = localStorage.getItem('user_profile');
      if (stored) {
        this.profile = JSON.parse(stored);
        this.updateProfileDisplay();
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  }

  updateProfileDisplay() {
    const nameEl = document.getElementById('profile-name');
    const roleEl = document.getElementById('profile-role');
    const companyEl = document.getElementById('profile-company');

    if (nameEl && this.profile.name) {
      nameEl.textContent = this.profile.name;
    }
    
    if (roleEl && this.profile.persona) {
      const roleLabels = {
        developer: 'Game Developer',
        business: 'Business Professional',
        investor: 'Investor & VC',
        service: 'Service Provider'
      };
      roleEl.textContent = roleLabels[this.profile.persona] || 'Gaming Professional';
    }

    if (companyEl && this.profile.company) {
      companyEl.textContent = this.profile.company;
    }
  }

  setupEventListeners() {
    const editBtn = document.getElementById('edit-profile');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        this.showEditModal();
      });
    }
  }

  showEditModal() {
    const ui = window.app?.getUI();
    if (!ui) return;

    const editForm = `
      <div class="profile-edit-form">
        <div class="form-group">
          <label for="edit-name">Full Name</label>
          <input type="text" id="edit-name" class="form-input" value="${this.profile.name || ''}" placeholder="Your professional name">
        </div>
        
        <div class="form-group">
          <label for="edit-company">Company</label>
          <input type="text" id="edit-company" class="form-input" value="${this.profile.company || ''}" placeholder="Your company or studio">
        </div>
        
        <div class="form-group">
          <label for="edit-bio">Professional Bio</label>
          <textarea id="edit-bio" class="form-textarea" placeholder="Brief description of your professional background...">${this.profile.bio || ''}</textarea>
        </div>
        
        <div class="form-actions">
          <button class="btn btn-ghost" onclick="window.app.getUI().closeModal()">Cancel</button>
          <button class="btn btn-primary" id="save-profile">Save Changes</button>
        </div>
      </div>
    `;

    const modal = ui.showModal(editForm, {
      title: 'Edit Profile',
      size: 'medium'
    });

    const saveBtn = modal.querySelector('#save-profile');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveProfile(modal);
      });
    }
  }

  saveProfile(modal) {
    const nameInput = modal.querySelector('#edit-name');
    const companyInput = modal.querySelector('#edit-company');
    const bioInput = modal.querySelector('#edit-bio');

    this.profile.name = nameInput?.value || '';
    this.profile.company = companyInput?.value || '';
    this.profile.bio = bioInput?.value || '';
    this.profile.updatedAt = new Date().toISOString();

    try {
      localStorage.setItem('user_profile', JSON.stringify(this.profile));
      this.updateProfileDisplay();
      
      const ui = window.app?.getUI();
      if (ui) {
        ui.closeModal();
        ui.showToast('Profile updated successfully', 'success');
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      
      const ui = window.app?.getUI();
      if (ui) {
        ui.showToast('Failed to save profile', 'error');
      }
    }
  }
}