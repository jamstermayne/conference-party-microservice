/**
 * 🎯 GAMESCOM 2025 - ANALYTICS LOADER
 * 
 * Main analytics initialization and coordination script
 * Loads and initializes all analytics modules in correct order
 * Generated: 2025-08-06T19:15:56.662Z
 */

class AnalyticsLoader {
    constructor() {
        this.version = '1.0.0';
        this.modulesLoaded = {
            core: false,
            performance: false,
            privacy: false
        };
        this.initStartTime = Date.now();
        
        console.log('🎯 Analytics Loader starting...');
    }

    /**
     * 🚀 Initialize complete analytics system
     */
    async init() {
        try {
            console.log('📈 Initializing analytics system...');

            // Load scripts in dependency order
            await this.loadScript('/js/analytics-core.js?v=b011');
            await this.loadScript('/js/analytics-performance.js?v=b011'); 
            await this.loadScript('/js/analytics-privacy.js?v=b011');

            // Wait for all modules to be available
            await this.waitForModules();

            // Initialize in correct order: Privacy -> Core -> Performance
            if (window.analyticsPrivacy) {
                window.analyticsPrivacy.init();
                this.modulesLoaded.privacy = true;
            }

            if (window.analyticsCore) {
                await window.analyticsCore.init();
                this.modulesLoaded.core = true;
            }

            // Performance module is initialized by privacy manager after consent
            this.modulesLoaded.performance = !!window.analyticsPerformance;

            const initTime = Date.now() - this.initStartTime;
            console.log(`✅ Analytics system initialized in ${initTime}ms`);

            // Dispatch ready event
            window.dispatchEvent(new CustomEvent('analytics-ready', {
                detail: {
                    version: this.version,
                    modules: this.modulesLoaded,
                    initTime
                }
            }));

        } catch (error) {
            console.error('❌ Analytics initialization failed:', error);
        }
    }

    /**
     * 📦 Load script dynamically
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            // Check if script already exists
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * ⏳ Wait for all modules to be available
     */
    waitForModules() {
        return new Promise((resolve) => {
            const checkModules = () => {
                if (window.analyticsCore && 
                    window.analyticsPerformance && 
                    window.analyticsPrivacy) {
                    resolve();
                } else {
                    setTimeout(checkModules, 50);
                }
            };
            checkModules();
        });
    }

    /**
     * 📊 Get system status
     */
    getStatus() {
        return {
            version: this.version,
            modules: this.modulesLoaded,
            core: window.analyticsCore?.getAnalyticsSummary(),
            performance: window.analyticsPerformance?.getPerformanceSummary(),
            privacy: window.analyticsPrivacy?.getComplianceStatus()
        };
    }
}

// Initialize analytics when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.analyticsLoader = new AnalyticsLoader();
        window.analyticsLoader.init();
    });
} else {
    window.analyticsLoader = new AnalyticsLoader();
    window.analyticsLoader.init();
}

console.log('🎯 Analytics Loader ready');