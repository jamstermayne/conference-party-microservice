/**
 * PWA Install Prompt
 * Shows a banner encouraging users to install the app
 */

class PWAInstallPrompt {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    this.init();
  }

  init() {
    // Don't show if already installed or in standalone mode
    if (this.isStandalone) {
      this.isInstalled = true;
      return;
    }

    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallBanner();
    });

    // For iOS, show manual install instructions
    if (this.isIOS && !this.isStandalone) {
      setTimeout(() => this.showIOSInstallBanner(), 5000); // Show after 5 seconds
    }

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.hideInstallBanner();
    });
  }

  showInstallBanner() {
    // Don't show if user already dismissed or installed
    if (localStorage.getItem('pwa-install-dismissed') || this.isInstalled) {
      return;
    }

    const banner = this.createInstallBanner();
    document.body.appendChild(banner);

    // Auto-hide after 30 seconds
    setTimeout(() => {
      this.hideInstallBanner();
    }, 30000);
  }

  showIOSInstallBanner() {
    // Don't show if user already dismissed
    if (localStorage.getItem('pwa-install-dismissed-ios')) {
      return;
    }

    const banner = this.createIOSInstallBanner();
    document.body.appendChild(banner);
  }

  createInstallBanner() {
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.innerHTML = `
      <div class="install-banner">
        <div class="install-content">
          <div class="install-icon">📱</div>
          <div class="install-text">
            <strong>Install velocity.ai</strong>
            <span>Get faster access and offline support</span>
          </div>
          <div class="install-actions">
            <button class="install-btn" onclick="window.pwaInstaller.installApp()">Install</button>
            <button class="dismiss-btn" onclick="window.pwaInstaller.dismissBanner()">✕</button>
          </div>
        </div>
      </div>
    `;

    return banner;
  }

  createIOSInstallBanner() {
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner-ios';
    banner.innerHTML = `
      <div class="install-banner ios-banner">
        <div class="install-content">
          <div class="install-icon">📱</div>
          <div class="install-text">
            <strong>Install velocity.ai</strong>
            <span>Tap Share ⬆️ then "Add to Home Screen"</span>
          </div>
          <button class="dismiss-btn" onclick="window.pwaInstaller.dismissIOSBanner()">✕</button>
        </div>
      </div>
    `;

    return banner;
  }

  async installApp() {
    if (!this.deferredPrompt) return;

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      this.isInstalled = true;
      this.hideInstallBanner();
    }
    
    this.deferredPrompt = null;
  }

  dismissBanner() {
    localStorage.setItem('pwa-install-dismissed', 'true');
    this.hideInstallBanner();
  }

  dismissIOSBanner() {
    localStorage.setItem('pwa-install-dismissed-ios', 'true');
    this.hideInstallBanner();
  }

  hideInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    const iosBanner = document.getElementById('pwa-install-banner-ios');
    
    if (banner) {
      banner.remove();
    }
    if (iosBanner) {
      iosBanner.remove();
    }
  }
}

// CSS for the install banner
const installCSS = `
.install-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  z-index: 10000;
  animation: slideDown 0.3s ease-out;
}

.install-banner.ios-banner {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.install-content {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 1200px;
  margin: 0 auto;
}

.install-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.install-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.install-text strong {
  font-size: 16px;
  font-weight: 600;
}

.install-text span {
  font-size: 14px;
  opacity: 0.9;
  display: flex;
  align-items: center;
  gap: 4px;
}

.install-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.install-btn {
  background: rgba(255,255,255,0.2);
  color: white;
  border: 1px solid rgba(255,255,255,0.3);
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.install-btn:hover {
  background: rgba(255,255,255,0.3);
  transform: translateY(-1px);
}

.dismiss-btn {
  background: none;
  color: white;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  opacity: 0.8;
  transition: all 0.2s ease;
}

.dismiss-btn:hover {
  opacity: 1;
  background: rgba(255,255,255,0.1);
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (max-width: 640px) {
  .install-content {
    padding: 0 8px;
  }
  
  .install-text strong {
    font-size: 15px;
  }
  
  .install-text span {
    font-size: 13px;
  }
  
  .install-btn {
    padding: 6px 12px;
    font-size: 14px;
  }
}
`;

// Inject CSS
const style = document.createElement('style');
style.textContent = installCSS;
document.head.appendChild(style);

// Initialize PWA installer
window.pwaInstaller = new PWAInstallPrompt();

export default PWAInstallPrompt;