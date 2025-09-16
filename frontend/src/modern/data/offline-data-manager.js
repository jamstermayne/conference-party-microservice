/**
 * Offline Data Manager
 * Handles offline data storage with Firestore sync
 */

export class OfflineDataManager {
  constructor() {
    this.db = null;
    this.syncQueue = [];
    this.currentUserId = null;
    this.listeners = new Map();
    this.isInitialized = false;
  }
  
  /**
   * Initialize IndexedDB and setup listeners
   */
  async initialize(userId = 'anonymous') {
    this.currentUserId = userId;
    
    // Open IndexedDB
    await this.openDatabase();
    
    // Setup network listeners
    this.setupNetworkListeners();
    
    // Setup real-time sync if online
    if (navigator.onLine) {
      this.setupRealTimeSync();
    }
    
    // Process any pending sync operations
    await this.processSyncQueue();
    
    this.isInitialized = true;
    console.log('OfflineDataManager initialized');
  }
  
  /**
   * Open IndexedDB database
   */
  async openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('conference-intelligence', 2);
      
      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB opened successfully');
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores for offline data
        const stores = [
          'matches',
          'connections',
          'conversations',
          'gatherings',
          'events',
          'messages'
        ];
        
        for (const storeName of stores) {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            
            // Add additional indexes based on store type
            if (storeName === 'matches') {
              store.createIndex('score', 'score.overall', { unique: false });
            }
            if (storeName === 'connections') {
              store.createIndex('status', 'status', { unique: false });
            }
            if (storeName === 'conversations') {
              store.createIndex('lastMessageTime', 'lastMessageTime', { unique: false });
            }
            if (storeName === 'gatherings') {
              store.createIndex('startTime', 'startTime', { unique: false });
            }
          }
        }
        
        // User profile store
        if (!db.objectStoreNames.contains('userProfile')) {
          db.createObjectStore('userProfile', { keyPath: 'id' });
        }
        
        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { 
            keyPath: 'id',
            autoIncrement: true 
          });
          syncStore.createIndex('type', 'type', { unique: false });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // Metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }
  
  /**
   * Setup real-time Firestore sync
   */
  async setupRealTimeSync() {
    // Note: In production, this would use actual Firestore SDK
    // For now, we'll simulate with API calls
    
    console.log('Setting up real-time sync...');
    
    // Sync matches
    this.setupDataSync('matches', '/api/matches', 60000); // 1 minute
    
    // Sync connections
    this.setupDataSync('connections', '/api/connections', 30000); // 30 seconds
    
    // Sync conversations
    this.setupDataSync('conversations', '/api/conversations', 30000); // 30 seconds
    
    // Sync gatherings/events
    this.setupDataSync('gatherings', '/api/gatherings', 120000); // 2 minutes
    
    // Sync user profile
    this.setupDataSync('userProfile', '/api/profile', 300000); // 5 minutes
  }
  
  /**
   * Setup periodic sync for a data type
   */
  setupDataSync(storeName, endpoint, interval) {
    // Clear existing listener if any
    if (this.listeners.has(storeName)) {
      clearInterval(this.listeners.get(storeName));
    }
    
    // Initial sync
    this.syncFromNetwork(storeName, endpoint);
    
    // Setup periodic sync
    const intervalId = setInterval(() => {
      if (navigator.onLine) {
        this.syncFromNetwork(storeName, endpoint);
      }
    }, interval);
    
    this.listeners.set(storeName, intervalId);
  }
  
  /**
   * Sync data from network
   */
  async syncFromNetwork(storeName, endpoint) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          'X-User-ID': this.currentUserId
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${storeName}: ${response.status}`);
      }
      
      const data = await response.json();
      await this.updateOfflineData(storeName, data.items || data);
      
      // Update last sync time
      await this.updateMetadata(`${storeName}_lastSync`, new Date().toISOString());
      
      console.log(`Synced ${storeName} from network`);
    } catch (error) {
      console.error(`Failed to sync ${storeName}:`, error);
    }
  }
  
  /**
   * Get data (offline-first)
   */
  async getData(storeName, options = {}) {
    if (!this.db) await this.openDatabase();
    
    try {
      // Try offline first
      const offlineData = await this.getOfflineData(storeName, options);
      
      if (offlineData.length > 0) {
        // Check if data is stale
        const lastSync = await this.getMetadata(`${storeName}_lastSync`);
        const isStale = this.isDataStale(lastSync, options.maxAge || 300000); // 5 min default
        
        if (!isStale) {
          return offlineData;
        }
      }
      
      // Try to fetch fresh data if online
      if (navigator.onLine) {
        const endpoint = this.getEndpointForStore(storeName);
        await this.syncFromNetwork(storeName, endpoint);
        return await this.getOfflineData(storeName, options);
      }
      
      // Return offline data even if stale when offline
      return offlineData;
    } catch (error) {
      console.error(`Failed to get ${storeName} data:`, error);
      return [];
    }
  }
  
  /**
   * Get offline data from IndexedDB
   */
  async getOfflineData(storeName, options = {}) {
    const tx = this.db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      let request;
      
      // Apply sorting if specified
      if (options.index && options.direction) {
        const index = store.index(options.index);
        request = index.openCursor(null, options.direction);
      } else {
        request = store.getAll();
      }
      
      if (request.onsuccess) {
        // Handle cursor-based results
        if (options.index) {
          const results = [];
          request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor && (!options.limit || results.length < options.limit)) {
              results.push(cursor.value);
              cursor.continue();
            } else {
              resolve(results);
            }
          };
        } else {
          // Handle getAll results
          request.onsuccess = () => {
            let results = request.result || [];
            
            // Apply limit if specified
            if (options.limit) {
              results = results.slice(0, options.limit);
            }
            
            resolve(results);
          };
        }
      }
      
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Update offline data
   */
  async updateOfflineData(storeName, data) {
    if (!this.db) await this.openDatabase();
    
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    
    // Handle both array and single object
    const items = Array.isArray(data) ? data : [data];
    
    for (const item of items) {
      try {
        // Add timestamp if not present
        if (!item.timestamp) {
          item.timestamp = Date.now();
        }
        
        await store.put(item);
      } catch (error) {
        console.error(`Failed to store ${storeName} item:`, error);
      }
    }
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
  
  /**
   * Update data with offline support
   */
  async updateData(storeName, data, operation = 'update') {
    // Update offline storage immediately
    await this.updateOfflineData(storeName, data);
    
    // Queue for sync if offline
    if (!navigator.onLine) {
      await this.queueForSync({
        type: operation,
        store: storeName,
        data: data,
        timestamp: new Date().toISOString(),
        userId: this.currentUserId
      });
      
      this.showOfflineNotification('Changes saved offline. Will sync when connection returns.');
    } else {
      // Sync immediately if online
      await this.syncToNetwork(storeName, data, operation);
    }
  }
  
  /**
   * Delete data with offline support
   */
  async deleteData(storeName, id) {
    if (!this.db) await this.openDatabase();
    
    // Delete from offline storage
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    await store.delete(id);
    
    // Queue for sync if offline
    if (!navigator.onLine) {
      await this.queueForSync({
        type: 'delete',
        store: storeName,
        data: { id },
        timestamp: new Date().toISOString(),
        userId: this.currentUserId
      });
    } else {
      // Sync immediately if online
      await this.syncToNetwork(storeName, { id }, 'delete');
    }
  }
  
  /**
   * Queue operation for background sync
   */
  async queueForSync(operation) {
    if (!this.db) await this.openDatabase();
    
    const tx = this.db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');
    
    await store.add(operation);
    console.log('Operation queued for sync:', operation);
    
    // Register background sync if available
    if ('serviceWorker' in navigator && 'sync' in self.registration) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('background-data-sync');
      } catch (error) {
        console.error('Failed to register background sync:', error);
      }
    }
  }
  
  /**
   * Process sync queue when back online
   */
  async processSyncQueue() {
    if (!navigator.onLine || !this.db) return;
    
    const tx = this.db.transaction('syncQueue', 'readonly');
    const store = tx.objectStore('syncQueue');
    const queue = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    console.log(`Processing ${queue.length} queued operations...`);
    
    for (const operation of queue) {
      try {
        await this.processOperation(operation);
        
        // Remove from queue after successful sync
        const deleteTx = this.db.transaction('syncQueue', 'readwrite');
        const deleteStore = deleteTx.objectStore('syncQueue');
        await deleteStore.delete(operation.id);
      } catch (error) {
        console.error('Failed to sync operation:', operation, error);
        // Keep in queue for retry
      }
    }
    
    if (queue.length > 0) {
      this.showSuccessNotification(`Synced ${queue.length} offline changes`);
    }
  }
  
  /**
   * Process a single sync operation
   */
  async processOperation(operation) {
    const { type, store, data } = operation;
    
    switch (type) {
      case 'update':
      case 'create':
        await this.syncToNetwork(store, data, type);
        break;
      
      case 'delete':
        await this.syncToNetwork(store, data, 'delete');
        break;
      
      default:
        console.warn('Unknown operation type:', type);
    }
  }
  
  /**
   * Sync data to network
   */
  async syncToNetwork(storeName, data, operation) {
    const endpoint = this.getEndpointForStore(storeName);
    const method = operation === 'delete' ? 'DELETE' : 
                   operation === 'create' ? 'POST' : 'PUT';
    
    const response = await fetch(endpoint, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': this.currentUserId
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to sync ${storeName}: ${response.status}`);
    }
    
    return response.json();
  }
  
  /**
   * Setup network listeners
   */
  setupNetworkListeners() {
    window.addEventListener('online', async () => {
      console.log('Back online - processing sync queue...');
      await this.processSyncQueue();
      this.setupRealTimeSync();
      this.showSuccessNotification('Back online! Syncing your data...');
    });
    
    window.addEventListener('offline', () => {
      console.log('Gone offline - enabling offline mode');
      this.showOfflineNotification('You\'re offline. Changes will be saved locally.');
    });
  }
  
  /**
   * Get endpoint for store
   */
  getEndpointForStore(storeName) {
    const endpoints = {
      matches: '/api/matches',
      connections: '/api/connections',
      conversations: '/api/conversations',
      gatherings: '/api/gatherings',
      events: '/api/events',
      messages: '/api/messages',
      userProfile: '/api/profile'
    };
    
    return endpoints[storeName] || `/api/${storeName}`;
  }
  
  /**
   * Check if data is stale
   */
  isDataStale(lastSync, maxAge) {
    if (!lastSync) return true;
    
    const lastSyncTime = new Date(lastSync).getTime();
    const now = Date.now();
    
    return (now - lastSyncTime) > maxAge;
  }
  
  /**
   * Update metadata
   */
  async updateMetadata(key, value) {
    if (!this.db) await this.openDatabase();
    
    const tx = this.db.transaction('metadata', 'readwrite');
    const store = tx.objectStore('metadata');
    
    await store.put({ key, value, timestamp: Date.now() });
  }
  
  /**
   * Get metadata
   */
  async getMetadata(key) {
    if (!this.db) await this.openDatabase();
    
    const tx = this.db.transaction('metadata', 'readonly');
    const store = tx.objectStore('metadata');
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Clear all offline data
   */
  async clearAllData() {
    if (!this.db) return;
    
    const stores = [
      'matches', 'connections', 'conversations', 
      'gatherings', 'events', 'messages', 
      'userProfile', 'syncQueue', 'metadata'
    ];
    
    for (const storeName of stores) {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      await store.clear();
    }
    
    console.log('All offline data cleared');
  }
  
  /**
   * Get storage statistics
   */
  async getStorageStats() {
    if (!this.db) await this.openDatabase();
    
    const stats = {
      stores: {},
      totalItems: 0,
      syncQueueSize: 0,
      lastSync: {}
    };
    
    const stores = [
      'matches', 'connections', 'conversations',
      'gatherings', 'events', 'messages'
    ];
    
    for (const storeName of stores) {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const count = await new Promise((resolve, reject) => {
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      stats.stores[storeName] = count;
      stats.totalItems += count;
      
      // Get last sync time
      const lastSync = await this.getMetadata(`${storeName}_lastSync`);
      if (lastSync) {
        stats.lastSync[storeName] = lastSync;
      }
    }
    
    // Get sync queue size
    const syncTx = this.db.transaction('syncQueue', 'readonly');
    const syncStore = syncTx.objectStore('syncQueue');
    stats.syncQueueSize = await new Promise((resolve, reject) => {
      const request = syncStore.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    return stats;
  }
  
  /**
   * Show offline notification
   */
  showOfflineNotification(message) {
    this.showNotification(message, 'info');
  }
  
  /**
   * Show success notification
   */
  showSuccessNotification(message) {
    this.showNotification(message, 'success');
  }
  
  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `data-sync-notification data-sync-notification--${type}`;
    notification.textContent = message;
    
    // Add styles if not present
    if (!document.getElementById('data-sync-notification-styles')) {
      const styles = document.createElement('style');
      styles.id = 'data-sync-notification-styles';
      styles.textContent = `
        .data-sync-notification {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #333;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          z-index: 10000;
          animation: slideDown 0.3s ease;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 14px;
          max-width: 90%;
          text-align: center;
        }
        
        .data-sync-notification--success {
          background: #10b981;
        }
        
        .data-sync-notification--error {
          background: #ef4444;
        }
        
        .data-sync-notification--info {
          background: #3b82f6;
        }
        
        @keyframes slideDown {
          from {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideDown 0.3s ease reverse';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
  
  /**
   * Cleanup and close connections
   */
  async cleanup() {
    // Clear all listeners
    for (const [storeName, intervalId] of this.listeners) {
      clearInterval(intervalId);
    }
    this.listeners.clear();
    
    // Close database connection
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    
    console.log('OfflineDataManager cleaned up');
  }
}

// Export singleton instance
export const offlineDataManager = new OfflineDataManager();