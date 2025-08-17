/**
 * 🎮 GAMESCOM 2025 - ADVANCED PARTY CACHE MANAGER
 * 
 * Multi-layer caching system for party data
 * Production-grade offline capabilities
 * Background sync and intelligent cache invalidation
 */

class PartyCacheManager {
  constructor() {
    this.version = '1.0.0';
    this.dbName = 'GamescomPartyCache';
    this.dbVersion = 1;
    
    // Cache layers
    this.memoryCache = new Map();
    this.sessionCache = new Map();
    this.idb = null;
    
    // Configuration
    this.config = {
      memoryTTL: 5 * 60 * 1000,      // 5 minutes
      sessionTTL: 30 * 60 * 1000,    // 30 minutes
      persistentTTL: 24 * 60 * 60 * 1000, // 24 hours
      maxMemorySize: 100,             // Max items in memory
      maxSessionSize: 500,            // Max items in session
      syncInterval: 60 * 1000,        // 1 minute sync check
      retryAttempts: 3,
      retryDelay: 1000
    };
    
    // Metrics tracking
    this.metrics = {
      hits: { memory: 0, session: 0, persistent: 0, network: 0 },
      misses: { memory: 0, session: 0, persistent: 0, network: 0 },
      errors: { memory: 0, session: 0, persistent: 0, network: 0 },
      syncAttempts: 0,
      syncFailures: 0,
      cacheSize: { memory: 0, session: 0, persistent: 0 }
    };
    
    // Background sync management
    this.syncQueue = new Set();
    this.syncInProgress = false;
    this.lastSync = null;
    
    this.init();
  }

  async init() {
    try {
      await this.initIndexedDB();
      this.setupBackgroundSync();
      this.setupStorageEventListeners();
      this.startPeriodicSync();
      
      console.log('[PartyCacheManager] Initialized successfully');
    } catch (error) {
      console.error('[PartyCacheManager] Initialization failed:', error);
    }
  }

  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => {
        console.warn('[Cache] IndexedDB unavailable');
        resolve(null);
      };
      
      request.onsuccess = () => {
        this.idb = request.result;
        this.setupDBErrorHandling();
        resolve(this.idb);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Parties store
        if (!db.objectStoreNames.contains('parties')) {
          const partiesStore = db.createObjectStore('parties', { keyPath: 'id' });
          partiesStore.createIndex('category', 'category', { unique: false });
          partiesStore.createIndex('venue', 'venue', { unique: false });
          partiesStore.createIndex('date', 'date', { unique: false });
          partiesStore.createIndex('cached_at', 'cached_at', { unique: false });
        }
        
        // Cache metadata store
        if (!db.objectStoreNames.contains('cache_meta')) {
          const metaStore = db.createObjectStore('cache_meta', { keyPath: 'key' });
          metaStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // Sync queue store
        if (!db.objectStoreNames.contains('sync_queue')) {
          const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('priority', 'priority', { unique: false });
        }
      };
    });
  }

  setupDBErrorHandling() {
    if (this.idb) {
      this.idb.onerror = (event) => {
        console.error('[Cache] IndexedDB error:', event.target.error);
        this.metrics.errors.persistent++;
      };
      
      this.idb.onversionchange = () => {
        this.idb.close();
        console.warn('[Cache] Database version changed, reinitializing...');
        this.initIndexedDB();
      };
    }
  }

  setupBackgroundSync() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        // Register background sync
        registration.sync.register('party-data-sync').catch(error => {
          console.warn('[Cache] Background sync registration failed:', error);
        });
      });
    }
  }

  setupStorageEventListeners() {
    // Listen for storage changes in other tabs
    window.addEventListener('storage', (event) => {
      if (event.key?.startsWith('party_cache_')) {
        this.invalidateMemoryCache();
      }
    });
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.triggerSync();
    });
    
    window.addEventListener('offline', () => {
      console.log('[Cache] Device went offline, switching to cache-only mode');
    });
  }

  startPeriodicSync() {
    setInterval(() => {
      if (navigator.onLine && !this.syncInProgress) {
        this.triggerSync();
      }
    }, this.config.syncInterval);
  }

  // Core caching methods
  async get(key, options = {}) {
    const { useMemory = true, useSession = true, usePersistent = true, useNetwork = true } = options;
    
    try {
      // Layer 1: Memory cache
      if (useMemory && this.memoryCache.has(key)) {
        const cached = this.memoryCache.get(key);
        if (this.isValid(cached, this.config.memoryTTL)) {
          this.metrics.hits.memory++;
          return cached.data;
        } else {
          this.memoryCache.delete(key);
        }
      }
      this.metrics.misses.memory++;

      // Layer 2: Session cache
      if (useSession && this.sessionCache.has(key)) {
        const cached = this.sessionCache.get(key);
        if (this.isValid(cached, this.config.sessionTTL)) {
          this.metrics.hits.session++;
          // Promote to memory cache
          this.setMemoryCache(key, cached.data);
          return cached.data;
        } else {
          this.sessionCache.delete(key);
        }
      }
      this.metrics.misses.session++;

      // Layer 3: Persistent cache (IndexedDB)
      if (usePersistent && this.idb) {
        const cached = await this.getPersistentCache(key);
        if (cached && this.isValid(cached, this.config.persistentTTL)) {
          this.metrics.hits.persistent++;
          // Promote to higher cache layers
          this.setSessionCache(key, cached.data);
          this.setMemoryCache(key, cached.data);
          return cached.data;
        }
      }
      this.metrics.misses.persistent++;

      // Layer 4: Network (handled by caller)
      if (useNetwork) {
        this.metrics.misses.network++;
        return null;
      }

      return null;
      
    } catch (error) {
      console.error(`[Cache] Failed to get ${key}:`, error);
      this.metrics.errors.memory++;
      return null;
    }
  }

  async set(key, data, options = {}) {
    const { 
      setMemory = true, 
      setSession = true, 
      setPersistent = true,
      priority = 'normal'
    } = options;
    
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        priority,
        key
      };

      // Set in memory cache
      if (setMemory) {
        this.setMemoryCache(key, data);
      }

      // Set in session cache
      if (setSession) {
        this.setSessionCache(key, data);
      }

      // Set in persistent cache
      if (setPersistent && this.idb) {
        await this.setPersistentCache(key, cacheItem);
      }

      // Update cache size metrics
      this.updateCacheSizeMetrics();
      
    } catch (error) {
      console.error(`[Cache] Failed to set ${key}:`, error);
      this.metrics.errors.memory++;
    }
  }

  setMemoryCache(key, data) {
    // Implement LRU eviction if cache is full
    if (this.memoryCache.size >= this.config.maxMemorySize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }
    
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  setSessionCache(key, data) {
    // Implement LRU eviction if cache is full
    if (this.sessionCache.size >= this.config.maxSessionSize) {
      const firstKey = this.sessionCache.keys().next().value;
      this.sessionCache.delete(firstKey);
    }
    
    this.sessionCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  async getPersistentCache(key) {
    if (!this.idb) return null;
    
    try {
      const transaction = this.idb.transaction(['cache_meta'], 'readonly');
      const store = transaction.objectStore('cache_meta');
      const request = store.get(key);
      
      return new Promise((resolve) => {
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => {
          this.metrics.errors.persistent++;
          resolve(null);
        };
      });
    } catch (error) {
      this.metrics.errors.persistent++;
      return null;
    }
  }

  async setPersistentCache(key, cacheItem) {
    if (!this.idb) return;
    
    try {
      const transaction = this.idb.transaction(['cache_meta'], 'readwrite');
      const store = transaction.objectStore('cache_meta');
      
      await new Promise((resolve, reject) => {
        const request = store.put(cacheItem);
        request.onsuccess = () => resolve();
        request.onerror = () => {
          this.metrics.errors.persistent++;
          reject(request.error);
        };
      });
    } catch (error) {
      console.warn(`[Cache] Failed to set persistent cache for ${key}:`, error);
      this.metrics.errors.persistent++;
    }
  }

  // Party-specific methods
  async getParties(options = {}) {
    const cacheKey = 'parties_list';
    
    // Try cache first
    let parties = await this.get(cacheKey, options);
    
    if (!parties && options.useNetwork !== false) {
      // Fetch from network
      try {
        parties = await this.fetchPartiesFromNetwork();
        if (parties && parties.length > 0) {
          await this.setParties(parties);
          this.metrics.hits.network++;
        }
      } catch (error) {
        console.error('[Cache] Network fetch failed:', error);
        this.metrics.errors.network++;
        
        // Return stale cache data if available
        parties = await this.get(cacheKey, { useNetwork: false });
      }
    }
    
    return parties || [];
  }

  async setParties(parties) {
    const timestamp = Date.now();
    
    // Cache the full list
    await this.set('parties_list', parties, { priority: 'high' });
    
    // Cache individual parties
    if (this.idb) {
      try {
        const transaction = this.idb.transaction(['parties'], 'readwrite');
        const store = transaction.objectStore('parties');
        
        // Clear old data
        await store.clear();
        
        // Add new data
        for (const party of parties) {
          await store.add({
            ...party,
            cached_at: timestamp
          });
        }
        
        console.log(`[Cache] Cached ${parties.length} parties to IndexedDB`);
      } catch (error) {
        console.warn('[Cache] Failed to cache parties to IndexedDB:', error);
      }
    }
  }

  async getParty(partyId) {
    const cacheKey = `party_${partyId}`;
    
    // Try cache first
    let party = await this.get(cacheKey);
    
    if (!party && this.idb) {
      // Try to get from parties store
      try {
        const transaction = this.idb.transaction(['parties'], 'readonly');
        const store = transaction.objectStore('parties');
        const request = store.get(partyId);
        
        party = await new Promise((resolve) => {
          request.onsuccess = () => {
            const result = request.result;
            if (result && this.isValid({ timestamp: result.cached_at }, this.config.persistentTTL)) {
              resolve(result);
            } else {
              resolve(null);
            }
          };
          request.onerror = () => resolve(null);
        });
        
        if (party) {
          // Promote to higher cache layers
          await this.set(cacheKey, party, { setPersistent: false });
        }
      } catch (error) {
        console.warn(`[Cache] Failed to get party ${partyId} from IndexedDB:`, error);
      }
    }
    
    return party;
  }

  async fetchPartiesFromNetwork() {
    const { fetchParties } = await import('./api-lite.js');
    return await fetchParties();
  }

  // Background sync methods
  async triggerSync() {
    if (this.syncInProgress || !navigator.onLine) {
      return;
    }
    
    this.syncInProgress = true;
    this.metrics.syncAttempts++;
    
    try {
      console.log('[Cache] Starting background sync...');
      
      // Fetch fresh party data
      const freshParties = await this.fetchPartiesFromNetwork();
      
      if (freshParties && freshParties.length > 0) {
        await this.setParties(freshParties);
        this.lastSync = Date.now();
        
        // Dispatch sync event for UI updates
        window.dispatchEvent(new CustomEvent('party-cache-updated', {
          detail: { parties: freshParties, timestamp: this.lastSync }
        }));
        
        console.log('[Cache] Background sync completed successfully');
      }
      
    } catch (error) {
      console.error('[Cache] Background sync failed:', error);
      this.metrics.syncFailures++;
    } finally {
      this.syncInProgress = false;
    }
  }

  // Cache management
  async clearCache(options = {}) {
    const { clearMemory = true, clearSession = true, clearPersistent = true } = options;
    
    try {
      if (clearMemory) {
        this.memoryCache.clear();
      }
      
      if (clearSession) {
        this.sessionCache.clear();
      }
      
      if (clearPersistent && this.idb) {
        const transaction = this.idb.transaction(['parties', 'cache_meta'], 'readwrite');
        await Promise.all([
          transaction.objectStore('parties').clear(),
          transaction.objectStore('cache_meta').clear()
        ]);
      }
      
      console.log('[Cache] Cache cleared successfully');
      this.updateCacheSizeMetrics();
      
    } catch (error) {
      console.error('[Cache] Failed to clear cache:', error);
    }
  }

  async invalidateCache(pattern) {
    // Invalidate memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }
    
    // Invalidate session cache
    for (const key of this.sessionCache.keys()) {
      if (key.includes(pattern)) {
        this.sessionCache.delete(key);
      }
    }
    
    // Trigger background sync to refresh data
    this.triggerSync();
  }

  invalidateMemoryCache() {
    this.memoryCache.clear();
    this.sessionCache.clear();
    this.updateCacheSizeMetrics();
  }

  // Utility methods
  isValid(cached, ttl) {
    if (!cached || !cached.timestamp) return false;
    return (Date.now() - cached.timestamp) < ttl;
  }

  updateCacheSizeMetrics() {
    this.metrics.cacheSize = {
      memory: this.memoryCache.size,
      session: this.sessionCache.size,
      persistent: 0 // Updated separately for IndexedDB
    };
  }

  // Analytics and monitoring
  getMetrics() {
    const hitRate = {
      memory: this.metrics.hits.memory / (this.metrics.hits.memory + this.metrics.misses.memory) || 0,
      session: this.metrics.hits.session / (this.metrics.hits.session + this.metrics.misses.session) || 0,
      persistent: this.metrics.hits.persistent / (this.metrics.hits.persistent + this.metrics.misses.persistent) || 0,
      overall: (this.metrics.hits.memory + this.metrics.hits.session + this.metrics.hits.persistent) / 
               (this.metrics.hits.memory + this.metrics.hits.session + this.metrics.hits.persistent + 
                this.metrics.misses.memory + this.metrics.misses.session + this.metrics.misses.persistent) || 0
    };
    
    return {
      ...this.metrics,
      hitRate,
      lastSync: this.lastSync,
      syncInProgress: this.syncInProgress,
      isOnline: navigator.onLine
    };
  }

  // Health check
  async healthCheck() {
    const health = {
      status: 'healthy',
      timestamp: Date.now(),
      checks: {
        memoryCache: this.memoryCache.size > 0,
        sessionCache: this.sessionCache.size > 0,
        indexedDB: !!this.idb,
        networkConnectivity: navigator.onLine
      }
    };
    
    // Test IndexedDB connectivity
    if (this.idb) {
      try {
        const transaction = this.idb.transaction(['cache_meta'], 'readonly');
        const store = transaction.objectStore('cache_meta');
        await new Promise((resolve, reject) => {
          const request = store.count();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
        health.checks.indexedDBConnectivity = true;
      } catch (error) {
        health.checks.indexedDBConnectivity = false;
        health.status = 'degraded';
      }
    }
    
    // Check sync health
    if (this.metrics.syncFailures > 5) {
      health.status = 'degraded';
      health.checks.syncHealth = false;
    } else {
      health.checks.syncHealth = true;
    }
    
    return health;
  }

  // Cleanup and destruction
  destroy() {
    // Clear timers
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    // Clear caches
    this.memoryCache.clear();
    this.sessionCache.clear();
    
    // Close IndexedDB connection
    if (this.idb) {
      this.idb.close();
    }
    
    console.log('[PartyCacheManager] Destroyed successfully');
  }
}

// Export singleton instance
export default new PartyCacheManager();