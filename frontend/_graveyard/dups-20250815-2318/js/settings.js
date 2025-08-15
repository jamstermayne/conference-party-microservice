/**
 * Settings Page JavaScript
 * Handles MTM integration and other settings
 */

class SettingsManager {
  constructor() {
    this.apiBase = '/api/integrations/mtm';
    this.mtmStatus = null;
    this.init();
  }

  async init() {
    await this.checkMtmStatus();
    this.attachEventListeners();
  }

  /**
   * Check MTM integration status
   */
  async checkMtmStatus() {
    const actionsEl = document.getElementById('mtm-actions');
    const connectEl = document.getElementById('mtm-connect');
    
    // Show loading
    actionsEl.innerHTML = '<span class="loading"></span>';
    
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${this.apiBase}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.mtmStatus = data;
        
        if (data.connected) {
          // Show connected state
          const lastSync = data.lastSyncAt ? 
            new Date(data.lastSyncAt).toLocaleString() : 'Never';
          
          actionsEl.innerHTML = `
            <div class="status connected">
              <span class="status-dot"></span>
              Connected
            </div>
            <button class="secondary" onclick="settings.syncNow()">Sync Now</button>
            <button class="secondary" onclick="settings.disconnect()">Disconnect</button>
          `;
          
          connectEl.classList.add('hidden');
          
          // Show event count if available
          if (data.eventCount !== undefined) {
            const statusEl = actionsEl.querySelector('.status');
            statusEl.title = `${data.eventCount} events synced. Last sync: ${lastSync}`;
          }
        } else {
          // Show disconnected state
          actionsEl.innerHTML = `
            <button onclick="settings.showConnect()">Connect</button>
          `;
          connectEl.classList.add('hidden');
        }
      } else {
        throw new Error('Failed to get status');
      }
    } catch (error) {
      console.error('Error checking MTM status:', error);
      actionsEl.innerHTML = `
        <button onclick="settings.showConnect()">Connect</button>
      `;
    }
  }

  /**
   * Show connect form
   */
  showConnect() {
    const connectEl = document.getElementById('mtm-connect');
    connectEl.classList.remove('hidden');
    document.getElementById('mtm-ics-url').focus();
  }

  /**
   * Connect MTM integration
   */
  async connect() {
    const urlInput = document.getElementById('mtm-ics-url');
    const connectBtn = document.getElementById('mtm-connect-btn');
    const icsUrl = urlInput.value.trim();
    
    if (!icsUrl) {
      this.showToast('Please enter your ICS URL', 'error');
      return;
    }
    
    // Validate URL format
    if (!icsUrl.startsWith('https://') || !icsUrl.includes('.ics')) {
      this.showToast('Please enter a valid HTTPS ICS URL', 'error');
      return;
    }
    
    // Disable form
    connectBtn.disabled = true;
    connectBtn.textContent = 'Connecting...';
    
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${this.apiBase}/connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ icsUrl })
      });
      
      const data = await response.json();
      
      if (response.ok && data.ok) {
        this.showToast('MeetToMatch connected successfully!', 'success');
        urlInput.value = '';
        document.getElementById('mtm-connect').classList.add('hidden');
        await this.checkMtmStatus();
      } else {
        this.showToast(data.error || 'Failed to connect', 'error');
      }
    } catch (error) {
      console.error('Connection error:', error);
      this.showToast('Connection failed. Please try again.', 'error');
    } finally {
      connectBtn.disabled = false;
      connectBtn.textContent = 'Connect';
    }
  }

  /**
   * Sync MTM events now
   */
  async syncNow() {
    const syncBtn = event.target;
    const originalText = syncBtn.textContent;
    
    syncBtn.disabled = true;
    syncBtn.textContent = 'Syncing...';
    
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${this.apiBase}/syncNow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.ok) {
        this.showToast(`Synced ${data.count || 0} events`, 'success');
        await this.checkMtmStatus();
      } else {
        this.showToast(data.error || 'Sync failed', 'error');
      }
    } catch (error) {
      console.error('Sync error:', error);
      this.showToast('Sync failed. Please try again.', 'error');
    } finally {
      syncBtn.disabled = false;
      syncBtn.textContent = originalText;
    }
  }

  /**
   * Disconnect MTM integration
   */
  async disconnect() {
    if (!confirm('Are you sure you want to disconnect MeetToMatch?')) {
      return;
    }
    
    const disconnectBtn = event.target;
    const originalText = disconnectBtn.textContent;
    
    disconnectBtn.disabled = true;
    disconnectBtn.textContent = 'Disconnecting...';
    
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${this.apiBase}/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.ok) {
        this.showToast('MeetToMatch disconnected', 'success');
        await this.checkMtmStatus();
      } else {
        this.showToast(data.error || 'Failed to disconnect', 'error');
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      this.showToast('Failed to disconnect. Please try again.', 'error');
    } finally {
      disconnectBtn.disabled = false;
      disconnectBtn.textContent = originalText;
    }
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // MTM Connect button
    const connectBtn = document.getElementById('mtm-connect-btn');
    if (connectBtn) {
      connectBtn.addEventListener('click', () => this.connect());
    }
    
    // Enter key on URL input
    const urlInput = document.getElementById('mtm-ics-url');
    if (urlInput) {
      urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.connect();
        }
      });
    }
    
    // Profile save
    const saveProfileBtn = document.getElementById('save-profile');
    if (saveProfileBtn) {
      saveProfileBtn.addEventListener('click', () => this.saveProfile());
    }
    
    // Other settings
    this.loadSettings();
  }

  /**
   * Save profile
   */
  async saveProfile() {
    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    
    // Save to localStorage for now
    localStorage.setItem('profile-name', nameInput.value);
    localStorage.setItem('profile-email', emailInput.value);
    
    this.showToast('Profile saved', 'success');
  }

  /**
   * Load settings
   */
  loadSettings() {
    // Load profile
    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    
    if (nameInput) nameInput.value = localStorage.getItem('profile-name') || '';
    if (emailInput) emailInput.value = localStorage.getItem('profile-email') || '';
    
    // Load notification preferences
    const notifyEvents = document.getElementById('notify-events');
    const notifyUpdates = document.getElementById('notify-updates');
    
    if (notifyEvents) {
      notifyEvents.checked = localStorage.getItem('notify-events') === 'true';
      notifyEvents.addEventListener('change', (e) => {
        localStorage.setItem('notify-events', e.target.checked);
      });
    }
    
    if (notifyUpdates) {
      notifyUpdates.checked = localStorage.getItem('notify-updates') === 'true';
      notifyUpdates.addEventListener('change', (e) => {
        localStorage.setItem('notify-updates', e.target.checked);
      });
    }
  }

  /**
   * Get auth token
   */
  async getAuthToken() {
    // Check Firebase Auth
    if (window.firebase?.auth) {
      const user = firebase.auth().currentUser;
      if (user) {
        return user.getIdToken();
      }
    }
    
    // Fallback to localStorage
    return localStorage.getItem('authToken') || '';
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    // Remove existing toasts
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }
}

// Initialize when DOM is ready
const settings = new SettingsManager();
window.settings = settings; // Make available globally for onclick handlers