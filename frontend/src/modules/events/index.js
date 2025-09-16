/**
 * Events Module
 *
 * SINGLE RESPONSIBILITY: Event discovery and management
 * - Event listing and display
 * - Event filtering and search
 * - Event saving/bookmarking
 * - Event recommendations
 *
 * This module is completely isolated and communicates only through the Platform event bus
 */

import platform from '../core/platform.js';

class EventsModule {
  constructor() {
    this.container = null;
    this.state = {
      events: [],
      filteredEvents: [],
      savedEvents: new Set(),
      filters: {
        date: null,
        location: null,
        tags: [],
        search: ''
      },
      loading: false,
      error: null,
      selectedEvent: null
    };

    // Bind methods
    this.mount = this.mount.bind(this);
    this.unmount = this.unmount.bind(this);
    this.loadEvents = this.loadEvents.bind(this);
    this.handleSaveEvent = this.handleSaveEvent.bind(this);
    this.handleEventSelect = this.handleEventSelect.bind(this);
  }

  // ============= MODULE LIFECYCLE =============

  /**
   * Mount the module to a container
   */
  async mount(container) {
    this.container = container;
    console.log('[EventsModule] Mounting...');

    // Set loading state
    this.setState({ loading: true });

    // Register event listeners
    this.registerEventListeners();

    // Load events
    await this.loadEvents();

    // Load saved events if user is authenticated
    const user = platform.getUser();
    if (user) {
      await this.loadSavedEvents(user.id);
    }

    // Render initial UI
    this.render();

    console.log('[EventsModule] Mounted successfully');
  }

  /**
   * Unmount the module and clean up
   */
  async unmount() {
    console.log('[EventsModule] Unmounting...');

    // Clean up event listeners
    this.unregisterEventListeners();

    // Clear container
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }

    // Clear state
    this.state = {
      events: [],
      filteredEvents: [],
      savedEvents: new Set(),
      filters: {
        date: null,
        location: null,
        tags: [],
        search: ''
      },
      loading: false,
      error: null,
      selectedEvent: null
    };

    console.log('[EventsModule] Unmounted successfully');
  }

  /**
   * Get module state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Set module state
   */
  setState(newState) {
    this.state = { ...this.state, ...newState };

    // Apply filters whenever state changes
    if (newState.events || newState.filters) {
      this.applyFilters();
    }

    this.render();
  }

  // ============= EVENT MANAGEMENT LOGIC =============

  /**
   * Load events from API
   */
  async loadEvents() {
    try {
      console.log('[EventsModule] Loading events...');

      const response = await fetch('/api/parties');
      if (!response.ok) {
        throw new Error('Failed to load events');
      }

      const data = await response.json();
      const events = data.data || [];

      this.setState({
        events: events,
        loading: false,
        error: null
      });

      // Emit event for other modules
      platform.emit('events:loaded', {
        count: events.length,
        events: events
      });

      console.log(`[EventsModule] Loaded ${events.length} events`);
    } catch (error) {
      console.error('[EventsModule] Failed to load events:', error);
      this.setState({
        loading: false,
        error: error.message
      });

      // Use mock data as fallback
      this.loadMockEvents();
    }
  }

  /**
   * Load mock events for demo
   */
  loadMockEvents() {
    const mockEvents = [
      {
        id: '1',
        title: 'Gamescom Opening Night Live',
        date: '2025-08-20',
        time: '20:00',
        location: 'Koelnmesse',
        venue: 'Hall 11',
        description: 'The biggest gaming showcase of the year',
        tags: ['gaming', 'showcase', 'opening'],
        capacity: 5000,
        attendees: 3421
      },
      {
        id: '2',
        title: 'Indie Games Showcase',
        date: '2025-08-21',
        time: '14:00',
        location: 'Koelnmesse',
        venue: 'Hall 10',
        description: 'Discover the best upcoming indie games',
        tags: ['indie', 'showcase', 'networking'],
        capacity: 1000,
        attendees: 782
      },
      {
        id: '3',
        title: 'Developer Networking Mixer',
        date: '2025-08-21',
        time: '19:00',
        location: 'Marriott Hotel',
        venue: 'Rooftop Bar',
        description: 'Connect with game developers from around the world',
        tags: ['networking', 'developers', 'social'],
        capacity: 300,
        attendees: 234
      },
      {
        id: '4',
        title: 'VR/AR Gaming Summit',
        date: '2025-08-22',
        time: '10:00',
        location: 'Koelnmesse',
        venue: 'Conference Room A',
        description: 'The future of immersive gaming',
        tags: ['vr', 'ar', 'technology'],
        capacity: 500,
        attendees: 421
      }
    ];

    this.setState({
      events: mockEvents,
      loading: false
    });

    platform.emit('events:loaded', {
      count: mockEvents.length,
      events: mockEvents,
      source: 'mock'
    });
  }

  /**
   * Load user's saved events
   */
  async loadSavedEvents(userId) {
    try {
      // In real app, this would fetch from API
      const savedIds = localStorage.getItem(`saved_events_${userId}`);
      if (savedIds) {
        this.state.savedEvents = new Set(JSON.parse(savedIds));
      }
    } catch (error) {
      console.error('[EventsModule] Failed to load saved events:', error);
    }
  }

  /**
   * Apply filters to events
   */
  applyFilters() {
    let filtered = [...this.state.events];
    const { date, location, tags, search } = this.state.filters;

    // Filter by date
    if (date) {
      filtered = filtered.filter(event => event.date === date);
    }

    // Filter by location
    if (location) {
      filtered = filtered.filter(event =>
        event.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    // Filter by tags
    if (tags.length > 0) {
      filtered = filtered.filter(event =>
        event.tags && tags.some(tag => event.tags.includes(tag))
      );
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchLower) ||
        event.description?.toLowerCase().includes(searchLower)
      );
    }

    this.state.filteredEvents = filtered;
  }

  /**
   * Handle event selection
   */
  handleEventSelect(eventId) {
    const event = this.state.events.find(e => e.id === eventId);
    if (!event) return;

    this.setState({ selectedEvent: event });

    // Emit event for other modules
    platform.emit('events:event-selected', {
      eventId: event.id,
      event: event
    });

    // Specific events for different features
    if (event.location && event.venue) {
      platform.emit('events:navigate-to-map', {
        eventId: event.id,
        location: {
          name: event.venue,
          address: event.location
        }
      });
    }
  }

  /**
   * Handle save/unsave event
   */
  async handleSaveEvent(eventId) {
    const user = platform.getUser();
    if (!user) {
      platform.emit('events:require-auth', {
        action: 'save-event',
        eventId: eventId
      });
      return;
    }

    const isSaved = this.state.savedEvents.has(eventId);

    if (isSaved) {
      this.state.savedEvents.delete(eventId);
    } else {
      this.state.savedEvents.add(eventId);
    }

    // Save to localStorage (in real app, would sync with API)
    localStorage.setItem(
      `saved_events_${user.id}`,
      JSON.stringify(Array.from(this.state.savedEvents))
    );

    // Re-render
    this.render();

    // Emit event
    platform.emit(isSaved ? 'events:event-unsaved' : 'events:event-saved', {
      eventId: eventId,
      userId: user.id
    });
  }

  /**
   * Handle add to calendar
   */
  handleAddToCalendar(eventId) {
    const event = this.state.events.find(e => e.id === eventId);
    if (!event) return;

    // Emit event for calendar module
    platform.emit('events:add-to-calendar', {
      eventId: event.id,
      event: {
        title: event.title,
        date: event.date,
        time: event.time,
        location: event.venue,
        description: event.description
      }
    });
  }

  // ============= UI RENDERING =============

  /**
   * Render the events UI
   */
  render() {
    if (!this.container) return;

    const eventsToShow = this.state.filteredEvents.length > 0
      ? this.state.filteredEvents
      : this.state.events;

    this.container.innerHTML = `
      <div class="events-module">
        <div class="events-header">
          <h2>Discover Events</h2>
          <div class="events-stats">
            ${eventsToShow.length} events
            ${this.state.savedEvents.size > 0 ? `• ${this.state.savedEvents.size} saved` : ''}
          </div>
        </div>

        ${this.renderFilters()}

        ${this.state.loading ? this.renderLoading() : ''}
        ${this.state.error ? this.renderError() : ''}
        ${!this.state.loading && !this.state.error ? this.renderEvents(eventsToShow) : ''}
      </div>
    `;

    // Attach event listeners
    this.attachEventListeners();
  }

  /**
   * Render filters
   */
  renderFilters() {
    return `
      <div class="events-filters">
        <input
          type="text"
          id="events-search"
          placeholder="Search events..."
          value="${this.state.filters.search}"
          class="events-search"
        />

        <select id="events-date-filter" class="events-filter">
          <option value="">All Dates</option>
          <option value="2025-08-20">Aug 20</option>
          <option value="2025-08-21">Aug 21</option>
          <option value="2025-08-22">Aug 22</option>
          <option value="2025-08-23">Aug 23</option>
        </select>

        <button id="events-clear-filters" class="events-clear-btn">
          Clear Filters
        </button>
      </div>
    `;
  }

  /**
   * Render loading state
   */
  renderLoading() {
    return `
      <div class="events-loading">
        <div class="loading-spinner"></div>
        <p>Loading events...</p>
      </div>
    `;
  }

  /**
   * Render error state
   */
  renderError() {
    return `
      <div class="events-error">
        <p>⚠️ ${this.state.error}</p>
        <button id="events-retry">Retry</button>
      </div>
    `;
  }

  /**
   * Render events list
   */
  renderEvents(events) {
    if (events.length === 0) {
      return `
        <div class="events-empty">
          <p>No events found</p>
        </div>
      `;
    }

    return `
      <div class="events-grid">
        ${events.map(event => this.renderEventCard(event)).join('')}
      </div>
    `;
  }

  /**
   * Render single event card
   */
  renderEventCard(event) {
    const isSaved = this.state.savedEvents.has(event.id);
    const isSelected = this.state.selectedEvent?.id === event.id;

    return `
      <div class="event-card ${isSelected ? 'selected' : ''}" data-event-id="${event.id}">
        <div class="event-header">
          <h3>${event.title}</h3>
          <button class="event-save-btn ${isSaved ? 'saved' : ''}" data-event-id="${event.id}">
            ${isSaved ? '★' : '☆'}
          </button>
        </div>

        <div class="event-details">
          <div class="event-time">📅 ${event.date} • ${event.time}</div>
          <div class="event-location">📍 ${event.venue}</div>
          ${event.attendees ? `
            <div class="event-attendees">👥 ${event.attendees}/${event.capacity || '∞'}</div>
          ` : ''}
        </div>

        ${event.description ? `
          <p class="event-description">${event.description}</p>
        ` : ''}

        ${event.tags ? `
          <div class="event-tags">
            ${event.tags.map(tag => `<span class="event-tag">${tag}</span>`).join('')}
          </div>
        ` : ''}

        <div class="event-actions">
          <button class="event-select-btn" data-event-id="${event.id}">View Details</button>
          <button class="event-calendar-btn" data-event-id="${event.id}">Add to Calendar</button>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners to rendered elements
   */
  attachEventListeners() {
    // Search input
    const searchInput = this.container.querySelector('#events-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.setState({
          filters: { ...this.state.filters, search: e.target.value }
        });
      });
    }

    // Date filter
    const dateFilter = this.container.querySelector('#events-date-filter');
    if (dateFilter) {
      dateFilter.addEventListener('change', (e) => {
        this.setState({
          filters: { ...this.state.filters, date: e.target.value || null }
        });
      });
    }

    // Clear filters
    const clearBtn = this.container.querySelector('#events-clear-filters');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.setState({
          filters: {
            date: null,
            location: null,
            tags: [],
            search: ''
          }
        });
      });
    }

    // Retry button
    const retryBtn = this.container.querySelector('#events-retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => this.loadEvents());
    }

    // Event card actions
    this.container.querySelectorAll('.event-save-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleSaveEvent(btn.dataset.eventId);
      });
    });

    this.container.querySelectorAll('.event-select-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleEventSelect(btn.dataset.eventId);
      });
    });

    this.container.querySelectorAll('.event-calendar-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleAddToCalendar(btn.dataset.eventId);
      });
    });

    // Card click
    this.container.querySelectorAll('.event-card').forEach(card => {
      card.addEventListener('click', () => {
        this.handleEventSelect(card.dataset.eventId);
      });
    });
  }

  // ============= EVENT HANDLING =============

  /**
   * Register platform event listeners
   */
  registerEventListeners() {
    // Listen for user login to load saved events
    this.loginHandler = (data) => {
      if (data.user) {
        this.loadSavedEvents(data.user.id);
      }
    };
    platform.on('auth:login', this.loginHandler);

    // Listen for user logout to clear saved events
    this.logoutHandler = () => {
      this.state.savedEvents.clear();
      this.render();
    };
    platform.on('auth:logout', this.logoutHandler);

    // Listen for calendar sync success
    this.calendarSyncHandler = (data) => {
      console.log('[EventsModule] Event added to calendar:', data);
      // Could update UI to show sync status
    };
    platform.on('calendar:event-added', this.calendarSyncHandler);

    // Listen for location filter from map
    this.locationFilterHandler = (data) => {
      this.setState({
        filters: { ...this.state.filters, location: data.location }
      });
    };
    platform.on('map:location-selected', this.locationFilterHandler);
  }

  /**
   * Unregister event listeners
   */
  unregisterEventListeners() {
    if (this.loginHandler) platform.off('auth:login', this.loginHandler);
    if (this.logoutHandler) platform.off('auth:logout', this.logoutHandler);
    if (this.calendarSyncHandler) platform.off('calendar:event-added', this.calendarSyncHandler);
    if (this.locationFilterHandler) platform.off('map:location-selected', this.locationFilterHandler);
  }

  // ============= PUBLIC API =============

  /**
   * Get all events
   */
  getEvents() {
    return [...this.state.events];
  }

  /**
   * Get filtered events
   */
  getFilteredEvents() {
    return [...this.state.filteredEvents];
  }

  /**
   * Get saved event IDs
   */
  getSavedEventIds() {
    return Array.from(this.state.savedEvents);
  }

  /**
   * Get event by ID
   */
  getEventById(eventId) {
    return this.state.events.find(e => e.id === eventId);
  }

  /**
   * Apply filter programmatically
   */
  setFilter(filterType, value) {
    this.setState({
      filters: { ...this.state.filters, [filterType]: value }
    });
  }

  /**
   * Refresh events
   */
  async refresh() {
    await this.loadEvents();
  }
}

// Export module
export default EventsModule;