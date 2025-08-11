/**
 * EVENT LIST INTEGRATION - VirtualizedEventList Integration
 * Seamlessly integrates virtualized rendering with existing event management
 */

class EventListManager {
    constructor() {
        this.virtualList = null;
        this.events = [];
        this.currentPage = 1;
        this.isLoading = false;
        this.hasMore = true;
        this.filters = {
            search: '',
            category: '',
            date: '',
            ugc: true
        };
        
        // Performance tracking
        this.loadTimes = [];
        this.renderTimes = [];
        
        this.init();
    }

    async init() {
        console.log('🎯 EventListManager initializing...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        // Find existing event container or create one
        this.container = document.getElementById('events-container') || 
                        document.querySelector('.events-feed') ||
                        document.querySelector('[data-events]');
        
        if (!this.container) {
            console.warn('No event container found, creating default container');
            this.createDefaultContainer();
        }

        this.initializeVirtualList();
        this.setupEventListeners();
        this.loadInitialEvents();
    }

    createDefaultContainer() {
        this.container = document.createElement('div');
        this.container.id = 'events-container';
        this.container.style.cssText = `
            height: 60vh;
            min-height: 400px;
            margin: 20px 0;
            border: 1px solid #333;
            border-radius: 10px;
            background: #0f0f0f;
        `;
        
        // Insert after search or at beginning of main content
        const searchContainer = document.querySelector('.search-container') || 
                               document.querySelector('.filters') ||
                               document.querySelector('main');
        
        if (searchContainer) {
            searchContainer.parentNode.insertBefore(this.container, searchContainer.nextSibling);
        } else {
            document.body.appendChild(this.container);
        }
    }

    initializeVirtualList() {
        this.virtualList = new VirtualizedEventList(this.container, {
            itemHeight: 120,
            overscan: 5,
            gap: 10,
            loadThreshold: 0.8,
            
            onRenderItem: this.renderEventItem.bind(this),
            onLoadMore: this.loadMoreEvents.bind(this),
            onItemClick: this.handleEventClick.bind(this),
            onItemSwipe: this.handleEventSwipe.bind(this)
        });

        // Listen for render events for performance monitoring
        this.container.addEventListener('virtual-list-rendered', (e) => {
            this.trackRenderPerformance(e.detail);
        });
    }

    renderEventItem(event, index) {
        const isUGC = event.isUGC || event.source === 'ugc';
        const eventName = event['Event Name'] || event.name || 'Unnamed Event';
        const eventDate = event.Date || event.date || 'TBD';
        const eventTime = event['Start Time'] || event.startTime || 'TBD';
        const eventLocation = event.Address || event.venue || event.location || 'Location TBD';
        const eventCategory = event.Category || event.category || 'Event';
        const eventDescription = event.Description || event.description || '';
        
        return `
            <div class="event-card ${isUGC ? 'event-ugc' : 'event-curated'}" 
                 data-event-id="${event.id || index}"
                 data-swipeable="true"
                 style="
                    height: 100%;
                    background: ${isUGC ? 'linear-gradient(135deg, #1a4d3a, #1a1a1a)' : 'linear-gradient(135deg, #1a1a1a, #2a2a2a)'};
                    border: 1px solid ${isUGC ? '#00ff88' : '#333'};
                    border-radius: 12px;
                    padding: 16px;
                    position: relative;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    overflow: hidden;
                ">
                
                <!-- Event Badge -->
                <div class="event-badge" style="
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: ${isUGC ? '#00ff88' : '#666'};
                    color: ${isUGC ? '#000' : '#fff'};
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 10px;
                    font-weight: 600;
                    text-transform: uppercase;
                ">${isUGC ? 'Community' : 'Curated'}</div>

                <!-- Main Event Content -->
                <div class="event-content" style="flex: 1; min-width: 0;">
                    <div class="event-header" style="margin-bottom: 8px;">
                        <h3 class="event-title" style="
                            color: #fff;
                            font-size: 16px;
                            font-weight: 600;
                            margin: 0;
                            line-height: 1.3;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            white-space: nowrap;
                        ">${eventName}</h3>
                        <div class="event-category" style="
                            color: #00ff88;
                            font-size: 12px;
                            font-weight: 500;
                            margin-top: 2px;
                        ">${eventCategory}</div>
                    </div>
                    
                    <div class="event-details" style="
                        display: flex;
                        gap: 16px;
                        font-size: 13px;
                        color: #ccc;
                        margin-bottom: 8px;
                    ">
                        <span class="event-date" style="display: flex; align-items: center; gap: 4px;">
                            📅 ${eventDate}
                        </span>
                        <span class="event-time" style="display: flex; align-items: center; gap: 4px;">
                            ⏰ ${eventTime}
                        </span>
                    </div>
                    
                    <div class="event-location" style="
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        font-size: 12px;
                        color: #999;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    ">
                        📍 ${eventLocation}
                    </div>
                    
                    ${eventDescription ? `
                        <div class="event-description" style="
                            margin-top: 8px;
                            font-size: 12px;
                            color: #aaa;
                            line-height: 1.4;
                            overflow: hidden;
                            display: -webkit-box;
                            -webkit-line-clamp: 2;
                            -webkit-box-orient: vertical;
                        ">${eventDescription.substring(0, 100)}${eventDescription.length > 100 ? '...' : ''}</div>
                    ` : ''}
                </div>

                <!-- Swipe Actions -->
                <div class="swipe-actions" style="
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-left: 16px;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                ">
                    <button class="btn-swipe-like" 
                            data-action="like"
                            style="
                        background: #00ff88;
                        color: #000;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 20px;
                        cursor: pointer;
                        font-weight: 600;
                        font-size: 12px;
                        min-width: 60px;
                        transition: transform 0.2s ease;
                    ">👍 Like</button>
                    
                    <button class="btn-swipe-pass"
                            data-action="pass" 
                            style="
                        background: #666;
                        color: #fff;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 20px;
                        cursor: pointer;
                        font-size: 12px;
                        min-width: 60px;
                        transition: transform 0.2s ease;
                    ">👎 Pass</button>
                </div>

                <!-- Loading State Overlay -->
                <div class="event-loading" style="
                    display: none;
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #00ff88;
                    font-size: 14px;
                ">Processing...</div>
            </div>
        `;
    }

    async loadInitialEvents() {
        console.log('📥 Loading initial events...');
        
        if (this.isLoading) return;
        this.isLoading = true;

        try {
            const startTime = performance.now();
            
            // Use existing API endpoint
            const response = await fetch('/api/parties?page=1&limit=50&includeUGC=true');
            const data = await response.json();
            
            const loadTime = performance.now() - startTime;
            this.trackLoadPerformance(loadTime, data.data?.length || 0);

            if (data.success && data.data) {
                this.events = data.data;
                this.hasMore = data.meta?.hasMore || false;
                this.currentPage = 1;
                
                // Update virtual list
                this.virtualList.setItems(this.events);
                
                console.log('✅ Initial events loaded', {
                    count: this.events.length,
                    hasMore: this.hasMore,
                    loadTime: loadTime.toFixed(2) + 'ms',
                    source: data.meta?.source
                });
                
                // Update UI indicators
                this.updateEventCounter();
                
            } else {
                console.error('Failed to load events:', data);
                this.showErrorState('Failed to load events. Please try again.');
            }
            
        } catch (error) {
            console.error('Error loading events:', error);
            this.showErrorState('Network error. Please check your connection.');
        } finally {
            this.isLoading = false;
        }
    }

    async loadMoreEvents() {
        if (this.isLoading || !this.hasMore) return;
        
        console.log('📥 Loading more events...', { currentPage: this.currentPage });
        
        this.isLoading = true;

        try {
            const nextPage = this.currentPage + 1;
            const response = await fetch(`/api/parties?page=${nextPage}&limit=20&includeUGC=true`);
            const data = await response.json();

            if (data.success && data.data && data.data.length > 0) {
                const newEvents = data.data;
                this.events = this.events.concat(newEvents);
                this.currentPage = nextPage;
                this.hasMore = data.meta?.hasMore || false;
                
                // Update virtual list
                this.virtualList.appendItems(newEvents);
                
                console.log('✅ More events loaded', {
                    added: newEvents.length,
                    total: this.events.length,
                    page: this.currentPage,
                    hasMore: this.hasMore
                });
                
                this.updateEventCounter();
                
            } else {
                this.hasMore = false;
                console.log('📄 No more events to load');
            }
            
        } catch (error) {
            console.error('Error loading more events:', error);
        } finally {
            this.isLoading = false;
        }
    }

    handleEventClick(event, index, clickEvent) {
        console.log('🖱️ Event clicked:', { event: event['Event Name'] || event.name, index });
        
        // Dispatch custom event for other parts of the app to listen to
        document.dispatchEvent(new CustomEvent('eventClicked', {
            detail: { event, index }
        }));
        
        // You can add specific click handling here
        // For example: open event details modal, navigate to event page, etc.
        this.showEventDetails(event);
    }

    async handleEventSwipe(event, index, direction) {
        console.log('👆 Event swiped:', { 
            event: event['Event Name'] || event.name, 
            index, 
            direction 
        });

        // Show loading state
        const eventElement = this.container.querySelector(`[data-event-id="${event.id || index}"]`);
        if (eventElement) {
            const loadingOverlay = eventElement.querySelector('.event-loading');
            if (loadingOverlay) {
                loadingOverlay.style.display = 'flex';
            }
        }

        try {
            // Map swipe directions to actions
            const actionMap = {
                'left': 'pass',
                'right': 'like',
                'like': 'like',
                'pass': 'pass'
            };
            
            const action = actionMap[direction] || direction;
            
            // Send swipe action to API
            const response = await fetch('/api/swipe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    partyId: event.id || `event_${index}`,
                    action: action,
                    timestamp: new Date().toISOString(),
                    source: 'virtual-list-swipe'
                })
            });

            const result = await response.json();
            
            if (result.success) {
                // Visual feedback
                this.showSwipeFeedback(eventElement, action);
                
                // Dispatch swipe event
                document.dispatchEvent(new CustomEvent('eventSwiped', {
                    detail: { event, index, action, result }
                }));
                
                console.log('✅ Swipe action recorded:', result);
                
            } else {
                console.error('Swipe action failed:', result);
                this.showSwipeError(eventElement);
            }
            
        } catch (error) {
            console.error('Error processing swipe:', error);
            this.showSwipeError(eventElement);
        } finally {
            // Hide loading state
            if (eventElement) {
                const loadingOverlay = eventElement.querySelector('.event-loading');
                if (loadingOverlay) {
                    setTimeout(() => {
                        loadingOverlay.style.display = 'none';
                    }, 500);
                }
            }
        }
    }

    showSwipeFeedback(element, action) {
        if (!element) return;
        
        const isLike = action === 'like';
        const color = isLike ? '#00ff88' : '#666';
        const emoji = isLike ? '👍' : '👎';
        
        // Flash border color
        element.style.borderColor = color;
        element.style.transform = 'scale(0.98)';
        
        // Show feedback text
        const feedback = document.createElement('div');
        feedback.textContent = `${emoji} ${isLike ? 'Liked!' : 'Passed'}`;
        feedback.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${color};
            color: ${isLike ? '#000' : '#fff'};
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
            z-index: 10;
            animation: swipeFeedback 1s ease-out forwards;
        `;
        
        element.appendChild(feedback);
        
        // Reset styles after animation
        setTimeout(() => {
            element.style.borderColor = '';
            element.style.transform = '';
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 1000);
    }

    showSwipeError(element) {
        if (!element) return;
        
        element.style.borderColor = '#ff6b6b';
        element.style.animation = 'shake 0.5s ease-in-out';
        
        setTimeout(() => {
            element.style.borderColor = '';
            element.style.animation = '';
        }, 500);
    }

    showEventDetails(event) {
        // Create or show event details modal
        const modal = this.createEventDetailsModal(event);
        document.body.appendChild(modal);
        
        // Animate in
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });
    }

    createEventDetailsModal(event) {
        const modal = document.createElement('div');
        modal.className = 'event-details-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        const eventName = event['Event Name'] || event.name || 'Event Details';
        const eventDate = event.Date || event.date || 'TBD';
        const eventTime = event['Start Time'] || event.startTime || 'TBD';
        const eventLocation = event.Address || event.venue || 'Location TBD';
        const eventDescription = event.Description || event.description || 'No description available.';
        
        modal.innerHTML = `
            <div class="modal-content" style="
                background: #1a1a1a;
                border: 1px solid #333;
                border-radius: 12px;
                padding: 24px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                transform: translateY(20px);
                transition: transform 0.3s ease;
            ">
                <div class="modal-header" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 20px;
                ">
                    <h2 style="color: #fff; margin: 0; flex: 1;">${eventName}</h2>
                    <button class="close-modal" style="
                        background: none;
                        border: none;
                        color: #999;
                        font-size: 24px;
                        cursor: pointer;
                        padding: 0;
                        margin-left: 16px;
                    ">×</button>
                </div>
                
                <div class="event-meta" style="margin-bottom: 20px;">
                    <div style="color: #00ff88; font-weight: 600; margin-bottom: 12px;">
                        📅 ${eventDate} at ${eventTime}
                    </div>
                    <div style="color: #ccc; margin-bottom: 12px;">
                        📍 ${eventLocation}
                    </div>
                </div>
                
                <div class="event-description" style="
                    color: #ccc;
                    line-height: 1.6;
                    margin-bottom: 24px;
                ">${eventDescription}</div>
                
                <div class="modal-actions" style="
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                ">
                    <button class="btn-modal-pass" style="
                        background: #666;
                        color: #fff;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 6px;
                        cursor: pointer;
                    ">Pass</button>
                    <button class="btn-modal-like" style="
                        background: #00ff88;
                        color: #000;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 600;
                    ">Like Event</button>
                </div>
            </div>
        `;
        
        // Event listeners for modal
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        });
        
        modal.querySelector('.btn-modal-like').addEventListener('click', () => {
            this.handleEventSwipe(event, -1, 'like');
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        });
        
        modal.querySelector('.btn-modal-pass').addEventListener('click', () => {
            this.handleEventSwipe(event, -1, 'pass');
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                setTimeout(() => modal.remove(), 300);
            }
        });
        
        // Add active class for animation
        modal.classList.add = function(className) {
            this.className += ' ' + className;
            if (className === 'active') {
                this.style.opacity = '1';
                this.querySelector('.modal-content').style.transform = 'translateY(0)';
            }
        }.bind(modal);
        
        modal.classList.remove = function(className) {
            this.className = this.className.replace(' ' + className, '');
            if (className === 'active') {
                this.style.opacity = '0';
                this.querySelector('.modal-content').style.transform = 'translateY(20px)';
            }
        }.bind(modal);
        
        return modal;
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('search-events') || 
                           document.querySelector('input[type="search"]') ||
                           document.querySelector('.search-input');
                           
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(this.handleSearch.bind(this), 300));
        }
        
        // Filter functionality
        const filterButtons = document.querySelectorAll('[data-filter]');
        filterButtons.forEach(button => {
            button.addEventListener('click', this.handleFilter.bind(this));
        });
        
        // Refresh functionality
        const refreshButton = document.getElementById('refresh-events') ||
                             document.querySelector('.refresh-button');
                             
        if (refreshButton) {
            refreshButton.addEventListener('click', this.refreshEvents.bind(this));
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return; // Don't interfere with input fields
            
            switch(e.key) {
                case 'r':
                case 'R':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.refreshEvents();
                    }
                    break;
                case 'Home':
                    this.virtualList.scrollToTop();
                    break;
            }
        });
    }

    handleSearch(e) {
        const query = e.target.value.toLowerCase().trim();
        this.filters.search = query;
        
        if (query) {
            const filteredEvents = this.events.filter(event => {
                const eventName = (event['Event Name'] || event.name || '').toLowerCase();
                const eventLocation = (event.Address || event.venue || '').toLowerCase();
                const eventDescription = (event.Description || event.description || '').toLowerCase();
                
                return eventName.includes(query) || 
                       eventLocation.includes(query) || 
                       eventDescription.includes(query);
            });
            
            this.virtualList.setItems(filteredEvents);
        } else {
            this.virtualList.setItems(this.events);
        }
        
        console.log('🔍 Search applied:', { query, results: this.virtualList.itemCount });
    }

    handleFilter(e) {
        const filterType = e.target.getAttribute('data-filter');
        const filterValue = e.target.getAttribute('data-filter-value');
        
        this.filters[filterType] = filterValue;
        this.applyFilters();
    }

    applyFilters() {
        let filteredEvents = [...this.events];
        
        // Apply search filter
        if (this.filters.search) {
            const query = this.filters.search.toLowerCase();
            filteredEvents = filteredEvents.filter(event => {
                const eventName = (event['Event Name'] || event.name || '').toLowerCase();
                const eventLocation = (event.Address || event.venue || '').toLowerCase();
                return eventName.includes(query) || eventLocation.includes(query);
            });
        }
        
        // Apply category filter
        if (this.filters.category) {
            filteredEvents = filteredEvents.filter(event => 
                (event.Category || event.category || '').toLowerCase() === this.filters.category.toLowerCase()
            );
        }
        
        // Apply UGC filter
        if (!this.filters.ugc) {
            filteredEvents = filteredEvents.filter(event => !event.isUGC);
        }
        
        this.virtualList.setItems(filteredEvents);
        console.log('🎛️ Filters applied:', this.filters, 'Results:', filteredEvents.length);
    }

    async refreshEvents() {
        console.log('🔄 Refreshing events...');
        
        this.events = [];
        this.currentPage = 1;
        this.hasMore = true;
        
        // Show loading state
        this.showLoadingState();
        
        await this.loadInitialEvents();
        
        // Hide loading state
        this.hideLoadingState();
    }

    showLoadingState() {
        // Add loading overlay to container
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'events-loading-overlay';
        loadingOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100;
            border-radius: 10px;
        `;
        loadingOverlay.innerHTML = `
            <div style="text-align: center; color: #00ff88;">
                <div style="font-size: 24px; margin-bottom: 8px;">⟳</div>
                <div>Loading events...</div>
            </div>
        `;
        
        this.container.style.position = 'relative';
        this.container.appendChild(loadingOverlay);
    }

    hideLoadingState() {
        const loadingOverlay = this.container.querySelector('.events-loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.remove();
        }
    }

    showErrorState(message) {
        this.virtualList.setItems([]);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'events-error-state';
        errorDiv.style.cssText = `
            text-align: center;
            padding: 40px 20px;
            color: #ff6b6b;
        `;
        errorDiv.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
            <div style="font-size: 18px; margin-bottom: 8px;">Oops! Something went wrong</div>
            <div style="font-size: 14px; color: #999; margin-bottom: 20px;">${message}</div>
            <button onclick="eventListManager.refreshEvents()" style="
                background: #00ff88;
                color: #000;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
            ">Try Again</button>
        `;
        
        this.container.appendChild(errorDiv);
    }

    updateEventCounter() {
        const counter = document.querySelector('.event-counter') || 
                       document.querySelector('[data-event-count]');
                       
        if (counter) {
            counter.textContent = `${this.events.length} events`;
        }
    }

    trackLoadPerformance(loadTime, itemCount) {
        this.loadTimes.push({ time: loadTime, items: itemCount, timestamp: Date.now() });
        
        // Keep only last 10 measurements
        if (this.loadTimes.length > 10) {
            this.loadTimes = this.loadTimes.slice(-10);
        }
        
        const avgLoadTime = this.loadTimes.reduce((sum, entry) => sum + entry.time, 0) / this.loadTimes.length;
        
        console.log('📊 Load Performance:', {
            loadTime: loadTime.toFixed(2) + 'ms',
            itemCount,
            avgLoadTime: avgLoadTime.toFixed(2) + 'ms'
        });
    }

    trackRenderPerformance(renderData) {
        this.renderTimes.push({
            ...renderData,
            timestamp: Date.now()
        });
        
        // Keep only last 20 measurements
        if (this.renderTimes.length > 20) {
            this.renderTimes = this.renderTimes.slice(-20);
        }
    }

    // Utility methods
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Public API
    getPerformanceStats() {
        return {
            virtualList: this.virtualList.renderStats,
            loadTimes: this.loadTimes,
            renderTimes: this.renderTimes,
            eventCount: this.events.length,
            visibleRange: this.virtualList.visibleRange
        };
    }

    scrollToTop() {
        this.virtualList.scrollToTop();
    }

    scrollToEvent(eventId) {
        const index = this.events.findIndex(event => 
            (event.id || event['Event Name']) === eventId
        );
        if (index >= 0) {
            this.virtualList.scrollToIndex(index);
        }
    }
}

// Auto-initialize when script loads
let eventListManager;

// Initialize after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        eventListManager = new EventListManager();
        window.eventListManager = eventListManager; // Make globally accessible
    });
} else {
    eventListManager = new EventListManager();
    window.eventListManager = eventListManager;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventListManager;
}

// Add required CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes swipeFeedback {
        0% { 
            opacity: 0; 
            transform: translate(-50%, -50%) scale(0.8); 
        }
        50% { 
            opacity: 1; 
            transform: translate(-50%, -50%) scale(1.1); 
        }
        100% { 
            opacity: 0; 
            transform: translate(-50%, -50%) scale(1); 
        }
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    .event-card:hover .swipe-actions {
        opacity: 1 !important;
    }
    
    .event-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 255, 136, 0.2);
    }
    
    .btn-swipe-like:hover {
        transform: scale(1.05);
        background: #00cc70 !important;
    }
    
    .btn-swipe-pass:hover {
        transform: scale(1.05);
        background: #555 !important;
    }
    
    .event-details-modal.active .modal-content {
        transform: translateY(0) !important;
    }
`;
document.head.appendChild(style);

console.log('🎯 EventListManager loaded and ready!');