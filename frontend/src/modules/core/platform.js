/**
 * Platform Core - Application Shell and Inter-Module Communication
 *
 * SINGLE RESPONSIBILITY: Provide minimal infrastructure for module isolation
 * - Event bus for module communication
 * - Module lifecycle management
 * - Route registration
 * - Minimal shared state (user only)
 *
 * This is the ONLY shared dependency between modules
 */

class Platform {
  constructor() {
    this.modules = new Map();
    this.routes = new Map();
    this.eventHandlers = new Map();
    this.currentUser = null;
    this.featureFlags = {};
    this.moduleContainers = new Map();
  }

  // ============= MODULE MANAGEMENT =============

  /**
   * Register a module with the platform
   * Each module must implement: mount(), unmount(), getState(), setState()
   */
  registerModule(moduleId, moduleInstance) {
    if (!moduleInstance.mount || !moduleInstance.unmount) {
      throw new Error(`Module ${moduleId} must implement mount() and unmount()`);
    }

    this.modules.set(moduleId, moduleInstance);
    console.log(`[Platform] Module registered: ${moduleId}`);

    // Notify other modules
    this.emit('platform:module-registered', { moduleId });
  }

  /**
   * Mount a module to a DOM container
   */
  async mountModule(moduleId, containerId) {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container ${containerId} not found`);
    }

    try {
      // Unmount any existing module in this container
      const existingModuleId = this.moduleContainers.get(containerId);
      if (existingModuleId) {
        await this.unmountModule(existingModuleId);
      }

      // Mount the new module
      await module.mount(container);
      this.moduleContainers.set(containerId, moduleId);

      console.log(`[Platform] Module mounted: ${moduleId} -> ${containerId}`);
      this.emit('platform:module-mounted', { moduleId, containerId });
    } catch (error) {
      console.error(`[Platform] Failed to mount ${moduleId}:`, error);
      this.emit('platform:module-error', { moduleId, error: error.message });
      throw error;
    }
  }

  /**
   * Unmount a module and clean up
   */
  async unmountModule(moduleId) {
    const module = this.modules.get(moduleId);
    if (!module) return;

    try {
      await module.unmount();

      // Remove from container tracking
      for (const [containerId, modId] of this.moduleContainers.entries()) {
        if (modId === moduleId) {
          this.moduleContainers.delete(containerId);
          break;
        }
      }

      console.log(`[Platform] Module unmounted: ${moduleId}`);
      this.emit('platform:module-unmounted', { moduleId });
    } catch (error) {
      console.error(`[Platform] Failed to unmount ${moduleId}:`, error);
    }
  }

  /**
   * Get a module instance
   */
  getModule(moduleId) {
    return this.modules.get(moduleId);
  }

  // ============= EVENT BUS =============

  /**
   * Emit an event to all listeners
   * Events follow pattern: [module]:[action]
   */
  emit(eventName, data = {}) {
    const handlers = this.eventHandlers.get(eventName) || [];

    // Add metadata
    const eventData = {
      ...data,
      _timestamp: Date.now(),
      _source: this.getCallerModule()
    };

    console.log(`[Platform] Event: ${eventName}`, eventData);

    // Execute handlers
    handlers.forEach(handler => {
      try {
        handler(eventData);
      } catch (error) {
        console.error(`[Platform] Event handler error for ${eventName}:`, error);
      }
    });

    // Global event for monitoring
    this.emitGlobal('platform:event', { eventName, data: eventData });
  }

  /**
   * Subscribe to an event
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
   * Unsubscribe from an event
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
   * Subscribe to an event once
   */
  once(eventName, handler) {
    const wrappedHandler = (data) => {
      handler(data);
      this.off(eventName, wrappedHandler);
    };

    return this.on(eventName, wrappedHandler);
  }

  // ============= ROUTING =============

  /**
   * Register a route pattern to a module
   */
  registerRoute(pattern, moduleId, handler) {
    this.routes.set(pattern, { moduleId, handler });
    console.log(`[Platform] Route registered: ${pattern} -> ${moduleId}`);
  }

  /**
   * Navigate to a route
   */
  navigate(path, data = {}) {
    // Find matching route
    for (const [pattern, route] of this.routes.entries()) {
      if (this.matchRoute(pattern, path)) {
        const module = this.modules.get(route.moduleId);
        if (module && route.handler) {
          route.handler.call(module, path, data);
          this.emit('platform:navigation', { path, moduleId: route.moduleId });
          return true;
        }
      }
    }

    console.warn(`[Platform] No route found for: ${path}`);
    return false;
  }

  /**
   * Simple route pattern matching
   */
  matchRoute(pattern, path) {
    if (pattern === path) return true;

    // Simple wildcard matching
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/:\w+/g, '([^/]+)');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  }

  // ============= SHARED STATE (MINIMAL) =============

  /**
   * Get current user (shared across all modules)
   */
  getUser() {
    return this.currentUser;
  }

  /**
   * Set current user and notify all modules
   */
  setUser(user) {
    const previousUser = this.currentUser;
    this.currentUser = user;

    if (user !== previousUser) {
      this.emit('platform:user-changed', { user, previousUser });
    }
  }

  /**
   * Get feature flags
   */
  getFeatureFlags() {
    return { ...this.featureFlags };
  }

  /**
   * Update feature flags
   */
  setFeatureFlags(flags) {
    this.featureFlags = { ...flags };
    this.emit('platform:feature-flags-changed', { flags: this.featureFlags });
  }

  // ============= UTILITIES =============

  /**
   * Try to determine which module called a platform method
   */
  getCallerModule() {
    // This is a heuristic - in production, modules should identify themselves
    const stack = new Error().stack;
    for (const [moduleId] of this.modules.entries()) {
      if (stack.includes(`/modules/${moduleId}/`)) {
        return moduleId;
      }
    }
    return 'unknown';
  }

  /**
   * Emit a global event (not module-specific)
   */
  emitGlobal(eventName, data) {
    // Global events for platform monitoring
    if (window.platformMonitor) {
      window.platformMonitor(eventName, data);
    }
  }

  /**
   * Load a module dynamically
   */
  async loadModule(moduleId) {
    try {
      const modulePath = `/modules/${moduleId}/index.js`;
      const module = await import(modulePath);

      if (module.default) {
        const instance = new module.default();
        this.registerModule(moduleId, instance);
        return instance;
      }

      throw new Error(`Module ${moduleId} has no default export`);
    } catch (error) {
      console.error(`[Platform] Failed to load module ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Initialize the platform
   */
  async init() {
    console.log('[Platform] Initializing...');

    // Set up global error boundary
    window.addEventListener('error', (event) => {
      this.emit('platform:error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Set up unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.emit('platform:unhandled-rejection', {
        reason: event.reason
      });
    });

    // Emit startup event
    this.emit('platform:startup', {
      timestamp: Date.now(),
      modules: Array.from(this.modules.keys())
    });

    console.log('[Platform] Initialized successfully');
  }

  /**
   * Shutdown the platform and all modules
   */
  async shutdown() {
    console.log('[Platform] Shutting down...');

    // Unmount all modules
    for (const [moduleId] of this.modules.entries()) {
      await this.unmountModule(moduleId);
    }

    // Clear all state
    this.modules.clear();
    this.routes.clear();
    this.eventHandlers.clear();
    this.moduleContainers.clear();
    this.currentUser = null;
    this.featureFlags = {};

    this.emit('platform:shutdown', { timestamp: Date.now() });
    console.log('[Platform] Shutdown complete');
  }
}

// Create singleton instance
const platform = new Platform();

// Export for ES6 modules
export default platform;

// Also attach to window for legacy code migration
if (typeof window !== 'undefined') {
  window.Platform = platform;
}