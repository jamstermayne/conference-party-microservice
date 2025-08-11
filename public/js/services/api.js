/**
 * API SERVICE
 * Handles all API communication with Firebase backend
 */

// Replace these endpoints with your backend. All functions return Promises.

const BASE = '/api';

export async function listEvents({ when }){
  // GET /api/events?when=tonight
  try{
    const r = await fetch(`${BASE}/events?when=${encodeURIComponent(when||'tonight')}`, { credentials:'include' });
    if(!r.ok) throw 0;
    return await r.json();
  }catch{
    // Fallback demo data
    return [
      { id:'e1', title:'Indie Dev Meetup', timeLabel:'9:00 PM', venue:'Marriott Hotel Bar', attending:23, lat:50.942, lon:6.958 },
      { id:'e2', title:'European Game Night', timeLabel:'7:30 PM', venue:'Kölnmesse Confex', attending:54, lat:50.941, lon:6.980 }
    ];
  }
}

export async function rsvp(eventId, status){
  const r = await fetch(`${BASE}/events/${eventId}/rsvp`, {
    method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include',
    body: JSON.stringify({ status })
  });
  return r.ok;
}

export async function setIntent(intent){
  const r = await fetch(`${BASE}/intent`, {
    method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include',
    body: JSON.stringify(intent)
  });
  return r.ok;
}

export async function setPresence(presence){
  const r = await fetch(`${BASE}/presence`, {
    method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include',
    body: JSON.stringify(presence)
  });
  return r.ok;
}

// Legacy class-based API service for backward compatibility
class APIService {
  constructor() {
    this.baseURL = window.location.hostname === 'localhost' 
      ? 'http://localhost:5001/conference-party-app/us-central1/api'
      : 'https://us-central1-conference-party-app.cloudfunctions.net/api';
    
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
    this.requestQueue = [];
    this.maxConcurrent = 5;
    this.activeRequests = 0;
  }

  /**
   * Make API request with caching and queue management
   */
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      body = null,
      cache = true,
      ttl = this.cacheTTL,
      priority = 'normal'
    } = options;

    const url = `${this.baseURL}${endpoint}`;
    const cacheKey = `${method}:${url}:${JSON.stringify(body)}`;

    // Check cache for GET requests
    if (method === 'GET' && cache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    // Queue request if at max concurrent
    if (this.activeRequests >= this.maxConcurrent) {
      return this.queueRequest(() => this.executeRequest(url, method, body), priority);
    }

    // Execute request
    const result = await this.executeRequest(url, method, body);

    // Cache successful GET requests
    if (method === 'GET' && cache && result) {
      this.setCache(cacheKey, result, ttl);
    }

    return result;
  }

  /**
   * Execute actual request
   */
  async executeRequest(url, method, body) {
    this.activeRequests++;

    try {
      const headers = {
        'Content-Type': 'application/json'
      };

      const config = {
        method,
        headers,
        mode: 'cors',
        credentials: 'include'
      };

      if (body && method !== 'GET') {
        config.body = JSON.stringify(body);
      }

      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    } finally {
      this.activeRequests--;
      this.processQueue();
    }
  }

  /**
   * Queue request for later execution
   */
  queueRequest(requestFn, priority) {
    return new Promise((resolve, reject) => {
      const queueItem = {
        execute: requestFn,
        resolve,
        reject,
        priority,
        timestamp: Date.now()
      };

      if (priority === 'high') {
        this.requestQueue.unshift(queueItem);
      } else {
        this.requestQueue.push(queueItem);
      }
    });
  }

  /**
   * Process request queue
   */
  async processQueue() {
    while (this.requestQueue.length > 0 && this.activeRequests < this.maxConcurrent) {
      const item = this.requestQueue.shift();
      try {
        const result = await item.execute();
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }
    }
  }

  /**
   * Get from cache
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cache
   */
  setCache(key, data, ttl) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  }

  /**
   * Clear cache
   */
  clearCache(pattern) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // ===== API ENDPOINTS =====

  /**
   * Health check
   */
  async health() {
    return this.request('/health', { cache: false });
  }

  /**
   * Get all events
   */
  async getEvents(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const endpoint = params ? `/parties?${params}` : '/parties';
    return this.request(endpoint);
  }

  /**
   * Get single event
   */
  async getEvent(eventId) {
    return this.request(`/parties/${eventId}`);
  }

  /**
   * Create event (UGC)
   */
  async createEvent(eventData) {
    return this.request('/parties', {
      method: 'POST',
      body: eventData,
      cache: false
    });
  }

  /**
   * Update event
   */
  async updateEvent(eventId, updates) {
    return this.request(`/parties/${eventId}`, {
      method: 'PUT',
      body: updates,
      cache: false
    });
  }

  /**
   * Delete event
   */
  async deleteEvent(eventId) {
    return this.request(`/parties/${eventId}`, {
      method: 'DELETE',
      cache: false
    });
  }

  /**
   * Swipe event
   */
  async swipeEvent(eventId, direction) {
    return this.request('/swipe', {
      method: 'POST',
      body: { eventId, direction },
      cache: false
    });
  }

  /**
   * Sync data
   */
  async syncData(lastSync) {
    return this.request('/sync', {
      method: 'POST',
      body: { lastSync },
      cache: false
    });
  }

  /**
   * Get referral stats
   */
  async getReferralStats(code) {
    return this.request(`/referral/stats/${code}`);
  }

  /**
   * Track referral click
   */
  async trackReferralClick(code) {
    return this.request(`/referral/click/${code}`, {
      method: 'POST',
      cache: false
    });
  }

  /**
   * Create referral
   */
  async createReferral(referralData) {
    return this.request('/referral/create', {
      method: 'POST',
      body: referralData,
      cache: false
    });
  }

  /**
   * Get professionals nearby
   */
  async getNearbyProfessionals(location, radius = 500) {
    return this.request('/professionals/nearby', {
      method: 'POST',
      body: { location, radius }
    });
  }

  /**
   * Get professional profile
   */
  async getProfessionalProfile(userId) {
    return this.request(`/professionals/${userId}`);
  }

  /**
   * Send connection request
   */
  async sendConnectionRequest(userId, message) {
    return this.request('/connections/request', {
      method: 'POST',
      body: { userId, message },
      cache: false
    });
  }

  /**
   * Accept connection request
   */
  async acceptConnection(requestId) {
    return this.request(`/connections/accept/${requestId}`, {
      method: 'POST',
      cache: false
    });
  }

  /**
   * Get opportunities
   */
  async getOpportunities(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const endpoint = params ? `/opportunities?${params}` : '/opportunities';
    return this.request(endpoint);
  }

  /**
   * Create opportunity
   */
  async createOpportunity(opportunityData) {
    return this.request('/opportunities', {
      method: 'POST',
      body: opportunityData,
      cache: false
    });
  }

  /**
   * Apply to opportunity
   */
  async applyToOpportunity(opportunityId, application) {
    return this.request(`/opportunities/${opportunityId}/apply`, {
      method: 'POST',
      body: application,
      cache: false
    });
  }

  /**
   * Get invites
   */
  async getInvites() {
    return this.request('/invites');
  }

  /**
   * Send invite
   */
  async sendInvite(inviteData) {
    return this.request('/invites/send', {
      method: 'POST',
      body: inviteData,
      cache: false
    });
  }

  /**
   * Accept invite
   */
  async acceptInvite(inviteCode) {
    return this.request(`/invites/accept/${inviteCode}`, {
      method: 'POST',
      cache: false
    });
  }

  /**
   * Batch request
   */
  async batch(requests) {
    return this.request('/batch', {
      method: 'POST',
      body: { requests },
      cache: false
    });
  }

  /**
   * Upload file
   */
  async uploadFile(file, type = 'image') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await fetch(`${this.baseURL}/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  }

  /**
   * WebSocket connection for real-time updates
   */
  connectWebSocket(handlers = {}) {
    const wsUrl = this.baseURL.replace('https', 'wss').replace('http', 'ws') + '/ws';
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      if (handlers.onOpen) handlers.onOpen();
    };
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (handlers.onMessage) handlers.onMessage(data);
        
        // Handle specific message types
        switch (data.type) {
          case 'event_update':
            if (handlers.onEventUpdate) handlers.onEventUpdate(data.payload);
            break;
          case 'proximity_update':
            if (handlers.onProximityUpdate) handlers.onProximityUpdate(data.payload);
            break;
          case 'opportunity_match':
            if (handlers.onOpportunityMatch) handlers.onOpportunityMatch(data.payload);
            break;
          case 'connection_request':
            if (handlers.onConnectionRequest) handlers.onConnectionRequest(data.payload);
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (handlers.onError) handlers.onError(error);
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      if (handlers.onClose) handlers.onClose();
      
      // Attempt reconnect after 5 seconds
      setTimeout(() => {
        if (this.shouldReconnect) {
          this.connectWebSocket(handlers);
        }
      }, 5000);
    };
    
    this.shouldReconnect = true;
  }

  /**
   * Disconnect WebSocket
   */
  disconnectWebSocket() {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Send WebSocket message
   */
  sendWebSocketMessage(type, payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }
}

// Create singleton instance
export const api = new APIService();

// Also export class for testing
export default APIService;