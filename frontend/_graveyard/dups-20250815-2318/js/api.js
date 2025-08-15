// Enhanced API Client with Request Deduplication
class API {
    constructor() {
        this.baseURL = window.CONFIG?.apiBase || '';
        this.cache = new Map();
        this.pendingRequests = new Map(); // Prevent duplicate requests
        this.retryAttempts = 3;
        this.retryDelay = 1000;
    }

    async getEvents() {
        const cacheKey = 'events';
        
        // Return pending request if already in flight
        if (this.pendingRequests.has(cacheKey)) {
            console.log('🔄 Returning pending events request');
            return this.pendingRequests.get(cacheKey);
        }
        
        // Check cache first
        const cached = this.cache.get(cacheKey);
        if (cached && cached.timestamp && Date.now() - cached.timestamp < 300000) { // 5 min TTL
            console.log('📦 Returning cached events');
            return cached.data;
        }
        
        const requestPromise = this.executeGetEvents();
        this.pendingRequests.set(cacheKey, requestPromise);
        
        try {
            const events = await requestPromise;
            this.cache.set(cacheKey, { data: events, timestamp: Date.now() });
            return events;
        } catch (error) {
            console.error('API Error:', error);
            return cached?.data || [];
        } finally {
            this.pendingRequests.delete(cacheKey);
        }
    }
    
    async executeGetEvents() {
        try {
            const [curated, ugc] = await Promise.all([
                this.fetchWithFallback('/api/parties'),
                this.fetchWithFallback('/api/ugc/events', { events: [] })
            ]);

            const events = [...(curated.data || curated), ...(ugc.events || [])];
            console.log(`✅ Loaded ${events.length} events from API`);
            return events;
        } catch (error) {
            console.error('Failed to load events:', error);
            throw error;
        }
    }

    async createEvent(eventData) {
        try {
            const response = await fetch(this.baseURL + '/api/ugc/events/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...eventData,
                    createdAt: new Date().toISOString(),
                    source: 'ugc'
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Create event error:', error);
            return { success: false, error: error.message };
        }
    }

    async fetchWithFallback(endpoint, fallback = {}) {
        try {
            const response = await fetch(this.baseURL + endpoint);
            return await response.json();
        } catch (error) {
            console.warn(`API endpoint ${endpoint} failed, using fallback`);
            return fallback;
        }
    }

    generateCalendarURL(event) {
        const start = new Date(`${event.date}T${event.startTime}`);
        const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
        
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.name)}&dates=${start.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${end.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&location=${encodeURIComponent(event.venue)}`;
    }
}

window.api = new API();