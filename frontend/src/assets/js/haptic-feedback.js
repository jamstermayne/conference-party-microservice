/**
 * Haptic Feedback System
 * iOS-inspired tactile responses for web
 * Visual and audio feedback that mimics physical sensations
 */

class HapticFeedback {
  constructor() {
    this.audioContext = null;
    this.isSupported = this.checkSupport();
    this.settings = {
      enabled: localStorage.getItem('haptic_enabled') !== 'false',
      intensity: parseFloat(localStorage.getItem('haptic_intensity') || '1.0'),
      sound: localStorage.getItem('haptic_sound') !== 'false'
    };
    
    this.init();
  }

  checkSupport() {
    // Check for Vibration API support
    return 'vibrate' in navigator || 'mozVibrate' in navigator || 'webkitVibrate' in navigator;
  }

  init() {
    this.setupAudioContext();
    this.attachEventListeners();
    this.injectStyles();
  }

  setupAudioContext() {
    // Create audio context for sound feedback
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
    } catch (e) {
      console.log('Audio feedback not available');
    }
  }

  attachEventListeners() {
    // Button clicks
    document.addEventListener('click', (e) => {
      const button = e.target.closest('button, .btn, .nav-item, .card-action');
      if (button) {
        this.impact('light');
      }
    });

    // Card interactions
    document.addEventListener('mousedown', (e) => {
      const card = e.target.closest('.event-card, .card');
      if (card) {
        card.classList.add('haptic-press');
        this.impact('medium');
      }
    });

    document.addEventListener('mouseup', (e) => {
      const card = e.target.closest('.event-card, .card');
      if (card) {
        card.classList.remove('haptic-press');
      }
    });

    // Toggle switches
    document.addEventListener('change', (e) => {
      if (e.target.type === 'checkbox' || e.target.type === 'radio') {
        this.selection();
      }
    });

    // Swipe gestures
    this.setupSwipeDetection();

    // Pull to refresh
    this.setupPullToRefresh();

    // Long press
    this.setupLongPress();
  }

  // Haptic Types
  impact(style = 'medium') {
    if (!this.settings.enabled) return;

    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      rigid: [15, 10, 15],
      soft: [8, 15, 8]
    };

    this.vibrate(patterns[style] || patterns.medium);
    this.playSound(style);
    this.visualFeedback(style);
  }

  selection() {
    if (!this.settings.enabled) return;
    
    this.vibrate([10]);
    this.playSound('tick');
    this.visualFeedback('selection');
  }

  notification(type = 'success') {
    if (!this.settings.enabled) return;

    const patterns = {
      success: [10, 20, 10],
      warning: [20, 10, 20],
      error: [30, 10, 30, 10, 30]
    };

    this.vibrate(patterns[type] || patterns.success);
    this.playSound(type);
    this.visualFeedback(type);
  }

  // Core vibration function
  vibrate(pattern) {
    if (!this.isSupported) return;

    // Scale pattern by intensity
    const scaledPattern = Array.isArray(pattern) 
      ? pattern.map(v => v * this.settings.intensity)
      : pattern * this.settings.intensity;

    if (navigator.vibrate) {
      navigator.vibrate(scaledPattern);
    } else if (navigator.mozVibrate) {
      navigator.mozVibrate(scaledPattern);
    } else if (navigator.webkitVibrate) {
      navigator.webkitVibrate(scaledPattern);
    }
  }

  // Audio feedback
  playSound(type) {
    if (!this.settings.sound || !this.audioContext) return;

    const sounds = {
      light: { frequency: 800, duration: 30 },
      medium: { frequency: 600, duration: 40 },
      heavy: { frequency: 400, duration: 50 },
      tick: { frequency: 1000, duration: 20 },
      success: { frequency: 880, duration: 100 },
      warning: { frequency: 440, duration: 150 },
      error: { frequency: 220, duration: 200 }
    };

    const sound = sounds[type] || sounds.medium;
    
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.value = sound.frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1 * this.settings.intensity, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + sound.duration / 1000);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + sound.duration / 1000);
    } catch (e) {
      // Silent fail
    }
  }

  // Visual feedback
  visualFeedback(type) {
    const feedbackElement = document.createElement('div');
    feedbackElement.className = `haptic-visual haptic-${type}`;
    document.body.appendChild(feedbackElement);

    // Position at cursor or center
    const event = window.event;
    if (event && event.clientX) {
      feedbackElement.style.left = `${event.clientX}px`;
      feedbackElement.style.top = `${event.clientY}px`;
    }

    // Remove after animation
    setTimeout(() => feedbackElement.remove(), 600);
  }

  // Swipe detection
  setupSwipeDetection() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    document.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    });

    document.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      this.handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
    });
  }

  handleSwipe(startX, startY, endX, endY) {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const threshold = 50;

    if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
      this.impact('light');
      
      // Determine swipe direction
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
          this.onSwipeRight();
        } else {
          this.onSwipeLeft();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          this.onSwipeDown();
        } else {
          this.onSwipeUp();
        }
      }
    }
  }

  onSwipeLeft() {
    document.dispatchEvent(new CustomEvent('haptic:swipe:left'));
  }

  onSwipeRight() {
    document.dispatchEvent(new CustomEvent('haptic:swipe:right'));
  }

  onSwipeUp() {
    document.dispatchEvent(new CustomEvent('haptic:swipe:up'));
  }

  onSwipeDown() {
    document.dispatchEvent(new CustomEvent('haptic:swipe:down'));
  }

  // Pull to refresh
  setupPullToRefresh() {
    let startY = 0;
    let currentY = 0;
    let pulling = false;
    const threshold = 100;

    document.addEventListener('touchstart', (e) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].pageY;
        pulling = true;
      }
    });

    document.addEventListener('touchmove', (e) => {
      if (!pulling) return;
      
      currentY = e.touches[0].pageY;
      const distance = currentY - startY;
      
      if (distance > 0 && distance < threshold * 2) {
        e.preventDefault();
        
        // Visual indicator
        const indicator = document.querySelector('.pull-to-refresh-indicator') || this.createPullIndicator();
        indicator.style.transform = `translateY(${Math.min(distance, threshold)}px)`;
        indicator.style.opacity = Math.min(distance / threshold, 1);
        
        // Haptic feedback at threshold
        if (distance > threshold && !indicator.classList.contains('ready')) {
          indicator.classList.add('ready');
          this.impact('medium');
        }
      }
    });

    document.addEventListener('touchend', () => {
      if (!pulling) return;
      
      const distance = currentY - startY;
      const indicator = document.querySelector('.pull-to-refresh-indicator');
      
      if (distance > threshold) {
        // Trigger refresh
        this.notification('success');
        document.dispatchEvent(new CustomEvent('haptic:refresh'));
        
        if (indicator) {
          indicator.classList.add('refreshing');
          setTimeout(() => {
            indicator.classList.remove('ready', 'refreshing');
            indicator.style.transform = 'translateY(0)';
            indicator.style.opacity = '0';
          }, 1000);
        }
      } else {
        // Cancel
        if (indicator) {
          indicator.classList.remove('ready');
          indicator.style.transform = 'translateY(0)';
          indicator.style.opacity = '0';
        }
      }
      
      pulling = false;
      startY = 0;
      currentY = 0;
    });
  }

  createPullIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'pull-to-refresh-indicator';
    indicator.innerHTML = `
      <div class="pull-to-refresh-spinner">
        <svg viewBox="0 0 24 24">
          <path d="M12 2v6m0 12v-6m10-2h-6m-12 0h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
    `;
    document.body.appendChild(indicator);
    return indicator;
  }

  // Long press detection
  setupLongPress() {
    let pressTimer;
    const duration = 500;

    document.addEventListener('mousedown', (e) => {
      const target = e.target.closest('.event-card, .nav-item');
      if (!target) return;

      pressTimer = setTimeout(() => {
        this.impact('heavy');
        target.classList.add('long-pressed');
        document.dispatchEvent(new CustomEvent('haptic:longpress', { detail: { target } }));
      }, duration);
    });

    document.addEventListener('mouseup', () => {
      clearTimeout(pressTimer);
    });

    document.addEventListener('mouseleave', () => {
      clearTimeout(pressTimer);
    });

    // Touch events
    document.addEventListener('touchstart', (e) => {
      const target = e.target.closest('.event-card, .nav-item');
      if (!target) return;

      pressTimer = setTimeout(() => {
        this.impact('heavy');
        target.classList.add('long-pressed');
        document.dispatchEvent(new CustomEvent('haptic:longpress', { detail: { target } }));
      }, duration);
    });

    document.addEventListener('touchend', () => {
      clearTimeout(pressTimer);
    });
  }

  // Settings management
  setEnabled(enabled) {
    this.settings.enabled = enabled;
    localStorage.setItem('haptic_enabled', enabled.toString());
  }

  setIntensity(intensity) {
    this.settings.intensity = Math.max(0, Math.min(1, intensity));
    localStorage.setItem('haptic_intensity', this.settings.intensity.toString());
  }

  setSoundEnabled(enabled) {
    this.settings.sound = enabled;
    localStorage.setItem('haptic_sound', enabled.toString());
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Haptic Visual Feedback */
      .haptic-visual {
        position: fixed;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        pointer-events: none;
        z-index: 10000;
        transform: translate(-50%, -50%);
        animation: hapticRipple 600ms ease-out;
      }
      
      .haptic-light {
        background: radial-gradient(circle, rgba(0, 122, 255, 0.3) 0%, transparent 70%);
      }
      
      .haptic-medium {
        background: radial-gradient(circle, rgba(0, 122, 255, 0.5) 0%, transparent 70%);
      }
      
      .haptic-heavy {
        background: radial-gradient(circle, rgba(0, 122, 255, 0.7) 0%, transparent 70%);
      }
      
      .haptic-success {
        background: radial-gradient(circle, rgba(52, 199, 89, 0.5) 0%, transparent 70%);
      }
      
      .haptic-warning {
        background: radial-gradient(circle, rgba(255, 149, 0, 0.5) 0%, transparent 70%);
      }
      
      .haptic-error {
        background: radial-gradient(circle, rgba(255, 59, 48, 0.5) 0%, transparent 70%);
      }
      
      @keyframes hapticRipple {
        0% {
          transform: translate(-50%, -50%) scale(0);
          opacity: 1;
        }
        100% {
          transform: translate(-50%, -50%) scale(3);
          opacity: 0;
        }
      }
      
      /* Press States */
      .haptic-press {
        transform: scale(0.98) !important;
        transition: transform 100ms ease !important;
      }
      
      .long-pressed {
        animation: longPressGlow 300ms ease;
      }
      
      @keyframes longPressGlow {
        0% {
          box-shadow: 0 0 0 0 rgba(0, 122, 255, 0);
        }
        50% {
          box-shadow: 0 0 20px 10px rgba(0, 122, 255, 0.3);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(0, 122, 255, 0);
        }
      }
      
      /* Pull to Refresh */
      .pull-to-refresh-indicator {
        position: fixed;
        top: -50px;
        left: 50%;
        transform: translateX(-50%);
        width: 40px;
        height: 40px;
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(10px);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
        transition: none;
      }
      
      .pull-to-refresh-indicator.ready {
        background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
      }
      
      .pull-to-refresh-indicator.refreshing .pull-to-refresh-spinner {
        animation: spin 1s linear infinite;
      }
      
      .pull-to-refresh-spinner {
        width: 24px;
        height: 24px;
        color: white;
      }
      
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      /* Haptic Settings UI */
      .haptic-settings {
        padding: 20px;
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(20px);
        border-radius: 16px;
        color: white;
      }
      
      .haptic-settings-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .haptic-settings-item:last-child {
        border-bottom: none;
      }
      
      .haptic-settings-label {
        font-size: 16px;
        font-weight: 500;
      }
      
      .haptic-settings-control {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .haptic-intensity-slider {
        width: 100px;
        height: 4px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
        position: relative;
        cursor: pointer;
      }
      
      .haptic-intensity-fill {
        height: 100%;
        background: linear-gradient(90deg, #007aff 0%, #5856d6 100%);
        border-radius: 2px;
        transition: width 200ms ease;
      }
      
      .haptic-intensity-handle {
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 20px;
        height: 20px;
        background: white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        cursor: grab;
      }
      
      .haptic-intensity-handle:active {
        cursor: grabbing;
        transform: translate(-50%, -50%) scale(1.2);
      }
    `;
    document.head.appendChild(style);
  }
}

// Initialize and expose globally
const haptic = new HapticFeedback();

// Public API
window.haptic = {
  impact: (style) => haptic.impact(style),
  selection: () => haptic.selection(),
  notification: (type) => haptic.notification(type),
  setEnabled: (enabled) => haptic.setEnabled(enabled),
  setIntensity: (intensity) => haptic.setIntensity(intensity),
  setSoundEnabled: (enabled) => haptic.setSoundEnabled(enabled)
};

export default haptic;