import { Store, Events, EVENTS } from './state.js';
import { API } from './api.js';
import { toast } from './ui.js';

// Authentication Manager
class AuthManager {
  constructor() {
    this.setupEventListeners();
    this.checkExistingSession();
  }

  setupEventListeners() {
    // Google Auth Button
    const googleBtn = document.querySelector('#btn-google');
    if (googleBtn) {
      googleBtn.addEventListener('click', () => {
        this.startAuth('google');
      });
    }

    // LinkedIn Auth Button
    const linkedInBtn = document.querySelector('#btn-linkedin');
    if (linkedInBtn) {
      linkedInBtn.addEventListener('click', () => {
        this.startAuth('linkedin');
      });
    }

    // Listen for auth events
    Events.on('auth:start', (data) => {
      this.handleAuthStart(data);
    });

    Events.on('auth:success', (data) => {
      this.handleAuthSuccess(data);
    });

    Events.on('auth:error', (data) => {
      this.handleAuthError(data);
    });

    // Handle OAuth callbacks from popups
    window.addEventListener('message', (event) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'LINKEDIN_AUTH_SUCCESS') {
        this.handleLinkedInCallback(event.data);
      } else if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        this.handleGoogleCallback(event.data);
      }
    });
  }

  async startAuth(provider) {
    console.log(`Starting ${provider} authentication...`);
    Events.emit('auth:start', { provider });

    try {
      if (provider === 'google') {
        await this.authenticateWithGoogle();
      } else if (provider === 'linkedin') {
        await this.authenticateWithLinkedIn();
      }
    } catch (error) {
      console.error(`${provider} auth failed:`, error);
      Events.emit('auth:error', { provider, error: error.message });
    }
  }

  async authenticateWithGoogle() {
    try {
      const result = await API.login('google');
      if (result.success) {
        Events.emit('auth:success', {
          provider: 'google',
          profile: result.profile
        });
      } else {
        throw new Error(result.error || 'Google authentication failed');
      }
    } catch (error) {
      throw error;
    }
  }

  async authenticateWithLinkedIn() {
    try {
      const result = await API.login('linkedin');
      if (result.success) {
        Events.emit('auth:success', {
          provider: 'linkedin',
          profile: result.profile
        });
      } else {
        throw new Error(result.error || 'LinkedIn authentication failed');
      }
    } catch (error) {
      throw error;
    }
  }

  handleAuthStart(data) {
    console.log(`Authentication starting for ${data.provider}`);
    
    // Show loading state on button
    const btnId = data.provider === 'google' ? '#btn-google' : '#btn-linkedin';
    const btn = document.querySelector(btnId);
    if (btn) {
      btn.disabled = true;
      btn.classList.add('loading');
      btn.innerHTML = `
        <span class="spinner"></span>
        Connecting...
      `;
    }
  }

  handleAuthSuccess(data) {
    console.log(`${data.provider} auth success:`, data.profile);
    
    // Update store with profile
    Store.profile = {
      ...Store.profile,
      ...data.profile,
      provider: data.provider,
      authenticated: true
    };
    
    // Save to localStorage
    localStorage.setItem('velocity_profile', JSON.stringify(Store.profile));
    
    // Show success message
    const firstName = data.profile.firstName || data.profile.name?.split(' ')[0] || 'there';
    toast(`Welcome, ${firstName}! 🎮`, 'success');
    
    // Update UI
    this.updateAuthUI(true);
    
    // Emit profile updated event
    Events.emit(EVENTS.PROFILE_UPDATED, { profile: Store.profile });
    
    // Navigate to main app if on auth screen
    if (window.location.pathname === '/auth' || window.location.pathname === '/login') {
      window.location.href = '/';
    }
  }

  handleAuthError(data) {
    console.error(`${data.provider} auth error:`, data.error);
    
    // Show error message
    const message = data.provider === 'linkedin' 
      ? 'LinkedIn login failed. Please try again.'
      : 'Google login failed. Please try again.';
    
    toast(message, 'error');
    
    // Reset button state
    const btnId = data.provider === 'google' ? '#btn-google' : '#btn-linkedin';
    const btn = document.querySelector(btnId);
    if (btn) {
      btn.disabled = false;
      btn.classList.remove('loading');
      
      if (data.provider === 'linkedin') {
        btn.innerHTML = `
          <img src="assets/svg/linkedin.svg" alt="" class="icon" aria-hidden="true">
          Continue with LinkedIn
        `;
      } else {
        btn.innerHTML = `
          <img src="assets/svg/google.svg" alt="" class="icon" aria-hidden="true">
          Continue with Google
        `;
      }
    }
  }

  handleLinkedInCallback(data) {
    // Process LinkedIn OAuth callback
    if (data.code && data.state) {
      // Verify state matches what we stored
      const storedState = sessionStorage.getItem('linkedin_state');
      if (storedState === data.state) {
        Events.emit('auth:success', {
          provider: 'linkedin',
          profile: data.profile || {
            firstName: 'LinkedIn',
            lastName: 'User',
            email: data.email
          }
        });
      } else {
        Events.emit('auth:error', {
          provider: 'linkedin',
          error: 'State mismatch - possible CSRF attack'
        });
      }
      sessionStorage.removeItem('linkedin_state');
    }
  }

  handleGoogleCallback(data) {
    // Process Google OAuth callback
    if (data.credential) {
      Events.emit('auth:success', {
        provider: 'google',
        profile: data.profile || {
          firstName: 'Google',
          lastName: 'User',
          email: data.email
        }
      });
    }
  }

  checkExistingSession() {
    // Check if user has existing session
    const savedProfile = localStorage.getItem('velocity_profile');
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        Store.profile = profile;
        this.updateAuthUI(true);
        console.log('Restored session for:', profile.firstName || profile.email);
      } catch (error) {
        console.error('Failed to restore session:', error);
        localStorage.removeItem('velocity_profile');
      }
    }
  }

  updateAuthUI(authenticated) {
    // Update UI based on auth state
    const authButtons = document.querySelector('.auth-buttons');
    const userProfile = document.querySelector('.user-profile');
    
    if (authenticated && Store.profile) {
      // Hide auth buttons
      if (authButtons) authButtons.style.display = 'none';
      
      // Show user profile
      if (userProfile) {
        userProfile.style.display = 'flex';
        userProfile.innerHTML = `
          <img src="${Store.profile.avatar || 'assets/img/default-avatar.png'}" 
               alt="Profile" class="avatar">
          <span class="username">${Store.profile.firstName || 'User'}</span>
          <button class="btn-logout" onclick="authManager.logout()">Logout</button>
        `;
      }
    } else {
      // Show auth buttons
      if (authButtons) authButtons.style.display = 'flex';
      
      // Hide user profile
      if (userProfile) userProfile.style.display = 'none';
    }
  }

  async logout() {
    // Clear session
    Store.profile = null;
    localStorage.removeItem('velocity_profile');
    
    // Update UI
    this.updateAuthUI(false);
    
    // Show message
    toast('Logged out successfully', 'info');
    
    // Emit logout event
    Events.emit('auth:logout');
    
    // Redirect to home
    if (window.location.pathname !== '/') {
      window.location.href = '/';
    }
  }
}

// Create and export singleton instance
const authManager = new AuthManager();

// Export for use in other modules
export default authManager;
export { AuthManager };

// Make available globally for onclick handlers
window.authManager = authManager;