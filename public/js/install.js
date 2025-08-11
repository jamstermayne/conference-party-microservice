/**
 * PRODUCTION PWA INSTALL MODULE
 * Android beforeinstallprompt + iOS A2HS guidance + accessibility focus trap
 * Based on GPT-5 architecture for Professional Intelligence Platform
 */

import Events from './events.js';

let deferredPrompt = null;

function isiOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function showInstallCard() {
  const card = document.getElementById('install-card');
  if (!card) return;
  
  card.classList.add('visible');
  
  const content = card.querySelector('.install-content');
  if (content) {
    content.setAttribute('tabindex', '-1');
    content.focus();
    trapFocus(content);
  }
  
  // Emit event for tracking
  Events.emit('pwa:install:shown');
  
  // Store show time to avoid spam
  localStorage.setItem('pwa_install_last_shown', Date.now());
  
  // Track analytics
  if (window.gtag) {
    gtag('event', 'pwa_install_card_shown', {
      'platform': isiOS() ? 'ios' : 'android'
    });
  }
}

function hideInstallCard() {
  const card = document.getElementById('install-card');
  if (!card) return;
  
  card.classList.remove('visible');
  
  // Emit event for tracking
  Events.emit('pwa:install:hidden');
}

function trapFocus(el) {
  const focusables = el.querySelectorAll('button:not([disabled]),[href]:not([tabindex="-1"]),[tabindex]:not([tabindex="-1"]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])');
  if (!focusables.length) return;
  
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') return hideInstallCard();
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}

// ANDROID: beforeinstallprompt handler
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  if (!isStandalone()) {
    showInstallCard();
  }
});

// Install button handler
document.addEventListener('DOMContentLoaded', () => {
  const installBtn = document.getElementById('install-btn');
  const dismissBtn = document.getElementById('install-dismiss');
  
  installBtn?.addEventListener('click', async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        
        if (result.outcome === 'accepted') {
          Events.emit('ui:toast', { 
            type: 'success', 
            message: '🎉 App installed successfully!' 
          });
          
          if (window.gtag) {
            gtag('event', 'pwa_install_accepted');
          }
        }
        
        deferredPrompt = null;
        hideInstallCard();
        
      } catch (error) {
        console.error('Install prompt failed:', error);
        Events.emit('ui:toast', { 
          type: 'error', 
          message: 'Installation failed. Please try again.' 
        });
      }
    }
  });
  
  dismissBtn?.addEventListener('click', () => {
    hideInstallCard();
    
    if (window.gtag) {
      gtag('event', 'pwa_install_dismissed');
    }
  });
  
  // iOS guidance (no beforeinstallprompt support)
  if (!isStandalone() && isiOS()) {
    // Show gentle nudge with "Share → Add to Home Screen"
    const hint = document.getElementById('install-ios-hint');
    if (hint) {
      hint.classList.add('visible');
      
      Events.emit('ui:toast', {
        type: 'info',
        message: 'Tip: Tap Share → Add to Home Screen to install',
        duration: 5000
      });
    }
  }
});

// Track app installed
window.addEventListener('appinstalled', () => {
  hideInstallCard();
  
  Events.emit('ui:toast', { 
    type: 'success', 
    message: '✅ Velocity installed successfully!' 
  });
  
  Events.emit('pwa:installed');
  
  if (window.gtag) {
    gtag('event', 'pwa_app_installed');
  }
});

// Export functions
export { showInstallCard, hideInstallCard, isiOS, isStandalone };

// Make available globally
window.PWAInstall = {
  showInstallCard,
  hideInstallCard,
  isiOS,
  isStandalone
};

console.log('✅ Production PWA Install loaded');