/**
 * Auth Integration Adapter
 * Bridges the new magic auth system with the existing app
 */

import { MagicAuthSystem } from './magic-auth.js';
import { profileEnrichment } from '../services/profile-enrichment.js';
import { companyIntelligence } from '../services/company-intelligence.js';

export class AuthIntegration {
  constructor() {
    this.magicAuth = new MagicAuthSystem();
    this.initialized = false;
    
    // Listen for auth events
    this.setupEventListeners();
  }
  
  /**
   * Initialize integration with existing app
   */
  async initialize() {
    if (this.initialized) return;
    
    // Check if modern auth is enabled
    if (!window.FeatureFlags?.isEnabled('magic_auth')) {
      console.log('[AuthIntegration] Magic auth not enabled');
      return;
    }
    
    // Wait for existing app to load
    await this.waitForApp();
    
    // Integrate with existing auth flow
    this.integrateWithExistingAuth();
    
    // Setup profile enrichment
    this.setupProfileEnrichment();
    
    // Setup UI injection points
    this.setupUIIntegration();
    
    this.initialized = true;
    console.log('[AuthIntegration] Initialized successfully');
  }
  
  /**
   * Wait for existing app to be ready
   */
  async waitForApp() {
    return new Promise((resolve) => {
      const checkApp = () => {
        if (window.UnifiedConferenceApp || window.conferenceApp) {
          resolve();
        } else {
          setTimeout(checkApp, 100);
        }
      };
      checkApp();
    });
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for magic link authentication
    window.addEventListener('magic-auth:authenticated', async (event) => {
      const { user, profile, isNewUser } = event.detail;
      
      // Enrich profile
      const enrichedProfile = await profileEnrichment.enrichProfile(profile);
      
      // Update existing app user
      this.updateAppUser(enrichedProfile);
      
      // Show welcome message
      if (isNewUser) {
        this.showWelcomeMessage(enrichedProfile);
      }
    });
    
    // Listen for social login
    window.addEventListener('magic-auth:social-connected', async (event) => {
      const { provider, profile } = event.detail;
      
      // Enrich with social data
      const enrichedProfile = await this.magicAuth.enhanceProfileFromSocial(provider);
      
      // Update app user
      this.updateAppUser(enrichedProfile);
    });
    
    // Listen for profile updates
    window.addEventListener('magic-auth:profile-updated', async (event) => {
      const { profile } = event.detail;
      
      // Update app user
      this.updateAppUser(profile);
    });
  }
  
  /**
   * Integrate with existing auth flow
   */
  integrateWithExistingAuth() {
    const app = window.UnifiedConferenceApp || window.conferenceApp;
    
    if (!app) {
      console.warn('[AuthIntegration] App not found');
      return;
    }
    
    // Override existing auth methods
    const originalLoadUser = app.loadUser?.bind(app);
    
    app.loadUser = async () => {
      // Try magic auth first
      const magicUser = await this.magicAuth.getCurrentUser();
      
      if (magicUser) {
        // Use magic auth user
        app.currentUser = magicUser;
        app.isAuthenticated = true;
        
        // Store in localStorage for existing app compatibility
        localStorage.setItem('unifiedAppUser', JSON.stringify(magicUser));
        
        return magicUser;
      }
      
      // Fall back to original auth
      if (originalLoadUser) {
        return originalLoadUser();
      }
      
      return null;
    };
    
    // Override save user method
    const originalSaveUser = app.saveUser?.bind(app);
    
    app.saveUser = async (user) => {
      // Save to magic auth
      await this.magicAuth.updateProfile(user);
      
      // Call original save method
      if (originalSaveUser) {
        originalSaveUser(user);
      } else {
        localStorage.setItem('unifiedAppUser', JSON.stringify(user));
      }
    };
    
    // Add new auth methods
    app.sendMagicLink = (email) => this.magicAuth.sendMagicLink(email);
    app.verifyMagicLink = (token) => this.magicAuth.verifyMagicLink(token);
    app.connectSocialLogin = (provider) => this.magicAuth.enhanceProfileFromSocial(provider);
  }
  
  /**
   * Setup profile enrichment
   */
  setupProfileEnrichment() {
    // Auto-enrich on login
    window.addEventListener('user:loaded', async (event) => {
      const user = event.detail || (window.UnifiedConferenceApp?.currentUser);
      
      if (user && !user.enriched) {
        const enrichedUser = await profileEnrichment.enrichProfile(user);
        this.updateAppUser(enrichedUser);
      }
    });
    
    // Enrich on email change
    window.addEventListener('user:email-updated', async (event) => {
      const { email } = event.detail;
      
      if (email) {
        const company = await companyIntelligence.getCompanyFromEmail(email);
        
        if (company) {
          const user = window.UnifiedConferenceApp?.currentUser;
          if (user) {
            user.company = company.name;
            user.companyDomain = company.domain;
            user.companyLogo = company.logo;
            user.industry = company.industry;
            
            this.updateAppUser(user);
          }
        }
      }
    });
  }
  
  /**
   * Setup UI integration
   */
  setupUIIntegration() {
    // Add magic auth UI to login screens
    this.injectAuthUI();
    
    // Add quick registration from URL
    this.setupQuickRegistration();
    
    // Add profile enrichment UI
    this.injectProfileEnrichmentUI();
  }
  
  /**
   * Inject auth UI into existing screens
   */
  injectAuthUI() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.injectAuthUI());
      return;
    }
    
    // Find existing login forms
    const loginForms = document.querySelectorAll('.login-form, .auth-form, #login-panel');
    
    loginForms.forEach(form => {
      // Check if already injected
      if (form.querySelector('magic-auth-ui')) return;
      
      // Create magic auth component
      const magicAuthUI = document.createElement('magic-auth-ui');
      magicAuthUI.setAttribute('mode', 'email');
      
      // Insert at top of form
      form.insertBefore(magicAuthUI, form.firstChild);
    });
    
    // Add to settings/profile screens
    const profileSections = document.querySelectorAll('.profile-section, #settings-panel, #account-section');
    
    profileSections.forEach(section => {
      // Check if already injected
      if (section.querySelector('magic-auth-ui')) return;
      
      // Create social login component
      const socialAuth = document.createElement('magic-auth-ui');
      socialAuth.setAttribute('mode', 'social');
      
      // Find appropriate place to insert
      const authSection = section.querySelector('.auth-section, .social-login');
      
      if (authSection) {
        authSection.appendChild(socialAuth);
      } else {
        // Create new section
        const newSection = document.createElement('div');
        newSection.className = 'auth-section mt-4';
        newSection.innerHTML = '<h3>Connected Accounts</h3>';
        newSection.appendChild(socialAuth);
        
        section.appendChild(newSection);
      }
    });
  }
  
  /**
   * Setup quick registration from URL
   */
  setupQuickRegistration() {
    // Check URL for registration parameters
    const params = new URLSearchParams(window.location.search);
    
    // Quick registration with email
    const email = params.get('register');
    if (email) {
      this.handleQuickRegistration(email);
    }
    
    // Magic link verification
    const token = params.get('token');
    if (token) {
      this.handleMagicLinkVerification(token);
    }
    
    // Social auth callback
    const provider = params.get('auth_provider');
    const code = params.get('code');
    if (provider && code) {
      this.handleSocialAuthCallback(provider, code);
    }
  }
  
  /**
   * Handle quick registration
   */
  async handleQuickRegistration(email) {
    // Show loading
    this.showLoadingMessage('Setting up your account...');
    
    try {
      // Send magic link
      await this.magicAuth.sendMagicLink(email);
      
      // Show success
      this.showSuccessMessage(`Magic link sent to ${email}! Check your inbox.`);
      
      // Clear URL parameter
      const url = new URL(window.location);
      url.searchParams.delete('register');
      window.history.replaceState({}, '', url);
      
    } catch (error) {
      this.showErrorMessage('Registration failed. Please try again.');
      console.error('[AuthIntegration] Quick registration failed:', error);
    }
  }
  
  /**
   * Handle magic link verification
   */
  async handleMagicLinkVerification(token) {
    // Show loading
    this.showLoadingMessage('Verifying your magic link...');
    
    try {
      // Verify token
      const result = await this.magicAuth.verifyMagicLink(token);
      
      if (result.success) {
        // Show success
        this.showSuccessMessage('Welcome! You are now logged in.');
        
        // Update app user
        this.updateAppUser(result.profile);
        
        // Redirect to home or profile
        if (result.isNewUser) {
          window.location.hash = '#profile';
        } else {
          window.location.hash = '#home';
        }
      } else {
        this.showErrorMessage('Invalid or expired link. Please request a new one.');
      }
      
      // Clear URL parameter
      const url = new URL(window.location);
      url.searchParams.delete('token');
      window.history.replaceState({}, '', url);
      
    } catch (error) {
      this.showErrorMessage('Verification failed. Please try again.');
      console.error('[AuthIntegration] Magic link verification failed:', error);
    }
  }
  
  /**
   * Handle social auth callback
   */
  async handleSocialAuthCallback(provider, code) {
    // This would normally be handled by the backend
    // For now, we'll just show a message
    this.showInfoMessage(`Processing ${provider} authentication...`);
    
    // Clear URL parameters
    const url = new URL(window.location);
    url.searchParams.delete('auth_provider');
    url.searchParams.delete('code');
    window.history.replaceState({}, '', url);
  }
  
  /**
   * Inject profile enrichment UI
   */
  injectProfileEnrichmentUI() {
    // Add to profile completion prompts
    const profilePrompts = document.querySelectorAll('.profile-incomplete, .profile-prompt');
    
    profilePrompts.forEach(prompt => {
      // Add enrichment button
      const enrichBtn = document.createElement('button');
      enrichBtn.className = 'btn btn-primary mt-2';
      enrichBtn.textContent = 'Auto-complete with AI';
      enrichBtn.onclick = () => this.enrichCurrentProfile();
      
      prompt.appendChild(enrichBtn);
    });
  }
  
  /**
   * Enrich current profile
   */
  async enrichCurrentProfile() {
    const app = window.UnifiedConferenceApp || window.conferenceApp;
    const user = app?.currentUser;
    
    if (!user) {
      this.showErrorMessage('Please log in first');
      return;
    }
    
    this.showLoadingMessage('Enriching your profile with AI...');
    
    try {
      const enrichedProfile = await profileEnrichment.enrichProfile(user);
      
      // Update app user
      this.updateAppUser(enrichedProfile);
      
      // Show success with completeness
      this.showSuccessMessage(
        `Profile enriched! Completeness: ${enrichedProfile.completeness}%`
      );
      
      // Refresh UI
      this.refreshProfileUI();
      
    } catch (error) {
      this.showErrorMessage('Profile enrichment failed');
      console.error('[AuthIntegration] Enrichment failed:', error);
    }
  }
  
  /**
   * Update app user
   */
  updateAppUser(profile) {
    const app = window.UnifiedConferenceApp || window.conferenceApp;
    
    if (app) {
      app.currentUser = profile;
      app.isAuthenticated = true;
      
      // Save to localStorage
      localStorage.setItem('unifiedAppUser', JSON.stringify(profile));
      
      // Emit event
      window.dispatchEvent(new CustomEvent('user:updated', {
        detail: profile
      }));
    }
  }
  
  /**
   * Refresh profile UI
   */
  refreshProfileUI() {
    // Find profile displays
    const profileDisplays = document.querySelectorAll(
      '.user-profile, .profile-display, #user-info'
    );
    
    const user = window.UnifiedConferenceApp?.currentUser;
    
    if (!user) return;
    
    profileDisplays.forEach(display => {
      // Update name
      const nameEl = display.querySelector('.user-name, .profile-name');
      if (nameEl) nameEl.textContent = user.name || user.email;
      
      // Update title
      const titleEl = display.querySelector('.user-title, .profile-title');
      if (titleEl) titleEl.textContent = user.title || '';
      
      // Update company
      const companyEl = display.querySelector('.user-company, .profile-company');
      if (companyEl) companyEl.textContent = user.company || '';
      
      // Update bio
      const bioEl = display.querySelector('.user-bio, .profile-bio');
      if (bioEl) bioEl.textContent = user.bio || '';
      
      // Update completeness
      const completenessEl = display.querySelector('.profile-completeness');
      if (completenessEl) {
        completenessEl.textContent = `${user.completeness || 0}% complete`;
      }
    });
  }
  
  /**
   * Show loading message
   */
  showLoadingMessage(message) {
    this.showNotification(message, 'loading');
  }
  
  /**
   * Show success message
   */
  showSuccessMessage(message) {
    this.showNotification(message, 'success');
  }
  
  /**
   * Show error message
   */
  showErrorMessage(message) {
    this.showNotification(message, 'error');
  }
  
  /**
   * Show info message
   */
  showInfoMessage(message) {
    this.showNotification(message, 'info');
  }
  
  /**
   * Show welcome message
   */
  showWelcomeMessage(profile) {
    const message = profile.name 
      ? `Welcome to Gamescom 2025, ${profile.name}!`
      : 'Welcome to Gamescom 2025!';
    
    this.showNotification(message, 'success', 5000);
  }
  
  /**
   * Show notification
   */
  showNotification(message, type = 'info', duration = 3000) {
    // Check if notification system exists
    if (window.showNotification) {
      window.showNotification(message, type);
      return;
    }
    
    // Create custom notification
    const notification = document.createElement('div');
    notification.className = `auth-notification auth-notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#17a2b8'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
      max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove
    if (type !== 'loading') {
      setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
      }, duration);
    }
    
    return notification;
  }
}

// Create and initialize singleton
const authIntegration = new AuthIntegration();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => authIntegration.initialize());
} else {
  authIntegration.initialize();
}

// Export for use
export { authIntegration };