/**
 * PROXIMITY SERVICE
 * Privacy-first professional proximity detection for networking
 */

import { Store } from '../store.js?v=b021';

export async function fetchHotspots(){
  try{
    const r = await fetch('/api/hotspots', { credentials:'include' });
    if(!r.ok) throw 0;
    return await r.json();
  }catch{
    // demo data
    return [
      { id:'h1', name:'Marriott Bar', total:23, dev:12, pub:8, inv:2, sp:1 },
      { id:'h2', name:'Dorint Lobby', total:9, dev:4, pub:3, inv:1, sp:1 },
      { id:'h3', name:'Confex Hall A', total:2, dev:2, pub:0, inv:0, sp:0 }
    ];
  }
}

export async function reveal(hotspotId){
  try{
    const r = await fetch(`/api/hotspots/${hotspotId}/reveal`, { credentials:'include' });
    if(!r.ok) throw 0;
    return await r.json();
  }catch{
    // demo
    return [
      { name:'Alex Chen', role:'Developer — UE5' },
      { name:'Priya N.', role:'Publisher — Indies' },
      { name:'Jon K.', role:'Investor — Seed' }
    ];
  }
}

// Legacy class-based proximity service for backward compatibility
class ProximityService {
  constructor() {
    this.enabled = false;
    this.watchId = null;
    this.lastPosition = null;
    this.nearbyProfessionals = [];
    this.subscribers = [];
    this.updateInterval = null;
    this.config = {
      updateFrequency: 30000, // 30 seconds
      proximityRadius: 100, // 100 meters
      accuracyThreshold: 50, // 50 meter accuracy required
      maxAge: 300000, // 5 minutes max cache
      enableHighAccuracy: true,
      timeout: 15000
    };
    this.permissions = {
      location: null,
      granted: false
    };
  }

  /**
   * Initialize proximity service
   */
  async init() {
    try {
      // Check if geolocation is available
      if (!navigator.geolocation) {
        throw new Error('Geolocation not supported');
      }

      // Check stored permission preference
      const storedEnabled = localStorage.getItem('proximity.enabled');
      if (storedEnabled === 'true') {
        await this.requestPermission();
        if (this.permissions.granted) {
          this.startTracking();
        }
      }

      console.log('✅ Proximity service initialized');
    } catch (error) {
      console.warn('Proximity service initialization failed:', error);
    }
  }

  /**
   * Request location permission from user
   */
  async requestPermission() {
    try {
      // Check current permission state
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        this.permissions.location = permission.state;
        
        permission.onchange = () => {
          this.permissions.location = permission.state;
          this.permissions.granted = permission.state === 'granted';
          
          if (!this.permissions.granted && this.enabled) {
            this.stopTracking();
          }
        };
      }

      // Test geolocation access
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.permissions.granted = true;
            this.lastPosition = position;
            resolve(true);
          },
          (error) => {
            this.permissions.granted = false;
            this.handleLocationError(error);
            reject(error);
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 600000
          }
        );
      });
    } catch (error) {
      console.error('Permission request failed:', error);
      throw error;
    }
  }

  /**
   * Start proximity tracking
   */
  async startTracking() {
    if (this.enabled || !this.permissions.granted) return;

    try {
      // Start position watching
      this.watchId = navigator.geolocation.watchPosition(
        (position) => this.handlePositionUpdate(position),
        (error) => this.handleLocationError(error),
        {
          enableHighAccuracy: this.config.enableHighAccuracy,
          timeout: this.config.timeout,
          maximumAge: this.config.maxAge
        }
      );

      // Set up periodic proximity checks
      this.updateInterval = setInterval(() => {
        this.checkProximity();
      }, this.config.updateFrequency);

      this.enabled = true;
      localStorage.setItem('proximity.enabled', 'true');
      
      this.notifySubscribers('tracking_started');
      console.log('✅ Proximity tracking started');

    } catch (error) {
      console.error('Failed to start tracking:', error);
      throw error;
    }
  }

  /**
   * Stop proximity tracking
   */
  stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.enabled = false;
    this.nearbyProfessionals = [];
    localStorage.setItem('proximity.enabled', 'false');
    
    this.notifySubscribers('tracking_stopped');
    console.log('🛑 Proximity tracking stopped');
  }

  /**
   * Handle position updates
   */
  handlePositionUpdate(position) {
    const { coords, timestamp } = position;
    
    // Validate accuracy
    if (coords.accuracy > this.config.accuracyThreshold) {
      console.warn(`Low GPS accuracy: ${coords.accuracy}m`);
      return;
    }

    // Update position
    this.lastPosition = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      timestamp: timestamp,
      speed: coords.speed,
      heading: coords.heading
    };

    this.notifySubscribers('position_updated', this.lastPosition);
  }

  /**
   * Handle location errors
   */
  handleLocationError(error) {
    let message = 'Location error occurred';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'Location access denied';
        this.permissions.granted = false;
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Location information unavailable';
        break;
      case error.TIMEOUT:
        message = 'Location request timed out';
        break;
    }

    console.warn('Proximity error:', message, error);
    this.notifySubscribers('error', { message, error });
  }

  /**
   * Check for nearby professionals
   */
  async checkProximity() {
    if (!this.lastPosition) return;

    try {
      // Send position to server for proximity matching
      const response = await fetch('/api/proximity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: this.lastPosition.latitude,
          longitude: this.lastPosition.longitude,
          accuracy: this.lastPosition.accuracy,
          radius: this.config.proximityRadius
        })
      });

      if (!response.ok) throw new Error('Proximity check failed');

      const data = await response.json();
      const { nearbyProfessionals = [] } = data;

      // Update nearby professionals
      const previousCount = this.nearbyProfessionals.length;
      this.nearbyProfessionals = nearbyProfessionals;

      // Notify of changes
      if (nearbyProfessionals.length !== previousCount) {
        this.notifySubscribers('nearby_changed', {
          nearby: nearbyProfessionals,
          count: nearbyProfessionals.length,
          added: nearbyProfessionals.length > previousCount,
          removed: nearbyProfessionals.length < previousCount
        });
      }

      // Venue-based clustering
      this.checkVenueProximity(nearbyProfessionals);

    } catch (error) {
      console.error('Proximity check failed:', error);
    }
  }

  /**
   * Check venue-based proximity (more privacy-friendly)
   */
  checkVenueProximity(professionals) {
    // Group by venue/location for better privacy
    const venues = {};
    
    professionals.forEach(professional => {
      const venue = professional.venue || 'unknown';
      if (!venues[venue]) {
        venues[venue] = [];
      }
      venues[venue].push(professional);
    });

    // Notify venue-based proximity
    Object.entries(venues).forEach(([venue, people]) => {
      if (people.length > 0) {
        this.notifySubscribers('venue_proximity', {
          venue,
          count: people.length,
          professionals: people
        });
      }
    });
  }

  /**
   * Get current nearby professionals
   */
  getNearbyProfessionals() {
    return [...this.nearbyProfessionals];
  }

  /**
   * Get current position
   */
  getCurrentPosition() {
    return this.lastPosition ? { ...this.lastPosition } : null;
  }

  /**
   * Calculate distance between two coordinates
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Update proximity configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // Restart tracking with new config if enabled
    if (this.enabled) {
      this.stopTracking();
      this.startTracking();
    }
  }

  /**
   * Get privacy-safe location context
   */
  getLocationContext() {
    if (!this.lastPosition) return null;

    // Return venue/area instead of exact coordinates
    return {
      area: 'Cologne Convention Center', // Static for Gamescom
      venue: this.determineVenue(),
      accuracy: this.lastPosition.accuracy > 50 ? 'low' : 'high',
      lastUpdate: this.lastPosition.timestamp
    };
  }

  /**
   * Determine current venue based on coordinates
   */
  determineVenue() {
    if (!this.lastPosition) return 'Unknown';

    // Gamescom venue boundaries (simplified)
    const venues = {
      'Hall 1-3': { lat: 50.9429, lng: 6.9830 },
      'Hall 4-5': { lat: 50.9425, lng: 6.9845 },
      'Hall 6-8': { lat: 50.9421, lng: 6.9860 },
      'Hall 9-10': { lat: 50.9417, lng: 6.9875 },
      'Business Area': { lat: 50.9433, lng: 6.9820 },
      'Outside Area': { lat: 50.9440, lng: 6.9800 }
    };

    let closestVenue = 'Unknown';
    let minDistance = Infinity;

    Object.entries(venues).forEach(([venue, coords]) => {
      const distance = this.calculateDistance(
        this.lastPosition.latitude,
        this.lastPosition.longitude,
        coords.lat,
        coords.lng
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestVenue = venue;
      }
    });

    return minDistance < 200 ? closestVenue : 'Gamescom Area';
  }

  /**
   * Subscribe to proximity events
   */
  subscribe(callback) {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Notify subscribers of events
   */
  notifySubscribers(event, data = {}) {
    this.subscribers.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Proximity subscriber error:', error);
      }
    });
  }

  /**
   * Get proximity status
   */
  getStatus() {
    return {
      enabled: this.enabled,
      hasPermission: this.permissions.granted,
      permissionState: this.permissions.location,
      position: this.lastPosition ? {
        accuracy: this.lastPosition.accuracy,
        age: Date.now() - this.lastPosition.timestamp
      } : null,
      nearbyCount: this.nearbyProfessionals.length,
      venue: this.getLocationContext()?.venue
    };
  }

  /**
   * Export location data (for user data export)
   */
  exportData() {
    return {
      enabled: this.enabled,
      lastPosition: this.lastPosition ? {
        timestamp: this.lastPosition.timestamp,
        accuracy: this.lastPosition.accuracy,
        venue: this.determineVenue()
        // Exclude exact coordinates for privacy
      } : null,
      nearbyHistory: [], // Could include anonymized proximity history
      settings: { ...this.config }
    };
  }

  /**
   * Clear all proximity data
   */
  clearData() {
    this.stopTracking();
    this.lastPosition = null;
    this.nearbyProfessionals = [];
    localStorage.removeItem('proximity.enabled');
    localStorage.removeItem('proximity.lastPosition');
  }

  /**
   * Destroy proximity service
   */
  destroy() {
    this.clearData();
    this.subscribers = [];
    console.log('🗑️ Proximity service destroyed');
  }
}

// Create singleton instance
export const proximity = new ProximityService();

// Export class for testing
export default ProximityService;