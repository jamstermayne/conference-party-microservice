/**
 * 🌐 PROFESSIONAL INTELLIGENCE PLATFORM - API CLIENT
 * Sophisticated API communication with caching, retries, and offline support
 */

export class API {
  constructor() {
    this.baseURL = this.detectAPIBase();
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.retryAttempts = 3;
    this.timeout = 10000;
    this.isOnline = navigator.onLine;
    
    this.setupNetworkListeners();
    console.log(`🌐 API client initialized with base: ${this.baseURL}`);
  }

  /**
   * Detect API base URL
   */
  detectAPIBase() {
    // Check if we're in development or production
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3000/api';
    }
    
    // Production API endpoint
    return 'https://us-central1-conference-party-app.cloudfunctions.net/api';
  }

  /**
   * Setup network status listeners
   */
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 Connection restored');
      this.syncOfflineActions();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📴 Connection lost');
    });
  }

  /**
   * Main request method with sophisticated error handling
   */
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      headers = {},
      body = null,
      cache = true,
      timeout = this.timeout,
      retry = true
    } = options;

    const url = `${this.baseURL}${endpoint}`;
    const cacheKey = `${method}:${url}`;

    // Return cached response if available and fresh
    if (method === 'GET' && cache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 300000) { // 5 minutes
        console.log(`💾 Serving from cache: ${endpoint}`);
        return cached.data;
      }
    }

    // Check for duplicate requests
    if (this.pendingRequests.has(cacheKey)) {
      console.log(`⏳ Waiting for pending request: ${endpoint}`);
      return this.pendingRequests.get(cacheKey);
    }

    const requestPromise = this.executeRequest(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : null,
      timeout,
      retry
    });

    // Store pending request
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const response = await requestPromise;

      // Cache successful GET requests
      if (method === 'GET' && cache && response) {
        this.cache.set(cacheKey, {
          data: response,
          timestamp: Date.now()
        });
      }

      return response;
    } finally {
      // Clean up pending request
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Execute HTTP request with timeout and retry logic
   */
  async executeRequest(url, options) {
    const { timeout, retry, ...fetchOptions } = options;
    let lastError = null;
    let attempt = 0;
    const maxAttempts = retry ? this.retryAttempts : 1;

    while (attempt < maxAttempts) {
      try {
        console.log(`🚀 API Request (attempt ${attempt + 1}): ${fetchOptions.method} ${url}`);

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new APIError(`HTTP ${response.status}: ${response.statusText}`, response.status, response);
        }

        const data = await response.json();
        console.log(`✅ API Success: ${fetchOptions.method} ${url}`);
        return data;

      } catch (error) {
        lastError = error;
        attempt++;

        console.error(`❌ API Error (attempt ${attempt}):`, error.message);

        // Don't retry on client errors (4xx) or abort errors
        if (error.name === 'AbortError' || 
            (error instanceof APIError && error.status >= 400 && error.status < 500)) {
          break;
        }

        // Exponential backoff for retries
        if (attempt < maxAttempts) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`⏳ Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    // If offline, store action for later sync
    if (!this.isOnline && fetchOptions.method !== 'GET') {
      this.storeOfflineAction(url, fetchOptions);
    }

    throw lastError || new Error('Request failed after all retry attempts');
  }

  /**
   * Get parties data
   */
  async getParties() {
    try {
      const response = await this.request('/parties', { cache: true });
      console.log(`🎉 Loaded ${response.parties?.length || 0} parties`);
      return response.parties || [];
    } catch (error) {
      console.error('❌ Failed to load parties:', error);
      return this.getOfflineParties();
    }
  }

  /**
   * Get party by ID
   */
  async getParty(id) {
    try {
      const response = await this.request(`/parties/${id}`, { cache: true });
      return response.party;
    } catch (error) {
      console.error(`❌ Failed to load party ${id}:`, error);
      throw error;
    }
  }

  /**
   * RSVP to party
   */
  async rsvpToParty(partyId, status = 'attending') {
    try {
      const response = await this.request(`/parties/${partyId}/rsvp`, {
        method: 'POST',
        body: { status, timestamp: Date.now() }
      });
      
      console.log(`✅ RSVP updated for party ${partyId}: ${status}`);
      return response;
    } catch (error) {
      console.error(`❌ RSVP failed for party ${partyId}:`, error);
      
      // Store for offline sync
      this.storeOfflineAction(`/parties/${partyId}/rsvp`, {
        method: 'POST',
        body: JSON.stringify({ status, timestamp: Date.now() })
      });
      
      throw error;
    }
  }

  /**
   * Get health status
   */
  async getHealth() {
    try {
      const response = await this.request('/health', { cache: false });
      console.log('💚 API Health check passed');
      return response;
    } catch (error) {
      console.error('❤️ API Health check failed:', error);
      return { status: 'error', message: error.message };
    }
  }

  /**
   * Sync profile data
   */
  async syncProfile(profile) {
    try {
      const response = await this.request('/sync', {
        method: 'POST',
        body: { profile, timestamp: Date.now() }
      });
      
      console.log('👤 Profile synced successfully');
      return response;
    } catch (error) {
      console.error('❌ Profile sync failed:', error);
      
      // Store for offline sync
      localStorage.setItem('pending_profile', JSON.stringify(profile));
      throw error;
    }
  }

  /**
   * Get referral data
   */
  async getReferralData(code) {
    try {
      const response = await this.request(`/referral/${code}`, { cache: true });
      return response;
    } catch (error) {
      console.error(`❌ Failed to load referral data for ${code}:`, error);
      throw error;
    }
  }

  /**
   * Track referral conversion
   */
  async trackReferral(code, action = 'view') {
    try {
      const response = await this.request(`/referral/${code}/track`, {
        method: 'POST',
        body: { action, timestamp: Date.now() }
      });
      
      console.log(`📊 Referral tracked: ${code} - ${action}`);
      return response;
    } catch (error) {
      console.error(`❌ Referral tracking failed for ${code}:`, error);
      // Non-critical, don't throw
    }
  }

  /**
   * Store offline action for later sync
   */
  storeOfflineAction(url, options) {
    const actions = JSON.parse(localStorage.getItem('pending_actions') || '[]');
    actions.push({
      url,
      options: {
        method: options.method,
        headers: options.headers,
        body: options.body
      },
      timestamp: Date.now()
    });
    
    localStorage.setItem('pending_actions', JSON.stringify(actions));
    console.log(`📦 Stored offline action: ${options.method} ${url}`);
  }

  /**
   * Sync offline actions when connection is restored
   */
  async syncOfflineActions() {
    if (!this.isOnline) return;

    const actions = JSON.parse(localStorage.getItem('pending_actions') || '[]');
    if (actions.length === 0) return;

    console.log(`🔄 Syncing ${actions.length} offline actions...`);

    for (const action of actions) {
      try {
        await fetch(action.url, action.options);
        console.log(`✅ Synced offline action: ${action.options.method} ${action.url}`);
      } catch (error) {
        console.error(`❌ Failed to sync action:`, error);
      }
    }

    // Clear synced actions
    localStorage.setItem('pending_actions', '[]');
    console.log('🧹 Offline actions cleared');
  }

  /**
   * Get offline parties from cache
   */
  getOfflineParties() {
    try {
      const cached = localStorage.getItem('cached_parties');
      if (cached) {
        const parties = JSON.parse(cached);
        console.log(`💾 Using cached parties: ${parties.length} items`);
        return parties;
      }
    } catch (error) {
      console.error('❌ Failed to load cached parties:', error);
    }
    
    return [];
  }

  /**
   * Cache parties data locally
   */
  cacheParties(parties) {
    try {
      localStorage.setItem('cached_parties', JSON.stringify(parties));
      localStorage.setItem('parties_cache_timestamp', Date.now().toString());
      console.log(`💾 Cached ${parties.length} parties`);
    } catch (error) {
      console.error('❌ Failed to cache parties:', error);
    }
  }

  /**
   * Check if cached data is fresh
   */
  isCacheFresh(key, maxAge = 300000) { // 5 minutes default
    const timestamp = localStorage.getItem(`${key}_timestamp`);
    if (!timestamp) return false;
    
    return (Date.now() - parseInt(timestamp)) < maxAge;
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
    localStorage.removeItem('cached_parties');
    localStorage.removeItem('parties_cache_timestamp');
    console.log('🧹 API cache cleared');
  }

  /**
   * Utility: Sleep for specified milliseconds
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get API statistics
   */
  getStats() {
    const pendingActions = JSON.parse(localStorage.getItem('pending_actions') || '[]');
    
    return {
      baseURL: this.baseURL,
      isOnline: this.isOnline,
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      pendingOfflineActions: pendingActions.length,
      cacheTimestamp: localStorage.getItem('parties_cache_timestamp')
    };
  }

  /**
   * Test API connectivity
   */
  async testConnection() {
    const startTime = performance.now();
    
    try {
      await this.getHealth();
      const duration = performance.now() - startTime;
      
      return {
        success: true,
        duration: Math.round(duration),
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }
}

/**
 * Custom API Error class
 */
class APIError extends Error {
  constructor(message, status, response) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.response = response;
  }
}