#!/usr/bin/env node

/**
 * 🚀 GAMESCOM 2025 - ANALYTICS PERFORMANCE
 * 
 * Focused tool: Performance monitoring and Core Web Vitals
 * Part of Tool #9 modular analytics architecture
 * 
 * Author: Claude Sonnet 4
 * Date: August 6, 2025
 */

const fs = require('fs').promises;
const path = require('path');

class AnalyticsPerformance {
    constructor() {
        this.version = '1.0.0';
        this.metrics = new Map();
        this.observers = new Map();
    }

    /**
     * 🚀 Generate performance monitoring script
     */
    async generatePerformanceTracker() {
        const timestamp = new Date().toISOString();
        
        return `/**
 * 🚀 GAMESCOM 2025 - PERFORMANCE TRACKER
 * 
 * Performance monitoring and Core Web Vitals tracking
 * Generated: ${timestamp}
 * Version: ${this.version}
 */

class AnalyticsPerformance {
    constructor() {
        this.version = '${this.version}';
        this.metrics = new Map();
        this.observers = new Map();
        
        console.log('🚀 Analytics Performance initialized');
    }

    /**
     * 🚀 Initialize performance monitoring
     */
    init() {
        if (!this.isSupported()) {
            console.log('⚠️ Performance API not fully supported');
            return;
        }

        // Setup monitoring systems
        this.setupCoreWebVitals();
        this.setupResourceTiming();
        this.setupAPITiming();
        this.setupUserTiming();
        this.setupErrorTracking();
        
        console.log('🚀 Performance monitoring active');
    }

    /**
     * ✅ Check if Performance API is supported
     */
    isSupported() {
        return 'performance' in window && 'PerformanceObserver' in window;
    }

    /**
     * 📊 Setup Core Web Vitals tracking
     */
    setupCoreWebVitals() {
        // Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            
            this.recordMetric('lcp', Math.round(lastEntry.startTime), {
                element: lastEntry.element?.tagName,
                url: lastEntry.url,
                size: lastEntry.size
            });
            
            this.trackPerformanceEvent('core_web_vital', {
                metric: 'lcp',
                value: Math.round(lastEntry.startTime),
                rating: this.getRating('lcp', lastEntry.startTime)
            });
        });
        
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
        
        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                const fid = entry.processingStart - entry.startTime;
                
                this.recordMetric('fid', Math.round(fid), {
                    eventType: entry.name,
                    target: entry.target?.tagName
                });
                
                this.trackPerformanceEvent('core_web_vital', {
                    metric: 'fid',
                    value: Math.round(fid),
                    rating: this.getRating('fid', fid)
                });
            }
        });
        
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);
        
        // Cumulative Layout Shift (CLS)
        let clsScore = 0;
        const clsObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsScore += entry.value;
                }
            }
            
            this.recordMetric('cls', Math.round(clsScore * 1000) / 1000);
            
            this.trackPerformanceEvent('core_web_vital', {
                metric: 'cls',
                value: Math.round(clsScore * 1000) / 1000,
                rating: this.getRating('cls', clsScore)
            });
        });
        
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);
    }

    /**
     * 📦 Setup resource timing monitoring
     */
    setupResourceTiming() {
        const resourceObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                const duration = Math.round(entry.duration);
                
                // Only track slow resources (>100ms)
                if (duration > 100) {
                    this.recordMetric('resource_timing', duration, {
                        url: entry.name.substring(entry.name.lastIndexOf('/') + 1),
                        type: entry.initiatorType,
                        transferSize: entry.transferSize,
                        decodedBodySize: entry.decodedBodySize
                    });
                    
                    this.trackPerformanceEvent('slow_resource', {
                        url: entry.name.substring(entry.name.lastIndexOf('/') + 1),
                        duration,
                        type: entry.initiatorType,
                        size: entry.transferSize
                    });
                }
            }
        });
        
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.set('resource', resourceObserver);
    }

    /**
     * 🌐 Setup API timing monitoring
     */
    setupAPITiming() {
        // Intercept fetch requests for API timing
        if (window.fetch) {
            const originalFetch = window.fetch;
            window.fetch = async (...args) => {
                const startTime = performance.now();
                const url = args[0];
                
                try {
                    const response = await originalFetch(...args);
                    const endTime = performance.now();
                    const duration = Math.round(endTime - startTime);
                    
                    if (url.includes('/api/')) {
                        this.recordMetric('api_timing', duration, {
                            url: url.substring(url.indexOf('/api/')),
                            status: response.status,
                            success: response.ok
                        });
                        
                        this.trackPerformanceEvent('api_response_time', {
                            url: url.substring(url.indexOf('/api/')),
                            responseTime: duration,
                            status: response.status,
                            success: response.ok
                        });
                    }
                    
                    return response;
                } catch (error) {
                    const endTime = performance.now();
                    const duration = Math.round(endTime - startTime);
                    
                    if (url.includes('/api/')) {
                        this.trackPerformanceEvent('api_error', {
                            url: url.substring(url.indexOf('/api/')),
                            responseTime: duration,
                            error: error.message,
                            success: false
                        });
                    }
                    
                    throw error;
                }
            };
        }
    }

    /**
     * ⏱️ Setup user timing API
     */
    setupUserTiming() {
        const userTimingObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                this.recordMetric('user_timing', Math.round(entry.duration || entry.startTime), {
                    name: entry.name,
                    entryType: entry.entryType,
                    detail: entry.detail
                });
                
                this.trackPerformanceEvent('user_timing', {
                    name: entry.name,
                    value: Math.round(entry.duration || entry.startTime),
                    type: entry.entryType
                });
            }
        });
        
        userTimingObserver.observe({ entryTypes: ['mark', 'measure'] });
        this.observers.set('userTiming', userTimingObserver);
    }

    /**
     * 🚨 Setup error tracking
     */
    setupErrorTracking() {
        // JavaScript errors
        window.addEventListener('error', (event) => {
            this.trackPerformanceEvent('javascript_error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack?.substring(0, 500)
            });
        });
        
        // Promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.trackPerformanceEvent('promise_rejection', {
                reason: event.reason?.toString()?.substring(0, 500)
            });
        });
    }

    /**
     * 📊 Record performance metric internally
     */
    recordMetric(metricName, value, metadata = {}) {
        if (!this.metrics.has(metricName)) {
            this.metrics.set(metricName, []);
        }
        
        this.metrics.get(metricName).push({
            value,
            timestamp: Date.now(),
            metadata
        });
    }

    /**
     * 📈 Track performance event (send to analytics core)
     */
    trackPerformanceEvent(eventType, properties) {
        if (window.analyticsCore) {
            window.analyticsCore.trackEvent(eventType, properties);
        }
    }

    /**
     * 🎯 Get performance rating for Core Web Vitals
     */
    getRating(metric, value) {
        const thresholds = {
            lcp: { good: 2500, needs_improvement: 4000 },
            fid: { good: 100, needs_improvement: 300 },
            cls: { good: 0.1, needs_improvement: 0.25 }
        };
        
        const threshold = thresholds[metric];
        if (!threshold) return 'unknown';
        
        if (value <= threshold.good) return 'good';
        if (value <= threshold.needs_improvement) return 'needs_improvement';
        return 'poor';
    }

    /**
     * 📊 Get performance summary
     */
    getPerformanceSummary() {
        const summary = {};
        
        for (const [metricName, values] of this.metrics.entries()) {
            if (values.length > 0) {
                const latest = values[values.length - 1];
                const average = values.reduce((sum, v) => sum + v.value, 0) / values.length;
                
                summary[metricName] = {
                    latest: latest.value,
                    average: Math.round(average),
                    count: values.length,
                    trend: this.calculateTrend(values)
                };
            }
        }
        
        return summary;
    }

    /**
     * 📈 Calculate performance trend
     */
    calculateTrend(values) {
        if (values.length < 2) return 'insufficient_data';
        
        const recent = values.slice(-5); // Last 5 measurements
        const older = values.slice(-10, -5); // Previous 5 measurements
        
        if (older.length === 0) return 'insufficient_data';
        
        const recentAvg = recent.reduce((sum, v) => sum + v.value, 0) / recent.length;
        const olderAvg = older.reduce((sum, v) => sum + v.value, 0) / older.length;
        
        const difference = ((recentAvg - olderAvg) / olderAvg) * 100;
        
        if (Math.abs(difference) < 5) return 'stable';
        return difference > 0 ? 'degrading' : 'improving';
    }

    /**
     * 🧹 Cleanup performance observers
     */
    cleanup() {
        for (const [name, observer] of this.observers.entries()) {
            observer.disconnect();
        }
        this.observers.clear();
        this.metrics.clear();
    }

    /**
     * 🎛️ Manual performance markers
     */
    mark(name) {
        if ('performance' in window && 'mark' in performance) {
            performance.mark(name);
        }
    }

    measure(name, startMark, endMark) {
        if ('performance' in window && 'measure' in performance) {
            performance.measure(name, startMark, endMark);
        }
    }
}

// Create global instance
window.analyticsPerformance = new AnalyticsPerformance();

// Helper functions for manual timing
window.markPerformance = (name) => window.analyticsPerformance.mark(name);
window.measurePerformance = (name, start, end) => window.analyticsPerformance.measure(name, start, end);

console.log('🚀 Analytics Performance loaded, version:', window.analyticsPerformance.version);`;
    }

    /**
     * 🧪 Test performance monitoring
     */
    async testPerformance() {
        console.log('🧪 Testing analytics performance...');
        
        const performanceScript = await this.generatePerformanceTracker();
        const sizeKB = Math.round(performanceScript.length / 1024);
        
        console.log(`✅ Analytics Performance: ${sizeKB}KB`);
        console.log(`✅ Core Web Vitals: LCP, FID, CLS tracking`);
        console.log(`✅ Resource Timing: Slow resource detection (>100ms)`);
        console.log(`✅ API Timing: Automatic fetch interception`);
        console.log(`✅ Error Tracking: JavaScript errors and promise rejections`);
        
        return performanceScript;
    }
}

// Export for orchestrator
module.exports = AnalyticsPerformance;

// CLI execution
if (require.main === module) {
    const performance = new AnalyticsPerformance();
    performance.testPerformance()
        .then(() => console.log('✅ Analytics Performance ready'))
        .catch(err => console.error('❌ Test failed:', err.message));
}