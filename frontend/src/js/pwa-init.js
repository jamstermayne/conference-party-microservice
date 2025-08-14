/**
 * 🚀 GAMESCOM 2025 - PWA INITIALIZATION
 */

class PWAManager {
    constructor() {
        this.init();
    }

    async init() {
        console.log('🚀 Initializing PWA...');

        if ('serviceWorker' in navigator) {
            await this.registerServiceWorker();
        }

        this.setupOfflineHandling();
        console.log('✅ PWA initialization complete');

        window.dispatchEvent(new CustomEvent('pwa-ready', { 
            detail: { initialized: true } 
        }));
    }

    async registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js?v=b023', {
                scope: '/'
            });
            console.log('📦 Service Worker registered:', registration.scope);
            return registration;
        } catch (error) {
            console.error('❌ Service Worker registration failed:', error);
        }
    }

    setupOfflineHandling() {
        window.addEventListener('online', () => console.log('🟢 Back online'));
        window.addEventListener('offline', () => console.log('🔴 Gone offline'));
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.pwaManager = new PWAManager();
    });
} else {
    window.pwaManager = new PWAManager();
}