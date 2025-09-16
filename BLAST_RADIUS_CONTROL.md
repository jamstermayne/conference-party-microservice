# Blast Radius Control Strategy

## 1. Component Isolation Architecture

### Current Problems Identified
- **Global Dependencies**: Single app-unified.js controls everything
- **Tight Coupling**: 74+ JS files with cross-dependencies
- **No Feature Flags**: Changes affect all users immediately
- **Single Entry Point**: index.html loads everything upfront
- **Global State**: Window objects and localStorage shared everywhere

## 2. Immediate Safety Measures

### A. Feature Flags System
```javascript
// frontend/src/assets/js/feature-flags.js
class FeatureFlags {
  constructor() {
    this.flags = {
      // Core features - always on
      core: {
        navigation: true,
        api: true,
        auth: true
      },
      // Experimental features - can be toggled
      experimental: {
        newCalendarSync: false,
        enhancedMaps: false,
        aiRecommendations: false
      },
      // Rollout percentages
      rollout: {
        newUI: 0.1, // 10% of users
        performanceOptimizations: 0.5 // 50% of users
      }
    };
    
    // Check URL params for overrides
    this.checkOverrides();
  }
  
  isEnabled(feature) {
    // Check if explicitly disabled
    if (localStorage.getItem(`ff_disable_${feature}`)) return false;
    
    // Check if explicitly enabled
    if (localStorage.getItem(`ff_enable_${feature}`)) return true;
    
    // Check rollout percentage
    if (this.flags.rollout[feature]) {
      return this.checkRollout(feature);
    }
    
    // Default to flag value
    return this.getFlag(feature);
  }
  
  checkRollout(feature) {
    const userId = localStorage.getItem('userId') || 'anonymous';
    const hash = this.hashCode(userId + feature);
    const percentage = Math.abs(hash % 100) / 100;
    return percentage < this.flags.rollout[feature];
  }
  
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }
}

window.FeatureFlags = new FeatureFlags();
```

### B. Component Sandboxing
```javascript
// frontend/src/assets/js/component-sandbox.js
class ComponentSandbox {
  constructor(componentName) {
    this.name = componentName;
    this.state = {};
    this.errors = [];
    this.dependencies = new Set();
  }
  
  async load(module) {
    try {
      // Create isolated scope
      const sandbox = {
        // Provide controlled API access
        api: this.createSafeAPI(),
        state: this.createIsolatedState(),
        dom: this.createSafeDOMAccess(),
        events: this.createEventBus()
      };
      
      // Load module in sandbox
      const component = await import(module);
      
      // Initialize with sandbox context
      return component.default(sandbox);
      
    } catch (error) {
      this.handleError(error);
      return this.getFallback();
    }
  }
  
  createSafeAPI() {
    return {
      fetch: (...args) => this.trackedFetch(...args),
      localStorage: this.createSafeStorage(),
      console: this.createSafeConsole()
    };
  }
  
  createIsolatedState() {
    return new Proxy(this.state, {
      set: (target, prop, value) => {
        // Track state changes
        console.log(`[${this.name}] State change: ${prop}`);
        target[prop] = value;
        return true;
      }
    });
  }
  
  handleError(error) {
    this.errors.push({
      timestamp: Date.now(),
      error: error.message,
      stack: error.stack
    });
    
    // Don't let component errors crash the app
    console.error(`[${this.name}] Component error:`, error);
    
    // Report to monitoring
    this.reportError(error);
  }
}
```

## 3. Safe Deployment Patterns

### A. Canary Deployments
```javascript
// frontend/src/assets/js/canary-controller.js
class CanaryController {
  constructor() {
    this.version = this.getVersion();
    this.isCanary = this.checkCanaryStatus();
  }
  
  getVersion() {
    // Version from build process
    return window.__APP_VERSION__ || 'stable';
  }
  
  checkCanaryStatus() {
    // Check if user is in canary group
    const canaryUsers = localStorage.getItem('canaryGroup');
    const urlParam = new URLSearchParams(window.location.search).get('canary');
    
    return canaryUsers === 'true' || urlParam === 'true';
  }
  
  loadComponent(stableModule, canaryModule) {
    const module = this.isCanary ? canaryModule : stableModule;
    
    return import(module).catch(error => {
      console.error('Failed to load module, falling back to stable:', error);
      return import(stableModule);
    });
  }
}
```

### B. Gradual Rollout
```javascript
// frontend/src/assets/js/rollout-manager.js
class RolloutManager {
  constructor() {
    this.stages = {
      'internal': 0.01,    // 1% internal testing
      'alpha': 0.05,       // 5% alpha users
      'beta': 0.20,        // 20% beta users
      'production': 1.0    // 100% all users
    };
  }
  
  shouldActivate(feature, stage = 'production') {
    const threshold = this.stages[stage] || 0;
    const userHash = this.getUserHash();
    
    return (userHash % 100) / 100 < threshold;
  }
  
  getUserHash() {
    const userId = localStorage.getItem('userId') || 'anonymous';
    return Math.abs(this.hashCode(userId));
  }
  
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
    }
    return hash;
  }
}
```

## 4. Module Isolation Pattern

### A. Before (Tightly Coupled)
```javascript
// BAD - Direct global dependencies
import { fetchParties } from './api-lite.js';
import sanitizer from './security/sanitizer.js';

class UnifiedConferenceApp {
  constructor() {
    // Direct DOM manipulation
    document.getElementById('app').innerHTML = '...';
    
    // Direct localStorage access
    localStorage.setItem('user', JSON.stringify(data));
    
    // Global event listeners
    window.addEventListener('click', this.handleClick);
  }
}
```

### B. After (Isolated Module)
```javascript
// GOOD - Dependency injection
export default function createApp(dependencies) {
  const { api, storage, dom, events } = dependencies;
  
  class IsolatedApp {
    constructor() {
      // Use injected dependencies
      this.api = api;
      this.storage = storage;
      this.dom = dom;
      this.events = events;
    }
    
    async init() {
      try {
        // All operations through safe interfaces
        const data = await this.api.fetch('/parties');
        await this.storage.set('parties', data);
        this.dom.render('#app', this.renderParties(data));
        
      } catch (error) {
        // Errors contained within module
        this.handleError(error);
      }
    }
    
    handleError(error) {
      // Module-specific error handling
      this.events.emit('app:error', error);
    }
  }
  
  return new IsolatedApp();
}
```

## 5. Testing in Isolation

### A. Component Testing Harness
```javascript
// tests/component-harness.js
class ComponentTestHarness {
  constructor(component) {
    this.component = component;
    this.mockAPI = this.createMockAPI();
    this.mockDOM = this.createMockDOM();
    this.mockStorage = new Map();
  }
  
  createMockAPI() {
    return {
      fetch: jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({})
      })
    };
  }
  
  createMockDOM() {
    return {
      querySelector: jest.fn(),
      render: jest.fn(),
      addEventListener: jest.fn()
    };
  }
  
  async test() {
    // Test component in complete isolation
    const instance = await this.component({
      api: this.mockAPI,
      dom: this.mockDOM,
      storage: this.mockStorage
    });
    
    // Verify it works with mocked dependencies
    await instance.init();
    
    // Check no global side effects
    expect(window.localStorage.length).toBe(0);
    expect(document.body.innerHTML).toBe('');
  }
}
```

## 6. Deployment Checklist

### Before Any Change:
- [ ] Identify affected components
- [ ] Check dependency graph
- [ ] Create feature flag if needed
- [ ] Write isolation tests
- [ ] Plan rollback strategy

### During Development:
- [ ] Work in feature branch
- [ ] Use component sandbox
- [ ] Test with feature flag off
- [ ] Test with feature flag on
- [ ] Check for global side effects

### Before Merge:
- [ ] Run full test suite
- [ ] Check performance impact
- [ ] Verify no console errors
- [ ] Test on multiple devices
- [ ] Document breaking changes

### After Deploy:
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Gradual rollout (1% → 10% → 50% → 100%)
- [ ] Have rollback ready
- [ ] Monitor user feedback

## 7. Quick Implementation Guide

### Step 1: Add Feature Flags (5 minutes)
```bash
# Add feature flags to index.html
<script src="/assets/js/feature-flags.js"></script>
```

### Step 2: Wrap New Features (10 minutes)
```javascript
// In your component
if (window.FeatureFlags?.isEnabled('newFeature')) {
  // New code here
} else {
  // Existing stable code
}
```

### Step 3: Test in Isolation
```bash
# Test with feature on
localStorage.setItem('ff_enable_newFeature', 'true');

# Test with feature off  
localStorage.removeItem('ff_enable_newFeature');
```

### Step 4: Gradual Rollout
```javascript
// Start with 10% of users
FeatureFlags.flags.rollout.newFeature = 0.1;

// Monitor for 24 hours, then increase
FeatureFlags.flags.rollout.newFeature = 0.5;

// If stable, roll out to everyone
FeatureFlags.flags.rollout.newFeature = 1.0;
```

## 8. Emergency Rollback

### Client-Side Kill Switch
```javascript
// Add to index.html
<script>
  // Emergency kill switches
  const killSwitches = {
    'calendar-sync': false,
    'new-ui': false,
    'api-v2': false
  };
  
  // Check remote config
  fetch('/api/killswitches')
    .then(r => r.json())
    .then(switches => {
      Object.assign(killSwitches, switches);
      window.__KILL_SWITCHES__ = killSwitches;
    })
    .catch(() => {
      // Use defaults if API fails
      window.__KILL_SWITCHES__ = killSwitches;
    });
</script>
```

### Server-Side Circuit Breaker
```javascript
// functions/src/index.ts
const circuitBreaker = {
  failures: new Map(),
  threshold: 5,
  timeout: 60000, // 1 minute
  
  isOpen(feature) {
    const failures = this.failures.get(feature) || 0;
    return failures >= this.threshold;
  },
  
  recordSuccess(feature) {
    this.failures.delete(feature);
  },
  
  recordFailure(feature) {
    const current = this.failures.get(feature) || 0;
    this.failures.set(feature, current + 1);
    
    // Auto-reset after timeout
    setTimeout(() => {
      this.failures.delete(feature);
    }, this.timeout);
  }
};
```

## 9. Monitoring & Alerts

### Error Boundaries
```javascript
// frontend/src/assets/js/error-boundary.js
class ErrorBoundary {
  constructor(componentName) {
    this.component = componentName;
    this.errorCount = 0;
    this.maxErrors = 3;
  }
  
  wrap(fn) {
    return async (...args) => {
      try {
        return await fn(...args);
        
      } catch (error) {
        this.errorCount++;
        
        // Report error
        this.reportError(error);
        
        // Disable component if too many errors
        if (this.errorCount >= this.maxErrors) {
          console.error(`Disabling ${this.component} due to errors`);
          return this.getFallback();
        }
        
        // Try to recover
        return this.recover(error);
      }
    };
  }
  
  reportError(error) {
    // Send to monitoring service
    if (window.gtag) {
      gtag('event', 'exception', {
        description: error.message,
        component: this.component,
        fatal: false
      });
    }
  }
}
```

## 10. Best Practices Summary

### DO:
✅ Use feature flags for all new features
✅ Test components in isolation
✅ Implement gradual rollouts
✅ Monitor error rates after deploy
✅ Have rollback plan ready
✅ Use dependency injection
✅ Create error boundaries
✅ Document breaking changes

### DON'T:
❌ Make global changes without flags
❌ Deploy to 100% users immediately  
❌ Modify core components directly
❌ Ignore error monitoring
❌ Skip isolation testing
❌ Use global state directly
❌ Forget mobile testing
❌ Deploy on Fridays

## Implementation Priority

1. **High Priority** (Do Now):
   - Add feature flags system
   - Create error boundaries
   - Implement kill switches

2. **Medium Priority** (This Week):
   - Component sandboxing
   - Gradual rollout system
   - Monitoring improvements

3. **Low Priority** (When Possible):
   - Full dependency injection
   - Complete module isolation
   - Automated canary deployments