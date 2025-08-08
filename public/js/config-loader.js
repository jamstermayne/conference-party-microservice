/**
 * SECURE CONFIG LOADER
 * Loads API keys from environment at runtime, never from hardcoded values
 * Ensures no sensitive keys are committed to repository
 */

class ConfigLoader {
    constructor() {
        this.config = {
            apiBase: 'https://us-central1-conference-party-app.cloudfunctions.net',
            googleMapsApiKey: null,
            version: '2.0.0'
        };
        this.loaded = false;
    }
    
    async loadConfig() {
        if (this.loaded) return this.config;
        
        try {
            // Try to load from server-side endpoint (if available)
            const response = await fetch('/api/config', {
                credentials: 'same-origin'
            }).catch(() => null);
            
            if (response && response.ok) {
                const serverConfig = await response.json();
                this.config = { ...this.config, ...serverConfig };
            } else {
                // Fallback: Load from environment variables (client-side)
                this.loadFromEnvironment();
            }
            
            this.loaded = true;
            return this.config;
            
        } catch (error) {
            console.warn('Config loading failed, using fallback:', error);
            this.loadFromEnvironment();
            this.loaded = true;
            return this.config;
        }
    }
    
    loadFromEnvironment() {
        // Client-side environment variable access (if supported)
        if (typeof process !== 'undefined' && process.env) {
            this.config.googleMapsApiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || 
                                         process.env.GOOGLE_MAPS_API_KEY;
        }
        
        // Runtime configuration from meta tags
        const apiKeyMeta = document.querySelector('meta[name="google-maps-api-key"]');
        if (apiKeyMeta) {
            this.config.googleMapsApiKey = apiKeyMeta.content;
        }
        
        // Global configuration object (set by server)
        if (window.APP_CONFIG && window.APP_CONFIG.googleMapsApiKey) {
            this.config.googleMapsApiKey = window.APP_CONFIG.googleMapsApiKey;
        }
    }
    
    getGoogleMapsApiKey() {
        if (!this.loaded) {
            console.warn('Config not loaded yet. Call loadConfig() first.');
            return 'YOUR_API_KEY_HERE'; // Safe fallback
        }
        
        return this.config.googleMapsApiKey || 'YOUR_API_KEY_HERE';
    }
    
    getApiBase() {
        return this.config.apiBase;
    }
    
    isConfigurationValid() {
        return this.config.googleMapsApiKey && 
               this.config.googleMapsApiKey !== 'YOUR_API_KEY_HERE' &&
               this.config.googleMapsApiKey.startsWith('AIza');
    }
    
    getGoogleMapsScriptUrl(libraries = ['geometry', 'places']) {
        const apiKey = this.getGoogleMapsApiKey();
        const libraryParam = libraries.length > 0 ? `&libraries=${libraries.join(',')}` : '';
        return `https://maps.googleapis.com/maps/api/js?key=${apiKey}${libraryParam}&callback=initGoogleMaps`;
    }
}

// Global instance
window.configLoader = new ConfigLoader();

// Auto-load configuration when script loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await window.configLoader.loadConfig();
        console.log('📋 Configuration loaded successfully');
        
        // Dispatch event for components waiting for config
        window.dispatchEvent(new CustomEvent('configLoaded', {
            detail: window.configLoader.config
        }));
        
    } catch (error) {
        console.error('❌ Configuration loading failed:', error);
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigLoader;
}