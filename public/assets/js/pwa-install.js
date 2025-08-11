// PWA Install Manager
import Events from './foundation/events.js';
import Store from './foundation/store.js';

class PWAInstall {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.init();
  }

  init() {
    this.checkInstallStatus();
    this.bindEvents();
    this.showInstallPrompt();
  }

  checkInstallStatus() {
    // Check if already installed
    this.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                       window.navigator.standalone ||
                       document.referrer.includes('android-app://');
    
    if (this.isInstalled) {
      Store.set('pwa.installed', true);
      Events.emit('pwa:installed');
    }
  }

  bindEvents() {
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      Store.set('pwa.installable', true);
      Events.emit('pwa:installable');
    });

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.isInstalled = true;
      Store.set('pwa.installed', true);
      Store.set('pwa.installable', false);
      Events.emit('pwa:installed');
      this.hideInstallCard();
    });

    // Install button clicks
    Events.on('action:install-app', () => this.promptInstall());
    Events.on('action:dismiss-install', () => this.dismissInstall());
  }

  showInstallPrompt() {
    const installable = Store.get('pwa.installable');
    const installed = Store.get('pwa.installed');
    const dismissed = Store.get('pwa.installDismissed');

    if (installable && !installed && !dismissed) {
      // Show after a delay to avoid overwhelming user
      setTimeout(() => {
        if (this.isIOS()) {
          this.showIOSHint();
        } else {
          this.showInstallCard();
        }
      }, 3000);
    }
  }

  showInstallCard() {
    const card = document.querySelector('#install-card');
    if (card) {
      card.classList.remove('hidden');
      card.classList.add('scale-in');
      Events.emit('pwa:install-shown');
    }
  }

  hideInstallCard() {
    const card = document.querySelector('#install-card');
    if (card) {
      card.classList.add('hidden');
    }
  }

  showIOSHint() {
    const hint = document.querySelector('#install-ios-hint');
    if (hint) {
      hint.style.display = 'block';
      setTimeout(() => {
        hint.style.display = 'none';
      }, 8000);
    }
  }

  async promptInstall() {
    if (!this.deferredPrompt) return;

    try {
      const result = await this.deferredPrompt.prompt();
      Events.emit('pwa:install-prompted', { outcome: result.outcome });
      
      if (result.outcome === 'accepted') {
        Events.emit('pwa:install-accepted');
      } else {
        Events.emit('pwa:install-declined');
      }
    } catch (error) {
      console.error('Install prompt error:', error);
    }

    this.deferredPrompt = null;
  }

  dismissInstall() {
    Store.set('pwa.installDismissed', true);
    this.hideInstallCard();
    Events.emit('pwa:install-dismissed');
  }

  isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  // Public API
  canInstall() {
    return !!this.deferredPrompt;
  }

  isAppInstalled() {
    return this.isInstalled;
  }
}

// Initialize PWA install manager
const pwaInstall = new PWAInstall();

// Expose for external use
window.PWAInstall = pwaInstall;

export default pwaInstall;