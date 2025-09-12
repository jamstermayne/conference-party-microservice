/**
 * Example: How to create a safe, isolated component
 * This shows best practices for limiting blast radius
 */

// Example 1: Using Feature Flags
export function initCalendarSync() {
  // Check if feature is enabled before initializing
  if (!window.FeatureFlags?.isEnabled('calendarSync')) {
    console.log('Calendar sync is disabled');
    return null;
  }
  
  // Feature is enabled, proceed with initialization
  try {
    // Your calendar sync code here
    console.log('Calendar sync initialized');
    return {
      sync: () => console.log('Syncing calendar...')
    };
  } catch (error) {
    console.error('Calendar sync failed:', error);
    return null;
  }
}

// Example 2: Using Component Sandbox
export async function loadHotspotsFeature() {
  // Create sandbox for the hotspots component
  const sandbox = new ComponentSandbox('hotspots', {
    maxErrors: 3,
    timeout: 10000,
    fallback: {
      render: () => '<div>Hotspots temporarily unavailable</div>'
    }
  });
  
  // Load component in isolation
  const hotspots = await sandbox.load('/assets/js/hotspots-controller.js');
  
  return hotspots;
}

// Example 3: Gradual Rollout
export function initNewPartyCards() {
  // Check if user is in rollout percentage
  if (!window.FeatureFlags?.isEnabled('newPartyCards')) {
    // Use old implementation
    return initOldPartyCards();
  }
  
  // Use new implementation
  try {
    return initEnhancedPartyCards();
  } catch (error) {
    console.error('New party cards failed, falling back:', error);
    return initOldPartyCards();
  }
}

// Example 4: Safe Module Pattern
export function createSafeModule(name, implementation) {
  return {
    init: async function(dependencies = {}) {
      // Check feature flag
      if (!window.FeatureFlags?.isEnabled(name)) {
        console.log(`${name} is disabled by feature flag`);
        return null;
      }
      
      // Create error boundary
      try {
        // Initialize with provided dependencies
        const module = await implementation(dependencies);
        
        // Wrap all methods with error handling
        const safeModule = {};
        for (const [key, value] of Object.entries(module)) {
          if (typeof value === 'function') {
            safeModule[key] = async (...args) => {
              try {
                return await value(...args);
              } catch (error) {
                console.error(`${name}.${key} error:`, error);
                
                // Report error
                if (window.gtag) {
                  gtag('event', 'exception', {
                    description: error.message,
                    component: name,
                    method: key,
                    fatal: false
                  });
                }
                
                // Return safe default
                return null;
              }
            };
          } else {
            safeModule[key] = value;
          }
        }
        
        return safeModule;
        
      } catch (error) {
        console.error(`Failed to initialize ${name}:`, error);
        return null;
      }
    }
  };
}

// Example 5: URL-based Testing
export function getTestingMode() {
  const params = new URLSearchParams(window.location.search);
  
  // Check for testing flags
  const testMode = params.get('test');
  const debugMode = params.get('debug') === 'true';
  const canaryMode = params.get('canary') === 'true';
  
  return {
    isTest: testMode !== null,
    testMode,
    debugMode,
    canaryMode,
    
    // Helper to check if a specific test is active
    isTestActive: (testName) => {
      return testMode === testName || testMode === 'all';
    }
  };
}

// Example 6: Isolated Event System
export function createIsolatedEvents() {
  const events = new Map();
  
  return {
    on: (event, handler) => {
      if (!events.has(event)) {
        events.set(event, new Set());
      }
      events.get(event).add(handler);
    },
    
    off: (event, handler) => {
      if (events.has(event)) {
        events.get(event).delete(handler);
      }
    },
    
    emit: (event, data) => {
      if (events.has(event)) {
        events.get(event).forEach(handler => {
          // Each handler runs in isolation
          try {
            handler(data);
          } catch (error) {
            console.error(`Event handler error for ${event}:`, error);
            // Don't let one handler crash others
          }
        });
      }
    },
    
    clear: () => {
      events.clear();
    }
  };
}

// Example 7: Safe API Wrapper
export function createSafeAPI(baseURL = '/api') {
  const cache = new Map();
  const errors = new Map();
  
  async function safeFetch(url, options = {}) {
    const cacheKey = `${options.method || 'GET'}:${url}`;
    
    // Check cache first
    if (options.cache !== false && cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 60000) { // 1 minute cache
        return cached.data;
      }
    }
    
    try {
      // Add timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), options.timeout || 10000);
      
      const response = await fetch(baseURL + url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache successful response
      cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      // Clear error count on success
      errors.delete(url);
      
      return data;
      
    } catch (error) {
      // Track errors
      const errorCount = (errors.get(url) || 0) + 1;
      errors.set(url, errorCount);
      
      // Circuit breaker - stop trying after 5 failures
      if (errorCount >= 5) {
        console.error(`Circuit breaker open for ${url}`);
        return null;
      }
      
      throw error;
    }
  }
  
  return {
    get: (url, options) => safeFetch(url, { ...options, method: 'GET' }),
    post: (url, data, options) => safeFetch(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    }),
    clearCache: () => cache.clear(),
    getErrors: () => new Map(errors)
  };
}

// Example 8: Component Health Check
export function createHealthChecker(components) {
  const health = new Map();
  
  function checkComponent(name, component) {
    try {
      // Check if component has health check method
      if (component?.healthCheck) {
        const isHealthy = component.healthCheck();
        health.set(name, {
          healthy: isHealthy,
          lastCheck: Date.now(),
          errors: 0
        });
        return isHealthy;
      }
      
      // Basic check - component exists
      const isHealthy = component !== null && component !== undefined;
      health.set(name, {
        healthy: isHealthy,
        lastCheck: Date.now(),
        errors: 0
      });
      return isHealthy;
      
    } catch (error) {
      const current = health.get(name) || { errors: 0 };
      health.set(name, {
        healthy: false,
        lastCheck: Date.now(),
        errors: current.errors + 1,
        lastError: error.message
      });
      return false;
    }
  }
  
  return {
    check: (name, component) => checkComponent(name, component),
    
    checkAll: () => {
      const results = {};
      for (const [name, component] of Object.entries(components)) {
        results[name] = checkComponent(name, component);
      }
      return results;
    },
    
    getStatus: () => {
      const status = {};
      for (const [name, data] of health.entries()) {
        status[name] = { ...data };
      }
      return status;
    },
    
    isHealthy: (name) => {
      const data = health.get(name);
      return data?.healthy === true;
    },
    
    reset: (name) => {
      if (name) {
        health.delete(name);
      } else {
        health.clear();
      }
    }
  };
}

// Example 9: Safe State Management
export function createSafeState(initialState = {}) {
  let state = { ...initialState };
  const listeners = new Set();
  const history = [];
  const maxHistory = 10;
  
  return {
    get: (key) => {
      return key ? state[key] : { ...state };
    },
    
    set: (key, value) => {
      // Save previous state
      history.push({ ...state });
      if (history.length > maxHistory) {
        history.shift();
      }
      
      // Update state
      const oldValue = state[key];
      state[key] = value;
      
      // Notify listeners
      listeners.forEach(listener => {
        try {
          listener({
            key,
            oldValue,
            newValue: value,
            state: { ...state }
          });
        } catch (error) {
          console.error('State listener error:', error);
        }
      });
    },
    
    update: (updates) => {
      // Batch update
      history.push({ ...state });
      if (history.length > maxHistory) {
        history.shift();
      }
      
      Object.assign(state, updates);
      
      // Notify listeners
      listeners.forEach(listener => {
        try {
          listener({
            updates,
            state: { ...state }
          });
        } catch (error) {
          console.error('State listener error:', error);
        }
      });
    },
    
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    
    rollback: () => {
      if (history.length > 0) {
        state = history.pop();
        return true;
      }
      return false;
    },
    
    reset: () => {
      state = { ...initialState };
      history.length = 0;
      listeners.clear();
    }
  };
}

// Example 10: Testing Helper
export function setupTestEnvironment() {
  // Enable all feature flags for testing
  window.FeatureFlags?.clearOverrides();
  
  // Enable specific features for testing
  const testFeatures = [
    'calendarSync',
    'hotspots',
    'emailSync',
    'newPartyCards'
  ];
  
  testFeatures.forEach(feature => {
    window.FeatureFlags?.enable(feature, true); // temporary enable
  });
  
  // Add testing utilities to window
  window.testing = {
    // Feature flag controls
    enableFeature: (name) => window.FeatureFlags?.enable(name, true),
    disableFeature: (name) => window.FeatureFlags?.disable(name, true),
    
    // Component testing
    loadInSandbox: async (modulePath) => {
      const sandbox = new ComponentSandbox('test', {
        maxErrors: 1,
        monitoring: false
      });
      return await sandbox.load(modulePath);
    },
    
    // Performance testing
    measurePerformance: async (fn, iterations = 100) => {
      const times = [];
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await fn();
        times.push(performance.now() - start);
      }
      
      return {
        average: times.reduce((a, b) => a + b, 0) / times.length,
        min: Math.min(...times),
        max: Math.max(...times),
        median: times.sort()[Math.floor(times.length / 2)]
      };
    },
    
    // Error simulation
    simulateError: () => {
      throw new Error('Test error - this is intentional');
    },
    
    // Network simulation
    simulateOffline: () => {
      window.dispatchEvent(new Event('offline'));
    },
    
    simulateOnline: () => {
      window.dispatchEvent(new Event('online'));
    },
    
    // Clear all test data
    cleanup: () => {
      window.FeatureFlags?.clearOverrides();
      localStorage.clear();
      sessionStorage.clear();
    }
  };
  
  console.log('Test environment ready. Use window.testing for helpers.');
}

// Auto-setup test environment if in test mode
if (new URLSearchParams(window.location.search).get('test')) {
  setupTestEnvironment();
}