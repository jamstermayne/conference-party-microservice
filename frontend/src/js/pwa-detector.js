/**
 * PWA DETECTOR MODULE
 * Detects PWA installation status and adjusts UI accordingly
 * Part of the Enhanced PWA experience for Professional Intelligence Platform
 */

class PWADetector {
    constructor() {
        this.isStandalone = this.detectStandaloneMode();
        this.isInstallable = false;
        this.deferredPrompt = null;
        
        this.init();
    }
    
    init() {
        // Detect standalone mode and adjust UI
        if (this.isStandalone) {
            this.handleStandaloneMode();
        }
        
        // Listen for install prompt availability
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.isInstallable = true;
            this.showInstallHint();
        });
        
        // Listen for successful installation
        window.addEventListener('appinstalled', () => {
            this.handleAppInstalled();
        });
        
        // Add PWA status to store
        if (window.Store) {
            window.Store.patch('pwa', {
                standalone: this.isStandalone,
                installable: this.isInstallable,
                platform: this.getPlatform()
            });
        }
        
        console.log('✅ PWA Detector initialized', {
            standalone: this.isStandalone,
            platform: this.getPlatform()
        });
    }
    
    detectStandaloneMode() {
        // Multiple ways to detect standalone mode
        const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                          window.navigator.standalone === true ||
                          document.referrer.includes('android-app://');
                          
        return standalone;
    }
    
    handleStandaloneMode() {
        // Add standalone class to body for styling
        document.body.classList.add('pwa-standalone');
        
        // Remove install prompts since already installed
        const installCards = document.querySelectorAll('.install-card, #install-ftue');
        installCards.forEach(card => card.remove());
        
        // Add standalone status bar styling
        this.addStandaloneStyles();
        
        // Emit standalone event
        if (window.Events) {
            window.Events.emit('pwa:standalone', { platform: this.getPlatform() });
        }
        
        // Track standalone usage
        if (window.gtag) {
            gtag('event', 'pwa_standalone_launch', {
                'platform': this.getPlatform()
            });
        }
        
        console.log('🚀 Running in PWA standalone mode');
    }
    
    handleAppInstalled() {
        // Update state
        this.isStandalone = true;
        this.isInstallable = false;
        
        // Update store
        if (window.Store) {
            window.Store.patch('pwa.standalone', true);
            window.Store.patch('pwa.installable', false);
        }
        
        // Handle UI changes
        this.handleStandaloneMode();
    }
    
    showInstallHint() {
        // Show subtle install hint in navigation or header
        if (!this.isStandalone && !document.querySelector('.install-hint-badge')) {
            const hint = document.createElement('div');
            hint.className = 'install-hint-badge';
            hint.innerHTML = `
                <span class="hint-icon">📱</span>
                <span class="hint-text">Install app</span>
            `;
            
            hint.addEventListener('click', () => {
                if (window.pwaInstallManager) {
                    window.pwaInstallManager.showInstallPrompt('hint_badge');
                }
            });
            
            // Add to navigation
            const nav = document.querySelector('.side-nav, .topbar');
            if (nav) {
                nav.appendChild(hint);
            }
        }
    }
    
    addStandaloneStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .pwa-standalone {
                /* Adjust for standalone mode */
                padding-top: env(safe-area-inset-top);
                padding-bottom: env(safe-area-inset-bottom);
            }
            
            .pwa-standalone .topbar {
                /* Add extra padding for notch/dynamic island */
                padding-top: max(env(safe-area-inset-top), 8px);
                background: var(--bg-primary);
                border-bottom: 1px solid var(--border);
            }
            
            .install-hint-badge {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 6px 10px;
                background: rgba(107, 123, 255, 0.12);
                border: 1px solid rgba(107, 123, 255, 0.3);
                border-radius: 8px;
                font-size: 12px;
                color: var(--accent-primary);
                cursor: pointer;
                margin: 4px 8px;
                transition: all 0.2s ease;
            }
            
            .install-hint-badge:hover {
                background: rgba(107, 123, 255, 0.18);
                transform: scale(1.02);
            }
            
            .hint-icon {
                font-size: 14px;
            }
            
            @media (max-width: 768px) {
                .install-hint-badge {
                    font-size: 11px;
                    padding: 4px 8px;
                }
                
                .hint-text {
                    display: none;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    getPlatform() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        if (/iphone|ipad|ipod/.test(userAgent)) {
            return 'ios';
        } else if (/android/.test(userAgent)) {
            return 'android';
        } else if (/windows/.test(userAgent)) {
            return 'windows';
        } else if (/mac/.test(userAgent)) {
            return 'macos';
        } else {
            return 'web';
        }
    }
    
    // Public API
    getStatus() {
        return {
            standalone: this.isStandalone,
            installable: this.isInstallable,
            platform: this.getPlatform(),
            deferredPrompt: this.deferredPrompt !== null
        };
    }
    
    canInstall() {
        return this.isInstallable && this.deferredPrompt && !this.isStandalone;
    }
    
    async triggerInstall() {
        if (!this.canInstall()) {
            return false;
        }
        
        try {
            await this.deferredPrompt.prompt();
            const result = await this.deferredPrompt.userChoice;
            
            if (result.outcome === 'accepted') {
                this.handleAppInstalled();
            }
            
            return result.outcome === 'accepted';
        } catch (error) {
            console.error('Install prompt failed:', error);
            return false;
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.pwaDetector = new PWADetector();
    });
} else {
    window.pwaDetector = new PWADetector();
}

// Export for use in other modules
window.PWADetector = PWADetector;

console.log('✅ PWA Detector module loaded');