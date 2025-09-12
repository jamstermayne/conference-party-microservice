/**
 * Sync Coordinator
 * Coordinates data synchronization between offline and online states
 */

import { offlineDataManager } from './offline-data-manager.js';

export class SyncCoordinator {
  constructor() {
    this.syncInProgress = false;
    this.syncIntervals = new Map();
    this.conflictResolutionStrategies = new Map();
    this.lastSyncTimes = new Map();
    this.syncCallbacks = new Map();
  }
  
  /**
   * Initialize sync coordinator
   */
  async initialize() {
    // Initialize offline data manager
    await offlineDataManager.initialize();
    
    // Setup default conflict resolution strategies
    this.setupDefaultStrategies();
    
    // Setup sync schedules
    this.setupSyncSchedules();
    
    // Listen for sync events
    this.setupSyncEventListeners();
    
    console.log('SyncCoordinator initialized');
  }
  
  /**
   * Setup default conflict resolution strategies
   */
  setupDefaultStrategies() {
    // Last write wins for most data
    this.conflictResolutionStrategies.set('default', 'lastWriteWins');
    
    // Merge strategy for connections (never lose connections)
    this.conflictResolutionStrategies.set('connections', 'merge');
    
    // Server wins for user profile
    this.conflictResolutionStrategies.set('userProfile', 'serverWins');
    
    // Client wins for draft messages
    this.conflictResolutionStrategies.set('messages_draft', 'clientWins');
  }
  
  /**
   * Setup sync schedules for different data types
   */
  setupSyncSchedules() {
    // Critical data - sync immediately
    this.setupSyncSchedule('messages', 0, true); // Real-time
    this.setupSyncSchedule('connections', 0, true); // Real-time
    
    // Important data - sync frequently
    this.setupSyncSchedule('matches', 30000); // 30 seconds
    this.setupSyncSchedule('conversations', 30000); // 30 seconds
    
    // Less critical data - sync periodically
    this.setupSyncSchedule('gatherings', 60000); // 1 minute
    this.setupSyncSchedule('events', 120000); // 2 minutes
    this.setupSyncSchedule('userProfile', 300000); // 5 minutes
  }
  
  /**
   * Setup sync schedule for a data type
   */
  setupSyncSchedule(dataType, interval, realTime = false) {
    // Clear existing interval
    if (this.syncIntervals.has(dataType)) {
      clearInterval(this.syncIntervals.get(dataType));
    }
    
    if (realTime) {
      // Setup real-time sync
      this.setupRealTimeSync(dataType);
    } else if (interval > 0) {
      // Setup periodic sync
      const intervalId = setInterval(() => {
        if (navigator.onLine && !this.syncInProgress) {
          this.syncDataType(dataType);
        }
      }, interval);
      
      this.syncIntervals.set(dataType, intervalId);
    }
  }
  
  /**
   * Setup real-time sync for a data type
   */
  setupRealTimeSync(dataType) {
    // In production, this would use WebSocket or SSE
    // For now, we'll use short polling
    const pollInterval = 5000; // 5 seconds
    
    const intervalId = setInterval(() => {
      if (navigator.onLine && !this.syncInProgress) {
        this.checkForUpdates(dataType);
      }
    }, pollInterval);
    
    this.syncIntervals.set(dataType, intervalId);
  }
  
  /**
   * Check for updates from server
   */
  async checkForUpdates(dataType) {
    try {
      const lastSync = this.lastSyncTimes.get(dataType) || new Date(0);
      const endpoint = this.getEndpointForDataType(dataType);
      
      const response = await fetch(`${endpoint}/updates`, {
        method: 'GET',
        headers: {
          'X-Last-Sync': lastSync.toISOString(),
          'X-User-ID': await this.getUserId()
        }
      });
      
      if (!response.ok) return;
      
      const updates = await response.json();
      
      if (updates.hasUpdates) {
        await this.applyUpdates(dataType, updates.data);
        this.lastSyncTimes.set(dataType, new Date());
        
        // Trigger callbacks
        this.triggerSyncCallbacks(dataType, updates.data);
      }
    } catch (error) {
      console.error(`Failed to check updates for ${dataType}:`, error);
    }
  }
  
  /**
   * Sync specific data type
   */
  async syncDataType(dataType) {
    if (this.syncInProgress) return;
    
    try {
      this.syncInProgress = true;
      console.log(`Syncing ${dataType}...`);
      
      // Get local changes
      const localChanges = await this.getLocalChanges(dataType);
      
      // Get server state
      const serverState = await this.getServerState(dataType);
      
      // Resolve conflicts
      const resolved = await this.resolveConflicts(
        dataType,
        localChanges,
        serverState
      );
      
      // Apply resolved changes
      await this.applyResolvedChanges(dataType, resolved);
      
      // Update last sync time
      this.lastSyncTimes.set(dataType, new Date());
      
      console.log(`${dataType} synced successfully`);
    } catch (error) {
      console.error(`Failed to sync ${dataType}:`, error);
    } finally {
      this.syncInProgress = false;
    }
  }
  
  /**
   * Get local changes since last sync
   */
  async getLocalChanges(dataType) {
    const lastSync = this.lastSyncTimes.get(dataType) || new Date(0);
    
    // Get all local data
    const localData = await offlineDataManager.getData(dataType);
    
    // Filter changes since last sync
    return localData.filter(item => {
      const itemTime = new Date(item.updatedAt || item.timestamp);
      return itemTime > lastSync;
    });
  }
  
  /**
   * Get server state
   */
  async getServerState(dataType) {
    const endpoint = this.getEndpointForDataType(dataType);
    const lastSync = this.lastSyncTimes.get(dataType) || new Date(0);
    
    const response = await fetch(endpoint, {
      headers: {
        'X-Last-Sync': lastSync.toISOString(),
        'X-User-ID': await this.getUserId()
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get server state for ${dataType}`);
    }
    
    return response.json();
  }
  
  /**
   * Resolve conflicts between local and server data
   */
  async resolveConflicts(dataType, localChanges, serverState) {
    const strategy = this.conflictResolutionStrategies.get(dataType) || 
                    this.conflictResolutionStrategies.get('default');
    
    switch (strategy) {
      case 'lastWriteWins':
        return this.resolveLastWriteWins(localChanges, serverState);
      
      case 'merge':
        return this.resolveMerge(localChanges, serverState);
      
      case 'serverWins':
        return serverState;
      
      case 'clientWins':
        return localChanges;
      
      default:
        console.warn(`Unknown resolution strategy: ${strategy}`);
        return this.resolveLastWriteWins(localChanges, serverState);
    }
  }
  
  /**
   * Resolve using last write wins strategy
   */
  resolveLastWriteWins(localChanges, serverState) {
    const resolved = new Map();
    
    // Add all server items
    for (const item of serverState) {
      resolved.set(item.id, item);
    }
    
    // Override with local changes if newer
    for (const localItem of localChanges) {
      const serverItem = resolved.get(localItem.id);
      
      if (!serverItem || 
          new Date(localItem.updatedAt) > new Date(serverItem.updatedAt)) {
        resolved.set(localItem.id, localItem);
      }
    }
    
    return Array.from(resolved.values());
  }
  
  /**
   * Resolve using merge strategy
   */
  resolveMerge(localChanges, serverState) {
    const merged = new Map();
    
    // Add all items from both sources
    for (const item of serverState) {
      merged.set(item.id, item);
    }
    
    for (const item of localChanges) {
      if (!merged.has(item.id)) {
        merged.set(item.id, item);
      } else {
        // Merge properties for existing items
        const existing = merged.get(item.id);
        merged.set(item.id, { ...existing, ...item });
      }
    }
    
    return Array.from(merged.values());
  }
  
  /**
   * Apply resolved changes
   */
  async applyResolvedChanges(dataType, resolved) {
    // Update local storage
    await offlineDataManager.updateOfflineData(dataType, resolved);
    
    // Send local changes to server
    const localChanges = resolved.filter(item => item._localOnly);
    
    if (localChanges.length > 0) {
      await this.pushToServer(dataType, localChanges);
    }
  }
  
  /**
   * Apply updates from server
   */
  async applyUpdates(dataType, updates) {
    await offlineDataManager.updateOfflineData(dataType, updates);
  }
  
  /**
   * Push local changes to server
   */
  async pushToServer(dataType, changes) {
    const endpoint = this.getEndpointForDataType(dataType);
    
    const response = await fetch(`${endpoint}/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': await this.getUserId()
      },
      body: JSON.stringify({ changes })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to push changes for ${dataType}`);
    }
    
    // Remove local-only flag after successful sync
    for (const item of changes) {
      delete item._localOnly;
    }
    
    await offlineDataManager.updateOfflineData(dataType, changes);
  }
  
  /**
   * Force sync all data types
   */
  async syncAll() {
    const dataTypes = [
      'matches',
      'connections',
      'conversations',
      'gatherings',
      'events',
      'messages',
      'userProfile'
    ];
    
    for (const dataType of dataTypes) {
      await this.syncDataType(dataType);
    }
  }
  
  /**
   * Setup sync event listeners
   */
  setupSyncEventListeners() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('Connection restored - syncing all data...');
      this.syncAll();
    });
    
    // Listen for visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && navigator.onLine) {
        // Sync when app becomes visible
        this.syncAll();
      }
    });
    
    // Listen for storage events (sync across tabs)
    window.addEventListener('storage', (event) => {
      if (event.key?.startsWith('sync_')) {
        this.handleCrossTabSync(event);
      }
    });
  }
  
  /**
   * Handle cross-tab sync
   */
  handleCrossTabSync(event) {
    const dataType = event.key.replace('sync_', '');
    const data = JSON.parse(event.newValue);
    
    // Update local data without triggering another sync
    offlineDataManager.updateOfflineData(dataType, data);
    
    // Trigger callbacks
    this.triggerSyncCallbacks(dataType, data);
  }
  
  /**
   * Register sync callback
   */
  onSync(dataType, callback) {
    if (!this.syncCallbacks.has(dataType)) {
      this.syncCallbacks.set(dataType, new Set());
    }
    
    this.syncCallbacks.get(dataType).add(callback);
    
    // Return unsubscribe function
    return () => {
      this.syncCallbacks.get(dataType).delete(callback);
    };
  }
  
  /**
   * Trigger sync callbacks
   */
  triggerSyncCallbacks(dataType, data) {
    const callbacks = this.syncCallbacks.get(dataType);
    
    if (callbacks) {
      for (const callback of callbacks) {
        try {
          callback(data);
        } catch (error) {
          console.error('Sync callback error:', error);
        }
      }
    }
  }
  
  /**
   * Get endpoint for data type
   */
  getEndpointForDataType(dataType) {
    const endpoints = {
      matches: '/api/matches',
      connections: '/api/connections',
      conversations: '/api/conversations',
      gatherings: '/api/gatherings',
      events: '/api/events',
      messages: '/api/messages',
      userProfile: '/api/profile'
    };
    
    return endpoints[dataType] || `/api/${dataType}`;
  }
  
  /**
   * Get current user ID
   */
  async getUserId() {
    // Try to get from profile
    const profile = await offlineDataManager.getData('userProfile');
    if (profile && profile.length > 0) {
      return profile[0].id;
    }
    
    // Fallback to localStorage
    return localStorage.getItem('userId') || 'anonymous';
  }
  
  /**
   * Get sync status
   */
  getSyncStatus() {
    const status = {
      inProgress: this.syncInProgress,
      lastSyncTimes: {},
      pendingChanges: {}
    };
    
    for (const [dataType, time] of this.lastSyncTimes) {
      status.lastSyncTimes[dataType] = time.toISOString();
    }
    
    return status;
  }
  
  /**
   * Clear all sync data
   */
  async clearAll() {
    // Stop all sync intervals
    for (const intervalId of this.syncIntervals.values()) {
      clearInterval(intervalId);
    }
    this.syncIntervals.clear();
    
    // Clear sync times
    this.lastSyncTimes.clear();
    
    // Clear callbacks
    this.syncCallbacks.clear();
    
    // Clear offline data
    await offlineDataManager.clearAllData();
    
    console.log('All sync data cleared');
  }
  
  /**
   * Cleanup
   */
  cleanup() {
    // Stop all intervals
    for (const intervalId of this.syncIntervals.values()) {
      clearInterval(intervalId);
    }
    this.syncIntervals.clear();
    
    // Cleanup offline manager
    offlineDataManager.cleanup();
    
    console.log('SyncCoordinator cleaned up');
  }
}

// Export singleton instance
export const syncCoordinator = new SyncCoordinator();