/**
 * Performance Monitoring System
 * Tracks Core Web Vitals and application performance metrics
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.thresholds = {
      lcp: 2500,      // Largest Contentful Paint (ms)
      fid: 100,       // First Input Delay (ms)
      cls: 0.1,       // Cumulative Layout Shift
      fcp: 1800,      // First Contentful Paint (ms)
      ttfb: 800,      // Time to First Byte (ms)
      tti: 3800,      // Time to Interactive (ms)
      bundleSize: 500000,  // Bundle size (bytes)
      apiResponse: 1000,   // API response time (ms)
      renderTime: 16       // Frame render time (ms) - 60fps
    };
    
    this.initialize();
  }
  
  /**
   * Initialize performance monitoring
   */
  initialize() {
    // Start monitoring when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.startMonitoring());
    } else {
      this.startMonitoring();
    }
    
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseMonitoring();
      } else {
        this.resumeMonitoring();
      }
    });
    
    // Monitor unload for final metrics
    window.addEventListener('beforeunload', () => {
      this.sendMetrics();
    });
  }
  
  /**
   * Start all performance monitoring
   */
  startMonitoring() {
    this.measureCoreWebVitals();
    this.trackBundleSize();
    this.monitorMemoryUsage();
    this.trackNavigationTiming();
    this.monitorAPIPerformance();
    this.trackRenderPerformance();
    
    console.log('[Performance] Monitoring started');
  }
  
  /**
   * Measure Core Web Vitals
   */
  measureCoreWebVitals() {
    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      this.trackMetric('lcp', lastEntry.startTime);
      
      // Alert if LCP is poor
      if (lastEntry.startTime > this.thresholds.lcp) {
        this.reportPerformanceIssue('lcp', lastEntry.startTime, this.thresholds.lcp);
      }
    });
    
    try {
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.set('lcp', lcpObserver);
    } catch (e) {
      console.debug('[Performance] LCP observer not supported');
    }
    
    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        const fid = entry.processingStart - entry.startTime;
        this.trackMetric('fid', fid);
        
        if (fid > this.thresholds.fid) {
          this.reportPerformanceIssue('fid', fid, this.thresholds.fid);
        }
      }
    });
    
    try {
      fidObserver.observe({ type: 'first-input', buffered: true });
      this.observers.set('fid', fidObserver);
    } catch (e) {
      console.debug('[Performance] FID observer not supported');
    }
    
    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    let clsEntries = [];
    
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          clsEntries.push(entry);
        }
      }
      
      this.trackMetric('cls', clsValue);
      
      if (clsValue > this.thresholds.cls) {
        this.reportPerformanceIssue('cls', clsValue, this.thresholds.cls);
      }
    });
    
    try {
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      this.observers.set('cls', clsObserver);
    } catch (e) {
      console.debug('[Performance] CLS observer not supported');
    }
    
    // First Contentful Paint (FCP)
    const paintObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.trackMetric('fcp', entry.startTime);
          
          if (entry.startTime > this.thresholds.fcp) {
            this.reportPerformanceIssue('fcp', entry.startTime, this.thresholds.fcp);
          }
        }
      }
    });
    
    try {
      paintObserver.observe({ type: 'paint', buffered: true });
      this.observers.set('paint', paintObserver);
    } catch (e) {
      console.debug('[Performance] Paint observer not supported');
    }
  }
  
  /**
   * Track navigation timing metrics
   */
  trackNavigationTiming() {
    if (!('performance' in window) || !('timing' in performance)) return;
    
    const timing = performance.timing;
    
    // Time to First Byte
    const ttfb = timing.responseStart - timing.navigationStart;
    this.trackMetric('ttfb', ttfb);
    
    // DOM Content Loaded
    const dcl = timing.domContentLoadedEventEnd - timing.navigationStart;
    this.trackMetric('dcl', dcl);
    
    // Page Load Time
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    this.trackMetric('page_load', loadTime);
    
    // Time to Interactive (simplified)
    const tti = timing.domInteractive - timing.navigationStart;
    this.trackMetric('tti', tti);
    
    if (ttfb > this.thresholds.ttfb) {
      this.reportPerformanceIssue('ttfb', ttfb, this.thresholds.ttfb);
    }
    
    if (tti > this.thresholds.tti) {
      this.reportPerformanceIssue('tti', tti, this.thresholds.tti);
    }
  }
  
  /**
   * Track bundle and resource sizes
   */
  trackBundleSize() {
    if (!('performance' in window)) return;
    
    const resources = performance.getEntriesByType('resource');
    let totalJS = 0;
    let totalCSS = 0;
    let totalImages = 0;
    let totalSize = 0;
    
    resources.forEach(resource => {
      const size = resource.transferSize || 0;
      totalSize += size;
      
      if (resource.name.includes('.js')) {
        totalJS += size;
      } else if (resource.name.includes('.css')) {
        totalCSS += size;
      } else if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg)/)) {
        totalImages += size;
      }
    });
    
    this.trackMetric('bundle_total', totalSize);
    this.trackMetric('bundle_js', totalJS);
    this.trackMetric('bundle_css', totalCSS);
    this.trackMetric('bundle_images', totalImages);
    this.trackMetric('resource_count', resources.length);
    
    if (totalSize > this.thresholds.bundleSize) {
      this.reportPerformanceIssue('bundle_size', totalSize, this.thresholds.bundleSize);
    }
    
    // Track largest resources
    const largeResources = resources
      .filter(r => r.transferSize > 100000) // Resources > 100KB
      .sort((a, b) => b.transferSize - a.transferSize)
      .slice(0, 5);
    
    if (largeResources.length > 0) {
      console.log('[Performance] Large resources detected:', 
        largeResources.map(r => ({
          url: r.name.split('/').pop(),
          size: `${(r.transferSize / 1024).toFixed(2)}KB`,
          duration: `${r.duration.toFixed(2)}ms`
        }))
      );
    }
  }
  
  /**
   * Monitor memory usage
   */
  monitorMemoryUsage() {
    if (!performance.memory) return;
    
    const checkMemory = () => {
      const memInfo = performance.memory;
      
      this.trackMetric('memory_used', memInfo.usedJSHeapSize);
      this.trackMetric('memory_total', memInfo.totalJSHeapSize);
      this.trackMetric('memory_limit', memInfo.jsHeapSizeLimit);
      
      const usagePercent = (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100;
      
      // Alert if memory usage is high
      if (usagePercent > 90) {
        console.warn('[Performance] High memory usage:', `${usagePercent.toFixed(2)}%`);
        this.reportPerformanceIssue('memory', usagePercent, 90);
      }
    };
    
    // Check memory every 30 seconds
    setInterval(checkMemory, 30000);
    checkMemory(); // Initial check
  }
  
  /**
   * Monitor API performance
   */
  monitorAPIPerformance() {
    // Intercept fetch requests
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0]?.toString() || 'unknown';
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.trackAPICall(url, duration, response.status);
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.trackAPICall(url, duration, 0);
        throw error;
      }
    };
  }
  
  /**
   * Track individual API call performance
   */
  trackAPICall(url, duration, status) {
    // Extract endpoint from URL
    const endpoint = this.extractEndpoint(url);
    
    // Track metrics
    this.trackMetric(`api_${endpoint}_duration`, duration);
    this.trackMetric(`api_${endpoint}_status`, status);
    
    // Update average response time
    const key = `api_${endpoint}_avg`;
    const current = this.metrics.get(key) || { total: 0, count: 0 };
    current.total += duration;
    current.count++;
    
    const average = current.total / current.count;
    this.metrics.set(key, current);
    
    // Alert for slow API calls
    if (duration > this.thresholds.apiResponse) {
      this.reportPerformanceIssue('api_slow', duration, this.thresholds.apiResponse, {
        endpoint,
        status
      });
    }
    
    // Alert for failed API calls
    if (status >= 500) {
      this.reportPerformanceIssue('api_error', status, 500, {
        endpoint,
        duration
      });
    }
  }
  
  /**
   * Track render performance
   */
  trackRenderPerformance() {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFrame = () => {
      const currentTime = performance.now();
      const frameDuration = currentTime - lastTime;
      
      // Track if frame took too long (janky)
      if (frameDuration > this.thresholds.renderTime) {
        this.trackMetric('janky_frames', 
          (this.metrics.get('janky_frames') || 0) + 1
        );
      }
      
      frameCount++;
      
      // Calculate FPS every second
      if (frameCount % 60 === 0) {
        const fps = 1000 / (frameDuration / 60);
        this.trackMetric('fps', fps);
        
        if (fps < 30) {
          this.reportPerformanceIssue('low_fps', fps, 30);
        }
      }
      
      lastTime = currentTime;
      requestAnimationFrame(measureFrame);
    };
    
    requestAnimationFrame(measureFrame);
  }
  
  /**
   * Measure feature performance
   */
  async measureFeaturePerformance(feature, fn) {
    const startTime = performance.now();
    const startMemory = performance.memory?.usedJSHeapSize;
    
    try {
      const result = await fn();
      
      const endTime = performance.now();
      const endMemory = performance.memory?.usedJSHeapSize;
      
      const duration = endTime - startTime;
      const memoryUsed = endMemory - startMemory;
      
      this.trackMetric(`feature_${feature}_duration`, duration);
      this.trackMetric(`feature_${feature}_memory`, memoryUsed);
      
      // Log slow features
      if (duration > 1000) {
        console.warn(`[Performance] Slow feature: ${feature} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.trackMetric(`feature_${feature}_error`, 1);
      this.trackMetric(`feature_${feature}_duration`, duration);
      
      throw error;
    }
  }
  
  /**
   * Track a performance metric
   */
  trackMetric(name, value) {
    this.metrics.set(name, value);
    
    // Send to analytics (if available)
    if (typeof gtag !== 'undefined') {
      gtag('event', 'performance_metric', {
        metric_name: name,
        metric_value: Math.round(value),
        app_version: window.__VERSION__ || 'unknown'
      });
    }
    
    // Store in localStorage for persistence
    const stored = JSON.parse(localStorage.getItem('performance_metrics') || '{}');
    stored[name] = {
      value,
      timestamp: Date.now()
    };
    
    // Keep only last 100 metrics
    const keys = Object.keys(stored);
    if (keys.length > 100) {
      const oldestKey = keys.sort((a, b) => 
        stored[a].timestamp - stored[b].timestamp
      )[0];
      delete stored[oldestKey];
    }
    
    localStorage.setItem('performance_metrics', JSON.stringify(stored));
  }
  
  /**
   * Report performance issue
   */
  reportPerformanceIssue(type, value, threshold, context = {}) {
    const issue = {
      type,
      value,
      threshold,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...context
    };
    
    console.warn('[Performance Issue]', issue);
    
    // Send to error tracking
    if (window.Sentry) {
      window.Sentry.captureMessage('Performance Issue', {
        level: 'warning',
        extra: issue
      });
    }
    
    // Store locally for analysis
    const issues = JSON.parse(localStorage.getItem('performance_issues') || '[]');
    issues.push(issue);
    
    // Keep only last 50 issues
    if (issues.length > 50) {
      issues.shift();
    }
    
    localStorage.setItem('performance_issues', JSON.stringify(issues));
  }
  
  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const summary = {
      coreWebVitals: {
        lcp: this.metrics.get('lcp'),
        fid: this.metrics.get('fid'),
        cls: this.metrics.get('cls'),
        fcp: this.metrics.get('fcp')
      },
      timing: {
        ttfb: this.metrics.get('ttfb'),
        tti: this.metrics.get('tti'),
        pageLoad: this.metrics.get('page_load')
      },
      resources: {
        totalSize: this.metrics.get('bundle_total'),
        jsSize: this.metrics.get('bundle_js'),
        cssSize: this.metrics.get('bundle_css'),
        imageSize: this.metrics.get('bundle_images'),
        count: this.metrics.get('resource_count')
      },
      memory: {
        used: this.metrics.get('memory_used'),
        total: this.metrics.get('memory_total'),
        limit: this.metrics.get('memory_limit')
      },
      rendering: {
        fps: this.metrics.get('fps'),
        jankyFrames: this.metrics.get('janky_frames') || 0
      },
      score: this.calculatePerformanceScore()
    };
    
    return summary;
  }
  
  /**
   * Calculate overall performance score (0-100)
   */
  calculatePerformanceScore() {
    let score = 100;
    
    // Deduct points for poor metrics
    const lcp = this.metrics.get('lcp');
    if (lcp > 4000) score -= 30;
    else if (lcp > 2500) score -= 15;
    
    const fid = this.metrics.get('fid');
    if (fid > 300) score -= 20;
    else if (fid > 100) score -= 10;
    
    const cls = this.metrics.get('cls');
    if (cls > 0.25) score -= 20;
    else if (cls > 0.1) score -= 10;
    
    const bundleSize = this.metrics.get('bundle_total');
    if (bundleSize > 1000000) score -= 15;
    else if (bundleSize > 500000) score -= 7;
    
    const jankyFrames = this.metrics.get('janky_frames') || 0;
    if (jankyFrames > 100) score -= 10;
    else if (jankyFrames > 50) score -= 5;
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Send metrics to analytics
   */
  sendMetrics() {
    const summary = this.getPerformanceSummary();
    
    // Send to analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'performance_summary', {
        score: summary.score,
        lcp: Math.round(summary.coreWebVitals.lcp || 0),
        fid: Math.round(summary.coreWebVitals.fid || 0),
        cls: (summary.coreWebVitals.cls || 0).toFixed(3)
      });
    }
    
    console.log('[Performance] Summary:', summary);
  }
  
  /**
   * Helper: Extract endpoint from URL
   */
  extractEndpoint(url) {
    try {
      const urlObj = new URL(url, window.location.origin);
      return urlObj.pathname.split('/').filter(Boolean).slice(-2).join('_') || 'root';
    } catch {
      return 'unknown';
    }
  }
  
  /**
   * Pause monitoring (when page is hidden)
   */
  pauseMonitoring() {
    // Pause observers
    this.observers.forEach(observer => observer.disconnect());
  }
  
  /**
   * Resume monitoring (when page is visible)
   */
  resumeMonitoring() {
    // Restart Core Web Vitals monitoring
    this.measureCoreWebVitals();
  }
  
  /**
   * Clean up monitoring
   */
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.metrics.clear();
  }
}

// Create singleton instance
window.PerformanceMonitor = new PerformanceMonitor();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceMonitor;
}