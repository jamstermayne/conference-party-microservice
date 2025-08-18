/**
 * Holistic Calendar System
 * Integrates user's calendar with parties and Meet-to-Match events
 */

class HolisticCalendar {
  constructor() {
    this.events = [];
    this.userEvents = [];
    this.partyEvents = [];
    this.m2mEvents = [];
    this.inviteEvents = [];
    this.view = 'week'; // 'day', 'week', 'month'
    this.currentDate = new Date();
    this.isAuthenticated = false;
    this.googleCalendarApi = null;
  }

  async init() {
    // Check for Google Calendar API
    if (window.gapi) {
      await this.initGoogleCalendar();
    }
    
    // Load all event sources
    await this.loadAllEvents();
    
    // Render calendar
    this.render();
  }

  async initGoogleCalendar() {
    return new Promise((resolve) => {
      gapi.load('client:auth2', async () => {
        try {
          await gapi.client.init({
            apiKey: window.GOOGLE_CALENDAR_API_KEY || '',
            clientId: window.GOOGLE_CALENDAR_CLIENT_ID || '',
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
            scope: 'https://www.googleapis.com/auth/calendar.readonly'
          });

          // Check if user is signed in
          const authInstance = gapi.auth2.getAuthInstance();
          this.isAuthenticated = authInstance.isSignedIn.get();
          
          if (this.isAuthenticated) {
            this.googleCalendarApi = gapi.client.calendar;
            await this.loadGoogleCalendarEvents();
          }
          
          resolve();
        } catch (error) {
          console.error('[Calendar] Google Calendar init failed:', error);
          resolve();
        }
      });
    });
  }

  async loadGoogleCalendarEvents() {
    if (!this.googleCalendarApi) return;

    try {
      const response = await this.googleCalendarApi.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults: 100,
        orderBy: 'startTime'
      });

      this.userEvents = response.result.items.map(event => ({
        id: event.id,
        title: event.summary,
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date,
        location: event.location,
        description: event.description,
        type: 'google',
        color: '#4285f4', // Google blue
        editable: false
      }));

      console.log('[Calendar] Loaded', this.userEvents.length, 'Google Calendar events');
    } catch (error) {
      console.error('[Calendar] Failed to load Google Calendar:', error);
    }
  }

  async loadAllEvents() {
    // Load party events
    if (window.apiIntegration) {
      this.partyEvents = await window.apiIntegration.getParties();
      this.partyEvents = this.partyEvents.map(event => ({
        ...event,
        type: 'party',
        color: '#8b5cf6', // Purple for parties
        icon: '🎉'
      }));
    }

    // Load M2M events (Meet-to-Match)
    await this.loadM2MEvents();

    // Load invite events
    await this.loadInviteEvents();

    // Load saved events from local storage
    this.loadSavedEvents();

    // Combine all events
    this.combineEvents();
  }

  async loadM2MEvents() {
    try {
      const response = await fetch('/api/m2m/events');
      const data = await response.json();
      
      this.m2mEvents = (data.events || []).map(event => ({
        ...event,
        type: 'm2m',
        color: '#10b981', // Green for M2M
        icon: '🤝'
      }));
    } catch (error) {
      console.error('[Calendar] Failed to load M2M events:', error);
      this.m2mEvents = [];
    }
  }

  async loadInviteEvents() {
    try {
      const { InvitesClient } = await import('./services/invites-client.js');
      const response = await InvitesClient.list();
      
      this.inviteEvents = (response.invites || []).map(invite => ({
        id: invite.id,
        title: invite.event?.title || 'Invitation',
        start: invite.event?.start,
        end: invite.event?.end,
        location: invite.event?.location,
        description: invite.event?.description,
        status: invite.status,
        toEmail: invite.toEmail,
        type: 'invite',
        color: '#ec4899', // Pink for invites
        icon: '✉️'
      }));
    } catch (error) {
      console.error('[Calendar] Failed to load invites:', error);
      this.inviteEvents = [];
    }
  }

  loadSavedEvents() {
    const saved = JSON.parse(localStorage.getItem('calendar_saved_events') || '[]');
    this.savedEventIds = new Set(saved);
  }

  combineEvents() {
    // Combine all event sources
    this.events = [
      ...this.userEvents,
      ...this.partyEvents,
      ...this.m2mEvents,
      ...this.inviteEvents
    ];

    // Sort by start time
    this.events.sort((a, b) => {
      const aStart = new Date(a.start || a.date);
      const bStart = new Date(b.start || b.date);
      return aStart - bStart;
    });

    // Mark saved events
    this.events.forEach(event => {
      event.saved = this.savedEventIds.has(event.id);
    });

    console.log('[Calendar] Combined', this.events.length, 'total events');
  }

  render() {
    const container = document.getElementById('calendar-container');
    if (!container) return;

    container.innerHTML = `
      <div class="calendar-holistic">
        ${this.renderHeader()}
        ${this.renderFilters()}
        ${this.renderCalendarView()}
      </div>
    `;

    this.bindCalendarEvents();
  }

  renderHeader() {
    const dateStr = this.currentDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });

    return `
      <header class="calendar-header">
        <div class="calendar-nav">
          <button class="cal-nav-btn" data-action="prev">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
          </button>
          <h2 class="calendar-title">${dateStr}</h2>
          <button class="cal-nav-btn" data-action="next">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
        
        <div class="calendar-view-toggle">
          <button class="view-btn ${this.view === 'day' ? 'active' : ''}" data-view="day">Day</button>
          <button class="view-btn ${this.view === 'week' ? 'active' : ''}" data-view="week">Week</button>
          <button class="view-btn ${this.view === 'month' ? 'active' : ''}" data-view="month">Month</button>
        </div>

        ${!this.isAuthenticated ? `
          <button class="btn-sync-google" data-action="sync-google">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z"/>
            </svg>
            Sync Google Calendar
          </button>
        ` : `
          <div class="sync-status">
            <span class="sync-indicator"></span>
            Google Calendar synced
          </div>
        `}
      </header>
    `;
  }

  renderFilters() {
    return `
      <div class="calendar-filters">
        <label class="filter-option">
          <input type="checkbox" checked data-filter="google">
          <span class="filter-badge" style="background: #4285f4"></span>
          My Calendar
        </label>
        <label class="filter-option">
          <input type="checkbox" checked data-filter="party">
          <span class="filter-badge" style="background: #8b5cf6"></span>
          Parties
        </label>
        <label class="filter-option">
          <input type="checkbox" checked data-filter="m2m">
          <span class="filter-badge" style="background: #10b981"></span>
          Meet to Match
        </label>
        <label class="filter-option">
          <input type="checkbox" checked data-filter="invite">
          <span class="filter-badge" style="background: #ec4899"></span>
          Invitations
        </label>
      </div>
    `;
  }

  renderCalendarView() {
    switch (this.view) {
      case 'day':
        return this.renderDayView();
      case 'week':
        return this.renderWeekView();
      case 'month':
        return this.renderMonthView();
      default:
        return this.renderWeekView();
    }
  }

  renderWeekView() {
    const startOfWeek = this.getStartOfWeek(this.currentDate);
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      days.push(date);
    }

    const hours = Array.from({ length: 24 }, (_, i) => i);

    return `
      <div class="calendar-week-view">
        <div class="week-header">
          <div class="time-gutter"></div>
          ${days.map(day => `
            <div class="day-header ${this.isToday(day) ? 'today' : ''}">
              <div class="day-name">${day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
              <div class="day-number">${day.getDate()}</div>
            </div>
          `).join('')}
        </div>
        
        <div class="week-body">
          <div class="time-column">
            ${hours.map(hour => `
              <div class="time-slot">${this.formatHour(hour)}</div>
            `).join('')}
          </div>
          
          <div class="days-grid">
            ${days.map(day => `
              <div class="day-column" data-date="${day.toISOString()}">
                ${this.renderDayEvents(day)}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  renderDayEvents(date) {
    const dayEvents = this.events.filter(event => {
      const eventDate = new Date(event.start || event.date);
      return eventDate.toDateString() === date.toDateString();
    });

    return dayEvents.map(event => {
      const startTime = new Date(event.start || event.date);
      const endTime = new Date(event.end || event.start || event.date);
      const duration = (endTime - startTime) / (1000 * 60 * 60); // hours
      const topPosition = startTime.getHours() * 60 + startTime.getMinutes();
      const height = Math.max(duration * 60, 30); // minimum 30px height

      return `
        <div class="calendar-event" 
             data-id="${event.id}"
             data-type="${event.type}"
             style="
               top: ${topPosition}px;
               height: ${height}px;
               background: ${event.color};
               opacity: ${event.saved ? '1' : '0.8'};
             ">
          <div class="event-time">${this.formatTime(startTime)}</div>
          <div class="event-title">${event.icon || ''} ${event.title}</div>
          ${event.location ? `<div class="event-location">${event.location}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  renderDayView() {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const todayEvents = this.events.filter(event => {
      const eventDate = new Date(event.start || event.date);
      return eventDate.toDateString() === this.currentDate.toDateString();
    });

    return `
      <div class="calendar-day-view">
        <div class="day-timeline">
          ${hours.map(hour => `
            <div class="hour-row">
              <div class="hour-label">${this.formatHour(hour)}</div>
              <div class="hour-events">
                ${this.renderHourEvents(hour, todayEvents)}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderHourEvents(hour, events) {
    const hourEvents = events.filter(event => {
      const eventTime = new Date(event.start || event.date);
      return eventTime.getHours() === hour;
    });

    return hourEvents.map(event => `
      <div class="day-event" data-id="${event.id}" style="background: ${event.color}">
        <span class="event-icon">${event.icon || ''}</span>
        <span class="event-text">${event.title}</span>
        ${event.saved ? '<span class="saved-badge">✓</span>' : ''}
      </div>
    `).join('');
  }

  renderMonthView() {
    const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
    const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
    const startDate = this.getStartOfWeek(firstDay);
    const weeks = [];
    
    let currentWeek = [];
    let date = new Date(startDate);
    
    while (date <= lastDay || currentWeek.length > 0) {
      currentWeek.push(new Date(date));
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      
      date.setDate(date.getDate() + 1);
      
      if (date > lastDay && currentWeek.length === 0) break;
    }

    return `
      <div class="calendar-month-view">
        <div class="month-header">
          ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => 
            `<div class="weekday-label">${day}</div>`
          ).join('')}
        </div>
        <div class="month-grid">
          ${weeks.map(week => `
            <div class="month-week">
              ${week.map(day => this.renderMonthDay(day, firstDay, lastDay)).join('')}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderMonthDay(date, firstDay, lastDay) {
    const isCurrentMonth = date >= firstDay && date <= lastDay;
    const isToday = this.isToday(date);
    const dayEvents = this.events.filter(event => {
      const eventDate = new Date(event.start || event.date);
      return eventDate.toDateString() === date.toDateString();
    });

    return `
      <div class="month-day ${isCurrentMonth ? '' : 'other-month'} ${isToday ? 'today' : ''}">
        <div class="day-number">${date.getDate()}</div>
        ${dayEvents.length > 0 ? `
          <div class="day-events-dots">
            ${dayEvents.slice(0, 3).map(event => 
              `<span class="event-dot" style="background: ${event.color}"></span>`
            ).join('')}
            ${dayEvents.length > 3 ? `<span class="more-events">+${dayEvents.length - 3}</span>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  bindCalendarEvents() {
    const container = document.querySelector('.calendar-holistic');
    if (!container) return;

    // Navigation
    container.addEventListener('click', async (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      const view = e.target.closest('[data-view]')?.dataset.view;
      const eventEl = e.target.closest('.calendar-event, .day-event');
      
      if (action === 'prev') {
        this.navigatePrev();
      } else if (action === 'next') {
        this.navigateNext();
      } else if (action === 'sync-google') {
        await this.syncGoogleCalendar();
      } else if (view) {
        this.changeView(view);
      } else if (eventEl) {
        this.showEventDetails(eventEl.dataset.id);
      }
    });

    // Filters
    container.querySelectorAll('[data-filter]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateFilters();
      });
    });
  }

  async syncGoogleCalendar() {
    if (!window.gapi) {
      alert('Google Calendar API not loaded. Please check your configuration.');
      return;
    }

    const authInstance = gapi.auth2.getAuthInstance();
    try {
      await authInstance.signIn();
      this.isAuthenticated = true;
      this.googleCalendarApi = gapi.client.calendar;
      await this.loadGoogleCalendarEvents();
      this.combineEvents();
      this.render();
    } catch (error) {
      console.error('[Calendar] Google sign-in failed:', error);
    }
  }

  navigatePrev() {
    switch (this.view) {
      case 'day':
        this.currentDate.setDate(this.currentDate.getDate() - 1);
        break;
      case 'week':
        this.currentDate.setDate(this.currentDate.getDate() - 7);
        break;
      case 'month':
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        break;
    }
    this.render();
  }

  navigateNext() {
    switch (this.view) {
      case 'day':
        this.currentDate.setDate(this.currentDate.getDate() + 1);
        break;
      case 'week':
        this.currentDate.setDate(this.currentDate.getDate() + 7);
        break;
      case 'month':
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        break;
    }
    this.render();
  }

  changeView(view) {
    this.view = view;
    this.render();
  }

  updateFilters() {
    const filters = {};
    document.querySelectorAll('[data-filter]').forEach(checkbox => {
      filters[checkbox.dataset.filter] = checkbox.checked;
    });
    
    // Re-render with filters
    this.render();
  }

  showEventDetails(eventId) {
    const event = this.events.find(e => e.id === eventId);
    if (!event) return;

    // Create modal or panel to show event details
    console.log('[Calendar] Show event details:', event);
    // Implementation depends on UI requirements
  }

  // Utility methods
  getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  formatHour(hour) {
    return hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
  }

  formatTime(date) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.holisticCalendar = new HolisticCalendar();
  });
} else {
  window.holisticCalendar = new HolisticCalendar();
}

export default HolisticCalendar;