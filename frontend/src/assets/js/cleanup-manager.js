/**
 * Cleanup Manager - Prevents memory leaks and manages lifecycle
 * Ensures all event listeners, timers, and observers are properly cleaned up
 */

class CleanupManager {
  constructor() {
    this.listeners = new Map();
    this.timers = new Set();
    this.observers = new Set();
    this.controllers = new Set();
    
    // Auto-cleanup on page unload
    window.addEventListener('beforeunload', () => this.cleanup());
    window.addEventListener('pagehide', () => this.cleanup());
  }
  
  /**
   * Register an event listener for automatic cleanup
   */
  addEventListener(target, event, handler, options) {
    if (!this.listeners.has(target)) {
      this.listeners.set(target, new Map());
    }
    
    const targetListeners = this.listeners.get(target);
    if (!targetListeners.has(event)) {
      targetListeners.set(event, new Set());
    }
    
    targetListeners.get(event).add(handler);
    target.addEventListener(event, handler, options);
    
    return () => this.removeEventListener(target, event, handler);
  }
  
  /**
   * Remove a specific event listener
   */
  removeEventListener(target, event, handler) {
    target.removeEventListener(event, handler);
    
    const targetListeners = this.listeners.get(target);
    if (targetListeners) {
      const eventHandlers = targetListeners.get(event);
      if (eventHandlers) {
        eventHandlers.delete(handler);
        if (eventHandlers.size === 0) {
          targetListeners.delete(event);
        }
      }
      if (targetListeners.size === 0) {
        this.listeners.delete(target);
      }
    }
  }
  
  /**
   * Register a timer for automatic cleanup
   */
  setTimeout(callback, delay) {
    const timerId = setTimeout(() => {
      this.timers.delete(timerId);
      callback();
    }, delay);
    
    this.timers.add(timerId);
    return timerId;
  }
  
  /**
   * Register an interval for automatic cleanup
   */
  setInterval(callback, delay) {
    const intervalId = setInterval(callback, delay);
    this.timers.add(intervalId);
    return intervalId;
  }
  
  /**
   * Clear a timer/interval
   */
  clearTimer(id) {
    clearTimeout(id);
    clearInterval(id);
    this.timers.delete(id);
  }
  
  /**
   * Register a MutationObserver for automatic cleanup
   */
  observe(observer) {
    this.observers.add(observer);
    return observer;
  }
  
  /**
   * Register an AbortController for automatic cleanup
   */
  createAbortController() {
    const controller = new AbortController();
    this.controllers.add(controller);
    return controller;
  }
  
  /**
   * Clean up all registered resources
   */
  cleanup() {
    // Remove all event listeners
    for (const [target, events] of this.listeners) {
      for (const [event, handlers] of events) {
        for (const handler of handlers) {
          target.removeEventListener(event, handler);
        }
      }
    }
    this.listeners.clear();
    
    // Clear all timers
    for (const timerId of this.timers) {
      clearTimeout(timerId);
      clearInterval(timerId);
    }
    this.timers.clear();
    
    // Disconnect all observers
    for (const observer of this.observers) {
      observer.disconnect();
    }
    this.observers.clear();
    
    // Abort all controllers
    for (const controller of this.controllers) {
      controller.abort();
    }
    this.controllers.clear();
    
    console.log('[CleanupManager] All resources cleaned up');
  }
  
  /**
   * Get cleanup statistics
   */
  getStats() {
    return {
      listeners: this.listeners.size,
      timers: this.timers.size,
      observers: this.observers.size,
      controllers: this.controllers.size
    };
  }
}

// Create singleton instance
const cleanupManager = new CleanupManager();

// Export for use in other modules
export { cleanupManager };

// Also expose globally for debugging
if (typeof window !== 'undefined') {
  window.cleanupManager = cleanupManager;
}