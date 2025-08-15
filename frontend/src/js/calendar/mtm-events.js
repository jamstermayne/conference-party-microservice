/**
 * MTM Events Calendar Integration
 * Displays MeetToMatch events in the calendar view
 */

class MtmCalendarEvents {
  constructor() {
    this.events = [];
    this.enabled = true; // Show MTM events by default
    this.apiBase = '/api/integrations/mtm';
  }

  /**
   * Initialize MTM calendar events
   */
  async init() {
    await this.loadEvents();
    this.renderToggle();
    this.attachEventListeners();
  }

  /**
   * Load MTM events from API
   */
  async loadEvents() {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${this.apiBase}/events`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.events = data.events || [];
        this.renderEvents();
      }
    } catch (error) {
      console.error('Failed to load MTM events:', error);
    }
  }

  /**
   * Render source toggle in calendar
   */
  renderToggle() {
    const container = document.querySelector('.calendar-sources');
    if (!container) {
      // Create sources container if it doesn't exist
      const calendarHeader = document.querySelector('.calendar-header');
      if (calendarHeader) {
        const sourcesDiv = document.createElement('div');
        sourcesDiv.className = 'calendar-sources';
        calendarHeader.appendChild(sourcesDiv);
        this.renderToggle(); // Recursive call with container now created
      }
      return;
    }

    const toggle = document.createElement('label');
    toggle.className = 'source-toggle mtm-source';
    toggle.innerHTML = `
      <input type="checkbox" ${this.enabled ? 'checked' : ''} />
      <span class="toggle-slider"></span>
      <span class="toggle-label">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" fill="currentColor"/>
        </svg>
        MeetToMatch
      </span>
    `;

    // Replace existing or append
    const existing = container.querySelector('.mtm-source');
    if (existing) {
      existing.replaceWith(toggle);
    } else {
      container.appendChild(toggle);
    }
  }

  /**
   * Render events in calendar
   */
  renderEvents() {
    if (!this.enabled || this.events.length === 0) return;

    const calendarContainer = document.querySelector('.calendar-events');
    if (!calendarContainer) return;

    // Group events by date
    const eventsByDate = {};
    this.events.forEach(event => {
      const date = new Date(event.start).toDateString();
      if (!eventsByDate[date]) {
        eventsByDate[date] = [];
      }
      eventsByDate[date].push(event);
    });

    // Render events for each date
    Object.entries(eventsByDate).forEach(([date, events]) => {
      const dateSection = this.findOrCreateDateSection(date);
      
      events.forEach(event => {
        const eventCard = this.createEventCard(event);
        dateSection.appendChild(eventCard);
      });
    });
  }

  /**
   * Find or create date section
   */
  findOrCreateDateSection(dateString) {
    const date = new Date(dateString);
    const dateKey = date.toISOString().split('T')[0];
    
    let section = document.querySelector(`[data-date="${dateKey}"]`);
    if (!section) {
      const container = document.querySelector('.calendar-events') || 
                       document.querySelector('#calendar');
      
      section = document.createElement('div');
      section.className = 'calendar-date-section';
      section.dataset.date = dateKey;
      section.innerHTML = `
        <h3 class="date-header">${this.formatDate(date)}</h3>
        <div class="date-events"></div>
      `;
      
      if (container) {
        // Insert in chronological order
        const sections = container.querySelectorAll('.calendar-date-section');
        let inserted = false;
        
        for (const existingSection of sections) {
          if (existingSection.dataset.date > dateKey) {
            container.insertBefore(section, existingSection);
            inserted = true;
            break;
          }
        }
        
        if (!inserted) {
          container.appendChild(section);
        }
      }
    }
    
    return section.querySelector('.date-events') || section;
  }

  /**
   * Create event card
   */
  createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'calendar-event mtm-event';
    card.dataset.eventId = event.id;
    
    const startTime = new Date(event.start);
    const endTime = new Date(event.end);
    
    card.innerHTML = `
      <div class="event-time">
        ${this.formatTime(startTime)} - ${this.formatTime(endTime)}
      </div>
      <div class="event-content">
        <div class="event-header">
          <span class="event-badge mtm-badge">MTM</span>
          <h4 class="event-title">${this.escapeHtml(event.title)}</h4>
        </div>
        ${event.location ? `
          <div class="event-location">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor" opacity="0.6"/>
            </svg>
            ${this.escapeHtml(event.location)}
            ${event.lat && event.lon ? `
              <button class="event-map-btn" data-lat="${event.lat}" data-lon="${event.lon}">
                View on map →
              </button>
            ` : ''}
          </div>
        ` : ''}
        ${event.description ? `
          <div class="event-description">
            ${this.escapeHtml(event.description).substring(0, 150)}${event.description.length > 150 ? '...' : ''}
          </div>
        ` : ''}
      </div>
      <div class="event-actions">
        <button class="btn-icon add-to-calendar" data-event='${JSON.stringify(event)}'>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
          </svg>
          Add to Calendar
        </button>
      </div>
    `;
    
    return card;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Toggle MTM events visibility
    document.addEventListener('change', (e) => {
      if (e.target.closest('.mtm-source')) {
        this.enabled = e.target.checked;
        this.toggleEventsVisibility();
      }
    });

    // Map button clicks
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('event-map-btn')) {
        const lat = parseFloat(e.target.dataset.lat);
        const lon = parseFloat(e.target.dataset.lon);
        this.showOnMap(lat, lon);
      }

      // Add to calendar
      if (e.target.closest('.add-to-calendar')) {
        const eventData = JSON.parse(e.target.closest('.add-to-calendar').dataset.event);
        this.addToExternalCalendar(eventData);
      }
    });
  }

  /**
   * Toggle events visibility
   */
  toggleEventsVisibility() {
    const mtmEvents = document.querySelectorAll('.mtm-event');
    mtmEvents.forEach(event => {
      event.style.display = this.enabled ? 'block' : 'none';
    });

    // Save preference
    localStorage.setItem('mtm-events-enabled', this.enabled);
  }

  /**
   * Show location on map
   */
  showOnMap(lat, lon) {
    // Navigate to map with focus on location
    const date = new Date().toISOString().split('T')[0];
    window.location.hash = `#map/${date}?focus=${lat},${lon}`;
  }

  /**
   * Add event to external calendar
   */
  addToExternalCalendar(event) {
    // This uses existing calendar integration
    // Don't send back to MTM - add to Google/Outlook
    if (window.CalendarIntegration) {
      window.CalendarIntegration.addEvent({
        title: event.title,
        description: event.description,
        location: event.location,
        start: event.start,
        end: event.end
      });
    }
  }

  /**
   * Format date for display
   */
  formatDate(date) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Format time for display
   */
  formatTime(date) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Get auth token
   */
  async getAuthToken() {
    if (window.firebase?.auth) {
      const user = firebase.auth().currentUser;
      if (user) {
        return user.getIdToken();
      }
    }
    return localStorage.getItem('authToken') || '';
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.mtmCalendarEvents = new MtmCalendarEvents();
    window.mtmCalendarEvents.init();
  });
} else {
  window.mtmCalendarEvents = new MtmCalendarEvents();
  window.mtmCalendarEvents.init();
}