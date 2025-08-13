/**
 * Performance Optimization Hub - Optimization #5
 * Central module that coordinates all optimizations
 * Provides monitoring and automatic optimization
 */

import domCache, { $, $$, batchDOM } from './dom-cache.js?v=b022';
import eventDelegate, { on, off, throttle, debounce } from './event-delegate.js?v=b022';
import lazyLoader, { lazyLoad, loadOnIdle, loadOnVisible } from './lazy-load.js?v=b022';
import requestCache, { cachedFetch, batchFetch, prefetch } from './request-cache.js?v=b022';

class PerformanceOptimizer {
  constructor() {
    this.metrics = {
      domQueries: 0,
      cachedQueries: 0,
      apiCalls: 0,
      cachedApiCalls: 0,
      eventListeners: 0,
      lazyLoaded: 0
    };
    
    this.initialized = false;
    this.observers = new Set();
  }

  /**
   * Initialize all optimizations
   */
  init() {
    if (this.initialized) return;
    
    this.initialized = true;
    
    // Setup performance monitoring
    this.monitorPerformance();
    
    // Setup lazy loading for heavy modules
    this.setupLazyLoading();
    
    // Setup request prefetching
    this.setupPrefetching();
    
    // Optimize images
    this.optimizeImages();
    
    // Clean up unused code periodically
    this.scheduleCleanup();
    
    console.log('⚡ Performance optimizations initialized');
  }

  /**
   * Monitor performance metrics
   * @private
   */
  monitorPerformance() {
    // Track DOM query efficiency
    const originalQuerySelector = document.querySelector;
    document.querySelector = (selector) => {
      this.metrics.domQueries++;
      const cached = $.call(null, selector);
      if (cached) this.metrics.cachedQueries++;
      return cached || originalQuerySelector.call(document, selector);
    };

    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memoryInfo = performance.memory;
        const usedMemory = memoryInfo.usedJSHeapSize / 1048576; // MB
        const totalMemory = memoryInfo.totalJSHeapSize / 1048576; // MB
        
        if (usedMemory > totalMemory * 0.9) {
          this.performCleanup();
        }
      }, 30000); // Check every 30 seconds
    }

    // Monitor FPS
    let lastTime = performance.now();
    let frames = 0;
    
    const checkFPS = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frames * 1000) / (currentTime - lastTime));
        
        if (fps < 30) {
          this.reduceQuality();
        }
        
        frames = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(checkFPS);
    };
    
    requestAnimationFrame(checkFPS);
  }

  /**
   * Setup lazy loading for heavy modules
   * @private
   */
  setupLazyLoading() {
    // Load analytics on idle
    loadOnIdle('analytics', 3000);
    
    // Load maps when map container visible
    loadOnVisible('#map-container', 'maps');
    
    // Load calendar on calendar button click
    on('click', '[data-action="open-calendar"]', () => {
      lazyLoad('calendar');
    });
    
    // Load monitoring dashboard on demand
    on('click', '[data-action="open-monitoring"]', () => {
      lazyLoad('monitoring');
    });
  }

  /**
   * Setup request prefetching
   * @private
   */
  setupPrefetching() {
    // Prefetch common API endpoints
    const commonEndpoints = [
      '/api/health',
      '/api/parties',
      '/api/events'
    ];
    
    // Prefetch after page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        prefetch(commonEndpoints);
      }, 2000);
    });
  }

  /**
   * Optimize images with lazy loading
   * @private
   */
  optimizeImages() {
    const images = $$('img[data-src]');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px'
      });
      
      images.forEach(img => imageObserver.observe(img));
      this.observers.add(imageObserver);
    } else {
      // Fallback for older browsers
      images.forEach(img => {
        img.src = img.dataset.src;
      });
    }
  }

  /**
   * Reduce quality for low performance
   * @private
   */
  reduceQuality() {
    // Disable animations
    document.body.classList.add('reduce-motion');
    
    // Reduce image quality
    $$('img').forEach(img => {
      if (img.src && img.src.includes('?')) {
        img.src = img.src + '&q=60';
      }
    });
    
    // Throttle scroll handlers more aggressively
    window.scrollHandlerDelay = 100;
  }

  /**
   * Perform cleanup operations
   * @private
   */
  performCleanup() {
    // Clear DOM cache
    domCache.clear();
    
    // Clear old request cache entries
    const stats = requestCache.getStats();
    if (stats.expired > 0) {
      requestCache.clear();
    }
    
    // Remove detached event listeners
    eventDelegate.clear();
    
    // Disconnect unused observers
    this.observers.forEach(observer => {
      if (observer.takeRecords().length === 0) {
        observer.disconnect();
        this.observers.delete(observer);
      }
    });
    
    console.log('🧹 Performance cleanup completed');
  }

  /**
   * Schedule periodic cleanup
   * @private
   */
  scheduleCleanup() {
    // Run cleanup every 5 minutes
    setInterval(() => {
      this.performCleanup();
    }, 5 * 60 * 1000);
    
    // Also cleanup on page hide
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.performCleanup();
      }
    });
  }

  /**
   * Get performance report
   * @returns {Object}
   */
  getReport() {
    const cacheStats = requestCache.getStats();
    
    return {
      dom: {
        totalQueries: this.metrics.domQueries,
        cachedQueries: this.metrics.cachedQueries,
        cacheHitRate: this.metrics.domQueries > 0 
          ? (this.metrics.cachedQueries / this.metrics.domQueries * 100).toFixed(2) + '%'
          : '0%'
      },
      api: {
        totalCalls: this.metrics.apiCalls,
        cachedCalls: this.metrics.cachedApiCalls,
        cacheStats
      },
      events: {
        listeners: this.metrics.eventListeners,
        delegated: eventDelegate.handlers.size
      },
      modules: {
        lazyLoaded: this.metrics.lazyLoaded
      },
      memory: 'memory' in performance ? {
        used: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
        total: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
        limit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
      } : 'Not available'
    };
  }
}

// Create singleton instance
const optimizer = new PerformanceOptimizer();

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => optimizer.init());
} else {
  optimizer.init();
}

// Export optimized utilities
export {
  // DOM utilities
  $,
  $$,
  batchDOM,
  
  // Event utilities
  on,
  off,
  throttle,
  debounce,
  
  // Lazy loading
  lazyLoad,
  loadOnIdle,
  loadOnVisible,
  
  // Request utilities
  cachedFetch,
  batchFetch,
  prefetch,
  
  // Performance monitoring
  optimizer
};

// Add global performance helper
window.performanceReport = () => {
  console.table(optimizer.getReport());
  return optimizer.getReport();
};

export default optimizer;