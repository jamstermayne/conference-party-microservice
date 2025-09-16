/**
 * Component Sandbox - Isolate components to prevent blast damage
 * Each component runs in its own sandbox with controlled dependencies
 */

class ComponentSandbox {
  constructor(componentName, options = {}) {
    this.name = componentName;
    this.state = {};
    this.errors = [];
    this.dependencies = new Set();
    this.eventListeners = new Map();
    this.timers = new Set();
    this.isActive = true;
    
    // Configuration
    this.config = {
      maxErrors: options.maxErrors || 3,
      timeout: options.timeout || 30000, // 30 seconds
      fallback: options.fallback || null,
      monitoring: options.monitoring !== false,
      isolation: options.isolation !== false
    };
    
    // Error tracking
    this.errorCount = 0;
    this.lastError = null;
    
    // Performance tracking
    this.metrics = {
      loadTime: 0,
      renderTime: 0,
      apiCalls: 0,
      errors: 0
    };
    
    // Setup sandbox environment
    this.setupSandbox();
  }
  
  /**
   * Setup the sandbox environment
   */
  setupSandbox() {
    // Create isolated scope
    this.scope = {
      // Safe API access
      api: this.createSafeAPI(),
      
      // Isolated state management
      state: this.createIsolatedState(),
      
      // Safe DOM access
      dom: this.createSafeDOMAccess(),
      
      // Event bus for communication
      events: this.createEventBus(),
      
      // Safe storage access
      storage: this.createSafeStorage(),
      
      // Safe console for logging
      console: this.createSafeConsole(),
      
      // Timer management
      timers: this.createSafeTimers()
    };
    
    // Set up error boundary
    this.setupErrorBoundary();
  }
  
  /**
   * Load and initialize a component module
   */
  async load(modulePath) {
    const startTime = performance.now();
    
    try {
      // Check if component should be loaded
      if (!this.shouldLoad()) {
        return this.getFallback();
      }
      
      // Load the module
      const module = await this.loadModule(modulePath);
      
      // Initialize component with sandbox
      const component = await this.initializeComponent(module);
      
      // Track metrics
      this.metrics.loadTime = performance.now() - startTime;
      
      // Monitor component health
      this.startHealthMonitoring(component);
      
      return component;
      
    } catch (error) {
      return this.handleLoadError(error);
    }
  }
  
  /**
   * Check if component should be loaded
   */
  shouldLoad() {
    // Check if component is disabled
    if (!this.isActive) {
      console.warn(`[${this.name}] Component is disabled`);
      return false;
    }
    
    // Check error threshold
    if (this.errorCount >= this.config.maxErrors) {
      console.error(`[${this.name}] Too many errors, component disabled`);
      return false;
    }
    
    // Check feature flag
    if (window.FeatureFlags && !window.FeatureFlags.isEnabled(this.name)) {
      console.log(`[${this.name}] Feature flag disabled`);
      return false;
    }
    
    return true;
  }
  
  /**
   * Load module with timeout
   */
  async loadModule(modulePath) {
    return Promise.race([
      import(modulePath),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Module load timeout')), this.config.timeout)
      )
    ]);
  }
  
  /**
   * Initialize component with sandbox
   */
  async initializeComponent(module) {
    // Get component constructor/function
    const Component = module.default || module;
    
    // Check if it's a class or function
    if (typeof Component === 'function') {
      // Check if it's a class constructor
      if (Component.prototype && Component.prototype.constructor === Component) {
        // Class component
        return new Component(this.scope);
      } else {
        // Function component
        return Component(this.scope);
      }
    }
    
    // Direct export object
    if (typeof Component === 'object') {
      // Initialize if has init method
      if (Component.init) {
        await Component.init(this.scope);
      }
      return Component;
    }
    
    throw new Error('Invalid component module');
  }
  
  /**
   * Create safe API wrapper
   */
  createSafeAPI() {
    const self = this;
    
    return {
      fetch: async (...args) => {
        try {
          self.metrics.apiCalls++;
          
          // Add timeout to fetch
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);
          
          const response = await fetch(args[0], {
            ...args[1],
            signal: controller.signal
          });
          
          clearTimeout(timeout);
          return response;
          
        } catch (error) {
          self.handleAPIError(error);
          throw error;
        }
      },
      
      get: (url, options) => this.fetch(url, { ...options, method: 'GET' }),
      post: (url, data, options) => this.fetch(url, { 
        ...options, 
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json', ...options?.headers }
      })
    };
  }
  
  /**
   * Create isolated state management
   */
  createIsolatedState() {
    const self = this;
    
    return new Proxy(this.state, {
      get(target, prop) {
        return target[prop];
      },
      
      set(target, prop, value) {
        const oldValue = target[prop];
        target[prop] = value;
        
        // Emit state change event
        self.scope.events.emit('state:change', {
          property: prop,
          oldValue,
          newValue: value
        });
        
        return true;
      },
      
      deleteProperty(target, prop) {
        delete target[prop];
        self.scope.events.emit('state:delete', { property: prop });
        return true;
      }
    });
  }
  
  /**
   * Create safe DOM access
   */
  createSafeDOMAccess() {
    const self = this;
    
    return {
      querySelector: (selector) => {
        try {
          return document.querySelector(selector);
        } catch (error) {
          self.handleDOMError(error);
          return null;
        }
      },
      
      querySelectorAll: (selector) => {
        try {
          return document.querySelectorAll(selector);
        } catch (error) {
          self.handleDOMError(error);
          return [];
        }
      },
      
      createElement: (tag, attributes = {}, children = []) => {
        const element = document.createElement(tag);
        
        // Set attributes
        Object.entries(attributes).forEach(([key, value]) => {
          if (key === 'className') {
            element.className = value;
          } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
          } else if (key.startsWith('on')) {
            // Event listener
            const event = key.substring(2).toLowerCase();
            element.addEventListener(event, value);
            self.trackEventListener(element, event, value);
          } else {
            element.setAttribute(key, value);
          }
        });
        
        // Add children
        children.forEach(child => {
          if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
          } else if (child instanceof Node) {
            element.appendChild(child);
          }
        });
        
        return element;
      },
      
      render: (selector, content) => {
        try {
          const container = document.querySelector(selector);
          if (!container) {
            throw new Error(`Container not found: ${selector}`);
          }
          
          // Use sanitizer if available
          if (window.sanitizer) {
            window.sanitizer.setHTML(container, content);
          } else {
            container.innerHTML = content;
          }
          
        } catch (error) {
          self.handleDOMError(error);
        }
      },
      
      addEventListener: (target, event, handler, options) => {
        const wrappedHandler = self.wrapEventHandler(handler);
        target.addEventListener(event, wrappedHandler, options);
        self.trackEventListener(target, event, wrappedHandler);
      },
      
      removeEventListener: (target, event, handler) => {
        const tracked = self.getTrackedListener(target, event, handler);
        if (tracked) {
          target.removeEventListener(event, tracked);
          self.untrackEventListener(target, event, tracked);
        }
      }
    };
  }
  
  /**
   * Create event bus for component communication
   */
  createEventBus() {
    const listeners = new Map();
    
    return {
      on: (event, handler) => {
        if (!listeners.has(event)) {
          listeners.set(event, new Set());
        }
        listeners.get(event).add(handler);
      },
      
      off: (event, handler) => {
        if (listeners.has(event)) {
          listeners.get(event).delete(handler);
        }
      },
      
      emit: (event, data) => {
        if (listeners.has(event)) {
          listeners.get(event).forEach(handler => {
            try {
              handler(data);
            } catch (error) {
              console.error(`[${this.name}] Event handler error:`, error);
            }
          });
        }
      },
      
      once: (event, handler) => {
        const wrapper = (data) => {
          handler(data);
          this.off(event, wrapper);
        };
        this.on(event, wrapper);
      }
    };
  }
  
  /**
   * Create safe storage access
   */
  createSafeStorage() {
    const prefix = `sandbox_${this.name}_`;
    
    return {
      get: (key) => {
        try {
          const value = localStorage.getItem(prefix + key);
          return value ? JSON.parse(value) : null;
        } catch (error) {
          console.error(`[${this.name}] Storage read error:`, error);
          return null;
        }
      },
      
      set: (key, value) => {
        try {
          localStorage.setItem(prefix + key, JSON.stringify(value));
          return true;
        } catch (error) {
          console.error(`[${this.name}] Storage write error:`, error);
          return false;
        }
      },
      
      remove: (key) => {
        try {
          localStorage.removeItem(prefix + key);
          return true;
        } catch (error) {
          console.error(`[${this.name}] Storage remove error:`, error);
          return false;
        }
      },
      
      clear: () => {
        try {
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            if (key.startsWith(prefix)) {
              localStorage.removeItem(key);
            }
          });
          return true;
        } catch (error) {
          console.error(`[${this.name}] Storage clear error:`, error);
          return false;
        }
      }
    };
  }
  
  /**
   * Create safe console wrapper
   */
  createSafeConsole() {
    const prefix = `[${this.name}]`;
    
    return {
      log: (...args) => console.log(prefix, ...args),
      info: (...args) => console.info(prefix, ...args),
      warn: (...args) => console.warn(prefix, ...args),
      error: (...args) => {
        console.error(prefix, ...args);
        this.metrics.errors++;
      },
      debug: (...args) => console.debug(prefix, ...args),
      group: (label) => console.group(`${prefix} ${label}`),
      groupEnd: () => console.groupEnd(),
      time: (label) => console.time(`${prefix} ${label}`),
      timeEnd: (label) => console.timeEnd(`${prefix} ${label}`)
    };
  }
  
  /**
   * Create safe timer management
   */
  createSafeTimers() {
    const self = this;
    
    return {
      setTimeout: (callback, delay) => {
        const id = setTimeout(() => {
          try {
            callback();
          } catch (error) {
            self.handleError(error);
          }
          self.timers.delete(id);
        }, delay);
        
        self.timers.add(id);
        return id;
      },
      
      clearTimeout: (id) => {
        clearTimeout(id);
        self.timers.delete(id);
      },
      
      setInterval: (callback, delay) => {
        const id = setInterval(() => {
          try {
            callback();
          } catch (error) {
            self.handleError(error);
          }
        }, delay);
        
        self.timers.add(id);
        return id;
      },
      
      clearInterval: (id) => {
        clearInterval(id);
        self.timers.delete(id);
      },
      
      requestAnimationFrame: (callback) => {
        return requestAnimationFrame(() => {
          try {
            callback();
          } catch (error) {
            self.handleError(error);
          }
        });
      }
    };
  }
  
  /**
   * Set up error boundary
   */
  setupErrorBoundary() {
    // Component-specific error handler
    this.errorHandler = (event) => {
      if (event.filename && event.filename.includes(this.name)) {
        this.handleError(event.error);
        event.preventDefault();
      }
    };
    
    window.addEventListener('error', this.errorHandler);
  }
  
  /**
   * Wrap event handler for error catching
   */
  wrapEventHandler(handler) {
    return (event) => {
      try {
        return handler(event);
      } catch (error) {
        this.handleError(error);
      }
    };
  }
  
  /**
   * Track event listener for cleanup
   */
  trackEventListener(target, event, handler) {
    if (!this.eventListeners.has(target)) {
      this.eventListeners.set(target, new Map());
    }
    
    const targetListeners = this.eventListeners.get(target);
    if (!targetListeners.has(event)) {
      targetListeners.set(event, new Set());
    }
    
    targetListeners.get(event).add(handler);
  }
  
  /**
   * Handle component errors
   */
  handleError(error) {
    this.errorCount++;
    this.lastError = error;
    
    this.errors.push({
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack,
      count: this.errorCount
    });
    
    console.error(`[${this.name}] Component error:`, error);
    
    // Report to monitoring
    if (this.config.monitoring) {
      this.reportError(error);
    }
    
    // Disable component if too many errors
    if (this.errorCount >= this.config.maxErrors) {
      this.disable();
    }
  }
  
  /**
   * Report error to monitoring service
   */
  reportError(error) {
    if (window.gtag) {
      gtag('event', 'exception', {
        description: error.message,
        component: this.name,
        fatal: false
      });
    }
    
    // Could also send to custom error tracking
    if (window.errorReporter) {
      window.errorReporter.log({
        component: this.name,
        error: error.message,
        stack: error.stack,
        metrics: this.metrics
      });
    }
  }
  
  /**
   * Get fallback component
   */
  getFallback() {
    if (this.config.fallback) {
      return this.config.fallback;
    }
    
    // Default fallback
    return {
      render: () => {
        console.warn(`[${this.name}] Using fallback component`);
        return `<div class="component-fallback">Component temporarily unavailable</div>`;
      }
    };
  }
  
  /**
   * Disable component
   */
  disable() {
    console.error(`[${this.name}] Component disabled due to errors`);
    this.isActive = false;
    this.cleanup();
  }
  
  /**
   * Clean up component resources
   */
  cleanup() {
    // Remove event listeners
    this.eventListeners.forEach((events, target) => {
      events.forEach((handlers, event) => {
        handlers.forEach(handler => {
          target.removeEventListener(event, handler);
        });
      });
    });
    this.eventListeners.clear();
    
    // Clear timers
    this.timers.forEach(id => {
      clearTimeout(id);
      clearInterval(id);
    });
    this.timers.clear();
    
    // Remove error handler
    if (this.errorHandler) {
      window.removeEventListener('error', this.errorHandler);
    }
    
    // Clear state
    this.state = {};
    
    // Clear storage
    this.scope.storage.clear();
  }
  
  /**
   * Get component metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      errorCount: this.errorCount,
      isActive: this.isActive,
      uptime: this.startTime ? Date.now() - this.startTime : 0
    };
  }
  
  /**
   * Start health monitoring
   */
  startHealthMonitoring(component) {
    this.startTime = Date.now();
    
    // Monitor component health every minute
    this.healthCheck = setInterval(() => {
      if (!this.isActive) {
        clearInterval(this.healthCheck);
        return;
      }
      
      // Check if component is responsive
      if (component.healthCheck) {
        try {
          const healthy = component.healthCheck();
          if (!healthy) {
            console.warn(`[${this.name}] Health check failed`);
          }
        } catch (error) {
          this.handleError(error);
        }
      }
      
      // Log metrics if in debug mode
      if (window.DEBUG) {
        console.log(`[${this.name}] Metrics:`, this.getMetrics());
      }
    }, 60000); // Check every minute
  }
  
  /**
   * Handle API errors
   */
  handleAPIError(error) {
    console.error(`[${this.name}] API error:`, error);
    this.metrics.errors++;
    
    // Could implement retry logic here
  }
  
  /**
   * Handle DOM errors
   */
  handleDOMError(error) {
    console.error(`[${this.name}] DOM error:`, error);
    this.metrics.errors++;
  }
  
  /**
   * Handle module load error
   */
  handleLoadError(error) {
    console.error(`[${this.name}] Failed to load:`, error);
    this.handleError(error);
    
    return this.getFallback();
  }
  
  /**
   * Get tracked event listener
   */
  getTrackedListener(target, event, originalHandler) {
    if (!this.eventListeners.has(target)) {
      return null;
    }
    
    const targetListeners = this.eventListeners.get(target);
    if (!targetListeners.has(event)) {
      return null;
    }
    
    // Find wrapped handler
    const handlers = targetListeners.get(event);
    for (const handler of handlers) {
      if (handler.original === originalHandler || handler === originalHandler) {
        return handler;
      }
    }
    
    return null;
  }
  
  /**
   * Untrack event listener
   */
  untrackEventListener(target, event, handler) {
    if (this.eventListeners.has(target)) {
      const targetListeners = this.eventListeners.get(target);
      if (targetListeners.has(event)) {
        targetListeners.get(event).delete(handler);
      }
    }
  }
}

// Export for module usage
export default ComponentSandbox;

// Also attach to window for global access
window.ComponentSandbox = ComponentSandbox;