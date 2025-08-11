/**
 * OPTIMIZED SERVICE WORKER - Enterprise Performance
 * Non-blocking operations with async patterns
 */

// Cache configuration
const CACHE_VERSION = 'v3.2.0';
const CACHE_NAME = `gamescom-2025-${CACHE_VERSION}`;
const DATA_CACHE = `gamescom-data-${CACHE_VERSION}`;
const RUNTIME_CACHE = `gamescom-runtime-${CACHE_VERSION}`;

// Resources to cache
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/main.css',
    '/css/tokens.css',
    '/js/app.js',
    '/manifest.json',
    '/images/icons/icon-192x192.png',
    '/images/icons/icon-512x512.png'
];

const CACHE_STRATEGIES = {
    networkFirst: [
        '/api/',
        '/auth/',
        '/sync/'
    ],
    cacheFirst: [
        '/css/',
        '/js/',
        '/images/',
        '/fonts/'
    ],
    staleWhileRevalidate: [
        '/data/',
        '/parties/',
        '/events/'
    ]
};

/**
 * Install event - cache static assets
 */
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

/**
 * Activate event - cleanup old caches
 */
self.addEventListener('activate', event => {
    event.waitUntil(
        Promise.all([
            cleanupOldCaches(),
            self.clients.claim()
        ])
    );
});

/**
 * Fetch event - optimized non-blocking strategy
 */
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip Chrome extensions and non-HTTP(S) requests
    if (!url.protocol.startsWith('http')) {
        return;
    }
    
    // Apply appropriate caching strategy
    const strategy = getStrategy(url.pathname);
    event.respondWith(executeStrategy(strategy, request));
});

/**
 * Determine caching strategy based on URL
 */
function getStrategy(pathname) {
    for (const [strategy, patterns] of Object.entries(CACHE_STRATEGIES)) {
        if (patterns.some(pattern => pathname.includes(pattern))) {
            return strategy;
        }
    }
    return 'networkFirst'; // Default strategy
}

/**
 * Execute caching strategy
 */
async function executeStrategy(strategy, request) {
    switch (strategy) {
        case 'cacheFirst':
            return cacheFirstStrategy(request);
        case 'networkFirst':
            return networkFirstStrategy(request);
        case 'staleWhileRevalidate':
            return staleWhileRevalidateStrategy(request);
        default:
            return fetch(request);
    }
}

/**
 * Cache-first strategy - for static assets
 */
async function cacheFirstStrategy(request) {
    const cached = await caches.match(request);
    if (cached) {
        // Non-blocking background update
        updateCacheInBackground(request);
        return cached;
    }
    
    try {
        const response = await fetch(request);
        if (response.ok) {
            // Non-blocking cache update
            putInCache(request, response.clone());
        }
        return response;
    } catch (error) {
        // Return offline page if available
        return caches.match('/offline.html') || new Response('Offline', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

/**
 * Network-first strategy - for API calls
 */
async function networkFirstStrategy(request) {
    try {
        const response = await fetchWithTimeout(request, 5000);
        if (response.ok) {
            // Non-blocking cache update
            putInCache(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        return cached || new Response(JSON.stringify({
            error: 'Network error',
            offline: true
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Stale-while-revalidate strategy
 */
async function staleWhileRevalidateStrategy(request) {
    const cached = await caches.match(request);
    
    // Return cached immediately if available
    if (cached) {
        // Update cache in background (non-blocking)
        updateCacheInBackground(request);
        return cached;
    }
    
    // No cache, fetch from network
    try {
        const response = await fetch(request);
        if (response.ok) {
            putInCache(request, response.clone());
        }
        return response;
    } catch (error) {
        return new Response('Network error', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

/**
 * Fetch with timeout
 */
function fetchWithTimeout(request, timeout = 5000) {
    return Promise.race([
        fetch(request),
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), timeout)
        )
    ]);
}

/**
 * Non-blocking cache update
 */
function putInCache(request, response) {
    // Use async without await to avoid blocking
    caches.open(RUNTIME_CACHE).then(cache => {
        cache.put(request, response).catch(err => {
            console.error('Cache put failed:', err);
        });
    }).catch(err => {
        console.error('Cache open failed:', err);
    });
}

/**
 * Update cache in background (non-blocking)
 */
function updateCacheInBackground(request) {
    // Fetch and update cache without blocking
    fetch(request).then(response => {
        if (response && response.ok) {
            caches.open(RUNTIME_CACHE).then(cache => {
                cache.put(request, response);
            });
        }
    }).catch(() => {
        // Silently fail - this is background update
    });
}

/**
 * Clean up old caches
 */
async function cleanupOldCaches() {
    const cacheNames = await caches.keys();
    const currentCaches = [CACHE_NAME, DATA_CACHE, RUNTIME_CACHE];
    
    const deletePromises = cacheNames
        .filter(name => !currentCaches.includes(name))
        .map(name => caches.delete(name));
    
    return Promise.all(deletePromises);
}

/**
 * Message handler for cache management
 */
self.addEventListener('message', event => {
    const { type, payload } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CLEAR_CACHE':
            event.waitUntil(
                caches.keys().then(names => 
                    Promise.all(names.map(name => caches.delete(name)))
                ).then(() => 
                    event.ports[0].postMessage({ success: true })
                )
            );
            break;
            
        case 'CACHE_URLS':
            event.waitUntil(
                cacheUrls(payload.urls).then(() => 
                    event.ports[0].postMessage({ success: true })
                )
            );
            break;
    }
});

/**
 * Cache specific URLs
 */
async function cacheUrls(urls) {
    const cache = await caches.open(RUNTIME_CACHE);
    const promises = urls.map(url => 
        fetch(url).then(response => {
            if (response.ok) {
                return cache.put(url, response);
            }
        }).catch(() => {
            // Silently fail for individual URLs
        })
    );
    return Promise.all(promises);
}

/**
 * Background sync registration
 */
self.addEventListener('sync', event => {
    if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
    }
});

/**
 * Sync data when back online
 */
async function syncData() {
    try {
        // Sync critical data endpoints
        const endpoints = ['/api/parties', '/api/events', '/api/sync'];
        const cache = await caches.open(DATA_CACHE);
        
        const promises = endpoints.map(endpoint => 
            fetch(endpoint).then(response => {
                if (response.ok) {
                    return cache.put(endpoint, response);
                }
            }).catch(() => {
                // Individual sync failures don't break the whole sync
            })
        );
        
        await Promise.all(promises);
        
        // Notify clients of successful sync
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_COMPLETE',
                timestamp: Date.now()
            });
        });
    } catch (error) {
        console.error('Sync failed:', error);
    }
}

/**
 * Push notification handler
 */
self.addEventListener('push', event => {
    if (!event.data) return;
    
    const data = event.data.json();
    const options = {
        body: data.body,
        icon: '/images/icons/icon-192x192.png',
        badge: '/images/icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/',
            timestamp: Date.now()
        },
        actions: data.actions || []
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

/**
 * Notification click handler
 */
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    const url = event.notification.data.url || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(clientList => {
            // Check if there's already a window open
            for (const client of clientList) {
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            // Open new window if needed
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});