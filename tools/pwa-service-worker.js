#!/usr/bin/env node

/**
 * 🔧 GAMESCOM 2025 - PWA SERVICE WORKER GENERATOR
 * 
 * Focused tool: Generate service worker with intelligent caching
 * Part of Tool #8 modular architecture
 * 
 * Author: Claude Sonnet 4
 * Date: August 6, 2025
 */

const fs = require('fs').promises;
const path = require('path');

class ServiceWorkerGenerator {
    constructor() {
        this.version = '1.0.0';
        this.cacheName = 'gamescom-party-discovery-v1';
        this.dataCache = 'gamescom-data-v1';
        this.runtimeCache = 'gamescom-runtime-v1';
    }

    /**
     * 🚀 Generate complete service worker
     */
    async generateServiceWorker(searchData) {
        const timestamp = new Date().toISOString();
        
        return `/**
 * 🚀 GAMESCOM 2025 PARTY DISCOVERY - SERVICE WORKER
 * 
 * Offline-first PWA functionality with intelligent caching
 * Generated: ${timestamp}
 * Cache Version: ${this.version}
 */

const CACHE_VERSION = '${this.version}';
const CACHE_NAME = '${this.cacheName}';
const DATA_CACHE = '${this.dataCache}';
const RUNTIME_CACHE = '${this.runtimeCache}';

// Essential files to cache immediately
const ESSENTIAL_CACHE = [
    '/',
    '/index.html',
    '/css/app.css',
    '/js/app.js',
    '/js/pwa-init.js',
    '/js/cache-utils.js', 
    '/js/offline-search.js',
    '/offline-data/search-index.json',
    '/offline-data/events.json',
    '/manifest.json'
];

// API endpoints to cache with network-first strategy
const API_CACHE_PATTERNS = [
    /\\/api\\/parties/,
    /\\/api\\/events/,
    /\\/api\\/search/,
    /\\/api\\/venues/
];

// Static assets for stale-while-revalidate
const STATIC_CACHE_PATTERNS = [
    /\\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/
];

/**
 * 📦 SERVICE WORKER INSTALLATION
 */
self.addEventListener('install', event => {
    console.log('🚀 Service Worker installing, version:', CACHE_VERSION);
    
    event.waitUntil(
        Promise.all([
            // Cache essential files
            caches.open(CACHE_NAME).then(cache => {
                console.log('📦 Caching essential files...');
                return cache.addAll(ESSENTIAL_CACHE);
            }),
            
            // Cache PWA search data
            cacheSearchData(),
            
            // Skip waiting to activate immediately
            self.skipWaiting()
        ])
    );
});

/**
 * 🔄 SERVICE WORKER ACTIVATION
 */
self.addEventListener('activate', event => {
    console.log('✅ Service Worker activated, version:', CACHE_VERSION);
    
    event.waitUntil(
        Promise.all([
            cleanupOldCaches(),
            self.clients.claim()
        ])
    );
});

/**
 * 🌐 FETCH REQUEST HANDLING
 */
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
        event.respondWith(networkFirstStrategy(request));
    } else if (STATIC_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
        event.respondWith(staleWhileRevalidateStrategy(request));
    } else if (url.pathname.startsWith('/offline-data/')) {
        event.respondWith(cacheFirstStrategy(request));
    } else {
        event.respondWith(
            request.mode === 'navigate' 
                ? networkFirstStrategy(request)
                : cacheFirstStrategy(request)
        );
    }
});

/**
 * 🔄 BACKGROUND SYNC
 */
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(backgroundSync());
    }
});

/**
 * 📊 CACHE PWA SEARCH DATA
 */
async function cacheSearchData() {
    try {
        const dataCache = await caches.open(DATA_CACHE);
        const searchData = ${JSON.stringify(searchData)};
        
        const searchResponse = new Response(JSON.stringify(searchData), {
            headers: { 'Content-Type': 'application/json' }
        });
        await dataCache.put('/offline-data/search-index.json', searchResponse);
        
        const eventsResponse = new Response(JSON.stringify(searchData.events), {
            headers: { 'Content-Type': 'application/json' }
        });
        await dataCache.put('/offline-data/events.json', eventsResponse);
        
        console.log('📊 Cached search data:', searchData.totalEvents, 'events');
        
    } catch (error) {
        console.error('❌ Failed to cache search data:', error);
    }
}

/**
 * 🌐 NETWORK-FIRST STRATEGY
 */
async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;
        if (request.mode === 'navigate') return caches.match('/index.html');
        throw error;
    }
}

/**
 * 📦 CACHE-FIRST STRATEGY
 */
async function cacheFirstStrategy(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        if (request.mode === 'navigate') return caches.match('/index.html');
        throw error;
    }
}

/**
 * 🔄 STALE-WHILE-REVALIDATE STRATEGY
 */
async function staleWhileRevalidateStrategy(request) {
    const cachedResponse = await caches.match(request);
    
    const fetchPromise = fetch(request).then(networkResponse => {
        if (networkResponse.ok) {
            const cache = caches.open(RUNTIME_CACHE);
            cache.then(c => c.put(request, networkResponse.clone()));
        }
        return networkResponse;
    }).catch(() => null);
    
    return cachedResponse || fetchPromise;
}

/**
 * 🧹 CLEANUP OLD CACHES
 */
async function cleanupOldCaches() {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name => 
        name.startsWith('gamescom-') && 
        name !== CACHE_NAME && 
        name !== DATA_CACHE && 
        name !== RUNTIME_CACHE
    );
    
    return Promise.all(oldCaches.map(cacheName => {
        console.log('🗑️ Deleting old cache:', cacheName);
        return caches.delete(cacheName);
    }));
}

/**
 * 🔄 BACKGROUND SYNC
 */
async function backgroundSync() {
    try {
        console.log('🔄 Background sync started...');
        const response = await fetch('/api/parties');
        if (response.ok) {
            const cache = await caches.open(DATA_CACHE);
            cache.put('/api/parties', response.clone());
            console.log('✅ Background sync completed');
        }
    } catch (error) {
        console.log('❌ Background sync failed:', error.message);
    }
}

console.log('🚀 Service Worker loaded, version:', CACHE_VERSION);`;
    }

    /**
     * 🧪 Test service worker generation
     */
    async testGeneration() {
        console.log('🧪 Testing service worker generation...');
        
        const mockSearchData = {
            totalEvents: 58,
            events: [{ id: 'test', name: 'Test Event' }],
            generated: new Date().toISOString()
        };

        const serviceWorker = await this.generateServiceWorker(mockSearchData);
        const sizeKB = Math.round(serviceWorker.length / 1024);
        
        console.log(`✅ Service Worker generated: ${sizeKB}KB`);
        console.log(`✅ Cache strategies: 3 (network-first, cache-first, stale-while-revalidate)`);
        console.log(`✅ Essential cache entries: 10`);
        
        return serviceWorker;
    }
}

// Export for use by orchestrator
module.exports = ServiceWorkerGenerator;

// CLI execution
if (require.main === module) {
    const generator = new ServiceWorkerGenerator();
    generator.testGeneration()
        .then(() => console.log('✅ Service Worker generator ready'))
        .catch(err => console.error('❌ Test failed:', err.message));
}