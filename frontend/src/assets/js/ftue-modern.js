/**
 * FTUE Modern Implementation
 * Glass morphism onboarding flow
 */

class ModernFTUE {
  constructor() {
    this.currentStep = 0;
    this.totalSteps = 3;
    this.completed = localStorage.getItem('ftue_completed') === 'true';
    this.features = {
      pwa: false,
      offline: false,
      calendar: false
    };
  }

  async init() {
    // Skip if already completed
    if (this.completed) {
      console.log('[FTUE] Already completed');
      return;
    }

    // Check if user has dismissed recently (24 hours)
    const dismissedAt = localStorage.getItem('ftue_dismissed');
    if (dismissedAt) {
      const hoursSinceDismiss = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60);
      if (hoursSinceDismiss < 24) {
        console.log('[FTUE] Recently dismissed');
        return;
      }
    }

    // Start FTUE
    this.render();
    this.detectFeatures();
  }

  detectFeatures() {
    // Check PWA install
    this.features.pwa = window.matchMedia('(display-mode: standalone)').matches ||
                       window.navigator.standalone ||
                       document.referrer.includes('android-app://');

    // Check offline capability
    this.features.offline = 'serviceWorker' in navigator && 
                           navigator.serviceWorker.controller !== null;

    // Check calendar permission (would need actual implementation)
    this.features.calendar = localStorage.getItem('calendar_connected') === 'true';
  }

  render() {
    const container = document.createElement('div');
    container.className = 'ftue-container';
    container.innerHTML = `
      <div class="ftue-card">
        <!-- Skip button -->
        <button class="ftue-skip" data-action="skip">Skip</button>
        
        <!-- Progress dots -->
        <div class="ftue-progress">
          <div class="ftue-progress-dot active" data-step="0"></div>
          <div class="ftue-progress-dot" data-step="1"></div>
          <div class="ftue-progress-dot" data-step="2"></div>
        </div>

        <!-- Step 1: Welcome -->
        <div class="ftue-step active" data-step="0">
          <div class="ftue-step-icon">🎮</div>
          <h2 class="ftue-step-title">Welcome to Gamescom 2025</h2>
          <p class="ftue-step-description">
            Your professional networking companion for the world's largest gaming event.
            Let's set up a few things to enhance your experience.
          </p>
          
          <div class="ftue-features">
            <div class="ftue-feature">
              <div class="ftue-feature-icon">📱</div>
              <div class="ftue-feature-text">
                <div class="ftue-feature-title">Install as App</div>
                <div class="ftue-feature-desc">Quick access from your home screen</div>
              </div>
            </div>
            <div class="ftue-feature">
              <div class="ftue-feature-icon">🔄</div>
              <div class="ftue-feature-text">
                <div class="ftue-feature-title">Work Offline</div>
                <div class="ftue-feature-desc">Access events without connection</div>
              </div>
            </div>
            <div class="ftue-feature">
              <div class="ftue-feature-icon">📅</div>
              <div class="ftue-feature-text">
                <div class="ftue-feature-title">Calendar Sync</div>
                <div class="ftue-feature-desc">Never miss an important party</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2: Install PWA -->
        <div class="ftue-step" data-step="1">
          <div class="ftue-step-icon">📱</div>
          <h2 class="ftue-step-title">Install for Quick Access</h2>
          <p class="ftue-step-description">
            Add to your home screen for instant access to events, parties, and networking opportunities.
          </p>
          
          <div class="ftue-status ${this.features.pwa ? '' : 'pending'}">
            ${this.features.pwa ? '✓ Installed' : '⏳ Not installed yet'}
          </div>
          
          <div class="ftue-features">
            <div class="ftue-feature">
              <div class="ftue-feature-icon">⚡</div>
              <div class="ftue-feature-text">
                <div class="ftue-feature-title">Instant Launch</div>
                <div class="ftue-feature-desc">Open directly from home screen</div>
              </div>
            </div>
            <div class="ftue-feature">
              <div class="ftue-feature-icon">🔔</div>
              <div class="ftue-feature-text">
                <div class="ftue-feature-title">Push Notifications</div>
                <div class="ftue-feature-desc">Get party updates in real-time</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: Enable Offline -->
        <div class="ftue-step" data-step="2">
          <div class="ftue-step-icon">🔄</div>
          <h2 class="ftue-step-title">Enable Offline Access</h2>
          <p class="ftue-step-description">
            Browse events and save parties even without internet connection at the venue.
          </p>
          
          <div class="ftue-status ${this.features.offline ? '' : 'pending'}">
            ${this.features.offline ? '✓ Offline ready' : '⏳ Setting up...'}
          </div>
          
          <div class="ftue-features">
            <div class="ftue-feature">
              <div class="ftue-feature-icon">💾</div>
              <div class="ftue-feature-text">
                <div class="ftue-feature-title">Cached Events</div>
                <div class="ftue-feature-desc">All 58+ events available offline</div>
              </div>
            </div>
            <div class="ftue-feature">
              <div class="ftue-feature-icon">🔍</div>
              <div class="ftue-feature-text">
                <div class="ftue-feature-title">Offline Search</div>
                <div class="ftue-feature-desc">Find parties without connection</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="ftue-actions">
          <button class="ftue-btn ftue-btn-secondary" data-action="back" style="display: none">
            Back
          </button>
          <button class="ftue-btn ftue-btn-primary" data-action="next">
            Get Started
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(container);
    this.attachEventListeners(container);
    this.updateUI();
  }

  attachEventListeners(container) {
    // Skip button
    container.querySelector('[data-action="skip"]').addEventListener('click', () => {
      this.skip();
    });

    // Back button
    container.querySelector('[data-action="back"]').addEventListener('click', () => {
      this.previousStep();
    });

    // Next/Action button
    container.querySelector('[data-action="next"]').addEventListener('click', () => {
      this.handleAction();
    });

    // Progress dots
    container.querySelectorAll('.ftue-progress-dot').forEach(dot => {
      dot.addEventListener('click', (e) => {
        const step = parseInt(e.target.dataset.step);
        if (step < this.currentStep) {
          this.goToStep(step);
        }
      });
    });
  }

  async handleAction() {
    switch (this.currentStep) {
      case 0:
        // Welcome - just proceed
        this.nextStep();
        break;
        
      case 1:
        // Install PWA
        if (!this.features.pwa) {
          await this.triggerPWAInstall();
        }
        this.nextStep();
        break;
        
      case 2:
        // Enable offline - register service worker
        if (!this.features.offline) {
          await this.enableOffline();
        }
        this.complete();
        break;
    }
  }

  async triggerPWAInstall() {
    // Check for deferred install prompt
    if (window.deferredPrompt) {
      try {
        await window.deferredPrompt.prompt();
        const { outcome } = await window.deferredPrompt.userChoice;
        console.log('[FTUE] PWA install outcome:', outcome);
        if (outcome === 'accepted') {
          this.features.pwa = true;
        }
      } catch (err) {
        console.error('[FTUE] PWA install error:', err);
      }
      window.deferredPrompt = null;
    } else {
      // Show manual install instructions
      this.showInstallInstructions();
    }
  }

  showInstallInstructions() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const message = isIOS
      ? 'Tap the share button and select "Add to Home Screen"'
      : 'Click the install button in your browser\'s address bar';
    
    // Could show a tooltip or modal with instructions
    console.log('[FTUE] Manual install:', message);
  }

  async enableOffline() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('[FTUE] Service Worker registered:', registration);
        this.features.offline = true;
        
        // Update status in UI
        const status = document.querySelector('.ftue-step[data-step="2"] .ftue-status');
        if (status) {
          status.className = 'ftue-status';
          status.textContent = '✓ Offline ready';
        }
      } catch (err) {
        console.error('[FTUE] Service Worker registration failed:', err);
      }
    }
  }

  nextStep() {
    if (this.currentStep < this.totalSteps - 1) {
      this.currentStep++;
      this.updateUI();
    }
  }

  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.updateUI();
    }
  }

  goToStep(step) {
    this.currentStep = step;
    this.updateUI();
  }

  updateUI() {
    const container = document.querySelector('.ftue-container');
    if (!container) return;

    // Update progress dots
    container.querySelectorAll('.ftue-progress-dot').forEach((dot, index) => {
      dot.classList.toggle('active', index === this.currentStep);
      dot.classList.toggle('completed', index < this.currentStep);
    });

    // Update steps
    container.querySelectorAll('.ftue-step').forEach((step, index) => {
      step.classList.toggle('active', index === this.currentStep);
    });

    // Update buttons
    const backBtn = container.querySelector('[data-action="back"]');
    const nextBtn = container.querySelector('[data-action="next"]');
    
    backBtn.style.display = this.currentStep > 0 ? 'flex' : 'none';
    
    // Update next button text
    if (this.currentStep === 0) {
      nextBtn.textContent = 'Get Started';
    } else if (this.currentStep === 1) {
      nextBtn.textContent = this.features.pwa ? 'Continue' : 'Install App';
    } else if (this.currentStep === 2) {
      nextBtn.textContent = 'Complete Setup';
    }
  }

  skip() {
    localStorage.setItem('ftue_dismissed', Date.now().toString());
    this.close();
  }

  complete() {
    localStorage.setItem('ftue_completed', 'true');
    localStorage.setItem('ftue_completed_at', Date.now().toString());
    
    // Trigger completion event
    window.dispatchEvent(new CustomEvent('ftue:completed', {
      detail: { features: this.features }
    }));
    
    this.close();
  }

  close() {
    const container = document.querySelector('.ftue-container');
    if (container) {
      container.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => container.remove(), 300);
    }
  }
}

// Add fadeOut animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
`;
document.head.appendChild(style);

// Initialize on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.modernFTUE = new ModernFTUE();
    // Auto-init after a slight delay to ensure app is loaded
    setTimeout(() => window.modernFTUE.init(), 1000);
  });
} else {
  window.modernFTUE = new ModernFTUE();
  setTimeout(() => window.modernFTUE.init(), 1000);
}

// Capture deferred prompt for PWA install
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredPrompt = e;
  console.log('[FTUE] Install prompt captured');
});

// Export for module usage
export default ModernFTUE;