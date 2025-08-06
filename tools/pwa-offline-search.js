#!/usr/bin/env node

/**
 * 🔍 GAMESCOM 2025 - OFFLINE SEARCH GENERATOR
 * 
 * Focused tool: Generate complete offline search functionality
 * Part of Tool #8 modular architecture
 * 
 * Author: Claude Sonnet 4
 * Date: August 6, 2025
 */

const fs = require('fs').promises;
const path = require('path');

class OfflineSearchGenerator {
    constructor() {
        this.version = '1.0.0';
    }

    /**
     * 🔍 Generate complete offline search JavaScript
     */
    async generateOfflineSearch(searchData) {
        const timestamp = new Date().toISOString();
        
        return `/**
 * 🔍 GAMESCOM 2025 - OFFLINE SEARCH
 * 
 * Complete offline search functionality using cached data
 * Generated: ${timestamp}
 * Events: ${searchData.totalEvents}
 */

class OfflineSearch {
    constructor() {
        this.searchData = null;
        this.searchIndex = null;
        this.isReady = false;
        this.init();
    }

    /**
     * 🚀 Initialize offline search
     */
    async init() {
        try {
            await this.loadSearchData();
            this.buildSearchIndex();
            this.isReady = true;
            console.log('🔍 Offline search ready:', this.searchData.totalEvents, 'events');
        } catch (error) {
            console.error('❌ Offline search initialization failed:', error);
        }
    }

    /**
     * 📊 Load search data from cache or embedded data
     */
    async loadSearchData() {
        // Try to get from cache first
        if (window.cacheUtils) {
            this.searchData = await window.cacheUtils.getCachedData('/offline-data/search-index.json');
        }

        // Fallback to embedded data
        if (!this.searchData) {
            this.searchData = ${JSON.stringify(searchData)};
            console.log('📊 Using embedded search data');
        } else {
            console.log('📊 Using cached search data');
        }
    }

    /**
     * 🏗️ Build search index for faster lookups
     */
    buildSearchIndex() {
        this.searchIndex = {
            byText: new Map(),
            byCategory: new Map(),
            byHost: new Map(),
            byVenue: new Map(),
            byDate: new Map()
        };

        // Index each event for fast searching
        this.searchData.events.forEach((event, index) => {
            // Text search index
            const searchText = [
                event.name,
                event.category,
                event.hosts,
                event.address,
                ...(event.keywords || [])
            ].join(' ').toLowerCase();

            const words = searchText.split(/\\s+/);
            words.forEach(word => {
                if (word.length > 2) {
                    if (!this.searchIndex.byText.has(word)) {
                        this.searchIndex.byText.set(word, new Set());
                    }
                    this.searchIndex.byText.get(word).add(index);
                }
            });

            // Category index
            if (event.category) {
                if (!this.searchIndex.byCategory.has(event.category)) {
                    this.searchIndex.byCategory.set(event.category, new Set());
                }
                this.searchIndex.byCategory.get(event.category).add(index);
            }

            // Host index
            if (event.hosts) {
                event.hosts.split(',').forEach(host => {
                    const cleanHost = host.trim();
                    if (!this.searchIndex.byHost.has(cleanHost)) {
                        this.searchIndex.byHost.set(cleanHost, new Set());
                    }
                    this.searchIndex.byHost.get(cleanHost).add(index);
                });
            }

            // Venue index
            if (event.venues && event.venues.length > 0) {
                event.venues.forEach(venue => {
                    if (!this.searchIndex.byVenue.has(venue)) {
                        this.searchIndex.byVenue.set(venue, new Set());
                    }
                    this.searchIndex.byVenue.get(venue).add(index);
                });
            }

            // Date index
            if (event.date) {
                if (!this.searchIndex.byDate.has(event.date)) {
                    this.searchIndex.byDate.set(event.date, new Set());
                }
                this.searchIndex.byDate.get(event.date).add(index);
            }
        });

        console.log('🏗️ Search index built:', {
            textTerms: this.searchIndex.byText.size,
            categories: this.searchIndex.byCategory.size,
            hosts: this.searchIndex.byHost.size,
            venues: this.searchIndex.byVenue.size,
            dates: this.searchIndex.byDate.size
        });
    }

    /**
     * 🔍 Main search function
     */
    search(query = '', filters = {}) {
        if (!this.isReady) {
            return { events: [], total: 0, message: 'Search index loading...' };
        }

        let results = new Set();
        let isFirstFilter = true;

        // Text search
        if (query && query.trim()) {
            const textResults = this.searchByText(query.trim().toLowerCase());
            results = textResults;
            isFirstFilter = false;
        }

        // Apply filters
        ['category', 'host', 'venue', 'date'].forEach(filterType => {
            if (filters[filterType]) {
                const filterResults = this.searchIndex[\`by\${filterType.charAt(0).toUpperCase() + filterType.slice(1)}\`]
                    .get(filters[filterType]) || new Set();
                results = isFirstFilter ? filterResults : this.intersectSets(results, filterResults);
                isFirstFilter = false;
            }
        });

        // If no filters applied, return all events
        if (isFirstFilter) {
            results = new Set(this.searchData.events.map((_, index) => index));
        }

        // Convert indices to actual events
        const events = Array.from(results).map(index => this.searchData.events[index]);

        // Location-based filtering
        let filteredEvents = events;
        if (filters.lat && filters.lng && filters.radiusKm) {
            filteredEvents = this.filterByLocation(events, filters.lat, filters.lng, filters.radiusKm);
        }

        // Sort results by date, then time, then name
        filteredEvents.sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime);
            return a.name.localeCompare(b.name);
        });

        return {
            events: filteredEvents,
            total: filteredEvents.length,
            query,
            filters,
            message: filteredEvents.length === 0 ? 'No events found matching your criteria' : null
        };
    }

    /**
     * 📝 Search by text query
     */
    searchByText(query) {
        const words = query.split(/\\s+/).filter(word => word.length > 1);
        let results = null;

        words.forEach(word => {
            let wordResults = new Set();

            // Find all index entries that contain this word (partial matching)
            this.searchIndex.byText.forEach((eventIndices, indexWord) => {
                if (indexWord.includes(word)) {
                    eventIndices.forEach(index => wordResults.add(index));
                }
            });

            // Intersect with previous results (AND logic)
            results = results ? this.intersectSets(results, wordResults) : wordResults;
        });

        return results || new Set();
    }

    /**
     * 📍 Filter events by location
     */
    filterByLocation(events, lat, lng, radiusKm) {
        return events.filter(event => {
            if (!event.coordinates) return false;

            const distance = this.calculateDistance(
                lat, lng,
                event.coordinates.lat, event.coordinates.lng
            );

            return distance <= radiusKm;
        });
    }

    /**
     * 📏 Calculate distance between coordinates (Haversine formula)
     */
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    toRadians(degrees) { return degrees * (Math.PI / 180); }
    intersectSets(set1, set2) { return new Set([...set1].filter(x => set2.has(x))); }

    /**
     * 📊 Get available filter options
     */
    getFilterOptions() {
        if (!this.isReady) return null;
        return {
            categories: Array.from(this.searchIndex.byCategory.keys()).sort(),
            hosts: Array.from(this.searchIndex.byHost.keys()).sort(),
            venues: Array.from(this.searchIndex.byVenue.keys()).sort(),
            dates: Array.from(this.searchIndex.byDate.keys()).sort()
        };
    }

    /**
     * 🎯 Get event by ID
     */
    getEventById(id) {
        if (!this.isReady) return null;
        return this.searchData.events.find(event => event.id === id);
    }

    /**
     * 📈 Search statistics
     */
    getStats() {
        if (!this.isReady) return null;
        return {
            totalEvents: this.searchData.totalEvents,
            categories: this.searchIndex.byCategory.size,
            hosts: this.searchIndex.byHost.size,
            venues: this.searchIndex.byVenue.size,
            dates: this.searchIndex.byDate.size,
            textTerms: this.searchIndex.byText.size,
            lastUpdated: this.searchData.generated
        };
    }
}

// Create global offline search instance
window.offlineSearch = new OfflineSearch();

console.log('🔍 Offline search loaded');`;
    }

    /**
     * 🛠️ Generate cache utilities JavaScript
     */
    async generateCacheUtils() {
        const timestamp = new Date().toISOString();
        
        return `/**
 * 🛠️ GAMESCOM 2025 - CACHE UTILITIES
 * 
 * Client-side cache management and offline capabilities
 * Generated: ${timestamp}
 */

class CacheUtils {
    constructor() {
        this.version = '${this.version}';
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
            indicator.className = \`connection-indicator \${status}\`;
            indicator.textContent = status === 'online' ? '🟢 Online' : '🔴 Offline';
        }

        const offlineNotice = document.querySelector('.offline-notice');
        if (offlineNotice) {
            offlineNotice.style.display = status === 'offline' ? 'block' : 'none';
        }
    }
}

window.cacheUtils = new CacheUtils();
console.log('🛠️ Cache utilities loaded, version:', window.cacheUtils.version);`;
    }

    /**
     * 🧪 Test offline search generation
     */
    async testGeneration() {
        console.log('🧪 Testing offline search generation...');
        
        const mockSearchData = {
            totalEvents: 58,
            events: [
                { id: '1', name: 'Test Party', category: 'Mixer', hosts: 'Test Host', date: '2025-08-20' }
            ],
            filters: {
                categories: ['Mixer', 'Conference'],
                hosts: ['Test Host'],
                venues: ['Test Venue']
            },
            generated: new Date().toISOString()
        };

        const offlineSearch = await this.generateOfflineSearch(mockSearchData);
        const cacheUtils = await this.generateCacheUtils();
        
        console.log(`✅ Offline Search generated: ${Math.round(offlineSearch.length / 1024)}KB`);
        console.log(`✅ Cache Utils generated: ${Math.round(cacheUtils.length / 1024)}KB`);
        console.log(`✅ Search indexes: 5 types (text, category, host, venue, date)`);
        console.log(`✅ Features: Full text search, filters, location-based, statistics`);
        
        return { offlineSearch, cacheUtils };
    }
}

// Export for use by orchestrator
module.exports = OfflineSearchGenerator;

// CLI execution
if (require.main === module) {
    const generator = new OfflineSearchGenerator();
    generator.testGeneration()
        .then(() => console.log('✅ Offline Search generator ready'))
        .catch(err => console.error('❌ Test failed:', err.message));
}