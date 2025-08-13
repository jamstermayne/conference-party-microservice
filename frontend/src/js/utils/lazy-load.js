/**
 * Lazy Loading & Code Splitting Utility - Optimization #3
 * Dynamically imports modules only when needed
 * Reduces initial bundle size significantly
 */

class LazyLoader {
  constructor() {
    this.modules = new Map();
    this.loading = new Map();
    this.observers = new Map();
  }

  /**
   * Register a module for lazy loading
   * @param {string} name - Module name
   * @param {Function} loader - Import function
   */
  register(name, loader) {
    this.modules.set(name, loader);
  }

  /**
   * Load a module on demand
   * @param {string} name - Module name
   * @returns {Promise<any>}
   */
  async load(name) {
    // Return cached module if available
    if (this.loading.has(name)) {
      return this.loading.get(name);
    }

    const loader = this.modules.get(name);
    if (!loader) {
      throw new Error(`Module ${name} not registered for lazy loading`);
    }

    // Create loading promise
    const loadPromise = loader()
      .then(module => {
        this.loading.set(name, module);
        return module;
      })
      .catch(error => {
        this.loading.delete(name);
        throw error;
      });

    this.loading.set(name, loadPromise);
    return loadPromise;
  }

  /**
   * Load multiple modules in parallel
   * @param {string[]} names - Module names
   * @returns {Promise<any[]>}
   */
  async loadMany(names) {
    return Promise.all(names.map(name => this.load(name)));
  }

  /**
   * Preload a module in the background
   * @param {string} name - Module name
   */
  preload(name) {
    if (!this.loading.has(name)) {
      this.load(name).catch(() => {
        // Silently handle preload failures
      });
    }
  }

  /**
   * Load module when element becomes visible
   * @param {string} selector - Element selector
   * @param {string} moduleName - Module to load
   */
  loadOnVisible(selector, moduleName) {
    const element = document.querySelector(selector);
    if (!element) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.load(moduleName);
            observer.unobserve(entry.target);
          }
        });
      }, {
        rootMargin: '50px'
      });

      observer.observe(element);
      this.observers.set(selector, observer);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.load(moduleName);
    }
  }

  /**
   * Load module on user interaction
   * @param {string} eventType - Event type
   * @param {string} selector - Element selector
   * @param {string} moduleName - Module to load
   */
  loadOnInteraction(eventType, selector, moduleName) {
    const handler = () => {
      this.load(moduleName);
      document.removeEventListener(eventType, handler);
    };

    if (selector) {
      const element = document.querySelector(selector);
      if (element) {
        element.addEventListener(eventType, handler, { once: true });
      }
    } else {
      document.addEventListener(eventType, handler, { once: true });
    }
  }

  /**
   * Load module after idle time
   * @param {string} moduleName - Module to load
   * @param {number} timeout - Idle timeout in ms
   */
  loadOnIdle(moduleName, timeout = 2000) {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.load(moduleName);
      }, { timeout });
    } else {
      setTimeout(() => {
        this.load(moduleName);
      }, timeout);
    }
  }

  /**
   * Clear cached module
   * @param {string} name - Module name
   */
  clear(name) {
    this.loading.delete(name);
    const observer = this.observers.get(name);
    if (observer) {
      observer.disconnect();
      this.observers.delete(name);
    }
  }
}

// Singleton instance
const lazyLoader = new LazyLoader();

// Register heavy modules for lazy loading
lazyLoader.register('maps', () => import('../maps.js?v=b022'));
lazyLoader.register('calendar', () => import('../calendar.js?v=b022'));
lazyLoader.register('analytics', () => import('../analytics.js?v=b022'));
lazyLoader.register('monitoring', () => import('../monitoring-dashboard.js?v=b022'));
lazyLoader.register('editor', () => import('../live-editor.js?v=b022'));
lazyLoader.register('proximity', () => import('../proximity-manager.js?v=b022'));
lazyLoader.register('conference', () => import('../conference-manager.js?v=b022'));
lazyLoader.register('opportunity', () => import('../opportunity-toggle.js?v=b022'));

// Export convenience functions
export const lazyLoad = (name) => lazyLoader.load(name);
export const preload = (name) => lazyLoader.preload(name);
export const loadOnVisible = (selector, module) => lazyLoader.loadOnVisible(selector, module);
export const loadOnInteraction = (event, selector, module) => lazyLoader.loadOnInteraction(event, selector, module);
export const loadOnIdle = (module, timeout) => lazyLoader.loadOnIdle(module, timeout);

export default lazyLoader;