/**
 * Dynamic Module Loader
 *
 * SINGLE RESPONSIBILITY: Dynamic module loading and management
 * - Load modules on demand
 * - Module caching and versioning
 * - Dependency resolution
 * - Error handling and fallbacks
 * - Performance optimization
 *
 * This enables true lazy loading and hot module replacement
 */

import platform from './platform.js';

class ModuleLoader {
  constructor() {
    this.loadedModules = new Map();
    this.moduleCache = new Map();
    this.loadingPromises = new Map();
    this.moduleRegistry = new Map();
    this.errorHandlers = new Map();

    // Module metadata
    this.moduleMetadata = {
      auth: {
        path: '/modules/auth/index.js',
        version: '1.0.0',
        dependencies: [],
        size: '12KB',
        description: 'Authentication and session management'
      },
      events: {
        path: '/modules/events/index.js',
        version: '1.0.0',
        dependencies: [],
        size: '18KB',
        description: 'Event discovery and management'
      },
      matchmaking: {
        path: '/modules/matchmaking/index.js',
        version: '1.0.0',
        dependencies: [],
        size: '24KB',
        description: 'Professional networking and AI matching'
      },
      calendar: {
        path: '/modules/calendar/index.js',
        version: '1.0.0',
        dependencies: [],
        size: '20KB',
        description: 'Calendar integration and scheduling'
      },
      map: {
        path: '/modules/map/index.js',
        version: '1.0.0',
        dependencies: [],
        size: '15KB',
        description: 'Location services and navigation'
      },
      demo: {
        path: '/modules/demo/index.js',
        version: '1.0.0',
        dependencies: [],
        size: '10KB',
        description: 'Enterprise demo features'
      },
      invites: {
        path: '/modules/invites/index.js',
        version: '1.0.0',
        dependencies: [],
        size: '14KB',
        description: 'Invitation system and QR codes'
      }
    };

    this.init();
  }

  /**
   * Initialize the module loader
   */
  init() {
    console.log('[ModuleLoader] Initializing...');

    // Register with platform
    if (platform) {
      platform.moduleLoader = this;
    }

    // Set up error handling
    this.setupErrorHandling();

    console.log('[ModuleLoader] Initialized with', Object.keys(this.moduleMetadata).length, 'modules available');
  }

  /**
   * Set up global error handling for module loading
   */
  setupErrorHandling() {
    window.addEventListener('error', (event) => {
      if (event.filename && event.filename.includes('/modules/')) {
        this.handleModuleError(event.filename, event.error || event.message);
      }
    });

    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && event.reason.stack && event.reason.stack.includes('/modules/')) {
        console.error('[ModuleLoader] Unhandled promise rejection in module:', event.reason);
      }
    });
  }

  /**
   * Get available modules
   */
  getAvailableModules() {
    return Object.keys(this.moduleMetadata).map(moduleId => ({
      id: moduleId,
      ...this.moduleMetadata[moduleId],
      isLoaded: this.loadedModules.has(moduleId),
      isMounted: platform.getModule(moduleId) !== undefined
    }));
  }

  /**
   * Check if module is available
   */
  isModuleAvailable(moduleId) {
    return this.moduleMetadata.hasOwnProperty(moduleId);
  }

  /**
   * Check if module is loaded
   */
  isModuleLoaded(moduleId) {
    return this.loadedModules.has(moduleId);
  }

  /**
   * Load module dynamically
   */
  async loadModule(moduleId, options = {}) {
    // Validate module exists
    if (!this.isModuleAvailable(moduleId)) {
      throw new Error(`Module ${moduleId} is not available`);
    }

    // Return cached module if already loaded
    if (this.loadedModules.has(moduleId) && !options.reload) {
      console.log(`[ModuleLoader] Module ${moduleId} already loaded`);
      return this.loadedModules.get(moduleId);
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises.has(moduleId)) {
      console.log(`[ModuleLoader] Module ${moduleId} already loading, waiting...`);
      return this.loadingPromises.get(moduleId);
    }

    // Start loading
    const loadingPromise = this._loadModuleInternal(moduleId, options);
    this.loadingPromises.set(moduleId, loadingPromise);

    try {
      const result = await loadingPromise;
      this.loadingPromises.delete(moduleId);
      return result;
    } catch (error) {
      this.loadingPromises.delete(moduleId);
      throw error;
    }
  }

  /**
   * Internal module loading logic
   */
  async _loadModuleInternal(moduleId, options = {}) {
    const metadata = this.moduleMetadata[moduleId];
    const startTime = performance.now();

    console.log(`[ModuleLoader] Loading module: ${moduleId}`);

    try {
      // Check dependencies first
      await this.resolveDependencies(moduleId);

      // Add cache busting if needed
      let modulePath = metadata.path;
      if (options.cacheBust) {
        modulePath += `?v=${Date.now()}`;
      }

      // Dynamic import with timeout
      const modulePromise = import(modulePath);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Module ${moduleId} loading timeout`)), 10000);
      });

      const module = await Promise.race([modulePromise, timeoutPromise]);

      if (!module.default) {
        throw new Error(`Module ${moduleId} has no default export`);
      }

      // Create module instance
      const moduleInstance = new module.default();

      // Validate module interface
      this.validateModuleInterface(moduleId, moduleInstance);

      // Cache the module
      this.loadedModules.set(moduleId, moduleInstance);

      // Register with platform
      platform.registerModule(moduleId, moduleInstance);

      const loadTime = performance.now() - startTime;
      console.log(`[ModuleLoader] Module ${moduleId} loaded successfully in ${loadTime.toFixed(2)}ms`);

      // Emit load event
      platform.emit('moduleLoader:module-loaded', {
        moduleId,
        loadTime,
        size: metadata.size,
        version: metadata.version
      });

      return moduleInstance;

    } catch (error) {
      console.error(`[ModuleLoader] Failed to load module ${moduleId}:`, error);

      // Handle specific error types
      if (error.message.includes('timeout')) {
        error = new Error(`Module ${moduleId} loading timed out. Please check your connection.`);
      } else if (error.message.includes('Failed to fetch')) {
        error = new Error(`Module ${moduleId} file not found. Please check the module path.`);
      }

      // Emit error event
      platform.emit('moduleLoader:module-error', {
        moduleId,
        error: error.message,
        loadTime: performance.now() - startTime
      });

      throw error;
    }
  }

  /**
   * Resolve module dependencies
   */
  async resolveDependencies(moduleId) {
    const metadata = this.moduleMetadata[moduleId];

    if (!metadata.dependencies || metadata.dependencies.length === 0) {
      return;
    }

    console.log(`[ModuleLoader] Resolving dependencies for ${moduleId}:`, metadata.dependencies);

    // Load dependencies in parallel
    const dependencyPromises = metadata.dependencies.map(depId => {
      if (!this.isModuleLoaded(depId)) {
        return this.loadModule(depId);
      }
      return Promise.resolve(this.loadedModules.get(depId));
    });

    await Promise.all(dependencyPromises);
    console.log(`[ModuleLoader] All dependencies resolved for ${moduleId}`);
  }

  /**
   * Validate module interface
   */
  validateModuleInterface(moduleId, moduleInstance) {
    const requiredMethods = ['mount', 'unmount', 'getState', 'setState'];

    for (const method of requiredMethods) {
      if (typeof moduleInstance[method] !== 'function') {
        throw new Error(`Module ${moduleId} missing required method: ${method}`);
      }
    }

    console.log(`[ModuleLoader] Module ${moduleId} interface validation passed`);
  }

  /**
   * Unload module
   */
  async unloadModule(moduleId) {
    if (!this.isModuleLoaded(moduleId)) {
      console.log(`[ModuleLoader] Module ${moduleId} is not loaded`);
      return;
    }

    console.log(`[ModuleLoader] Unloading module: ${moduleId}`);

    try {
      // Unmount from platform first
      await platform.unmountModule(moduleId);

      // Remove from cache
      this.loadedModules.delete(moduleId);

      // Clear any cached resources
      if (this.moduleCache.has(moduleId)) {
        this.moduleCache.delete(moduleId);
      }

      console.log(`[ModuleLoader] Module ${moduleId} unloaded successfully`);

      // Emit unload event
      platform.emit('moduleLoader:module-unloaded', { moduleId });

    } catch (error) {
      console.error(`[ModuleLoader] Failed to unload module ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Reload module
   */
  async reloadModule(moduleId) {
    console.log(`[ModuleLoader] Reloading module: ${moduleId}`);

    // Unload first
    if (this.isModuleLoaded(moduleId)) {
      await this.unloadModule(moduleId);
    }

    // Load with cache busting
    return this.loadModule(moduleId, { cacheBust: true });
  }

  /**
   * Preload modules for better performance
   */
  async preloadModules(moduleIds) {
    console.log(`[ModuleLoader] Preloading modules:`, moduleIds);

    const preloadPromises = moduleIds.map(moduleId => {
      if (this.isModuleAvailable(moduleId) && !this.isModuleLoaded(moduleId)) {
        return this.loadModule(moduleId);
      }
      return Promise.resolve();
    });

    const results = await Promise.allSettled(preloadPromises);

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`[ModuleLoader] Preload complete: ${successful} successful, ${failed} failed`);

    return {
      successful,
      failed,
      results
    };
  }

  /**
   * Get module loading statistics
   */
  getLoadingStats() {
    const available = Object.keys(this.moduleMetadata).length;
    const loaded = this.loadedModules.size;
    const mounted = Object.keys(platform.modules || {}).length;

    return {
      available,
      loaded,
      mounted,
      loadingProgress: (loaded / available) * 100,
      modules: this.getAvailableModules()
    };
  }

  /**
   * Handle module loading errors
   */
  handleModuleError(filename, error) {
    const moduleId = this.extractModuleIdFromPath(filename);

    if (moduleId) {
      console.error(`[ModuleLoader] Error in module ${moduleId}:`, error);

      // Emit error event
      platform.emit('moduleLoader:module-runtime-error', {
        moduleId,
        error: error.toString(),
        filename
      });

      // Execute custom error handler if registered
      if (this.errorHandlers.has(moduleId)) {
        this.errorHandlers.get(moduleId)(error);
      }
    }
  }

  /**
   * Extract module ID from file path
   */
  extractModuleIdFromPath(path) {
    const match = path.match(/\/modules\/(\w+)\//);
    return match ? match[1] : null;
  }

  /**
   * Register custom error handler for module
   */
  registerErrorHandler(moduleId, handler) {
    this.errorHandlers.set(moduleId, handler);
  }

  /**
   * Clear all loaded modules
   */
  async clearAllModules() {
    console.log('[ModuleLoader] Clearing all modules...');

    const moduleIds = Array.from(this.loadedModules.keys());

    for (const moduleId of moduleIds) {
      try {
        await this.unloadModule(moduleId);
      } catch (error) {
        console.error(`[ModuleLoader] Error unloading ${moduleId}:`, error);
      }
    }

    console.log('[ModuleLoader] All modules cleared');
  }

  /**
   * Get module metadata
   */
  getModuleMetadata(moduleId) {
    return this.moduleMetadata[moduleId] || null;
  }

  /**
   * Update module metadata (for development)
   */
  updateModuleMetadata(moduleId, metadata) {
    if (this.moduleMetadata[moduleId]) {
      this.moduleMetadata[moduleId] = { ...this.moduleMetadata[moduleId], ...metadata };
      console.log(`[ModuleLoader] Updated metadata for ${moduleId}`);
    }
  }

  /**
   * Check for module updates (placeholder for future implementation)
   */
  async checkForUpdates() {
    console.log('[ModuleLoader] Checking for module updates...');

    // In a real implementation, this would check a remote registry
    // For now, just return current versions
    return Object.keys(this.moduleMetadata).map(moduleId => ({
      moduleId,
      currentVersion: this.moduleMetadata[moduleId].version,
      latestVersion: this.moduleMetadata[moduleId].version,
      hasUpdate: false
    }));
  }
}

// Create singleton instance
const moduleLoader = new ModuleLoader();

// Export for ES6 modules
export default moduleLoader;

// Also attach to window for debugging
if (typeof window !== 'undefined') {
  window.ModuleLoader = moduleLoader;
}