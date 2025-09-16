/**
 * Offline Manager
 * Handles offline functionality and data synchronization
 */

export class OfflineManager {
  constructor() {
    this.db = null;
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    this.initializeDB();
    this.setupEventListeners();
  }
  
  /**
   * Initialize IndexedDB for offline storage
   */
  async initializeDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('conference-party-offline', 2);
      
      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized');
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('matches')) {
          const matchStore = db.createObjectStore('matches', { keyPath: 'id' });
          matchStore.createIndex('timestamp', 'timestamp', { unique: false });
          matchStore.createIndex('score', 'score.overall', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('connections')) {
          const connectionStore = db.createObjectStore('connections', { keyPath: 'id' });
          connectionStore.createIndex('status', 'status', { unique: false });
          connectionStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
          messageStore.createIndex('conversationId', 'conversationId', { unique: false });
          messageStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('pending-actions')) {
          const pendingStore = db.createObjectStore('pending-actions', { 
            keyPath: 'id',
            autoIncrement: true 
          });
          pendingStore.createIndex('type', 'type', { unique: false });
          pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('user-profile')) {
          db.createObjectStore('user-profile', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('events')) {
          const eventStore = db.createObjectStore('events', { keyPath: 'id' });
          eventStore.createIndex('date', 'date', { unique: false });
          eventStore.createIndex('venue', 'venue', { unique: false });
        }
      };
    });
  }
  
  /**
   * Setup event listeners for online/offline status
   */
  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Back online - syncing data...');
      this.syncOfflineData();
      this.showToast('Back online! Syncing your data...', 'success');
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Gone offline - enabling offline mode');
      this.showToast('You\'re offline. Changes will be saved locally.', 'info');
    });
  }
  
  /**
   * Save match data for offline access
   */
  async saveMatches(matches) {
    if (!this.db) await this.initializeDB();
    
    const tx = this.db.transaction('matches', 'readwrite');
    const store = tx.objectStore('matches');
    
    for (const match of matches) {
      try {
        await store.put({
          ...match,
          timestamp: Date.now(),
          cached: true
        });
      } catch (error) {
        console.error('Failed to save match:', error);
      }
    }
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
  
  /**
   * Get cached matches
   */
  async getMatches(limit = 50) {
    if (!this.db) await this.initializeDB();
    
    const tx = this.db.transaction('matches', 'readonly');
    const store = tx.objectStore('matches');
    const index = store.index('score');
    
    return new Promise((resolve, reject) => {
      const matches = [];
      const request = index.openCursor(null, 'prev'); // Sort by score descending
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && matches.length < limit) {
          matches.push(cursor.value);
          cursor.continue();
        } else {
          resolve(matches);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Save connection for offline access
   */
  async saveConnection(connection) {
    if (!this.db) await this.initializeDB();
    
    const tx = this.db.transaction('connections', 'readwrite');
    const store = tx.objectStore('connections');
    
    await store.put({
      ...connection,
      timestamp: Date.now(),
      synced: this.isOnline
    });
    
    // If offline, add to pending actions
    if (!this.isOnline) {
      await this.addPendingAction({
        type: 'connection',
        action: 'create',
        data: connection
      });
    }
  }
  
  /**
   * Get cached connections
   */
  async getConnections(status = null) {
    if (!this.db) await this.initializeDB();
    
    const tx = this.db.transaction('connections', 'readonly');
    const store = tx.objectStore('connections');
    
    return new Promise((resolve, reject) => {
      const connections = [];
      const request = status 
        ? store.index('status').openCursor(IDBKeyRange.only(status))
        : store.openCursor();
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          connections.push(cursor.value);
          cursor.continue();
        } else {
          resolve(connections);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Save message for offline access
   */
  async saveMessage(message) {
    if (!this.db) await this.initializeDB();
    
    const tx = this.db.transaction('messages', 'readwrite');
    const store = tx.objectStore('messages');
    
    await store.put({
      ...message,
      timestamp: Date.now(),
      synced: this.isOnline
    });
    
    // If offline, add to pending actions
    if (!this.isOnline) {
      await this.addPendingAction({
        type: 'message',
        action: 'send',
        data: message
      });
    }
  }
  
  /**
   * Get cached messages for a conversation
   */
  async getMessages(conversationId) {
    if (!this.db) await this.initializeDB();
    
    const tx = this.db.transaction('messages', 'readonly');
    const store = tx.objectStore('messages');
    const index = store.index('conversationId');
    
    return new Promise((resolve, reject) => {
      const messages = [];
      const request = index.openCursor(IDBKeyRange.only(conversationId));
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          messages.push(cursor.value);
          cursor.continue();
        } else {
          // Sort by timestamp
          messages.sort((a, b) => a.timestamp - b.timestamp);
          resolve(messages);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Save user profile for offline access
   */
  async saveProfile(profile) {
    if (!this.db) await this.initializeDB();
    
    const tx = this.db.transaction('user-profile', 'readwrite');
    const store = tx.objectStore('user-profile');
    
    await store.put({
      ...profile,
      id: 'current-user',
      lastUpdated: Date.now()
    });
  }
  
  /**
   * Get cached user profile
   */
  async getProfile() {
    if (!this.db) await this.initializeDB();
    
    const tx = this.db.transaction('user-profile', 'readonly');
    const store = tx.objectStore('user-profile');
    
    return new Promise((resolve, reject) => {
      const request = store.get('current-user');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Save events for offline access
   */
  async saveEvents(events) {
    if (!this.db) await this.initializeDB();
    
    const tx = this.db.transaction('events', 'readwrite');
    const store = tx.objectStore('events');
    
    for (const event of events) {
      try {
        await store.put({
          ...event,
          cached: true,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('Failed to save event:', error);
      }
    }
  }
  
  /**
   * Get cached events
   */
  async getEvents(date = null) {
    if (!this.db) await this.initializeDB();
    
    const tx = this.db.transaction('events', 'readonly');
    const store = tx.objectStore('events');
    
    return new Promise((resolve, reject) => {
      const events = [];
      const request = date
        ? store.index('date').openCursor(IDBKeyRange.only(date))
        : store.openCursor();
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          events.push(cursor.value);
          cursor.continue();
        } else {
          resolve(events);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Add action to pending queue
   */
  async addPendingAction(action) {
    if (!this.db) await this.initializeDB();
    
    const tx = this.db.transaction('pending-actions', 'readwrite');
    const store = tx.objectStore('pending-actions');
    
    await store.add({
      ...action,
      timestamp: Date.now(),
      retries: 0
    });
    
    // Request background sync if available
    if ('serviceWorker' in navigator && 'sync' in self.registration) {
      try {
        await self.registration.sync.register(`sync-${action.type}`);
      } catch (error) {
        console.error('Failed to register background sync:', error);
      }
    }
  }
  
  /**
   * Get pending actions
   */
  async getPendingActions() {
    if (!this.db) await this.initializeDB();
    
    const tx = this.db.transaction('pending-actions', 'readonly');
    const store = tx.objectStore('pending-actions');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Remove pending action
   */
  async removePendingAction(id) {
    if (!this.db) await this.initializeDB();
    
    const tx = this.db.transaction('pending-actions', 'readwrite');
    const store = tx.objectStore('pending-actions');
    
    await store.delete(id);
  }
  
  /**
   * Sync offline data when back online
   */
  async syncOfflineData() {
    if (!this.isOnline) return;
    
    try {
      const pendingActions = await this.getPendingActions();
      console.log(`Syncing ${pendingActions.length} pending actions...`);
      
      for (const action of pendingActions) {
        try {
          await this.processPendingAction(action);
          await this.removePendingAction(action.id);
        } catch (error) {
          console.error('Failed to sync action:', error);
          // Increment retry count
          action.retries++;
          if (action.retries >= 3) {
            // Remove after 3 failed attempts
            await this.removePendingAction(action.id);
          }
        }
      }
      
      this.showToast('All data synced successfully!', 'success');
    } catch (error) {
      console.error('Sync failed:', error);
      this.showToast('Some data failed to sync. Will retry later.', 'warning');
    }
  }
  
  /**
   * Process a pending action
   */
  async processPendingAction(action) {
    const { type, data } = action;
    
    switch (type) {
      case 'connection':
        return await this.syncConnection(data);
      case 'message':
        return await this.syncMessage(data);
      case 'profile-update':
        return await this.syncProfileUpdate(data);
      default:
        console.warn('Unknown action type:', type);
    }
  }
  
  /**
   * Sync connection to server
   */
  async syncConnection(connection) {
    const response = await fetch('/api/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(connection)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to sync connection: ${response.status}`);
    }
    
    return response.json();
  }
  
  /**
   * Sync message to server
   */
  async syncMessage(message) {
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to sync message: ${response.status}`);
    }
    
    return response.json();
  }
  
  /**
   * Sync profile update to server
   */
  async syncProfileUpdate(profile) {
    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to sync profile: ${response.status}`);
    }
    
    return response.json();
  }
  
  /**
   * Clear all cached data
   */
  async clearCache() {
    if (!this.db) await this.initializeDB();
    
    const stores = ['matches', 'connections', 'messages', 'events', 'user-profile'];
    
    for (const storeName of stores) {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      await store.clear();
    }
    
    console.log('Cache cleared');
  }
  
  /**
   * Get cache statistics
   */
  async getCacheStats() {
    if (!this.db) await this.initializeDB();
    
    const stats = {
      matches: 0,
      connections: 0,
      messages: 0,
      events: 0,
      pendingActions: 0,
      totalSize: 0
    };
    
    const stores = [
      'matches', 'connections', 'messages', 
      'events', 'pending-actions'
    ];
    
    for (const storeName of stores) {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const count = await new Promise((resolve, reject) => {
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      if (storeName === 'pending-actions') {
        stats.pendingActions = count;
      } else {
        stats[storeName] = count;
      }
    }
    
    // Estimate storage size
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      stats.totalSize = estimate.usage || 0;
    }
    
    return stats;
  }
  
  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `offline-toast offline-toast--${type}`;
    toast.textContent = message;
    
    // Add styles if not already present
    if (!document.getElementById('offline-toast-styles')) {
      const styles = document.createElement('style');
      styles.id = 'offline-toast-styles';
      styles.textContent = `
        .offline-toast {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #333;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          z-index: 10000;
          animation: slideUp 0.3s ease;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 14px;
        }
        
        .offline-toast--success {
          background: #10b981;
        }
        
        .offline-toast--warning {
          background: #f59e0b;
        }
        
        .offline-toast--error {
          background: #ef4444;
        }
        
        .offline-toast--info {
          background: #3b82f6;
        }
        
        @keyframes slideUp {
          from {
            transform: translateX(-50%) translateY(100%);
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
    
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.animation = 'slideUp 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
  
  /**
   * Check if we have cached data for a resource
   */
  async hasCachedData(type) {
    const stats = await this.getCacheStats();
    return stats[type] > 0;
  }
  
  /**
   * Export data for backup
   */
  async exportData() {
    const data = {
      matches: await this.getMatches(1000),
      connections: await this.getConnections(),
      profile: await this.getProfile(),
      events: await this.getEvents(),
      exportDate: new Date().toISOString()
    };
    
    return data;
  }
  
  /**
   * Import data from backup
   */
  async importData(data) {
    if (data.matches) {
      await this.saveMatches(data.matches);
    }
    
    if (data.connections) {
      for (const connection of data.connections) {
        await this.saveConnection(connection);
      }
    }
    
    if (data.profile) {
      await this.saveProfile(data.profile);
    }
    
    if (data.events) {
      await this.saveEvents(data.events);
    }
    
    this.showToast('Data imported successfully!', 'success');
  }
}

// Export singleton instance
export const offlineManager = new OfflineManager();