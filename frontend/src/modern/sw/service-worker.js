/**
 * Advanced Service Worker for Conference Party PWA
 * Implements offline capabilities, caching strategies, and background sync
 */

// Cache versioning
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAMES = {
  STATIC: `static-${CACHE_VERSION}`,
  DYNAMIC: `dynamic-${CACHE_VERSION}`,
  API: `api-${CACHE_VERSION}`,
  IMAGES: `images-${CACHE_VERSION}`
};

// Assets to precache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/matches.html',
  '/test-matchmaking.html',
  '/manifest.json',
  '/assets/css/tokens.css',
  '/assets/js/api-lite.js',
  '/assets/js/app-unified.js',
  '/assets/js/feature-flags.js',
  '/modern/components/matchmaking-ui.js',
  '/modern/components/realtime-matching-ui.js',
  '/modern/matching/compatibility-engine.js',
  '/modern/matching/conversation-generator.js'
];

// Install event - precache static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAMES.STATIC)
      .then((cache) => {
        console.log('[ServiceWorker] Precaching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.error('[ServiceWorker] Precache failed:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return !Object.values(CACHE_NAMES).includes(cacheName);
            })
            .map((cacheName) => {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // API requests - Network First with cache fallback
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      networkFirst(request, CACHE_NAMES.API, 5 * 60 * 1000) // 5 minute cache
    );
    return;
  }
  
  // Images - Cache First with network fallback
  if (request.destination === 'image' || /\.(png|jpg|jpeg|svg|gif|webp)$/i.test(url.pathname)) {
    event.respondWith(
      cacheFirst(request, CACHE_NAMES.IMAGES, 7 * 24 * 60 * 60 * 1000) // 7 days
    );
    return;
  }
  
  // Static assets - Cache First
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      cacheFirst(request, CACHE_NAMES.STATIC)
    );
    return;
  }
  
  // Dynamic content - Stale While Revalidate
  event.respondWith(
    staleWhileRevalidate(request, CACHE_NAMES.DYNAMIC)
  );
});

// Caching strategies

/**
 * Network First strategy - Try network, fall back to cache
 */
async function networkFirst(request, cacheName, maxAge) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      const clonedResponse = networkResponse.clone();
      
      // Add timestamp to cached response
      const responseWithTimestamp = await addTimestamp(clonedResponse);
      cache.put(request, responseWithTimestamp);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Network request failed, falling back to cache');
    
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Check if cache is still valid
      if (maxAge && await isCacheExpired(cachedResponse, maxAge)) {
        console.log('[ServiceWorker] Cache expired');
        return createOfflineResponse();
      }
      return cachedResponse;
    }
    
    return createOfflineResponse();
  }
}

/**
 * Cache First strategy - Try cache, fall back to network
 */
async function cacheFirst(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Check if cache is expired
    if (maxAge && await isCacheExpired(cachedResponse, maxAge)) {
      console.log('[ServiceWorker] Cache expired, fetching from network');
      return fetchAndCache(request, cache);
    }
    return cachedResponse;
  }
  
  return fetchAndCache(request, cache);
}

/**
 * Stale While Revalidate - Return cache immediately, update in background
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  const networkResponsePromise = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        const clonedResponse = response.clone();
        cache.put(request, clonedResponse);
      }
      return response;
    })
    .catch(() => {
      return cachedResponse || createOfflineResponse();
    });
  
  return cachedResponse || networkResponsePromise;
}

/**
 * Helper function to fetch and cache
 */
async function fetchAndCache(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[ServiceWorker] Fetch failed:', error);
    return createOfflineResponse();
  }
}

/**
 * Add timestamp to response headers
 */
async function addTimestamp(response) {
  const headers = new Headers(response.headers);
  headers.set('sw-cache-timestamp', Date.now().toString());
  
  const blob = await response.blob();
  return new Response(blob, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
}

/**
 * Check if cached response is expired
 */
async function isCacheExpired(response, maxAge) {
  const timestamp = response.headers.get('sw-cache-timestamp');
  if (!timestamp) return false;
  
  const age = Date.now() - parseInt(timestamp);
  return age > maxAge;
}

/**
 * Create offline fallback response
 */
function createOfflineResponse() {
  const offlineHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offline - Conference Party</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .offline-container {
          background: white;
          border-radius: 1rem;
          padding: 2rem;
          max-width: 400px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }
        .offline-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 1rem;
          opacity: 0.5;
        }
        h1 {
          margin: 0 0 0.5rem 0;
          color: #1f2937;
        }
        p {
          color: #6b7280;
          line-height: 1.6;
          margin: 0 0 1.5rem 0;
        }
        .retry-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .retry-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <svg class="offline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
        </svg>
        <h1>You're Offline</h1>
        <p>
          It looks like you've lost your internet connection. 
          Please check your connection and try again.
        </p>
        <button class="retry-btn" onclick="window.location.reload()">
          Try Again
        </button>
      </div>
    </body>
    </html>
  `;
  
  return new Response(offlineHtml, {
    headers: { 'Content-Type': 'text/html' },
    status: 503
  });
}

// Background Sync for connection requests
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-connections') {
    event.waitUntil(syncConnections());
  } else if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  } else if (event.tag.startsWith('send-connection-')) {
    const userId = event.tag.replace('send-connection-', '');
    event.waitUntil(sendConnectionRequest(userId));
  }
});

/**
 * Sync pending connections
 */
async function syncConnections() {
  try {
    // Get pending connections from IndexedDB
    const pendingConnections = await getPendingConnections();
    
    for (const connection of pendingConnections) {
      try {
        const response = await fetch('/api/connections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(connection)
        });
        
        if (response.ok) {
          await removePendingConnection(connection.id);
          await showNotification('Connection Sent', {
            body: `Successfully connected with ${connection.name}`,
            icon: '/images/icon-192x192.png',
            badge: '/images/badge-72x72.png'
          });
        }
      } catch (error) {
        console.error('[ServiceWorker] Failed to sync connection:', error);
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Sync connections failed:', error);
  }
}

/**
 * Sync pending messages
 */
async function syncMessages() {
  try {
    const pendingMessages = await getPendingMessages();
    
    for (const message of pendingMessages) {
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message)
        });
        
        if (response.ok) {
          await removePendingMessage(message.id);
        }
      } catch (error) {
        console.error('[ServiceWorker] Failed to sync message:', error);
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Sync messages failed:', error);
  }
}

/**
 * Send individual connection request
 */
async function sendConnectionRequest(userId) {
  try {
    const response = await fetch(`/api/connections/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      await showNotification('Connection Request Sent', {
        body: `Your request has been sent to ${data.name}`,
        icon: '/images/icon-192x192.png'
      });
    }
  } catch (error) {
    console.error('[ServiceWorker] Failed to send connection request:', error);
    // Request will be retried on next sync
  }
}

// Push Notifications
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push notification received');
  
  let notification = {
    title: 'Conference Party',
    body: 'You have a new notification',
    icon: '/images/icon-192x192.png',
    badge: '/images/badge-72x72.png'
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      notification = {
        title: data.title || notification.title,
        body: data.body || notification.body,
        icon: data.icon || notification.icon,
        badge: data.badge || notification.badge,
        data: data.data || {},
        actions: data.actions || []
      };
    } catch (error) {
      console.error('[ServiceWorker] Failed to parse push data:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notification.title, notification)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  // Handle action clicks
  if (event.action) {
    handleNotificationAction(event.action, event.notification.data);
    return;
  }
  
  // Default click - open app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

/**
 * Handle notification action buttons
 */
function handleNotificationAction(action, data) {
  switch (action) {
    case 'view-match':
      clients.openWindow(`/matches#${data.matchId}`);
      break;
    case 'accept-connection':
      acceptConnection(data.connectionId);
      break;
    case 'view-message':
      clients.openWindow(`/messages#${data.messageId}`);
      break;
    default:
      console.log('[ServiceWorker] Unknown action:', action);
  }
}

/**
 * Accept connection request
 */
async function acceptConnection(connectionId) {
  try {
    await fetch(`/api/connections/${connectionId}/accept`, {
      method: 'POST'
    });
    
    await showNotification('Connection Accepted', {
      body: 'You are now connected!',
      icon: '/images/icon-192x192.png'
    });
  } catch (error) {
    console.error('[ServiceWorker] Failed to accept connection:', error);
  }
}

/**
 * Show notification helper
 */
async function showNotification(title, options) {
  if (self.registration.showNotification) {
    return self.registration.showNotification(title, options);
  }
}

// IndexedDB helpers for offline storage
const DB_NAME = 'conference-party-offline';
const DB_VERSION = 1;

/**
 * Open IndexedDB
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores
      if (!db.objectStoreNames.contains('pending-connections')) {
        db.createObjectStore('pending-connections', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending-messages')) {
        db.createObjectStore('pending-messages', { keyPath: 'id' });
      }
    };
  });
}

/**
 * Get pending connections from IndexedDB
 */
async function getPendingConnections() {
  const db = await openDB();
  const tx = db.transaction('pending-connections', 'readonly');
  const store = tx.objectStore('pending-connections');
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Remove pending connection from IndexedDB
 */
async function removePendingConnection(id) {
  const db = await openDB();
  const tx = db.transaction('pending-connections', 'readwrite');
  const store = tx.objectStore('pending-connections');
  return store.delete(id);
}

/**
 * Get pending messages from IndexedDB
 */
async function getPendingMessages() {
  const db = await openDB();
  const tx = db.transaction('pending-messages', 'readonly');
  const store = tx.objectStore('pending-messages');
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Remove pending message from IndexedDB
 */
async function removePendingMessage(id) {
  const db = await openDB();
  const tx = db.transaction('pending-messages', 'readwrite');
  const store = tx.objectStore('pending-messages');
  return store.delete(id);
}

// Message handler for client communication
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[ServiceWorker] Service worker loaded');