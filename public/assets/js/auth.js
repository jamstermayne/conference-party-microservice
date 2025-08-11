// LinkedIn Authentication (Prod-Ready, Vanilla)
import Events from './foundation/events.js';
import Store from './foundation/store.js';

const LINKEDIN_CLIENT_ID = 'your-linkedin-client-id'; // Replace with actual client ID
const REDIRECT_URI = `${window.location.origin}/auth/callback`;
const SCOPE = 'r_liteprofile r_emailaddress';

class AuthManager {
  constructor() {
    this.user = null;
    this.init();
  }

  init() {
    this.loadStoredAuth();
    this.bindEvents();
    this.setupButtons();
  }

  loadStoredAuth() {
    const storedUser = Store.get('auth.user');
    if (storedUser && this.isValidAuth(storedUser)) {
      this.user = storedUser;
      this.updateUI();
      Events.emit('auth:loaded', { user: this.user });
    }
  }

  bindEvents() {
    // Handle auth button clicks
    Events.on('action:auth-linkedin', () => this.signInWithLinkedIn());
    Events.on('action:signout', () => this.signOut());
    
    // Handle auth state changes
    Events.on('auth:success', (data) => this.handleAuthSuccess(data));
    Events.on('auth:error', (data) => this.handleAuthError(data));
  }

  setupButtons() {
    // Create LinkedIn auth buttons if they don't exist
    this.createAuthButtons();
  }

  createAuthButtons() {
    const authSection = document.querySelector('#auth-section');
    if (!authSection) return;

    const authButtons = authSection.querySelector('#auth-buttons');
    const userProfile = authSection.querySelector('#user-profile');

    if (this.user) {
      authButtons?.classList.add('hidden');
      userProfile?.classList.remove('hidden');
      this.updateUserProfile();
    } else {
      authButtons?.classList.remove('hidden');
      userProfile?.classList.add('hidden');
      this.updateAuthButtons();
    }
  }

  updateAuthButtons() {
    const linkedinBtn = document.querySelector('#btn-linkedin');
    if (linkedinBtn && !linkedinBtn.dataset.enhanced) {
      linkedinBtn.innerHTML = `
        <img src="/assets/svg/linkedin.svg" alt="" width="16" height="16" style="vertical-align:middle;margin-right:8px;">
        Continue with LinkedIn
      `;
      linkedinBtn.dataset.action = 'auth-linkedin';
      linkedinBtn.dataset.enhanced = 'true';
    }
  }

  updateUserProfile() {
    if (!this.user) return;

    const avatar = document.querySelector('#user-avatar');
    const name = document.querySelector('#user-name');
    const email = document.querySelector('#user-email');

    if (avatar) avatar.src = this.user.picture || '/assets/icons/default-avatar.png';
    if (name) name.textContent = this.user.name || 'User';
    if (email) email.textContent = this.user.email || '';
  }

  async signInWithLinkedIn() {
    try {
      Events.emit('auth:start');
      
      // Open LinkedIn OAuth popup
      const authUrl = this.buildLinkedInAuthUrl();
      const popup = window.open(
        authUrl,
        'linkedin-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Wait for auth completion
      const result = await this.waitForAuthCallback(popup);
      
      if (result.success) {
        await this.handleAuthSuccess(result.user);
      } else {
        throw new Error(result.error || 'Authentication failed');
      }

    } catch (error) {
      this.handleAuthError(error);
    }
  }

  buildLinkedInAuthUrl() {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: LINKEDIN_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: SCOPE,
      state: this.generateState()
    });

    Store.set('auth.state', params.get('state'));
    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  waitForAuthCallback(popup) {
    return new Promise((resolve) => {
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          resolve({ success: false, error: 'Authentication cancelled' });
        }
      }, 1000);

      // Listen for message from popup
      const messageHandler = (event) => {
        if (event.origin !== window.location.origin) return;
        
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
        popup.close();

        if (event.data.type === 'auth-success') {
          resolve({ success: true, user: event.data.user });
        } else {
          resolve({ success: false, error: event.data.error });
        }
      };

      window.addEventListener('message', messageHandler);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
        if (!popup.closed) popup.close();
        resolve({ success: false, error: 'Authentication timeout' });
      }, 300000);
    });
  }

  async handleAuthSuccess(user) {
    this.user = user;
    Store.set('auth.user', user);
    Store.set('auth.lastLogin', Date.now());
    
    this.updateUI();
    Events.emit('auth:success', { user });
    Events.emit('ui:toast', {
      message: `Welcome, ${user.name}!`,
      type: 'success'
    });
  }

  handleAuthError(error) {
    console.error('Auth error:', error);
    Events.emit('auth:error', { error: error.message });
    Events.emit('ui:toast', {
      message: error.message || 'Authentication failed',
      type: 'error'
    });
  }

  signOut() {
    this.user = null;
    Store.set('auth.user', null);
    Store.set('auth.lastLogin', null);
    
    this.updateUI();
    Events.emit('auth:signout');
    Events.emit('ui:toast', {
      message: 'Signed out successfully',
      type: 'info'
    });
  }

  updateUI() {
    this.createAuthButtons();
  }

  isValidAuth(user) {
    if (!user || !user.id) return false;
    
    const lastLogin = Store.get('auth.lastLogin');
    if (!lastLogin) return false;
    
    // Check if login is less than 30 days old
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    return lastLogin > thirtyDaysAgo;
  }

  generateState() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Public API
  getUser() {
    return this.user;
  }

  isAuthenticated() {
    return !!this.user;
  }

  requireAuth(callback) {
    if (this.isAuthenticated()) {
      callback(this.user);
    } else {
      Events.once('auth:success', (data) => callback(data.user));
      this.signInWithLinkedIn();
    }
  }
}

// Initialize auth manager
const authManager = new AuthManager();

// Expose for external use
window.Auth = authManager;

export default authManager;