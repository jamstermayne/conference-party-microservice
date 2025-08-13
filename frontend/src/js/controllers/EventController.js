/**
 * EVENT CONTROLLER
 * Manages party/event list, filtering, and interactions
 */

import { BaseController } from './BaseController.js?v=b011';
import { api } from '../services/api.js?v=b011';
import { Store } from '../store.js?v=b011';
import { chips } from '../ui/provenance.js?v=b011';

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
        category: 'today', // Default to "Tonight" for instant value
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
    // Search input handler
    this.on('filter:search', ({ query }) => {
      this.setState({ filters: { ...this.state.filters, search: query } });
      this.searchDebounced(query);
    });
    
    // Category filter handler  
    this.on('filter:category', ({ category }) => {
      this.setState({ filters: { ...this.state.filters, category } });
      this.applyFilters();
    });
    
    // Date filter handler
    this.on('filter:date', ({ date }) => {
      this.setState({ filters: { ...this.state.filters, date } });
      this.applyFilters();
    });
    
    // Saved filter handler
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
    
    // Time-based and value-based category filters
    if (filters.category !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      switch (filters.category) {
        case 'today':
          // Filter for today's events
          filtered = filtered.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.toDateString() === today.toDateString();
          });
          break;
          
        case 'tomorrow':
          // Filter for tomorrow's events
          filtered = filtered.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.toDateString() === tomorrow.toDateString();
          });
          break;
          
        case 'hot':
          // Filter for high-value events (featured, popular venues, or key hosts)
          filtered = filtered.filter(event => 
            event.featured || 
            event.capacity > 100 ||
            event.hosts?.includes('Google') ||
            event.hosts?.includes('Meta') ||
            event.venue?.includes('Koelnmesse') ||
            event.category?.toLowerCase().includes('vip')
          );
          break;
          
        case 'nearby':
          // Filter for nearby events (if user has location)
          if (navigator.geolocation) {
            // For now, prioritize central Cologne venues
            filtered = filtered.filter(event => 
              event.venue?.includes('Cologne') ||
              event.venue?.includes('Koln') ||
              event.venue?.includes('50667') ||
              event.venue?.includes('50679')
            );
          }
          break;
          
        case 'mixer':
        case 'party':
        default:
          // Category-based filters
          filtered = filtered.filter(event => 
            event.category?.toLowerCase() === filters.category.toLowerCase()
          );
          break;
      }
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
        const updatedSaved = [...savedEvents, eventId];
        Store.patch('events.saved', updatedSaved);
        this.notify('Event saved! 🎉', 'success');
        
        // Emit event for PWA install trigger
        this.emit('events.saved', { count: updatedSaved.length });
        
        // Trigger install FTUE after 2+ saves (engagement threshold)
        if (updatedSaved.length >= 2) {
          this.emit('events:save', { 
            count: updatedSaved.length, 
            eventId,
            eventTitle: event.title || event.name 
          });
          
          // Check if should show install FTUE
          this.maybeShowInstallFTUE(updatedSaved.length);
        }
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
   * Maybe show install FTUE based on engagement
   */
  maybeShowInstallFTUE(saveCount) {
    // Only trigger on 2nd save (indicates genuine interest)
    if (saveCount === 2) {
      // Check if install FTUE should be shown
      const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone === true;
      
      if (!isInstalled) {
        // Emit global event to trigger install FTUE
        this.emit('ftue:show-install', { source: 'events', saveCount });
        
        console.log('🎯 Install FTUE triggered by event engagement');
      }
    }
  }

  /**
   * Render professional event card with persona pills and premium styling
   */
  renderProfessionalEventCard(event) {
    const savedEvents = Store.get('events.saved') || [];
    const isSaved = savedEvents.includes(event.id);
    
    // Format time for "Tonight • 9:00 PM" style
    const eventTime = this.formatEventTime(event);
    
    // Generate persona pills (mock data based on event type)
    const personaPills = this.generatePersonaPills(event);
    
    // Determine provenance chips
    const provenanceChips = this.getProvenanceChips(event);
    
    return `
      <article class="event-card" data-event-id="${event.id}">
        <div class="event-head">
          <h3 class="title">${event.name || event.title}</h3>
          <span class="time">${eventTime}</span>
        </div>
        <div class="row">
          <span class="venue">${event.venue || event.address || 'TBA'}</span>
          <div class="persona-pills">
            ${personaPills}
          </div>
        </div>
        <div class="provenance">
          ${provenanceChips.map(chip => `<span class="chip ghost">${chip}</span>`).join('')}
        </div>
        <div class="cta-row">
          <button class="btn-premium" data-action="rsvp" data-event-id="${event.id}" aria-label="RSVP">RSVP</button>
          <button class="btn-glass ${isSaved ? 'is-saved' : ''}" data-action="toggleSave" data-event-id="${event.id}">
            ${isSaved ? 'Saved' : 'Save'}
          </button>
          <button class="btn-premium" data-action="navigate" data-event-id="${event.id}">Navigate</button>
        </div>
      </article>
    `;
  }

  /**
   * Format event time for professional display
   */
  formatEventTime(event) {
    if (!event.date) return 'TBA';
    
    const eventDate = new Date(event.date);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    
    let timePrefix = '';
    if (eventDateOnly.getTime() === today.getTime()) {
      timePrefix = 'Tonight';
    } else if (eventDateOnly.getTime() === today.getTime() + 24 * 60 * 60 * 1000) {
      timePrefix = 'Tomorrow';
    } else {
      timePrefix = eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
    
    // Add time if available
    if (event.startTime) {
      const time = this.formatTime(event.startTime);
      return `${timePrefix} · ${time}`;
    }
    
    return timePrefix;
  }

  /**
   * Format time from 24h to 12h format
   */
  formatTime(timeString) {
    if (!timeString) return '';
    
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch {
      return timeString;
    }
  }

  /**
   * Generate persona pills based on event characteristics
   */
  generatePersonaPills(event) {
    // Mock persona distribution based on event type and venue
    const eventType = (event.category || '').toLowerCase();
    const venue = (event.venue || '').toLowerCase();
    
    let personas = [];
    
    // Determine persona mix based on event characteristics
    if (eventType.includes('mixer') || eventType.includes('networking')) {
      personas = [
        { type: 'dev', count: Math.floor(Math.random() * 15) + 5 },
        { type: 'pub', count: Math.floor(Math.random() * 10) + 3 },
        { type: 'inv', count: Math.floor(Math.random() * 5) + 1 },
        { type: 'sp', count: Math.floor(Math.random() * 3) + 1 }
      ];
    } else if (eventType.includes('party')) {
      personas = [
        { type: 'dev', count: Math.floor(Math.random() * 20) + 8 },
        { type: 'pub', count: Math.floor(Math.random() * 8) + 2 },
        { type: 'inv', count: Math.floor(Math.random() * 3) + 1 }
      ];
    } else {
      personas = [
        { type: 'dev', count: Math.floor(Math.random() * 12) + 3 },
        { type: 'pub', count: Math.floor(Math.random() * 6) + 2 }
      ];
    }
    
    return personas
      .filter(p => p.count > 0)
      .map(p => `<span class="pill pill-${p.type}">${p.count} ${this.getPersonaLabel(p.type)}</span>`)
      .join('');
  }

  /**
   * Get persona label abbreviation
   */
  getPersonaLabel(type) {
    const labels = {
      dev: 'Dev',
      pub: 'Pub',
      inv: 'Inv', 
      sp: 'SP'
    };
    return labels[type] || type;
  }

  /**
   * Get provenance chips for trust signals
   */
  getProvenanceChips(event) {
    const chips = [];
    
    // Check for official/verified status
    if (event.official || event.verified || (event.hosts && event.hosts.includes('official'))) {
      chips.push('Official');
    }
    
    // Check for calendar sync capability
    if (event.calendar_url || event.ics) {
      chips.push('Calendar Sync');
    }
    
    // Check for major venue/host
    const venue = (event.venue || '').toLowerCase();
    const hosts = (event.hosts || '').toLowerCase();
    
    if (venue.includes('koelnmesse') || hosts.includes('google') || hosts.includes('meta')) {
      chips.push('Verified Host');
    }
    
    // Default chips if none found
    if (chips.length === 0) {
      chips.push('Community');
    }
    
    return chips;
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
    const { filteredEvents, loading, error, filters } = data;
    
    if (loading) {
      return `
        <section id="route-events" class="screen">
          <header class="screen-head">
            <h1 class="h1">Gamescom 2025 Events</h1>
            <p class="sub">Loading events...</p>
          </header>
          <div class="loading-state">Loading events...</div>
        </section>
      `;
    }
    
    if (error) {
      return `
        <section id="route-events" class="screen">
          <header class="screen-head">
            <h1 class="h1">Gamescom 2025 Events</h1>
            <p class="sub">Unable to load events</p>
          </header>
          <div class="error-state">${error}</div>
        </section>
      `;
    }
    
    return `
      <section id="route-events" class="screen professional-intelligence-app">
        <header class="screen-head">
          <h1 class="h1">Tonight's Best Parties</h1>
          <p class="sub">Instant access to Gamescom's hottest networking events.</p>
        </header>

        <div class="fomo-search">
          <input 
            class="input" 
            placeholder="Search events, venues, hosts…" 
            aria-label="Search events"
            data-action="filter:search"
            value="${filters.search || ''}"
            autofocus
          >
          <div class="chip-row">
            <button class="chip ${filters.category === 'today' ? 'chip-active' : ''}" data-action="filter:category" data-category="today">🌙 Tonight</button>
            <button class="chip ${filters.category === 'tomorrow' ? 'chip-active' : ''}" data-action="filter:category" data-category="tomorrow">Tomorrow</button>
            <button class="chip ${filters.category === 'hot' ? 'chip-active' : ''}" data-action="filter:category" data-category="hot">🔥 Hot</button>
            <button class="chip ${filters.category === 'nearby' ? 'chip-active' : ''}" data-action="filter:category" data-category="nearby">📍 Near You</button>
            <button class="chip ${filters.category === 'mixer' ? 'chip-active' : ''}" data-action="filter:category" data-category="mixer">🥂 Mixer</button>
            <button class="chip ${filters.category === 'party' ? 'chip-active' : ''}" data-action="filter:category" data-category="party">🍸 Party</button>
          </div>
        </div>

        <div id="events-grid" class="cards-flow glass-card">
          ${filteredEvents.length ? 
            filteredEvents.map(event => this.renderProfessionalEventCard(event)).join('') :
            '<div class="glass-card empty-state professional-dashboard">No parties tonight — check back tomorrow!</div>'
          }
        </div>

        <div id="install-ftue" class="install-card" hidden>
          <div class="emoji">📱</div>
          <h3>Add to Home Screen</h3>
          <p class="muted">Faster launch, offline support, and calendar badges.</p>
          <div id="ios-hint" class="hint" hidden>
            Open <span class="ios-chip">Share ▁↑</span> → <b>Add to Home Screen</b>
          </div>
          <div class="actions">
            <button id="install-now" class="btn-premium">Install</button>
            <button id="install-later" class="btn-glass">Later</button>
          </div>
        </div>
      </section>
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