/**
 * 🧠 PROFESSIONAL INTELLIGENCE PLATFORM - STATE MANAGEMENT
 * Sophisticated state management with reactive updates and persistence
 */

export class State {
  constructor() {
    this.data = {
      user: null,
      profile: null,
      parties: [],
      invites: [],
      settings: {
        theme: 'dark',
        notifications: true,
        location: true
      },
      cache: new Map(),
      lastSync: null
    };

    this.listeners = new Map();
    this.isHydrated = false;
    
    this.hydrateFromStorage();
    console.log('🧠 State manager initialized');
  }

  /**
   * Hydrate state from localStorage
   */
  hydrateFromStorage() {
    try {
      const stored = localStorage.getItem('intelligence_state');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.data = { ...this.data, ...parsed };
        this.isHydrated = true;
        console.log('💾 State hydrated from storage');
      }
    } catch (error) {
      console.error('❌ Failed to hydrate state:', error);
    }
  }

  /**
   * Persist state to localStorage
   */
  persistToStorage() {
    try {
      const toStore = {
        profile: this.data.profile,
        parties: this.data.parties,
        invites: this.data.invites,
        settings: this.data.settings,
        lastSync: Date.now()
      };
      
      localStorage.setItem('intelligence_state', JSON.stringify(toStore));
      this.data.lastSync = Date.now();
    } catch (error) {
      console.error('❌ Failed to persist state:', error);
    }
  }

  /**
   * Subscribe to state changes
   */
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    
    this.listeners.get(key).add(callback);
    
    return () => {
      const keyListeners = this.listeners.get(key);
      if (keyListeners) {
        keyListeners.delete(callback);
      }
    };
  }

  /**
   * Emit state change to subscribers
   */
  emit(key, data) {
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ State listener error for ${key}:`, error);
        }
      });
    }
  }

  /**
   * Get current user profile
   */
  getProfile() {
    return this.data.profile;
  }

  /**
   * Update user profile
   */
  setProfile(profile) {
    this.data.profile = { ...this.data.profile, ...profile };
    this.emit('profile', this.data.profile);
    this.persistToStorage();
    console.log('👤 Profile updated:', this.data.profile);
  }

  /**
   * Get parties data
   */
  getParties() {
    return this.data.parties || [];
  }

  /**
   * Set parties data
   */
  setParties(parties) {
    this.data.parties = Array.isArray(parties) ? parties : [];
    this.emit('parties', this.data.parties);
    this.persistToStorage();
    console.log('🎉 Parties updated:', this.data.parties.length);
  }

  /**
   * Add or update a single party
   */
  updateParty(party) {
    const index = this.data.parties.findIndex(p => p.id === party.id);
    
    if (index >= 0) {
      this.data.parties[index] = { ...this.data.parties[index], ...party };
    } else {
      this.data.parties.push(party);
    }
    
    this.emit('parties', this.data.parties);
    this.persistToStorage();
  }

  /**
   * Get invites data
   */
  getInvites() {
    return this.data.invites || [];
  }

  /**
   * Set invites data
   */
  setInvites(invites) {
    this.data.invites = Array.isArray(invites) ? invites : [];
    this.emit('invites', this.data.invites);
    this.persistToStorage();
    console.log('📨 Invites updated:', this.data.invites.length);
  }

  /**
   * Add new invite
   */
  addInvite(invite) {
    this.data.invites.unshift(invite);
    this.emit('invites', this.data.invites);
    this.persistToStorage();
  }

  /**
   * Get settings
   */
  getSettings() {
    return this.data.settings;
  }

  /**
   * Update settings
   */
  updateSettings(settings) {
    this.data.settings = { ...this.data.settings, ...settings };
    this.emit('settings', this.data.settings);
    this.persistToStorage();
    console.log('⚙️ Settings updated:', this.data.settings);
  }

  /**
   * Cache management
   */
  setCache(key, value, ttl = 300000) { // 5 minute default TTL
    this.data.cache.set(key, {
      value,
      expires: Date.now() + ttl
    });
  }

  getCache(key) {
    const cached = this.data.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expires) {
      this.data.cache.delete(key);
      return null;
    }
    
    return cached.value;
  }

  clearCache() {
    this.data.cache.clear();
    console.log('🧹 Cache cleared');
  }

  /**
   * Get party by ID
   */
  getPartyById(id) {
    return this.data.parties.find(party => party.id === id);
  }

  /**
   * Toggle party attendance
   */
  togglePartyAttendance(partyId) {
    const party = this.getPartyById(partyId);
    if (!party) return false;

    party.isAttending = !party.isAttending;
    this.updateParty(party);
    
    console.log(`${party.isAttending ? '✅' : '❌'} Attendance toggled for: ${party.name}`);
    return party.isAttending;
  }

  /**
   * Mark party as interested
   */
  togglePartyInterest(partyId) {
    const party = this.getPartyById(partyId);
    if (!party) return false;

    party.isInterested = !party.isInterested;
    this.updateParty(party);
    
    console.log(`${party.isInterested ? '💛' : '🤍'} Interest toggled for: ${party.name}`);
    return party.isInterested;
  }

  /**
   * Get parties by status
   */
  getPartiesByStatus(status) {
    switch (status) {
      case 'attending':
        return this.data.parties.filter(p => p.isAttending);
      case 'interested':
        return this.data.parties.filter(p => p.isInterested && !p.isAttending);
      case 'available':
        return this.data.parties.filter(p => !p.isAttending && !p.isInterested);
      default:
        return this.data.parties;
    }
  }

  /**
   * Get filtered parties
   */
  getFilteredParties(filters = {}) {
    let filtered = [...this.data.parties];

    if (filters.venue) {
      filtered = filtered.filter(p => 
        p.venue?.toLowerCase().includes(filters.venue.toLowerCase())
      );
    }

    if (filters.time) {
      const now = new Date();
      const timeFilter = filters.time;
      
      filtered = filtered.filter(p => {
        const partyTime = new Date(p.datetime);
        const hoursDiff = (partyTime - now) / (1000 * 60 * 60);
        
        switch (timeFilter) {
          case 'tonight':
            return hoursDiff >= 0 && hoursDiff <= 24;
          case 'this-week':
            return hoursDiff >= 0 && hoursDiff <= 168; // 7 days
          case 'upcoming':
            return hoursDiff > 24;
          default:
            return true;
        }
      });
    }

    if (filters.type) {
      filtered = filtered.filter(p => p.type === filters.type);
    }

    return filtered;
  }

  /**
   * Export state for debugging
   */
  exportState() {
    return {
      profile: this.data.profile,
      partiesCount: this.data.parties.length,
      invitesCount: this.data.invites.length,
      settings: this.data.settings,
      lastSync: this.data.lastSync,
      isHydrated: this.isHydrated
    };
  }

  /**
   * Reset state (for debugging)
   */
  reset() {
    this.data = {
      user: null,
      profile: null,
      parties: [],
      invites: [],
      settings: {
        theme: 'dark',
        notifications: true,
        location: true
      },
      cache: new Map(),
      lastSync: null
    };
    
    localStorage.removeItem('intelligence_state');
    console.log('🔄 State reset');
    
    // Notify all listeners
    this.emit('reset', true);
  }

  /**
   * Check if data is stale and needs refresh
   */
  isDataStale(maxAge = 600000) { // 10 minutes default
    if (!this.data.lastSync) return true;
    return (Date.now() - this.data.lastSync) > maxAge;
  }

  /**
   * Get state statistics
   */
  getStats() {
    const attendingCount = this.data.parties.filter(p => p.isAttending).length;
    const interestedCount = this.data.parties.filter(p => p.isInterested).length;
    
    return {
      totalParties: this.data.parties.length,
      attendingParties: attendingCount,
      interestedParties: interestedCount,
      totalInvites: this.data.invites.length,
      unreadInvites: this.data.invites.filter(i => !i.read).length,
      cacheSize: this.data.cache.size,
      isHydrated: this.isHydrated,
      lastSync: this.data.lastSync
    };
  }
}