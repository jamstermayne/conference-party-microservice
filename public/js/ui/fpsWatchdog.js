/**
 * FPS WATCHDOG COMPONENT
 * Monitors performance and frame rate for optimization
 */

export const fpsWatchdog = {
  // Performance tracking
  isActive: false,
  frameCount: 0,
  lastTime: 0,
  fps: 60,
  avgFps: 60,
  minFps: 60,
  maxFps: 60,
  
  // Performance metrics
  metrics: {
    renderTime: [],
    memoryUsage: [],
    eventLoopDelay: [],
    domNodeCount: 0,
    listenerCount: 0
  },
  
  // Thresholds
  thresholds: {
    lowFps: 30,
    criticalFps: 15,
    highMemory: 50 * 1024 * 1024, // 50MB
    maxRenderTime: 16.67 // 60fps = 16.67ms per frame
  },
  
  // Callbacks
  callbacks: {
    onFpsWarning: null,
    onPerformanceAlert: null,
    onOptimizationSuggestion: null
  },
  
  /**
   * Start monitoring
   */
  start(options = {}) {
    if (this.isActive) return;
    
    this.isActive = true;
    this.thresholds = { ...this.thresholds, ...options.thresholds };
    this.callbacks = { ...this.callbacks, ...options.callbacks };
    
    this.lastTime = performance.now();
    this.startFrameMonitoring();
    this.startMemoryMonitoring();
    this.startDOMMonitoring();
    
    console.log('🎯 FPS Watchdog started');
  },
  
  /**
   * Stop monitoring
   */
  stop() {
    this.isActive = false;
    
    if (this.frameRequest) {
      cancelAnimationFrame(this.frameRequest);
      this.frameRequest = null;
    }
    
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
      this.memoryInterval = null;
    }
    
    if (this.domInterval) {
      clearInterval(this.domInterval);
      this.domInterval = null;
    }
    
    console.log('🎯 FPS Watchdog stopped');
  },
  
  /**
   * Start frame rate monitoring
   */
  startFrameMonitoring() {
    const measureFrame = (currentTime) => {
      if (!this.isActive) return;
      
      const deltaTime = currentTime - this.lastTime;
      this.frameCount++;
      
      // Calculate FPS every second
      if (deltaTime >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / deltaTime);
        this.updateFpsStats();
        
        // Check for performance issues
        this.checkFpsThresholds();
        
        this.frameCount = 0;
        this.lastTime = currentTime;
      }
      
      this.frameRequest = requestAnimationFrame(measureFrame);
    };
    
    this.frameRequest = requestAnimationFrame(measureFrame);
  },
  
  /**
   * Start memory monitoring
   */
  startMemoryMonitoring() {
    if (!performance.memory) return;
    
    this.memoryInterval = setInterval(() => {
      if (!this.isActive) return;
      
      const memory = performance.memory;
      const usage = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        timestamp: Date.now()
      };
      
      this.metrics.memoryUsage.push(usage);
      
      // Keep only last 60 samples (1 minute at 1s intervals)
      if (this.metrics.memoryUsage.length > 60) {
        this.metrics.memoryUsage.shift();
      }
      
      // Check memory thresholds
      if (usage.used > this.thresholds.highMemory) {
        this.triggerCallback('onPerformanceAlert', {
          type: 'memory',
          message: 'High memory usage detected',
          details: usage
        });
      }
    }, 1000);
  },
  
  /**
   * Start DOM monitoring
   */
  startDOMMonitoring() {
    this.domInterval = setInterval(() => {
      if (!this.isActive) return;
      
      // Count DOM nodes
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_ELEMENT,
        null,
        false
      );
      
      let nodeCount = 0;
      while (walker.nextNode()) {
        nodeCount++;
      }
      
      // Count event listeners (approximate)
      const elementsWithListeners = document.querySelectorAll('*').length;
      
      this.metrics.domNodeCount = nodeCount;
      this.metrics.listenerCount = elementsWithListeners;
      
      // Check for DOM bloat
      if (nodeCount > 5000) {
        this.triggerCallback('onOptimizationSuggestion', {
          type: 'dom',
          message: 'High DOM node count detected',
          suggestion: 'Consider virtualizing large lists or removing unused elements',
          count: nodeCount
        });
      }
    }, 5000);
  },
  
  /**
   * Update FPS statistics
   */
  updateFpsStats() {
    // Update min/max
    this.minFps = Math.min(this.minFps, this.fps);
    this.maxFps = Math.max(this.maxFps, this.fps);
    
    // Calculate rolling average
    if (!this.fpsHistory) this.fpsHistory = [];
    this.fpsHistory.push(this.fps);
    
    if (this.fpsHistory.length > 10) {
      this.fpsHistory.shift();
    }
    
    this.avgFps = Math.round(
      this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
    );
  },
  
  /**
   * Check FPS thresholds and trigger alerts
   */
  checkFpsThresholds() {
    if (this.fps < this.thresholds.criticalFps) {
      this.triggerCallback('onPerformanceAlert', {
        type: 'fps',
        level: 'critical',
        message: `Critical FPS: ${this.fps}`,
        fps: this.fps
      });
    } else if (this.fps < this.thresholds.lowFps) {
      this.triggerCallback('onFpsWarning', {
        type: 'fps',
        level: 'warning',
        message: `Low FPS: ${this.fps}`,
        fps: this.fps
      });
    }
  },
  
  /**
   * Measure render time for a function
   */
  measureRender(fn, label = 'render') {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    const duration = end - start;
    
    this.metrics.renderTime.push({
      label,
      duration,
      timestamp: Date.now()
    });
    
    // Keep only last 50 measurements
    if (this.metrics.renderTime.length > 50) {
      this.metrics.renderTime.shift();
    }
    
    // Check render time threshold
    if (duration > this.thresholds.maxRenderTime) {
      this.triggerCallback('onOptimizationSuggestion', {
        type: 'render',
        message: `Slow render detected: ${label}`,
        duration: duration.toFixed(2),
        suggestion: 'Consider optimizing DOM operations or using requestAnimationFrame'
      });
    }
    
    return result;
  },
  
  /**
   * Get current performance snapshot
   */
  getSnapshot() {
    const memory = performance.memory ? {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit
    } : null;
    
    return {
      fps: {
        current: this.fps,
        average: this.avgFps,
        min: this.minFps,
        max: this.maxFps
      },
      memory,
      dom: {
        nodes: this.metrics.domNodeCount,
        listeners: this.metrics.listenerCount
      },
      renderTimes: this.metrics.renderTime.slice(-10),
      timestamp: Date.now()
    };
  },
  
  /**
   * Get performance recommendations
   */
  getRecommendations() {
    const recommendations = [];
    const snapshot = this.getSnapshot();
    
    // FPS recommendations
    if (snapshot.fps.average < 45) {
      recommendations.push({
        category: 'Performance',
        issue: 'Low average FPS',
        suggestion: 'Reduce DOM manipulations, use CSS transforms, enable hardware acceleration'
      });
    }
    
    // Memory recommendations
    if (snapshot.memory && snapshot.memory.used > 30 * 1024 * 1024) {
      recommendations.push({
        category: 'Memory',
        issue: 'High memory usage',
        suggestion: 'Check for memory leaks, cleanup event listeners, optimize image usage'
      });
    }
    
    // DOM recommendations
    if (snapshot.dom.nodes > 3000) {
      recommendations.push({
        category: 'DOM',
        issue: 'High DOM node count',
        suggestion: 'Use virtual scrolling, lazy loading, or component cleanup'
      });
    }
    
    // Render time recommendations
    const avgRenderTime = this.metrics.renderTime
      .slice(-10)
      .reduce((sum, r) => sum + r.duration, 0) / Math.max(this.metrics.renderTime.length, 1);
    
    if (avgRenderTime > 10) {
      recommendations.push({
        category: 'Rendering',
        issue: 'Slow render times',
        suggestion: 'Batch DOM updates, use DocumentFragment, optimize CSS selectors'
      });
    }
    
    return recommendations;
  },
  
  /**
   * Create performance dashboard element
   */
  createDashboard() {
    const dashboard = document.createElement('div');
    dashboard.id = 'fps-dashboard';
    dashboard.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0,0,0,0.9);
      color: white;
      padding: 10px;
      border-radius: 5px;
      font-family: monospace;
      font-size: 12px;
      z-index: 10000;
      min-width: 200px;
    `;
    
    this.updateDashboard(dashboard);
    document.body.appendChild(dashboard);
    
    // Update dashboard every second
    this.dashboardInterval = setInterval(() => {
      if (document.getElementById('fps-dashboard')) {
        this.updateDashboard(dashboard);
      } else {
        clearInterval(this.dashboardInterval);
      }
    }, 1000);
    
    return dashboard;
  },
  
  /**
   * Update dashboard display
   */
  updateDashboard(dashboard) {
    const snapshot = this.getSnapshot();
    const memoryMB = snapshot.memory ? 
      `${Math.round(snapshot.memory.used / 1024 / 1024)}MB` : 'N/A';
    
    dashboard.innerHTML = `
      <div><strong>FPS Monitor</strong></div>
      <div>FPS: ${snapshot.fps.current} (avg: ${snapshot.fps.average})</div>
      <div>Memory: ${memoryMB}</div>
      <div>DOM: ${snapshot.dom.nodes} nodes</div>
      <div style="margin-top: 5px; font-size: 10px; opacity: 0.7;">
        Click to toggle details
      </div>
    `;
    
    // Color coding based on performance
    if (snapshot.fps.current < 30) {
      dashboard.style.borderLeft = '3px solid red';
    } else if (snapshot.fps.current < 45) {
      dashboard.style.borderLeft = '3px solid yellow';
    } else {
      dashboard.style.borderLeft = '3px solid green';
    }
  },
  
  /**
   * Trigger callback if defined
   */
  triggerCallback(callbackName, data) {
    const callback = this.callbacks[callbackName];
    if (typeof callback === 'function') {
      try {
        callback(data);
      } catch (error) {
        console.warn('FPS Watchdog callback error:', error);
      }
    }
  },
  
  /**
   * Log performance summary
   */
  logSummary() {
    const snapshot = this.getSnapshot();
    const recommendations = this.getRecommendations();
    
    console.group('🎯 Performance Summary');
    console.log('FPS:', snapshot.fps);
    console.log('Memory:', snapshot.memory);
    console.log('DOM:', snapshot.dom);
    
    if (recommendations.length > 0) {
      console.group('💡 Recommendations');
      recommendations.forEach(rec => {
        console.log(`${rec.category}: ${rec.issue} - ${rec.suggestion}`);
      });
      console.groupEnd();
    }
    
    console.groupEnd();
  }
};

// Global performance test function
window.testPerformance = () => {
  fpsWatchdog.start({
    callbacks: {
      onFpsWarning: (data) => console.warn('FPS Warning:', data),
      onPerformanceAlert: (data) => console.error('Performance Alert:', data),
      onOptimizationSuggestion: (data) => console.info('Optimization:', data)
    }
  });
  
  // Show dashboard
  fpsWatchdog.createDashboard();
  
  console.log('🎯 Performance monitoring started. Check dashboard in top-right corner.');
  
  // Auto-stop after 30 seconds
  setTimeout(() => {
    fpsWatchdog.logSummary();
    const dashboard = document.getElementById('fps-dashboard');
    if (dashboard) dashboard.remove();
    console.log('🎯 Performance test completed.');
  }, 30000);
};

export default fpsWatchdog;

// Simplified FPS watchdog
export function createFPSWatchdog({ minFps=45, sampleMs=1000 }={}){
  let frames = 0, last = performance.now(), degraded=false, rafId;
  function loop(ts){
    frames++;
    if (ts - last >= sampleMs){
      const fps = (frames * 1000) / (ts - last);
      degraded = fps < minFps;
      frames = 0; last = ts;
      document.dispatchEvent(new CustomEvent('perf:fps', { detail:{ fps, degraded } }));
    }
    rafId = requestAnimationFrame(loop);
  }
  rafId = requestAnimationFrame(loop);
  return { stop(){ cancelAnimationFrame(rafId); }, isDegraded(){ return degraded; } };
}