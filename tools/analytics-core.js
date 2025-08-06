#!/usr/bin/env node

/**
 * 📊 GAMESCOM 2025 - ANALYTICS CORE
 * 
 * Focused tool: Core event tracking and data collection
 * Part of Tool #9 modular analytics architecture
 * 
 * Author: Claude Sonnet 4
 * Date: August 6, 2025
 */

const fs = require('fs').promises;
const path = require('path');

class AnalyticsCore {
    constructor() {
        this.version = '1.0.0';
        
        // Core configuration
        this.config = {
            projectId: 'conference-party-app',
            trackingEnabled: true,
            sessionTimeout: 30 * 60 * 1000, // 30 minutes
            batchSize: 10,
            flushInterval: 5000 // 5 seconds
        };

        // Core event types
        this.eventTypes = {
            // User interactions
            'page_view': 'Page viewed',
            'search_query': 'Search performed',
            'event_view': 'Event details viewed',
            'event_save': 'Event saved to calendar',
            'filter_applied': 'Search filter applied',
            'map_interaction': 'Map interaction',
            
            // PWA interactions  
            'pwa_install': 'PWA installed',
            'offline_usage': 'App used offline',
            'cache_hit': 'Data served from cache',
            'background_sync': 'Background sync triggered'
        };
    }

    /**
     * 📊 Generate core analytics tracking script
     */
    async generateCoreTracker() {
        const timestamp = new Date().toISOString();
        
        return `/**
 * 📊 GAMESCOM 2025 - ANALYTICS CORE TRACKER
 * 
 * Core event tracking and data collection
 * Generated: ${timestamp}
 * Version: ${this.version}
 */

class AnalyticsCore {
    constructor() {
        this.version = '${this.version}';
        this.config = ${JSON.stringify(this.config, null, 8)};
        this.eventQueue = [];
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.isEnabled = false;
        
        console.log('📊 Analytics Core initialized');
    }

    /**
     * 🚀 Initialize core tracking
     */
    async init() {
        try {
            // Check if analytics is enabled (privacy consent handled by privacy module)
            this.isEnabled = await this.checkTrackingEnabled();
            
            if (this.isEnabled) {
                console.log('📊 Core tracking enabled');
                
                // Setup automatic tracking
                this.setupPageTracking();
                this.setupInteractionTracking();
                this.setupPWATracking();
                
                // Start batch processing
                this.startBatchProcessor();
                
                // Track initial page view
                this.trackEvent('page_view', {
                    page: location.pathname,
                    referrer: document.referrer,
                    timestamp: Date.now()
                });
            } else {
                console.log('📊 Core tracking disabled');
            }
            
        } catch (error) {
            console.error('❌ Analytics Core initialization failed:', error);
        }
    }

    /**
     * 📊 Track custom event
     */
    trackEvent(eventType, properties = {}) {
        if (!this.isEnabled) return;
        
        const event = {
            eventType,
            properties: {
                ...properties,
                sessionId: this.sessionId,
                timestamp: Date.now(),
                url: location.href
            }
        };
        
        this.eventQueue.push(event);
        
        // Immediate flush for critical events
        if (['error', 'pwa_install', 'offline_usage'].includes(eventType)) {
            this.flushEvents();
        }
    }

    /**
     * 📄 Setup automatic page tracking
     */
    setupPageTracking() {
        // Track page views via history API
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        
        history.pushState = function(...args) {
            originalPushState.apply(history, args);
            window.analyticsCore.trackEvent('page_view', {
                page: location.pathname,
                type: 'navigation'
            });
        };
        
        history.replaceState = function(...args) {
            originalReplaceState.apply(history, args);
            window.analyticsCore.trackEvent('page_view', {
                page: location.pathname,
                type: 'replace'
            });
        };
        
        // Track back/forward navigation
        window.addEventListener('popstate', () => {
            this.trackEvent('page_view', {
                page: location.pathname,
                type: 'popstate'
            });
        });
        
        // Track visibility changes
        document.addEventListener('visibilitychange', () => {
            this.trackEvent('page_visibility', {
                hidden: document.hidden,
                visibilityState: document.visibilityState
            });
        });
    }

    /**
     * 🖱️ Setup interaction tracking
     */
    setupInteractionTracking() {
        // Track clicks on important elements
        document.addEventListener('click', (event) => {
            const target = event.target;
            
            // Track button clicks
            if (target.tagName === 'BUTTON' || target.role === 'button') {
                this.trackEvent('button_click', {
                    buttonText: target.textContent?.substring(0, 50),
                    buttonId: target.id,
                    buttonClass: target.className
                });
            }
            
            // Track link clicks
            if (target.tagName === 'A') {
                this.trackEvent('link_click', {
                    linkText: target.textContent?.substring(0, 50),
                    linkUrl: target.href,
                    external: !target.href.includes(location.hostname)
                });
            }
        });
        
        // Track form submissions
        document.addEventListener('submit', (event) => {
            const form = event.target;
            this.trackEvent('form_submit', {
                formId: form.id,
                formAction: form.action,
                formMethod: form.method
            });
        });
    }

    /**
     * 📱 Setup PWA-specific tracking
     */
    setupPWATracking() {
        // Track PWA installation prompt
        window.addEventListener('beforeinstallprompt', () => {
            this.trackEvent('pwa_install_prompt', {
                prompted: true
            });
        });
        
        window.addEventListener('appinstalled', () => {
            this.trackEvent('pwa_install', {
                installed: true,
                method: 'browser_prompt'
            });
        });
        
        // Track offline/online usage
        window.addEventListener('online', () => {
            this.trackEvent('connection_change', {
                online: true,
                offlineDuration: this.getOfflineDuration()
            });
        });
        
        window.addEventListener('offline', () => {
            this.trackEvent('connection_change', {
                online: false
            });
            this.offlineStartTime = Date.now();
        });
        
        // Track service worker messages
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data.type === 'CACHE_HIT') {
                    this.trackEvent('cache_hit', {
                        url: event.data.url,
                        cacheType: event.data.cacheType
                    });
                }
            });
        }
    }

    /**
     * 🔍 Track search interactions
     */
    trackSearch(query, filters = {}, results = 0) {
        this.trackEvent('search_query', {
            query: query?.substring(0, 100), // Limit for privacy
            filtersUsed: Object.keys(filters).length,
            resultCount: results,
            hasLocation: !!(filters.lat && filters.lng),
            searchType: results > 0 ? 'successful' : 'no_results'
        });
    }

    /**
     * 🎯 Track event interactions
     */
    trackEventInteraction(eventId, action, details = {}) {
        this.trackEvent('event_interaction', {
            eventId,
            action, // 'view', 'save', 'share', etc.
            ...details
        });
    }

    /**
     * 📊 Batch process events
     */
    startBatchProcessor() {
        setInterval(() => {
            if (this.eventQueue.length > 0) {
                this.flushEvents();
            }
        }, this.config.flushInterval);
        
        // Flush before page unload
        window.addEventListener('beforeunload', () => {
            this.flushEvents();
        });
    }

    /**
     * 🚀 Flush events to analytics endpoint
     */
    async flushEvents() {
        if (this.eventQueue.length === 0) return;
        
        const events = this.eventQueue.splice(0, this.config.batchSize);
        
        try {
            const response = await fetch('/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    events,
                    sessionId: this.sessionId,
                    timestamp: Date.now()
                })
            });
            
            if (!response.ok) {
                throw new Error(\`Analytics request failed: \${response.status}\`);
            }
            
        } catch (error) {
            console.error('📊 Analytics flush failed:', error);
            // Re-add events to queue for retry (with limit)
            if (this.eventQueue.length < 100) {
                this.eventQueue.unshift(...events);
            }
        }
    }

    /**
     * ✅ Check if tracking is enabled
     */
    async checkTrackingEnabled() {
        // This will be coordinated with privacy module
        if (window.privacyManager) {
            return window.privacyManager.hasConsent();
        }
        return true; // Default enabled for development
    }

    /**
     * 🆔 Generate unique session ID
     */
    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * ⏱️ Get offline duration
     */
    getOfflineDuration() {
        return this.offlineStartTime ? Date.now() - this.offlineStartTime : 0;
    }

    /**
     * 📈 Get analytics summary
     */
    getAnalyticsSummary() {
        return {
            version: this.version,
            sessionId: this.sessionId,
            sessionDuration: Date.now() - this.startTime,
            queuedEvents: this.eventQueue.length,
            isEnabled: this.isEnabled,
            config: this.config
        };
    }

    /**
     * 🎛️ Enable/disable tracking
     */
    setTrackingEnabled(enabled) {
        this.isEnabled = enabled;
        console.log(\`📊 Analytics tracking \${enabled ? 'enabled' : 'disabled'}\`);
    }
}

// Create global instance
window.analyticsCore = new AnalyticsCore();

// Global helper functions
window.trackSearch = (query, filters, results) => window.analyticsCore.trackSearch(query, filters, results);
window.trackEvent = (eventId, action, details) => window.analyticsCore.trackEventInteraction(eventId, action, details);
window.trackCustom = (eventType, properties) => window.analyticsCore.trackEvent(eventType, properties);

console.log('📊 Analytics Core loaded, version:', window.analyticsCore.version);`;
    }

    /**
     * 🧪 Test core analytics functionality
     */
    async testCore() {
        console.log('🧪 Testing analytics core...');
        
        const coreScript = await this.generateCoreTracker();
        const sizeKB = Math.round(coreScript.length / 1024);
        
        console.log(`✅ Analytics Core: ${sizeKB}KB`);
        console.log(`✅ Event Types: ${Object.keys(this.eventTypes).length}`);
        console.log(`✅ Features: Page tracking, interaction tracking, PWA tracking`);
        console.log(`✅ Batch processing: ${this.config.batchSize} events per ${this.config.flushInterval}ms`);
        
        return coreScript;
    }
}

// Export for orchestrator
module.exports = AnalyticsCore;

// CLI execution
if (require.main === module) {
    const core = new AnalyticsCore();
    core.testCore()
        .then(() => console.log('✅ Analytics Core ready'))
        .catch(err => console.error('❌ Test failed:', err.message));
}