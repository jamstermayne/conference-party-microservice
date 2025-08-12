/**
 * Request Cache & API Optimization - Optimization #4
 * Caches API responses and deduplicates concurrent requests
 * Reduces network overhead and improves performance
 */

class RequestCache {
  constructor() {
    this.cache = new Map();
    this.pending = new Map();
    this.ttl = 5 * 60 * 1000; // 5 minutes default TTL
  }

  /**
   * Generate cache key from URL and options
   * @private
   */
  getCacheKey(url, options = {}) {
    const { method = 'GET', body, params } = options;
    let key = `${method}:${url}`;
    
    if (params) {
      const searchParams = new URLSearchParams(params);
      key += `?${searchParams.toString()}`;
    }
    
    if (body) {
      key += `:${JSON.stringify(body)}`;
    }
    
    return key;
  }

  /**
   * Check if cache entry is still valid
   * @private
   */
  isValid(entry) {
    if (!entry) return false;
    const now = Date.now();
    return now - entry.timestamp < entry.ttl;
  }

  /**
   * Fetch with caching and deduplication
   * @param {string} url - Request URL
   * @param {Object} options - Fetch options
   * @returns {Promise<any>}
   */
  async fetch(url, options = {}) {
    const { 
      method = 'GET', 
      headers = {}, 
      body, 
      params,
      ttl = this.ttl,
      force = false,
      retry = 3
    } = options;

    const cacheKey = this.getCacheKey(url, options);

    // Return cached response if valid and not forced
    if (!force) {
      const cached = this.cache.get(cacheKey);
      if (this.isValid(cached)) {
        return structuredClone(cached.data);
      }
    }

    // Deduplicate concurrent requests
    if (this.pending.has(cacheKey)) {
      return this.pending.get(cacheKey);
    }

    // Build fetch options
    const fetchOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    // Add query parameters
    let fetchUrl = url;
    if (params) {
      const searchParams = new URLSearchParams(params);
      fetchUrl += `?${searchParams.toString()}`;
    }

    // Create fetch promise with retry logic
    const fetchPromise = this.fetchWithRetry(fetchUrl, fetchOptions, retry)
      .then(async response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Cache successful GET requests
        if (method === 'GET') {
          this.cache.set(cacheKey, {
            data,
            timestamp: Date.now(),
            ttl
          });
        }
        
        this.pending.delete(cacheKey);
        return data;
      })
      .catch(error => {
        this.pending.delete(cacheKey);
        throw error;
      });

    this.pending.set(cacheKey, fetchPromise);
    return fetchPromise;
  }

  /**
   * Fetch with retry logic
   * @private
   */
  async fetchWithRetry(url, options, retries) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        return response;
      } catch (error) {
        if (i === retries - 1) throw error;
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, i), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Batch multiple requests
   * @param {Array} requests - Array of request configs
   * @returns {Promise<Array>}
   */
  async batch(requests) {
    const promises = requests.map(({ url, options }) => 
      this.fetch(url, options).catch(error => ({ error }))
    );
    
    return Promise.all(promises);
  }

  /**
   * Clear cache for specific URL or all
   * @param {string} url - Optional URL pattern to clear
   */
  clear(url = null) {
    if (url) {
      const keys = Array.from(this.cache.keys());
      keys.forEach(key => {
        if (key.includes(url)) {
          this.cache.delete(key);
        }
      });
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   * @returns {Object}
   */
  getStats() {
    const entries = Array.from(this.cache.entries());
    const validEntries = entries.filter(([, entry]) => this.isValid(entry));
    
    return {
      total: this.cache.size,
      valid: validEntries.length,
      expired: this.cache.size - validEntries.length,
      pending: this.pending.size,
      size: new Blob([JSON.stringify(entries)]).size
    };
  }

  /**
   * Prefetch URLs for later use
   * @param {string[]} urls - URLs to prefetch
   */
  prefetch(urls) {
    urls.forEach(url => {
      this.fetch(url, { ttl: 10 * 60 * 1000 }); // 10 min TTL for prefetch
    });
  }
}

// Singleton instance
const requestCache = new RequestCache();

// Export convenience functions
export const cachedFetch = (url, options) => requestCache.fetch(url, options);
export const batchFetch = (requests) => requestCache.batch(requests);
export const clearCache = (url) => requestCache.clear(url);
export const prefetch = (urls) => requestCache.prefetch(urls);
export const getCacheStats = () => requestCache.getStats();

// Auto-clear expired entries every 5 minutes
setInterval(() => {
  const stats = requestCache.getStats();
  if (stats.expired > 10) {
    const keys = Array.from(requestCache.cache.keys());
    keys.forEach(key => {
      const entry = requestCache.cache.get(key);
      if (!requestCache.isValid(entry)) {
        requestCache.cache.delete(key);
      }
    });
  }
}, 5 * 60 * 1000);

export default requestCache;