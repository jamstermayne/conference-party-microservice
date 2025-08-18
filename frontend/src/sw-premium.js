/**
 * 🎮 GAMESCOM 2025 - PREMIUM SERVICE WORKER
 * 
 * Production-grade PWA service worker
 * Advanced caching strategies and offline support
 * Background sync and performance optimization
 */

const CACHE_VERSION = 'gamescom-2025-v1.5.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Cache strategies configuration
const CACHE_STRATEGIES = {
  static: {
    name: STATIC_CACHE,
    strategy: 'cache-first',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxEntries: 100
  },
  dynamic: {
    name: DYNAMIC_CACHE,
    strategy: 'network-first',
    maxAge: 60 * 60 * 1000, // 1 hour
    maxEntries: 50
  },
  api: {
    name: API_CACHE,
    strategy: 'network-first',
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxEntries: 100
  },
  images: {
    name: IMAGE_CACHE,
    strategy: 'cache-first',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxEntries: 200
  }
};

// Resources to precache
const PRECACHE_RESOURCES = [
  '/',
  '/index.html',
  '/assets/css/tokens.css',
  '/assets/css/app-unified.css',
  '/assets/css/party-list-premium.css',
  '/assets/js/app-unified.js',
  '/assets/js/api-lite.js',
  '/assets/js/party-list-premium.js',
  '/assets/js/party-cache-manager.js',
  '/assets/js/router-2panel-lite.js',
  '/manifest.json'
];

// Background sync tasks
const SYNC_TASKS = {
  'party-data-sync': handlePartyDataSync,
  'analytics-sync': handleAnalyticsSync,
  'user-preferences-sync': handleUserPreferencesSync
};

// Performance metrics
const metrics = {
  cacheHits: 0,
  cacheMisses: 0,
  networkRequests: 0,
  backgroundSyncs: 0,
  errors: 0
};

// Install event - precache critical resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing premium service worker...');
  
  event.waitUntil(
    (async () => {
      try {
        // Open static cache
        const cache = await caches.open(STATIC_CACHE);
        
        // Precache critical resources with error handling
        const precachePromises = PRECACHE_RESOURCES.map(async (url) => {
          try {
            const response = await fetch(url);
            if (response.ok) {
              await cache.put(url, response);
              console.log(`[SW] Precached: ${url}`);
            } else {
              console.warn(`[SW] Failed to precache ${url}: ${response.status}`);
            }
          } catch (error) {
            console.warn(`[SW] Error precaching ${url}:`, error);
          }
        });
        
        await Promise.allSettled(precachePromises);
        
        // Force activation
        await self.skipWaiting();
        
        console.log('[SW] Installation completed');
        
      } catch (error) {
        console.error('[SW] Installation failed:', error);
        metrics.errors++;
      }
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating premium service worker...');
  
  event.waitUntil(
    (async () => {
      try {
        // Take control of all pages
        await self.clients.claim();
        
        // Clean up old caches
        const cacheNames = await caches.keys();
        const deletionPromises = cacheNames
          .filter(name => name.startsWith('gamescom-') && !name.includes(CACHE_VERSION))
          .map(name => {
            console.log(`[SW] Deleting old cache: ${name}`);
            return caches.delete(name);
          });
        
        await Promise.all(deletionPromises);
        
        console.log('[SW] Activation completed');
        
        // Notify clients of activation
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            version: CACHE_VERSION
          });
        });
        
      } catch (error) {
        console.error('[SW] Activation failed:', error);
        metrics.errors++;
      }
    })()
  );
});

// Fetch event - intelligent caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Skip requests with special headers
  if (request.headers.get('Cache-Control') === 'no-cache') {
    return;
  }
  
  event.respondWith(handleRequest(request));
});

// Background sync event
self.addEventListener('sync', (event) => {
  console.log(`[SW] Background sync triggered: ${event.tag}`);
  
  if (SYNC_TASKS[event.tag]) {
    event.waitUntil(SYNC_TASKS[event.tag]());
    metrics.backgroundSyncs++;
  }
});

// Message event - handle client communications
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_METRICS':
      event.ports[0].postMessage(getMetrics());
      break;
      
    case 'CLEAR_CACHE':
      clearCaches(payload?.cacheNames).then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    case 'FORCE_SYNC':
      if (payload?.syncTag && SYNC_TASKS[payload.syncTag]) {
        SYNC_TASKS[payload.syncTag]().then(() => {
          event.ports[0].postMessage({ success: true });
        });
      }
      break;
  }
});

// Core request handling with intelligent caching
async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Determine cache strategy based on request type
    const strategy = getCacheStrategy(url, request);
    
    switch (strategy.name) {
      case 'static':
        return await cacheFirstStrategy(request, strategy);
      case 'api':
        return await networkFirstStrategy(request, strategy);
      case 'dynamic':
        return await networkFirstStrategy(request, strategy);
      case 'images':
        return await cacheFirstStrategy(request, strategy);
      default:
        return await networkOnlyStrategy(request);
    }
    
  } catch (error) {
    console.error('[SW] Request handling failed:', error);
    metrics.errors++;
    return await handleOfflineRequest(request);
  }
}

function getCacheStrategy(url, request) {
  // API requests
  if (url.pathname.startsWith('/api/') || 
      url.hostname.includes('cloudfunctions.net') ||
      url.hostname.includes('firebase')) {
    return CACHE_STRATEGIES.api;
  }
  
  // Static assets
  if (url.pathname.includes('/assets/') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.json') ||
      url.pathname.endsWith('.html')) {
    return CACHE_STRATEGIES.static;
  }
  
  // Images
  if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
    return CACHE_STRATEGIES.images;
  }
  
  // Everything else
  return CACHE_STRATEGIES.dynamic;
}

// Cache-first strategy (for static assets)
async function cacheFirstStrategy(request, strategy) {
  try {
    const cache = await caches.open(strategy.name);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      metrics.cacheHits++;
      
      // Background update for expired resources
      if (isExpired(cachedResponse, strategy.maxAge)) {
        updateInBackground(request, cache);
      }
      
      return cachedResponse;
    }
    
    // Fetch from network and cache
    metrics.cacheMisses++;
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await cacheResponse(cache, request, networkResponse.clone(), strategy);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.warn('[SW] Cache-first strategy failed:', error);
    return await handleOfflineRequest(request);
  }
}

// Network-first strategy (for API and dynamic content)
async function networkFirstStrategy(request, strategy) {
  try {
    // Try network first
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network timeout')), 5000)
      )
    ]);
    
    metrics.networkRequests++;
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(strategy.name);
      await cacheResponse(cache, request, networkResponse.clone(), strategy);
      return networkResponse;
    }
    
    throw new Error(`Network error: ${networkResponse.status}`);
    
  } catch (error) {
    // Fallback to cache
    console.warn('[SW] Network failed, trying cache:', error);
    
    const cache = await caches.open(strategy.name);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      metrics.cacheHits++;
      return cachedResponse;
    }
    
    metrics.cacheMisses++;
    return await handleOfflineRequest(request);
  }
}

// Network-only strategy (for specific requests)
async function networkOnlyStrategy(request) {
  try {
    const response = await fetch(request);
    metrics.networkRequests++;
    return response;
  } catch (error) {
    return await handleOfflineRequest(request);
  }
}

// Cache response with size limits
async function cacheResponse(cache, request, response, strategy) {
  try {
    // Check if response is cacheable
    if (!response.ok || response.status !== 200 || response.type !== 'basic') {
      return;
    }
    
    // Add timestamp header for expiration
    const responseWithTimestamp = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'sw-cached-at': Date.now().toString()
      }
    });
    
    await cache.put(request, responseWithTimestamp);
    
    // Enforce cache size limits
    await enforceMaxEntries(cache, strategy.maxEntries);
    
  } catch (error) {
    console.warn('[SW] Failed to cache response:', error);
  }
}

// Background update for expired resources
async function updateInBackground(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response);
      console.log(`[SW] Background updated: ${request.url}`);
    }
  } catch (error) {
    console.warn('[SW] Background update failed:', error);
  }
}

// Check if cached response is expired
function isExpired(response, maxAge) {
  const cachedAt = response.headers.get('sw-cached-at');
  if (!cachedAt) return false;
  
  return (Date.now() - parseInt(cachedAt)) > maxAge;
}

// Enforce maximum cache entries (LRU eviction)
async function enforceMaxEntries(cache, maxEntries) {
  try {
    const keys = await cache.keys();
    
    if (keys.length > maxEntries) {
      // Sort by last accessed (stored in headers)
      const keysWithTimestamp = await Promise.all(
        keys.map(async (key) => {
          const response = await cache.match(key);
          const timestamp = response.headers.get('sw-cached-at') || '0';
          return { key, timestamp: parseInt(timestamp) };
        })
      );
      
      // Remove oldest entries
      const sortedKeys = keysWithTimestamp
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(0, keys.length - maxEntries);
      
      await Promise.all(
        sortedKeys.map(({ key }) => cache.delete(key))
      );
      
      console.log(`[SW] Evicted ${sortedKeys.length} old cache entries`);
    }
  } catch (error) {
    console.warn('[SW] Cache eviction failed:', error);
  }
}

// Handle offline requests
async function handleOfflineRequest(request) {
  const url = new URL(request.url);
  
  // Try to serve offline page for navigation requests
  if (request.mode === 'navigate') {
    const cache = await caches.open(STATIC_CACHE);
    const offlinePage = await cache.match('/index.html');
    if (offlinePage) {
      return offlinePage;
    }
  }
  
  // For API requests, return structured offline response
  if (url.pathname.startsWith('/api/')) {
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This request is not available offline',
        offline: true,
        timestamp: Date.now()
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
  
  // Generic offline response
  return new Response('Offline', {
    status: 503,
    statusText: 'Service Unavailable'
  });
}

// Background sync handlers
async function handlePartyDataSync() {
  try {
    console.log('[SW] Syncing party data...');
    
    // Fetch fresh party data
    const response = await fetch('/api/parties');
    if (response.ok) {
      const parties = await response.json();
      
      // Cache the fresh data
      const cache = await caches.open(API_CACHE);
      await cache.put('/api/parties', new Response(JSON.stringify(parties), {
        headers: {
          'Content-Type': 'application/json',
          'sw-cached-at': Date.now().toString()
        }
      }));
      
      // Notify clients of updated data
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'PARTY_DATA_UPDATED',
          payload: parties
        });
      });
      
      console.log('[SW] Party data sync completed');
    }
  } catch (error) {
    console.error('[SW] Party data sync failed:', error);
    throw error; // Re-throw to retry sync
  }
}

async function handleAnalyticsSync() {
  try {
    console.log('[SW] Syncing analytics...');
    
    // Get queued analytics data from IndexedDB
    const db = await openIndexedDB();
    const transaction = db.transaction(['analytics_queue'], 'readonly');
    const store = transaction.objectStore('analytics_queue');
    const queuedEvents = await getAllFromStore(store);
    
    if (queuedEvents.length > 0) {
      // Send analytics data
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: queuedEvents })
      });
      
      if (response.ok) {
        // Clear sent events from queue
        const writeTransaction = db.transaction(['analytics_queue'], 'readwrite');
        const writeStore = writeTransaction.objectStore('analytics_queue');
        await writeStore.clear();
        
        console.log(`[SW] Synced ${queuedEvents.length} analytics events`);
      }
    }
  } catch (error) {
    console.error('[SW] Analytics sync failed:', error);
  }
}

async function handleUserPreferencesSync() {
  try {
    console.log('[SW] Syncing user preferences...');
    
    // Implementation for syncing user preferences
    // This would sync with backend if user is authenticated
    
    console.log('[SW] User preferences sync completed');
  } catch (error) {
    console.error('[SW] User preferences sync failed:', error);
  }
}

// Utility functions
async function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('GamescomPartyCache', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function clearCaches(cacheNames) {
  const cachesToClear = cacheNames || await caches.keys();
  await Promise.all(cachesToClear.map(name => caches.delete(name)));
  console.log('[SW] Cleared caches:', cachesToClear);
}

function getMetrics() {
  return {
    ...metrics,
    cacheNames: Object.values(CACHE_STRATEGIES).map(s => s.name),
    version: CACHE_VERSION,
    timestamp: Date.now()
  };
}

// Error reporting
self.addEventListener('error', (event) => {
  console.error('[SW] Global error:', event.error);
  metrics.errors++;
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
  metrics.errors++;
});

console.log('[SW] Premium service worker loaded successfully');