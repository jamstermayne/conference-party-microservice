/**
 * Progressive Enhancement Module Loader
 * Allows modern architecture to coexist with legacy code
 */

class ModuleLoader {
  constructor() {
    this.modules = new Map();
    this.legacy = window.UnifiedConferenceApp || {};
    
    // Feature detection
    this.supportsModules = 'noModule' in HTMLScriptElement.prototype;
    this.supportsComponents = 'customElements' in window;
    this.supportsProxy = typeof Proxy !== 'undefined';
    
    // Compatibility flags controlled by feature flags
    this.features = {
      auth: false,
      data: false,
      ui: false,
      matching: false,
      realtime: false
    };
    
    // Initialize based on feature flags
    this.initializeFeatures();
  }
  
  initializeFeatures() {
    if (window.FeatureFlags) {
      Object.keys(this.features).forEach(feature => {
        this.features[feature] = window.FeatureFlags.isEnabled(`modern_${feature}`);
      });
    }
    
    console.log('[ModernCore] Features enabled:', this.features);
  }
  
  async loadModule(name, path) {
    // Check cache first
    if (this.modules.has(name)) {
      return this.modules.get(name);
    }
    
    try {
      // Dynamic import with fallback
      const module = await import(path).catch(() => {
        // Try alternative path
        return import(`/assets/js/modern/${name}.js`);
      });
      
      this.modules.set(name, module);
      console.log(`[ModernCore] Loaded module: ${name}`);
      return module;
      
    } catch (error) {
      console.warn(`[ModernCore] Failed to load ${name}, using legacy`, error);
      return this.getLegacyFallback(name);
    }
  }
  
  getLegacyFallback(name) {
    // Map modern modules to legacy equivalents
    const legacyMap = {
      'matching': this.legacy.matchingService,
      'auth': this.legacy.authService,
      'api': this.legacy.apiService,
      'events': this.legacy.eventsController
    };
    
    return legacyMap[name] || null;
  }
  
  async getService(serviceName) {
    // Check if modern version should be used
    if (this.features[serviceName]) {
      return this.loadModule(
        serviceName,
        `/modern/services/${serviceName}.service.js`
      );
    }
    
    // Fall back to legacy
    return this.getLegacyFallback(serviceName);
  }
  
  // Enhance existing component with modern features
  async enhanceComponent(selector, enhancerModule) {
    const elements = document.querySelectorAll(selector);
    if (elements.length === 0) return;
    
    const enhancer = await this.loadModule(enhancerModule, `/modern/enhancers/${enhancerModule}.js`);
    if (!enhancer) return;
    
    elements.forEach(element => {
      if (!element.dataset.enhanced) {
        enhancer.enhance(element);
        element.dataset.enhanced = 'true';
      }
    });
  }
  
  // Replace component with modern version
  replaceComponent(selector, modernComponent) {
    if (!this.features.ui) return;
    
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      if (!el.dataset.replaced) {
        const modern = document.createElement(modernComponent);
        
        // Transfer attributes
        Array.from(el.attributes).forEach(attr => {
          modern.setAttribute(attr.name, attr.value);
        });
        
        // Transfer content
        modern.innerHTML = el.innerHTML;
        
        // Replace in DOM
        el.replaceWith(modern);
        modern.dataset.replaced = 'true';
      }
    });
  }
  
  // Intercept and enhance API calls
  interceptAPI() {
    if (!this.features.data) return;
    
    const originalFetch = window.fetch;
    window.fetch = async (url, options = {}) => {
      // Check if this is an API call we want to enhance
      if (typeof url === 'string' && url.includes('/api/')) {
        // Add modern features
        options.headers = {
          ...options.headers,
          'X-Modern-Client': 'true',
          'X-Client-Version': '2.0'
        };
        
        // Add caching layer
        const cacheKey = `${options.method || 'GET'}:${url}`;
        if (options.method === 'GET' && this.modules.has(`cache:${cacheKey}`)) {
          const cached = this.modules.get(`cache:${cacheKey}`);
          if (Date.now() - cached.timestamp < 60000) {
            return Promise.resolve(new Response(JSON.stringify(cached.data)));
          }
        }
        
        // Make request
        const response = await originalFetch(url, options);
        
        // Cache successful GET requests
        if (options.method === 'GET' && response.ok) {
          const data = await response.clone().json();
          this.modules.set(`cache:${cacheKey}`, {
            data,
            timestamp: Date.now()
          });
        }
        
        return response;
      }
      
      return originalFetch(url, options);
    };
  }
  
  // Check browser capabilities
  checkCapabilities() {
    return {
      modules: this.supportsModules,
      components: this.supportsComponents,
      proxy: this.supportsProxy,
      webgl: !!document.createElement('canvas').getContext('webgl'),
      workers: typeof Worker !== 'undefined',
      indexedDB: 'indexedDB' in window,
      serviceWorker: 'serviceWorker' in navigator
    };
  }
  
  // Initialize modern features progressively
  async initialize() {
    console.log('[ModernCore] Initializing...');
    
    // Check capabilities
    const capabilities = this.checkCapabilities();
    console.log('[ModernCore] Browser capabilities:', capabilities);
    
    // Set up API interception if enabled
    this.interceptAPI();
    
    // Load core modules
    if (this.features.auth) {
      await this.loadModule('auth', '/modern/services/auth.service.js');
    }
    
    if (this.features.matching) {
      await this.loadModule('matching', '/modern/services/matching.service.js');
    }
    
    // Enhance UI components
    if (this.features.ui) {
      // Enhance party cards
      await this.enhanceComponent('.party-card', 'party-card-enhancer');
      
      // Enhance connection cards  
      await this.enhanceComponent('.connection-card', 'connection-card-enhancer');
    }
    
    console.log('[ModernCore] Initialization complete');
  }
  
  // Get initialization status
  getStatus() {
    return {
      modules: Array.from(this.modules.keys()),
      features: this.features,
      capabilities: this.checkCapabilities(),
      legacy: !!this.legacy
    };
  }
}

// Create singleton instance
window.ModernCore = new ModuleLoader();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.ModernCore.initialize();
  });
} else {
  window.ModernCore.initialize();
}

// Export for module usage
export default window.ModernCore;