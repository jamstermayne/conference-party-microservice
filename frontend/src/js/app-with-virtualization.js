/**
 * PROFESSIONAL INTELLIGENCE PLATFORM - MAIN APP WITH VIRTUALIZATION
 * High-performance event rendering with virtualized lists
 */

// Import virtualized components
import('./components/VirtualizedEventList.js?v=b023');
import('./event-list-integration.js?v=b023');
import('./hot-reload-integration.js?v=b023');

// ⚡ OPTIMIZED MODULE LOADING - Dynamic imports with virtualization
let Store, router, api, nav, eventSystem, Events, motion, viewTX;
let bindPressFeedback, createFPSWatchdog, mountInstallFTUE;
let eventListManager; // New virtualized event manager

// Enhanced controller registry with performance monitoring
const CONTROLLER_MODULES = {
  home: () => import('./controllers/HomeController.js?v=b023').then(m => m.HomeController),
  people: () => import('./controllers/PeopleController.js?v=b023').then(m => m.PeopleController),
  opportunities: () => import('./controllers/OpportunitiesController.js?v=b023').then(m => m.OpportunitiesController),
  events: () => import('./controllers/EventController.js?v=b023').then(m => m.EventController),
  me: () => import('./controllers/MeController.js?v=b023').then(m => m.MeController),
  invite: () => import('./controllers/InviteController.js?v=b023').then(m => m.InviteController),
  calendar: () => import('./controllers/CalendarController.js?v=b023').then(m => m.CalendarController),
  fomo: () => import('./controllers/FomoController.js?v=b023').then(m => m.FomoController),
  'account-link': () => import('./controllers/AccountLinkController.js?v=b023').then(m => m.AccountLinkController),
  'calendar-sync': () => import('./controllers/CalendarSyncController.js?v=b023').then(m => m.CalendarSyncController),
  'invite-panel': () => import('./controllers/InvitePanelController.js?v=b023').then(m => m.InvitePanelController)
};

// Enhanced module loader with performance tracking
const ModuleLoader = {
  cache: new Map(),
  loadedModules: new Set(),
  failedModules: new Set(),
  performanceMetrics: {
    loadTimes: new Map(),
    totalLoadTime: 0,
    moduleCount: 0
  },
  
  async loadCoreModule(modulePath, exportName) {
    const startTime = performance.now();
    const cacheKey = `${modulePath}#${exportName || 'default'}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    try {
      const module = await import(modulePath);
      const result = exportName ? module[exportName] : module.default || module;
      
      const loadTime = performance.now() - startTime;
      this.performanceMetrics.loadTimes.set(modulePath, loadTime);
      this.performanceMetrics.totalLoadTime += loadTime;
      this.performanceMetrics.moduleCount++;
      
      this.cache.set(cacheKey, result);
      this.loadedModules.add(modulePath);
      
      console.log(`✅ Module loaded: ${modulePath} (${loadTime.toFixed(2)}ms)`);
      
      return result;
    } catch (error) {
      console.warn(`⚠️ Failed to load module ${modulePath}:`, error);
      this.failedModules.add(modulePath);
      return null;
    }
  },

  getPerformanceReport() {
    const avgLoadTime = this.performanceMetrics.totalLoadTime / this.performanceMetrics.moduleCount;
    
    return {
      totalModules: this.performanceMetrics.moduleCount,
      successfulLoads: this.loadedModules.size,
      failedLoads: this.failedModules.size,
      totalLoadTime: this.performanceMetrics.totalLoadTime.toFixed(2) + 'ms',
      averageLoadTime: avgLoadTime.toFixed(2) + 'ms',
      loadTimes: Array.from(this.performanceMetrics.loadTimes.entries())
    };
  }
};

// Enhanced application manager with virtualization support
class ProfessionalIntelligencePlatform {
  constructor() {
    this.version = '3.2.0-virtualized';
    this.startTime = performance.now();
    this.controllers = new Map();
    this.currentController = null;
    this.isInitialized = false;
    this.performanceMonitor = null;
    
    // Virtualization-specific properties
    this.virtualListManager = null;
    this.renderingOptimizations = {
      virtualScrollEnabled: true,
      intersectionObserverEnabled: true,
      prefetchEnabled: true,
      gestureRecognitionEnabled: true
    };
    
    console.log('🚀 Professional Intelligence Platform initializing with virtualization...');
  }

  async initialize() {
    try {
      console.log('🎯 Loading core modules with performance monitoring...');
      
      // Load core modules with timing
      await this.loadCoreModules();
      
      // Initialize virtualized event system
      await this.initializeVirtualization();
      
      // Initialize performance monitoring
      this.initializePerformanceMonitoring();
      
      // Initialize routing and UI
      await this.initializeApplication();
      
      // Setup enhanced event listeners
      this.setupEventListeners();
      
      // Initialize controllers with virtualization support
      await this.initializeControllers();
      
      const initTime = performance.now() - this.startTime;
      console.log(`✅ Professional Intelligence Platform initialized in ${initTime.toFixed(2)}ms`);
      
      // Report performance metrics
      this.reportPerformanceMetrics();
      
      this.isInitialized = true;
      
      // Dispatch initialization complete event
      document.dispatchEvent(new CustomEvent('platformInitialized', {
        detail: { 
          version: this.version,
          initTime,
          virtualizationEnabled: true,
          performanceReport: ModuleLoader.getPerformanceReport()
        }
      }));
      
    } catch (error) {
      console.error('❌ Platform initialization failed:', error);
      this.handleInitializationError(error);
    }
  }

  async loadCoreModules() {
    const moduleLoads = [
      ModuleLoader.loadCoreModule('./storage-manager.js?v=b023', 'StorageManager'),
      ModuleLoader.loadCoreModule('./router.js?v=b023', 'Router'),
      ModuleLoader.loadCoreModule('./api.js?v=b023', 'API'),
      ModuleLoader.loadCoreModule('./nav.js?v=b023'),
      ModuleLoader.loadCoreModule('./event-system.js?v=b023', 'EventSystem'),
      ModuleLoader.loadCoreModule('./events.js?v=b023'),
      ModuleLoader.loadCoreModule('./motion.js?v=b023'),
      ModuleLoader.loadCoreModule('./view-transition.js?v=b023'),
      ModuleLoader.loadCoreModule('./press-feedback.js?v=b023', 'bindPressFeedback'),
      ModuleLoader.loadCoreModule('./fps-watchdog.js?v=b023', 'createFPSWatchdog'),
      ModuleLoader.loadCoreModule('./pwa-install.js?v=b023', 'mountInstallFTUE')
    ];
    
    const results = await Promise.allSettled(moduleLoads);
    
    // Assign loaded modules
    [Store, router, api, nav, eventSystem, Events, motion, viewTX, 
     bindPressFeedback, createFPSWatchdog, mountInstallFTUE] = results.map(r => 
      r.status === 'fulfilled' ? r.value : null
    );
    
    // Report any failed loads
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      console.warn(`⚠️ ${failures.length} core modules failed to load:`, failures);
    }
  }

  async initializeVirtualization() {
    console.log('🔧 Initializing virtualization systems...');
    
    try {
      // Wait for VirtualizedEventList to be available
      if (typeof VirtualizedEventList === 'undefined') {
        await new Promise(resolve => {
          const checkForVirtualList = () => {
            if (typeof VirtualizedEventList !== 'undefined') {
              resolve();
            } else {
              setTimeout(checkForVirtualList, 100);
            }
          };
          checkForVirtualList();
        });
      }
      
      // Wait for eventListManager to be initialized
      if (typeof eventListManager === 'undefined') {
        await new Promise(resolve => {
          const checkForManager = () => {
            if (typeof eventListManager !== 'undefined' && eventListManager) {
              resolve();
            } else {
              setTimeout(checkForManager, 100);
            }
          };
          checkForManager();
        });
      }
      
      this.virtualListManager = eventListManager;
      
      // Setup virtualization event listeners
      document.addEventListener('eventClicked', this.handleVirtualEventClick.bind(this));
      document.addEventListener('eventSwiped', this.handleVirtualEventSwipe.bind(this));
      
      console.log('✅ Virtualization systems initialized');
      
    } catch (error) {
      console.warn('⚠️ Virtualization initialization failed:', error);
      this.renderingOptimizations.virtualScrollEnabled = false;
    }
  }

  initializePerformanceMonitoring() {
    // Enhanced FPS monitoring with virtualization awareness
    if (createFPSWatchdog) {
      this.performanceMonitor = createFPSWatchdog({
        threshold: 45, // Maintain 45+ FPS
        onDrop: (fps, duration) => {
          console.warn(`⚠️ FPS drop detected: ${fps.toFixed(1)}fps for ${duration}ms`);
          
          // Auto-optimize for virtualization performance
          if (this.virtualListManager && fps < 30) {
            console.log('🔧 Auto-optimizing virtualization for performance...');
            this.optimizeVirtualizationPerformance();
          }
        },
        onRecover: (fps) => {
          console.log(`✅ FPS recovered: ${fps.toFixed(1)}fps`);
        }
      });
    }
    
    // Performance observer for paint and layout metrics
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name.includes('virtual-list') || entry.entryType === 'paint') {
            console.log('📊 Performance entry:', {
              name: entry.name,
              type: entry.entryType,
              duration: entry.duration?.toFixed(2) + 'ms',
              startTime: entry.startTime?.toFixed(2) + 'ms'
            });
          }
        }
      });
      
      observer.observe({ 
        entryTypes: ['paint', 'layout-shift', 'largest-contentful-paint', 'measure'] 
      });
    }
  }

  async initializeApplication() {
    // Initialize store with enhanced caching
    if (Store) {
      Store.enableBatching = true;
      Store.enablePersistence = true;
    }
    
    // Initialize router with virtualization support
    if (router) {
      router.enablePreload = true;
      router.transitionDuration = 200;
      
      // Add virtualization-aware route handlers
      router.beforeRoute = (from, to) => {
        if (this.virtualListManager) {
          // Pause virtual list rendering during route transitions
          this.virtualListManager.pauseRendering?.();
        }
      };
      
      router.afterRoute = (from, to) => {
        if (this.virtualListManager) {
          // Resume virtual list rendering after route transitions
          this.virtualListManager.resumeRendering?.();
        }
      };
    }
    
    // Initialize API with enhanced error handling
    if (api) {
      api.defaultTimeout = 10000;
      api.retryAttempts = 3;
    }
    
    // Initialize navigation with performance optimizations
    if (nav) {
      nav.enableTransitions = true;
      nav.enablePreload = true;
    }
  }

  setupEventListeners() {
    // Enhanced event delegation with virtualization support
    document.addEventListener('click', this.handleGlobalClick.bind(this), true);
    document.addEventListener('touchstart', this.handleGlobalTouch.bind(this), { passive: true });
    
    // Performance monitoring events
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pausePerformanceMonitoring();
      } else {
        this.resumePerformanceMonitoring();
      }
    });
    
    // Memory pressure handling
    if ('memory' in performance) {
      setInterval(() => {
        const memInfo = performance.memory;
        const memoryUsage = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
        
        if (memoryUsage > 0.8) {
          console.warn('⚠️ High memory usage detected:', (memoryUsage * 100).toFixed(1) + '%');
          this.handleMemoryPressure();
        }
      }, 30000); // Check every 30 seconds
    }
    
    // Window resize with virtualization updates
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (this.virtualListManager) {
          this.virtualListManager.handleResize?.();
        }
      }, 150);
    });
  }

  async initializeControllers() {
    // Load and initialize controllers with virtualization awareness
    const controllerPromises = Object.entries(CONTROLLER_MODULES).map(async ([name, loader]) => {
      try {
        const ControllerClass = await loader();
        if (ControllerClass) {
          const controller = new ControllerClass({
            virtualListManager: this.virtualListManager,
            performanceMonitor: this.performanceMonitor
          });
          this.controllers.set(name, controller);
          console.log(`✅ Controller initialized: ${name}`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to initialize controller ${name}:`, error);
      }
    });
    
    await Promise.allSettled(controllerPromises);
  }

  // Virtualization event handlers
  handleVirtualEventClick(event) {
    const { event: eventData, index } = event.detail;
    
    console.log('📱 Virtual event clicked:', eventData['Event Name'] || eventData.name);
    
    // Trigger haptic feedback on supported devices
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    // Dispatch to appropriate controller
    const eventController = this.controllers.get('events');
    if (eventController && eventController.handleEventClick) {
      eventController.handleEventClick(eventData, index);
    }
  }

  handleVirtualEventSwipe(event) {
    const { event: eventData, index, action } = event.detail;
    
    console.log('👆 Virtual event swiped:', {
      event: eventData['Event Name'] || eventData.name,
      action
    });
    
    // Trigger appropriate haptic feedback
    if ('vibrate' in navigator) {
      const vibrationPattern = action === 'like' ? [50, 50, 100] : [100];
      navigator.vibrate(vibrationPattern);
    }
    
    // Update user preferences based on swipe
    this.updateUserPreferences(eventData, action);
    
    // Trigger ML-based recommendations update
    this.updateRecommendations(eventData, action);
  }

  handleGlobalClick(event) {
    // Enhanced click handling with performance optimizations
    if (bindPressFeedback) {
      bindPressFeedback(event.target);
    }
    
    // Track click performance
    const clickTime = performance.now();
    requestAnimationFrame(() => {
      const renderTime = performance.now() - clickTime;
      if (renderTime > 16.67) {
        console.warn(`⚠️ Slow click response: ${renderTime.toFixed(2)}ms`);
      }
    });
  }

  handleGlobalTouch(event) {
    // Enhanced touch handling for better gesture recognition
    if (this.renderingOptimizations.gestureRecognitionEnabled) {
      // Implement gesture prediction for better responsiveness
      this.predictGesture(event);
    }
  }

  // Performance optimization methods
  optimizeVirtualizationPerformance() {
    if (!this.virtualListManager) return;
    
    console.log('🔧 Optimizing virtualization performance...');
    
    // Reduce overscan for better performance
    this.virtualListManager.virtualList.overscan = Math.max(2, 
      this.virtualListManager.virtualList.overscan - 1
    );
    
    // Disable non-essential animations
    document.body.classList.add('reduce-animations');
    
    // Clear some caches to free memory
    if (this.controllers.has('events')) {
      this.controllers.get('events').clearCache?.();
    }
  }

  handleMemoryPressure() {
    console.log('🧹 Handling memory pressure...');
    
    // Clear module cache for non-active controllers
    ModuleLoader.cache.forEach((value, key) => {
      if (!key.includes('active')) {
        ModuleLoader.cache.delete(key);
      }
    });
    
    // Trigger garbage collection hint
    if ('gc' in window && typeof window.gc === 'function') {
      window.gc();
    }
    
    // Clear virtual list cache
    if (this.virtualListManager) {
      this.virtualListManager.clearCache?.();
    }
  }

  pausePerformanceMonitoring() {
    if (this.performanceMonitor && this.performanceMonitor.pause) {
      this.performanceMonitor.pause();
    }
  }

  resumePerformanceMonitoring() {
    if (this.performanceMonitor && this.performanceMonitor.resume) {
      this.performanceMonitor.resume();
    }
  }

  predictGesture(touchEvent) {
    // Simple gesture prediction for better responsiveness
    const touch = touchEvent.touches[0];
    if (!touch) return;
    
    // Store for gesture analysis
    this.lastTouch = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: performance.now()
    };
  }

  updateUserPreferences(eventData, action) {
    // Update user preference model based on swipe actions
    const preferences = Store?.get('userPreferences') || {};
    const eventCategory = eventData.Category || eventData.category || 'unknown';
    
    if (!preferences.categories) preferences.categories = {};
    if (!preferences.categories[eventCategory]) {
      preferences.categories[eventCategory] = { likes: 0, passes: 0 };
    }
    
    if (action === 'like') {
      preferences.categories[eventCategory].likes++;
    } else if (action === 'pass') {
      preferences.categories[eventCategory].passes++;
    }
    
    Store?.set('userPreferences', preferences);
  }

  updateRecommendations(eventData, action) {
    // Trigger ML recommendation engine update
    if (api && api.post) {
      api.post('/api/recommendations/update', {
        event_id: eventData.id,
        action: action,
        timestamp: new Date().toISOString(),
        context: 'virtual_list_swipe'
      }).catch(error => {
        console.warn('Failed to update recommendations:', error);
      });
    }
  }

  reportPerformanceMetrics() {
    const performanceReport = {
      ...ModuleLoader.getPerformanceReport(),
      virtualization: {
        enabled: this.renderingOptimizations.virtualScrollEnabled,
        renderStats: this.virtualListManager?.getPerformanceStats?.() || null
      },
      fps: this.performanceMonitor?.getAverageFPS?.() || null,
      memoryUsage: performance.memory ? {
        used: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + 'MB',
        total: (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2) + 'MB',
        limit: (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2) + 'MB'
      } : null
    };
    
    console.log('📊 Performance Report:', performanceReport);
    
    // Send to analytics if available
    if (typeof gtag !== 'undefined') {
      gtag('event', 'performance_report', {
        custom_parameters: performanceReport
      });
    }
  }

  handleInitializationError(error) {
    console.error('❌ Platform initialization failed:', error);
    
    // Show user-friendly error message
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #1a1a1a;
      border: 1px solid #ff6b6b;
      border-radius: 8px;
      padding: 20px;
      color: #fff;
      text-align: center;
      z-index: 9999;
      max-width: 400px;
    `;
    
    errorDiv.innerHTML = `
      <h3 style="color: #ff6b6b; margin: 0 0 12px 0;">⚠️ Initialization Failed</h3>
      <p style="margin: 0 0 16px 0; color: #ccc;">
        The platform failed to initialize. Please refresh the page to try again.
      </p>
      <button onclick="location.reload()" style="
        background: #00ff88;
        color: #000;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
      ">Refresh Page</button>
    `;
    
    document.body.appendChild(errorDiv);
  }

  // Public API
  getController(name) {
    return this.controllers.get(name);
  }

  getPerformanceStats() {
    return {
      ...ModuleLoader.getPerformanceReport(),
      fps: this.performanceMonitor?.getStats?.(),
      virtualList: this.virtualListManager?.getPerformanceStats?.(),
      isInitialized: this.isInitialized
    };
  }

  async refreshEvents() {
    if (this.virtualListManager) {
      await this.virtualListManager.refreshEvents();
    }
  }
}

// Initialize platform
const platform = new ProfessionalIntelligencePlatform();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    platform.initialize();
  });
} else {
  platform.initialize();
}

// Make platform globally accessible
window.platform = platform;
window.ProfessionalIntelligencePlatform = ProfessionalIntelligencePlatform;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProfessionalIntelligencePlatform;
}

console.log('🚀 Professional Intelligence Platform with Virtualization loaded!');