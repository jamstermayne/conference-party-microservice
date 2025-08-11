import { Store, Events, EVENTS } from './state.js';

const STORAGE_KEY = 'velocity_app_data';
const SETTINGS_KEY = 'velocity_settings';
const VERSION = '2.1.0';

// Auto-save intervals (in milliseconds)
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds
const DEBOUNCE_DELAY = 1000; // 1 second

let saveTimer = null;
let isLoaded = false;

export function initPersistence() {
  console.log('🔄 Initializing persistence system');
  
  // Load existing data
  loadFromStorage();
  
  // Set up auto-save
  setupAutoSave();
  
  // Listen for state changes
  setupEventListeners();
  
  console.log('✅ Persistence system initialized');
}

function loadFromStorage() {
  try {
    // Load settings
    const settingsData = localStorage.getItem(SETTINGS_KEY);
    if (settingsData) {
      const settings = JSON.parse(settingsData);
      Object.assign(Store.settings, settings);
      console.log('📥 Settings loaded from storage');
    }
    
    // Load main app data
    const appData = localStorage.getItem(STORAGE_KEY);
    if (appData) {
      const data = JSON.parse(appData);
      
      // Verify version compatibility
      if (data.version && isCompatibleVersion(data.version)) {
        // Load profile
        if (data.profile) {
          Store.profile = data.profile;
        }
        
        // Load saved party IDs
        if (data.savedPartyIds && Array.isArray(data.savedPartyIds)) {
          Store.savedPartyIds = new Set(data.savedPartyIds);
        }
        
        // Load invites
        if (data.invites) {
          Object.assign(Store.invites, data.invites);
        }
        
        // Load connections
        if (data.connections && Array.isArray(data.connections)) {
          Store.connections = data.connections;
        }
        
        // Load calendar state
        if (data.calendar) {
          Object.assign(Store.calendar, data.calendar);
        }
        
        // Load flags
        if (data.flags) {
          Object.assign(Store.flags, data.flags);
        }
        
        console.log('📥 App data loaded from storage');
      } else {
        console.warn('⚠️ Incompatible data version, starting fresh');
        migrateOldData(data);
      }
    } else {
      console.log('📝 No existing data found, starting fresh');
    }
    
    isLoaded = true;
    Events.emit(EVENTS.PERSISTENCE_LOADED, { store: Store });
    
  } catch (error) {
    console.error('❌ Failed to load from storage:', error);
    isLoaded = true;
  }
}

function saveToStorage() {
  if (!isLoaded) return; // Don't save until we've loaded
  
  try {
    // Save settings separately (more frequent updates)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(Store.settings));
    
    // Save main app data
    const appData = {
      version: VERSION,
      profile: Store.profile,
      savedPartyIds: [...Store.savedPartyIds],
      invites: Store.invites,
      connections: Store.connections || [],
      calendar: Store.calendar,
      flags: Store.flags,
      lastSaved: Date.now()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    
    console.log('💾 Data saved to storage');
    Events.emit(EVENTS.PERSISTENCE_SAVED, { timestamp: Date.now() });
    
  } catch (error) {
    console.error('❌ Failed to save to storage:', error);
    
    // Handle quota exceeded
    if (error.name === 'QuotaExceededError') {
      Events.emit(EVENTS.STORAGE_QUOTA_EXCEEDED);
      handleStorageQuotaExceeded();
    }
  }
}

function debouncedSave() {
  if (saveTimer) {
    clearTimeout(saveTimer);
  }
  
  saveTimer = setTimeout(() => {
    saveToStorage();
    saveTimer = null;
  }, DEBOUNCE_DELAY);
}

function setupAutoSave() {
  // Auto-save every 30 seconds
  setInterval(() => {
    if (isLoaded) {
      saveToStorage();
    }
  }, AUTO_SAVE_INTERVAL);
  
  // Save before page unload
  window.addEventListener('beforeunload', () => {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveToStorage();
    }
  });
  
  // Save when app becomes hidden (mobile)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && isLoaded) {
      saveToStorage();
    }
  });
}

function setupEventListeners() {
  // Save when profile updates
  Events.on(EVENTS.PROFILE_UPDATED, debouncedSave);
  
  // Save when parties are saved
  Events.on(EVENTS.SAVED_PARTIES, debouncedSave);
  
  // Save when invites change
  Events.on(EVENTS.INVITES_CHANGED, debouncedSave);
  
  // Save when calendar syncs
  Events.on(EVENTS.CAL_SYNCED, debouncedSave);
  
  // Save when settings change
  Events.on(EVENTS.SETTINGS_CHANGED, () => {
    // Settings save immediately (no debounce)
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(Store.settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  });
  
  // Save when bonuses are unlocked
  Events.on(EVENTS.BONUS_UNLOCKED, debouncedSave);
  
  // Save when app is installed
  Events.on(EVENTS.INSTALLED, debouncedSave);
  
  // Clear data on logout
  Events.on(EVENTS.USER_LOGOUT, () => {
    clearUserData();
  });
}

function isCompatibleVersion(version) {
  const [major, minor] = VERSION.split('.').map(Number);
  const [dataMajor, dataMinor] = version.split('.').map(Number);
  
  // Compatible if major version matches
  return major === dataMajor;
}

function migrateOldData(oldData) {
  console.log('🔄 Migrating old data format');
  
  // Try to preserve what we can
  if (oldData.profile) {
    Store.profile = oldData.profile;
  }
  
  if (oldData.savedParties) {
    // Convert old format to new
    Store.savedPartyIds = new Set(oldData.savedParties.map(p => p.id || p.eventId));
  }
  
  if (oldData.invitesSent) {
    Store.invites.sent = oldData.invitesSent;
  }
  
  // Save migrated data
  saveToStorage();
}

function handleStorageQuotaExceeded() {
  console.warn('⚠️ Storage quota exceeded, cleaning up old data');
  
  try {
    // Remove old cache data first
    if ('caches' in window) {
      caches.keys().then(names => {
        // Keep only the latest cache
        names.slice(0, -1).forEach(name => caches.delete(name));
      });
    }
    
    // Trim old activity data
    if (Store.connections && Store.connections.length > 100) {
      Store.connections = Store.connections.slice(-50); // Keep last 50
    }
    
    if (Store.invites.sent && Store.invites.sent.length > 50) {
      Store.invites.sent = Store.invites.sent.slice(-25); // Keep last 25
    }
    
    // Try to save again
    saveToStorage();
    
  } catch (error) {
    console.error('Failed to clean up storage:', error);
    alert('Storage is full. Please clear some data in Settings.');
  }
}

function clearUserData() {
  try {
    // Clear only user data, keep settings
    const settings = Store.settings;
    
    localStorage.removeItem(STORAGE_KEY);
    
    // Reset store to defaults
    Store.profile = null;
    Store.savedPartyIds.clear();
    Store.invites = { left: 10, redeemed: 0, totalGranted: 10, sent: [] };
    Store.connections = [];
    Store.calendar = { google: false, ics: false, mtm: false, lastSync: null };
    
    console.log('🗑️ User data cleared');
    
  } catch (error) {
    console.error('Failed to clear user data:', error);
  }
}

// Export utilities for manual operations
export function exportData() {
  const data = {
    version: VERSION,
    profile: Store.profile,
    savedPartyIds: [...Store.savedPartyIds],
    invites: Store.invites,
    connections: Store.connections || [],
    calendar: Store.calendar,
    settings: Store.settings,
    flags: Store.flags,
    exportedAt: new Date().toISOString()
  };
  
  return JSON.stringify(data, null, 2);
}

export function importData(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    
    if (data.version && isCompatibleVersion(data.version)) {
      // Import the data
      if (data.profile) Store.profile = data.profile;
      if (data.savedPartyIds) Store.savedPartyIds = new Set(data.savedPartyIds);
      if (data.invites) Object.assign(Store.invites, data.invites);
      if (data.connections) Store.connections = data.connections;
      if (data.calendar) Object.assign(Store.calendar, data.calendar);
      if (data.settings) Object.assign(Store.settings, data.settings);
      if (data.flags) Object.assign(Store.flags, data.flags);
      
      saveToStorage();
      
      console.log('📥 Data imported successfully');
      return true;
    } else {
      console.error('Incompatible data version for import');
      return false;
    }
    
  } catch (error) {
    console.error('Failed to import data:', error);
    return false;
  }
}

export function getStorageStats() {
  try {
    let totalSize = 0;
    let itemCount = 0;
    
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length;
        itemCount++;
      }
    }
    
    return {
      totalSize: Math.round(totalSize / 1024), // KB
      itemCount,
      quotaUsed: totalSize / (5 * 1024 * 1024) * 100, // Assume 5MB quota
      lastSaved: Store.lastSaved || null
    };
    
  } catch (error) {
    return { totalSize: 0, itemCount: 0, quotaUsed: 0, lastSaved: null };
  }
}

// Force save (for testing or manual saves)
export function forceSave() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  saveToStorage();
}

// Add new events for persistence
if (!EVENTS.PERSISTENCE_LOADED) EVENTS.PERSISTENCE_LOADED = 'persistence:loaded';
if (!EVENTS.PERSISTENCE_SAVED) EVENTS.PERSISTENCE_SAVED = 'persistence:saved';
if (!EVENTS.STORAGE_QUOTA_EXCEEDED) EVENTS.STORAGE_QUOTA_EXCEEDED = 'storage:quota-exceeded';
if (!EVENTS.USER_LOGOUT) EVENTS.USER_LOGOUT = 'user:logout';
if (!EVENTS.SETTINGS_CHANGED) EVENTS.SETTINGS_CHANGED = 'settings:changed';
if (!EVENTS.PROFILE_UPDATED) EVENTS.PROFILE_UPDATED = 'profile:updated';