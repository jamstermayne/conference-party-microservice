/**
 * 🚀 PERFORMANCE MONITOR & INTEGRATION TESTER
 * Tests all optimization systems and monitors performance metrics
 * Critical for handling 10,000+ concurrent users at Gamescom
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            startup: {},
            storage: {},
            events: {},
            dom: {},
            cache: {},
            memory: {},
            overall: {}
        };
        
        this.benchmarks = {
            storageOps: [],
            eventHandling: [],
            domOperations: [],
            cacheHits: [],
            memoryUsage: []
        };
        
        this.isMonitoring = false;
        this.testResults = {};
        
        this.init();
    }
    
    /**
     * Initialize performance monitoring
     */
    init() {
        // Start basic monitoring
        this.startMonitoring();
        
        // Test optimization systems
        this.testOptimizationSystems();
        
        // Setup periodic reports
        this.setupPeriodicReporting();
        
        console.log('🚀 Performance Monitor initialized - Testing optimization systems');
    }
    
    /**
     * Test all optimization systems
     */
    async testOptimizationSystems() {
        console.log('🧪 Testing optimization systems...');
        
        const tests = [
            this.testStorageManager(),
            this.testEventManager(),
            this.testDOMOptimizer(),
            this.testCacheManager(),
            this.testIntegration()
        ];
        
        const results = await Promise.allSettled(tests);
        
        results.forEach((result, index) => {
            const testNames = ['StorageManager', 'EventManager', 'DOMOptimizer', 'CacheManager', 'Integration'];
            if (result.status === 'fulfilled') {
                console.log(`✅ ${testNames[index]} test passed:`, result.value);
            } else {
                console.error(`❌ ${testNames[index]} test failed:`, result.reason);
            }
        });
        
        this.generatePerformanceReport();
    }
    
    /**
     * Test Storage Manager performance
     */
    async testStorageManager() {
        if (!window.StorageManager) {
            throw new Error('StorageManager not available');
        }
        
        const testData = {
            'test.user.profile': { name: 'Test User', persona: 'developer' },
            'test.preferences': { theme: 'dark', notifications: true },
            'test.large.dataset': new Array(1000).fill(0).map((_, i) => ({ id: i, data: `item_${i}` }))
        };
        
        const startTime = performance.now();
        
        // Test batch operations
        await window.StorageManager.batch(testData);
        
        // Test individual reads
        const profile = window.StorageManager.get('test.user.profile');
        const prefs = window.StorageManager.get('test.preferences');
        const largeData = window.StorageManager.get('test.large.dataset');
        
        const endTime = performance.now();
        
        // Cleanup test data
        Object.keys(testData).forEach(key => {
            window.StorageManager.set(key, null);
        });
        
        return {
            operations: Object.keys(testData).length + 3,
            duration: endTime - startTime,
            avgPerOp: (endTime - startTime) / (Object.keys(testData).length + 3),
            dataSize: JSON.stringify(testData).length,
            success: profile && prefs && largeData
        };
    }
    
    /**
     * Test Event Manager performance
     */
    async testEventManager() {
        if (!window.EventManager) {
            throw new Error('EventManager not available');
        }
        
        const testElement = document.createElement('div');
        testElement.id = 'performance-test-element';
        testElement.innerHTML = `
            <button class="test-btn" data-test="1">Button 1</button>
            <button class="test-btn" data-test="2">Button 2</button>
            <input class="test-input" type="text" value="test">
        `;
        document.body.appendChild(testElement);
        
        const startTime = performance.now();
        let eventCount = 0;
        
        // Test event delegation
        const clickKey = window.$.on('.test-btn', 'click', () => eventCount++);
        const inputKey = window.$.on('.test-input', 'input', () => eventCount++);
        
        // Simulate events
        testElement.querySelector('.test-btn').click();
        testElement.querySelector('[data-test="2"]').click();
        testElement.querySelector('.test-input').dispatchEvent(new Event('input'));
        
        const endTime = performance.now();
        
        // Cleanup
        window.$.off(clickKey);
        window.$.off(inputKey);
        testElement.remove();
        
        return {
            eventsHandled: eventCount,
            duration: endTime - startTime,
            avgPerEvent: (endTime - startTime) / eventCount,
            success: eventCount === 3
        };
    }
    
    /**
     * Test DOM Optimizer performance
     */
    async testDOMOptimizer() {
        if (!window.DOMOptimizer) {
            throw new Error('DOMOptimizer not available');
        }
        
        const testContainer = document.createElement('div');
        testContainer.id = 'dom-test-container';
        document.body.appendChild(testContainer);
        
        const startTime = performance.now();
        
        // Test batched updates
        const elements = [];
        for (let i = 0; i < 100; i++) {
            const element = document.createElement('div');
            element.textContent = `Item ${i}`;
            elements.push(element);
            testContainer.appendChild(element);
        }
        
        // Batch update all elements
        elements.forEach(element => {
            window.DOM.batch(element, {
                styles: { 
                    backgroundColor: 'red',
                    color: 'white',
                    padding: '10px'
                },
                classes: { add: 'updated' },
                attributes: { 'data-updated': 'true' }
            });
        });
        
        // Force flush
        window.DOM.flush();
        
        const endTime = performance.now();
        
        // Verify updates
        const updatedElements = testContainer.querySelectorAll('.updated[data-updated="true"]');
        
        // Cleanup
        testContainer.remove();
        
        return {
            elementsUpdated: updatedElements.length,
            operations: elements.length * 3, // styles, classes, attributes
            duration: endTime - startTime,
            avgPerOp: (endTime - startTime) / (elements.length * 3),
            success: updatedElements.length === 100
        };
    }
    
    /**
     * Test Cache Manager performance
     */
    async testCacheManager() {
        if (!window.CacheManager) {
            throw new Error('CacheManager not available');
        }
        
        const testData = {
            'cache.test.simple': 'simple string',
            'cache.test.object': { complex: true, data: [1, 2, 3] },
            'cache.test.large': new Array(10000).fill(0).map((_, i) => `item_${i}`),
            'cache.test.compressed': new Array(1000).fill(0).map((_, i) => ({ 
                id: i, 
                data: 'This is a long string that should be compressed automatically when stored in cache'
            }))
        };
        
        const startTime = performance.now();
        
        // Test cache sets
        const setPromises = Object.entries(testData).map(([key, value]) => 
            window.Cache.set(key, value, { ttl: 60000 })
        );
        await Promise.all(setPromises);
        
        // Test cache gets
        const getPromises = Object.keys(testData).map(key => 
            window.Cache.get(key)
        );
        const results = await Promise.all(getPromises);
        
        const endTime = performance.now();
        
        // Test cache stats
        const stats = window.Cache.stats();
        
        // Cleanup
        Object.keys(testData).forEach(key => {
            window.Cache.delete(key);
        });
        
        return {
            operations: Object.keys(testData).length * 2, // sets + gets
            duration: endTime - startTime,
            cacheHits: stats.hits,
            cacheEfficiency: stats.cacheEfficiency,
            memoryUsage: stats.memoryUsageMB,
            success: results.every(result => result !== null)
        };
    }
    
    /**
     * Test system integration
     */
    async testIntegration() {
        console.log('🔗 Testing system integration...');
        
        const startTime = performance.now();
        
        // Test complete user workflow
        const userId = `test_user_${Date.now()}`;
        
        // 1. Storage Manager batch operation
        await window.StorageManager.batch({
            'user.id': userId,
            'user.persona': 'developer',
            'user.profile': { name: 'Integration Test', company: 'Test Corp' }
        });
        
        // 2. Cache Manager with loader
        const userProfile = await window.Cache.remember(
            `profile.${userId}`,
            async () => {
                return window.StorageManager.get('user.profile');
            },
            60000
        );
        
        // 3. Event Manager delegation
        const testButton = document.createElement('button');
        testButton.className = 'integration-test-btn';
        testButton.textContent = 'Test Integration';
        document.body.appendChild(testButton);
        
        let eventTriggered = false;
        const eventKey = window.$.on('.integration-test-btn', 'click', () => {
            eventTriggered = true;
        });
        
        // 4. DOM Optimizer batch update
        window.DOM.batch(testButton, {
            styles: { backgroundColor: 'green', color: 'white' },
            classes: { add: 'integration-tested' }
        });
        
        // Trigger event
        testButton.click();
        
        // 5. Verify all systems worked together
        const cachedProfile = await window.Cache.get(`profile.${userId}`);
        const storedPersona = window.StorageManager.get('user.persona');
        
        const endTime = performance.now();
        
        // Cleanup
        window.$.off(eventKey);
        testButton.remove();
        window.Cache.delete(`profile.${userId}`);
        window.StorageManager.batch({
            'user.id': null,
            'user.persona': null,
            'user.profile': null
        });
        
        return {
            duration: endTime - startTime,
            storageWorking: storedPersona === 'developer',
            cacheWorking: cachedProfile && cachedProfile.name === 'Integration Test',
            eventWorking: eventTriggered,
            domWorking: testButton.classList.contains('integration-tested'),
            success: storedPersona === 'developer' && cachedProfile && eventTriggered
        };
    }
    
    /**
     * Start continuous performance monitoring
     */
    startMonitoring() {
        this.isMonitoring = true;
        
        // Monitor key metrics every 5 seconds
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
        }, 5000);
        
        // Monitor performance observer if available
        if (typeof PerformanceObserver !== 'undefined') {
            this.setupPerformanceObserver();
        }
    }
    
    /**
     * Collect performance metrics
     */
    collectMetrics() {
        if (!this.isMonitoring) return;
        
        const now = performance.now();
        
        // Storage metrics
        if (window.StorageManager) {
            this.metrics.storage = window.StorageManager.getStats();
        }
        
        // Event metrics
        if (window.EventManager) {
            this.metrics.events = window.EventManager.getStats();
        }
        
        // DOM metrics
        if (window.DOMOptimizer) {
            this.metrics.dom = window.DOMOptimizer.getStats();
        }
        
        // Cache metrics
        if (window.CacheManager) {
            this.metrics.cache = window.CacheManager.getStats();
        }
        
        // Memory metrics
        if (performance.memory) {
            this.metrics.memory = {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
        }
        
        // Overall metrics
        this.metrics.overall = {
            timestamp: now,
            uptime: now,
            elementsCount: document.querySelectorAll('*').length,
            listenersActive: this.metrics.events.directListeners + this.metrics.events.delegatedHandlers
        };
    }
    
    /**
     * Setup performance observer
     */
    setupPerformanceObserver() {
        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.entryType === 'measure') {
                        this.benchmarks.domOperations.push({
                            name: entry.name,
                            duration: entry.duration,
                            timestamp: entry.startTime
                        });
                    }
                }
            });
            
            observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
        } catch (error) {
            console.warn('Performance Observer not fully supported:', error);
        }
    }
    
    /**
     * Generate comprehensive performance report
     */
    generatePerformanceReport() {
        const report = {
            timestamp: new Date().toISOString(),
            optimization_systems: {
                storage_manager: {
                    status: window.StorageManager ? '✅ Active' : '❌ Missing',
                    stats: window.StorageManager?.getStats() || null
                },
                event_manager: {
                    status: window.EventManager ? '✅ Active' : '❌ Missing',
                    stats: window.EventManager?.getStats() || null
                },
                dom_optimizer: {
                    status: window.DOMOptimizer ? '✅ Active' : '❌ Missing',
                    stats: window.DOMOptimizer?.getStats() || null
                },
                cache_manager: {
                    status: window.CacheManager ? '✅ Active' : '❌ Missing',
                    stats: window.CacheManager?.getStats() || null
                }
            },
            test_results: this.testResults,
            current_metrics: this.metrics,
            recommendations: this.generateRecommendations()
        };
        
        console.group('🚀 PERFORMANCE OPTIMIZATION REPORT');
        console.log('📊 Optimization Systems Status:');
        Object.entries(report.optimization_systems).forEach(([system, data]) => {
            console.log(`  ${system}: ${data.status}`);
        });
        
        console.log('📈 Current Performance Metrics:', this.metrics);
        console.log('🧪 Test Results:', this.testResults);
        console.log('💡 Recommendations:', report.recommendations);
        console.groupEnd();
        
        return report;
    }
    
    /**
     * Generate performance recommendations
     */
    generateRecommendations() {
        const recommendations = [];
        
        // Check memory usage
        if (this.metrics.memory?.used > 100) {
            recommendations.push('High memory usage detected. Consider clearing caches periodically.');
        }
        
        // Check cache efficiency
        if (this.metrics.cache?.cacheEfficiency < 70) {
            recommendations.push('Cache efficiency below 70%. Review cache strategies and TTL settings.');
        }
        
        // Check event listeners
        if (this.metrics.events?.directListeners > 50) {
            recommendations.push('High number of direct event listeners. Consider more event delegation.');
        }
        
        // Check DOM operations
        if (this.metrics.dom?.queuedUpdates > 10) {
            recommendations.push('High DOM update queue. Consider batching more operations.');
        }
        
        // Check storage operations
        if (this.metrics.storage?.sizeKB > 5000) {
            recommendations.push('Large localStorage usage. Consider data compression or cleanup.');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('✅ All systems performing optimally!');
        }
        
        return recommendations;
    }
    
    /**
     * Setup periodic performance reports
     */
    setupPeriodicReporting() {
        // Generate report every 2 minutes during development
        if (window.location.hostname === 'localhost' || window.location.hostname.includes('codespaces')) {
            setInterval(() => {
                this.generatePerformanceReport();
            }, 120000);
        }
    }
    
    /**
     * Stop monitoring
     */
    stopMonitoring() {
        this.isMonitoring = false;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
    }
    
    /**
     * Get current performance stats
     */
    getStats() {
        return {
            metrics: this.metrics,
            benchmarks: this.benchmarks,
            recommendations: this.generateRecommendations()
        };
    }
}

// Initialize performance monitor
window.PerformanceMonitor = new PerformanceMonitor();

// Add global performance testing function
window.testPerformance = () => {
    return window.PerformanceMonitor.testOptimizationSystems();
};

// Add global stats function
window.performanceStats = () => {
    return window.PerformanceMonitor.getStats();
};

console.log('🚀 Performance Monitor loaded - Run testPerformance() to test optimization systems');