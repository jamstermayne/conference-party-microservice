/**
 * Service Worker - Minimal caching for performance
 * Version: b011
 */

const BUILD = 'b011';
const CACHE_VERSION = `velocity-${BUILD}`;
const DATA_CACHE = `velocity-data-${BUILD}`;

// Only cache API responses and images, never HTML or JS modules
const API_PATTERNS = [
  /\/api\/parties/,
  /\/api\/hotspots/,
  /\/api\/events/
];

const IMAGE_PATTERNS = [
  /\.(png|jpg|jpeg|gif|svg|ico)$/
];

self.addEventListener('install', event => {
  console.log(`[SW ${BUILD}] Installing`);
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log(`[SW ${BUILD}] Activating`);
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('velocity-') && name !== CACHE_VERSION && name !== DATA_CACHE)
          .map(name => {
            console.log(`[SW ${BUILD}] Deleting old cache: ${name}`);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Never cache HTML or JS modules
  if (url.pathname.endsWith('.html') || 
      url.pathname.endsWith('.js') || 
      url.pathname === '/' ||
      url.pathname.includes('manifest')) {
    return; // Let network handle it
  }
  
  // Cache API responses
  if (API_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(
      caches.open(DATA_CACHE).then(cache => {
        return fetch(event.request)
          .then(response => {
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => {
            return cache.match(event.request);
          });
      })
    );
    return;
  }
  
  // Cache images
  if (IMAGE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(response => {
          if (response.ok) {
            return caches.open(CACHE_VERSION).then(cache => {
              cache.put(event.request, response.clone());
              return response;
            });
          }
          return response;
        });
      })
    );
  }
});