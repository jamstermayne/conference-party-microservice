/**
 * Google Maps Error Handler
 * Graceful error handling and fallbacks for Maps API failures
 */

class MapsErrorHandler {
    constructor() {
        this.errors = [];
        this.fallbackEnabled = true;
        this.retryAttempts = 0;
        this.maxRetries = 3;
        
        this.initErrorHandling();
    }

    initErrorHandling() {
        // Global error handler for Google Maps
        window.gm_authFailure = () => {
            this.handleAuthFailure();
        };
        
        // Network error handler
        window.addEventListener('online', () => {
            this.handleNetworkRestore();
        });
        
        window.addEventListener('offline', () => {
            this.handleNetworkFailure();
        });
        
        // Script load error handler
        this.setupScriptErrorHandling();
    }

    setupScriptErrorHandling() {
        // Monitor for Maps API script load errors
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.tagName === 'SCRIPT' && node.src && node.src.includes('maps.googleapis.com')) {
                        node.onerror = () => {
                            this.handleScriptLoadError();
                        };
                    }
                });
            });
        });
        
        observer.observe(document.head, { childList: true });
    }

    handleAuthFailure() {
        console.error('🔑 Google Maps API authentication failed');
        this.logError('auth_failure', 'Google Maps API key is invalid or has insufficient permissions');
        this.showFallbackContent('Authentication Error', 'Unable to load maps due to API key issues. Showing alternative content.');
    }

    handleScriptLoadError() {
        console.error('📡 Google Maps API script failed to load');
        this.logError('script_load_error', 'Failed to load Google Maps API script');
        this.showFallbackContent('Connection Error', 'Unable to load maps. Check your internet connection.');
    }

    handleNetworkFailure() {
        console.warn('📡 Network connection lost');
        this.logError('network_offline', 'Device is offline');
        this.showOfflineMessage();
    }

    handleNetworkRestore() {
        console.log('📡 Network connection restored');
        this.hideOfflineMessage();
        
        // Retry failed maps if network was the issue
        if (this.retryAttempts < this.maxRetries) {
            this.retryMapInitialization();
        }
    }

    logError(type, message, details = {}) {
        const error = {
            type,
            message,
            details,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        this.errors.push(error);
        
        // Send to analytics if available
        if (window.gtag) {
            window.gtag('event', 'maps_error', {
                error_type: type,
                error_message: message
            });
        }
        
        // Keep only last 10 errors
        if (this.errors.length > 10) {
            this.errors.shift();
        }
    }

    showFallbackContent(title, message) {
        const mapContainers = document.querySelectorAll('.party-map-container, #map');
        
        mapContainers.forEach(container => {
            if (container) {
                container.innerHTML = this.createFallbackHTML(title, message);
                container.classList.add('maps-error-fallback');
            }
        });
    }

    createFallbackHTML(title, message) {
        return `
            <div class="maps-fallback-content">
                <div class="fallback-icon">🗺️</div>
                <h3 class="fallback-title">${title}</h3>
                <p class="fallback-message">${message}</p>
                
                <div class="fallback-actions">
                    <button onclick="mapsErrorHandler.retryMapInitialization()" class="fallback-btn retry">
                        🔄 Retry Maps
                    </button>
                    <button onclick="mapsErrorHandler.openExternalMaps()" class="fallback-btn external">
                        🌐 Open in Google Maps
                    </button>
                </div>
                
                <div class="fallback-alternative">
                    <h4>Alternative Options:</h4>
                    <div class="alternative-buttons">
                        <button onclick="mapsErrorHandler.openAddressSearch()" class="alt-btn">
                            📍 Search Address
                        </button>
                        <button onclick="mapsErrorHandler.copyAddress()" class="alt-btn">
                            📋 Copy Address
                        </button>
                        <button onclick="mapsErrorHandler.openDirections()" class="alt-btn">
                            🧭 Get Directions
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    showOfflineMessage() {
        const offlineHTML = `
            <div class="offline-notice">
                <span class="offline-icon">📡</span>
                <span class="offline-text">You're offline. Maps will reload when connection is restored.</span>
            </div>
        `;
        
        // Add offline notice to page
        let offlineNotice = document.getElementById('offline-maps-notice');
        if (!offlineNotice) {
            offlineNotice = document.createElement('div');
            offlineNotice.id = 'offline-maps-notice';
            offlineNotice.innerHTML = offlineHTML;
            document.body.appendChild(offlineNotice);
        }
        
        offlineNotice.style.display = 'block';
    }

    hideOfflineMessage() {
        const offlineNotice = document.getElementById('offline-maps-notice');
        if (offlineNotice) {
            offlineNotice.style.display = 'none';
        }
    }

    retryMapInitialization() {
        this.retryAttempts++;
        console.log(`🔄 Attempting to retry maps initialization (attempt ${this.retryAttempts}/${this.maxRetries})`);
        
        if (this.retryAttempts > this.maxRetries) {
            this.showFallbackContent('Max Retries Exceeded', 'Unable to load maps after multiple attempts. Please refresh the page or try again later.');
            return;
        }
        
        // Clear existing error states
        const errorElements = document.querySelectorAll('.maps-error-fallback');
        errorElements.forEach(el => {
            el.classList.remove('maps-error-fallback');
        });
        
        // Attempt to reinitialize maps
        if (window.partyMapsModal && window.partyMapsModal.currentEvent) {
            setTimeout(() => {
                window.partyMapsModal.initEventMap();
            }, 1000);
        }
        
        // Try to reload the Maps API script if needed
        if (!window.google || !window.google.maps) {
            this.reloadMapsScript();
        }
    }

    reloadMapsScript() {
        console.log('🔄 Reloading Google Maps API script...');
        
        // Remove existing script
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
            existingScript.remove();
        }
        
        // Add new script
        const script = document.createElement('script');
        script.async = true;
        script.defer = true;
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDpL7nevfP-gXmYmAQ3z3Bdwz_4iCn9Lqk&libraries=geometry,places&callback=initGoogleMaps`;
        script.onerror = () => {
            this.handleScriptLoadError();
        };
        
        document.head.appendChild(script);
    }

    openExternalMaps() {
        if (window.partyMapsModal && window.partyMapsModal.currentEvent) {
            const event = window.partyMapsModal.currentEvent;
            const coords = this.getEventCoordinates(event);
            const url = `https://www.google.com/maps/search/${encodeURIComponent(event.venue || event.Address)}/@${coords.lat},${coords.lng},15z`;
            window.open(url, '_blank');
        }
    }

    openAddressSearch() {
        if (window.partyMapsModal && window.partyMapsModal.currentEvent) {
            const event = window.partyMapsModal.currentEvent;
            const address = event.venue || event.Address;
            const url = `https://www.google.com/maps/search/${encodeURIComponent(address)}`;
            window.open(url, '_blank');
        }
    }

    copyAddress() {
        if (window.partyMapsModal && window.partyMapsModal.currentEvent) {
            const event = window.partyMapsModal.currentEvent;
            const address = event.venue || event.Address;
            
            if (navigator.clipboard) {
                navigator.clipboard.writeText(address).then(() => {
                    this.showToast('Address copied to clipboard!');
                });
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = address;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                this.showToast('Address copied to clipboard!');
            }
        }
    }

    openDirections() {
        if (window.partyMapsModal && window.partyMapsModal.currentEvent) {
            const event = window.partyMapsModal.currentEvent;
            const coords = this.getEventCoordinates(event);
            const url = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
            window.open(url, '_blank');
        }
    }

    getEventCoordinates(event) {
        // Try different coordinate field names
        if (event.lat && event.lng) {
            return { lat: parseFloat(event.lat), lng: parseFloat(event.lng) };
        }
        
        if (event.geocoded && event.geocoded.lat && event.geocoded.lng) {
            return { lat: parseFloat(event.geocoded.lat), lng: parseFloat(event.geocoded.lng) };
        }
        
        // Default to Cologne city center
        return { lat: 50.9375, lng: 6.9603 };
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'maps-error-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    getErrorReport() {
        return {
            errors: this.errors,
            retryAttempts: this.retryAttempts,
            fallbackEnabled: this.fallbackEnabled,
            navigator: {
                userAgent: navigator.userAgent,
                onLine: navigator.onLine,
                language: navigator.language
            },
            performance: {
                timing: performance.timing,
                navigation: performance.navigation
            }
        };
    }

    clearErrors() {
        this.errors = [];
        this.retryAttempts = 0;
    }
}

// Initialize error handler
window.mapsErrorHandler = new MapsErrorHandler();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapsErrorHandler;
}