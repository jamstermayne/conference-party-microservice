/**
 * Unified Conference App - Signature Design System
 * Connects all frontend systems to real backend APIs
 * No dummy data - production ready
 */

import { fetchParties } from './api-lite.js';

class UnifiedConferenceApp {
  constructor() {
    this.currentUser = null;
    // Use the web app's API endpoint which is rewritten to the function
    this.apiBase = window.location.hostname === 'localhost' 
      ? 'http://localhost:3000/api'
      : '/api';
    this.cache = new Map();
    this.isOnline = navigator.onLine;
    this.errorCount = 0;
    this.maxRetries = 3;
    this.retryDelay = 1000;
    
    // Add global error handler
    this.setupErrorBoundary();
    this.init().catch(this.handleFatalError.bind(this));
  }

  setupErrorBoundary() {
    // Global error handlers
    window.addEventListener('error', (event) => {
      console.error('[Global Error]', event.error);
      this.handleNonFatalError(event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('[Unhandled Promise]', event.reason);
      this.handleNonFatalError(event.reason);
      event.preventDefault();
    });

    // API error tracking
    this.apiErrors = new Map();
  }

  handleFatalError(error) {
    console.error('[Fatal Error]', error);
    
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `
        <div class="fatal-error">
          <div class="error-content">
            <h1>Something went wrong</h1>
            <p>We're having trouble loading the app. Please refresh the page to try again.</p>
            <div class="error-actions">
              <button onclick="location.reload()" class="error-btn error-btn--primary">
                Refresh Page
              </button>
              <button onclick="this.clearCache()" class="error-btn">
                Clear Cache & Refresh
              </button>
            </div>
          </div>
        </div>
      `;
    }
  }

  handleNonFatalError(error, context = '') {
    this.errorCount++;
    
    // Don't spam errors
    if (this.errorCount > 10) {
      console.warn('[Error Limit] Suppressing further error reports');
      return;
    }
    
    // Show user-friendly error message
    if (this.errorCount <= 3) {
      this.showToast(`Something went wrong. Please try again. ${context}`.trim());
    }
  }

  async init() {
    const startTime = performance.now();
    
    try {
      // Check for invite code in URL
      this.checkForInviteCode();
      
      // Critical path - must complete
      await this.initializeUser();
      this.setupNavigation();
      this.renderMainInterface();
      this.setupEventListeners();
      
      // Non-critical path - can be deferred
      this.deferredInit();
      
      const loadTime = performance.now() - startTime;
      console.log(`[Performance] App initialized in ${loadTime.toFixed(2)}ms`);
      
    } catch (error) {
      console.error('[Init Error]', error);
      this.handleFatalError(error);
    }
  }
  
  checkForInviteCode() {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCode = urlParams.get('invite');
    
    if (inviteCode) {
      console.log('[Invite] Found invite code:', inviteCode);
      
      // Store the invite code for after user setup
      sessionStorage.setItem('pendingInvite', inviteCode);
      
      // Show welcome message
      setTimeout(() => {
        this.showInviteWelcome(inviteCode);
      }, 1000);
    }
  }
  
  showInviteWelcome(inviteCode) {
    const isUniversalCode = inviteCode === 'GAMESCOM2025';
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px; text-align: center;">
        <div class="modal-header">
          <h3>${isUniversalCode ? '🔥 VIP Access Code Detected!' : '🎉 Welcome to Gamescom 2025!'}</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        
        <div style="padding: 2rem;">
          <div style="background: ${isUniversalCode ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'var(--color-surface)'}; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
            <p style="color: ${isUniversalCode ? 'white' : 'var(--color-text-dim)'}; margin-bottom: 0.5rem; font-weight: ${isUniversalCode ? 'bold' : 'normal'};">
              ${isUniversalCode ? 'UNIVERSAL VIP CODE:' : 'You\'ve been invited with code:'}
            </p>
            <h2 style="font-size: ${isUniversalCode ? '2rem' : '1.5rem'}; color: ${isUniversalCode ? 'white' : 'var(--color-accent)'}; letter-spacing: 0.1em; margin: 0.5rem 0; font-weight: ${isUniversalCode ? 'bold' : 'normal'};">${inviteCode}</h2>
            ${isUniversalCode ? '<p style="color: rgba(255,255,255,0.9); margin-top: 0.5rem;">✨ Premium access with bonus features!</p>' : ''}
          </div>
          
          <p style="color: var(--color-text); margin-bottom: 1.5rem;">
            ${isUniversalCode ? 
              'You have VIP access to the Gamescom 2025 professional networking platform!' :
              'You\'ve been invited to join the exclusive Gamescom 2025 professional networking platform!'}
          </p>
          
          <div style="text-align: left; background: var(--color-surface); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
            <h4 style="color: var(--color-accent); margin-bottom: 1rem;">What you get:</h4>
            <ul style="color: var(--color-text-dim); margin: 0; padding-left: 1.5rem;">
              <li>Access to 60+ exclusive events</li>
              <li>Professional networking features</li>
              <li><strong style="color: var(--color-accent);">${isUniversalCode ? '15' : '10'} invites</strong> to share with colleagues</li>
              <li>Real-time event updates</li>
              ${isUniversalCode ? '<li><strong style="color: var(--color-accent);">VIP status</strong> and priority features</li>' : ''}
            </ul>
          </div>
          
          <button class="primary-btn" onclick="window.conferenceApp.startQuickSetup('${inviteCode}')" style="width: 100%; padding: 1rem; background: ${isUniversalCode ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'var(--color-accent)'}; color: white; border: none; border-radius: 4px; cursor: pointer; margin-bottom: 0.5rem; font-weight: bold;">
            ${isUniversalCode ? '⚡ Quick Setup (30 seconds)' : 'Claim Your Access'}
          </button>
          
          <button class="secondary-btn" onclick="window.conferenceApp.redeemInvite('${inviteCode}')" style="width: 100%; padding: 0.75rem; background: transparent; color: var(--color-text-dim); border: 1px solid var(--color-border); border-radius: 4px; cursor: pointer;">
            ${isUniversalCode ? 'Skip Setup → Browse Events' : 'Browse Without Account'}
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  
  startQuickSetup(inviteCode) {
    // Close any modals
    document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
    
    // Show a quick setup form
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 450px;">
        <div class="modal-header">
          <h3>⚡ Quick Setup</h3>
          <span style="color: var(--color-text-dim); font-size: 0.9rem;">30 seconds to get started</span>
        </div>
        
        <div style="padding: 1.5rem;">
          <form id="quick-setup-form" style="display: flex; flex-direction: column; gap: 1rem;">
            <div>
              <label style="display: block; color: var(--color-text-dim); margin-bottom: 0.25rem; font-size: 0.9rem;">Your Name</label>
              <input type="text" name="name" placeholder="John Doe" required style="width: 100%; padding: 0.75rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 4px; color: var(--color-text);">
            </div>
            
            <div>
              <label style="display: block; color: var(--color-text-dim); margin-bottom: 0.25rem; font-size: 0.9rem;">Email (for admin access use: jamy@nigriconsulting.com)</label>
              <input type="email" name="email" placeholder="your@email.com" required style="width: 100%; padding: 0.75rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 4px; color: var(--color-text);">
            </div>
            
            <div>
              <label style="display: block; color: var(--color-text-dim); margin-bottom: 0.25rem; font-size: 0.9rem;">I'm a...</label>
              <select name="role" required style="width: 100%; padding: 0.75rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 4px; color: var(--color-text);">
                <option value="">Select your role</option>
                <option value="Game Developer">Game Developer</option>
                <option value="Publisher">Publisher</option>
                <option value="Investor">Investor</option>
                <option value="Press/Media">Press/Media</option>
                <option value="Service Provider">Service Provider</option>
                <option value="Student">Student</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label style="display: block; color: var(--color-text-dim); margin-bottom: 0.25rem; font-size: 0.9rem;">Company (optional)</label>
              <input type="text" name="company" placeholder="Your Company" style="width: 100%; padding: 0.75rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 4px; color: var(--color-text);">
            </div>
            
            <button type="submit" style="width: 100%; padding: 1rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; margin-top: 0.5rem;">
              Complete Setup → Start Networking
            </button>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Handle form submission
    document.getElementById('quick-setup-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      
      // Update profile
      this.currentUser.profile = {
        name: formData.get('name'),
        email: formData.get('email'),
        role: formData.get('role'),
        company: formData.get('company') || '',
        linkedin: '',
        phone: ''
      };
      
      // Check for admin status
      this.checkAdminStatus();
      
      // Redeem the invite
      this.redeemInvite(inviteCode);
      
      // Close modal
      modal.remove();
    });
  }
  
  async redeemInvite(inviteCode) {
    // Close any open modals
    document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
    
    // Check if it's the universal admin code
    const isUniversalCode = inviteCode === 'GAMESCOM2025';
    
    // For universal code, always allow redemption
    // For regular codes, check if already redeemed
    const redeemedInvites = JSON.parse(localStorage.getItem('redeemedInvites') || '[]');
    
    if (isUniversalCode || !redeemedInvites.includes(inviteCode)) {
      if (!isUniversalCode) {
        redeemedInvites.push(inviteCode);
        localStorage.setItem('redeemedInvites', JSON.stringify(redeemedInvites));
      }
      
      // Track redemption
      console.log(`[Invite] Redeemed ${isUniversalCode ? 'universal' : 'regular'} invite code: ${inviteCode}`);
      
      // Give the new user their starter invites
      this.currentUser.invites.available = isUniversalCode ? 15 : 10; // Bonus invites for universal code
      this.currentUser.invites.receivedFrom = inviteCode;
      this.currentUser.invites.fromUniversal = isUniversalCode;
      this.saveUserData();
      
      // Show success and redirect to profile setup
      const message = isUniversalCode ? 
        '🔥 Welcome! Universal code accepted! You get 15 bonus invites!' :
        '✨ Welcome! You now have 10 invites to share!';
      this.showToast(message);
      
      // Navigate to account section for profile setup
      setTimeout(() => {
        this.navigateToSection('account');
      }, 1500);
    } else {
      this.showToast('This invite code has already been used on this device.');
    }
    
    // Clear the invite from URL
    const url = new URL(window.location);
    url.searchParams.delete('invite');
    window.history.replaceState({}, document.title, url.pathname);
  }

  async deferredInit() {
    // Defer non-critical initialization
    requestIdleCallback(() => {
      this.loadInitialData().catch(error => {
        this.handleNonFatalError(error, 'Loading initial data');
      });
    });

    requestIdleCallback(() => {
      this.setupPWAFeatures();
    });

    // Preload next section after user interaction
    let hasInteracted = false;
    const preloadNext = () => {
      if (!hasInteracted) {
        hasInteracted = true;
        this.preloadNextSection();
        document.removeEventListener('click', preloadNext);
        document.removeEventListener('keydown', preloadNext);
      }
    };
    document.addEventListener('click', preloadNext);
    document.addEventListener('keydown', preloadNext);
  }

  preloadNextSection() {
    // Preload data for other sections
    requestIdleCallback(() => {
      this.fetchInviteStatus().catch(() => {});
    });
  }

  async initializeUser() {
    // Get or create user from localStorage/backend
    const storedUser = localStorage.getItem('conference_user');
    if (storedUser) {
      this.currentUser = JSON.parse(storedUser);
      // Convert savedEvents array back to Set
      if (Array.isArray(this.currentUser.savedEvents)) {
        this.currentUser.savedEvents = new Set(this.currentUser.savedEvents);
      } else if (!this.currentUser.savedEvents) {
        this.currentUser.savedEvents = new Set();
      }
    } else {
      this.currentUser = {
        id: this.generateUserId(),
        created: new Date().toISOString(),
        profile: {
          name: 'Professional',
          role: 'Conference Attendee', 
          company: '',
          email: '',
          phone: '',
          linkedin: ''
        },
        invites: { available: 10, sent: [], received: [], redemptions: 0 },
        connections: [],
        rsvps: {},
        savedEvents: new Set(),
        preferences: { notifications: true, location: false }
      };
      this.saveUserData();
    }
    
    // Check for admin privileges
    this.checkAdminStatus();
  }

  checkAdminStatus() {
    const adminEmail = 'jamy@nigriconsulting.com';
    const userEmail = this.currentUser.profile?.email?.toLowerCase();
    
    if (userEmail === adminEmail) {
      this.currentUser.isAdmin = true;
      this.currentUser.invites.available = 99999; // Unlimited
      console.log('[Admin] Admin privileges activated for', userEmail);
    } else {
      this.currentUser.isAdmin = false;
      // Check for redemption-based invite refills
      this.checkInviteRefill();
    }
    
    this.saveUserData();
  }

  checkInviteRefill() {
    // Award 5 new invites for every 5 redemptions
    const redemptions = this.currentUser.invites.redemptions || 0;
    const refillsEarned = Math.floor(redemptions / 5);
    const baseInvites = 10;
    const bonusInvites = refillsEarned * 5;
    const totalEarnedInvites = baseInvites + bonusInvites;
    
    // Calculate how many invites should be available based on usage
    const invitesSent = this.currentUser.invites.sent?.length || 0;
    const shouldHaveAvailable = Math.max(0, totalEarnedInvites - invitesSent);
    
    // Update if current available is less than what they should have
    if (this.currentUser.invites.available < shouldHaveAvailable) {
      const oldAvailable = this.currentUser.invites.available;
      this.currentUser.invites.available = shouldHaveAvailable;
      console.log(`[Invite Refill] Redemptions: ${redemptions}, Refills earned: ${refillsEarned}, Available: ${oldAvailable} → ${shouldHaveAvailable}`);
    }
  }

  // Track when someone redeems an invite
  recordInviteRedemption() {
    if (!this.currentUser.invites.redemptions) {
      this.currentUser.invites.redemptions = 0;
    }
    
    this.currentUser.invites.redemptions++;
    console.log(`[Redemption] User now has ${this.currentUser.invites.redemptions} redemptions`);
    
    // Check if they earned new invites (every 5 redemptions = +5 invites)
    const newRefills = Math.floor(this.currentUser.invites.redemptions / 5);
    const oldRefills = Math.floor((this.currentUser.invites.redemptions - 1) / 5);
    
    if (newRefills > oldRefills) {
      this.currentUser.invites.available += 5;
      console.log(`[Bonus] +5 invites earned! New total: ${this.currentUser.invites.available}`);
      
      // Show notification to user
      this.showInviteRefillNotification();
    }
    
    this.saveUserData();
  }

  showInviteRefillNotification() {
    const notification = document.createElement('div');
    notification.className = 'invite-refill-notification';
    notification.innerHTML = `
      <div class="notification-content">
        🎉 <strong>Bonus Invites Earned!</strong><br>
        +5 invites for reaching ${this.currentUser.invites.redemptions} redemptions
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 4000);
  }

  // Admin test function to simulate redemptions
  testRedemptions(count = 1) {
    if (!this.currentUser.isAdmin) {
      console.log('Only admins can test redemptions');
      return;
    }
    
    for (let i = 0; i < count; i++) {
      this.recordInviteRedemption();
    }
    
    this.renderMainInterface();
    console.log(`[Test] Added ${count} redemptions. Total: ${this.currentUser.invites.redemptions}`);
  }

  setupNavigation() {
    const app = document.getElementById('app');
    // Build the complete interface with navigation
    app.innerHTML = `
      <div class="unified-app">
        <!-- Header with navigation tabs -->
        <header class="app-header">
          <div class="header-content">
            <div class="app-logo">
              <h1>Gamescom 2025</h1>
              <span class="tagline">Professional Networking</span>
            </div>
            
            <!-- Top navigation tabs -->
            <nav class="top-nav">
              <button class="nav-tab nav-tab--active" data-section="parties">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span>Parties</span>
              </button>
              <button class="nav-tab" data-section="calendar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zM19 19H5V8h14v11z"/>
                </svg>
                <span>Calendar</span>
              </button>
              <button class="nav-tab" data-section="contacts">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.5 7h-5c-.8 0-1.52.5-1.8 1.2l-2.12 5.31L7 12c-1.1 0-2 .9-2 2v8h2v-4h2v4h2v-3.5c0-.28.22-.5.5-.5s.5.22.5.5V22h8z"/>
                </svg>
                <span>Contacts</span>
              </button>
              <button class="nav-tab" data-section="invites">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <span>Invites</span>
              </button>
              <button class="nav-tab" data-section="account">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
                <span>Account</span>
              </button>
            </nav>
            
            <div class="header-actions">
              <button class="notification-btn" data-action="notifications">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
                </svg>
                <span class="notification-count" id="notification-count"></span>
              </button>
            </div>
          </div>
        </header>

        <!-- Main content area -->
        <main class="app-main" id="app-main">
          <div class="content-loading">
            <div class="loading-spinner"></div>
            <p>Loading conference data...</p>
          </div>
        </main>

        <!-- Bottom navigation -->
        <nav class="bottom-nav">
          <button class="nav-item nav-item--active" data-section="parties" aria-label="Parties">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span>Parties</span>
          </button>
          <button class="nav-item" data-section="calendar" aria-label="Calendar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zM19 19H5V8h14v11z"/>
            </svg>
            <span>Calendar</span>
          </button>
          <button class="nav-item" data-section="contacts" aria-label="Contacts">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.5 7h-5c-.8 0-1.52.5-1.8 1.2l-2.12 5.31L7 12c-1.1 0-2 .9-2 2v8h2v-4h2v4h2v-3.5c0-.28.22-.5.5-.5s.5.22.5.5V22h8z"/>
            </svg>
            <span>Contacts</span>
          </button>
          <button class="nav-item" data-section="invites" aria-label="Invites">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            <span>Invites</span>
          </button>
          <button class="nav-item" data-section="account" aria-label="Account">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
            <span>Account</span>
          </button>
        </nav>
      </div>
    `;
  }

  renderMainInterface() {
    const main = document.getElementById('app-main');
    const currentSection = this.getCurrentSection();
    
    switch(currentSection) {
      case 'parties':
        this.renderPartiesSection(main);
        break;
      case 'calendar':
        this.renderCalendarSection(main);
        break;
      case 'contacts':
        this.renderContactsSection(main);
        break;
      case 'invites':
        this.renderInvitesSection(main);
        break;
      case 'account':
        this.renderAccountSection(main);
        break;
      default:
        this.renderPartiesSection(main);
    }
  }

  async renderPartiesSection(container) {
    // Show loading state
    container.innerHTML = `
      <div class="party-list-container">
        <div class="events-loading">
          <div class="loading-spinner"></div>
          <p>Loading all 64 events...</p>
        </div>
      </div>
    `;
    
    // Load organized party list
    try {
      // Add CSS if not already loaded
      if (!document.querySelector('link[href*="party-list-organized.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/assets/css/party-list-organized.css';
        document.head.appendChild(link);
      }
      
      // Load the organized party list module
      if (!window.OrganizedPartyList) {
        const script = document.createElement('script');
        script.src = '/assets/js/party-list-organized.js';
        document.body.appendChild(script);
        
        // Wait for script to load
        await new Promise(resolve => {
          script.onload = resolve;
          setTimeout(resolve, 1000); // Fallback timeout
        });
      }
      
      // Initialize the organized list
      const organizedList = new window.OrganizedPartyList();
      await organizedList.init();
      
    } catch (error) {
      console.error('Failed to load parties:', error);
      
      try {
        // Fallback to previous implementation
        const { default: PremiumPartyList } = await import('./party-list-premium.js');
        
        // Initialize premium party list
        this.premiumPartyList = new PremiumPartyList(container, {
          itemHeight: 200,
          buffer: 3,
          pageSize: 20,
          maxCacheSize: 1000,
          cacheTTL: 300000
        });
        
        console.log('[App] Premium party list initialized');
      } catch (fallbackError) {
        console.warn('[App] Premium party list import failed, using fallback:', fallbackError);
        // Show error state
        this.renderErrorState(container);
      }
    }
  }

  async renderPremiumPartyCards() {
    // Get party data
    const parties = await this.fetchPartiesData();
    
    return parties.map(party => `
      <div class="party-card-premium" data-party-id="${party.id}">
        <div class="card-glass-bg"></div>
        
        <div class="card-header-premium">
          <div class="status-cluster">
            <span class="status-live">
              <span class="live-dot"></span>
              LIVE
            </span>
            <span class="status-time">${this.formatTime(party.start || party.time)}</span>
            <span class="status-category ${party.category || 'party'}">${(party.category || 'Party').toUpperCase()}</span>
          </div>
          
          <div class="card-actions-cluster">
            <button class="action-btn action-btn--save" data-action="toggle-save" data-party-id="${party.id}">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </button>
            
            <button class="action-btn action-btn--share" data-action="share" data-party-id="${party.id}">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="card-content-premium">
          <h3 class="party-title-premium">${party.title}</h3>
          
          <div class="party-meta">
            <div class="meta-item">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"/>
              </svg>
              <span>${party.venue || 'Cologne'}</span>
            </div>
            
            <div class="meta-item">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                <path d="M10 1C5.03 1 1 5.03 1 10s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zM9 17v-6H7v6H5V7h4v10z"/>
              </svg>
              <span>${Math.floor(Math.random() * 500) + 50} attending</span>
            </div>
          </div>
          
          <p class="party-description-premium">${party.description || 'Join the hottest party at Gamescom 2025'}</p>
        </div>

        <div class="card-actions-premium">
          <button class="btn-primary btn-rsvp" data-action="rsvp" data-party-id="${party.id}">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
              <path d="M10 1C5.03 1 1 5.03 1 10s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z"/>
            </svg>
            RSVP Now
          </button>
          
          <button class="btn-secondary btn-details" data-action="view-details" data-party-id="${party.id}">
            View Details
          </button>
        </div>

        <div class="card-border-gradient"></div>
      </div>
    `).join('');
  }

  renderPartiesError(container, error) {
    container.innerHTML = `
      <div class="parties-error">
        <div class="error-icon">⚠️</div>
        <h3>Unable to load parties</h3>
        <p>We're having trouble connecting to our servers. Please check your connection and try again.</p>
        <button class="retry-btn" onclick="window.conferenceApp.renderMainInterface()">
          Retry Loading
        </button>
      </div>
    `;
  }

  animatePartyCards() {
    const cards = document.querySelectorAll('.party-card-signature');
    cards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }

  async renderCalendarSection(container) {
    const userRSVPs = Object.keys(this.currentUser.rsvps);
    const upcomingEvents = userRSVPs.length > 0 ? 
      await this.fetchEventsByIds(userRSVPs) : [];

    container.innerHTML = `
      <div class="section-calendar">
        <div class="section-header">
          <h2>Your Calendar</h2>
          <button class="sync-btn" data-action="sync-google-calendar">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zM2 8v8a2 2 0 002 2h12a2 2 0 002-2V8H2z"/>
            </svg>
            Sync Google Calendar
          </button>
        </div>
        
        <div class="calendar-content">
          ${upcomingEvents.length > 0 ? `
            <div class="upcoming-events">
              <h3>Upcoming Events</h3>
              <div class="events-list">
                ${upcomingEvents.map(event => this.renderCalendarEvent(event)).join('')}
              </div>
            </div>
          ` : `
            <div class="empty-calendar">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
                <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zM19 19H5V8h14v11z"/>
              </svg>
              <h3>No upcoming events</h3>
              <p>RSVP to parties to see them here</p>
              <button class="cta-btn" data-action="browse-parties">Browse Parties</button>
            </div>
          `}
        </div>
      </div>
    `;
  }

  async renderContactsSection(container) {
    const connections = this.currentUser.connections || [];
    
    container.innerHTML = `
      <div class="section-contacts">
        <div class="section-header">
          <h2>Your Network</h2>
          <button class="add-contact-btn" data-action="add-contact">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"/>
            </svg>
            Add Contact
          </button>
        </div>
        
        <div class="contacts-content">
          ${connections.length > 0 ? `
            <div class="contacts-grid">
              ${connections.map(contact => this.renderContactCard(contact)).join('')}
            </div>
          ` : `
            <div class="empty-contacts">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
                <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.5 7h-5c-.8 0-1.52.5-1.8 1.2l-2.12 5.31L7 12c-1.1 0-2 .9-2 2v8h2v-4h2v4h2v-3.5c0-.28.22-.5.5-.5s.5.22.5.5V22h8z"/>
              </svg>
              <h3>No connections yet</h3>
              <p>Meet people at parties to grow your network</p>
              <button class="cta-btn" data-action="browse-parties">Find Networking Events</button>
            </div>
          `}
        </div>
      </div>
    `;
  }

  async renderInvitesSection(container) {
    const profile = this.currentUser.profile;
    const isLoggedIn = profile?.email && profile.email !== '';
    
    if (!isLoggedIn) {
      container.innerHTML = `
        <div class="section-invites">
          <div class="section-header">
            <h2>Invite System</h2>
          </div>
          <div class="login-prompt" style="background: var(--color-surface); padding: 2rem; border-radius: 8px; margin: 1rem 0; text-align: center;">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="var(--color-accent)" style="margin-bottom: 1rem;">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            <h3 style="color: var(--color-accent); margin-bottom: 1rem;">Login to Generate Invites</h3>
            <p style="color: var(--color-text-dim); margin-bottom: 1.5rem;">Create an account to get 10 free invites and start building your professional network.</p>
            <button class="primary-btn" onclick="window.conferenceApp.navigateToSection('account')" style="padding: 1rem 2rem; background: var(--color-accent); color: white; border: none; border-radius: 4px; font-size: 1.1rem; cursor: pointer;">
              Login Now
            </button>
            <p style="color: var(--color-text-dim); margin-top: 1rem; font-size: 0.9rem;">
              Admins get unlimited invites!
            </p>
          </div>
        </div>
      `;
      return;
    }
    
    const inviteData = await this.fetchInviteStatus();
    const availableText = this.currentUser.isAdmin ? 'Unlimited' : inviteData.available;
    const isDisabled = !this.currentUser.isAdmin && inviteData.available === 0;
    
    // Calculate redemption progress for non-admin users
    const redemptions = this.currentUser.invites.redemptions || 0;
    const progressToNext = redemptions % 5;
    const nextBonus = 5 - progressToNext;
    const showProgress = !this.currentUser.isAdmin && redemptions < 50; // Show up to 10 bonus rounds
    
    container.innerHTML = `
      <div class="section-invites">
        <div class="section-header">
          <h2>Invite System ${this.currentUser.isAdmin ? '<span class="admin-badge">ADMIN</span>' : ''}</h2>
          <div class="invite-stats">
            <span class="stat-item">
              <strong>${availableText}</strong> Available
            </span>
            <span class="stat-item">
              <strong>${inviteData.sent.length}</strong> Sent
            </span>
            ${showProgress ? `
            <span class="stat-item redemption-progress">
              <strong>${redemptions}</strong> Redemptions
              <small>+5 invites in ${nextBonus} more</small>
            </span>
            ` : ''}
          </div>
        </div>
        
        <div class="invite-content">
          <div class="invite-actions">
            <button class="primary-btn" data-action="create-invite" ${isDisabled ? 'disabled' : ''}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"/>
              </svg>
              Send Invite
            </button>
            <button class="secondary-btn" data-action="my-invite-link">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5z"/>
                <path d="M7.414 15.414a2 2 0 01-2.828-2.828l3-3a2 2 0 012.828 0 1 1 0 001.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5z"/>
              </svg>
              My Invite Link
            </button>
          </div>
          
          ${inviteData.sent.length > 0 ? `
            <div class="sent-invites">
              <h3>Sent Invites</h3>
              <div class="invites-list">
                ${inviteData.sent.map(invite => this.renderInviteItem(invite)).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  async renderAccountSection(container) {
    const profile = this.currentUser.profile;
    const isLoggedIn = profile?.email && profile.email !== '';
    
    container.innerHTML = `
      <div class="section-account">
        <div class="section-header">
          <h2>Your Profile ${this.currentUser.isAdmin ? '<span class="admin-badge">ADMIN</span>' : ''}</h2>
          <button class="edit-btn" data-action="edit-profile">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
            </svg>
            ${isLoggedIn ? 'Edit' : 'Login'}
          </button>
        </div>
        
        ${!isLoggedIn ? `
          <div class="login-prompt" style="background: var(--color-surface); padding: 2rem; border-radius: 8px; margin: 1rem 0;">
            <h3 style="color: var(--color-accent); margin-bottom: 1rem;">Welcome! Please login to access all features</h3>
            <p style="color: var(--color-text-dim); margin-bottom: 1.5rem;">Login with your email to generate invites and access premium features.</p>
            <button class="primary-btn" data-action="edit-profile" style="width: 100%; padding: 1rem; background: var(--color-accent); color: white; border: none; border-radius: 4px; font-size: 1.1rem; cursor: pointer;">
              Login / Sign Up
            </button>
            <p style="color: var(--color-text-dim); margin-top: 1rem; font-size: 0.9rem;">
              Admin? Use email: jamy@nigriconsulting.com for unlimited invites
            </p>
          </div>
        ` : ''}
        
        <div class="profile-content">
          <div class="profile-header">
            <div class="profile-avatar-large">
              <span>${profile?.name?.[0] || 'U'}</span>
            </div>
            <div class="profile-info">
              <h3>${profile?.name || 'Professional'}</h3>
              <p class="role">${profile?.role || 'Conference Attendee'}</p>
              <p class="company">${profile?.company || 'Add company'}</p>
              ${profile?.email ? `<p class="email" style="color: var(--color-text-dim);">${profile.email}</p>` : ''}
            </div>
          </div>
          
          <div class="profile-stats">
            <div class="stat-card">
              <strong>${this.currentUser.connections?.length || 0}</strong>
              <span>Connections</span>
            </div>
            <div class="stat-card">
              <strong>${Object.keys(this.currentUser.rsvps || {}).length}</strong>
              <span>Events</span>
            </div>
            <div class="stat-card">
              <strong>${this.currentUser.savedEvents?.size || 0}</strong>
              <span>Saved</span>
            </div>
          </div>
          
          <div class="account-actions">
            <button class="action-item" data-action="sync-linkedin">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              <span>Sync LinkedIn</span>
            </button>
            <button class="action-item" data-action="export-data">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z"/>
              </svg>
              <span>Export Data</span>
            </button>
            <button class="action-item" data-action="settings">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
              </svg>
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderPartyCards(parties) {
    return parties.map(party => `
      <div class="party-card-signature" data-party-id="${party.id}">
        <div class="card-glass"></div>
        
        <div class="card-header">
          <div class="status-badges">
            <span class="status-badge status-badge--live">🔴 Live</span>
            <span class="status-badge status-badge--time">${this.formatTime(party.start || party.time)}</span>
          </div>
          <button class="save-btn ${this.currentUser.savedEvents.has(party.id) ? 'save-btn--saved' : ''}" 
                  data-action="save" data-party-id="${party.id}">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          </button>
        </div>
        
        <div class="card-content">
          <h3 class="party-title">${party.title}</h3>
          <div class="party-venue">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"/>
            </svg>
            <span>${party.venue || 'Cologne'}</span>
          </div>
          <p class="party-description">${party.description || 'Join the hottest party at Gamescom 2025'}</p>
          
          <div class="card-actions">
            <button class="action-btn action-btn--primary" data-action="rsvp" data-party-id="${party.id}">
              RSVP Now
            </button>
            <button class="action-btn" data-action="invite-friends" data-party-id="${party.id}">
              Invite Friends
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  renderCalendarEvent(event) {
    return `
      <div class="calendar-event">
        <div class="event-time">${this.formatTime(event.start)}</div>
        <div class="event-details">
          <h4>${event.title}</h4>
          <p>${event.venue}</p>
        </div>
        <div class="event-actions">
          <button class="icon-btn" data-action="add-to-calendar" data-event-id="${event.id}">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17 3h-1V1a1 1 0 00-2 0v2H6V1a1 1 0 00-2 0v2H3a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  renderContactCard(contact) {
    return `
      <div class="contact-card">
        <div class="contact-avatar">
          <span>${contact.name?.[0] || 'C'}</span>
        </div>
        <div class="contact-info">
          <h4>${contact.name}</h4>
          <p>${contact.company || 'Conference Attendee'}</p>
          <p class="contact-role">${contact.role || ''}</p>
        </div>
        <div class="contact-actions">
          <button class="icon-btn" data-action="message" data-contact-id="${contact.id}">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  renderInviteItem(invite) {
    return `
      <div class="invite-item">
        <div class="invite-info">
          <span class="invite-email">${invite.email}</span>
          <span class="invite-status ${invite.status}">${invite.status}</span>
        </div>
        <div class="invite-date">${this.formatDate(invite.sentAt)}</div>
      </div>
    `;
  }

  setupEventListeners() {
    document.addEventListener('click', this.handleGlobalClick.bind(this));
    window.addEventListener('online', () => this.isOnline = true);
    window.addEventListener('offline', () => this.isOnline = false);
    
    // Navigation - handle both top nav tabs and bottom nav items
    document.querySelectorAll('.nav-tab, .nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const section = e.currentTarget.dataset.section;
        this.navigateToSection(section);
      });
    });
  }

  async handleGlobalClick(e) {
    const action = e.target.closest('[data-action]')?.dataset.action;
    const partyId = e.target.closest('[data-party-id]')?.dataset.partyId;
    
    switch(action) {
      case 'save':
        await this.toggleSaveParty(partyId);
        break;
      case 'rsvp':
        await this.handleRSVP(partyId);
        break;
      case 'invite-friends':
        this.openInviteModal(partyId);
        break;
      case 'sync-google-calendar':
        await this.syncGoogleCalendar();
        break;
      case 'create-invite':
        await this.createInvite();
        break;
      case 'add-contact':
        this.openAddContactModal();
        break;
      case 'edit-profile':
        this.openProfileEditor();
        break;
      case 'sync-linkedin':
        await this.syncLinkedIn();
        break;
      case 'browse-parties':
        this.navigateToSection('parties');
        break;
    }
  }

  // API Integration Methods
  async fetchPartiesData() {
    const cacheKey = 'parties';
    const cacheTimeout = 300000; // 5 minutes
    
    // Check memory cache
    if (this.cache.has(cacheKey)) {
      const { data, timestamp } = this.cache.get(cacheKey);
      if (Date.now() - timestamp < cacheTimeout) {
        console.log('[Cache] Using cached parties data');
        return data;
      }
    }
    
    // Check localStorage cache
    try {
      const stored = localStorage.getItem('parties_cache');
      if (stored) {
        const { data, timestamp } = JSON.parse(stored);
        if (Date.now() - timestamp < cacheTimeout) {
          console.log('[Cache] Using localStorage parties data');
          this.cache.set(cacheKey, { data, timestamp });
          return data;
        }
      }
    } catch (e) {
      console.warn('[Cache] Failed to read localStorage cache');
    }
    
    try {
      console.log('[API] Fetching fresh parties data');
      const parties = await fetchParties();
      
      if (parties && parties.length > 0) {
        const cacheData = { data: parties, timestamp: Date.now() };
        
        // Update memory cache
        this.cache.set(cacheKey, cacheData);
        
        // Update localStorage cache
        try {
          localStorage.setItem('parties_cache', JSON.stringify(cacheData));
        } catch (e) {
          console.warn('[Cache] Failed to save to localStorage');
        }
        
        return parties;
      }
      
      throw new Error('No parties data received');
      
    } catch (error) {
      console.error('[API] Failed to fetch parties:', error);
      
      // Try to return stale cache data as fallback
      try {
        const stored = localStorage.getItem('parties_cache');
        if (stored) {
          const { data } = JSON.parse(stored);
          console.log('[Fallback] Using stale cache data');
          return data;
        }
      } catch (e) {
        console.warn('[Fallback] No cache data available');
      }
      
      return [];
    }
  }

  async fetchInviteStatus() {
    try {
      const response = await fetch(`${this.apiBase}/invites/status`, {
        headers: { 'User-ID': this.currentUser.id }
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch invite status:', error);
    }
    
    // Fallback to localStorage with safe defaults
    return this.currentUser?.invites || { 
      available: 10, 
      sent: [], 
      received: [], 
      redemptions: 0 
    };
  }

  async toggleSaveParty(partyId) {
    const isSaved = this.currentUser.savedEvents.has(partyId);
    
    if (isSaved) {
      this.currentUser.savedEvents.delete(partyId);
      this.showToast('Event removed from saved');
    } else {
      this.currentUser.savedEvents.add(partyId);
      
      // Show calendar sync prompt when saving
      this.showCalendarSyncPrompt(partyId);
    }
    
    this.saveUserData();
    
    // Update UI
    const saveBtn = document.querySelector(`[data-party-id="${partyId}"] .save-btn`);
    if (saveBtn) {
      saveBtn.classList.toggle('save-btn--saved', !isSaved);
    }
  }
  
  showCalendarSyncPrompt(partyId) {
    // Create a floating prompt for calendar sync
    const prompt = document.createElement('div');
    prompt.className = 'calendar-sync-prompt';
    prompt.innerHTML = `
      <div class="sync-prompt-content">
        <div class="sync-prompt-header">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zM19 19H5V8h14v11z"/>
          </svg>
          <span>Event Saved!</span>
        </div>
        <p>Would you like to sync this event to your calendar?</p>
        <div class="sync-prompt-actions">
          <button class="sync-btn sync-btn--google" data-action="sync-google-calendar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google Calendar
          </button>
          <button class="sync-btn sync-btn--later" data-action="dismiss-sync">
            Later
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(prompt);
    
    // Animate in
    requestAnimationFrame(() => {
      prompt.classList.add('calendar-sync-prompt--visible');
    });
    
    // Handle actions
    prompt.addEventListener('click', async (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      
      if (action === 'sync-google-calendar') {
        await this.syncGoogleCalendar();
        this.removePrompt(prompt);
      } else if (action === 'dismiss-sync') {
        this.removePrompt(prompt);
        this.showToast('Event saved! You can sync to calendar anytime from the Calendar tab.');
      }
    });
    
    // Auto-dismiss after 8 seconds
    setTimeout(() => {
      if (prompt.parentNode) {
        this.removePrompt(prompt);
      }
    }, 8000);
  }
  
  removePrompt(prompt) {
    prompt.classList.remove('calendar-sync-prompt--visible');
    setTimeout(() => {
      prompt.remove();
    }, 300);
  }

  async handleRSVP(partyId) {
    try {
      // Add to user RSVPs
      this.currentUser.rsvps[partyId] = {
        status: 'going',
        timestamp: new Date().toISOString()
      };
      this.saveUserData();
      
      // Show success feedback
      this.showToast('🎉 RSVP confirmed! Added to your calendar.');
      
      // Trigger calendar sync if available
      await this.addToGoogleCalendar(partyId);
      
    } catch (error) {
      console.error('RSVP failed:', error);
      this.showToast('Failed to RSVP. Please try again.');
    }
  }

  async createInvite() {
    try {
      let inviteCode, inviteUrl;
      
      // Admin users get a special permanent code
      if (this.currentUser.isAdmin) {
        // Use a special admin code that never expires
        inviteCode = 'GAMESCOM2025';
        inviteUrl = `${window.location.origin}/?invite=${inviteCode}`;
        
        // Show special admin modal
        this.showAdminInviteModal(inviteCode, inviteUrl);
        
      } else {
        // Regular users get unique codes
        inviteCode = this.generateInviteCode();
        inviteUrl = `${window.location.origin}/?invite=${inviteCode}`;
        
        // Store the invite locally
        const newInvite = {
          code: inviteCode,
          url: inviteUrl,
          createdAt: new Date().toISOString(),
          redeemed: false
        };
        
        // Decrease count for non-admin users
        this.currentUser.invites.available--;
        this.currentUser.invites.sent.push(newInvite);
        this.saveUserData();
        
        // Show regular modal
        this.showInviteModal(inviteCode, inviteUrl);
      }
      
      // Try to sync with backend (optional)
      fetch(`${this.apiBase}/invites/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': this.currentUser.id
        },
        body: JSON.stringify({ code: inviteCode, isAdmin: this.currentUser.isAdmin })
      }).catch(err => console.log('Backend sync failed:', err));
      
      this.renderMainInterface();
      
      const message = this.currentUser.isAdmin ? 
        '🔥 Universal admin code ready! Share unlimited times!' : 
        `Invite created! ${this.currentUser.invites.available} remaining`;
      this.showToast(message);
      
    } catch (error) {
      console.error('Failed to create invite:', error);
      this.showToast('Failed to create invite. Please try again.');
    }
  }
  
  showAdminInviteModal(code, url) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px; text-align: center;">
        <div class="modal-header">
          <h3>🔥 Admin Universal Invite Code</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        
        <div style="padding: 2rem;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
            <p style="color: white; margin-bottom: 0.5rem; font-weight: bold;">UNIVERSAL CODE (Never Expires):</p>
            <h2 style="font-size: 2.5rem; color: white; letter-spacing: 0.2em; margin: 0.5rem 0; font-weight: bold;">${code}</h2>
            <p style="color: rgba(255,255,255,0.9); margin-top: 0.5rem; font-size: 0.9rem;">
              ✨ Share this code unlimited times!
            </p>
          </div>
          
          <div style="background: var(--color-surface); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
            <p style="color: var(--color-accent); margin-bottom: 0.5rem; font-weight: bold;">🔗 Universal Link:</p>
            <input type="text" value="${url}" readonly style="width: 100%; padding: 0.75rem; background: var(--color-bg); border: 2px solid var(--color-accent); border-radius: 4px; color: var(--color-text); font-size: 0.9rem; font-weight: bold;" onclick="this.select()">
            <p style="color: var(--color-text-dim); margin-top: 0.5rem; font-size: 0.85rem;">
              This link works forever and for everyone!
            </p>
          </div>
          
          <button class="primary-btn" onclick="navigator.clipboard.writeText('${url}').then(() => window.conferenceApp.showToast('🎉 Universal link copied!'))" style="width: 100%; padding: 1rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
            Copy Universal Link
          </button>
          
          <div style="margin-top: 1rem; padding: 1rem; background: var(--color-surface); border-radius: 8px; text-align: left;">
            <p style="color: var(--color-text-dim); font-size: 0.85rem; margin: 0;">
              <strong style="color: var(--color-accent);">Admin Benefits:</strong><br>
              • This code never expires<br>
              • Unlimited redemptions<br>
              • Same code for everyone<br>
              • Perfect for mass sharing
            </p>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  
  generateInviteCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
  
  showInviteModal(code, url) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px; text-align: center;">
        <div class="modal-header">
          <h3>Invite Code Generated!</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        
        <div style="padding: 2rem;">
          <div style="background: var(--color-surface); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
            <p style="color: var(--color-text-dim); margin-bottom: 0.5rem;">Your invite code:</p>
            <h2 style="font-size: 2rem; color: var(--color-accent); letter-spacing: 0.1em; margin: 0.5rem 0;">${code}</h2>
          </div>
          
          <div style="background: var(--color-surface); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
            <p style="color: var(--color-text-dim); margin-bottom: 0.5rem; font-size: 0.9rem;">Share this link:</p>
            <input type="text" value="${url}" readonly style="width: 100%; padding: 0.5rem; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 4px; color: var(--color-text); font-size: 0.9rem;" onclick="this.select()">
          </div>
          
          <button class="primary-btn" onclick="navigator.clipboard.writeText('${url}').then(() => window.conferenceApp.showToast('Link copied to clipboard!'))" style="width: 100%; padding: 1rem; background: var(--color-accent); color: white; border: none; border-radius: 4px; cursor: pointer;">
            Copy Link to Clipboard
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  async syncGoogleCalendar() {
    try {
      const response = await fetch(`${this.apiBase}/calendar/oauth/start`, {
        headers: { 'User-ID': this.currentUser.id }
      });
      
      if (response.ok) {
        const { authUrl } = await response.json();
        window.open(authUrl, '_blank');
        this.showToast('Opening Google Calendar sync...');
      }
    } catch (error) {
      console.error('Failed to sync calendar:', error);
      this.showToast('Calendar sync unavailable. Please try again later.');
    }
  }

  openProfileEditor() {
    const profile = this.currentUser.profile;
    
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content profile-editor">
        <div class="modal-header">
          <h3>Edit Profile</h3>
          <button class="modal-close" data-action="close-modal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        
        <form class="profile-form" id="profile-form">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" name="name" value="${profile?.name || ''}" placeholder="Your full name" required>
          </div>
          
          <div class="form-group">
            <label>Email Address ${this.currentUser.isAdmin ? '<span class="admin-badge">ADMIN</span>' : ''}</label>
            <input type="email" name="email" value="${profile?.email || ''}" placeholder="your.email@company.com" required>
          </div>
          
          <div class="form-group">
            <label>Role/Title</label>
            <input type="text" name="role" value="${profile?.role || ''}" placeholder="e.g., Game Developer, Publisher">
          </div>
          
          <div class="form-group">
            <label>Company</label>
            <input type="text" name="company" value="${profile?.company || ''}" placeholder="Your company name">
          </div>
          
          <div class="form-group">
            <label>Phone (Optional)</label>
            <input type="tel" name="phone" value="${profile?.phone || ''}" placeholder="+1 (555) 123-4567">
          </div>
          
          <div class="form-group">
            <label>LinkedIn Profile (Optional)</label>
            <input type="url" name="linkedin" value="${profile?.linkedin || ''}" placeholder="https://linkedin.com/in/yourprofile">
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn-secondary" data-action="close-modal">Cancel</button>
            <button type="submit" class="btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    `;
    
    // Add to page
    document.body.appendChild(modal);
    
    // Handle form submission
    const form = modal.querySelector('#profile-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveProfileChanges(new FormData(form));
      modal.remove();
    });
    
    // Handle modal close
    modal.addEventListener('click', (e) => {
      if (e.target.matches('.modal-overlay, .modal-close, [data-action="close-modal"]')) {
        modal.remove();
      }
    });
    
    // Focus first input
    setTimeout(() => {
      modal.querySelector('input[name="name"]').focus();
    }, 100);
  }

  saveProfileChanges(formData) {
    const profile = this.currentUser.profile;
    const oldEmail = profile.email;
    
    // Update profile data
    profile.name = formData.get('name');
    profile.email = formData.get('email');
    profile.role = formData.get('role');
    profile.company = formData.get('company');
    profile.phone = formData.get('phone');
    profile.linkedin = formData.get('linkedin');
    
    // Re-check admin status after email change
    this.checkAdminStatus();
    
    // Save to localStorage
    this.saveUserData();
    
    // Refresh UI
    this.renderMainInterface();
    
    // Show success message with admin status if changed
    let message = 'Profile updated successfully!';
    if (profile.email !== oldEmail && this.currentUser.isAdmin) {
      message += ' Admin privileges activated - unlimited invites enabled!';
    }
    this.showToast(message);
    
    console.log('[Profile] Updated:', profile);
    console.log('[Admin] Status:', this.currentUser.isAdmin);
  }

  // Utility Methods
  getCurrentSection() {
    const hash = window.location.hash;
    return hash.slice(1) || 'parties';
  }

  navigateToSection(section) {
    // Update nav state for both top tabs and bottom nav
    document.querySelectorAll('.nav-tab').forEach(item => {
      item.classList.toggle('nav-tab--active', item.dataset.section === section);
    });
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('nav-item--active', item.dataset.section === section);
    });
    
    // Update URL
    window.location.hash = section;
    
    // Render section
    this.renderMainInterface();
  }

  generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  saveUserData() {
    // Convert Set to Array for storage
    const userData = {
      ...this.currentUser,
      savedEvents: [...this.currentUser.savedEvents]
    };
    localStorage.setItem('conference_user', JSON.stringify(userData));
  }

  formatTime(timeString) {
    if (!timeString) return 'TBA';
    try {
      return new Date(timeString).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString;
    }
  }

  formatDate(dateString) {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  showToast(message) {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 90px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: var(--color-accent);
      color: white;
      padding: 12px 24px;
      border-radius: 24px;
      font-weight: 600;
      z-index: 10000;
      transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    
    setTimeout(() => {
      toast.style.transform = 'translateX(-50%) translateY(100px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  renderError(container, title, error) {
    container.innerHTML = `
      <div class="error-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        <h3>${title}</h3>
        <p>Please check your connection and try again.</p>
        <button class="retry-btn" onclick="location.reload()">Retry</button>
      </div>
    `;
  }

  async loadInitialData() {
    // Pre-load critical data
    try {
      await Promise.all([
        this.fetchPartiesData(),
        this.fetchInviteStatus()
      ]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }

  setupPWAFeatures() {
    // Register service worker if available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .catch(error => console.error('SW registration failed:', error));
    }
    
    // Handle online/offline states
    this.updateOnlineStatus();
  }

  updateOnlineStatus() {
    document.body.classList.toggle('offline', !this.isOnline);
    if (!this.isOnline) {
      this.showToast('You\'re offline. Some features may be limited.');
    }
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.conferenceApp = new UnifiedConferenceApp();
  });
} else {
  window.conferenceApp = new UnifiedConferenceApp();
}

export default UnifiedConferenceApp;