/**
 * Service Worker Registration
 * Handles registration and updates of service worker
 */

export class ServiceWorkerRegistration {
  constructor() {
    this.registration = null;
    this.updateAvailable = false;
    this.offlineManager = null;
    this.pushManager = null;
  }
  
  /**
   * Initialize service worker registration
   */
  async init() {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers not supported');
      return false;
    }
    
    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register(
        '/modern/sw/service-worker.js',
        { scope: '/' }
      );
      
      console.log('Service Worker registered:', this.registration);
      
      // Setup event handlers
      this.setupEventHandlers();
      
      // Initialize offline manager
      await this.initOfflineManager();
      
      // Initialize push notifications
      await this.initPushManager();
      
      // Check for updates
      this.checkForUpdates();
      
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }
  
  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    // Handle updates
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration.installing;
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          this.updateAvailable = true;
          this.showUpdateNotification();
        }
      });
    });
    
    // Handle controller change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service Worker controller changed');
      // Reload page after update
      window.location.reload();
    });
    
    // Handle messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleServiceWorkerMessage(event.data);
    });
  }
  
  /**
   * Initialize offline manager
   */
  async initOfflineManager() {
    try {
      const { offlineManager } = await import('./offline-manager.js');
      this.offlineManager = offlineManager;
      
      // Sync data on initialization
      if (navigator.onLine) {
        await this.offlineManager.syncOfflineData();
      }
    } catch (error) {
      console.error('Failed to initialize offline manager:', error);
    }
  }
  
  /**
   * Initialize push manager
   */
  async initPushManager() {
    try {
      const { pushManager } = await import('./push-manager.js');
      this.pushManager = pushManager;
      
      // Initialize push notifications
      await this.pushManager.initialize();
      
      // Retry sending pending subscriptions
      if (navigator.onLine) {
        await this.pushManager.retrySendingSubscription();
      }
    } catch (error) {
      console.error('Failed to initialize push manager:', error);
    }
  }
  
  /**
   * Check for service worker updates
   */
  async checkForUpdates() {
    if (!this.registration) return;
    
    try {
      await this.registration.update();
      console.log('Checked for Service Worker updates');
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
    
    // Check again in 1 hour
    setTimeout(() => this.checkForUpdates(), 60 * 60 * 1000);
  }
  
  /**
   * Show update notification
   */
  showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'sw-update-notification';
    notification.innerHTML = `
      <style>
        .sw-update-notification {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 16px 24px;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          gap: 16px;
          z-index: 10000;
          animation: slideUp 0.5s ease;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        
        @keyframes slideUp {
          from {
            transform: translateX(-50%) translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
        
        .sw-update-notification-icon {
          width: 24px;
          height: 24px;
        }
        
        .sw-update-notification-text {
          flex: 1;
        }
        
        .sw-update-notification-title {
          font-weight: 600;
          margin-bottom: 4px;
        }
        
        .sw-update-notification-desc {
          font-size: 14px;
          opacity: 0.9;
        }
        
        .sw-update-notification-buttons {
          display: flex;
          gap: 8px;
        }
        
        .sw-update-notification-btn {
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .sw-update-notification-btn-primary {
          background: white;
          color: #667eea;
        }
        
        .sw-update-notification-btn-primary:hover {
          background: #f3f4f6;
        }
        
        .sw-update-notification-btn-secondary {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }
        
        .sw-update-notification-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        @media (max-width: 480px) {
          .sw-update-notification {
            bottom: 10px;
            left: 10px;
            right: 10px;
            transform: none;
            flex-direction: column;
            text-align: center;
          }
          
          .sw-update-notification-buttons {
            width: 100%;
          }
          
          .sw-update-notification-btn {
            flex: 1;
          }
        }
      </style>
      
      <svg class="sw-update-notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      
      <div class="sw-update-notification-text">
        <div class="sw-update-notification-title">Update Available!</div>
        <div class="sw-update-notification-desc">A new version is ready to install</div>
      </div>
      
      <div class="sw-update-notification-buttons">
        <button class="sw-update-notification-btn sw-update-notification-btn-primary" 
                onclick="this.parentElement.parentElement.updateNow()">
          Update Now
        </button>
        <button class="sw-update-notification-btn sw-update-notification-btn-secondary" 
                onclick="this.parentElement.parentElement.remove()">
          Later
        </button>
      </div>
    `;
    
    // Add update handler
    notification.updateNow = () => {
      this.applyUpdate();
      notification.remove();
    };
    
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => notification.remove(), 10000);
  }
  
  /**
   * Apply service worker update
   */
  async applyUpdate() {
    if (!this.registration?.waiting) return;
    
    // Tell waiting service worker to activate
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
  
  /**
   * Handle messages from service worker
   */
  handleServiceWorkerMessage(data) {
    console.log('Message from Service Worker:', data);
    
    switch (data.type) {
      case 'CACHE_UPDATED':
        console.log('Cache updated:', data.cacheName);
        break;
      
      case 'OFFLINE_READY':
        console.log('Offline mode ready');
        this.showOfflineReadyNotification();
        break;
      
      case 'SYNC_COMPLETE':
        console.log('Background sync complete');
        this.handleSyncComplete(data);
        break;
      
      case 'NOTIFICATION_CLICK':
        this.handleNotificationClick(data);
        break;
      
      default:
        console.log('Unknown message type:', data.type);
    }
  }
  
  /**
   * Show offline ready notification
   */
  showOfflineReadyNotification() {
    if (!this.offlineManager) return;
    
    this.offlineManager.showToast(
      'App is ready to work offline!',
      'success'
    );
  }
  
  /**
   * Handle sync complete
   */
  handleSyncComplete(data) {
    if (!this.offlineManager) return;
    
    this.offlineManager.showToast(
      `Synced ${data.count} items successfully`,
      'success'
    );
  }
  
  /**
   * Handle notification click
   */
  handleNotificationClick(data) {
    if (!this.pushManager) return;
    
    this.pushManager.handleNotificationClick(data.action, data.data);
  }
  
  /**
   * Request persistent storage
   */
  async requestPersistentStorage() {
    if (!navigator.storage?.persist) {
      console.warn('Persistent storage not supported');
      return false;
    }
    
    const isPersisted = await navigator.storage.persisted();
    
    if (!isPersisted) {
      const result = await navigator.storage.persist();
      console.log('Persistent storage:', result ? 'granted' : 'denied');
      return result;
    }
    
    return true;
  }
  
  /**
   * Get storage estimate
   */
  async getStorageEstimate() {
    if (!navigator.storage?.estimate) {
      console.warn('Storage estimate not supported');
      return null;
    }
    
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
      percentage: ((estimate.usage || 0) / (estimate.quota || 1)) * 100
    };
  }
  
  /**
   * Clear all caches
   */
  async clearAllCaches() {
    const cacheNames = await caches.keys();
    
    for (const cacheName of cacheNames) {
      await caches.delete(cacheName);
      console.log('Deleted cache:', cacheName);
    }
    
    // Also clear IndexedDB
    if (this.offlineManager) {
      await this.offlineManager.clearCache();
    }
    
    console.log('All caches cleared');
  }
  
  /**
   * Unregister service worker
   */
  async unregister() {
    if (!this.registration) return;
    
    try {
      const result = await this.registration.unregister();
      console.log('Service Worker unregistered:', result);
      
      // Clear all caches
      await this.clearAllCaches();
      
      return result;
    } catch (error) {
      console.error('Failed to unregister Service Worker:', error);
      return false;
    }
  }
  
  /**
   * Get registration status
   */
  getStatus() {
    return {
      registered: !!this.registration,
      scope: this.registration?.scope,
      active: !!this.registration?.active,
      waiting: !!this.registration?.waiting,
      installing: !!this.registration?.installing,
      updateAvailable: this.updateAvailable,
      pushSubscribed: this.pushManager?.subscription !== null,
      offlineReady: this.offlineManager !== null
    };
  }
}

// Auto-initialize on load
if (typeof window !== 'undefined') {
  window.addEventListener('load', async () => {
    const swRegistration = new ServiceWorkerRegistration();
    const success = await swRegistration.init();
    
    if (success) {
      // Request persistent storage
      await swRegistration.requestPersistentStorage();
      
      // Export to window for debugging
      window.swRegistration = swRegistration;
      
      console.log('Service Worker registration complete');
    }
  });
}