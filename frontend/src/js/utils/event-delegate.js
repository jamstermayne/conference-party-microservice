/**
 * Event Delegation Utility - Optimization #2
 * Consolidates multiple event listeners into single delegated handlers
 * Reduces memory usage and improves performance
 */

class EventDelegate {
  constructor() {
    this.handlers = new Map();
    this.globalHandlers = new Map();
    this.setupGlobalDelegation();
  }

  /**
   * Setup global event delegation for common events
   * @private
   */
  setupGlobalDelegation() {
    // Delegate click events globally
    document.addEventListener('click', (e) => {
      this.handleDelegatedEvent('click', e);
    }, { passive: true });

    // Delegate scroll events with throttling
    let scrollTimeout;
    document.addEventListener('scroll', (e) => {
      if (!scrollTimeout) {
        scrollTimeout = setTimeout(() => {
          this.handleDelegatedEvent('scroll', e);
          scrollTimeout = null;
        }, 16); // ~60fps
      }
    }, { passive: true });

    // Delegate resize events with debouncing
    let resizeTimeout;
    window.addEventListener('resize', (e) => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.handleDelegatedEvent('resize', e);
      }, 150);
    }, { passive: true });
  }

  /**
   * Handle delegated events
   * @private
   */
  handleDelegatedEvent(eventType, event) {
    const handlers = this.handlers.get(eventType);
    if (!handlers) return;

    for (const [selector, callback] of handlers) {
      const target = event.target.closest(selector);
      if (target) {
        callback.call(target, event);
      }
    }
  }

  /**
   * Add delegated event listener
   * @param {string} eventType - Event type (click, scroll, etc)
   * @param {string} selector - CSS selector for delegation
   * @param {Function} callback - Event handler
   */
  on(eventType, selector, callback) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Map());
    }
    
    const key = `${selector}:${callback.name || 'anonymous'}`;
    this.handlers.get(eventType).set(key, callback);
    
    return () => this.off(eventType, key);
  }

  /**
   * Remove delegated event listener
   * @param {string} eventType - Event type
   * @param {string} key - Handler key
   */
  off(eventType, key) {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(key);
    }
  }

  /**
   * Add one-time event listener
   * @param {string} eventType - Event type
   * @param {string} selector - CSS selector
   * @param {Function} callback - Event handler
   */
  once(eventType, selector, callback) {
    const wrappedCallback = (e) => {
      callback.call(this, e);
      this.off(eventType, `${selector}:once`);
    };
    
    this.on(eventType, selector, wrappedCallback);
  }

  /**
   * Throttle function execution
   * @param {Function} func - Function to throttle
   * @param {number} delay - Throttle delay in ms
   */
  throttle(func, delay = 100) {
    let timeoutId;
    let lastExecTime = 0;
    
    return function throttled(...args) {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        func.apply(this, args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func.apply(this, args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  }

  /**
   * Debounce function execution
   * @param {Function} func - Function to debounce
   * @param {number} delay - Debounce delay in ms
   */
  debounce(func, delay = 250) {
    let timeoutId;
    
    return function debounced(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  }

  /**
   * Clear all handlers for an event type
   * @param {string} eventType - Event type to clear
   */
  clear(eventType = null) {
    if (eventType) {
      this.handlers.delete(eventType);
    } else {
      this.handlers.clear();
    }
  }
}

// Singleton instance
const eventDelegate = new EventDelegate();

// Export convenience functions
export const on = (event, selector, callback) => eventDelegate.on(event, selector, callback);
export const off = (event, key) => eventDelegate.off(event, key);
export const once = (event, selector, callback) => eventDelegate.once(event, selector, callback);
export const throttle = (func, delay) => eventDelegate.throttle(func, delay);
export const debounce = (func, delay) => eventDelegate.debounce(func, delay);

export default eventDelegate;