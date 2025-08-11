// Professional Intelligence Platform Service Worker
const CACHE_NAME = 'intelligence-platform-v1';
const STATIC_CACHE = 'intelligence-static-v1';
const DYNAMIC_CACHE = 'intelligence-dynamic-v1';

// Assets to cache immediately
const CACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/css/styles.css',
  '/assets/js/app.js',
  '/assets/js/router.js',
  '/assets/js/state.js',
  '/assets/js/ui.js',
  '/assets/js/api.js',
  '/assets/js/parties.js',
  '/assets/js/invites.js',
  '/assets/js/calendar.js',
  '/assets/js/profile.js',
  '/assets/js/settings.js',
  '/assets/js/persistence.js',
  '/data/parties.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install event - cache core assets
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(CACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle different types of requests
  if (url.origin === location.origin) {
    // Same origin requests
    event.respondWith(handleSameOriginRequest(request));
  } else {
    // Cross-origin requests (APIs, CDNs)
    event.respondWith(handleCrossOriginRequest(request));
  }
});

// Handle same-origin requests (app assets)
async function handleSameOriginRequest(request) {
  const url = new URL(request.url);
  
  // For navigation requests, always return index.html from cache
  if (request.mode === 'navigate') {
    try {
      const cache = await caches.open(STATIC_CACHE);
      const cachedResponse = await cache.match('/index.html');
      if (cachedResponse) {
        return cachedResponse;
      }
    } catch (error) {
      console.error('[SW] Failed to serve cached index.html:', error);
    }
  }
  
  // Try cache first, then network
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Serving from cache:', request.url);
      return cachedResponse;
    }
    
    // Not in cache, try network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok && request.method === 'GET') {
      const responseClone = networkResponse.clone();
      const dynamicCache = await caches.open(DYNAMIC_CACHE);
      await dynamicCache.put(request, responseClone);
      console.log('[SW] Cached from network:', request.url);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('[SW] Network request failed:', error);
    
    // Fallback responses
    if (request.destination === 'document') {
      const cache = await caches.open(STATIC_CACHE);
      return await cache.match('/index.html') || new Response('App unavailable offline', {
        status: 503,
        statusText: 'Service Unavailable'
      });
    }
    
    // For other resources, return generic offline response
    return new Response('Resource unavailable offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Handle cross-origin requests (APIs, external resources)
async function handleCrossOriginRequest(request) {
  try {
    // Always try network first for API calls
    const networkResponse = await fetch(request);
    
    // Cache successful GET requests to dynamic cache
    if (networkResponse.ok && request.method === 'GET') {
      const responseClone = networkResponse.clone();
      const dynamicCache = await caches.open(DYNAMIC_CACHE);
      await dynamicCache.put(request, responseClone);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('[SW] Cross-origin request failed, checking cache:', request.url);
    
    // Try to serve from dynamic cache
    const dynamicCache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await dynamicCache.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Serving cross-origin from cache:', request.url);
      return cachedResponse;
    }
    
    // No cache available, return offline response
    return new Response('API unavailable offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-parties') {
    event.waitUntil(syncParties());
  } else if (event.tag === 'sync-rsvp') {
    event.waitUntil(syncRSVPs());
  } else if (event.tag === 'sync-profile') {
    event.waitUntil(syncProfile());
  }
});

// Sync offline party interactions
async function syncParties() {
  try {
    console.log('[SW] Syncing offline party data');
    
    // Get pending actions from IndexedDB or localStorage
    const pendingActions = JSON.parse(localStorage.getItem('pending_party_actions') || '[]');
    
    for (const action of pendingActions) {
      try {
        await fetch('/api/parties/' + action.partyId + '/' + action.type, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.data)
        });
        
        console.log('[SW] Synced party action:', action);
      } catch (error) {
        console.error('[SW] Failed to sync party action:', error);
      }
    }
    
    // Clear synced actions
    localStorage.setItem('pending_party_actions', '[]');
    
  } catch (error) {
    console.error('[SW] Party sync failed:', error);
  }
}

// Sync offline RSVPs
async function syncRSVPs() {
  try {
    console.log('[SW] Syncing offline RSVPs');
    
    const pendingRSVPs = JSON.parse(localStorage.getItem('pending_rsvps') || '[]');
    
    for (const rsvp of pendingRSVPs) {
      try {
        await fetch('/api/rsvp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rsvp)
        });
        
        console.log('[SW] Synced RSVP:', rsvp);
      } catch (error) {
        console.error('[SW] Failed to sync RSVP:', error);
      }
    }
    
    localStorage.setItem('pending_rsvps', '[]');
    
  } catch (error) {
    console.error('[SW] RSVP sync failed:', error);
  }
}

// Sync profile updates
async function syncProfile() {
  try {
    console.log('[SW] Syncing profile updates');
    
    const pendingProfile = JSON.parse(localStorage.getItem('pending_profile') || 'null');
    
    if (pendingProfile) {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingProfile)
      });
      
      localStorage.removeItem('pending_profile');
      console.log('[SW] Profile synced successfully');
    }
    
  } catch (error) {
    console.error('[SW] Profile sync failed:', error);
  }
}

// Push notifications for exclusive invites
self.addEventListener('push', event => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'You have a new exclusive invitation!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'invitation',
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: {
      url: '/#/invites',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'view',
        title: 'View Invitation',
        icon: '/icons/icon-192.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Professional Intelligence Platform', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/#/invites')
    );
  } else if (event.action !== 'dismiss') {
    // Default click action
    event.waitUntil(
      clients.openWindow('/#/invites')
    );
  }
});

// Message handling for communication with main app
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'CACHE_PARTY_DATA') {
    // Cache party data from main app
    caches.open(DYNAMIC_CACHE)
      .then(cache => cache.put('/api/parties', new Response(JSON.stringify(event.data.parties))))
      .then(() => {
        event.ports[0].postMessage({ success: true });
      })
      .catch(error => {
        event.ports[0].postMessage({ success: false, error: error.message });
      });
  } else if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service worker script loaded');