/**
 * Feature Flags System - Control blast radius of changes
 * Allows gradual rollout and instant rollback of features
 */

class FeatureFlags {
  constructor() {
    this.flags = {
      // Core features - always enabled
      core: {
        navigation: true,
        api: true,
        auth: true,
        parties: true,
        map: true
      },
      
      // Features that can be toggled
      features: {
        calendarSync: true,
        hotspots: true,
        emailSync: true,
        inviteSystem: true,
        pwaInstall: true,
        linkedinAuth: false, // Off by default
        advancedMaps: false,
        aiRecommendations: false,
        
        // Modern Architecture Features (gradual rollout)
        modern_architecture: false, // Master switch for modern system
        modern_auth: false,         // Use modern auth service
        modern_data: false,         // Use modern data layer
        modern_ui: false,           // Use modern UI components
        modern_matching: false,     // Use AI-powered matching
        modern_realtime: false,     // Use real-time updates
        modern_party_cards: false,  // Enhance party cards
        modern_connections: false,  // Modern connection system
        
        // Week 2: Frictionless Identity System
        magic_auth: true,           // Enable magic link authentication
        company_intelligence: true, // Enable company enrichment
        profile_enrichment: true    // Enable profile AI enrichment
      },
      
      // Gradual rollout percentages (0.0 to 1.0)
      rollout: {
        newPartyCards: 1.0,  // 100% rolled out
        infiniteScroll: 1.0, // 100% rolled out
        performanceOptimizations: 0.5, // 50% of users
        experimentalUI: 0.1  // 10% of users
      }
    };
    
    // Load saved overrides
    this.loadOverrides();
    
    // Check URL params for testing
    this.checkURLOverrides();
    
    // Setup remote config check
    this.setupRemoteConfig();
  }
  
  /**
   * Check if a feature is enabled for current user
   */
  isEnabled(feature) {
    // Check kill switch first
    if (this.isKilled(feature)) return false;
    
    // Check explicit overrides
    const override = this.getOverride(feature);
    if (override !== null) return override;
    
    // Check if it's a rollout feature
    if (this.flags.rollout[feature] !== undefined) {
      return this.checkRollout(feature);
    }
    
    // Check standard features
    if (this.flags.features[feature] !== undefined) {
      return this.flags.features[feature];
    }
    
    // Check core features
    if (this.flags.core[feature] !== undefined) {
      return this.flags.core[feature];
    }
    
    // Default to disabled for unknown features
    console.warn(`[FeatureFlags] Unknown feature: ${feature}`);
    return false;
  }
  
  /**
   * Check if feature is emergency disabled
   */
  isKilled(feature) {
    const killSwitches = window.__KILL_SWITCHES__ || {};
    return killSwitches[feature] === true;
  }
  
  /**
   * Get explicit override for feature
   */
  getOverride(feature) {
    // Check localStorage for persistent override
    const stored = localStorage.getItem(`ff_${feature}`);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
    
    // Check session for temporary override
    const session = sessionStorage.getItem(`ff_${feature}`);
    if (session === 'true') return true;
    if (session === 'false') return false;
    
    return null;
  }
  
  /**
   * Check if user is in rollout percentage
   */
  checkRollout(feature) {
    const percentage = this.flags.rollout[feature];
    if (percentage === undefined) return false;
    if (percentage >= 1.0) return true;
    if (percentage <= 0) return false;
    
    // Get stable user hash
    const userId = this.getUserId();
    const hash = this.hashCode(userId + feature);
    const userPercentage = Math.abs(hash % 1000) / 1000;
    
    return userPercentage < percentage;
  }
  
  /**
   * Get stable user ID for rollout decisions
   */
  getUserId() {
    let userId = localStorage.getItem('ff_userId');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('ff_userId', userId);
    }
    return userId;
  }
  
  /**
   * Generate hash code for string
   */
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }
  
  /**
   * Load saved overrides from storage
   */
  loadOverrides() {
    try {
      const saved = localStorage.getItem('ff_overrides');
      if (saved) {
        const overrides = JSON.parse(saved);
        Object.assign(this.flags.features, overrides.features || {});
        Object.assign(this.flags.rollout, overrides.rollout || {});
      }
    } catch (e) {
      console.error('[FeatureFlags] Failed to load overrides:', e);
    }
  }
  
  /**
   * Check URL parameters for testing overrides
   */
  checkURLOverrides() {
    const params = new URLSearchParams(window.location.search);
    
    // Check for feature flags in URL
    for (const [key, value] of params) {
      if (key.startsWith('ff_')) {
        const feature = key.substring(3);
        const enabled = value === 'true' || value === '1';
        
        // Set temporary override for this session
        sessionStorage.setItem(`ff_${feature}`, enabled.toString());
        console.log(`[FeatureFlags] URL override: ${feature} = ${enabled}`);
      }
    }
    
    // Check for special testing modes
    if (params.get('ff_test') === 'all') {
      console.log('[FeatureFlags] Testing mode: All features enabled');
      Object.keys(this.flags.features).forEach(feature => {
        sessionStorage.setItem(`ff_${feature}`, 'true');
      });
    }
    
    if (params.get('ff_test') === 'none') {
      console.log('[FeatureFlags] Testing mode: All features disabled');
      Object.keys(this.flags.features).forEach(feature => {
        sessionStorage.setItem(`ff_${feature}`, 'false');
      });
    }
  }
  
  /**
   * Setup remote configuration checking
   */
  setupRemoteConfig() {
    // Check for remote config every 5 minutes
    this.checkRemoteConfig();
    setInterval(() => this.checkRemoteConfig(), 5 * 60 * 1000);
  }
  
  /**
   * Fetch remote configuration
   */
  async checkRemoteConfig() {
    try {
      // Check if we're in local development
      const isLocalDev = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname.startsWith('192.168.');
      
      if (isLocalDev) {
        // Try local endpoint first in development
        try {
          const response = await fetch('/api/feature-flags');
          if (response.ok) {
            const config = await response.json();
            this.applyRemoteConfig(config);
            return;
          }
        } catch (localError) {
          console.debug('[FeatureFlags] Local config not available, using defaults');
          return;
        }
      }
      
      // Use production API for remote config (only in production)
      if (!isLocalDev) {
        const response = await fetch('https://us-central1-conference-party-app.cloudfunctions.net/apiFn/api/feature-flags', {
          method: 'GET',
          headers: {
            'X-User-Id': this.getUserId()
          }
        });
        
        if (response.ok) {
          const config = await response.json();
          this.applyRemoteConfig(config);
        }
      }
    } catch (e) {
      // Fail silently - use local config
      console.debug('[FeatureFlags] Remote config check failed:', e);
    }
  }
  
  /**
   * Apply remote configuration
   */
  applyRemoteConfig(config) {
    // Update flags with remote config
    if (config.features) {
      Object.assign(this.flags.features, config.features);
    }
    
    if (config.rollout) {
      Object.assign(this.flags.rollout, config.rollout);
    }
    
    if (config.killSwitches) {
      window.__KILL_SWITCHES__ = config.killSwitches;
    }
    
    console.log('[FeatureFlags] Remote config updated');
  }
  
  /**
   * Enable a feature (for testing)
   */
  enable(feature, temporary = false) {
    const storage = temporary ? sessionStorage : localStorage;
    storage.setItem(`ff_${feature}`, 'true');
    console.log(`[FeatureFlags] Enabled: ${feature} (${temporary ? 'temporary' : 'persistent'})`);
  }
  
  /**
   * Disable a feature (for testing)
   */
  disable(feature, temporary = false) {
    const storage = temporary ? sessionStorage : localStorage;
    storage.setItem(`ff_${feature}`, 'false');
    console.log(`[FeatureFlags] Disabled: ${feature} (${temporary ? 'temporary' : 'persistent'})`);
  }
  
  /**
   * Clear all overrides
   */
  clearOverrides() {
    // Clear localStorage overrides
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('ff_')) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear sessionStorage overrides
    const sessionKeys = Object.keys(sessionStorage);
    sessionKeys.forEach(key => {
      if (key.startsWith('ff_')) {
        sessionStorage.removeItem(key);
      }
    });
    
    console.log('[FeatureFlags] All overrides cleared');
  }
  
  /**
   * Get current status of all flags
   */
  getStatus() {
    const status = {
      core: {},
      features: {},
      rollout: {},
      overrides: {}
    };
    
    // Check core features
    Object.keys(this.flags.core).forEach(feature => {
      status.core[feature] = this.isEnabled(feature);
    });
    
    // Check toggleable features
    Object.keys(this.flags.features).forEach(feature => {
      status.features[feature] = this.isEnabled(feature);
      
      // Check for overrides
      const override = this.getOverride(feature);
      if (override !== null) {
        status.overrides[feature] = override;
      }
    });
    
    // Check rollout features
    Object.keys(this.flags.rollout).forEach(feature => {
      status.rollout[feature] = {
        percentage: this.flags.rollout[feature],
        enabled: this.isEnabled(feature)
      };
    });
    
    return status;
  }
  
  /**
   * Log current feature flag status
   */
  logStatus() {
    const status = this.getStatus();
    
    console.group('[FeatureFlags] Current Status');
    console.log('Core Features:', status.core);
    console.log('Feature Toggles:', status.features);
    console.log('Rollout Features:', status.rollout);
    if (Object.keys(status.overrides).length > 0) {
      console.log('Active Overrides:', status.overrides);
    }
    console.groupEnd();
  }
}

// Create singleton instance
window.FeatureFlags = new FeatureFlags();

// Export for module usage (only if loaded as module)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.FeatureFlags;
}