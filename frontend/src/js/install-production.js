// Production PWA Install: Android prompt + iOS hint + a11y
import Events from './events.js';
import Store from './store.js';

let deferredPrompt = null;

// Platform detection
const isiOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isAndroid = () => /android/i.test(navigator.userAgent);
const isStandalone = () => 
  window.matchMedia('(display-mode: standalone)').matches || 
  window.navigator.standalone === true ||
  document.referrer.includes('android-app://');

// Trap focus for accessibility
function trapFocus(el) {
  const focusableElements = el.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  if (!focusableElements.length) return;
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hide();
      return;
    }
    
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  });
}

// Show install prompt
function show() {
  const card = document.getElementById('install-card');
  if (!card) return;
  
  card.classList.add('visible');
  card.setAttribute('aria-hidden', 'false');
  
  const content = card.querySelector('.install-content');
  if (content) {
    content.setAttribute('tabindex', '-1');
    content.focus();
    trapFocus(content);
  }
  
  // Track install prompt shown
  Store.patch('pwa.promptShown', true);
  Store.patch('pwa.promptCount', (Store.get('pwa.promptCount') || 0) + 1);
  
  Events.emit('pwa:prompt:shown');
}

// Hide install prompt
function hide() {
  const card = document.getElementById('install-card');
  if (!card) return;
  
  card.classList.remove('visible');
  card.setAttribute('aria-hidden', 'true');
  
  // Track dismissal
  Store.patch('pwa.promptDismissed', Date.now());
  Events.emit('pwa:prompt:hidden');
}

// Show iOS install hint
function showiOSHint() {
  const hint = document.getElementById('install-ios-hint');
  if (!hint) return;
  
  hint.classList.add('visible');
  
  // Auto-hide after 10 seconds
  setTimeout(() => {
    hint.classList.remove('visible');
  }, 10000);
  
  // Hide on click
  hint.addEventListener('click', () => {
    hint.classList.remove('visible');
  });
}

// Handle install success
function handleInstallSuccess() {
  Store.patch('pwa.installed', true);
  Store.patch('pwa.installedAt', Date.now());
  
  Events.emit('pwa:installed');
  Events.emit('ui:toast', {
    type: 'success',
    message: 'App installed successfully! 🎉'
  });
  
  hide();
  
  // Check for install bonus after short delay
  setTimeout(() => {
    checkInstallBonus();
  }, 1000);
}

// Check for install bonus
function checkInstallBonus() {
  const bonusGranted = Store.get('pwa.bonusGranted');
  if (bonusGranted) return;
  
  // Grant bonus for installing
  const currentInvites = Store.get('invites.left') || 10;
  const bonusInvites = 2;
  
  Store.patch('invites.left', currentInvites + bonusInvites);
  Store.patch('pwa.bonusGranted', true);
  
  Events.emit('ui:toast', {
    type: 'success',
    message: `Bonus! +${bonusInvites} invites for installing the app!`
  });
  
  Events.emit('invites:bonus', { amount: bonusInvites });
}

// Initialize install prompt
export function init() {
  // Skip if already installed
  if (isStandalone()) {
    console.log('✅ App is already installed');
    Store.patch('pwa.standalone', true);
    return;
  }
  
  // Listen for install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    Store.patch('pwa.installable', true);
    
    // Show prompt after delay if not dismissed recently
    const lastDismissed = Store.get('pwa.promptDismissed') || 0;
    const hoursSinceDismissed = (Date.now() - lastDismissed) / (1000 * 60 * 60);
    
    if (hoursSinceDismissed > 24) {
      setTimeout(() => show(), 3000);
    }
    
    Events.emit('pwa:installable');
  });
  
  // Listen for app installed
  window.addEventListener('appinstalled', () => {
    handleInstallSuccess();
  });
  
  // iOS-specific handling
  if (isiOS() && !isStandalone()) {
    // Show iOS hint after user interaction
    let interactionCount = 0;
    const showHintAfterInteraction = () => {
      interactionCount++;
      if (interactionCount >= 3) {
        showiOSHint();
        document.removeEventListener('click', showHintAfterInteraction);
      }
    };
    document.addEventListener('click', showHintAfterInteraction);
  }
}

// Wire up install button
document.addEventListener('DOMContentLoaded', () => {
  // Initialize
  init();
  
  // Install button handler
  const installBtn = document.getElementById('install-btn');
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) {
        Events.emit('ui:toast', {
          type: 'info',
          message: 'Installation not available. Try refreshing the page.'
        });
        return;
      }
      
      try {
        // Show install prompt
        deferredPrompt.prompt();
        
        // Wait for user choice
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          handleInstallSuccess();
        } else {
          Store.patch('pwa.promptDeclined', Date.now());
          Events.emit('pwa:declined');
        }
        
        deferredPrompt = null;
      } catch (error) {
        console.error('Install error:', error);
        Events.emit('ui:toast', {
          type: 'error',
          message: 'Installation failed. Please try again.'
        });
      }
    });
  }
  
  // Dismiss button handler
  const dismissBtn = document.getElementById('install-dismiss');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', hide);
  }
  
  // Manual install trigger
  Events.on('pwa:install:show', show);
  Events.on('pwa:install:hide', hide);
});

// Create install UI if not present
function createInstallUI() {
  if (document.getElementById('install-card')) return;
  
  const installCard = document.createElement('div');
  installCard.id = 'install-card';
  installCard.className = 'install-card';
  installCard.setAttribute('role', 'dialog');
  installCard.setAttribute('aria-labelledby', 'install-title');
  installCard.setAttribute('aria-describedby', 'install-desc');
  installCard.setAttribute('aria-hidden', 'true');
  
  installCard.innerHTML = `
    <div class="install-content" tabindex="-1">
      <img src="/icons/icon-192.png" alt="App Icon" class="install-icon"/>
      <h3 id="install-title">Install Conference Party App</h3>
      <p id="install-desc">Get instant access to exclusive parties and networking. Install for offline access and push notifications.</p>
      <div class="install-benefits">
        <div class="benefit">✓ Offline access</div>
        <div class="benefit">✓ Push notifications</div>
        <div class="benefit">✓ +2 bonus invites</div>
      </div>
      <div class="button-row">
        <button id="install-btn" class="btn btn-primary">Install Now</button>
        <button id="install-dismiss" class="btn btn-secondary">Not Now</button>
      </div>
    </div>
  `;
  
  const iosHint = document.createElement('div');
  iosHint.id = 'install-ios-hint';
  iosHint.className = 'install-ios-hint';
  iosHint.innerHTML = `
    <span class="hint-arrow">↓</span>
    <span class="hint-text">Tap Share → Add to Home Screen</span>
  `;
  
  document.body.appendChild(installCard);
  document.body.appendChild(iosHint);
}

// Ensure UI exists
document.addEventListener('DOMContentLoaded', createInstallUI);

// Export API
export default {
  init,
  show,
  hide,
  isStandalone,
  isiOS,
  isAndroid
};