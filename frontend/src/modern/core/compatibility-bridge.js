/**
 * Compatibility Bridge
 * Ensures legacy and modern systems work together seamlessly
 */

export class CompatibilityBridge {
  constructor() {
    this.legacyApp = window.UnifiedConferenceApp;
    this.modernCore = window.ModernCore;
    this.eventBus = new EventTarget();
    this.syncMap = new Map();
    
    // Set up bridge if both systems exist
    if (this.legacyApp && this.modernCore) {
      this.setupBridge();
    }
  }
  
  setupBridge() {
    console.log('[Bridge] Setting up compatibility bridge...');
    
    // Sync authentication state
    this.syncAuthState();
    
    // Bridge storage systems
    this.bridgeStorage();
    
    // Unified event system
    this.bridgeEvents();
    
    // Sync data models
    this.syncDataModels();
    
    // API compatibility layer
    this.setupAPICompatibility();
    
    console.log('[Bridge] Compatibility bridge ready');
  }
  
  syncAuthState() {
    // Watch legacy auth changes
    if (this.legacyApp?.currentUser) {
      // Create proxy to track changes
      const handler = {
        set: (target, property, value) => {
          target[property] = value;
          
          // Notify modern system
          this.eventBus.dispatchEvent(
            new CustomEvent('legacy:auth:change', {
              detail: { property, value, user: target }
            })
          );
          
          return true;
        }
      };
      
      if (typeof Proxy !== 'undefined') {
        this.legacyApp.currentUser = new Proxy(this.legacyApp.currentUser, handler);
      }
    }
    
    // Watch modern auth changes
    this.eventBus.addEventListener('modern:auth:change', (event) => {
      if (this.legacyApp && event.detail) {
        // Update legacy user
        Object.assign(this.legacyApp.currentUser || {}, event.detail);
        
        // Update localStorage for legacy compatibility
        localStorage.setItem('unifiedAppUser', JSON.stringify(event.detail));
      }
    });
    
    // Intercept localStorage auth updates
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = (key, value) => {
      originalSetItem.call(localStorage, key, value);
      
      if (key === 'unifiedAppUser' && value) {
        try {
          const user = JSON.parse(value);
          this.eventBus.dispatchEvent(
            new CustomEvent('storage:auth:change', { detail: user })
          );
        } catch (e) {
          console.error('[Bridge] Failed to parse user data:', e);
        }
      }
    };
  }
  
  bridgeStorage() {
    // Create unified storage interface
    const unifiedStorage = {
      // Get from modern or legacy storage
      get(key) {
        // Try modern store first
        if (window.ModernCore?.modules?.has(`store:${key}`)) {
          return window.ModernCore.modules.get(`store:${key}`);
        }
        
        // Try localStorage
        try {
          const stored = localStorage.getItem(key);
          return stored ? JSON.parse(stored) : null;
        } catch {
          return localStorage.getItem(key);
        }
      },
      
      // Set in both systems
      set(key, value) {
        // Store in modern system
        if (window.ModernCore?.modules) {
          window.ModernCore.modules.set(`store:${key}`, value);
        }
        
        // Store in localStorage for legacy
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch {
          localStorage.setItem(key, value);
        }
        
        // Notify listeners
        window.dispatchEvent(
          new CustomEvent('storage:change', {
            detail: { key, value }
          })
        );
      },
      
      // Remove from both systems
      remove(key) {
        if (window.ModernCore?.modules) {
          window.ModernCore.modules.delete(`store:${key}`);
        }
        localStorage.removeItem(key);
      },
      
      // Subscribe to changes
      subscribe(key, callback) {
        const handler = (event) => {
          if (event.detail?.key === key) {
            callback(event.detail.value);
          }
        };
        
        window.addEventListener('storage:change', handler);
        
        // Return unsubscribe function
        return () => {
          window.removeEventListener('storage:change', handler);
        };
      }
    };
    
    // Expose unified storage
    window.UnifiedStorage = unifiedStorage;
  }
  
  bridgeEvents() {
    // Create event mapping between systems
    const eventMap = {
      // Legacy -> Modern
      'party:saved': 'modern:event:saved',
      'connection:created': 'modern:connection:created',
      'user:updated': 'modern:user:updated',
      
      // Modern -> Legacy
      'modern:event:saved': 'party:saved',
      'modern:connection:created': 'connection:created',
      'modern:user:updated': 'user:updated'
    };
    
    // Bridge window events
    Object.entries(eventMap).forEach(([source, target]) => {
      window.addEventListener(source, (event) => {
        window.dispatchEvent(
          new CustomEvent(target, { detail: event.detail })
        );
      });
    });
    
    // Bridge DOM events for components
    const originalDispatchEvent = EventTarget.prototype.dispatchEvent;
    EventTarget.prototype.dispatchEvent = function(event) {
      // Call original
      const result = originalDispatchEvent.call(this, event);
      
      // Bridge specific events to modern system
      if (event.type.startsWith('party:') || event.type.startsWith('connection:')) {
        window.ModernCore?.eventBus?.dispatchEvent(
          new CustomEvent(event.type, { detail: event.detail })
        );
      }
      
      return result;
    };
  }
  
  syncDataModels() {
    // Map between legacy and modern data structures
    this.dataMappers = {
      // Legacy party to modern event
      partyToEvent(party) {
        return {
          id: party.id,
          title: party.name || party.title,
          description: party.description,
          startTime: party.time || party.startTime,
          endTime: party.endTime,
          venue: {
            name: party.venue,
            address: party.address,
            coordinates: party.coordinates
          },
          organizer: party.organizer,
          attendees: party.attendees || [],
          tags: party.tags || [],
          saved: party.saved || false
        };
      },
      
      // Modern event to legacy party
      eventToParty(event) {
        return {
          id: event.id,
          name: event.title,
          title: event.title,
          description: event.description,
          time: event.startTime,
          endTime: event.endTime,
          venue: event.venue?.name,
          address: event.venue?.address,
          coordinates: event.venue?.coordinates,
          organizer: event.organizer,
          attendees: event.attendees,
          tags: event.tags,
          saved: event.saved
        };
      },
      
      // User profile mapping
      userProfile(data, direction = 'legacy-to-modern') {
        if (direction === 'legacy-to-modern') {
          return {
            id: data.id,
            email: data.profile?.email || data.email,
            displayName: data.profile?.name || data.displayName,
            photoURL: data.profile?.photoURL || data.photoURL,
            role: data.profile?.role || data.role || 'attendee',
            company: data.profile?.company || data.company,
            interests: data.interests || [],
            connections: data.connections || [],
            savedEvents: Array.from(data.savedEvents || []),
            preferences: data.preferences || {}
          };
        } else {
          return {
            id: data.id,
            profile: {
              email: data.email,
              name: data.displayName,
              photoURL: data.photoURL,
              role: data.role,
              company: data.company
            },
            interests: data.interests,
            connections: data.connections,
            savedEvents: new Set(data.savedEvents),
            preferences: data.preferences
          };
        }
      }
    };
  }
  
  setupAPICompatibility() {
    // Intercept API responses to transform data
    const originalFetch = window.fetch;
    
    window.fetch = async (url, options) => {
      const response = await originalFetch(url, options);
      
      // Check if this needs data transformation
      if (url.includes('/api/')) {
        // Clone response to read it
        const cloned = response.clone();
        
        try {
          const data = await cloned.json();
          
          // Transform data based on endpoint
          let transformed = data;
          
          if (url.includes('/parties') || url.includes('/events')) {
            // Transform party/event data
            if (Array.isArray(data)) {
              transformed = data.map(item => 
                window.ModernCore?.features?.data 
                  ? this.dataMappers.partyToEvent(item)
                  : item
              );
            } else {
              transformed = window.ModernCore?.features?.data
                ? this.dataMappers.partyToEvent(data)
                : data;
            }
          }
          
          // Create new response with transformed data
          return new Response(JSON.stringify(transformed), {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          });
          
        } catch (e) {
          // If not JSON or transformation fails, return original
          return response;
        }
      }
      
      return response;
    };
  }
  
  // Helper to migrate specific features
  async migrateFeature(featureName) {
    console.log(`[Bridge] Migrating feature: ${featureName}`);
    
    switch (featureName) {
      case 'auth':
        return this.migrateAuth();
      case 'events':
        return this.migrateEvents();
      case 'connections':
        return this.migrateConnections();
      default:
        console.warn(`[Bridge] Unknown feature: ${featureName}`);
        return false;
    }
  }
  
  async migrateAuth() {
    // Load modern auth service
    const authService = await window.ModernCore?.getService('auth');
    if (!authService) return false;
    
    // Migrate existing user to modern system
    if (this.legacyApp?.currentUser) {
      const modernUser = this.dataMappers.userProfile(
        this.legacyApp.currentUser,
        'legacy-to-modern'
      );
      
      await authService.setUser(modernUser);
    }
    
    // Replace legacy auth methods
    if (this.legacyApp) {
      this.legacyApp.signIn = () => authService.signIn();
      this.legacyApp.signOut = () => authService.signOut();
    }
    
    return true;
  }
  
  async migrateEvents() {
    // Load modern events service
    const eventsService = await window.ModernCore?.getService('events');
    if (!eventsService) return false;
    
    // Migrate saved events
    const savedEvents = Array.from(
      this.legacyApp?.currentUser?.savedEvents || []
    );
    
    for (const eventId of savedEvents) {
      await eventsService.saveEvent(eventId);
    }
    
    return true;
  }
  
  async migrateConnections() {
    // Load modern connections service
    const connectionsService = await window.ModernCore?.getService('connections');
    if (!connectionsService) return false;
    
    // Migrate existing connections
    const connections = this.legacyApp?.currentUser?.connections || [];
    
    for (const connection of connections) {
      await connectionsService.addConnection(connection);
    }
    
    return true;
  }
  
  // Get bridge status
  getStatus() {
    return {
      legacy: !!this.legacyApp,
      modern: !!this.modernCore,
      bridged: !!(this.legacyApp && this.modernCore),
      features: {
        auth: this.syncMap.has('auth'),
        storage: !!window.UnifiedStorage,
        events: this.syncMap.has('events'),
        api: this.syncMap.has('api')
      }
    };
  }
}

// Auto-initialize bridge
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.CompatibilityBridge = new CompatibilityBridge();
  });
} else {
  window.CompatibilityBridge = new CompatibilityBridge();
}

export default window.CompatibilityBridge;