// Production App Bootstrap: Loads and initializes all modules
import './store.js';
import './events.js';
import './router-production.js';
import './auth-production.js';
import './invite-production.js';
import './ui-feedback-production.js';
import './events-controller-production.js';
import './install-production.js';
import './calendar-production.js';

import Store from './store.js';
import Events from './events.js';
import Auth from './auth-production.js';
import Router from './router-production.js';
import Invite from './invite-production.js';
import EventsController from './events-controller-production.js';
import Install from './install-production.js';

// Initialize app
class App {
  constructor() {
    this.initialized = false;
    this.config = {
      apiBase: '/api',
      googleClientId: '1234567890.apps.googleusercontent.com', // Replace with real ID
      linkedinClientId: '77chexyx9j5j8p', // Replace with real ID
      environment: this.detectEnvironment()
    };
  }
  
  detectEnvironment() {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    } else if (hostname.includes('staging')) {
      return 'staging';
    }
    return 'production';
  }
  
  async init() {
    if (this.initialized) return;
    
    console.log('🚀 Initializing Conference Party App...');
    
    try {
      // Initialize store with config
      Store.init();
      Store.set('config', this.config);
      
      // Initialize auth
      Auth.initAuth();
      
      // Initialize router (handles navigation)
      // Router auto-initializes on DOM ready
      
      // Check for pending invites
      await this.checkPendingInvite();
      
      // Initialize PWA features
      Install.init();
      
      // Setup global error handling
      this.setupErrorHandling();
      
      // Setup accessibility features
      this.setupAccessibility();
      
      // Setup navigation handlers
      this.setupNavigation();
      
      // Check authentication state
      this.checkAuthState();
      
      // Initialize complete
      this.initialized = true;
      
      console.log('✅ App initialized successfully');
      Events.emit('app:ready');
      
    } catch (error) {
      console.error('Failed to initialize app:', error);
      Events.emit('ui:toast', {
        type: 'error',
        message: 'Failed to initialize app'
      });
    }
  }
  
  async checkPendingInvite() {
    // Check if there's an invite code in the URL
    const hash = window.location.hash;
    if (hash.includes('/invite/')) {
      // Router will handle this automatically
      return;
    }
    
    // Check for stored pending invite
    const pendingInvite = Store.get('pendingInvite');
    if (pendingInvite && !pendingInvite.redeemed) {
      Events.emit('ui:toast', {
        type: 'info',
        message: 'You have a pending invite',
        action: {
          label: 'View',
          onClick: () => Router.navigate(`/invite/${pendingInvite.code}`)
        }
      });
    }
  }
  
  checkAuthState() {
    const user = Store.get('user');
    
    if (user) {
      // User is logged in
      if (!user.onboarded) {
        // Need to complete onboarding
        if (!window.location.hash.includes('onboarding')) {
          Router.navigate('/onboarding');
        }
      } else {
        // Fully authenticated and onboarded
        if (window.location.hash === '' || window.location.hash === '#/') {
          Router.navigate('/events');
        }
      }
    } else {
      // Not logged in
      const protectedRoutes = ['people', 'opportunities', 'me', 'calendar'];
      const currentRoute = Router.getCurrentRoute();
      
      if (protectedRoutes.includes(currentRoute.name)) {
        Router.navigate('/');
      }
    }
  }
  
  setupErrorHandling() {
    // Global error handler
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      
      // Don't show toast for network errors in development
      if (this.config.environment === 'development' && 
          event.message.includes('NetworkError')) {
        return;
      }
      
      Events.emit('ui:toast', {
        type: 'error',
        message: 'An error occurred. Please refresh the page.'
      });
    });
    
    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Don't show toast for certain expected rejections
      if (event.reason?.message?.includes('User cancelled')) {
        return;
      }
    });
  }
  
  setupAccessibility() {
    // Live region for screen reader announcements
    const liveRegion = document.getElementById('aria-live-status');
    if (liveRegion) {
      Events.on('ui:toast', ({ message }) => {
        liveRegion.textContent = '';
        setTimeout(() => {
          liveRegion.textContent = message;
        }, 100);
      });
      
      Events.on('route:change', (route) => {
        const routeNames = {
          home: 'Home',
          events: 'Events',
          people: 'People',
          opportunities: 'Opportunities',
          me: 'Profile',
          onboarding: 'Onboarding'
        };
        
        const name = routeNames[route.name] || route.name;
        liveRegion.textContent = `Navigated to ${name}`;
      });
    }
    
    // Skip link functionality
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) {
      skipLink.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector('#main-content');
        if (target) {
          target.setAttribute('tabindex', '-1');
          target.focus();
        }
      });
    }
  }
  
  setupNavigation() {
    // Bottom tab navigation
    document.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-tab]');
      if (!tab) return;
      
      e.preventDefault();
      const tabName = tab.dataset.tab;
      
      const routes = {
        now: '/',
        people: '/people',
        opportunities: '/opportunities',
        events: '/events',
        me: '/me'
      };
      
      const route = routes[tabName];
      if (route) {
        Router.navigate(route);
      }
    });
    
    // Update active tab on route change
    Events.on('route:change', (route) => {
      // Remove all active classes
      document.querySelectorAll('[data-tab]').forEach(tab => {
        tab.classList.remove('active');
      });
      
      // Add active class to current tab
      const tabMap = {
        home: 'now',
        people: 'people',
        opportunities: 'opportunities',
        events: 'events',
        me: 'me'
      };
      
      const tabName = tabMap[route.name];
      if (tabName) {
        document.querySelectorAll(`[data-tab="${tabName}"]`).forEach(tab => {
          tab.classList.add('active');
        });
      }
    });
    
    // Search functionality
    const searchInput = document.querySelector('input[type="search"], .search-input');
    if (searchInput) {
      let searchTimeout;
      
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value;
        
        searchTimeout = setTimeout(() => {
          Events.emit('search', { query });
        }, 300);
      });
      
      // Clear search
      Events.on('search:clear', () => {
        searchInput.value = '';
      });
      
      // Focus search on keyboard shortcut
      Events.on('search:focus', () => {
        searchInput.focus();
      });
    }
    
    // Sign out handler
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="signout"]')) {
        e.preventDefault();
        Auth.signOut();
      }
    });
  }
  
  // Public API
  getConfig() {
    return this.config;
  }
  
  getUser() {
    return Store.get('user');
  }
  
  isAuthenticated() {
    return Auth.isAuthenticated();
  }
  
  navigate(path) {
    Router.navigate(path);
  }
}

// Create and initialize app instance
const app = new App();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  app.init();
  
  // Expose app instance for debugging
  if (app.config.environment === 'development') {
    window.app = app;
    window.Store = Store;
    window.Events = Events;
    window.Router = Router;
    
    console.log('🔧 Debug mode enabled. Access window.app, window.Store, window.Events, window.Router');
  }
});

// Handle visibility changes
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // Page became visible - refresh data if needed
    const lastSync = Store.get('cache.lastSync') || 0;
    const hoursSinceSync = (Date.now() - lastSync) / (1000 * 60 * 60);
    
    if (hoursSinceSync > 1) {
      Events.emit('sync:request');
    }
  }
});

// Handle online/offline
window.addEventListener('online', () => {
  Events.emit('ui:toast', {
    type: 'success',
    message: 'Connection restored'
  });
  
  // Sync data
  Events.emit('sync:request');
});

window.addEventListener('offline', () => {
  Events.emit('ui:toast', {
    type: 'warning',
    message: 'You are offline. Some features may be limited.'
  });
});

// Export app instance
export default app;