/**
 * PWA Install Manager
 * Handles cross-platform PWA installation with contextual triggers
 */

class PWAInstallManager {
    constructor() {
        this.deferredPrompt = null;
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        this.isAndroid = /Android/.test(navigator.userAgent);
        this.isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                           window.navigator.standalone === true;
        
        // Rate limiting and memory
        this.state = {
            lastDismissed: localStorage.getItem('pwa_last_dismissed'),
            dismissCount: parseInt(localStorage.getItem('pwa_dismiss_count') || '0'),
            installed: localStorage.getItem('pwa_installed') === 'true',
            savedParties: parseInt(localStorage.getItem('saved_parties_count') || '0'),
            calendarSynced: localStorage.getItem('calendar_synced') === 'true',
            impressions: parseInt(localStorage.getItem('pwa_impressions') || '0')
        };
        
        // Configuration
        this.config = {
            cooldownHours: 72, // 3 days between prompts
            maxDismissals: 3,  // Stop after 3 dismissals
            contextualDelay: 2000 // 2s delay after trigger
        };
        
        this.init();
    }
    
    init() {
        // Don't initialize if already installed
        if (this.isStandalone || this.state.installed) {
            console.log('PWA already installed');
            this.trackEvent('already_installed');
            return;
        }
        
        // Listen for Android install prompt
        if (!this.isIOS) {
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                this.deferredPrompt = e;
                console.log('Install prompt captured');
                this.checkContextualTriggers();
            });
        }
        
        // Listen for app installed event
        window.addEventListener('appinstalled', () => {
            console.log('PWA installed successfully');
            this.handleSuccessfulInstall();
        });
        
        // Check for iOS and contextual triggers
        if (this.isIOS) {
            this.checkContextualTriggers();
        }
        
        // Listen for custom events
        this.attachEventListeners();
    }
    
    attachEventListeners() {
        // Calendar sync trigger
        document.addEventListener('calendar.synced', () => {
            console.log('Calendar sync detected');
            this.state.calendarSynced = true;
            localStorage.setItem('calendar_synced', 'true');
            this.checkContextualTriggers();
        });
        
        // Party save trigger
        document.addEventListener('party.saved', () => {
            this.state.savedParties++;
            localStorage.setItem('saved_parties_count', this.state.savedParties.toString());
            console.log(`Party saved. Total: ${this.state.savedParties}`);
            
            if (this.state.savedParties >= 2) {
                this.checkContextualTriggers();
            }
        });
        
        // Manual trigger for testing
        document.addEventListener('pwa.showPrompt', () => {
            this.showInstallPrompt('manual');
        });
    }
    
    checkContextualTriggers() {
        // Check if we should show the prompt
        if (!this.shouldShowPrompt()) {
            console.log('Install prompt suppressed by rate limiting');
            return;
        }
        
        // Check contextual conditions
        const triggers = [];
        
        if (this.state.calendarSynced) {
            triggers.push('calendar_sync');
        }
        
        if (this.state.savedParties >= 2) {
            triggers.push('saved_parties');
        }
        
        // Show prompt if we have triggers
        if (triggers.length > 0) {
            setTimeout(() => {
                this.showInstallPrompt(triggers[0]);
            }, this.config.contextualDelay);
        }
    }
    
    shouldShowPrompt() {
        // Already installed
        if (this.isStandalone || this.state.installed) {
            return false;
        }
        
        // Max dismissals reached
        if (this.state.dismissCount >= this.config.maxDismissals) {
            console.log('Max dismissals reached');
            return false;
        }
        
        // Check cooldown period
        if (this.state.lastDismissed) {
            const hoursSinceDismissal = (Date.now() - parseInt(this.state.lastDismissed)) / (1000 * 60 * 60);
            if (hoursSinceDismissal < this.config.cooldownHours) {
                console.log(`Cooldown active: ${Math.round(this.config.cooldownHours - hoursSinceDismissal)} hours remaining`);
                return false;
            }
        }
        
        // iOS needs manual prompt, Android needs deferred prompt
        if (this.isIOS) {
            return true;
        }
        
        return this.deferredPrompt !== null;
    }
    
    showInstallPrompt(trigger = 'unknown') {
        // Track impression
        this.state.impressions++;
        localStorage.setItem('pwa_impressions', this.state.impressions.toString());
        this.trackEvent('impression', { trigger, platform: this.getPlatform() });
        
        // Announce to screen readers
        if (window.announce) {
            window.announce('Install app dialog opened');
        }
        
        // Get or create the install card
        let card = document.getElementById('install-ftue');
        
        if (!card) {
            // Create from template
            card = this.createInstallCard();
            document.body.appendChild(card);
        }
        
        // Configure for platform
        if (this.isIOS) {
            this.configureForIOS(card);
        } else {
            this.configureForAndroid(card);
        }
        
        // Show the card
        card.hidden = false;
        card.classList.add('show');
        
        // Enable focus trapping
        this.trapFocus(card);
        
        // Focus the card for accessibility
        card.focus();
        
        // Attach button handlers
        this.attachCardHandlers(card, trigger);
    }
    
    createInstallCard() {
        const card = document.createElement('div');
        card.id = 'install-ftue';
        card.className = 'install-card slack-style';
        card.setAttribute('role', 'dialog');
        card.setAttribute('aria-modal', 'true');
        card.setAttribute('aria-live', 'polite');
        card.setAttribute('aria-atomic', 'true');
        
        card.innerHTML = `
            <div class="install-body">
                <div class="install-header">
                    <div class="install-icon">
                        <img src="/assets/icons/icon-192.png" alt="Velocity" class="app-icon" />
                    </div>
                    <div class="install-text">
                        <h3 id="install-title" class="install-title">Install Velocity</h3>
                        <p class="install-subtitle">Get the app for faster access and offline support</p>
                    </div>
                </div>
                
                <div class="install-features">
                    <div class="feature-item">
                        <span class="feature-icon">⚡</span>
                        <span class="feature-text">Instant launch from home screen</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">📱</span>
                        <span class="feature-text">Works offline with cached events</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">🔔</span>
                        <span class="feature-text">Push notifications for new invites</span>
                    </div>
                </div>
                
                <!-- iOS hint -->
                <div id="install-ios-hint" class="install-hint" hidden>
                    <div class="ios-steps">
                        <span class="step-number">1</span>
                        <span>Tap the <span class="ios-chip">Share ↑</span> button</span>
                    </div>
                    <div class="ios-steps">
                        <span class="step-number">2</span>
                        <span>Select <b>Add to Home Screen</b></span>
                    </div>
                </div>
                
                <div class="install-actions">
                    <button id="install-now" class="btn btn-primary install-primary">
                        <span class="btn-icon">📱</span>
                        Install App
                    </button>
                    <button id="install-later" class="btn btn-secondary install-secondary" aria-label="Close install prompt">
                        Not Now
                    </button>
                </div>
            </div>
        `;
        
        // Set ARIA labeling
        card.setAttribute('aria-labelledby', 'install-title');
        
        return card;
    }
    
    // Trap focus inside install card for screen reader & keyboard users
    trapFocus(element) {
        const focusableEls = element.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const firstFocusable = focusableEls[0];
        const lastFocusable = focusableEls[focusableEls.length - 1];

        element.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) { // Shift + Tab
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else { // Tab
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
            
            // Close on Escape key
            if (e.key === 'Escape') {
                this.handleLaterClick('keyboard');
            }
        });
    }
    
    configureForIOS(card) {
        const hint = card.querySelector('#install-ios-hint');
        const installBtn = card.querySelector('#install-now');
        
        if (hint) {
            hint.hidden = false;
        }
        
        if (installBtn) {
            installBtn.textContent = 'Show Me How';
        }
    }
    
    configureForAndroid(card) {
        const hint = card.querySelector('#install-ios-hint');
        const installBtn = card.querySelector('#install-now');
        
        if (hint) {
            hint.hidden = true;
        }
        
        if (installBtn) {
            installBtn.textContent = 'Install';
        }
    }
    
    attachCardHandlers(card, trigger) {
        const installBtn = card.querySelector('#install-now');
        const laterBtn = card.querySelector('#install-later');
        
        if (installBtn) {
            installBtn.addEventListener('click', () => {
                this.handleInstallClick(trigger);
            });
        }
        
        if (laterBtn) {
            laterBtn.addEventListener('click', () => {
                this.handleLaterClick(trigger);
            });
        }
    }
    
    async handleInstallClick(trigger) {
        this.trackEvent('accept', { trigger, platform: this.getPlatform() });
        
        if (this.isIOS) {
            // Show iOS instructions
            this.showIOSInstructions();
        } else if (this.deferredPrompt) {
            // Show Android install prompt
            try {
                await this.deferredPrompt.prompt();
                const { outcome } = await this.deferredPrompt.userChoice;
                
                this.trackEvent('prompt_outcome', { outcome, trigger });
                
                if (outcome === 'accepted') {
                    this.handleSuccessfulInstall();
                } else {
                    this.handleDismiss();
                }
                
                this.deferredPrompt = null;
            } catch (error) {
                console.error('Install prompt failed:', error);
                this.trackEvent('prompt_error', { error: error.message });
            }
        }
        
        this.hideCard();
    }
    
    handleLaterClick(trigger) {
        this.trackEvent('dismiss', { trigger, platform: this.getPlatform() });
        this.handleDismiss();
        this.hideCard();
    }
    
    handleDismiss() {
        this.state.dismissCount++;
        this.state.lastDismissed = Date.now().toString();
        
        localStorage.setItem('pwa_dismiss_count', this.state.dismissCount.toString());
        localStorage.setItem('pwa_last_dismissed', this.state.lastDismissed);
        
        console.log(`Install dismissed ${this.state.dismissCount} times`);
    }
    
    handleSuccessfulInstall() {
        this.state.installed = true;
        localStorage.setItem('pwa_installed', 'true');
        
        // Track success
        this.trackEvent('success', { platform: this.getPlatform() });
        
        // Emit event for invite bonus
        const event = new CustomEvent('pwa.installed', {
            detail: { timestamp: Date.now() }
        });
        document.dispatchEvent(event);
        
        // Award bonus invites
        this.awardBonusInvites();
        
        // Show enhanced success message
        this.showInstallSuccess();
        
        // Announce success to screen readers
        if (window.announce) {
            window.announce('App successfully installed. You earned 5 bonus invites!');
        }
    }
    
    awardBonusInvites() {
        // Get current invite count
        let invites = parseInt(localStorage.getItem('user_invites') || '10');
        invites += 5;
        
        localStorage.setItem('user_invites', invites.toString());
        localStorage.setItem('pwa_bonus_awarded', 'true');
        
        console.log(`Bonus invites awarded. Total: ${invites}`);
        
        // Emit event for invite system
        const event = new CustomEvent('invites.updated', {
            detail: { count: invites, source: 'pwa_install' }
        });
        document.dispatchEvent(event);
    }
    
    showIOSInstructions() {
        // Create detailed iOS instruction modal
        const modal = document.createElement('div');
        modal.className = 'ios-install-modal';
        modal.innerHTML = `
            <div class="ios-install-content">
                <h3>Install on iOS</h3>
                <ol class="ios-steps">
                    <li>Tap the <span class="ios-chip">Share ↑</span> button at the bottom of Safari</li>
                    <li>Scroll down and tap <b>Add to Home Screen</b></li>
                    <li>Tap <b>Add</b> in the top right corner</li>
                </ol>
                <button class="btn btn-primary" onclick="this.parentElement.parentElement.remove()">Got it!</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            modal.remove();
        }, 10000);
    }
    
    hideCard() {
        const card = document.getElementById('install-ftue');
        if (card) {
            card.classList.remove('show');
            setTimeout(() => {
                card.hidden = true;
            }, 300);
        }
    }
    
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast toast-success';
        toast.innerHTML = `<span class="msg">${message}</span>`;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    showInstallSuccess() {
        // Create enhanced success card
        const successCard = document.createElement('div');
        successCard.className = 'install-success-card slack-style';
        successCard.setAttribute('role', 'dialog');
        successCard.setAttribute('aria-live', 'polite');
        
        successCard.innerHTML = `
            <div class="success-body">
                <div class="success-header">
                    <div class="success-icon">🎉</div>
                    <div class="success-text">
                        <h3 class="success-title">Welcome to Velocity!</h3>
                        <p class="success-subtitle">Your app is ready to use</p>
                    </div>
                </div>
                
                <div class="success-features">
                    <div class="success-feature">
                        <span class="feature-icon">🎟️</span>
                        <span class="feature-text">+5 bonus invites added to your account</span>
                    </div>
                    <div class="success-feature">
                        <span class="feature-icon">⚡</span>
                        <span class="feature-text">Instant access from your home screen</span>
                    </div>
                    <div class="success-feature">
                        <span class="feature-icon">🔔</span>
                        <span class="feature-text">Push notifications now enabled</span>
                    </div>
                </div>
                
                <div class="success-actions">
                    <button class="btn btn-primary success-continue">Start Networking</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(successCard);
        
        // Animate in
        setTimeout(() => {
            successCard.classList.add('show');
        }, 100);
        
        // Add event listeners
        const continueBtn = successCard.querySelector('.success-continue');
        continueBtn.addEventListener('click', () => {
            successCard.classList.remove('show');
            setTimeout(() => {
                successCard.remove();
                // Navigate to main app or refresh invites
                if (window.location.hash !== '#/events') {
                    window.location.hash = '#/events';
                }
            }, 300);
        });
        
        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (successCard.parentElement) {
                successCard.classList.remove('show');
                setTimeout(() => successCard.remove(), 300);
            }
        }, 8000);
    }
    
    getPlatform() {
        if (this.isIOS) return 'ios';
        if (this.isAndroid) return 'android';
        return 'web';
    }
    
    trackEvent(action, data = {}) {
        // Analytics tracking
        const event = {
            category: 'pwa_install',
            action,
            label: data.trigger || 'unknown',
            value: this.state.impressions,
            ...data,
            timestamp: Date.now()
        };
        
        // Log to console for debugging
        console.log('PWA Install Event:', event);
        
        // Send to analytics if available
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                event_category: 'pwa_install',
                event_label: data.trigger,
                value: this.state.impressions
            });
        }
        
        // Store locally for analysis
        const events = JSON.parse(localStorage.getItem('pwa_events') || '[]');
        events.push(event);
        if (events.length > 100) events.shift(); // Keep last 100 events
        localStorage.setItem('pwa_events', JSON.stringify(events));
    }
    
    // Public API
    reset() {
        // Reset state for testing
        localStorage.removeItem('pwa_last_dismissed');
        localStorage.removeItem('pwa_dismiss_count');
        localStorage.removeItem('pwa_installed');
        localStorage.removeItem('pwa_impressions');
        this.state = {
            lastDismissed: null,
            dismissCount: 0,
            installed: false,
            savedParties: this.state.savedParties,
            calendarSynced: this.state.calendarSynced,
            impressions: 0
        };
        console.log('PWA install state reset');
    }
    
    getAnalytics() {
        // Get analytics summary
        const events = JSON.parse(localStorage.getItem('pwa_events') || '[]');
        const summary = {
            impressions: this.state.impressions,
            dismissals: this.state.dismissCount,
            installed: this.state.installed,
            platform: this.getPlatform(),
            events: events.length,
            lastEvent: events[events.length - 1] || null
        };
        
        return summary;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.pwaInstallManager = new PWAInstallManager();
    });
} else {
    window.pwaInstallManager = new PWAInstallManager();
}

// Export for use in other modules
window.PWAInstallManager = PWAInstallManager;