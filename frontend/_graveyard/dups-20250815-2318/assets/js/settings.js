/**
 * ⚙️ PROFESSIONAL INTELLIGENCE PLATFORM - SETTINGS PAGE
 * Application settings and preferences management
 */

export class SettingsPage {
  constructor() {
    this.settings = {
      theme: 'dark',
      notifications: true,
      location: true,
      analytics: true,
      privacy: 'public'
    };
  }

  async render() {
    return `
      <div class="settings-page">
        <header class="page-header">
          <div class="header-content">
            <div class="header-title">
              <h1>Platform Settings</h1>
              <p class="header-subtitle">Customize your professional experience</p>
            </div>
          </div>
        </header>

        <div class="settings-container">
          <div class="settings-section glass-card">
            <h3>Appearance</h3>
            <div class="setting-item">
              <div class="setting-info">
                <h4>Theme</h4>
                <p>Choose your preferred visual theme</p>
              </div>
              <select id="theme-select" class="setting-select">
                <option value="dark">Dark Theme</option>
                <option value="light">Light Theme</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>
          </div>

          <div class="settings-section glass-card">
            <h3>Notifications</h3>
            <div class="setting-item">
              <div class="setting-info">
                <h4>Push Notifications</h4>
                <p>Receive real-time updates about events and invites</p>
              </div>
              <label class="setting-toggle">
                <input type="checkbox" id="notifications-toggle" checked>
                <span class="toggle-slider"></span>
              </label>
            </div>
            
            <div class="setting-item">
              <div class="setting-info">
                <h4>Email Updates</h4>
                <p>Weekly digest of upcoming events and opportunities</p>
              </div>
              <label class="setting-toggle">
                <input type="checkbox" id="email-toggle">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="settings-section glass-card">
            <h3>Privacy</h3>
            <div class="setting-item">
              <div class="setting-info">
                <h4>Location Services</h4>
                <p>Allow location access for venue recommendations</p>
              </div>
              <label class="setting-toggle">
                <input type="checkbox" id="location-toggle" checked>
                <span class="toggle-slider"></span>
              </label>
            </div>
            
            <div class="setting-item">
              <div class="setting-info">
                <h4>Analytics</h4>
                <p>Help improve the platform with usage analytics</p>
              </div>
              <label class="setting-toggle">
                <input type="checkbox" id="analytics-toggle" checked>
                <span class="toggle-slider"></span>
              </label>
            </div>
            
            <div class="setting-item">
              <div class="setting-info">
                <h4>Profile Visibility</h4>
                <p>Control who can see your professional profile</p>
              </div>
              <select id="privacy-select" class="setting-select">
                <option value="public">Public</option>
                <option value="attendees">Event Attendees Only</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>

          <div class="settings-section glass-card">
            <h3>Data Management</h3>
            <div class="setting-item">
              <div class="setting-info">
                <h4>Export Data</h4>
                <p>Download your profile and activity data</p>
              </div>
              <button class="btn btn-ghost" id="export-data">Export</button>
            </div>
            
            <div class="setting-item">
              <div class="setting-info">
                <h4>Clear Cache</h4>
                <p>Clear stored data to free up space</p>
              </div>
              <button class="btn btn-ghost" id="clear-cache">Clear</button>
            </div>
            
            <div class="setting-item">
              <div class="setting-info">
                <h4>Reset Settings</h4>
                <p>Restore all settings to defaults</p>
              </div>
              <button class="btn btn-ghost danger" id="reset-settings">Reset</button>
            </div>
          </div>

          <div class="settings-section glass-card">
            <h3>About</h3>
            <div class="about-info">
              <div class="about-item">
                <strong>Version:</strong> 1.0.0
              </div>
              <div class="about-item">
                <strong>Platform:</strong> Progressive Web App
              </div>
              <div class="about-item">
                <strong>Last Updated:</strong> ${new Date().toLocaleDateString()}
              </div>
            </div>
            
            <div class="about-links">
              <a href="#" class="about-link">Privacy Policy</a>
              <a href="#" class="about-link">Terms of Service</a>
              <a href="#" class="about-link">Support</a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async initialize() {
    console.log('⚙️ Settings page initialized');
    await this.loadSettings();
    this.setupEventListeners();
    this.updateUI();
  }

  async loadSettings() {
    try {
      const stored = localStorage.getItem('app_settings');
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  async saveSettings() {
    try {
      localStorage.setItem('app_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  updateUI() {
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) themeSelect.value = this.settings.theme;

    const notificationsToggle = document.getElementById('notifications-toggle');
    if (notificationsToggle) notificationsToggle.checked = this.settings.notifications;

    const locationToggle = document.getElementById('location-toggle');
    if (locationToggle) locationToggle.checked = this.settings.location;

    const analyticsToggle = document.getElementById('analytics-toggle');
    if (analyticsToggle) analyticsToggle.checked = this.settings.analytics;

    const privacySelect = document.getElementById('privacy-select');
    if (privacySelect) privacySelect.value = this.settings.privacy;
  }

  setupEventListeners() {
    // Theme selection
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => {
        this.settings.theme = e.target.value;
        this.applyTheme(e.target.value);
        this.saveSettings();
      });
    }

    // Notification toggles
    const notificationsToggle = document.getElementById('notifications-toggle');
    if (notificationsToggle) {
      notificationsToggle.addEventListener('change', (e) => {
        this.settings.notifications = e.target.checked;
        this.saveSettings();
      });
    }

    const emailToggle = document.getElementById('email-toggle');
    if (emailToggle) {
      emailToggle.addEventListener('change', (e) => {
        this.settings.email = e.target.checked;
        this.saveSettings();
      });
    }

    // Privacy toggles
    const locationToggle = document.getElementById('location-toggle');
    if (locationToggle) {
      locationToggle.addEventListener('change', (e) => {
        this.settings.location = e.target.checked;
        this.saveSettings();
      });
    }

    const analyticsToggle = document.getElementById('analytics-toggle');
    if (analyticsToggle) {
      analyticsToggle.addEventListener('change', (e) => {
        this.settings.analytics = e.target.checked;
        this.saveSettings();
      });
    }

    const privacySelect = document.getElementById('privacy-select');
    if (privacySelect) {
      privacySelect.addEventListener('change', (e) => {
        this.settings.privacy = e.target.value;
        this.saveSettings();
      });
    }

    // Data management buttons
    const exportBtn = document.getElementById('export-data');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportData());
    }

    const clearCacheBtn = document.getElementById('clear-cache');
    if (clearCacheBtn) {
      clearCacheBtn.addEventListener('click', () => this.clearCache());
    }

    const resetBtn = document.getElementById('reset-settings');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetSettings());
    }
  }

  applyTheme(theme) {
    const html = document.documentElement;
    html.setAttribute('data-theme', theme === 'auto' ? 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : 
      theme
    );

    const ui = window.app?.getUI();
    if (ui) {
      ui.showToast(`Theme changed to ${theme}`, 'success');
    }
  }

  async exportData() {
    try {
      const userData = {
        profile: JSON.parse(localStorage.getItem('user_profile') || '{}'),
        settings: this.settings,
        parties: JSON.parse(localStorage.getItem('cached_parties') || '[]'),
        timestamp: new Date().toISOString()
      };

      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `intelligence-platform-data-${Date.now()}.json`;
      link.click();
      
      URL.revokeObjectURL(url);

      const ui = window.app?.getUI();
      if (ui) {
        ui.showToast('Data exported successfully', 'success');
      }
    } catch (error) {
      console.error('Export failed:', error);
      
      const ui = window.app?.getUI();
      if (ui) {
        ui.showToast('Export failed', 'error');
      }
    }
  }

  async clearCache() {
    const ui = window.app?.getUI();
    if (!ui) return;

    const confirmed = await ui.showConfirmation(
      'This will clear all cached data including parties and profile information. Continue?',
      { title: 'Clear Cache', confirmText: 'Clear', type: 'warning' }
    );

    if (confirmed) {
      try {
        const keysToKeep = ['app_settings', 'onboarding_completed'];
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
          if (!keysToKeep.includes(key)) {
            localStorage.removeItem(key);
          }
        });

        // Clear API cache if available
        const api = window.app?.getAPI();
        if (api) {
          api.clearCache();
        }

        ui.showToast('Cache cleared successfully', 'success');
      } catch (error) {
        console.error('Cache clear failed:', error);
        ui.showToast('Failed to clear cache', 'error');
      }
    }
  }

  async resetSettings() {
    const ui = window.app?.getUI();
    if (!ui) return;

    const confirmed = await ui.showConfirmation(
      'This will reset all settings to their default values. Continue?',
      { title: 'Reset Settings', confirmText: 'Reset', type: 'warning' }
    );

    if (confirmed) {
      this.settings = {
        theme: 'dark',
        notifications: true,
        location: true,
        analytics: true,
        privacy: 'public'
      };

      await this.saveSettings();
      this.updateUI();
      this.applyTheme(this.settings.theme);

      ui.showToast('Settings reset to defaults', 'success');
    }
  }
}