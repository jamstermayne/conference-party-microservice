/**
 * Platform Core - Foundation for Micro-Frontend Architecture
 *
 * This is the ONLY shared dependency across all micro-frontends.
 * Provides minimal, surgical APIs for:
 * - Inter-module communication (event bus)
 * - Route management
 * - Shared utilities
 *
 * Philosophy: "1 Function, 1 Thing"
 */

class Platform {
  constructor() {
    this.modules = new Map();
    this.routes = new Map();
    this.eventHandlers = new Map();
    this.sharedState = new Map();

    this.init();
  }

  init() {
    console.log('[Platform] Initializing micro-frontend platform');
    this.setupErrorBoundary();
    this.setupRouting();
  }

  // ==========================================
  // MODULE MANAGEMENT - Surgical Isolation
  // ==========================================

  /**
   * Register a micro-frontend module
   * Each module is completely autonomous
   */
  registerModule(moduleId, moduleInstance) {
    if (this.modules.has(moduleId)) {
      console.warn(`[Platform] Module ${moduleId} already registered`);
      return;
    }

    // Validate module interface
    this.validateModule(moduleInstance);

    this.modules.set(moduleId, {
      instance: moduleInstance,
      mounted: false,
      container: null,
      routes: []
    });

    console.log(`[Platform] Module registered: ${moduleId}`);
    this.emit('module:registered', { moduleId });
  }

  /**
   * Mount a module in a specific container
   * Enables surgical loading/unloading
   */
  async mountModule(moduleId, containerId) {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`[Platform] Module not found: ${moduleId}`);
    }

    if (module.mounted) {
      console.warn(`[Platform] Module ${moduleId} already mounted`);
      return;
    }

    const container = document.getElementById(containerId) ||
                     document.querySelector(containerId);

    if (!container) {
      throw new Error(`[Platform] Container not found: ${containerId}`);
    }

    try {
      // Mount the module
      await module.instance.mount(container);

      module.mounted = true;
      module.container = container;

      console.log(`[Platform] Module mounted: ${moduleId} -> ${containerId}`);
      this.emit('module:mounted', { moduleId, containerId });

    } catch (error) {
      console.error(`[Platform] Failed to mount module ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Unmount a module - complete cleanup
   */
  async unmountModule(moduleId) {
    const module = this.modules.get(moduleId);
    if (!module || !module.mounted) {
      return;
    }

    try {
      await module.instance.unmount();

      module.mounted = false;
      module.container = null;

      console.log(`[Platform] Module unmounted: ${moduleId}`);
      this.emit('module:unmounted', { moduleId });

    } catch (error) {
      console.error(`[Platform] Failed to unmount module ${moduleId}:`, error);
    }
  }

  /**
   * Validate module interface
   */
  validateModule(moduleInstance) {
    const required = ['mount', 'unmount', 'getState', 'setState'];
    const missing = required.filter(method => typeof moduleInstance[method] !== 'function');

    if (missing.length > 0) {
      throw new Error(`[Platform] Module missing required methods: ${missing.join(', ')}`);
    }
  }

  // ==========================================
  // EVENT BUS - Inter-Module Communication
  // ==========================================

  /**
   * Emit event to all subscribers
   * Enables loose coupling between modules
   */
  emit(eventName, data = null) {
    const handlers = this.eventHandlers.get(eventName) || [];

    console.log(`[Platform] Emitting ${eventName}:`, data);

    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`[Platform] Event handler error for ${eventName}:`, error);
      }
    });
  }

  /**
   * Subscribe to events
   */
  on(eventName, handler) {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }

    this.eventHandlers.get(eventName).push(handler);

    // Return unsubscribe function
    return () => this.off(eventName, handler);
  }

  /**
   * Unsubscribe from events
   */
  off(eventName, handler) {
    const handlers = this.eventHandlers.get(eventName);
    if (!handlers) return;

    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * One-time event subscription
   */
  once(eventName, handler) {
    const unsubscribe = this.on(eventName, (data) => {
      handler(data);
      unsubscribe();
    });
    return unsubscribe;
  }

  // ==========================================
  // ROUTING - Module Route Management
  // ==========================================

  /**
   * Register route for a module
   */
  registerRoute(pattern, moduleId, handler = null) {
    this.routes.set(pattern, {
      moduleId,
      handler,
      pattern: new RegExp(pattern.replace(/\*/g, '.*'))
    });

    console.log(`[Platform] Route registered: ${pattern} -> ${moduleId}`);
  }

  /**
   * Navigate to a route
   */
  navigate(path, data = null) {
    console.log(`[Platform] Navigating to: ${path}`);

    // Find matching route
    for (const [pattern, route] of this.routes) {
      if (route.pattern.test(path)) {
        this.handleRoute(route, path, data);
        return;
      }
    }

    console.warn(`[Platform] No route found for: ${path}`);
    this.emit('route:notfound', { path });
  }

  /**
   * Handle route activation
   */
  async handleRoute(route, path, data) {
    try {
      // Ensure module is loaded and mounted
      if (!this.modules.get(route.moduleId)?.mounted) {
        await this.mountModule(route.moduleId, 'app');
      }

      // Call route handler if provided
      if (route.handler) {
        route.handler(path, data);
      }

      this.emit('route:changed', {
        path,
        moduleId: route.moduleId,
        data
      });

    } catch (error) {
      console.error(`[Platform] Route handling error for ${path}:`, error);
      this.emit('route:error', { path, error });
    }
  }

  setupRouting() {
    // Listen for browser navigation
    window.addEventListener('popstate', (e) => {
      this.navigate(window.location.pathname + window.location.hash);
    });

    // Listen for hash changes
    window.addEventListener('hashchange', (e) => {
      this.navigate(window.location.hash.substring(1) || '/');
    });
  }

  // ==========================================
  // SHARED STATE - Minimal Cross-Module State
  // ==========================================

  /**
   * Get shared state (minimal usage encouraged)
   */
  getShared(key) {
    return this.sharedState.get(key);
  }

  /**
   * Set shared state
   */
  setShared(key, value) {
    const oldValue = this.sharedState.get(key);
    this.sharedState.set(key, value);

    if (oldValue !== value) {
      this.emit('state:changed', { key, value, oldValue });
    }
  }

  /**
   * Remove shared state
   */
  removeShared(key) {
    const value = this.sharedState.get(key);
    this.sharedState.delete(key);
    this.emit('state:removed', { key, value });
  }

  // ==========================================
  // UTILITIES - Minimal Shared Functions
  // ==========================================

  /**
   * Get current user (if authenticated)
   */
  getUser() {
    return this.getShared('user');
  }

  /**
   * Set current user
   */
  setUser(user) {
    this.setShared('user', user);
    this.emit('user:changed', user);
  }

  /**
   * Get feature flags
   */
  getFeatureFlags() {
    return this.getShared('featureFlags') || {};
  }

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(flag) {
    const flags = this.getFeatureFlags();
    return flags[flag] === true;
  }

  /**
   * Get device info
   */
  getDevice() {
    return {
      isMobile: window.innerWidth < 768,
      isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
      isDesktop: window.innerWidth >= 1024,
      userAgent: navigator.userAgent
    };
  }

  // ==========================================
  // ERROR HANDLING
  // ==========================================

  setupErrorBoundary() {
    window.addEventListener('error', (e) => {
      console.error('[Platform] Global error:', e.error);
      this.emit('error:global', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        error: e.error
      });
    });

    window.addEventListener('unhandledrejection', (e) => {
      console.error('[Platform] Unhandled promise rejection:', e.reason);
      this.emit('error:promise', {
        reason: e.reason,
        promise: e.promise
      });
    });
  }

  // ==========================================
  // MODULE LOADER - Dynamic Module Loading
  // ==========================================

  /**
   * Load module dynamically
   */
  async loadModule(moduleId) {
    try {
      console.log(`[Platform] Loading module: ${moduleId}`);

      // Dynamic import of module
      const module = await import(`/modules/${moduleId}/dist/${moduleId}.bundle.js`);
      const ModuleClass = module.default;

      // Create instance and register
      const instance = new ModuleClass(this);
      this.registerModule(moduleId, instance);

      return instance;

    } catch (error) {
      console.error(`[Platform] Failed to load module ${moduleId}:`, error);
      throw error;
    }
  }

  // ==========================================
  // DEBUGGING & MONITORING
  // ==========================================

  /**
   * Get platform status for debugging
   */
  getStatus() {
    return {
      modules: Array.from(this.modules.keys()),
      routes: Array.from(this.routes.keys()),
      sharedState: Array.from(this.sharedState.keys()),
      eventHandlers: Array.from(this.eventHandlers.keys())
    };
  }

  /**
   * Reset platform (for testing)
   */
  reset() {
    this.modules.clear();
    this.routes.clear();
    this.eventHandlers.clear();
    this.sharedState.clear();
    console.log('[Platform] Platform reset');
  }
}

// Create global platform instance
window.Platform = new Platform();

export default Platform;