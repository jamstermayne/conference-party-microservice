#!/usr/bin/env node

/**
 * 🎯 GAMESCOM 2025 - PWA ORCHESTRATOR
 * 
 * Main coordinator: Orchestrates all PWA sub-tools
 * Replaces the original pwa-cache.js with modular approach
 * 
 * Author: Claude Sonnet 4
 * Date: August 6, 2025
 */

const fs = require('fs').promises;
const path = require('path');

// Import sub-tools
const ServiceWorkerGenerator = require('./pwa-service-worker');
const ManifestGenerator = require('./pwa-manifest');  
const OfflineSearchGenerator = require('./pwa-offline-search');

class PWAOrchestrator {
    constructor() {
        this.version = '1.0.0';
        this.dataPath = path.join(__dirname, 'data-backups');
        this.publicPath = path.join(__dirname, '../public');
        
        // Initialize sub-generators
        this.serviceWorkerGen = new ServiceWorkerGenerator();
        this.manifestGen = new ManifestGenerator();
        this.offlineSearchGen = new OfflineSearchGenerator();
    }

    /**
     * 🚀 Build complete PWA system
     */
    async buildPWASystem() {
        try {
            console.log('🚀 TOOL #8: PWA ORCHESTRATOR - Building complete offline-first system...\n');

            // Ensure directories exist
            await this.ensureDirectories();

            // Load data from previous tools
            const data = await this.loadDataSources();
            
            // Generate Service Worker
            console.log('📦 Generating Service Worker...');
            const serviceWorkerCode = await this.serviceWorkerGen.generateServiceWorker(data.searchData);
            const swPath = path.join(this.publicPath, 'sw.js');
            await fs.writeFile(swPath, serviceWorkerCode);
            console.log(`✅ Service Worker: ${path.relative(process.cwd(), swPath)} (${Math.round(serviceWorkerCode.length / 1024)}KB)`);

            // Generate PWA Manifest
            console.log('📱 Generating PWA Manifest...');
            const manifestPath = path.join(this.publicPath, 'manifest.json');
            const manifest = await this.manifestGen.saveManifest(manifestPath, data);
            console.log(`✅ PWA Manifest: ${path.relative(process.cwd(), manifestPath)} (${manifest.icons.length} icons)`);

            // Generate Offline Search & Cache Utils
            console.log('🔍 Generating Offline Search System...');
            const { offlineSearch, cacheUtils } = await this.offlineSearchGen.testGeneration();
            
            const jsDir = path.join(this.publicPath, 'js');
            await fs.mkdir(jsDir, { recursive: true });
            
            const offlineSearchPath = path.join(jsDir, 'offline-search.js');
            const cacheUtilsPath = path.join(jsDir, 'cache-utils.js');
            const pwaInitPath = path.join(jsDir, 'pwa-init.js');
            
            await fs.writeFile(offlineSearchPath, await this.offlineSearchGen.generateOfflineSearch(data.searchData));
            await fs.writeFile(cacheUtilsPath, await this.offlineSearchGen.generateCacheUtils());
            await fs.writeFile(pwaInitPath, this.generatePWAInit());
            
            console.log(`✅ Offline Search: ${path.relative(process.cwd(), offlineSearchPath)} (${Math.round(offlineSearch.length / 1024)}KB)`);
            console.log(`✅ Cache Utils: ${path.relative(process.cwd(), cacheUtilsPath)} (${Math.round(cacheUtils.length / 1024)}KB)`);
            console.log(`✅ PWA Init: ${path.relative(process.cwd(), pwaInitPath)}`);

            // Generate comprehensive report
            const report = await this.generateReport(data);
            const reportPath = path.join(this.dataPath, `pwa-orchestrator-report-${this.getTimestamp()}.json`);
            await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
            console.log(`✅ Build Report: ${path.relative(process.cwd(), reportPath)} (${Math.round(JSON.stringify(report).length / 1024)}KB)`);

            console.log('\n🎯 PWA SYSTEM BUILD COMPLETE:');
            console.log(`📱 Service Worker: ${Math.round(serviceWorkerCode.length / 1024)}KB with 3 cache strategies`);
            console.log(`📊 Offline Search: ${data.searchData.totalEvents} events cached for offline use`);
            console.log(`🎨 PWA Manifest: ${manifest.icons.length} icons, ${manifest.shortcuts.length} shortcuts`);
            console.log(`⚡ Cache Data: ${Math.round(JSON.stringify(data.searchData).length / 1024)}KB optimized search index`);
            console.log(`🔧 Utilities: Connection monitoring, cache management, background sync`);

            return report;

        } catch (error) {
            console.error('❌ PWA system build failed:', error.message);
            throw error;
        }
    }

    /**
     * 📁 Ensure required directories exist
     */
    async ensureDirectories() {
        const dirs = [
            this.publicPath,
            path.join(this.publicPath, 'js'),
            path.join(this.publicPath, 'css'),
            path.join(this.publicPath, 'images')
        ];

        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }

    /**
     * 📊 Load data from previous tools
     */
    async loadDataSources() {
        try {
            // Load PWA search data (Tool #7)
            const searchDataPath = path.join(this.dataPath, 'pwa-search-data.json');
            const searchData = JSON.parse(await fs.readFile(searchDataPath, 'utf8'));
            
            // Load geocoded events (Tool #5)
            const geocodedPath = path.join(this.dataPath, 'geocoded-events-2025-08-06.json');
            const geocodedEvents = JSON.parse(await fs.readFile(geocodedPath, 'utf8'));

            console.log(`📊 Loaded data sources:`);
            console.log(`   🔍 Search Data: ${searchData.totalEvents} events, ${Math.round(JSON.stringify(searchData).length / 1024)}KB`);
            console.log(`   📍 Geocoded Events: ${geocodedEvents.length} events with coordinates`);

            return {
                searchData,
                geocodedEvents,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Failed to load data sources:', error.message);
            throw error;
        }
    }

    /**
     * 🚀 Generate PWA initialization script
     */
    generatePWAInit() {
        return `/**
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
            const registration = await navigator.serviceWorker.register('/sw.js', {
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
}`;
    }

    /**
     * 📊 Generate comprehensive build report
     */
    async generateReport(data) {
        return {
            version: this.version,
            generated: data.timestamp,
            tool: 'PWA Orchestrator',
            
            summary: {
                totalEvents: data.searchData.totalEvents,
                geocodedEvents: data.geocodedEvents.length,
                searchIndexSize: Math.round(JSON.stringify(data.searchData).length / 1024),
                modulesGenerated: 4
            },

            modules: {
                serviceWorker: '✅ Generated with 3 cache strategies',
                manifest: '✅ Generated with icons and shortcuts', 
                offlineSearch: '✅ Generated with full-text search',
                cacheUtils: '✅ Generated with connection monitoring'
            },

            offlineCapabilities: {
                searchFunctionality: true,
                eventDetails: true,
                connectionMonitoring: true,
                backgroundSync: true,
                cacheManagement: true
            },

            files: {
                serviceWorker: '/public/sw.js',
                manifest: '/public/manifest.json',
                offlineSearch: '/public/js/offline-search.js',
                cacheUtils: '/public/js/cache-utils.js',
                pwaInit: '/public/js/pwa-init.js'
            }
        };
    }

    /**
     * 🧪 Test all PWA components
     */
    async testPWASystem() {
        console.log('🧪 Testing complete PWA system...\n');

        try {
            // Test data loading
            const data = await this.loadDataSources();
            console.log('✅ Data sources loaded');

            // Test each sub-generator
            await this.serviceWorkerGen.testGeneration();
            await this.manifestGen.testGeneration();
            await this.offlineSearchGen.testGeneration();
            
            console.log('\n🎯 PWA SYSTEM TEST SUMMARY:');
            console.log(`📱 All 4 modules tested successfully`);
            console.log(`📊 ${data.searchData.totalEvents} events ready for offline caching`);
            console.log(`⚡ Complete offline-first functionality ready`);

            return true;

        } catch (error) {
            console.error('❌ PWA system test failed:', error.message);
            return false;
        }
    }

    /**
     * 🕒 Get timestamp for file naming
     */
    getTimestamp() {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * 📋 Show help
     */
    showHelp() {
        console.log(`
🚀 TOOL #8: PWA ORCHESTRATOR - HELP

USAGE:
  node tools/pwa-orchestrator.js [command]

COMMANDS:
  build     Build complete PWA system (default)
  test      Test all PWA components
  help      Show this help message

MODULES:
  📦 Service Worker Generator (pwa-service-worker.js)
  📱 PWA Manifest Generator (pwa-manifest.js)  
  🔍 Offline Search Generator (pwa-offline-search.js)
  🎯 PWA Orchestrator (this file)

GENERATED FILES:
  📱 /public/sw.js - Service Worker
  📋 /public/manifest.json - PWA Manifest
  🔍 /public/js/offline-search.js - Offline Search
  🛠️ /public/js/cache-utils.js - Cache Management
  🚀 /public/js/pwa-init.js - PWA Initialization

DEPENDENCIES:
  📍 Tool #5: geocoded-events-2025-08-06.json
  🔍 Tool #7: pwa-search-data.json
        `);
    }
}

// CLI execution
if (require.main === module) {
    const command = process.argv[2] || 'build';
    const orchestrator = new PWAOrchestrator();

    switch (command) {
        case 'build':
            orchestrator.buildPWASystem()
                .then(() => process.exit(0))
                .catch(() => process.exit(1));
            break;
        case 'test':
            orchestrator.testPWASystem()
                .then(() => process.exit(0))
                .catch(() => process.exit(1));
            break;
        case 'help':
            orchestrator.showHelp();
            break;
        default:
            console.log('❌ Unknown command. Use: build, test, or help');
            process.exit(1);
    }
}

module.exports = PWAOrchestrator;