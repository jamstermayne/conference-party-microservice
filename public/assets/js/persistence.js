/**
 * 💾 PROFESSIONAL INTELLIGENCE PLATFORM - PERSISTENCE LAYER
 * Advanced data persistence with IndexedDB and localStorage fallback
 */

const DB_NAME = 'IntelligencePlatformDB';
const DB_VERSION = 1;
const STORES = {
  parties: 'parties',
  profile: 'profile',
  invites: 'invites',
  cache: 'cache',
  settings: 'settings'
};

let db = null;
let isIndexedDBSupported = false;

/**
 * Initialize persistence layer
 */
export async function initPersistence() {
  console.log('💾 Initializing persistence layer...');
  
  // Check IndexedDB support
  if ('indexedDB' in window) {
    try {
      await initIndexedDB();
      isIndexedDBSupported = true;
      console.log('✅ IndexedDB initialized successfully');
    } catch (error) {
      console.warn('⚠️ IndexedDB initialization failed, falling back to localStorage:', error);
      isIndexedDBSupported = false;
    }
  } else {
    console.warn('⚠️ IndexedDB not supported, using localStorage');
    isIndexedDBSupported = false;
  }
  
  // Initialize storage cleanup
  initStorageCleanup();
  
  console.log(`💾 Persistence layer ready (${isIndexedDBSupported ? 'IndexedDB' : 'localStorage'})`);
}

/**
 * Initialize IndexedDB
 */
function initIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores
      Object.values(STORES).forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          
          // Add indexes for common queries
          if (storeName === 'parties') {
            store.createIndex('datetime', 'datetime');
            store.createIndex('venue', 'venue');
            store.createIndex('isAttending', 'isAttending');
          }
          
          if (storeName === 'cache') {
            store.createIndex('expires', 'expires');
          }
        }
      });
    };
  });
}

/**
 * Save data to persistent storage
 */
export async function saveData(storeName, data) {
  if (!Object.values(STORES).includes(storeName)) {
    throw new Error(`Invalid store name: ${storeName}`);
  }
  
  if (isIndexedDBSupported && db) {
    return saveToIndexedDB(storeName, data);
  } else {
    return saveToLocalStorage(storeName, data);
  }
}

/**
 * Load data from persistent storage
 */
export async function loadData(storeName, key = null) {
  if (!Object.values(STORES).includes(storeName)) {
    throw new Error(`Invalid store name: ${storeName}`);
  }
  
  if (isIndexedDBSupported && db) {
    return loadFromIndexedDB(storeName, key);
  } else {
    return loadFromLocalStorage(storeName, key);
  }
}

/**
 * Delete data from persistent storage
 */
export async function deleteData(storeName, key) {
  if (isIndexedDBSupported && db) {
    return deleteFromIndexedDB(storeName, key);
  } else {
    return deleteFromLocalStorage(storeName, key);
  }
}

/**
 * Clear entire store
 */
export async function clearStore(storeName) {
  if (isIndexedDBSupported && db) {
    return clearIndexedDBStore(storeName);
  } else {
    return clearLocalStorageStore(storeName);
  }
}

/**
 * Save to IndexedDB
 */
function saveToIndexedDB(storeName, data) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    // Add timestamp if not present
    const dataWithMeta = {
      ...data,
      updatedAt: Date.now(),
      id: data.id || generateId()
    };
    
    const request = store.put(dataWithMeta);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Load from IndexedDB
 */
function loadFromIndexedDB(storeName, key = null) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    if (key) {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    } else {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    }
  });
}

/**
 * Delete from IndexedDB
 */
function deleteFromIndexedDB(storeName, key) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);
    
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear IndexedDB store
 */
function clearIndexedDBStore(storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();
    
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save to localStorage with compression
 */
function saveToLocalStorage(storeName, data) {
  try {
    const key = `intelligence_${storeName}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    
    // Handle single item vs array
    if (Array.isArray(data)) {
      localStorage.setItem(key, JSON.stringify(data));
    } else {
      // Upsert single item
      const index = existing.findIndex(item => item.id === data.id);
      if (index >= 0) {
        existing[index] = { ...existing[index], ...data, updatedAt: Date.now() };
      } else {
        existing.push({ ...data, id: data.id || generateId(), updatedAt: Date.now() });
      }
      localStorage.setItem(key, JSON.stringify(existing));
    }
    
    console.log(`💾 Saved to localStorage: ${storeName}`);
    return Promise.resolve(true);
  } catch (error) {
    console.error(`❌ localStorage save failed for ${storeName}:`, error);
    return Promise.reject(error);
  }
}

/**
 * Load from localStorage
 */
function loadFromLocalStorage(storeName, key = null) {
  try {
    const storageKey = `intelligence_${storeName}`;
    const data = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    if (key) {
      const item = data.find(item => item.id === key);
      return Promise.resolve(item || null);
    }
    
    return Promise.resolve(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error(`❌ localStorage load failed for ${storeName}:`, error);
    return Promise.resolve([]);
  }
}

/**
 * Delete from localStorage
 */
function deleteFromLocalStorage(storeName, key) {
  try {
    const storageKey = `intelligence_${storeName}`;
    const data = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const filtered = data.filter(item => item.id !== key);
    localStorage.setItem(storageKey, JSON.stringify(filtered));
    
    console.log(`🗑️ Deleted from localStorage: ${storeName}/${key}`);
    return Promise.resolve(true);
  } catch (error) {
    console.error(`❌ localStorage delete failed for ${storeName}:`, error);
    return Promise.reject(error);
  }
}

/**
 * Clear localStorage store
 */
function clearLocalStorageStore(storeName) {
  try {
    const storageKey = `intelligence_${storeName}`;
    localStorage.removeItem(storageKey);
    
    console.log(`🧹 Cleared localStorage store: ${storeName}`);
    return Promise.resolve(true);
  } catch (error) {
    console.error(`❌ localStorage clear failed for ${storeName}:`, error);
    return Promise.reject(error);
  }
}

/**
 * Cache management with TTL
 */
export async function setCache(key, value, ttl = 300000) { // 5 minutes default
  const cacheData = {
    id: key,
    value: value,
    expires: Date.now() + ttl,
    createdAt: Date.now()
  };
  
  return saveData(STORES.cache, cacheData);
}

/**
 * Get cached value
 */
export async function getCache(key) {
  try {
    const cached = await loadData(STORES.cache, key);
    
    if (!cached) return null;
    
    if (Date.now() > cached.expires) {
      await deleteData(STORES.cache, key);
      return null;
    }
    
    return cached.value;
  } catch (error) {
    console.error(`❌ Cache get failed for ${key}:`, error);
    return null;
  }
}

/**
 * Save user profile
 */
export async function saveProfile(profile) {
  const profileData = {
    id: 'user_profile',
    ...profile,
    lastUpdated: Date.now()
  };
  
  return saveData(STORES.profile, profileData);
}

/**
 * Load user profile
 */
export async function loadProfile() {
  try {
    const profile = await loadData(STORES.profile, 'user_profile');
    return profile || null;
  } catch (error) {
    console.error('❌ Profile load failed:', error);
    return null;
  }
}

/**
 * Save parties data
 */
export async function saveParties(parties) {
  if (!Array.isArray(parties)) return Promise.reject('Parties must be an array');
  
  // Clear existing parties and save new ones
  await clearStore(STORES.parties);
  
  const savePromises = parties.map(party => saveData(STORES.parties, {
    ...party,
    id: party.id || generateId()
  }));
  
  return Promise.all(savePromises);
}

/**
 * Load parties data
 */
export async function loadParties() {
  try {
    const parties = await loadData(STORES.parties);
    return parties || [];
  } catch (error) {
    console.error('❌ Parties load failed:', error);
    return [];
  }
}

/**
 * Save app settings
 */
export async function saveSettings(settings) {
  const settingsData = {
    id: 'app_settings',
    ...settings,
    lastUpdated: Date.now()
  };
  
  return saveData(STORES.settings, settingsData);
}

/**
 * Load app settings
 */
export async function loadSettings() {
  try {
    const settings = await loadData(STORES.settings, 'app_settings');
    return settings || {
      theme: 'dark',
      notifications: true,
      location: true
    };
  } catch (error) {
    console.error('❌ Settings load failed:', error);
    return { theme: 'dark', notifications: true, location: true };
  }
}

/**
 * Initialize storage cleanup
 */
function initStorageCleanup() {
  // Clean expired cache entries every 5 minutes
  setInterval(async () => {
    try {
      await cleanExpiredCache();
    } catch (error) {
      console.error('❌ Cache cleanup failed:', error);
    }
  }, 300000); // 5 minutes
  
  console.log('🧹 Storage cleanup scheduled');
}

/**
 * Clean expired cache entries
 */
async function cleanExpiredCache() {
  if (isIndexedDBSupported && db) {
    const transaction = db.transaction([STORES.cache], 'readwrite');
    const store = transaction.objectStore(STORES.cache);
    const index = store.index('expires');
    const range = IDBKeyRange.upperBound(Date.now());
    
    return new Promise((resolve, reject) => {
      const request = index.openCursor(range);
      let deletedCount = 0;
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          if (deletedCount > 0) {
            console.log(`🧹 Cleaned ${deletedCount} expired cache entries`);
          }
          resolve(deletedCount);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  } else {
    // localStorage cleanup
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith('intelligence_cache'));
    let deletedCount = 0;
    
    for (const key of cacheKeys) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        const filtered = data.filter(item => Date.now() <= item.expires);
        
        if (filtered.length < data.length) {
          localStorage.setItem(key, JSON.stringify(filtered));
          deletedCount += data.length - filtered.length;
        }
      } catch (error) {
        console.error(`❌ Error cleaning cache key ${key}:`, error);
      }
    }
    
    if (deletedCount > 0) {
      console.log(`🧹 Cleaned ${deletedCount} expired localStorage cache entries`);
    }
  }
}

/**
 * Generate unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Get storage statistics
 */
export async function getStorageStats() {
  const stats = {
    type: isIndexedDBSupported ? 'IndexedDB' : 'localStorage',
    isSupported: isIndexedDBSupported,
    stores: {}
  };
  
  // Get store sizes
  for (const storeName of Object.values(STORES)) {
    try {
      const data = await loadData(storeName);
      stats.stores[storeName] = Array.isArray(data) ? data.length : (data ? 1 : 0);
    } catch (error) {
      stats.stores[storeName] = 0;
    }
  }
  
  // Get localStorage usage if available
  if (typeof navigator !== 'undefined' && 'storage' in navigator) {
    try {
      const estimate = await navigator.storage.estimate();
      stats.quota = estimate.quota;
      stats.usage = estimate.usage;
      stats.percentage = Math.round((estimate.usage / estimate.quota) * 100);
    } catch (error) {
      console.warn('Storage API not available');
    }
  }
  
  return stats;
}

/**
 * Export all data for backup
 */
export async function exportData() {
  const exportData = {
    timestamp: Date.now(),
    version: DB_VERSION,
    data: {}
  };
  
  for (const storeName of Object.values(STORES)) {
    try {
      exportData.data[storeName] = await loadData(storeName);
    } catch (error) {
      console.error(`❌ Export failed for store ${storeName}:`, error);
      exportData.data[storeName] = [];
    }
  }
  
  return exportData;
}

/**
 * Import data from backup
 */
export async function importData(backupData) {
  if (!backupData || !backupData.data) {
    throw new Error('Invalid backup data format');
  }
  
  console.log('📥 Importing backup data...');
  
  for (const [storeName, storeData] of Object.entries(backupData.data)) {
    if (Object.values(STORES).includes(storeName)) {
      try {
        if (Array.isArray(storeData)) {
          for (const item of storeData) {
            await saveData(storeName, item);
          }
        } else if (storeData) {
          await saveData(storeName, storeData);
        }
        console.log(`✅ Imported ${storeName}: ${Array.isArray(storeData) ? storeData.length : 1} items`);
      } catch (error) {
        console.error(`❌ Import failed for store ${storeName}:`, error);
      }
    }
  }
  
  console.log('📥 Data import completed');
}

// Export store constants for external use
export { STORES };