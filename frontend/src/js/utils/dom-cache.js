/**
 * DOM Cache Utility - Optimization #1
 * Caches DOM queries to prevent repeated lookups
 * Reduces 527 querySelector calls to single lookups
 */

class DOMCache {
  constructor() {
    this.cache = new Map();
    this.observers = new WeakMap();
  }

  /**
   * Get element with caching
   * @param {string} selector - CSS selector
   * @param {Element} context - Context element (default: document)
   * @returns {Element|null}
   */
  get(selector, context = document) {
    const key = `${context === document ? 'doc' : 'ctx'}:${selector}`;
    
    if (!this.cache.has(key)) {
      const element = context.querySelector(selector);
      if (element) {
        this.cache.set(key, new WeakRef(element));
        this.observeRemoval(element, key);
      }
      return element;
    }

    const ref = this.cache.get(key);
    const element = ref.deref();
    
    if (!element) {
      this.cache.delete(key);
      return this.get(selector, context);
    }
    
    return element;
  }

  /**
   * Get multiple elements with caching
   * @param {string} selector - CSS selector
   * @param {Element} context - Context element
   * @returns {NodeList}
   */
  getAll(selector, context = document) {
    return context.querySelectorAll(selector);
  }

  /**
   * Clear cache for specific selector or all
   * @param {string} selector - Optional selector to clear
   */
  clear(selector = null) {
    if (selector) {
      const keys = Array.from(this.cache.keys());
      keys.forEach(key => {
        if (key.includes(selector)) {
          this.cache.delete(key);
        }
      });
    } else {
      this.cache.clear();
    }
  }

  /**
   * Observe element removal to clear cache
   * @private
   */
  observeRemoval(element, key) {
    if (this.observers.has(element)) return;

    const observer = new MutationObserver(() => {
      if (!document.contains(element)) {
        this.cache.delete(key);
        observer.disconnect();
        this.observers.delete(element);
      }
    });

    observer.observe(element.parentNode || document.body, {
      childList: true,
      subtree: true
    });

    this.observers.set(element, observer);
  }

  /**
   * Batch DOM updates for performance
   * @param {Function} updateFn - Function containing DOM updates
   */
  batchUpdate(updateFn) {
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(updateFn);
    } else {
      updateFn();
    }
  }
}

// Singleton instance
const domCache = new DOMCache();

// Helper functions for common queries
export const $ = (selector, context) => domCache.get(selector, context);
export const $$ = (selector, context) => domCache.getAll(selector, context);
export const clearCache = (selector) => domCache.clear(selector);
export const batchDOM = (fn) => domCache.batchUpdate(fn);

export default domCache;