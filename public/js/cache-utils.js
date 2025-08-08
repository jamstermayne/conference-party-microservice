/**
 * 🛠️ GAMESCOM 2025 - CACHE UTILITIES
 * 
 * Client-side cache management and offline capabilities
 * Generated: 2025-08-08T11:25:05.313Z
 */

class CacheUtils {
    constructor() {
        this.version = '1.0.0';
        this.isOnline = navigator.onLine;
        this.setupConnectionListener();
    }

    setupConnectionListener() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.onConnectionChange('online');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.onConnectionChange('offline');
        });
    }

    onConnectionChange(status) {
        console.log('📡 Connection status:', status);
        this.updateConnectionIndicator(status);
        
        if (status === 'online' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                if ('sync' in registration) {
                    registration.sync.register('background-sync');
                }
            });
        }
    }

    async isDataCached(url) {
        if ('caches' in window) {
            const cache = await caches.open('gamescom-data-v1');
            const response = await cache.match(url);
            return !!response;
        }
        return false;
    }

    async getCachedData(url) {
        if ('caches' in window) {
            const cache = await caches.open('gamescom-data-v1');
            const response = await cache.match(url);
            if (response) return await response.json();
        }
        return null;
    }

    updateConnectionIndicator(status) {
        const indicator = document.querySelector('.connection-indicator');
        if (indicator) {
            indicator.className = `connection-indicator ${status}`;
            indicator.textContent = status === 'online' ? '🟢 Online' : '🔴 Offline';
        }

        const offlineNotice = document.querySelector('.offline-notice');
        if (offlineNotice) {
            offlineNotice.style.display = status === 'offline' ? 'block' : 'none';
        }
    }
}

window.cacheUtils = new CacheUtils();
console.log('🛠️ Cache utilities loaded, version:', window.cacheUtils.version);