/**
 * PRESS UI COMPONENT
 * Handles tactile feedback and press states for interactive elements
 */

export const press = {
  // Active press tracking
  activeElements: new Set(),
  
  /**
   * Initialize press system
   */
  init() {
    this.setupGlobalListeners();
    this.setupTouchFeedback();
  },
  
  /**
   * Setup global press listeners
   */
  setupGlobalListeners() {
    // Mouse events
    document.addEventListener('mousedown', this.handlePressStart.bind(this), { passive: true });
    document.addEventListener('mouseup', this.handlePressEnd.bind(this), { passive: true });
    document.addEventListener('mouseleave', this.handlePressCancel.bind(this), { passive: true });
    
    // Touch events
    document.addEventListener('touchstart', this.handlePressStart.bind(this), { passive: true });
    document.addEventListener('touchend', this.handlePressEnd.bind(this), { passive: true });
    document.addEventListener('touchcancel', this.handlePressCancel.bind(this), { passive: true });
    
    // Keyboard events
    document.addEventListener('keydown', this.handleKeyPress.bind(this));
    document.addEventListener('keyup', this.handleKeyRelease.bind(this));
  },
  
  /**
   * Setup touch feedback
   */
  setupTouchFeedback() {
    if ('vibrate' in navigator) {
      this.vibrationSupported = true;
    }
  },
  
  /**
   * Handle press start
   */
  handlePressStart(e) {
    const element = this.findPressableElement(e.target);
    if (!element) return;
    
    this.startPress(element, e);
  },
  
  /**
   * Handle press end
   */
  handlePressEnd(e) {
    const element = this.findPressableElement(e.target);
    if (!element) {
      this.clearAllPresses();
      return;
    }
    
    this.endPress(element, e);
  },
  
  /**
   * Handle press cancel
   */
  handlePressCancel(e) {
    this.clearAllPresses();
  },
  
  /**
   * Handle key press
   */
  handleKeyPress(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      const element = e.target;
      if (this.isPressable(element)) {
        e.preventDefault();
        this.startPress(element, e);
      }
    }
  },
  
  /**
   * Handle key release
   */
  handleKeyRelease(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      const element = e.target;
      if (this.isPressable(element)) {
        this.endPress(element, e);
      }
    }
  },
  
  /**
   * Start press on element
   */
  startPress(element, event) {
    if (this.activeElements.has(element)) return;
    
    this.activeElements.add(element);
    element.classList.add('is-pressed');
    element.setAttribute('data-pressed', 'true');
    
    // Haptic feedback
    this.provideFeedback(element, 'start');
    
    // Custom press event
    element.dispatchEvent(new CustomEvent('pressstart', {
      bubbles: true,
      detail: { originalEvent: event, element }
    }));
  },
  
  /**
   * End press on element
   */
  endPress(element, event) {
    if (!this.activeElements.has(element)) return;
    
    this.activeElements.delete(element);
    element.classList.remove('is-pressed');
    element.removeAttribute('data-pressed');
    
    // Haptic feedback
    this.provideFeedback(element, 'end');
    
    // Custom press event
    element.dispatchEvent(new CustomEvent('pressend', {
      bubbles: true,
      detail: { originalEvent: event, element }
    }));
  },
  
  /**
   * Clear all active presses
   */
  clearAllPresses() {
    this.activeElements.forEach(element => {
      element.classList.remove('is-pressed');
      element.removeAttribute('data-pressed');
    });
    this.activeElements.clear();
  },
  
  /**
   * Find pressable element in event path
   */
  findPressableElement(target) {
    let element = target;
    while (element && element !== document) {
      if (this.isPressable(element)) {
        return element;
      }
      element = element.parentElement;
    }
    return null;
  },
  
  /**
   * Check if element is pressable
   */
  isPressable(element) {
    const pressableSelectors = [
      'button',
      'a[href]',
      '[data-action]',
      '[tabindex]',
      'input[type="button"]',
      'input[type="submit"]',
      '.btn',
      '.pressable'
    ];
    
    return pressableSelectors.some(selector => element.matches?.(selector)) ||
           element.hasAttribute('data-pressable');
  },
  
  /**
   * Provide tactile feedback
   */
  provideFeedback(element, phase) {
    const feedbackLevel = element.dataset.feedback || 'medium';
    
    if (phase === 'start') {
      // Vibration feedback
      if (this.vibrationSupported && feedbackLevel !== 'none') {
        const patterns = {
          light: 10,
          medium: 20,
          strong: 40
        };
        navigator.vibrate(patterns[feedbackLevel] || 20);
      }
      
      // Scale animation
      if (element.dataset.pressScale !== 'false') {
        element.style.transform = 'scale(0.95)';
        element.style.transition = 'transform 0.1s ease-out';
      }
    } else if (phase === 'end') {
      // Reset scale
      if (element.dataset.pressScale !== 'false') {
        element.style.transform = '';
        setTimeout(() => {
          element.style.transition = '';
        }, 150);
      }
    }
  },
  
  /**
   * Add press behavior to element
   */
  enhance(element, options = {}) {
    element.dataset.pressable = 'true';
    
    if (options.feedback) {
      element.dataset.feedback = options.feedback;
    }
    
    if (options.scale === false) {
      element.dataset.pressScale = 'false';
    }
    
    // Make focusable if not already
    if (!element.hasAttribute('tabindex') && !element.matches('button, a, input')) {
      element.setAttribute('tabindex', '0');
    }
  },
  
  /**
   * Remove press behavior from element
   */
  remove(element) {
    element.removeAttribute('data-pressable');
    element.removeAttribute('data-feedback');
    element.removeAttribute('data-press-scale');
    element.classList.remove('is-pressed');
    this.activeElements.delete(element);
  }
};

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => press.init());
} else {
  press.init();
}

export default press;

// Simplified press feedback binding
export function bindPressFeedback(root=document){
  root.addEventListener('pointerdown', e=>{
    const b = e.target.closest('.btn'); if(!b) return;
    b.dataset._pressed = '1'; b.style.transform = 'translateY(0)';
  });
  root.addEventListener('pointerup', e=>{
    const b = e.target.closest('.btn'); if(!b) return;
    delete b.dataset._pressed;
  });
  root.addEventListener('pointercancel', e=>{
    const b = e.target.closest('.btn'); if(!b) return;
    delete b.dataset._pressed;
  });
}