/**
 * Micro-FTUE System
 * Contextual feature discovery inspired by iOS/macOS onboarding
 * Each feature gets its own mini tutorial at the perfect moment
 */

class MicroFTUE {
  constructor() {
    this.features = new Map();
    this.shown = new Set(JSON.parse(localStorage.getItem('ftue_shown') || '[]'));
    this.triggers = new Map();
    this.activeTooltip = null;
    
    this.init();
  }

  init() {
    this.defineFeatures();
    this.setupTriggers();
    this.injectStyles();
  }

  defineFeatures() {
    // Event Discovery Features
    this.features.set('save-event', {
      title: 'Save for Later',
      description: 'Tap the bookmark to save events to your collection',
      icon: '🔖',
      trigger: 'hover',
      target: '.card-action-save',
      delay: 2000,
      animation: 'pulse'
    });

    this.features.set('quick-rsvp', {
      title: 'RSVP in One Tap',
      description: 'Let organizers know you\'re coming',
      icon: '✓',
      trigger: 'third-view',
      target: '.card-action-rsvp',
      position: 'bottom'
    });

    this.features.set('share-event', {
      title: 'Share with Friends',
      description: 'Invite your network to join you',
      icon: '🔗',
      trigger: 'save-complete',
      target: '.card-action-share',
      animation: 'glow'
    });

    // Networking Features
    this.features.set('connect-pro', {
      title: 'Professional Connection',
      description: 'Send a connection request to start networking',
      icon: '🤝',
      trigger: 'profile-view',
      target: '.profile-connect-btn',
      position: 'top'
    });

    this.features.set('proximity-network', {
      title: 'Who\'s Nearby?',
      description: 'Discover professionals at the same venue',
      icon: '📍',
      trigger: 'venue-arrival',
      target: '.proximity-indicator',
      animation: 'radar'
    });

    this.features.set('exchange-contact', {
      title: 'Quick Exchange',
      description: 'Share contact info with QR code',
      icon: '📱',
      trigger: 'mutual-connection',
      target: '.qr-exchange-btn'
    });

    // Calendar Features
    this.features.set('calendar-sync', {
      title: 'Sync to Calendar',
      description: 'Export events to Google or Apple Calendar',
      icon: '📅',
      trigger: 'third-save',
      target: '.calendar-sync-btn',
      animation: 'bounce'
    });

    this.features.set('calendar-conflict', {
      title: 'Conflict Detection',
      description: 'We\'ll alert you about overlapping events',
      icon: '⚠️',
      trigger: 'conflict-detected',
      target: '.conflict-indicator'
    });

    // Premium Features
    this.features.set('ai-recommendations', {
      title: 'AI Recommendations',
      description: 'Get personalized event suggestions',
      icon: '✨',
      trigger: 'fifth-event',
      target: '.ai-recommendations',
      premium: true
    });

    this.features.set('vip-access', {
      title: 'VIP Access',
      description: 'Unlock exclusive industry events',
      icon: '👑',
      trigger: 'premium-event-view',
      target: '.vip-badge',
      premium: true
    });

    // Offline Features
    this.features.set('offline-ready', {
      title: 'Works Offline',
      description: 'All your saved events are available offline',
      icon: '🔄',
      trigger: 'offline-detected',
      target: '.offline-indicator'
    });

    this.features.set('pwa-install', {
      title: 'Install App',
      description: 'Add to home screen for quick access',
      icon: '📲',
      trigger: 'third-visit',
      target: '.install-prompt',
      animation: 'slide'
    });
  }

  setupTriggers() {
    // Hover triggers
    document.addEventListener('mouseover', (e) => {
      const saveBtn = e.target.closest('.card-action-save');
      if (saveBtn && !this.shown.has('save-event')) {
        setTimeout(() => this.show('save-event', saveBtn), 2000);
      }
    });

    // Click triggers
    document.addEventListener('click', (e) => {
      // Track saves for calendar sync trigger
      if (e.target.closest('.card-action-save')) {
        this.trackAction('saves');
        if (this.getActionCount('saves') >= 3 && !this.shown.has('calendar-sync')) {
          setTimeout(() => this.show('calendar-sync'), 500);
        }
      }

      // Track profile views
      if (e.target.closest('.profile-card')) {
        this.trackAction('profile-views');
        if (!this.shown.has('connect-pro')) {
          this.show('connect-pro');
        }
      }
    });

    // Scroll triggers
    let viewedCards = 0;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.target.classList.contains('card')) {
          viewedCards++;
          if (viewedCards === 3 && !this.shown.has('quick-rsvp')) {
            this.show('quick-rsvp');
          }
          if (viewedCards === 5 && !this.shown.has('ai-recommendations')) {
            this.show('ai-recommendations');
          }
        }
      });
    });

    // Observe cards
    setTimeout(() => {
      document.querySelectorAll('.card').forEach(card => {
        observer.observe(card);
      });
    }, 1000);

    // Network status triggers
    window.addEventListener('offline', () => {
      if (!this.shown.has('offline-ready')) {
        this.show('offline-ready');
      }
    });

    // Visit tracking
    const visits = parseInt(localStorage.getItem('visit_count') || '0') + 1;
    localStorage.setItem('visit_count', visits.toString());
    if (visits >= 3 && !this.shown.has('pwa-install')) {
      setTimeout(() => this.show('pwa-install'), 5000);
    }
  }

  show(featureName, customTarget = null) {
    const feature = this.features.get(featureName);
    if (!feature || this.shown.has(featureName) || this.activeTooltip) return;

    const target = customTarget || document.querySelector(feature.target);
    if (!target) return;

    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = `micro-ftue ${feature.animation || ''}`;
    tooltip.innerHTML = `
      <div class="micro-ftue-arrow"></div>
      <div class="micro-ftue-content">
        <div class="micro-ftue-header">
          <span class="micro-ftue-icon">${feature.icon}</span>
          <span class="micro-ftue-title">${feature.title}</span>
          ${feature.premium ? '<span class="micro-ftue-premium">PRO</span>' : ''}
        </div>
        <p class="micro-ftue-description">${feature.description}</p>
        <div class="micro-ftue-actions">
          <button class="micro-ftue-dismiss" onclick="window.dismissFTUE('${featureName}')">
            Got it
          </button>
          <button class="micro-ftue-learn" onclick="window.learnMore('${featureName}')">
            Learn more
          </button>
        </div>
      </div>
    `;

    // Position tooltip
    this.positionTooltip(tooltip, target, feature.position || 'bottom');
    document.body.appendChild(tooltip);

    // Animate in
    requestAnimationFrame(() => {
      tooltip.classList.add('active');
      if (feature.animation) {
        target.classList.add(`ftue-${feature.animation}`);
      }
    });

    this.activeTooltip = { element: tooltip, feature: featureName, target };

    // Auto-dismiss after 8 seconds
    setTimeout(() => {
      if (this.activeTooltip?.feature === featureName) {
        this.dismiss(featureName);
      }
    }, 8000);

    // Track shown
    this.shown.add(featureName);
    this.saveShownState();
  }

  positionTooltip(tooltip, target, position) {
    const rect = target.getBoundingClientRect();
    const tooltipRect = { width: 320, height: 120 }; // Approximate

    let top, left;

    switch (position) {
      case 'top':
        top = rect.top - tooltipRect.height - 10;
        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        tooltip.classList.add('position-top');
        break;
      case 'bottom':
        top = rect.bottom + 10;
        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        tooltip.classList.add('position-bottom');
        break;
      case 'left':
        top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
        left = rect.left - tooltipRect.width - 10;
        tooltip.classList.add('position-left');
        break;
      case 'right':
        top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
        left = rect.right + 10;
        tooltip.classList.add('position-right');
        break;
      default:
        top = rect.bottom + 10;
        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    }

    // Keep within viewport
    left = Math.max(10, Math.min(left, window.innerWidth - tooltipRect.width - 10));
    top = Math.max(10, Math.min(top, window.innerHeight - tooltipRect.height - 10));

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  }

  dismiss(featureName) {
    if (this.activeTooltip?.feature === featureName) {
      const { element, target } = this.activeTooltip;
      
      // Remove animation classes
      element.classList.remove('active');
      if (target) {
        target.classList.remove('ftue-pulse', 'ftue-glow', 'ftue-bounce', 'ftue-radar');
      }
      
      // Remove element
      setTimeout(() => element.remove(), 300);
      this.activeTooltip = null;
    }
  }

  learnMore(featureName) {
    const feature = this.features.get(featureName);
    if (!feature) return;

    // Create detailed modal
    const modal = document.createElement('div');
    modal.className = 'micro-ftue-modal';
    modal.innerHTML = `
      <div class="micro-ftue-modal-backdrop" onclick="this.parentElement.remove()"></div>
      <div class="micro-ftue-modal-content">
        <div class="micro-ftue-modal-header">
          <span class="micro-ftue-modal-icon">${feature.icon}</span>
          <h2>${feature.title}</h2>
          ${feature.premium ? '<span class="micro-ftue-premium">PRO</span>' : ''}
        </div>
        <p class="micro-ftue-modal-description">${feature.description}</p>
        <div class="micro-ftue-modal-tips">
          <h3>Pro Tips:</h3>
          <ul>
            <li>Use keyboard shortcuts for faster navigation</li>
            <li>Enable notifications for real-time updates</li>
            <li>Connect your calendar for automatic sync</li>
          </ul>
        </div>
        <button class="btn btn-primary" onclick="this.closest('.micro-ftue-modal').remove()">
          Got it
        </button>
      </div>
    `;

    document.body.appendChild(modal);
    this.dismiss(featureName);
  }

  trackAction(action) {
    const count = this.getActionCount(action) + 1;
    localStorage.setItem(`ftue_action_${action}`, count.toString());
  }

  getActionCount(action) {
    return parseInt(localStorage.getItem(`ftue_action_${action}`) || '0');
  }

  saveShownState() {
    localStorage.setItem('ftue_shown', JSON.stringify(Array.from(this.shown)));
  }

  reset() {
    // Debug method to reset all FTUE states
    this.shown.clear();
    localStorage.removeItem('ftue_shown');
    localStorage.removeItem('visit_count');
    ['saves', 'profile-views'].forEach(action => {
      localStorage.removeItem(`ftue_action_${action}`);
    });
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Micro-FTUE Styles */
      .micro-ftue {
        position: fixed;
        z-index: 1000;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 1px solid rgba(0, 122, 255, 0.3);
        border-radius: 12px;
        padding: 16px;
        max-width: 320px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 0 0 60px rgba(0, 122, 255, 0.2);
        opacity: 0;
        transform: scale(0.9) translateY(10px);
        transition: all 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
        pointer-events: none;
      }
      
      .micro-ftue.active {
        opacity: 1;
        transform: scale(1) translateY(0);
        pointer-events: auto;
      }
      
      .micro-ftue-arrow {
        position: absolute;
        width: 0;
        height: 0;
        border-style: solid;
      }
      
      .micro-ftue.position-bottom .micro-ftue-arrow {
        top: -8px;
        left: 50%;
        transform: translateX(-50%);
        border-width: 0 8px 8px 8px;
        border-color: transparent transparent #1a1a2e transparent;
      }
      
      .micro-ftue.position-top .micro-ftue-arrow {
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        border-width: 8px 8px 0 8px;
        border-color: #1a1a2e transparent transparent transparent;
      }
      
      .micro-ftue-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      
      .micro-ftue-icon {
        font-size: 24px;
      }
      
      .micro-ftue-title {
        font-size: 16px;
        font-weight: 600;
        color: #ffffff;
        flex: 1;
      }
      
      .micro-ftue-premium {
        background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
        color: #000;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.05em;
      }
      
      .micro-ftue-description {
        color: #9ca3af;
        font-size: 14px;
        line-height: 1.5;
        margin: 0 0 12px 0;
      }
      
      .micro-ftue-actions {
        display: flex;
        gap: 8px;
      }
      
      .micro-ftue-dismiss,
      .micro-ftue-learn {
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        border: none;
        transition: all 200ms ease;
      }
      
      .micro-ftue-dismiss {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
      }
      
      .micro-ftue-dismiss:hover {
        background: rgba(255, 255, 255, 0.15);
      }
      
      .micro-ftue-learn {
        background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
        color: #ffffff;
      }
      
      .micro-ftue-learn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
      }
      
      /* Target Animations */
      .ftue-pulse {
        animation: ftuePulse 2s infinite;
      }
      
      @keyframes ftuePulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      
      .ftue-glow {
        animation: ftueGlow 2s infinite;
      }
      
      @keyframes ftueGlow {
        0%, 100% { box-shadow: 0 0 0 0 rgba(0, 122, 255, 0); }
        50% { box-shadow: 0 0 20px 5px rgba(0, 122, 255, 0.5); }
      }
      
      .ftue-bounce {
        animation: ftueBounce 1s infinite;
      }
      
      @keyframes ftueBounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }
      
      .ftue-radar {
        position: relative;
      }
      
      .ftue-radar::after {
        content: '';
        position: absolute;
        inset: -10px;
        border: 2px solid #007aff;
        border-radius: 50%;
        animation: ftueRadar 2s infinite;
      }
      
      @keyframes ftueRadar {
        0% {
          transform: scale(0.8);
          opacity: 1;
        }
        100% {
          transform: scale(1.5);
          opacity: 0;
        }
      }
      
      /* Modal Styles */
      .micro-ftue-modal {
        position: fixed;
        inset: 0;
        z-index: 1001;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        animation: fadeIn 300ms ease;
      }
      
      .micro-ftue-modal-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        cursor: pointer;
      }
      
      .micro-ftue-modal-content {
        position: relative;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 1px solid rgba(0, 122, 255, 0.2);
        border-radius: 16px;
        padding: 32px;
        max-width: 500px;
        width: 100%;
        animation: slideUp 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }
      
      .micro-ftue-modal-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 20px;
      }
      
      .micro-ftue-modal-icon {
        font-size: 48px;
      }
      
      .micro-ftue-modal h2 {
        font-size: 24px;
        color: #ffffff;
        margin: 0;
        flex: 1;
      }
      
      .micro-ftue-modal-description {
        color: #9ca3af;
        line-height: 1.6;
        margin-bottom: 24px;
      }
      
      .micro-ftue-modal-tips {
        background: rgba(0, 122, 255, 0.1);
        border-left: 3px solid #007aff;
        padding: 16px;
        margin-bottom: 24px;
        border-radius: 8px;
      }
      
      .micro-ftue-modal-tips h3 {
        color: #007aff;
        font-size: 14px;
        margin: 0 0 12px 0;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      .micro-ftue-modal-tips ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      
      .micro-ftue-modal-tips li {
        color: #d1d5db;
        padding: 4px 0;
        padding-left: 20px;
        position: relative;
      }
      
      .micro-ftue-modal-tips li::before {
        content: '→';
        position: absolute;
        left: 0;
        color: #007aff;
      }
    `;
    document.head.appendChild(style);
  }
}

// Initialize and expose global functions
const microFTUE = new MicroFTUE();

window.dismissFTUE = (feature) => microFTUE.dismiss(feature);
window.learnMore = (feature) => microFTUE.learnMore(feature);
window.resetFTUE = () => microFTUE.reset(); // Debug helper

export default microFTUE;