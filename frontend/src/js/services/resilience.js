/**
 * RESILIENCE SERVICE - Error Handling & Recovery System
 * Comprehensive error management with graceful degradation
 */

class ResilienceService {
  constructor() {
    this.errorLog = [];
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.circuitBreaker = new Map();
    this.offlineQueue = [];
    this.isOnline = navigator.onLine;
    this.healthChecks = new Map();
    
    this.init();
  }

  /**
   * Initialize resilience systems
   */
  init() {
    // Monitor network status
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    // Global error handling
    window.addEventListener('error', (event) => this.handleGlobalError(event));
    window.addEventListener('unhandledrejection', (event) => this.handleUnhandledRejection(event));
    
    // Performance monitoring
    this.setupPerformanceObserver();
    
    // Periodic health checks
    this.startHealthChecks();
  }

  /**
   * Retry mechanism with exponential backoff
   */
  async retry(fn, options = {}) {
    const {
      maxRetries = this.maxRetries,
      delay = this.retryDelay,
      exponential = true,
      onRetry = null,
    } = options;

    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries - 1) {
          const waitTime = exponential ? delay * Math.pow(2, attempt) : delay;
          
          if (onRetry) {
            onRetry(attempt + 1, error);
          }
          
          await this.sleep(waitTime);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Circuit breaker pattern
   */
  async withCircuitBreaker(key, fn, options = {}) {
    const {
      threshold = 5,
      timeout = 60000,
      halfOpenAttempts = 3,
    } = options;

    const breaker = this.circuitBreaker.get(key) || {
      failures: 0,
      state: 'closed', // closed, open, half-open
      lastFailure: null,
      halfOpenTries: 0,
    };

    // Check if circuit is open
    if (breaker.state === 'open') {
      const timeSinceLastFailure = Date.now() - breaker.lastFailure;
      
      if (timeSinceLastFailure < timeout) {
        throw new Error(`Circuit breaker is open for ${key}`);
      }
      
      // Try half-open state
      breaker.state = 'half-open';
      breaker.halfOpenTries = 0;
    }

    try {
      const result = await fn();
      
      // Success - reset or close circuit
      if (breaker.state === 'half-open') {
        breaker.state = 'closed';
        breaker.failures = 0;
        breaker.halfOpenTries = 0;
      }
      
      this.circuitBreaker.set(key, breaker);
      return result;
      
    } catch (error) {
      breaker.failures++;
      breaker.lastFailure = Date.now();
      
      if (breaker.state === 'half-open') {
        breaker.halfOpenTries++;
        
        if (breaker.halfOpenTries >= halfOpenAttempts) {
          breaker.state = 'open';
        }
      } else if (breaker.failures >= threshold) {
        breaker.state = 'open';
        console.warn(`Circuit breaker opened for ${key}`);
      }
      
      this.circuitBreaker.set(key, breaker);
      throw error;
    }
  }

  /**
   * Offline queue management
   */
  queueForSync(action) {
    this.offlineQueue.push({
      id: this.generateId(),
      action,
      timestamp: Date.now(),
      retries: 0,
    });
    
    // Store in localStorage for persistence
    this.persistQueue();
  }

  /**
   * Process offline queue when back online
   */
  async processOfflineQueue() {
    if (this.offlineQueue.length === 0) return;
    
    console.log(`Processing ${this.offlineQueue.length} offline actions`);
    
    const processed = [];
    const failed = [];
    
    for (const item of this.offlineQueue) {
      try {
        await this.retry(() => item.action(), {
          maxRetries: 2,
          delay: 500,
        });
        processed.push(item);
      } catch (error) {
        item.retries++;
        
        if (item.retries >= 3) {
          console.error(`Failed to process offline action ${item.id}:`, error);
          failed.push(item);
        } else {
          // Keep in queue for next attempt
          continue;
        }
      }
    }
    
    // Remove processed and permanently failed items
    this.offlineQueue = this.offlineQueue.filter(
      item => !processed.includes(item) && !failed.includes(item)
    );
    
    this.persistQueue();
    
    if (processed.length > 0) {
      this.showNotification(`Synced ${processed.length} offline actions`);
    }
  }

  /**
   * Error logging and reporting
   */
  logError(error, context = {}) {
    const errorEntry = {
      timestamp: Date.now(),
      message: error.message || String(error),
      stack: error.stack,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      online: navigator.onLine,
    };
    
    this.errorLog.push(errorEntry);
    
    // Keep only last 100 errors
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }
    
    // Store critical errors
    if (context.critical) {
      this.storeCriticalError(errorEntry);
    }
    
    // Send to monitoring service (if configured)
    this.reportToMonitoring(errorEntry);
  }

  /**
   * Health check system
   */
  async performHealthCheck(service, checkFn) {
    try {
      const start = performance.now();
      const result = await checkFn();
      const duration = performance.now() - start;
      
      this.healthChecks.set(service, {
        status: 'healthy',
        lastCheck: Date.now(),
        responseTime: duration,
        consecutive_failures: 0,
      });
      
      return true;
    } catch (error) {
      const current = this.healthChecks.get(service) || { consecutive_failures: 0 };
      
      this.healthChecks.set(service, {
        status: 'unhealthy',
        lastCheck: Date.now(),
        error: error.message,
        consecutive_failures: current.consecutive_failures + 1,
      });
      
      // Trigger alert if multiple consecutive failures
      if (current.consecutive_failures >= 3) {
        this.handleServiceDown(service);
      }
      
      return false;
    }
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks() {
    // Check API health every 30 seconds
    setInterval(() => {
      this.performHealthCheck('api', async () => {
        const response = await fetch('/api/health');
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        return response.json();
      });
    }, 30000);
    
    // Check localStorage availability
    setInterval(() => {
      this.performHealthCheck('storage', () => {
        const test = 'test_' + Date.now();
        localStorage.setItem(test, 'value');
        localStorage.removeItem(test);
        return true;
      });
    }, 60000);
  }

  /**
   * Graceful degradation strategies
   */
  async withFallback(primaryFn, fallbackFn, options = {}) {
    const { cacheKey, cacheDuration = 300000 } = options;
    
    try {
      const result = await primaryFn();
      
      // Cache successful result
      if (cacheKey) {
        this.cacheResult(cacheKey, result, cacheDuration);
      }
      
      return result;
    } catch (error) {
      console.warn('Primary function failed, using fallback:', error);
      
      // Try cached result first
      if (cacheKey) {
        const cached = this.getCachedResult(cacheKey);
        if (cached) return cached;
      }
      
      // Use fallback function
      return fallbackFn(error);
    }
  }

  /**
   * Cache management for fallbacks
   */
  cacheResult(key, data, duration) {
    const entry = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + duration,
    };
    
    try {
      sessionStorage.setItem(`resilience_cache_${key}`, JSON.stringify(entry));
    } catch (e) {
      console.warn('Failed to cache result:', e);
    }
  }

  getCachedResult(key) {
    try {
      const cached = sessionStorage.getItem(`resilience_cache_${key}`);
      if (!cached) return null;
      
      const entry = JSON.parse(cached);
      
      if (Date.now() > entry.expiry) {
        sessionStorage.removeItem(`resilience_cache_${key}`);
        return null;
      }
      
      return entry.data;
    } catch (e) {
      return null;
    }
  }

  /**
   * Network status handlers
   */
  handleOnline() {
    this.isOnline = true;
    console.log('Network connection restored');
    this.showNotification('Back online!', 'success');
    
    // Process queued actions
    this.processOfflineQueue();
    
    // Trigger reconnection events
    window.dispatchEvent(new CustomEvent('network:online'));
  }

  handleOffline() {
    this.isOnline = false;
    console.log('Network connection lost');
    this.showNotification('You are offline. Changes will sync when connection returns.', 'warning');
    
    // Trigger offline events
    window.dispatchEvent(new CustomEvent('network:offline'));
  }

  /**
   * Global error handlers
   */
  handleGlobalError(event) {
    const { message, filename, lineno, colno, error } = event;
    
    this.logError(error || new Error(message), {
      filename,
      lineno,
      colno,
      type: 'global_error',
    });
    
    // Prevent default error handling for non-critical errors
    if (!this.isCriticalError(error)) {
      event.preventDefault();
    }
  }

  handleUnhandledRejection(event) {
    this.logError(new Error(event.reason), {
      type: 'unhandled_rejection',
      promise: event.promise,
    });
    
    // Prevent default handling
    event.preventDefault();
  }

  /**
   * Performance monitoring
   */
  setupPerformanceObserver() {
    if (!window.PerformanceObserver) return;
    
    // Monitor long tasks
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn(`Long task detected: ${entry.duration}ms`);
            this.logError(new Error('Performance issue'), {
              type: 'long_task',
              duration: entry.duration,
              startTime: entry.startTime,
            });
          }
        }
      });
      
      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // Not all browsers support longtask
    }
  }

  /**
   * User feedback
   */
  showNotification(message, type = 'info') {
    // Dispatch event for UI to handle
    window.dispatchEvent(new CustomEvent('resilience:notification', {
      detail: { message, type },
    }));
  }

  /**
   * Utility functions
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  isCriticalError(error) {
    // Define what constitutes a critical error
    return error && (
      error.message?.includes('CRITICAL') ||
      error.stack?.includes('FATAL')
    );
  }

  persistQueue() {
    try {
      localStorage.setItem('offline_queue', JSON.stringify(this.offlineQueue));
    } catch (e) {
      console.warn('Failed to persist offline queue:', e);
    }
  }

  loadQueue() {
    try {
      const stored = localStorage.getItem('offline_queue');
      if (stored) {
        this.offlineQueue = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load offline queue:', e);
    }
  }

  storeCriticalError(error) {
    try {
      const errors = JSON.parse(localStorage.getItem('critical_errors') || '[]');
      errors.push(error);
      
      // Keep only last 10 critical errors
      const recent = errors.slice(-10);
      localStorage.setItem('critical_errors', JSON.stringify(recent));
    } catch (e) {
      // Fail silently
    }
  }

  reportToMonitoring(error) {
    // Implement reporting to external monitoring service
    // Example: Sentry, LogRocket, etc.
    if (window.monitoring?.reportError) {
      window.monitoring.reportError(error);
    }
  }

  handleServiceDown(service) {
    console.error(`Service ${service} is down`);
    this.showNotification(`${service} service is currently unavailable`, 'error');
    
    // Trigger service down event
    window.dispatchEvent(new CustomEvent('service:down', {
      detail: { service },
    }));
  }

  /**
   * Get system status
   */
  getSystemStatus() {
    return {
      online: this.isOnline,
      healthChecks: Object.fromEntries(this.healthChecks),
      circuitBreakers: Object.fromEntries(
        [...this.circuitBreaker.entries()].map(([key, value]) => [key, value.state])
      ),
      offlineQueueSize: this.offlineQueue.length,
      errorCount: this.errorLog.length,
      lastError: this.errorLog[this.errorLog.length - 1] || null,
    };
  }
}

// Export singleton instance
export const resilience = new ResilienceService();

// Make available globally for debugging
window.resilience = resilience;