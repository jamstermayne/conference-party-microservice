/**
 * Bundle Optimization and Code Splitting Utilities
 * Implements lazy loading, dynamic imports, and resource optimization
 */

class BundleOptimizer {
  constructor() {
    this.loadedModules = new Set();
    this.moduleCache = new Map();
    this.preloadQueue = [];
    this.intersectionObserver = null;
    this.resourceHints = new Map();
    
    this.initialize();
  }
  
  /**
   * Initialize optimization strategies
   */
  initialize() {
    // Set up intersection observer for lazy loading
    this.setupIntersectionObserver();
    
    // Preload critical resources
    this.preloadCriticalResources();
    
    // Set up idle time preloading
    this.setupIdlePreloading();
    
    // Optimize images
    this.optimizeImages();
    
    // Set up route-based code splitting
    this.setupRoutePrefetching();
  }
  
  /**
   * Lazy load modules on demand
   */
  async lazyLoadModule(modulePath, options = {}) {
    // Check if already loaded
    if (this.loadedModules.has(modulePath)) {
      return this.moduleCache.get(modulePath);
    }
    
    // Check if loading
    if (this.moduleCache.has(modulePath)) {
      return this.moduleCache.get(modulePath);
    }
    
    // Track loading start
    const startTime = performance.now();
    
    // Create loading promise
    const loadPromise = this.loadModuleWithRetry(modulePath, options);
    this.moduleCache.set(modulePath, loadPromise);
    
    try {
      const module = await loadPromise;
      
      // Track loading complete
      const loadTime = performance.now() - startTime;
      this.trackModuleLoad(modulePath, loadTime);
      
      // Mark as loaded
      this.loadedModules.add(modulePath);
      
      return module;
    } catch (error) {
      // Remove from cache on error
      this.moduleCache.delete(modulePath);
      throw error;
    }
  }
  
  /**
   * Load module with retry logic
   */
  async loadModuleWithRetry(modulePath, options = {}, retries = 3) {
    const { 
      timeout = 10000,
      fallback = null,
      onProgress = null 
    } = options;
    
    for (let i = 0; i < retries; i++) {
      try {
        // Create timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Module load timeout')), timeout);
        });
        
        // Dynamic import with timeout
        const module = await Promise.race([
          import(modulePath),
          timeoutPromise
        ]);
        
        return module;
      } catch (error) {
        console.warn(`[Optimizer] Failed to load ${modulePath}, attempt ${i + 1}/${retries}`);
        
        if (i === retries - 1) {
          // Final attempt failed
          if (fallback) {
            console.log(`[Optimizer] Using fallback for ${modulePath}`);
            return fallback;
          }
          throw error;
        }
        
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }
  
  /**
   * Preload modules during idle time
   */
  setupIdlePreloading() {
    if (!('requestIdleCallback' in window)) {
      // Fallback for browsers without idle callback
      setTimeout(() => this.preloadNextModule(), 1000);
      return;
    }
    
    const preloadDuringIdle = (deadline) => {
      while (deadline.timeRemaining() > 50 && this.preloadQueue.length > 0) {
        const modulePath = this.preloadQueue.shift();
        this.preloadModule(modulePath);
      }
      
      if (this.preloadQueue.length > 0) {
        requestIdleCallback(preloadDuringIdle);
      }
    };
    
    requestIdleCallback(preloadDuringIdle);
  }
  
  /**
   * Preload a module without executing
   */
  async preloadModule(modulePath) {
    if (this.loadedModules.has(modulePath)) return;
    
    try {
      // Use link preload for modules
      const link = document.createElement('link');
      link.rel = 'modulepreload';
      link.href = modulePath;
      document.head.appendChild(link);
      
      console.log(`[Optimizer] Preloaded ${modulePath}`);
    } catch (error) {
      console.debug(`[Optimizer] Failed to preload ${modulePath}:`, error);
    }
  }
  
  /**
   * Set up intersection observer for lazy loading
   */
  setupIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: '50px',
      threshold: 0.01
    };
    
    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          
          // Lazy load images
          if (element.tagName === 'IMG' && element.dataset.src) {
            this.lazyLoadImage(element);
          }
          
          // Lazy load components
          if (element.dataset.component) {
            this.lazyLoadComponent(element);
          }
          
          // Stop observing once loaded
          this.intersectionObserver.unobserve(element);
        }
      });
    }, options);
    
    // Start observing lazy elements
    this.observeLazyElements();
  }
  
  /**
   * Observe elements for lazy loading
   */
  observeLazyElements() {
    // Lazy images
    document.querySelectorAll('img[data-src]').forEach(img => {
      this.intersectionObserver.observe(img);
    });
    
    // Lazy components
    document.querySelectorAll('[data-component]').forEach(element => {
      this.intersectionObserver.observe(element);
    });
  }
  
  /**
   * Lazy load image
   */
  lazyLoadImage(img) {
    const src = img.dataset.src;
    const srcset = img.dataset.srcset;
    
    // Create new image to preload
    const tempImg = new Image();
    
    tempImg.onload = () => {
      // Add fade-in animation
      img.style.opacity = '0';
      img.src = src;
      if (srcset) img.srcset = srcset;
      
      requestAnimationFrame(() => {
        img.style.transition = 'opacity 0.3s';
        img.style.opacity = '1';
      });
      
      // Clean up data attributes
      delete img.dataset.src;
      delete img.dataset.srcset;
    };
    
    tempImg.onerror = () => {
      console.error(`[Optimizer] Failed to load image: ${src}`);
      // Use fallback image
      img.src = '/images/placeholder.png';
    };
    
    tempImg.src = src;
  }
  
  /**
   * Lazy load component
   */
  async lazyLoadComponent(element) {
    const componentName = element.dataset.component;
    const props = JSON.parse(element.dataset.props || '{}');
    
    try {
      // Load component module
      const module = await this.lazyLoadModule(
        `/modern/components/${componentName}.js`
      );
      
      // Initialize component
      if (module.default) {
        const Component = module.default;
        new Component(element, props);
      }
      
      // Remove loading state
      element.classList.remove('loading');
    } catch (error) {
      console.error(`[Optimizer] Failed to load component ${componentName}:`, error);
      element.innerHTML = '<div class="error">Failed to load component</div>';
    }
  }
  
  /**
   * Optimize images for performance
   */
  optimizeImages() {
    // Convert images to WebP if supported
    if (this.supportsWebP()) {
      document.querySelectorAll('img[src$=".jpg"], img[src$=".png"]').forEach(img => {
        const webpSrc = img.src.replace(/\.(jpg|png)$/, '.webp');
        
        // Check if WebP version exists
        fetch(webpSrc, { method: 'HEAD' })
          .then(response => {
            if (response.ok) {
              img.src = webpSrc;
            }
          })
          .catch(() => {
            // WebP version doesn't exist, keep original
          });
      });
    }
    
    // Add loading="lazy" to images below the fold
    document.querySelectorAll('img').forEach(img => {
      const rect = img.getBoundingClientRect();
      if (rect.top > window.innerHeight) {
        img.loading = 'lazy';
      }
    });
  }
  
  /**
   * Check WebP support
   */
  supportsWebP() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('image/webp') === 5;
  }
  
  /**
   * Preload critical resources
   */
  preloadCriticalResources() {
    const criticalResources = [
      { url: '/assets/css/tokens.css', as: 'style' },
      { url: '/assets/js/app-unified.js', as: 'script' },
      { url: '/assets/fonts/inter-var.woff2', as: 'font', type: 'font/woff2', crossorigin: true }
    ];
    
    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.url;
      link.as = resource.as;
      
      if (resource.type) link.type = resource.type;
      if (resource.crossorigin) link.crossOrigin = 'anonymous';
      
      document.head.appendChild(link);
    });
  }
  
  /**
   * Set up route-based prefetching
   */
  setupRoutePrefetching() {
    // Prefetch resources for likely next routes
    const routePrefetchMap = {
      '/': ['/matches.html', '/gatherings.html'],
      '/matches.html': ['/test-chat.html', '/modern/components/matchmaking-ui.js'],
      '/gatherings.html': ['/modern/gatherings/gathering-engine.js'],
      '/test-chat.html': ['/modern/chat/real-time-chat.js']
    };
    
    const currentPath = window.location.pathname;
    const prefetchRoutes = routePrefetchMap[currentPath] || [];
    
    // Prefetch on hover/focus
    document.querySelectorAll('a').forEach(link => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http')) return;
      
      const prefetchLink = () => {
        if (!this.resourceHints.has(href)) {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = href;
          document.head.appendChild(link);
          this.resourceHints.set(href, true);
        }
      };
      
      link.addEventListener('mouseenter', prefetchLink, { once: true });
      link.addEventListener('focus', prefetchLink, { once: true });
    });
    
    // Prefetch likely next routes
    prefetchRoutes.forEach(route => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      document.head.appendChild(link);
    });
  }
  
  /**
   * Split code by route
   */
  async loadRouteBundle(route) {
    const routeBundles = {
      'matches': () => import('/modern/matching/compatibility-engine.js'),
      'gatherings': () => import('/modern/gatherings/gathering-engine.js'),
      'chat': () => import('/modern/chat/real-time-chat.js'),
      'profile': () => import('/modern/auth/profile-manager.js')
    };
    
    const loader = routeBundles[route];
    if (!loader) {
      throw new Error(`No bundle defined for route: ${route}`);
    }
    
    return await this.lazyLoadModule(loader);
  }
  
  /**
   * Implement virtual scrolling for large lists
   */
  createVirtualScroller(container, items, renderItem, itemHeight = 80) {
    const scrollerHeight = container.clientHeight;
    const totalHeight = items.length * itemHeight;
    const visibleItems = Math.ceil(scrollerHeight / itemHeight);
    const bufferItems = 5;
    
    // Create viewport and content elements
    const viewport = document.createElement('div');
    viewport.style.height = '100%';
    viewport.style.overflow = 'auto';
    
    const content = document.createElement('div');
    content.style.height = `${totalHeight}px`;
    content.style.position = 'relative';
    
    viewport.appendChild(content);
    container.appendChild(viewport);
    
    let startIndex = 0;
    let endIndex = visibleItems + bufferItems;
    
    const updateVisibleItems = () => {
      const scrollTop = viewport.scrollTop;
      startIndex = Math.floor(scrollTop / itemHeight);
      endIndex = startIndex + visibleItems + bufferItems * 2;
      
      // Clear content
      content.innerHTML = '';
      
      // Render visible items
      for (let i = startIndex; i < Math.min(endIndex, items.length); i++) {
        const itemElement = renderItem(items[i], i);
        itemElement.style.position = 'absolute';
        itemElement.style.top = `${i * itemHeight}px`;
        itemElement.style.height = `${itemHeight}px`;
        content.appendChild(itemElement);
      }
    };
    
    // Debounced scroll handler
    let scrollTimeout;
    viewport.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(updateVisibleItems, 16);
    });
    
    // Initial render
    updateVisibleItems();
    
    return {
      update: (newItems) => {
        items = newItems;
        totalHeight = items.length * itemHeight;
        content.style.height = `${totalHeight}px`;
        updateVisibleItems();
      },
      destroy: () => {
        viewport.remove();
      }
    };
  }
  
  /**
   * Track module load performance
   */
  trackModuleLoad(modulePath, loadTime) {
    console.log(`[Optimizer] Module loaded: ${modulePath} in ${loadTime.toFixed(2)}ms`);
    
    // Track in performance monitor
    if (window.PerformanceMonitor) {
      window.PerformanceMonitor.trackMetric(`module_load_${modulePath}`, loadTime);
    }
  }
  
  /**
   * Generate bundle analysis report
   */
  getBundleAnalysis() {
    const resources = performance.getEntriesByType('resource');
    
    const analysis = {
      totalResources: resources.length,
      totalSize: 0,
      byType: {},
      largest: [],
      slowest: [],
      cached: 0,
      notCached: 0
    };
    
    resources.forEach(resource => {
      const size = resource.transferSize || 0;
      const duration = resource.duration || 0;
      const type = this.getResourceType(resource.name);
      
      analysis.totalSize += size;
      
      // Group by type
      if (!analysis.byType[type]) {
        analysis.byType[type] = { count: 0, size: 0, avgDuration: 0 };
      }
      
      analysis.byType[type].count++;
      analysis.byType[type].size += size;
      analysis.byType[type].avgDuration += duration;
      
      // Track cache hits
      if (size === 0 && resource.encodedBodySize > 0) {
        analysis.cached++;
      } else {
        analysis.notCached++;
      }
    });
    
    // Calculate averages
    Object.keys(analysis.byType).forEach(type => {
      const typeData = analysis.byType[type];
      typeData.avgDuration = typeData.avgDuration / typeData.count;
    });
    
    // Find largest resources
    analysis.largest = resources
      .sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0))
      .slice(0, 10)
      .map(r => ({
        url: r.name.split('/').pop(),
        size: r.transferSize || 0,
        duration: r.duration || 0
      }));
    
    // Find slowest resources
    analysis.slowest = resources
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10)
      .map(r => ({
        url: r.name.split('/').pop(),
        duration: r.duration || 0,
        size: r.transferSize || 0
      }));
    
    // Calculate cache hit rate
    analysis.cacheHitRate = (analysis.cached / analysis.totalResources) * 100;
    
    return analysis;
  }
  
  /**
   * Get resource type from URL
   */
  getResourceType(url) {
    if (url.match(/\.(js|mjs)$/)) return 'javascript';
    if (url.match(/\.css$/)) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|otf)$/)) return 'font';
    if (url.match(/\.json$/)) return 'json';
    return 'other';
  }
  
  /**
   * Clean up optimizer
   */
  destroy() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    
    this.loadedModules.clear();
    this.moduleCache.clear();
    this.resourceHints.clear();
  }
}

// Create singleton instance
window.BundleOptimizer = new BundleOptimizer();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BundleOptimizer;
}