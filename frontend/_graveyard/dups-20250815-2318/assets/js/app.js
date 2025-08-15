import { Store, Events, EVENTS } from './state.js';
import { API } from './api.js';
import { mountRoute } from './router.js';
import { initInstallFTUE } from './ftue.js';
import { initPersistence } from './persistence.js';
import { renderPillCount, toast } from './ui.js';
import { createNetworkStatus } from './error-states.js';
import { errorHandler } from './error-handler.js';
import networkInspector from './network-inspector.js';
import deepLinkHandler from './deep-links.js';
import authManager from './auth.js';
import { showAuthModal } from './auth-view.js';
import inviteManager from './invite.js';
import './ui-feedback.js';
import './pwa-install.js';
import apiClient from '../config/api-client.js';
import devServer from '../config/dev-server.js';

console.log('🎯 Velocity - Professional Gaming Network');

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('✅ Beautiful GPT-5 design loaded');
  console.log('🔥 State management initialized:', Store);
  
  try {
    // Initialize environment-aware API client first
    console.log('🔧 Initializing API client...');
    await apiClient.initialize();
    
    // Initialize all systems
    initPersistence();
    initializeNavigation();
    initInstallFTUE();
    setupMobileMenu();
    setupAuthListeners();
    
    // Add network status indicator
    document.body.appendChild(createNetworkStatus());
    
    // Load initial data
    await loadInitialData();
    
    // Mount default route
    mountRoute(Store.route);
    
    // Update UI elements
    renderPillCount();
    
    console.log('🚀 Velocity app fully initialized');
  } catch (error) {
    console.error('❌ App initialization failed:', error);
    toast('App initialization failed - some features may not work');
  }
});

// Load initial application data
async function loadInitialData() {
  try {
    // Load parties data using API module
    const parties = await API.listParties();
    Store.parties = parties || [];
    console.log(`🎉 Loaded ${Store.parties.length} parties`);
    
    // Load profile if available
    const profile = await API.me();
    if (profile) {
      Store.profile = profile;
      console.log('👤 Profile loaded');
    }
    
  } catch (error) {
    console.warn('❌ Could not load initial data:', error);
    toast('Using offline mode');
  }
}

// Handle navigation
function initializeNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const route = item.dataset.route;
      if (route) {
        mountRoute(route);
      }
    });
  });
}

// Setup mobile menu toggle
function setupMobileMenu() {
  const menuButton = document.getElementById('menu');
  const sidenav = document.getElementById('sidenav');
  const overlay = document.getElementById('overlay');
  
  if (menuButton && sidenav && overlay) {
    menuButton.addEventListener('click', () => {
      const isOpen = sidenav.classList.contains('open');
      if (isOpen) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });
    
    overlay.addEventListener('click', closeMobileMenu);
  }
}

function openMobileMenu() {
  const sidenav = document.getElementById('sidenav');
  const overlay = document.getElementById('overlay');
  
  if (sidenav && overlay) {
    sidenav.classList.add('open');
    overlay.hidden = false;
  }
}

function closeMobileMenu() {
  const sidenav = document.getElementById('sidenav');
  const overlay = document.getElementById('overlay');
  
  if (sidenav && overlay) {
    sidenav.classList.remove('open');
    overlay.hidden = true;
  }
}

// Setup authentication event listeners
function setupAuthListeners() {
  // Listen for auth required events
  Events.on('auth:required', (event) => {
    const reason = event.detail?.reason || 'Sign in to continue';
    showAuthModal({
      title: 'Authentication Required',
      subtitle: reason
    });
  });
  
  // Listen for profile updates
  Events.on(EVENTS.PROFILE_UPDATED, (event) => {
    console.log('👤 Profile updated:', event.detail?.profile);
    // Update UI elements that show user info
    updateUserUI();
  });
  
  // Listen for logout
  Events.on('auth:logout', () => {
    console.log('👋 User logged out');
    // Clear any user-specific UI
    updateUserUI();
  });
}

// Update UI based on user authentication state
function updateUserUI() {
  const isAuthenticated = Store.profile?.authenticated;
  const userName = Store.profile?.firstName || Store.profile?.name;
  
  // Update any UI elements that show user state
  const meButton = document.querySelector('[data-route="me"]');
  if (meButton && userName) {
    meButton.innerHTML = `👤 ${userName}`;
  } else if (meButton) {
    meButton.innerHTML = '👤 Me';
  }
  
  // Show/hide features based on auth state
  const inviteButton = document.querySelector('[data-route="invites"]');
  if (inviteButton) {
    inviteButton.style.display = isAuthenticated ? 'block' : 'block'; // Always show, but may be limited
  }
}

// Global function to show auth modal (can be called from anywhere)
window.showAuth = function(options = {}) {
  return showAuthModal(options);
};

// Listen for state changes
Events.on(EVENTS.SAVED_PARTIES, (event) => {
  console.log('🎉 Parties updated:', event.detail?.count || event.detail?.length);
  renderPillCount();
});

Events.on(EVENTS.INVITES_CHANGED, () => {
  console.log('🎟 Invites updated');
  renderPillCount();
});

Events.on(EVENTS.INSTALLED, () => {
  console.log('✅ App installed successfully');
  toast('🎉 App installed successfully!');
});

Events.on(EVENTS.BONUS_UNLOCKED, (event) => {
  const kind = event.detail?.kind;
  console.log('🎁 Bonus unlocked:', kind);
  toast(`🎁 +5 invites unlocked! (${kind})`);
  renderPillCount();
});

Events.on(EVENTS.PERSISTENCE_LOADED, () => {
  console.log('💾 Persistence loaded, updating UI');
  renderPillCount();
});

Events.on(EVENTS.STORAGE_QUOTA_EXCEEDED, () => {
  toast('⚠️ Storage full - please clear data in Settings');
});

Events.on(EVENTS.NETWORK_RESTORED, () => {
  console.log('🌐 Network connection restored');
  // Refresh current view data
  if (Store.route === 'parties') {
    loadInitialData();
  }
});

Events.on(EVENTS.AUTH_REQUIRED, () => {
  console.log('🔐 Authentication required');
  // Could show auth modal here
});

Events.on(EVENTS.OFFLINE_MODE_ENABLED, () => {
  console.log('📱 Offline mode enabled');
  toast('📱 Working offline with cached data');
});

// Global error handling
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
  toast('Something went wrong. Please refresh.');
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
  e.preventDefault();
});

// Make app globally available for debugging
window.VelocityApp = {
  Store,
  Events,
  EVENTS,
  API,
  mountRoute
};