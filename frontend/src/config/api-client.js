// Production-Ready API Client with Environment Support
import config, { configManager, apiConfig } from './environments.js';

// Enhanced API client with automatic environment detection and fallback
class ApiClient {
  constructor() {
    this.baseUrl = null;
    this.initialized = false;
    this.healthCheckCache = new Map();
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    
    this.setupInterceptors();
  }
  
  // Initialize API client with proper endpoint resolution
  async initialize() {
    if (this.initialized) return this.baseUrl;
    
    console.info('🔧 Initializing API client...');
    
    try {
      // Resolve the best available endpoint
      this.baseUrl = await configManager.resolveApiEndpoint();
      this.initialized = true;
      
      console.info(`✅ API client initialized with endpoint: ${this.baseUrl}`);
      
      // Test the connection
      await this.healthCheck();
      
      return this.baseUrl;
    } catch (error) {
      console.error('❌ API client initialization failed:', error);
      
      // Fallback to primary endpoint for local data fallback
      this.baseUrl = apiConfig.endpoints.primary;
      this.initialized = true;
      
      return this.baseUrl;
    }
  }
  
  // Health check with caching
  async healthCheck(force = false) {
    const cacheKey = this.baseUrl;
    const cacheTime = 60000; // 1 minute cache
    
    if (!force && this.healthCheckCache.has(cacheKey)) {
      const cached = this.healthCheckCache.get(cacheKey);
      if (Date.now() - cached.timestamp < cacheTime) {
        return cached.result;
      }
    }
    
    try {
      const response = await this.request('/health', {
        method: 'GET',
        timeout: 5000,
        retries: 1
      });
      
      const result = { healthy: true, response };
      this.healthCheckCache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });
      
      return result;
    } catch (error) {
      const result = { healthy: false, error: error.message };
      this.healthCheckCache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });
      
      return result;
    }
  }
  
  // Core request method with environment-aware configuration
  async request(endpoint, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = apiConfig.timeout,
      retries = apiConfig.retries,
      retryDelay = apiConfig.retryDelay,
      skipAuth = false
    } = options;
    
    // Build full URL
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    // Prepare request configuration
    const requestConfig = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Environment': config.environment,
        'X-Client-Version': config.app.version,
        ...this.getEnvironmentHeaders(),
        ...headers
      },
      credentials: 'include'
    };
    
    // Add body for POST/PUT/PATCH requests
    if (body && method !== 'GET' && method !== 'HEAD') {
      requestConfig.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
    
    // Add authentication if available
    if (!skipAuth) {
      const authHeaders = await this.getAuthHeaders();
      Object.assign(requestConfig.headers, authHeaders);
    }
    
    // Apply request interceptors
    for (const interceptor of this.requestInterceptors) {
      await interceptor(requestConfig, url);
    }
    
    // Execute request with retries
    return this.executeWithRetries(url, requestConfig, retries, retryDelay, timeout);
  }
  
  // Execute request with automatic retries and timeout
  async executeWithRetries(url, requestConfig, maxRetries, retryDelay, timeout) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        requestConfig.signal = controller.signal;
        
        // Execute request
        const response = await fetch(url, requestConfig);
        clearTimeout(timeoutId);
        
        // Apply response interceptors
        for (const interceptor of this.responseInterceptors) {
          await interceptor(response);
        }
        
        // Handle response
        if (!response.ok) {
          const error = await this.handleErrorResponse(response);
          
          // Don't retry client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            throw error;
          }
          
          lastError = error;
          continue; // Retry server errors (5xx)
        }
        
        // Parse successful response
        return await this.parseResponse(response);
        
      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error;
        
        // Don't retry on abort (timeout)
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${timeout}ms`);
        }
        
        // Don't retry on network errors in production
        if (config.environment === 'production' && error.name === 'TypeError') {
          throw error;
        }
        
        // Wait before retry (except on last attempt)
        if (attempt < maxRetries) {
          await this.sleep(retryDelay * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }
    
    throw lastError || new Error('Request failed after all retries');
  }
  
  // Parse response based on content type
  async parseResponse(response) {
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      return response.json();
    }
    
    if (contentType.includes('text/')) {
      return response.text();
    }
    
    if (contentType.includes('application/octet-stream')) {
      return response.blob();
    }
    
    // Default to JSON for API responses
    try {
      return await response.json();
    } catch {
      return response.text();
    }
  }
  
  // Handle error responses
  async handleErrorResponse(response) {
    let errorData;
    
    try {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        errorData = await response.json();
      } else {
        errorData = { message: await response.text() };
      }
    } catch {
      errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
    }
    
    const error = new Error(errorData.message || `Request failed: ${response.status}`);
    error.status = response.status;
    error.data = errorData;
    error.response = response;
    
    return error;
  }
  
  // Get environment-specific headers
  getEnvironmentHeaders() {
    const headers = {};
    
    // Add development headers
    if (config.environment === 'development') {
      headers['X-Development-Mode'] = 'true';
      
      if (window.location.hostname.includes('app.github.dev')) {
        headers['X-Codespace-Origin'] = window.location.hostname;
      }
      
      if (window.location.hostname.includes('gitpod.io')) {
        headers['X-Gitpod-Origin'] = window.location.hostname;
      }
    }
    
    return headers;
  }
  
  // Get authentication headers
  async getAuthHeaders() {
    const headers = {};
    
    // Check for stored authentication
    const profile = JSON.parse(localStorage.getItem('velocity_profile') || 'null');
    if (profile && profile.authenticated) {
      headers['X-User-ID'] = profile.id || 'anonymous';
      headers['X-User-Provider'] = profile.provider || 'unknown';
    }
    
    // Add CSRF token if available
    const csrfToken = this.getCsrfToken();
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
    
    return headers;
  }
  
  // Get CSRF token from meta tag or cookie
  getCsrfToken() {
    // Try meta tag first
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      return metaTag.getAttribute('content');
    }
    
    // Try cookie
    const cookies = document.cookie.split(';');
    const csrfCookie = cookies.find(cookie => cookie.trim().startsWith('csrf-token='));
    if (csrfCookie) {
      return csrfCookie.split('=')[1];
    }
    
    return null;
  }
  
  // Setup default interceptors
  setupInterceptors() {
    // Request interceptor for logging
    this.addRequestInterceptor(async (requestConfig, url) => {
      if (config.features.debugging) {
        console.group(`🌐 API Request: ${requestConfig.method} ${url}`);
        console.info('Headers:', requestConfig.headers);
        if (requestConfig.body) {
          console.info('Body:', requestConfig.body);
        }
        console.groupEnd();
      }
    });
    
    // Response interceptor for logging
    this.addResponseInterceptor(async (response) => {
      if (config.features.debugging) {
        console.group(`📡 API Response: ${response.status} ${response.url}`);
        console.info('Status:', response.status, response.statusText);
        console.info('Headers:', Object.fromEntries(response.headers.entries()));
        console.groupEnd();
      }
    });
  }
  
  // Add request interceptor
  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
  }
  
  // Add response interceptor  
  addResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor);
  }
  
  // Convenience methods
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }
  
  async post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }
  
  async put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }
  
  async patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }
  
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
  
  // Utility methods
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Get current endpoint info
  getEndpointInfo() {
    return {
      baseUrl: this.baseUrl,
      initialized: this.initialized,
      environment: config.environment,
      healthStatus: this.healthCheckCache.get(this.baseUrl)
    };
  }
}

// Create singleton instance
const apiClient = new ApiClient();

// Auto-initialize in development
if (config.environment === 'development') {
  apiClient.initialize().catch(error => {
    console.warn('Auto-initialization failed:', error);
  });
}

// Export API client and utilities
export default apiClient;
export { ApiClient };

// Make available globally for debugging
if (config.features.debugging) {
  window.API_CLIENT = apiClient;
}