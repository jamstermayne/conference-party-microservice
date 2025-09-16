/**
 * Calendar Module
 *
 * SINGLE RESPONSIBILITY: Calendar integration and scheduling
 * - Google Calendar sync
 * - Event export to calendar
 * - Meeting scheduling
 * - Calendar availability checking
 * - iCal file generation
 * - Reminder management
 *
 * This module is completely isolated and communicates only through the Platform event bus
 */

import platform from '../core/platform.js';

class CalendarModule {
  constructor() {
    this.container = null;
    this.state = {
      isConnected: false,
      connectedAccount: null,
      syncedEvents: [],
      upcomingMeetings: [],
      availability: [],
      loading: false,
      error: null,
      view: 'overview' // 'overview', 'sync', 'meetings', 'availability'
    };

    // Bind methods
    this.mount = this.mount.bind(this);
    this.unmount = this.unmount.bind(this);
    this.connectCalendar = this.connectCalendar.bind(this);
    this.syncEvent = this.syncEvent.bind(this);
    this.scheduleMeeting = this.scheduleMeeting.bind(this);
  }

  // ============= MODULE LIFECYCLE =============

  /**
   * Mount the module to a container
   */
  async mount(container) {
    this.container = container;
    console.log('[CalendarModule] Mounting...');

    // Register event listeners
    this.registerEventListeners();

    // Check if user is authenticated
    const user = platform.getUser();
    if (user) {
      await this.loadUserCalendarSettings(user.id);
    }

    // Render initial UI
    this.render();

    console.log('[CalendarModule] Mounted successfully');
  }

  /**
   * Unmount the module and clean up
   */
  async unmount() {
    console.log('[CalendarModule] Unmounting...');

    // Clean up event listeners
    this.unregisterEventListeners();

    // Clear container
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }

    // Reset state
    this.state = {
      isConnected: false,
      connectedAccount: null,
      syncedEvents: [],
      upcomingMeetings: [],
      availability: [],
      loading: false,
      error: null,
      view: 'overview'
    };

    console.log('[CalendarModule] Unmounted successfully');
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
    this.render();
  }

  // ============= CALENDAR LOGIC =============

  /**
   * Load user calendar settings
   */
  async loadUserCalendarSettings(userId) {
    try {
      const stored = localStorage.getItem(`calendar_settings_${userId}`);
      if (stored) {
        const settings = JSON.parse(stored);
        this.setState({
          isConnected: settings.isConnected || false,
          connectedAccount: settings.connectedAccount || null
        });

        if (settings.isConnected) {
          await this.loadSyncedEvents();
          await this.loadUpcomingMeetings();
        }
      }
    } catch (error) {
      console.error('[CalendarModule] Failed to load settings:', error);
    }
  }

  /**
   * Connect to Google Calendar
   */
  async connectCalendar(provider = 'google') {
    const user = platform.getUser();
    if (!user) {
      platform.emit('calendar:require-auth', {
        action: 'connect-calendar'
      });
      return;
    }

    this.setState({ loading: true });

    try {
      // Mock Google Calendar OAuth flow
      // In real app, this would redirect to Google OAuth
      await this.simulateOAuthFlow(provider);

      const account = {
        provider: provider,
        email: `${user.email}`,
        name: user.name,
        connectedAt: Date.now()
      };

      // Save settings
      localStorage.setItem(`calendar_settings_${user.id}`, JSON.stringify({
        isConnected: true,
        connectedAccount: account
      }));

      this.setState({
        isConnected: true,
        connectedAccount: account,
        loading: false
      });

      // Load initial data
      await this.loadSyncedEvents();
      await this.loadUpcomingMeetings();

      // Emit success event
      platform.emit('calendar:connected', {
        userId: user.id,
        provider: provider,
        account: account
      });

    } catch (error) {
      console.error('[CalendarModule] Failed to connect calendar:', error);
      this.setState({
        loading: false,
        error: error.message
      });
    }
  }

  /**
   * Simulate OAuth flow for demo
   */
  async simulateOAuthFlow(provider) {
    // Simulate OAuth redirect delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock successful OAuth response
    return {
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
      scope: 'calendar.readonly calendar.events'
    };
  }

  /**
   * Sync event to calendar
   */
  async syncEvent(eventData) {
    if (!this.state.isConnected) {
      await this.connectCalendar();
      return;
    }

    this.setState({ loading: true });

    try {
      // Mock calendar API call
      const calendarEvent = {
        id: `cal_${eventData.eventId}_${Date.now()}`,
        title: eventData.event.title,
        description: eventData.event.description,
        start: this.formatEventDateTime(eventData.event.date, eventData.event.time),
        end: this.formatEventDateTime(eventData.event.date, eventData.event.time, 2), // +2 hours
        location: eventData.event.location,
        status: 'confirmed',
        syncedAt: Date.now()
      };

      // Add to synced events
      this.state.syncedEvents.push(calendarEvent);

      // Save to localStorage
      const user = platform.getUser();
      if (user) {
        localStorage.setItem(
          `synced_events_${user.id}`,
          JSON.stringify(this.state.syncedEvents)
        );
      }

      this.setState({ loading: false });

      // Emit success event
      platform.emit('calendar:event-added', {
        eventId: eventData.eventId,
        calendarEventId: calendarEvent.id,
        event: calendarEvent
      });

      console.log('[CalendarModule] Event synced to calendar:', calendarEvent);

    } catch (error) {
      console.error('[CalendarModule] Failed to sync event:', error);
      this.setState({
        loading: false,
        error: error.message
      });
    }
  }

  /**
   * Format event date/time for calendar
   */
  formatEventDateTime(date, time, addHours = 0) {
    const eventDate = new Date(`${date}T${time}`);
    if (addHours > 0) {
      eventDate.setHours(eventDate.getHours() + addHours);
    }
    return eventDate.toISOString();
  }

  /**
   * Load synced events
   */
  async loadSyncedEvents() {
    try {
      const user = platform.getUser();
      if (!user) return;

      const stored = localStorage.getItem(`synced_events_${user.id}`);
      if (stored) {
        this.state.syncedEvents = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[CalendarModule] Failed to load synced events:', error);
    }
  }

  /**
   * Load upcoming meetings
   */
  async loadUpcomingMeetings() {
    try {
      // Mock upcoming meetings data
      const mockMeetings = [
        {
          id: 'meeting_1',
          title: 'Publisher Meeting - Indie Game Discussion',
          attendees: ['sarah.chen@indiegames.com'],
          start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          duration: 60,
          type: 'video_call',
          meetingLink: 'https://meet.google.com/abc-defg-hij'
        },
        {
          id: 'meeting_2',
          title: 'Investor Pitch - VR Gaming Startup',
          attendees: ['alex.rodriguez@vrventures.com'],
          start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after
          duration: 30,
          type: 'in_person',
          location: 'Koelnmesse Hall 7'
        }
      ];

      this.setState({
        upcomingMeetings: mockMeetings
      });

    } catch (error) {
      console.error('[CalendarModule] Failed to load meetings:', error);
    }
  }

  /**
   * Schedule meeting
   */
  async scheduleMeeting(meetingData) {
    if (!this.state.isConnected) {
      await this.connectCalendar();
      return;
    }

    this.setState({ loading: true });

    try {
      const meeting = {
        id: `meeting_${Date.now()}`,
        title: meetingData.title,
        attendees: meetingData.attendees || [],
        start: meetingData.startTime,
        duration: meetingData.duration || 60,
        type: meetingData.type || 'video_call',
        meetingLink: meetingData.type === 'video_call' ?
          `https://meet.google.com/${this.generateMeetingId()}` : null,
        location: meetingData.location,
        createdAt: Date.now()
      };

      // Add to meetings
      this.state.upcomingMeetings.push(meeting);

      // Save to localStorage
      const user = platform.getUser();
      if (user) {
        localStorage.setItem(
          `upcoming_meetings_${user.id}`,
          JSON.stringify(this.state.upcomingMeetings)
        );
      }

      this.setState({ loading: false });

      // Emit meeting scheduled event
      platform.emit('calendar:meeting-scheduled', {
        meetingId: meeting.id,
        meeting: meeting
      });

      console.log('[CalendarModule] Meeting scheduled:', meeting);

    } catch (error) {
      console.error('[CalendarModule] Failed to schedule meeting:', error);
      this.setState({
        loading: false,
        error: error.message
      });
    }
  }

  /**
   * Generate meeting ID for video calls
   */
  generateMeetingId() {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Disconnect calendar
   */
  async disconnectCalendar() {
    const user = platform.getUser();
    if (!user) return;

    try {
      // Clear stored settings
      localStorage.removeItem(`calendar_settings_${user.id}`);
      localStorage.removeItem(`synced_events_${user.id}`);
      localStorage.removeItem(`upcoming_meetings_${user.id}`);

      this.setState({
        isConnected: false,
        connectedAccount: null,
        syncedEvents: [],
        upcomingMeetings: [],
        view: 'overview'
      });

      // Emit disconnect event
      platform.emit('calendar:disconnected', {
        userId: user.id
      });

    } catch (error) {
      console.error('[CalendarModule] Failed to disconnect calendar:', error);
    }
  }

  // ============= UI RENDERING =============

  /**
   * Render the calendar UI
   */
  render() {
    if (!this.container) return;

    const user = platform.getUser();

    if (!user) {
      this.renderRequireAuth();
      return;
    }

    switch (this.state.view) {
      case 'overview':
        this.renderOverview();
        break;
      case 'sync':
        this.renderSync();
        break;
      case 'meetings':
        this.renderMeetings();
        break;
      case 'availability':
        this.renderAvailability();
        break;
      default:
        this.renderOverview();
    }
  }

  /**
   * Render require authentication view
   */
  renderRequireAuth() {
    this.container.innerHTML = `
      <div class="calendar-module">
        <div class="calendar-auth-required">
          <h2>📅 Calendar Integration</h2>
          <p>Sync events and schedule meetings seamlessly</p>
          <div class="auth-prompt">
            <p>Please log in to connect your calendar</p>
            <button id="calendar-request-auth">Sign In to Continue</button>
          </div>
        </div>
      </div>
    `;

    const authBtn = this.container.querySelector('#calendar-request-auth');
    if (authBtn) {
      authBtn.addEventListener('click', () => {
        platform.emit('calendar:require-auth', {
          action: 'connect-calendar'
        });
      });
    }
  }

  /**
   * Render overview view
   */
  renderOverview() {
    this.container.innerHTML = `
      <div class="calendar-module">
        <div class="calendar-nav">
          <button class="nav-btn active" id="nav-overview">Overview</button>
          <button class="nav-btn" id="nav-sync">Event Sync</button>
          <button class="nav-btn" id="nav-meetings">Meetings</button>
          <button class="nav-btn" id="nav-availability">Availability</button>
        </div>

        <div class="calendar-overview">
          ${this.renderConnectionStatus()}
          ${this.renderQuickStats()}
          ${this.renderRecentActivity()}
        </div>
      </div>
    `;

    this.attachNavigationListeners();
  }

  /**
   * Render connection status
   */
  renderConnectionStatus() {
    if (this.state.isConnected) {
      return `
        <div class="connection-status connected">
          <div class="status-info">
            <span class="status-icon">✅</span>
            <div>
              <h3>Calendar Connected</h3>
              <p>Connected to ${this.state.connectedAccount?.email}</p>
            </div>
          </div>
          <button id="disconnect-calendar" class="disconnect-btn">Disconnect</button>
        </div>
      `;
    } else {
      return `
        <div class="connection-status disconnected">
          <div class="status-info">
            <span class="status-icon">⚠️</span>
            <div>
              <h3>Calendar Not Connected</h3>
              <p>Connect your Google Calendar to sync events</p>
            </div>
          </div>
          <button id="connect-calendar" class="connect-btn" ${this.state.loading ? 'disabled' : ''}>
            ${this.state.loading ? 'Connecting...' : 'Connect Google Calendar'}
          </button>
        </div>
      `;
    }
  }

  /**
   * Render quick stats
   */
  renderQuickStats() {
    return `
      <div class="calendar-stats">
        <div class="stat-card">
          <div class="stat-number">${this.state.syncedEvents.length}</div>
          <div class="stat-label">Synced Events</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${this.state.upcomingMeetings.length}</div>
          <div class="stat-label">Upcoming Meetings</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${this.state.isConnected ? '100%' : '0%'}</div>
          <div class="stat-label">Sync Status</div>
        </div>
      </div>
    `;
  }

  /**
   * Render recent activity
   */
  renderRecentActivity() {
    const recentEvents = this.state.syncedEvents
      .slice(-3)
      .reverse();

    return `
      <div class="recent-activity">
        <h3>Recent Activity</h3>
        ${recentEvents.length === 0 ? `
          <p class="no-activity">No recent calendar activity</p>
        ` : `
          <div class="activity-list">
            ${recentEvents.map(event => `
              <div class="activity-item">
                <span class="activity-icon">📅</span>
                <div class="activity-details">
                  <div class="activity-title">${event.title}</div>
                  <div class="activity-date">${new Date(event.syncedAt).toLocaleDateString()}</div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  }

  /**
   * Render sync view
   */
  renderSync() {
    this.container.innerHTML = `
      <div class="calendar-module">
        <div class="calendar-nav">
          <button class="nav-btn" id="nav-overview">Overview</button>
          <button class="nav-btn active" id="nav-sync">Event Sync</button>
          <button class="nav-btn" id="nav-meetings">Meetings</button>
          <button class="nav-btn" id="nav-availability">Availability</button>
        </div>

        <div class="calendar-sync">
          <h2>Event Synchronization</h2>

          ${!this.state.isConnected ? `
            <div class="sync-disabled">
              <p>Connect your calendar first to sync events</p>
              <button id="connect-calendar-sync" class="connect-btn">Connect Calendar</button>
            </div>
          ` : `
            <div class="sync-enabled">
              <p>Your calendar is connected. Events will be automatically synced when you save them.</p>

              <div class="synced-events">
                <h3>Synced Events (${this.state.syncedEvents.length})</h3>
                ${this.state.syncedEvents.length === 0 ? `
                  <p class="no-events">No events synced yet</p>
                ` : `
                  <div class="events-list">
                    ${this.state.syncedEvents.map(event => this.renderSyncedEvent(event)).join('')}
                  </div>
                `}
              </div>
            </div>
          `}
        </div>
      </div>
    `;

    this.attachNavigationListeners();
    this.attachSyncListeners();
  }

  /**
   * Render synced event item
   */
  renderSyncedEvent(event) {
    return `
      <div class="synced-event">
        <div class="event-info">
          <h4>${event.title}</h4>
          <p>${new Date(event.start).toLocaleDateString()} • ${event.location || 'No location'}</p>
        </div>
        <div class="sync-status">
          <span class="synced-badge">✓ Synced</span>
        </div>
      </div>
    `;
  }

  /**
   * Render meetings view
   */
  renderMeetings() {
    this.container.innerHTML = `
      <div class="calendar-module">
        <div class="calendar-nav">
          <button class="nav-btn" id="nav-overview">Overview</button>
          <button class="nav-btn" id="nav-sync">Event Sync</button>
          <button class="nav-btn active" id="nav-meetings">Meetings</button>
          <button class="nav-btn" id="nav-availability">Availability</button>
        </div>

        <div class="calendar-meetings">
          <div class="meetings-header">
            <h2>Meetings</h2>
            <button id="schedule-meeting" class="schedule-btn">Schedule Meeting</button>
          </div>

          ${this.state.upcomingMeetings.length === 0 ? `
            <div class="no-meetings">
              <p>No upcoming meetings scheduled</p>
            </div>
          ` : `
            <div class="meetings-list">
              ${this.state.upcomingMeetings.map(meeting => this.renderMeeting(meeting)).join('')}
            </div>
          `}
        </div>
      </div>
    `;

    this.attachNavigationListeners();
    this.attachMeetingListeners();
  }

  /**
   * Render meeting item
   */
  renderMeeting(meeting) {
    const startDate = new Date(meeting.start);
    const isToday = startDate.toDateString() === new Date().toDateString();

    return `
      <div class="meeting-card ${isToday ? 'today' : ''}">
        <div class="meeting-header">
          <h3>${meeting.title}</h3>
          <span class="meeting-type">${meeting.type === 'video_call' ? '📹' : '📍'}</span>
        </div>

        <div class="meeting-details">
          <div class="meeting-time">
            📅 ${startDate.toLocaleDateString()} • ${startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
          <div class="meeting-duration">⏱️ ${meeting.duration} minutes</div>
          ${meeting.attendees?.length ? `
            <div class="meeting-attendees">👥 ${meeting.attendees.join(', ')}</div>
          ` : ''}
        </div>

        <div class="meeting-actions">
          ${meeting.meetingLink ? `
            <a href="${meeting.meetingLink}" target="_blank" class="meeting-link">Join Meeting</a>
          ` : ''}
          ${meeting.location ? `
            <span class="meeting-location">📍 ${meeting.location}</span>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Attach navigation listeners
   */
  attachNavigationListeners() {
    const navButtons = this.container.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.id.replace('nav-', '');
        this.setState({ view });
      });
    });

    // Connect/disconnect calendar
    const connectBtn = this.container.querySelector('#connect-calendar, #connect-calendar-sync');
    if (connectBtn) {
      connectBtn.addEventListener('click', () => this.connectCalendar());
    }

    const disconnectBtn = this.container.querySelector('#disconnect-calendar');
    if (disconnectBtn) {
      disconnectBtn.addEventListener('click', () => this.disconnectCalendar());
    }
  }

  /**
   * Attach sync listeners
   */
  attachSyncListeners() {
    // Additional sync-specific listeners can be added here
  }

  /**
   * Attach meeting listeners
   */
  attachMeetingListeners() {
    const scheduleBtn = this.container.querySelector('#schedule-meeting');
    if (scheduleBtn) {
      scheduleBtn.addEventListener('click', () => {
        // Simple meeting scheduling prompt for demo
        const title = prompt('Meeting title:');
        if (title) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(14, 0, 0, 0);

          this.scheduleMeeting({
            title: title,
            startTime: tomorrow.toISOString(),
            duration: 60,
            type: 'video_call'
          });
        }
      });
    }
  }

  // ============= EVENT HANDLING =============

  /**
   * Register platform event listeners
   */
  registerEventListeners() {
    // Listen for user login
    this.loginHandler = (data) => {
      if (data.user) {
        this.loadUserCalendarSettings(data.user.id);
        this.render();
      }
    };
    platform.on('auth:login', this.loginHandler);

    // Listen for user logout
    this.logoutHandler = () => {
      this.setState({
        isConnected: false,
        connectedAccount: null,
        syncedEvents: [],
        upcomingMeetings: [],
        view: 'overview'
      });
    };
    platform.on('auth:logout', this.logoutHandler);

    // Listen for events to sync
    this.addToCalendarHandler = (data) => {
      if (this.state.isConnected) {
        this.syncEvent(data);
      } else {
        // Prompt to connect calendar first
        if (confirm('Connect your calendar to sync this event?')) {
          this.connectCalendar().then(() => {
            this.syncEvent(data);
          });
        }
      }
    };
    platform.on('events:add-to-calendar', this.addToCalendarHandler);

    // Listen for connection requests to schedule meetings
    this.connectionAcceptedHandler = (data) => {
      console.log('[CalendarModule] Connection accepted, could suggest meeting scheduling');
      // Could automatically suggest scheduling a meeting
    };
    platform.on('matchmaking:connection-accepted', this.connectionAcceptedHandler);
  }

  /**
   * Unregister event listeners
   */
  unregisterEventListeners() {
    if (this.loginHandler) platform.off('auth:login', this.loginHandler);
    if (this.logoutHandler) platform.off('auth:logout', this.logoutHandler);
    if (this.addToCalendarHandler) platform.off('events:add-to-calendar', this.addToCalendarHandler);
    if (this.connectionAcceptedHandler) platform.off('matchmaking:connection-accepted', this.connectionAcceptedHandler);
  }

  // ============= PUBLIC API =============

  /**
   * Check if calendar is connected
   */
  isConnected() {
    return this.state.isConnected;
  }

  /**
   * Get synced events
   */
  getSyncedEvents() {
    return [...this.state.syncedEvents];
  }

  /**
   * Get upcoming meetings
   */
  getUpcomingMeetings() {
    return [...this.state.upcomingMeetings];
  }

  /**
   * Export event as iCal
   */
  exportAsICal(eventData) {
    const icalContent = this.generateICalContent(eventData);
    this.downloadICal(icalContent, `${eventData.title}.ics`);
  }

  /**
   * Generate iCal content
   */
  generateICalContent(eventData) {
    const startDate = this.formatEventDateTime(eventData.date, eventData.time);
    const endDate = this.formatEventDateTime(eventData.date, eventData.time, 2);

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Conference Party App//Calendar Module//EN
BEGIN:VEVENT
UID:${eventData.eventId}@conference-party-app.web.app
DTSTART:${startDate.replace(/[-:]/g, '').replace(/\..+/, '')}Z
DTEND:${endDate.replace(/[-:]/g, '').replace(/\..+/, '')}Z
SUMMARY:${eventData.title}
DESCRIPTION:${eventData.description || ''}
LOCATION:${eventData.location || ''}
END:VEVENT
END:VCALENDAR`;
  }

  /**
   * Download iCal file
   */
  downloadICal(content, filename) {
    const blob = new Blob([content], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Export module
export default CalendarModule;