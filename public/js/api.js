// API Client - Modular & Focused
class API {
    constructor() {
        this.baseURL = window.CONFIG?.apiBase || 'https://us-central1-conference-party-app.cloudfunctions.net';
        this.cache = new Map();
    }

    async getEvents() {
        try {
            const cacheKey = 'events';
            if (this.cache.has(cacheKey) && !navigator.onLine) {
                return this.cache.get(cacheKey);
            }

            const [curated, ugc] = await Promise.all([
                this.fetchWithFallback('/api/parties'),
                this.fetchWithFallback('/api/ugc/events', { events: [] })
            ]);

            const events = [...(curated.data || curated), ...(ugc.events || [])];
            this.cache.set(cacheKey, events);
            return events;
        } catch (error) {
            console.error('API Error:', error);
            return this.cache.get('events') || [];
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