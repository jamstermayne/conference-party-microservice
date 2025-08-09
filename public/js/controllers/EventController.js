/**
 * EVENT CONTROLLER
 * Manages party/event list, filtering, and interactions
 */

import { BaseController } from './BaseController.js';
import { api } from '../services/api.js';
import { Store } from '../store.js';
import { chips } from '../ui/provenance.js';

export class EventController extends BaseController {
  constructor(element) {
    super(element, { name: 'events' });
    
    this.state = {
      events: [],
      filteredEvents: [],
      loading: false,
      error: null,
      filters: {
        search: '',
        date: '',
        category: 'all',
        saved: false
      },
      view: 'list',
      selectedEvent: null
    };
    
    this.searchDebounced = this.debounce(this.performSearch.bind(this), 300);
  }

  /**
   * Initialize controller
   */
  async onInit() {
    await this.loadEvents();
    this.setupFilterHandlers();
    this.setupViewToggle();
  }

  /**
   * Load events from API
   */
  async loadEvents() {
    this.setState({ loading: true, error: null });
    
    try {
      const response = await api.getParties();
      const events = response.parties || [];
      
      this.setState({
        events,
        filteredEvents: events,
        loading: false
      });
      
      Store.patch('events.list', events);
      Store.patch('events.lastFetch', Date.now());
      
    } catch (error) {
      this.setState({
        loading: false,
        error: 'Failed to load events'
      });
      
      const cachedEvents = Store.get('events.list') || [];
      if (cachedEvents.length) {
        this.setState({
          events: cachedEvents,
          filteredEvents: cachedEvents
        });
        this.notify('Using cached events (offline mode)', 'info');
      }
    }
  }

  /**
   * Setup filter handlers
   */
  setupFilterHandlers() {
    this.on('filter:search', ({ query }) => {
      this.setState({ filters: { ...this.state.filters, search: query } });
      this.searchDebounced(query);
    });
    
    this.on('filter:date', ({ date }) => {
      this.setState({ filters: { ...this.state.filters, date } });
      this.applyFilters();
    });
    
    this.on('filter:category', ({ category }) => {
      this.setState({ filters: { ...this.state.filters, category } });
      this.applyFilters();
    });
    
    this.on('filter:saved', ({ saved }) => {
      this.setState({ filters: { ...this.state.filters, saved } });
      this.applyFilters();
    });
  }

  /**
   * Setup view toggle
   */
  setupViewToggle() {
    this.on('view:toggle', ({ view }) => {
      this.setState({ view });
      this.animateViewTransition();
    });
  }

  /**
   * Perform search
   */
  performSearch(query) {
    this.applyFilters();
  }

  /**
   * Apply all filters
   */
  applyFilters() {
    const { events, filters } = this.state;
    
    let filtered = [...events];
    
    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(event => 
        event.title?.toLowerCase().includes(search) ||
        event.description?.toLowerCase().includes(search) ||
        event.host?.toLowerCase().includes(search) ||
        event.venue?.toLowerCase().includes(search)
      );
    }
    
    // Date filter
    if (filters.date) {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date).toDateString();
        const filterDate = new Date(filters.date).toDateString();
        return eventDate === filterDate;
      });
    }
    
    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(event => 
        event.category === filters.category
      );
    }
    
    // Saved filter
    if (filters.saved) {
      const savedEvents = Store.get('events.saved') || [];
      filtered = filtered.filter(event => 
        savedEvents.includes(event.id)
      );
    }
    
    this.setState({ filteredEvents: filtered });
  }

  /**
   * Handle event selection
   */
  actionSelectEvent(e, target) {
    const eventId = target.dataset.eventId;
    const event = this.state.events.find(e => e.id === eventId);
    
    if (event) {
      this.setState({ selectedEvent: event });
      this.showEventDetails(event);
    }
  }

  /**
   * Handle event save/unsave
   */
  async actionToggleSave(e, target) {
    const eventId = target.dataset.eventId;
    const event = this.state.events.find(e => e.id === eventId);
    
    if (!event) return;
    
    const savedEvents = Store.get('events.saved') || [];
    const isSaved = savedEvents.includes(eventId);
    
    try {
      if (isSaved) {
        await api.swipeEvent(eventId, 'left');
        const updated = savedEvents.filter(id => id !== eventId);
        Store.patch('events.saved', updated);
        this.notify('Event removed from saved', 'info');
      } else {
        await api.swipeEvent(eventId, 'right');
        Store.patch('events.saved', [...savedEvents, eventId]);
        this.notify('Event saved! 🎉', 'success');
      }
      
      target.classList.toggle('is-saved', !isSaved);
      
      if (this.state.filters.saved) {
        this.applyFilters();
      }
      
    } catch (error) {
      this.notify('Failed to save event', 'error');
    }
  }

  /**
   * Handle event share
   */
  actionShareEvent(e, target) {
    const eventId = target.dataset.eventId;
    const event = this.state.events.find(e => e.id === eventId);
    
    if (!event) return;
    
    const shareData = {
      title: event.title,
      text: `Check out ${event.title} at ${event.venue}`,
      url: `${window.location.origin}/#/events/${eventId}`
    };
    
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareData.url);
      this.notify('Event link copied!', 'success');
    }
  }

  /**
   * Handle calendar export
   */
  actionAddToCalendar(e, target) {
    const eventId = target.dataset.eventId;
    const event = this.state.events.find(e => e.id === eventId);
    
    if (!event) return;
    
    const icsContent = this.generateICS(event);
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.replace(/\s+/g, '-')}.ics`;
    a.click();
    
    URL.revokeObjectURL(url);
    this.notify('Calendar event downloaded', 'success');
  }

  /**
   * Generate ICS calendar content
   */
  generateICS(event) {
    const startDate = new Date(event.date);
    const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);
    
    const formatDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };
    
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Professional Intelligence//Events//EN
BEGIN:VEVENT
UID:${event.id}@pronet.app
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${event.title}
DESCRIPTION:${event.description || ''}
LOCATION:${event.venue || ''}
URL:${window.location.origin}/#/events/${event.id}
END:VEVENT
END:VCALENDAR`;
  }

  /**
   * Show event details modal
   */
  showEventDetails(event) {
    Store.actions.openModal({
      type: 'event-details',
      data: event
    });
  }

  /**
   * Animate view transition
   */
  animateViewTransition() {
    const container = this.$('.events-container');
    if (!container) return;
    
    container.style.opacity = '0';
    setTimeout(() => {
      container.style.opacity = '1';
    }, 150);
  }

  /**
   * Template for rendering
   */
  template(data) {
    const { filteredEvents, loading, error, view, filters } = data;
    
    if (loading) {
      return `<div class="loading-state">Loading events...</div>`;
    }
    
    if (error) {
      return `<div class="error-state">${error}</div>`;
    }
    
    return `
      <div class="events-controller">
        ${this.renderFilters(filters)}
        ${this.renderViewToggle(view)}
        <div class="events-container view-${view}">
          ${filteredEvents.length ? 
            filteredEvents.map(event => this.renderEvent(event, view)).join('') :
            '<div class="empty-state">No events found</div>'
          }
        </div>
      </div>
    `;
  }

  /**
   * Render filters
   */
  renderFilters(filters) {
    return `
      <div class="filters-bar">
        <input 
          type="search" 
          placeholder="Search events..." 
          value="${filters.search}"
          data-action="filter:search"
          class="search-input"
        />
        
        <select data-action="filter:category" class="filter-select">
          <option value="all">All Categories</option>
          <option value="networking">Networking</option>
          <option value="party">Party</option>
          <option value="conference">Conference</option>
          <option value="workshop">Workshop</option>
        </select>
        
        <input 
          type="date" 
          data-action="filter:date"
          value="${filters.date}"
          class="date-filter"
        />
        
        <label class="saved-toggle">
          <input 
            type="checkbox" 
            data-action="filter:saved"
            ${filters.saved ? 'checked' : ''}
          />
          <span>Saved only</span>
        </label>
      </div>
    `;
  }

  /**
   * Render view toggle
   */
  renderViewToggle(currentView) {
    return `
      <div class="view-toggle">
        <button 
          data-action="view:toggle" 
          data-view="list"
          class="${currentView === 'list' ? 'active' : ''}"
        >List</button>
        <button 
          data-action="view:toggle" 
          data-view="grid"
          class="${currentView === 'grid' ? 'active' : ''}"
        >Grid</button>
        <button 
          data-action="view:toggle" 
          data-view="map"
          class="${currentView === 'map' ? 'active' : ''}"
        >Map</button>
      </div>
    `;
  }

  /**
   * Render single event
   */
  renderEvent(event, view) {
    const savedEvents = Store.get('events.saved') || [];
    const isSaved = savedEvents.includes(event.id);
    
    if (view === 'grid') {
      return this.renderEventCard(event, isSaved);
    } else if (view === 'map') {
      return this.renderEventMarker(event, isSaved);
    } else {
      return this.renderEventListItem(event, isSaved);
    }
  }

  /**
   * Render event list item
   */
  renderEventListItem(event, isSaved) {
    return `
      <div class="event-item" data-event-id="${event.id}">
        <div class="event-time">${this.formatDate(event.date)}</div>
        <div class="event-content">
          <h3 class="event-title">${event.title}</h3>
          <p class="event-venue">${event.venue || 'TBA'}</p>
          <p class="event-host">by ${event.host || 'Unknown'}</p>
        </div>
        <div class="event-actions">
          <button 
            data-action="toggleSave" 
            data-event-id="${event.id}"
            class="save-btn ${isSaved ? 'is-saved' : ''}"
          >
            ${isSaved ? '★' : '☆'}
          </button>
          <button data-action="shareEvent" data-event-id="${event.id}">
            Share
          </button>
          <button data-action="addToCalendar" data-event-id="${event.id}">
            Calendar
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render event card
   */
  renderEventCard(event, isSaved) {
    return `
      <div class="event-card" data-event-id="${event.id}">
        <div class="event-card-header">
          <span class="event-category">${event.category || 'Event'}</span>
          <button 
            data-action="toggleSave" 
            data-event-id="${event.id}"
            class="save-btn ${isSaved ? 'is-saved' : ''}"
          >
            ${isSaved ? '★' : '☆'}
          </button>
        </div>
        <h3 class="event-title">${event.title}</h3>
        <p class="event-date">${this.formatDate(event.date)}</p>
        <p class="event-venue">${event.venue || 'TBA'}</p>
        ${chips(event.provenance||[])}
        <div class="event-card-footer">
          <button data-action="selectEvent" data-event-id="${event.id}">
            View Details
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render event map marker
   */
  renderEventMarker(event, isSaved) {
    return `
      <div class="event-marker" data-event-id="${event.id}">
        <div class="marker-icon ${isSaved ? 'is-saved' : ''}">📍</div>
        <div class="marker-popup">
          <h4>${event.title}</h4>
          <p>${event.venue}</p>
          <button data-action="selectEvent" data-event-id="${event.id}">
            Details
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Handle input changes
   */
  onChange(name, value, input) {
    if (name === 'search') {
      this.searchDebounced(value);
    }
  }

  /**
   * Store subscriptions
   */
  setupStoreSubscriptions() {
    this.subscribe('events.list', (events) => {
      if (events && events !== this.state.events) {
        this.setState({ events, filteredEvents: events });
      }
    });
  }

  /**
   * Cleanup on destroy
   */
  onDestroy() {
    // Any specific cleanup for this controller
  }
}

export default EventController;