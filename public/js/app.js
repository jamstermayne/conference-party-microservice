// Main App - Clean & Modular
class GamescomApp {
    constructor() {
        this.events = [];
        this.filteredEvents = [];
        this.currentFilter = 'all';
    }

    async init() {
        console.log('🎮 Gamescom App Starting with Slack-inspired design...');
        
        this.initTheme();
        await this.loadEvents();
        this.setupUI();
        this.registerServiceWorker();
        
        console.log(`✅ Loaded ${this.events.length} events with Slack design system`);
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

        // Dark mode toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });
    }

    toggleTheme() {
        const html = document.documentElement;
        const themeToggle = document.getElementById('themeToggle');
        const currentTheme = html.getAttribute('data-theme');
        
        if (currentTheme === 'dark') {
            html.setAttribute('data-theme', 'light');
            themeToggle.innerHTML = '🌙 Dark Mode';
            localStorage.setItem('theme', 'light');
        } else {
            html.setAttribute('data-theme', 'dark');
            themeToggle.innerHTML = '☀️ Light Mode';
            localStorage.setItem('theme', 'dark');
        }
    }

    initTheme() {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (prefersDark ? 'dark' : 'light');
        
        document.documentElement.setAttribute('data-theme', theme);
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.innerHTML = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
        }
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
            <div class="event ${event.isUGC ? 'ugc-event' : ''}">
                <div class="event-header">
                    <h3>${event.name || event['Event Name']}</h3>
                    ${event.isUGC ? '<span class="ugc-badge">👥 Community Event</span>' : ''}
                </div>
                <p>by ${event.hosts || event.Hosts || event.creator}</p>
                
                <div class="event-meta">
                    <div>📅 ${this.formatDate(event.date || event.Date)}</div>
                    <div>🕐 ${event.startTime || event['Start Time']}</div>
                    <div>📍 ${event.venue || event.Address}</div>
                    <div>🎯 ${event.category || event.Category}</div>
                </div>
                
                ${event.description || event.Description ? `<p>${event.description || event.Description}</p>` : ''}
                
                ${event.isUGC && event.creator ? `<p class="creator-info">Created by: ${event.creator}</p>` : ''}
                
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
            } else if (result.duplicateWarning) {
                // Handle duplicate detection
                this.handleDuplicateWarning(result, eventData);
            } else {
                this.showError('Failed to create event: ' + result.error);
            }
        } catch (error) {
            // Check if error response contains duplicate warning
            if (error.response && error.response.status === 409) {
                this.handleDuplicateWarning(error.response.data, eventData);
            } else {
                this.showError('Error creating event');
                console.error(error);
            }
        } finally {
            this.setLoadingState(submitBtn, false);
        }
    }

    handleDuplicateWarning(result, eventData) {
        // Show duplicate warning modal
        this.showDuplicateWarning(result.duplicates, result.warnings, eventData);
    }

    showDuplicateWarning(duplicates, warnings, eventData) {
        const modal = document.getElementById('duplicateModal');
        const content = document.getElementById('duplicateContent');
        
        let html = `
            <div class="duplicate-warning-intro">
                <p><strong>We found similar events at the same venue and time.</strong> Please review them below before proceeding.</p>
            </div>
        `;
        
        if (duplicates.length > 0) {
            html += `
                <div class="duplicate-events-section">
                    <h3 class="duplicate-events-title">
                        🎯 Similar Events Found (${duplicates.length})
                    </h3>
                    <div class="duplicate-events-list">
            `;
            
            duplicates.forEach(dup => {
                html += `
                    <div class="duplicate-event">
                        <div class="duplicate-event-header">
                            <h4 class="duplicate-event-name">${dup.name}</h4>
                            <span class="duplicate-similarity">${Math.round(dup.similarity * 100)}% Match</span>
                        </div>
                        <div class="duplicate-event-meta">
                            <div class="duplicate-event-meta-item">
                                <strong>📍 Venue:</strong> ${dup.venue}
                            </div>
                            <div class="duplicate-event-meta-item">
                                <strong>🕒 Time:</strong> ${dup.startTime}
                            </div>
                            <div class="duplicate-event-meta-item">
                                <strong>👤 Organizer:</strong> ${dup.creator}
                            </div>
                            <div class="duplicate-event-meta-item">
                                <strong>📊 Source:</strong> ${dup.collection === 'events' ? 'Community Event' : 'Official Event'}
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        }
        
        if (warnings.length > 0) {
            html += `
                <div class="duplicate-warnings-section">
                    <h4 class="duplicate-warnings-title">Additional Similar Events:</h4>
            `;
            warnings.forEach(warning => {
                html += `<div class="duplicate-warning-item">⚠️ ${warning}</div>`;
            });
            html += '</div>';
        }
        
        html += `
            <div class="duplicate-question">
                Do you still want to create this event?
            </div>
            <div class="duplicate-actions">
                <button id="cancelCreate" class="btn-secondary">
                    ↩️ Go Back & Edit
                </button>
                <button id="forceCreate" class="btn-primary">
                    ✅ Create Event Anyway
                </button>
            </div>
        `;
        
        content.innerHTML = html;
        modal.classList.add('show');
        
        // Store event data for potential force creation
        this.pendingEventData = eventData;
        
        // Add event listeners
        document.getElementById('cancelCreate').addEventListener('click', () => {
            modal.classList.remove('show');
            this.pendingEventData = null;
        });
        
        document.getElementById('forceCreate').addEventListener('click', async () => {
            modal.classList.remove('show');
            await this.forceCreateEvent(this.pendingEventData);
            this.pendingEventData = null;
        });
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                this.pendingEventData = null;
            }
        });
    }
    
    async forceCreateEvent(eventData) {
        const submitBtn = document.querySelector('#eventForm button[type="submit"]');
        this.setLoadingState(submitBtn, true);
        
        try {
            // Add forceCreate flag
            const result = await window.api.createEvent({...eventData, forceCreate: true});
            
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
        if (loading) {
            button.innerHTML = `
                <span class="loading-spinner"></span>
                Creating Event...
            `;
            button.disabled = true;
            button.style.opacity = '0.8';
        } else {
            button.innerHTML = 'Create Event';
            button.disabled = false;
            button.style.opacity = '1';
        }
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