/**
 * EVENTS CONTROLLER
 * Gaming conference events discovery and management
 */

import { Store } from '../store.js?v=b021';
import { Events } from '../events.js?v=b021';
import { renderEvents } from '../ui/homeViews.js?v=b021';
import * as API from '../services/api.js?v=b021';
import * as CAL from '../services/calendar.js?v=b021';
import * as NAV from '../services/nav.js?v=b021';

export function EventsController(section){
  const tonightMount = section.querySelector('#tonight');

  section.addEventListener('route:enter', async ()=>{
    const list = await API.listEvents({ when:'tonight' });
    Store.patch('events', list);
    renderEvents(tonightMount, list);
  });

  Events.on('event.rsvp', async ({el})=>{
    const id = el.dataset.id;
    el.disabled = true;
    const ok = await API.rsvp(id, 'going').catch(()=>false);
    if (!ok) el.disabled = false;
    else el.textContent = 'Going';
  });

  Events.on('event.calendar', ({el})=>{
    const ev = Store.get().events.find(x=>x.id===el.dataset.id);
    if (!ev) return;
    CAL.downloadICS(ev);
  });

  Events.on('event.navigate', ({el})=>{
    const ev = Store.get().events.find(x=>x.id===el.dataset.id);
    if (!ev) return;
    NAV.open(ev);
  });
}

// Legacy class-based controller for backward compatibility
export default class EventsControllerLegacy {
  constructor(context) {
    this.context = context;
    this.subscriptions = [];
    this.initialized = false;
    this.currentFilter = 'tonight';
  }

  async init() {
    if (this.initialized) return;

    try {
      // Show current view
      this.showCurrentView();
      
      // Load events data
      await this.loadEvents();
      
      // Render interface
      this.render();
      
      // Set up subscriptions
      this.setupSubscriptions();
      
      // Initialize animations
      motion.initializeView('events');
      
      // Initialize map if needed
      await this.initializeMap();
      
      this.initialized = true;
    } catch (error) {
      console.error('Events controller initialization error:', error);
      store.actions.showError('Failed to load events');
    }
  }

  async loadEvents() {
    try {
      const events = await api.getEvents();
      store.actions.setEvents(events);
      
      // Filter for tonight by default
      this.filterEventsByTime('tonight');
      
    } catch (error) {
      console.warn('Failed to load events:', error);
      // Use cached events if available
      const cachedEvents = store.get('events.all') || [];
      if (cachedEvents.length > 0) {
        this.filterEventsByTime('tonight');
      }
    }
  }

  showCurrentView() {
    // Show events section, hide others
    document.querySelectorAll('[data-route]').forEach(section => {
      section.hidden = section.dataset.route !== 'events';
    });
  }

  render() {
    this.renderTonightEvents();
    this.updateFabVisibility();
  }

  renderTonightEvents() {
    const container = document.getElementById('tonight');
    if (!container) return;

    const tonightEvents = this.getTonightEvents();
    
    if (tonightEvents.length === 0) {
      container.innerHTML = templates.emptyState({
        icon: '🌙',
        title: 'No events tonight',
        subtitle: 'Check back later or create your own event',
        action: 'Create Event',
        actionHandler: 'event.create'
      });
      return;
    }

    container.innerHTML = `
      <div class="events-header">
        <h2>🌟 Tonight's Events (${tonightEvents.length})</h2>
        <div class="events-filters">
          <button class="filter-btn ${this.currentFilter === 'tonight' ? 'active' : ''}" 
                  data-filter="tonight">Tonight</button>
          <button class="filter-btn ${this.currentFilter === 'tomorrow' ? 'active' : ''}" 
                  data-filter="tomorrow">Tomorrow</button>
          <button class="filter-btn ${this.currentFilter === 'week' ? 'active' : ''}" 
                  data-filter="week">This Week</button>
        </div>
      </div>
      
      <div class="events-grid">
        ${tonightEvents.map(event => templates.eventCard({
          ...event,
          showTime: true,
          showSaveButton: true
        })).join('')}
      </div>
    `;

    // Add entrance animations
    motion.staggerFadeIn('.event-card', 100);
  }

  getTonightEvents() {
    const allEvents = store.get('events.all') || [];
    const now = new Date();
    
    return allEvents.filter(event => {
      const eventDate = new Date(event.date || event.Date);
      
      switch (this.currentFilter) {
        case 'tonight':
          return this.isToday(eventDate);
        case 'tomorrow':
          return this.isTomorrow(eventDate);
        case 'week':
          return this.isThisWeek(eventDate);
        default:
          return this.isToday(eventDate);
      }
    }).sort((a, b) => {
      // Sort by start time
      const timeA = a.startTime || a['Start Time'] || '00:00';
      const timeB = b.startTime || b['Start Time'] || '00:00';
      return timeA.localeCompare(timeB);
    });
  }

  isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  isTomorrow(date) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
  }

  isThisWeek(date) {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    
    return date >= startOfWeek && date < endOfWeek;
  }

  async initializeMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    try {
      // Import and initialize map
      const { maps } = await import('../services/maps.js?v=b021');
      await maps.init(mapContainer);
      
      // Add events to map
      const events = store.get('events.all') || [];
      const eventsWithLocation = events.filter(e => 
        e.latitude && e.longitude || e.address
      );
      
      maps.addEventMarkers(eventsWithLocation);
      
    } catch (error) {
      console.warn('Failed to initialize map:', error);
      mapContainer.innerHTML = `
        <div class="map-placeholder">
          <p>🗺️ Map temporarily unavailable</p>
          <button class="btn btn-outline" onclick="window.location.reload()">
            Retry
          </button>
        </div>
      `;
    }
  }

  updateFabVisibility() {
    const fab = document.querySelector('.fab');
    if (fab) {
      // Show FAB with animation
      fab.style.transform = 'scale(1)';
      fab.style.opacity = '1';
    }
  }

  setupSubscriptions() {
    // Update when events change
    this.subscriptions.push(
      store.subscribe('events.all', () => this.render())
    );

    // Handle filter changes
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-filter]')) {
        this.setFilter(e.target.dataset.filter);
      }
    });

    // Handle event interactions
    document.addEventListener('click', (e) => {
      const eventCard = e.target.closest('[data-event-id]');
      if (!eventCard) return;

      const eventId = eventCard.dataset.eventId;
      const action = e.target.dataset.action;

      this.handleEventAction(eventId, action, e);
    });

    // Handle FAB click
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="event.create"]')) {
        this.createEvent();
      }
    });
  }

  setFilter(filter) {
    this.currentFilter = filter;
    
    // Update filter buttons
    document.querySelectorAll('[data-filter]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    
    // Re-render events
    this.renderTonightEvents();
  }

  async handleEventAction(eventId, action, event) {
    event.stopPropagation();
    
    switch (action) {
      case 'save':
        await this.saveEvent(eventId);
        break;
      case 'share':
        this.shareEvent(eventId);
        break;
      case 'calendar':
        await this.addToCalendar(eventId);
        break;
      case 'directions':
        this.getDirections(eventId);
        break;
      default:
        this.viewEventDetails(eventId);
    }
  }

  async saveEvent(eventId) {
    try {
      await api.swipeEvent(eventId, 'right');
      
      // Update UI
      const button = document.querySelector(`[data-event-id="${eventId}"] [data-action="save"]`);
      if (button) {
        button.textContent = '✅ Saved';
        button.disabled = true;
        
        // Add to saved list
        const saved = store.get('events.saved') || [];
        if (!saved.includes(eventId)) {
          store.set('events.saved', [...saved, eventId]);
        }
      }
      
      store.actions.showNotification('Event saved! 🎉');
      
    } catch (error) {
      store.actions.showError('Failed to save event');
    }
  }

  shareEvent(eventId) {
    const event = this.findEvent(eventId);
    if (!event) return;

    const shareData = {
      title: `🎮 ${event.name || event['Event Name']}`,
      text: `Check out this gaming event at Gamescom 2025!`,
      url: `${window.location.origin}/#/events/${eventId}`
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      // Fallback to copy link
      navigator.clipboard.writeText(shareData.url).then(() => {
        store.actions.showNotification('Link copied! 📋');
      });
    }
  }

  async addToCalendar(eventId) {
    try {
      const event = this.findEvent(eventId);
      if (!event) return;

      const calendarUrl = calendar.generateICSUrl(event);
      window.open(calendarUrl, '_blank');
      
      store.actions.showNotification('Opening calendar app... 📅');
      
    } catch (error) {
      store.actions.showError('Failed to add to calendar');
    }
  }

  getDirections(eventId) {
    const event = this.findEvent(eventId);
    if (!event) return;

    const address = event.venue || event.Address || event.address;
    if (address) {
      const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
      window.open(mapsUrl, '_blank');
    }
  }

  viewEventDetails(eventId) {
    const event = this.findEvent(eventId);
    if (event) {
      store.actions.openModal({
        type: 'eventDetail',
        data: event
      });
    }
  }

  findEvent(eventId) {
    const allEvents = store.get('events.all') || [];
    return allEvents.find(e => e.id === eventId);
  }

  createEvent() {
    store.actions.openModal({
      type: 'eventCreate',
      onSubmit: async (eventData) => {
        try {
          const result = await api.createEvent(eventData);
          if (result.success) {
            store.actions.showNotification('Event created! 🎉');
            await this.loadEvents(); // Refresh events
          }
        } catch (error) {
          store.actions.showError('Failed to create event');
        }
      }
    });
  }

  filterEventsByTime(timeFilter) {
    const allEvents = store.get('events.all') || [];
    this.currentFilter = timeFilter;
    
    // This will trigger a re-render via the subscription
    store.set('events.currentTimeFilter', timeFilter);
  }

  destroy() {
    // Clean up subscriptions
    this.subscriptions.forEach(unsub => unsub());
    this.subscriptions = [];
    
    // Clean up map if initialized
    if (window.maps) {
      window.maps.destroy?.();
    }
    
    this.initialized = false;
  }
}