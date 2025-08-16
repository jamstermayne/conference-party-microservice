/**
 * PRODUCTION APP WIREUP MODULE
 * One-time bootstrap: bind global UX, routing, and FTUE cues
 * Based on GPT-5 architecture for Professional Intelligence Platform
 */

// Import all production modules
import './../../js/router.js';
import './../../js/auth.js';
import './../../js/invite.js';
import './../../js/ui-feedback.js';
import './../../js/events-controller.js';
import './../../js/install.js';
import './../../js/calendar-integration.js';

import Events from './../../js/events.js';
import Store from './../../js/store.js';
import { route, navigate } from './../../js/router.js';

console.log('🔧 Production app wireup initializing...');

// Global ARIA live region setup
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Store first
  Store.init();
  console.log('✅ Store initialized');
  
  // Set up ARIA live region for toast announcements
  const ariaLive = document.getElementById('aria-live-status');
  if (ariaLive) {
    Events.on('ui:toast', ({ message }) => {
      // Clear and set message for screen readers
      ariaLive.textContent = '';
      setTimeout(() => ariaLive.textContent = message, 100);
    });
    console.log('✅ ARIA live region connected');
  }
  
  // Initialize router for current path
  route();
  console.log('✅ Router initialized');
  
  // Wire up main navigation
  wireupNavigation();
  
  // Set up mobile menu handling
  setupMobileMenu();
  
  // Initialize PWA features
  initializePWAFeatures();
  
  // Set up global keyboard shortcuts
  setupKeyboardShortcuts();
  
  // Initialize first-time user experience
  initializeFTUE();
  
  console.log('✅ Production app wireup completed');
});

/**
 * Wire up main navigation system
 */
function wireupNavigation() {
  const navItems = document.querySelectorAll('.nav-item[data-route]');
  
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const route = item.dataset.route;
      
      // Update active state
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      
      // Route mapping
      const routeMap = {
        'parties': '/',
        'hotspots': '/events',
        'opportunities': '/opportunities', 
        'calendar': '/calendar',
        'invites': '/invites',
        'me': '/me',
        'settings': '/settings'
      };
      
      const path = routeMap[route] || `/${route}`;
      navigate(path);
    });
  });
  
  // Handle route changes to update navigation state
  Events.on('route:change', (currentRoute) => {
    const routeToNavMap = {
      'home': 'parties',
      'events': 'hotspots',
      'opportunities': 'opportunities',
      'calendar': 'calendar', 
      'invites': 'invites',
      'me': 'me',
      'settings': 'settings',
      'invite': 'invites' // Invite redemption shows under invites nav
    };
    
    const activeNav = routeToNavMap[currentRoute.name];
    if (activeNav) {
      navItems.forEach(nav => {
        nav.classList.toggle('active', nav.dataset.route === activeNav);
      });
    }
  });\n  \n  console.log('✅ Navigation wired up');\n}\n\n/**\n * Set up mobile menu handling\n */\nfunction setupMobileMenu() {\n  const menuBtn = document.getElementById('menu');\n  const sidebar = document.getElementById('sidenav');\n  const overlay = document.getElementById('overlay');\n  \n  if (menuBtn && sidebar) {\n    menuBtn.addEventListener('click', () => {\n      const isOpen = sidebar.classList.contains('open');\n      sidebar.classList.toggle('open', !isOpen);\n      overlay.hidden = isOpen;\n      \n      // Update ARIA attributes\n      menuBtn.setAttribute('aria-expanded', !isOpen);\n      \n      // Focus management\n      if (!isOpen) {\n        // Focus first nav item when opening\n        const firstNavItem = sidebar.querySelector('.nav-item');\n        if (firstNavItem) firstNavItem.focus();\n      }\n    });\n  }\n  \n  if (overlay) {\n    overlay.addEventListener('click', () => {\n      sidebar.classList.remove('open');\n      overlay.hidden = true;\n      menuBtn.setAttribute('aria-expanded', 'false');\n      menuBtn.focus(); // Return focus to menu button\n    });\n  }\n  \n  // Handle escape key to close mobile menu\n  Events.on('key:escape', () => {\n    if (sidebar.classList.contains('open')) {\n      sidebar.classList.remove('open');\n      overlay.hidden = true;\n      menuBtn.setAttribute('aria-expanded', 'false');\n      menuBtn.focus();\n    }\n  });\n  \n  console.log('✅ Mobile menu setup completed');\n}\n\n/**\n * Initialize PWA features and install prompts\n */\nfunction initializePWAFeatures() {\n  // Check if already in standalone mode\n  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || \n                      window.navigator.standalone === true;\n  \n  if (isStandalone) {\n    console.log('✅ Running in PWA standalone mode');\n    \n    // Update UI for PWA mode\n    document.body.classList.add('pwa-standalone');\n    \n    // Track PWA usage\n    if (window.gtag) {\n      gtag('event', 'pwa_usage', {\n        'mode': 'standalone'\n      });\n    }\n  }\n  \n  // Listen for PWA install events\n  Events.on('pwa:installed', () => {\n    console.log('✅ PWA installation detected');\n    \n    // Update invite count as bonus\n    const currentInvites = Store.get('invites') || { left: 10 };\n    const bonusInvites = Math.min(5, 20 - currentInvites.left); // Max 20 total\n    \n    if (bonusInvites > 0) {\n      Store.set('invites', { \n        ...currentInvites, \n        left: currentInvites.left + bonusInvites \n      });\n      \n      Events.emit('ui:toast', {\n        type: 'success',\n        message: `🎉 Bonus! +${bonusInvites} invites for installing the app!`,\n        duration: 5000\n      });\n    }\n  });\n  \n  console.log('✅ PWA features initialized');\n}\n\n/**\n * Set up global keyboard shortcuts\n */\nfunction setupKeyboardShortcuts() {\n  // Search focus (Cmd/Ctrl + K)\n  Events.on('shortcut:cmd+k', () => focusSearch());\n  Events.on('shortcut:ctrl+k', () => focusSearch());\n  \n  // Invite panel (Cmd/Ctrl + I)\n  Events.on('shortcut:cmd+i', () => navigate('/invites'));\n  Events.on('shortcut:ctrl+i', () => navigate('/invites'));\n  \n  // Help (Cmd/Ctrl + ?)\n  Events.on('shortcut:cmd+/', () => showHelp());\n  Events.on('shortcut:ctrl+/', () => showHelp());\n  \n  function focusSearch() {\n    const searchInput = document.querySelector('input[type=\"search\"]');\n    if (searchInput) {\n      searchInput.focus();\n    } else {\n      Events.emit('ui:toast', {\n        type: 'info',\n        message: 'Search not available on this page'\n      });\n    }\n  }\n  \n  function showHelp() {\n    Events.emit('ui:toast', {\n      type: 'info',\n      message: 'Shortcuts: Cmd+K (Search), Cmd+I (Invites), Escape (Close)',\n      duration: 5000\n    });\n  }\n  \n  console.log('✅ Keyboard shortcuts initialized');\n}\n\n/**\n * Initialize First-Time User Experience (FTUE)\n */\nfunction initializeFTUE() {\n  const isFirstVisit = !localStorage.getItem('velocity_visited');\n  const hasProfile = Store.get('profile');\n  \n  if (isFirstVisit) {\n    localStorage.setItem('velocity_visited', Date.now().toString());\n    \n    // Show welcome message after a brief delay\n    setTimeout(() => {\n      Events.emit('ui:toast', {\n        type: 'success',\n        message: '👋 Welcome to Velocity! Your professional gaming network.',\n        duration: 4000\n      });\n    }, 1000);\n    \n    // Track first visit\n    if (window.gtag) {\n      gtag('event', 'first_visit');\n    }\n  }\n  \n  // Show authentication hint if not signed in\n  if (!hasProfile) {\n    setTimeout(() => {\n      Events.emit('ui:toast', {\n        type: 'info',\n        message: 'Sign in to unlock exclusive invites and networking features',\n        duration: 6000\n      });\n    }, 3000);\n  }\n  \n  console.log('✅ FTUE initialized');\n}\n\n// Global error handling\nwindow.addEventListener('error', (e) => {\n  console.error('Global error:', e.error);\n  \n  Events.emit('ui:toast', {\n    type: 'error',\n    message: 'Something went wrong. Please refresh if issues persist.'\n  });\n  \n  // Track errors\n  if (window.gtag) {\n    gtag('event', 'javascript_error', {\n      'error_message': e.message,\n      'error_filename': e.filename,\n      'error_lineno': e.lineno\n    });\n  }\n});\n\n// Global unhandled promise rejection handling\nwindow.addEventListener('unhandledrejection', (e) => {\n  console.error('Unhandled promise rejection:', e.reason);\n  \n  Events.emit('ui:toast', {\n    type: 'error',\n    message: 'Network or processing error occurred.'\n  });\n  \n  // Track promise rejections\n  if (window.gtag) {\n    gtag('event', 'promise_rejection', {\n      'error_reason': String(e.reason)\n    });\n  }\n});\n\n// Service Worker registration (if available)\nif ('serviceWorker' in navigator) {\n  navigator.serviceWorker.register('/sw.js')\n    .then((registration) => {\n      console.log('✅ Service Worker registered:', registration.scope);\n      \n      // Listen for updates\n      registration.addEventListener('updatefound', () => {\n        Events.emit('ui:toast', {\n          type: 'info',\n          message: 'App update available. Refresh to get the latest version.',\n          duration: 8000\n        });\n      });\n    })\n    .catch((error) => {\n      console.warn('Service Worker registration failed:', error);\n    });\n}\n\n// Export for debugging\nwindow.AppWireup = {\n  Events,\n  Store,\n  navigate,\n  route\n};\n\nconsole.log('✅ Production app wireup module loaded');