/**
 * 🔍 SEARCH FUNCTIONALITY FIX
 * Fixes the broken search causing 500 errors and crashes
 */

class SearchManager {
    constructor() {
        this.events = [];
        this.searchIndex = null;
        this.isLoading = false;
        this.cache = new Map();
        
        this.init();
    }

    async init() {
        try {
            await this.loadEvents();
            this.buildSearchIndex();
            this.setupSearchUI();
        } catch (error) {
            console.error('Search initialization failed:', error);
            this.showErrorState();
        }
    }

    /**
     * Load events with proper error handling
     */
    async loadEvents() {
        this.isLoading = true;
        this.showLoadingState();

        try {
            // Try multiple sources with fallbacks
            const sources = [
                () => this.loadFromCache(),
                () => this.loadFromAPI(),
                () => this.loadFromBackup()
            ];

            for (const source of sources) {
                try {
                    const events = await source();
                    if (events && events.length > 0) {
                        this.events = events;
                        console.log(`✅ Loaded ${events.length} events`);
                        break;
                    }
                } catch (error) {
                    console.warn('Source failed, trying next:', error.message);
                    continue;
                }
            }

            if (this.events.length === 0) {
                throw new Error('No events loaded from any source');
            }

        } catch (error) {
            console.error('Failed to load events:', error);
            this.events = this.getFallbackEvents();
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    /**
     * Load from service worker cache first
     */
    async loadFromCache() {
        if ('caches' in window) {
            const cache = await caches.open('gamescom-events-v1');
            const response = await cache.match('/api/events');
            if (response) {
                const data = await response.json();
                return data.events || data;
            }
        }
        throw new Error('No cache available');
    }

    /**
     * Load from API with timeout and retry
     */
    async loadFromAPI() {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        try {
            const response = await fetch('/api/parties?limit=100', { // Get all events for search
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            // Cache successful response
            this.cacheResponse(data);
            
            return data.data || data.events || data;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('API request timeout');
            }
            throw error;
        }
    }

    /**
     * Load from static backup data
     */
    async loadFromBackup() {
        // Fallback to your Tool #7 search data
        try {
            const response = await fetch('/offline-data/search-data.json');
            if (response.ok) {
                const data = await response.json();
                return data.events || data;
            }
        } catch (error) {
            console.warn('Backup data not available:', error);
        }
        throw new Error('No backup data available');
    }

    /**
     * Build search index for fast searching
     */
    buildSearchIndex() {
        this.searchIndex = this.events.map(event => ({
            ...event,
            searchText: [
                event.name || event['Event Name'],
                event.description || event['Description'],
                event.venue || event['Address'],
                event.company || event['Company'],
                event.category || event['Category'],
                event.creator || event['Hosts'],
                event.tags?.join(' ')
            ].filter(Boolean).join(' ').toLowerCase()
        }));
        console.log(`✅ Built search index with ${this.searchIndex.length} events`);
    }

    /**
     * Perform search with error handling
     */
    search(query, filters = {}) {
        try {
            if (!query && Object.keys(filters).length === 0) {
                return this.searchIndex || [];
            }

            const normalizedQuery = query.toLowerCase().trim();
            
            let results = this.searchIndex.filter(event => {
                // Text search
                const matchesQuery = !normalizedQuery || 
                    event.searchText.includes(normalizedQuery);

                // Category filter
                const matchesCategory = !filters.category || 
                    (event.category || event['Category']) === filters.category;

                // Date filter
                const matchesDate = !filters.date || 
                    (event.date || event['Date']) === filters.date;

                return matchesQuery && matchesCategory && matchesDate;
            });

            // Sort by relevance
            if (normalizedQuery) {
                results.sort((a, b) => {
                    const aScore = this.calculateRelevanceScore(a, normalizedQuery);
                    const bScore = this.calculateRelevanceScore(b, normalizedQuery);
                    return bScore - aScore;
                });
            }

            console.log(`🔍 Search "${query}" returned ${results.length} results`);
            return results;

        } catch (error) {
            console.error('Search failed:', error);
            return [];
        }
    }

    /**
     * Calculate relevance score for sorting
     */
    calculateRelevanceScore(event, query) {
        let score = 0;
        const name = event.name || event['Event Name'] || '';
        const category = event.category || event['Category'] || '';
        const description = event.description || event['Description'] || '';
        const venue = event.venue || event['Address'] || '';
        
        if (name.toLowerCase().includes(query)) score += 10;
        if (category.toLowerCase().includes(query)) score += 5;
        if (description.toLowerCase().includes(query)) score += 3;
        if (venue.toLowerCase().includes(query)) score += 2;
        
        return score;
    }

    /**
     * Setup search UI with error handling
     */
    setupSearchUI() {
        const searchInput = document.querySelector('#searchInput, .search-input, input[placeholder*="search" i]');
        const categoryFilters = document.querySelectorAll('.filter-chip, .category-filter, .filter-button');
        const resultsContainer = document.querySelector('#events, .events-grid, .events-container, .event-grid');

        if (!searchInput) {
            console.error('Search input not found');
            return;
        }

        // Debounced search
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.performSearch(e.target.value);
            }, 300);
        });

        // Category filters
        categoryFilters.forEach(filter => {
            filter.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleCategoryFilter(e.target);
            });
        });

        // Clear search button
        const clearSearch = document.querySelector('#clearSearch');
        if (clearSearch) {
            clearSearch.addEventListener('click', () => {
                searchInput.value = '';
                this.performSearch('');
            });
        }

        // Initial display
        this.displayResults(this.searchIndex);
    }

    /**
     * Perform search and update UI
     */
    performSearch(query) {
        try {
            const activeCategory = document.querySelector('.filter-chip.active, .category-filter.active, .filter-button.active')?.dataset?.category;
            const filters = {};
            
            if (activeCategory && activeCategory !== 'all') {
                filters.category = activeCategory;
            }

            const results = this.search(query, filters);
            this.displayResults(results);

            // Update search results count
            const resultsCount = document.querySelector('#searchResultsCount');
            if (resultsCount) {
                resultsCount.textContent = `Found ${results.length} events`;
            }

            // Show/hide clear button
            const clearBtn = document.querySelector('#clearSearch');
            if (clearBtn) {
                clearBtn.classList.toggle('hidden', !query);
            }

            // Update URL without reload
            const url = new URL(window.location);
            if (query) {
                url.searchParams.set('q', query);
            } else {
                url.searchParams.delete('q');
            }
            window.history.replaceState({}, '', url);

        } catch (error) {
            console.error('Search performance failed:', error);
            this.showErrorState();
        }
    }

    /**
     * Handle category filter clicks
     */
    handleCategoryFilter(button) {
        // Update active state
        document.querySelectorAll('.filter-chip, .category-filter, .filter-button').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');

        // Perform filtered search
        const searchQuery = document.querySelector('#searchInput, .search-input')?.value || '';
        this.performSearch(searchQuery);
    }

    /**
     * Display search results using virtual scrolling if available
     */
    displayResults(results) {
        // Check if virtual scrolling is available
        if (window.app && window.app.virtualRenderer) {
            window.app.virtualRenderer.setEvents(results);
            return;
        }

        // Fallback to regular display
        const container = document.querySelector('#events, .events-grid, .events-container, .event-grid, main');
        
        if (!container) {
            console.error('Results container not found');
            return;
        }

        if (results.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">🔍</div>
                    <h3>No events found</h3>
                    <p>Try adjusting your search or filters</p>
                </div>
            `;
            return;
        }

        container.innerHTML = results.map(event => this.createEventCard(event)).join('');
        
        // Reinitialize event listeners for new cards
        this.initializeEventCards();
    }

    /**
     * Create event card HTML compatible with existing design
     */
    createEventCard(event) {
        const eventName = event.name || event['Event Name'] || 'Unnamed Event';
        const eventDate = event.date || event['Date'] || '';
        const eventTime = event.startTime || event['Start Time'] || '';
        const eventVenue = event.venue || event['Address'] || '';
        const eventCategory = event.category || event['Category'] || '';
        const eventDescription = event.description || event['Description'] || '';
        const eventCreator = event.creator || event['Hosts'] || '';

        return `
            <article class="event-card ${event.isUGC ? 'ugc-event' : 'curated-event'}" 
                     data-event-id="${event.id}" 
                     data-category="${eventCategory.toLowerCase()}">
                <div class="event-header">
                    <h3 class="event-title">${this.escapeHtml(eventName)}</h3>
                    ${event.isUGC ? '<span class="community-badge">👥 Community</span>' : ''}
                    <div class="event-category">
                        <span class="category-chip">${eventCategory}</span>
                    </div>
                </div>
                
                <div class="event-meta">
                    ${eventDate ? `<div class="meta-item"><span class="meta-icon">📅</span><span class="meta-text">${this.formatDate(eventDate)}</span></div>` : ''}
                    ${eventTime ? `<div class="meta-item"><span class="meta-icon">🕐</span><span class="meta-text">${eventTime}</span></div>` : ''}
                    ${eventVenue ? `<div class="meta-item"><span class="meta-icon">📍</span><span class="meta-text">${this.escapeHtml(eventVenue)}</span></div>` : ''}
                </div>
                
                ${eventDescription ? `<p class="event-description">${this.escapeHtml(this.truncateText(eventDescription, 120))}</p>` : ''}
                
                ${event.isUGC && eventCreator ? `<div class="creator-info">Created by ${this.escapeHtml(eventCreator)}</div>` : ''}

                <div class="event-actions">
                    <button class="btn btn-primary calendar-btn" data-event-id="${event.id}">
                        📅 Add to Calendar
                    </button>
                    <button class="btn btn-secondary share-btn" data-event-id="${event.id}">
                        📤 Share
                    </button>
                </div>
            </article>
        `;
    }

    /**
     * Initialize event card interactions
     */
    initializeEventCards() {
        // Calendar button clicks
        document.querySelectorAll('.calendar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventId = e.target.dataset.eventId;
                this.handleCalendarClick(eventId);
            });
        });

        // Share button clicks
        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventId = e.target.dataset.eventId;
                this.handleShareClick(eventId);
            });
        });
    }

    /**
     * Handle calendar button clicks
     */
    handleCalendarClick(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (event && window.app) {
            window.app.downloadCalendarEvent(event);
        }
    }

    /**
     * Handle share button clicks
     */
    handleShareClick(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (event && window.app) {
            window.app.shareEvent(event);
        }
    }

    /**
     * Utility methods
     */
    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            });
        } catch (error) {
            return dateString;
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }

    cacheResponse(data) {
        if ('caches' in window) {
            caches.open('gamescom-events-v1').then(cache => {
                cache.put('/api/parties?limit=100', new Response(JSON.stringify(data)));
            });
        }
    }

    showLoadingState() {
        const container = document.querySelector('#events, .events-grid, main');
        if (container) {
            container.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner-large"></div>
                    <p>🔍 Loading events...</p>
                </div>
            `;
        }
    }

    hideLoadingState() {
        const loading = document.querySelector('.loading-state');
        if (loading) {
            loading.remove();
        }
    }

    showErrorState() {
        const container = document.querySelector('#events, .events-grid, main');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Unable to load events</h3>
                    <p>Please check your connection and try again</p>
                    <button onclick="window.searchManager.init()" class="btn btn-primary">🔄 Retry</button>
                </div>
            `;
        }
    }

    getFallbackEvents() {
        return [
            {
                id: 'fallback-gamescom-opening',
                name: 'Gamescom 2025 Opening Ceremony',
                'Event Name': 'Gamescom 2025 Opening Ceremony',
                date: '2025-08-20',
                'Date': '2025-08-20',
                startTime: '10:00',
                'Start Time': '10:00',
                venue: 'Koelnmesse Hall 1',
                'Address': 'Koelnmesse Hall 1, Cologne',
                category: 'launch',
                'Category': 'Launch',
                description: 'Official opening ceremony for Gamescom 2025 - the world\'s largest gaming event',
                'Description': 'Official opening ceremony for Gamescom 2025 - the world\'s largest gaming event',
                searchText: 'gamescom 2025 opening ceremony koelnmesse hall 1 launch official gaming event cologne'
            },
            {
                id: 'fallback-networking',
                name: 'Gaming Industry Networking Mixer',
                'Event Name': 'Gaming Industry Networking Mixer',
                date: '2025-08-21',
                'Date': '2025-08-21',
                startTime: '18:00',
                'Start Time': '18:00',
                venue: 'Cologne Conference Center',
                'Address': 'Cologne Conference Center',
                category: 'networking',
                'Category': 'Networking',
                description: 'Connect with gaming professionals and industry leaders',
                'Description': 'Connect with gaming professionals and industry leaders',
                searchText: 'gaming industry networking mixer professionals leaders cologne conference center'
            }
        ];
    }
}

// Initialize search manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.searchManager = new SearchManager();
});

// Export for testing
if (typeof module !== 'undefined') {
    module.exports = SearchManager;
}