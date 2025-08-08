// Virtual Scrolling for Performance with Large Event Lists
class VirtualEventRenderer {
    constructor(container, itemHeight = 280) {
        this.container = container;
        this.itemHeight = itemHeight;
        this.containerHeight = 0;
        this.scrollTop = 0;
        this.visibleStart = 0;
        this.visibleEnd = 0;
        this.buffer = 5; // Extra items to render for smooth scrolling
        
        // Track rendered items for cleanup
        this.renderedItems = new Map();
        this.isGrid = true;
        
        this.setupContainer();
        this.bindScrollEvents();
    }
    
    setupContainer() {
        // Ensure container has proper styling for virtual scrolling
        this.container.style.position = 'relative';
        this.container.style.overflowY = 'auto';
        
        // Create viewport div for smooth scrolling
        this.viewport = document.createElement('div');
        this.viewport.style.position = 'relative';
        this.viewport.style.width = '100%';
        this.container.appendChild(this.viewport);
        
        // Track container height
        this.updateContainerHeight();
        window.addEventListener('resize', () => this.updateContainerHeight());
    }
    
    updateContainerHeight() {
        this.containerHeight = this.container.clientHeight;
        this.calculateVisible();
    }
    
    bindScrollEvents() {
        let ticking = false;
        
        this.container.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }
    
    handleScroll() {
        this.scrollTop = this.container.scrollTop;
        this.calculateVisible();
        this.updateVisibleItems();
    }
    
    calculateVisible() {
        const itemsPerRow = this.isGrid ? this.getItemsPerRow() : 1;
        const rowHeight = this.isGrid ? this.itemHeight : this.itemHeight;
        
        this.visibleStart = Math.floor(this.scrollTop / rowHeight) * itemsPerRow;
        const visibleRows = Math.ceil(this.containerHeight / rowHeight);
        this.visibleEnd = Math.min(
            (this.visibleStart / itemsPerRow + visibleRows + this.buffer) * itemsPerRow,
            this.totalItems
        );
        
        // Ensure we don't go negative
        this.visibleStart = Math.max(0, this.visibleStart - (this.buffer * itemsPerRow));
    }
    
    getItemsPerRow() {
        // Calculate items per row based on container width
        const containerWidth = this.container.clientWidth;
        const minItemWidth = 320; // Minimum width for event cards
        return Math.max(1, Math.floor(containerWidth / minItemWidth));
    }
    
    render(events, isGrid = true) {
        this.events = events;
        this.totalItems = events.length;
        this.isGrid = isGrid;
        
        // Update container class
        this.container.className = isGrid ? 'events-grid' : 'events-list';
        
        if (events.length === 0) {
            this.renderEmptyState();
            return;
        }
        
        // Calculate total height for proper scrollbar
        const itemsPerRow = this.isGrid ? this.getItemsPerRow() : 1;
        const totalRows = Math.ceil(events.length / itemsPerRow);
        const totalHeight = totalRows * this.itemHeight;
        this.viewport.style.height = `${totalHeight}px`;
        
        // Calculate and render visible items
        this.calculateVisible();
        this.updateVisibleItems();
    }
    
    updateVisibleItems() {
        if (!this.events) return;
        
        // Clear viewport
        this.viewport.innerHTML = '';
        
        // Render visible items
        for (let i = this.visibleStart; i < this.visibleEnd; i++) {
            if (i >= this.totalItems) break;
            
            const event = this.events[i];
            const element = this.createEventElement(event, i);
            
            // Position element absolutely for virtual scrolling
            this.positionElement(element, i);
            this.viewport.appendChild(element);
        }
    }
    
    positionElement(element, index) {
        const itemsPerRow = this.isGrid ? this.getItemsPerRow() : 1;
        const row = Math.floor(index / itemsPerRow);
        const col = index % itemsPerRow;
        
        element.style.position = 'absolute';
        element.style.top = `${row * this.itemHeight}px`;
        
        if (this.isGrid) {
            const itemWidth = 100 / itemsPerRow;
            element.style.left = `${col * itemWidth}%`;
            element.style.width = `calc(${itemWidth}% - 16px)`;
        } else {
            element.style.left = '0';
            element.style.width = '100%';
        }
    }
    
    createEventElement(event, index) {
        // Create optimized event card element
        const article = document.createElement('article');
        article.className = `event-card ${this.isGrid ? '' : 'event-list-item'}`;
        article.setAttribute('data-event-id', event.id);
        article.setAttribute('data-index', index);
        
        // Add click handler
        article.addEventListener('click', () => this.handleEventClick(event.id));
        
        // Build content efficiently
        const isUGC = event.source === 'ugc';
        const eventDate = this.formatDate(event.date);
        const eventTime = event.startTime || 'TBA';
        const eventVenue = event.venue || 'TBA';
        const eventCategory = event.category || 'event';
        const eventDescription = event.description || '';
        
        article.innerHTML = `
            <div class="event-header">
                <div class="event-badges">
                    ${isUGC ? '<span class="badge badge-ugc">Community</span>' : '<span class="badge badge-official">Official</span>'}
                    <span class="badge badge-category">${this.formatFilterName(eventCategory)}</span>
                </div>
                <h3 class="event-title">${this.escapeHtml(event.name)}</h3>
            </div>
            
            <div class="event-meta">
                <div class="meta-item">
                    <span class="meta-icon">📅</span>
                    <span class="meta-text">${eventDate}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-icon">🕐</span>
                    <span class="meta-text">${eventTime}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-icon">📍</span>
                    <span class="meta-text">${this.escapeHtml(eventVenue)}</span>
                </div>
            </div>
            
            ${eventDescription ? `<p class="event-description">${this.escapeHtml(this.truncateText(eventDescription, 120))}</p>` : ''}
            
            ${isUGC && event.creator ? `<div class="creator-info">Created by ${this.escapeHtml(event.creator)}</div>` : ''}
            
            <div class="event-actions">
                <button class="btn-primary" onclick="event.stopPropagation(); app.addToCalendar('${event.id}')">
                    📅 Add to Calendar
                </button>
                <button class="btn-secondary" onclick="event.stopPropagation(); app.shareEvent('${event.id}')">
                    📤 Share
                </button>
            </div>
        `;
        
        return article;
    }
    
    handleEventClick(eventId) {
        // Use app instance to handle event details
        if (window.app && window.app.viewEventDetails) {
            window.app.viewEventDetails(eventId);
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatDate(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        const dayDiff = Math.floor((eventDate - today) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === 0) return 'Today';
        if (dayDiff === 1) return 'Tomorrow';
        if (dayDiff === -1) return 'Yesterday';
        
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short', 
            day: 'numeric'
        });
    }
    
    formatFilterName(filter) {
        const formatted = filter.charAt(0).toUpperCase() + filter.slice(1);
        const icons = {
            'Networking': '🤝',
            'Afterparty': '🎉',
            'Mixer': '🍸',
            'Launch': '🚀'
        };
        return icons[formatted] ? `${icons[formatted]} ${formatted}` : formatted;
    }
    
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }
    
    renderEmptyState() {
        this.viewport.innerHTML = `
            <div class="empty-state" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; padding: 60px 20px;">
                <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
                <h3 style="margin-bottom: 12px; color: var(--slack-color-text);">No events found</h3>
                <button onclick="app.showModal()" class="btn-primary">Create the First Event!</button>
            </div>
        `;
    }
    
    // Scroll to specific item (useful for search results)
    scrollToItem(index) {
        const itemsPerRow = this.isGrid ? this.getItemsPerRow() : 1;
        const row = Math.floor(index / itemsPerRow);
        const targetScroll = row * this.itemHeight;
        
        this.container.scrollTo({
            top: targetScroll,
            behavior: 'smooth'
        });
    }
    
    // Destroy method for cleanup
    destroy() {
        window.removeEventListener('resize', this.updateContainerHeight);
        this.container.removeEventListener('scroll', this.handleScroll);
        if (this.viewport) {
            this.viewport.remove();
        }
    }
}

// Memory Management for Date Pickers
class DatePickerManager {
    constructor() {
        this.instances = new Map();
    }
    
    create(element, options) {
        // Always cleanup existing instance first
        this.destroy(element);
        
        const instance = flatpickr(element, options);
        this.instances.set(element, instance);
        return instance;
    }
    
    destroy(element) {
        const instance = this.instances.get(element);
        if (instance) {
            instance.destroy();
            this.instances.delete(element);
        }
    }
    
    destroyAll() {
        this.instances.forEach(instance => instance.destroy());
        this.instances.clear();
    }
}

// Enhanced Gamescom Party Discovery App
class GamescomApp {
    constructor() {
        this.events = [];
        this.filteredEvents = [];
        this.currentFilter = 'all';
        this.currentView = 'grid';
        this.searchQuery = '';
        this.page = 1;
        this.pageSize = 12;
        this.isLoading = false;
        this.offlineSearch = null;
        this.cacheUtils = null;
        this.lastCreatedEvent = null;
        
        // Enhanced memory management
        this.datePickerManager = new DatePickerManager();
        this.eventListeners = new Map();
        
        // Virtual scrolling for performance
        this.virtualRenderer = null;
        
        // Analytics tracking
        this.analytics = {
            searches: 0,
            eventViews: 0,
            eventCreations: 0,
            shares: 0
        };
    }

    async init() {
        console.log('🎮 Gamescom Party Discovery v2.0 Starting...');
        
        try {
            // Initialize core systems
            this.initTheme();
            this.initOfflineSearch();
            this.initCacheUtils();
            
            // Load data
            await this.loadEvents();
            
            // Setup UI
            this.setupUI();
            this.setupQuickActions();
            this.registerServiceWorker();
            
            // Update stats
            this.updateHeroStats();
            
            console.log(`✅ Loaded ${this.events.length} events with advanced features`);
            
            // Track app initialization
            this.trackAnalytics('app_initialized', { eventCount: this.events.length });
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.showError('Failed to initialize app. Please refresh.');
        }
    }

    async loadEvents() {
        this.events = await window.api.getEvents();
        this.filteredEvents = [...this.events];
    }

    setupUI() {
        this.setupEventListeners();
        this.renderFilters();
        this.initializeVirtualRenderer();
        this.renderEvents();
    }
    
    initializeVirtualRenderer() {
        const container = document.getElementById('events');
        if (container && !this.virtualRenderer) {
            // Set proper height for the events container
            container.style.height = 'calc(100vh - 400px)';
            container.style.minHeight = '600px';
            
            this.virtualRenderer = new VirtualEventRenderer(container, 280);
            console.log('✅ Virtual renderer initialized');
        }
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });
        
        // Clear search
        document.getElementById('clearSearch').addEventListener('click', () => {
            searchInput.value = '';
            this.handleSearch('');
        });
        
        // View toggles
        document.getElementById('viewGrid').addEventListener('click', () => {
            this.setView('grid');
        });
        
        document.getElementById('viewList').addEventListener('click', () => {
            this.setView('list');
        });
        
        // Load more
        document.getElementById('loadMoreBtn').addEventListener('click', () => {
            this.loadMore();
        });

        // Create event buttons
        document.getElementById('createEventBtn').addEventListener('click', () => {
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
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
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
        if (this.isLoading) {
            this.showLoadingState();
            return;
        }
        
        // Use virtual renderer if available, otherwise fall back to old method
        if (this.virtualRenderer) {
            const isGrid = this.currentView === 'grid';
            
            console.log(`🎮 Rendering ${this.filteredEvents.length} events with virtual scrolling`);
            this.virtualRenderer.render(this.filteredEvents, isGrid);
            
            // Hide pagination controls since virtual scrolling handles all items
            const loadMoreSection = document.querySelector('.load-more-section');
            if (loadMoreSection) {
                loadMoreSection.classList.add('hidden');
            }
        } else {
            // Fallback to old rendering method
            this.renderEventsLegacy();
        }
        
        // Update results count
        this.updateResultsCount();
    }
    
    renderEventsLegacy() {
        const container = document.getElementById('events');
        const isGrid = this.currentView === 'grid';
        
        // Update container class
        container.className = isGrid ? 'events-grid' : 'events-list';
        
        if (this.filteredEvents.length === 0) {
            this.showEmptyState();
            return;
        }

        // Paginate events
        const startIndex = 0;
        const endIndex = this.page * this.pageSize;
        const eventsToShow = this.filteredEvents.slice(startIndex, endIndex);
        
        container.innerHTML = eventsToShow.map(event => this.renderEventCard(event)).join('');
        
        // Update load more button
        this.updateLoadMoreButton();
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
        
        // Initialize Flatpickr date picker
        this.initializeDateTimePickers();
    }
    
    initializeDateTimePickers() {
        // Initialize date picker with Gamescom dates highlighted
        const dateInput = document.getElementById('eventDate');
        if (dateInput) {
            this.datePickerManager.create(dateInput, {
                dateFormat: "Y-m-d",
                minDate: "today",
                maxDate: new Date().fp_incr(365), // 1 year from now
                defaultDate: "2025-08-20", // First day of Gamescom
                onDayCreate: function(dObj, dStr, fp, dayElem) {
                    const date = dayElem.dateObj;
                    const dateStr = date.toISOString().split('T')[0];
                    
                    // Highlight Gamescom dates (Aug 20-24, 2025)
                    const gamescomDates = [
                        '2025-08-20', '2025-08-21', '2025-08-22', 
                        '2025-08-23', '2025-08-24'
                    ];
                    
                    if (gamescomDates.includes(dateStr)) {
                        dayElem.classList.add('gamescom-date');
                        dayElem.innerHTML += '<span style="position:absolute;top:-2px;right:2px;font-size:8px;">🎮</span>';
                    }
                },
                onReady: function(selectedDates, dateStr, instance) {
                    // Add custom header with Gamescom info
                    const calendarContainer = instance.calendarContainer;
                    const gamescomBanner = document.createElement('div');
                    gamescomBanner.style.cssText = 'background: linear-gradient(135deg, #4A154B, #36B37E); color: white; padding: 8px; text-align: center; font-size: 13px; font-weight: 600;';
                    gamescomBanner.innerHTML = '🎮 Gamescom 2025: August 20-24 🎮';
                    calendarContainer.insertBefore(gamescomBanner, calendarContainer.firstChild);
                }
            });
        }
        
        // Initialize time picker
        const timeInput = document.getElementById('eventTime');
        if (timeInput) {
            this.datePickerManager.create(timeInput, {
                enableTime: true,
                noCalendar: true,
                dateFormat: "H:i",
                time_24hr: true,
                defaultHour: 19,
                defaultMinute: 0,
                minuteIncrement: 15
            });
        }
        
        // Handle time suggestion chips
        const timeChips = document.querySelectorAll('.time-chip');
        timeChips.forEach(chip => {
            chip.addEventListener('click', (e) => {
                const time = e.target.dataset.time;
                const timeInput = document.getElementById('eventTime');
                const instance = this.datePickerManager.instances.get(timeInput);
                if (instance) {
                    instance.setDate(time, false);
                } else {
                    timeInput.value = time;
                }
                
                // Visual feedback
                timeChips.forEach(c => c.style.background = '');
                e.target.style.background = 'var(--slack-color-primary)';
                e.target.style.color = 'white';
            });
        });
    }

    closeModal() {
        document.getElementById('modal').classList.remove('show');
        document.getElementById('eventForm').reset();
        
        // Proper cleanup using DatePickerManager
        this.datePickerManager.destroyAll();
        
        // Reset time chip styles
        document.querySelectorAll('.time-chip').forEach(chip => {
            chip.style.background = '';
            chip.style.color = '';
        });
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
                // Track referral conversion for event creation
                if (window.referralSystem) {
                    await window.referralSystem.trackConversion('event_creation', {
                        eventId: result.eventId,
                        eventName: eventData.name
                    });
                }
                
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

    showSuccess(eventId = null) {
        document.getElementById('eventForm').classList.add('hidden');
        document.getElementById('success').classList.remove('hidden');
        this.lastCreatedEvent = eventId;
        this.trackAnalytics('event_created', { eventId });
    }

    showError(message) {
        alert(message);
    }

    async addToCalendar(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (event) {
            const url = window.api.generateCalendarURL(event);
            window.open(url, '_blank');
            
            // Track referral conversion for calendar add
            if (window.referralSystem) {
                await window.referralSystem.trackConversion('calendar_add', {
                    eventId: eventId,
                    eventName: event.name
                });
            }
        }
    }

    shareEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        // Create rich sharing content
        const eventUrl = `${window.location.origin}/?event=${eventId}`;
        const eventDate = this.formatDate(event.date);
        const eventTime = event.startTime || 'TBA';
        const venue = event.venue || 'TBA';
        
        const shareData = {
            title: `🎮 ${event.name} - Gamescom 2025`,
            text: `Join me at "${event.name}" on ${eventDate} at ${eventTime} in ${venue}! #Gamescom2025 #Gaming`,
            url: eventUrl
        };

        // Show sharing modal with multiple options
        this.showSharingModal(event, shareData);
    }
    
    showSharingModal(event, shareData) {
        // Create sharing modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content sharing-modal">
                <div class="modal-header">
                    <h2 class="modal-title">📤 Share Event</h2>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                
                <div class="sharing-content">
                    <div class="event-preview">
                        <h3>${this.escapeHtml(event.name)}</h3>
                        <p>📅 ${this.formatDate(event.date)} • 🕐 ${event.startTime || 'TBA'}</p>
                        <p>📍 ${this.escapeHtml(event.venue || 'TBA')}</p>
                    </div>
                    
                    <div class="sharing-options">
                        <button class="share-btn whatsapp" onclick="app.shareToWhatsApp('${event.id}')">
                            <span class="share-icon">📱</span>
                            <span>WhatsApp</span>
                        </button>
                        
                        <button class="share-btn twitter" onclick="app.shareToTwitter('${event.id}')">
                            <span class="share-icon">🐦</span>
                            <span>Twitter</span>
                        </button>
                        
                        <button class="share-btn linkedin" onclick="app.shareToLinkedIn('${event.id}')">
                            <span class="share-icon">💼</span>
                            <span>LinkedIn</span>
                        </button>
                        
                        <button class="share-btn native" onclick="app.shareNative('${event.id}')" style="display: ${navigator.share ? 'flex' : 'none'}">
                            <span class="share-icon">📲</span>
                            <span>Share</span>
                        </button>
                        
                        <button class="share-btn copy" onclick="app.copyEventLink('${event.id}')">
                            <span class="share-icon">🔗</span>
                            <span>Copy Link</span>
                        </button>
                        
                        <button class="share-btn qr" onclick="app.showQRCode('${event.id}')">
                            <span class="share-icon">📷</span>
                            <span>QR Code</span>
                        </button>
                    </div>
                    
                    <div class="share-stats">
                        <small>Sharing helps grow the Gamescom community! 🎮</small>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.classList.add('show');
        
        // Track sharing modal open
        this.trackAnalytics('share_modal_opened', { eventId: event.id });
    }
    
    async shareToWhatsApp(eventId) {
        const shareContent = await window.referralSystem.generateShareContent(eventId, 'whatsapp');
        if (!shareContent) {
            this.showError('Failed to generate sharing link');
            return;
        }
        
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareContent.message)}`;
        window.open(whatsappUrl, '_blank');
        
        // Enhanced tracking with referral data
        this.trackAnalytics('shared_whatsapp_with_referral', { 
            eventId, 
            referralCode: shareContent.referralCode,
            trackableURL: shareContent.trackableURL
        });
        
        this.showToast(`📱 WhatsApp share created with referral tracking!`);
        this.closeSharingModal();
    }
    
    async shareToTwitter(eventId) {
        const shareContent = await window.referralSystem.generateShareContent(eventId, 'twitter');
        if (!shareContent) {
            this.showError('Failed to generate sharing link');
            return;
        }
        
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareContent.message)}`;
        window.open(twitterUrl, '_blank');
        
        this.trackAnalytics('shared_twitter_with_referral', { 
            eventId, 
            referralCode: shareContent.referralCode,
            trackableURL: shareContent.trackableURL
        });
        
        this.showToast(`🐦 Twitter share created with referral tracking!`);
        this.closeSharingModal();
    }
    
    async shareToLinkedIn(eventId) {
        const shareContent = await window.referralSystem.generateShareContent(eventId, 'linkedin');
        if (!shareContent) {
            this.showError('Failed to generate sharing link');
            return;
        }
        
        const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareContent.trackableURL)}`;
        window.open(linkedInUrl, '_blank');
        
        this.trackAnalytics('shared_linkedin_with_referral', { 
            eventId, 
            referralCode: shareContent.referralCode,
            trackableURL: shareContent.trackableURL
        });
        
        this.showToast(`💼 LinkedIn share created with referral tracking!`);
        this.closeSharingModal();
    }
    
    async shareNative(eventId) {
        if (!navigator.share) return;
        
        const shareContent = await window.referralSystem.generateShareContent(eventId, 'native');
        if (!shareContent) {
            this.showError('Failed to generate sharing link');
            return;
        }
        
        const shareData = {
            title: shareContent.title,
            text: shareContent.message,
            url: shareContent.trackableURL
        };
        
        navigator.share(shareData).then(() => {
            this.trackAnalytics('shared_native_with_referral', { 
                eventId, 
                referralCode: shareContent.referralCode,
                trackableURL: shareContent.trackableURL
            });
            this.showToast(`📲 Native share created with referral tracking!`);
            this.closeSharingModal();
        }).catch(console.warn);
    }
    
    copyEventLink(eventId) {
        const eventUrl = `${window.location.origin}/?event=${eventId}`;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(eventUrl).then(() => {
                this.showToast('📋 Event link copied to clipboard!');
                this.trackAnalytics('link_copied', { eventId });
                this.closeSharingModal();
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = eventUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            this.showToast('📋 Event link copied to clipboard!');
            this.trackAnalytics('link_copied', { eventId });
            this.closeSharingModal();
        }
    }
    
    showQRCode(eventId) {
        const eventUrl = `${window.location.origin}/?event=${eventId}`;
        
        // Create QR code modal
        const qrModal = document.createElement('div');
        qrModal.className = 'modal';
        qrModal.innerHTML = `
            <div class="modal-content qr-modal">
                <div class="modal-header">
                    <h2 class="modal-title">📷 Event QR Code</h2>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                
                <div class="qr-content">
                    <div class="qr-code-container">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(eventUrl)}" 
                             alt="QR Code for ${this.escapeHtml(this.events.find(e => e.id === eventId)?.name || 'Event')}"
                             class="qr-code">
                    </div>
                    <p>Scan this QR code to view the event details</p>
                    <button class="btn-secondary" onclick="app.saveQRCode('${eventId}')">💾 Save QR Code</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(qrModal);
        qrModal.classList.add('show');
        
        this.trackAnalytics('qr_code_viewed', { eventId });
    }
    
    saveQRCode(eventId) {
        const eventUrl = `${window.location.origin}/?event=${eventId}`;
        const event = this.events.find(e => e.id === eventId);
        
        const link = document.createElement('a');
        link.download = `gamescom-2025-${event?.name?.replace(/\s+/g, '-') || eventId}.png`;
        link.href = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(eventUrl)}`;
        link.click();
        
        this.trackAnalytics('qr_code_saved', { eventId });
        this.showToast('💾 QR Code saved!');
    }
    
    closeSharingModal() {
        const modal = document.querySelector('.sharing-modal')?.closest('.modal');
        if (modal) {
            modal.remove();
        }
    }
    
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--slack-color-primary);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 10000;
            font-weight: 600;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => toast.style.transform = 'translateX(0)', 100);
        
        // Animate out and remove
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        const dayDiff = Math.floor((eventDate - today) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === 0) return 'Today';
        if (dayDiff === 1) return 'Tomorrow';
        if (dayDiff === -1) return 'Yesterday';
        
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short', 
            day: 'numeric'
        });
    }

    formatFilterName(filter) {
        return filter.charAt(0).toUpperCase() + filter.slice(1);
    }
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // New enhanced methods
    initOfflineSearch() {
        try {
            if (typeof OfflineSearch !== 'undefined') {
                this.offlineSearch = new OfflineSearch();
                console.log('✅ Offline search initialized');
            }
        } catch (error) {
            console.warn('⚠️ Offline search unavailable:', error);
        }
    }

    initCacheUtils() {
        try {
            if (typeof CacheUtils !== 'undefined') {
                this.cacheUtils = new CacheUtils();
                console.log('✅ Cache utils initialized');
            }
        } catch (error) {
            console.warn('⚠️ Cache utils unavailable:', error);
        }
    }

    handleSearch(query) {
        this.searchQuery = query.toLowerCase().trim();
        
        // Show/hide clear button
        const clearBtn = document.getElementById('clearSearch');
        clearBtn.classList.toggle('hidden', !this.searchQuery);
        
        // Reset pagination
        this.page = 1;
        
        // Filter events
        this.filterEvents(this.searchQuery, this.currentFilter);
        
        // Track search
        if (this.searchQuery) {
            this.analytics.searches++;
            this.trackAnalytics('search_performed', { query: this.searchQuery });
        }
    }

    setView(view) {
        this.currentView = view;
        
        // Update view buttons
        document.getElementById('viewGrid').classList.toggle('active', view === 'grid');
        document.getElementById('viewList').classList.toggle('active', view === 'list');
        
        // Re-render events
        this.renderEvents();
        
        // Store preference
        localStorage.setItem('preferredView', view);
    }

    loadMore() {
        this.page++;
        this.renderEvents();
    }

    updateLoadMoreButton() {
        const loadMoreSection = document.querySelector('.load-more-section');
        const totalShown = this.page * this.pageSize;
        const hasMore = totalShown < this.filteredEvents.length;
        
        loadMoreSection.classList.toggle('hidden', !hasMore);
    }

    updateResultsCount() {
        const countElement = document.getElementById('searchResultsCount');
        const total = this.filteredEvents.length;
        const shown = Math.min(this.page * this.pageSize, total);
        
        if (this.searchQuery) {
            countElement.textContent = `${total} events found for "${this.searchQuery}"`;
        } else {
            countElement.textContent = `Showing ${shown} of ${total} events`;
        }
    }

    updateHeroStats() {
        const ugcCount = this.events.filter(e => e.isUGC).length;
        
        document.getElementById('totalEvents').textContent = `${this.events.length}+`;
        document.getElementById('ugcEvents').textContent = `${ugcCount}+`;
    }

    renderEventCard(event) {
        const isUGC = event.isUGC;
        const eventName = event.name || event['Event Name'];
        const eventDate = event.date || event.Date;
        const eventTime = event.startTime || event['Start Time'];
        const eventVenue = event.venue || event.Address;
        const eventCategory = event.category || event.Category;
        const eventHosts = event.hosts || event.Hosts || event.creator;
        const eventDescription = event.description || event.Description;

        return `
            <article class="event ${isUGC ? 'ugc-event' : ''}" data-event-id="${event.id}" onclick="app.viewEventDetails('${event.id}')">
                <div class="event-header">
                    <h3>${eventName}</h3>
                    ${isUGC ? '<span class="ugc-badge">👥 Community Event</span>' : ''}
                </div>
                
                <div class="event-host">
                    <span class="host-label">Hosted by:</span>
                    <span class="host-name">${eventHosts}</span>
                </div>
                
                <div class="event-meta">
                    <div class="meta-item">
                        <span class="meta-icon">📅</span>
                        <span class="meta-text">${this.formatDate(eventDate)}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-icon">🕐</span>
                        <span class="meta-text">${eventTime}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-icon">📍</span>
                        <span class="meta-text">${eventVenue}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-icon">🎯</span>
                        <span class="meta-text">${eventCategory}</span>
                    </div>
                </div>
                
                ${eventDescription ? `<p class="event-description">${this.truncateText(eventDescription, 120)}</p>` : ''}
                
                ${isUGC && event.creator ? `<div class="creator-info">Created by ${event.creator}</div>` : ''}
                
                <div class="event-actions">
                    <button class="btn-primary" onclick="event.stopPropagation(); app.addToCalendar('${event.id}')">
                        📅 Add to Calendar
                    </button>
                    <button class="btn-secondary" onclick="event.stopPropagation(); app.shareEvent('${event.id}')">
                        📤 Share
                    </button>
                    <button class="btn-secondary" onclick="event.stopPropagation(); app.viewOnMap('${event.id}')">
                        🗺️ View on Map
                    </button>
                </div>
            </article>
        `;
    }

    showLoadingState() {
        if (this.virtualRenderer && this.virtualRenderer.viewport) {
            this.virtualRenderer.viewport.innerHTML = `
                <div class="loading-state" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                    <div class="loading-spinner-large"></div>
                    <p>Loading amazing events...</p>
                </div>
            `;
        } else {
            const container = document.getElementById('events');
            container.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner-large"></div>
                    <p>Loading amazing events...</p>
                </div>
            `;
        }
    }

    showEmptyState() {
        const message = this.searchQuery 
            ? `No events found for "${this.searchQuery}". Try a different search term.`
            : 'No events available at the moment.';
            
        const emptyStateHTML = `
            <div class="empty-state" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; padding: 60px 20px;">
                <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
                <h3 style="margin-bottom: 12px; color: var(--slack-color-text);">${message}</h3>
                ${this.searchQuery ? 
                    '<button onclick="app.handleSearch(\'\')" class="btn-secondary">Clear Search</button>' :
                    '<button onclick="app.showModal()" class="btn-primary">Create the First Event!</button>'
                }
            </div>
        `;
        
        if (this.virtualRenderer && this.virtualRenderer.viewport) {
            this.virtualRenderer.viewport.innerHTML = emptyStateHTML;
        } else {
            const container = document.getElementById('events');
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
                    <h3 style="margin-bottom: 12px; color: var(--slack-color-text);">${message}</h3>
                    ${this.searchQuery ? 
                        '<button onclick="app.handleSearch(\'\')" class="btn-secondary">Clear Search</button>' :
                        '<button onclick="app.showModal()" class="btn-primary">Create the First Event!</button>'
                    }
                </div>
            `;
        }
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }

    setupQuickActions() {
        // Quick create button
        document.getElementById('quickCreateBtn').addEventListener('click', () => {
            this.showModal();
        });

        // Quick map button
        document.getElementById('quickMapBtn').addEventListener('click', () => {
            window.location.href = '/maps.html';
        });

        // Quick calendar button
        document.getElementById('quickCalendarBtn').addEventListener('click', () => {
            window.location.href = '/calendar.html';
        });
    }

    handleKeyboardShortcuts(e) {
        // Cmd/Ctrl + K for search
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }
        
        // ESC to close modals
        if (e.key === 'Escape') {
            this.closeModal();
        }
        
        // Cmd/Ctrl + Enter to create event from anywhere
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            this.showModal();
        }
    }

    viewEventDetails(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        // Track event view
        this.analytics.eventViews++;
        this.trackAnalytics('event_viewed', { eventId });

        // Show enhanced party details modal with maps
        if (window.partyMapsModal) {
            window.partyMapsModal.show(event);
        } else {
            // Fallback to basic alert if modal not loaded
            alert(`Event Details:\n${event.name || event['Event Name']}\n${event.venue || event.Address}\n${this.formatDate(event.date || event.Date)} at ${event.startTime || event['Start Time']}`);
        }
    }

    viewOnMap(eventId) {
        // Redirect to maps page with event highlighted
        window.location.href = `/maps.html?event=${eventId}`;
    }

    trackAnalytics(event, data = {}) {
        if (typeof gtag !== 'undefined') {
            gtag('event', event, data);
        }
        
        // Also track locally for debugging
        console.log(`📊 Analytics: ${event}`, data);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new GamescomApp();
    window.app.init().catch(error => {
        console.error('Failed to initialize app:', error);
        document.body.innerHTML = `
            <div style="text-align: center; padding: 40px; font-family: system-ui;">
                <h1>😔 Oops! Something went wrong</h1>
                <p>Failed to load the Gamescom Party Discovery app.</p>
                <button onclick="window.location.reload()" style="padding: 10px 20px; background: #4A154B; color: white; border: none; border-radius: 4px; cursor: pointer;">Reload App</button>
            </div>
        `;
    });
});