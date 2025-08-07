// Main App - Clean & Modular
class GamescomApp {
    constructor() {
        this.events = [];
        this.filteredEvents = [];
        this.currentFilter = 'all';
    }

    async init() {
        console.log('🎮 Gamescom App Starting...');
        
        await this.loadEvents();
        this.setupUI();
        this.registerServiceWorker();
        
        console.log(`✅ Loaded ${this.events.length} events`);
    }

    async loadEvents() {
        this.events = await window.api.getEvents();
        this.filteredEvents = [...this.events];
    }

    setupUI() {
        this.setupEventListeners();
        this.renderFilters();
        this.renderEvents();
    }

    setupEventListeners() {
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterEvents(e.target.value, this.currentFilter);
        });

        document.getElementById('createBtn').addEventListener('click', () => {
            this.showModal();
        });

        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('eventForm').addEventListener('submit', (e) => {
            this.handleCreateEvent(e);
        });

        document.getElementById('modal').addEventListener('click', (e) => {
            if (e.target.id === 'modal') this.closeModal();
        });
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(() => console.log('Service Worker registered'))
                .catch(console.warn);
        }
    }

    renderFilters() {
        const filters = ['all', 'networking', 'afterparty', 'mixer', 'launch', 'today'];
        const container = document.getElementById('filters');
        
        container.innerHTML = filters.map(filter => 
            `<button class="filter ${filter === 'all' ? 'active' : ''}" 
                     onclick="app.setFilter('${filter}')">
                ${this.formatFilterName(filter)}
             </button>`
        ).join('');
    }

    renderEvents() {
        const container = document.getElementById('events');
        
        if (this.filteredEvents.length === 0) {
            container.innerHTML = '<div class="loading">No events found</div>';
            return;
        }

        container.innerHTML = this.filteredEvents.map(event => `
            <div class="event">
                <h3>${event.name}</h3>
                <p>by ${event.hosts}</p>
                
                <div class="event-meta">
                    <div>📅 ${this.formatDate(event.date)}</div>
                    <div>🕐 ${event.startTime}</div>
                    <div>📍 ${event.venue}</div>
                    <div>🎯 ${event.category}</div>
                </div>
                
                ${event.description ? `<p>${event.description}</p>` : ''}
                
                <div class="event-actions">
                    <button class="btn-primary" onclick="app.addToCalendar('${event.id}')">
                        📅 Calendar
                    </button>
                    <button class="btn-secondary" onclick="app.shareEvent('${event.id}')">
                        📤 Share
                    </button>
                </div>
            </div>
        `).join('');
    }

    setFilter(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter').forEach(f => {
            f.classList.toggle('active', f.textContent.toLowerCase().includes(filter.toLowerCase()));
        });
        
        const searchQuery = document.getElementById('searchInput').value;
        this.filterEvents(searchQuery, filter);
    }

    filterEvents(search = '', filter = 'all') {
        let filtered = [...this.events];

        if (filter !== 'all') {
            if (filter === 'today') {
                const today = new Date().toISOString().split('T')[0];
                filtered = filtered.filter(e => e.date === today);
            } else {
                filtered = filtered.filter(e => e.category === filter);
            }
        }

        if (search) {
            const query = search.toLowerCase();
            filtered = filtered.filter(e => 
                e.name.toLowerCase().includes(query) ||
                e.hosts.toLowerCase().includes(query) ||
                e.venue.toLowerCase().includes(query)
            );
        }

        this.filteredEvents = filtered;
        this.renderEvents();
    }

    showModal() {
        document.getElementById('modal').classList.add('show');
        document.getElementById('eventForm').classList.remove('hidden');
        document.getElementById('success').classList.add('hidden');
    }

    closeModal() {
        document.getElementById('modal').classList.remove('show');
        document.getElementById('eventForm').reset();
    }

    async handleCreateEvent(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const eventData = Object.fromEntries(formData);
        const submitBtn = e.target.querySelector('button[type="submit"]');

        // Validate creator field
        if (!eventData.creator || eventData.creator.trim().length < 2) {
            this.showError('Creator name must be at least 2 characters long');
            return;
        }

        if (eventData.creator.trim().length > 100) {
            this.showError('Creator name cannot exceed 100 characters');
            return;
        }

        // Sanitize creator input
        eventData.creator = eventData.creator.trim();

        this.setLoadingState(submitBtn, true);

        try {
            const result = await window.api.createEvent(eventData);
            
            if (result.success) {
                this.showSuccess();
                await this.loadEvents();
                this.renderEvents();
            } else {
                this.showError('Failed to create event: ' + result.error);
            }
        } catch (error) {
            this.showError('Error creating event');
            console.error(error);
        } finally {
            this.setLoadingState(submitBtn, false);
        }
    }

    setLoadingState(button, loading) {
        button.textContent = loading ? 'Creating...' : 'Create Event';
        button.disabled = loading;
    }

    showSuccess() {
        document.getElementById('eventForm').classList.add('hidden');
        document.getElementById('success').classList.remove('hidden');
    }

    showError(message) {
        alert(message);
    }

    addToCalendar(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (event) {
            const url = window.api.generateCalendarURL(event);
            window.open(url, '_blank');
        }
    }

    shareEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        const shareData = {
            title: event.name,
            text: `Check out "${event.name}" at Gamescom 2025!`,
            url: window.location.href
        };

        if (navigator.share) {
            navigator.share(shareData);
        } else {
            const url = `https://wa.me/?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`;
            window.open(url, '_blank');
        }
    }

    formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short', 
            day: 'numeric'
        });
    }

    formatFilterName(filter) {
        return filter.charAt(0).toUpperCase() + filter.slice(1);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new GamescomApp();
    window.app.init();
});