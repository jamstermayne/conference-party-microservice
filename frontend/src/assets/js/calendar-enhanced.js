/**
 * Enhanced Calendar Integration System
 * ===================================
 * Seamless calendar integration with preview, conflict detection, and multi-platform support
 */

class CalendarIntegration {
  constructor() {
    this.modal = null;
    this.currentEvent = null;
    this.userCalendarEvents = this.loadUserEvents();
    this.reminderSettings = this.loadReminderSettings();
  }

  initialize() {
    this.createModal();
    this.bindEvents();
  }

  createModal() {
    if (this.modal) return;

    this.modal = document.createElement('div');
    this.modal.className = 'calendar-modal';
    this.modal.innerHTML = `
      <div class="calendar-modal-content">
        <header class="calendar-modal-header">
          <h2 class="calendar-modal-title">Add to Calendar</h2>
          <button class="calendar-modal-close" aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </header>
        <div class="calendar-modal-body"></div>
      </div>
    `;

    document.body.appendChild(this.modal);
  }

  bindEvents() {
    // Close modal events
    this.modal.querySelector('.calendar-modal-close').addEventListener('click', () => {
      this.close();
    });

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    // Keyboard events
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });
  }

  async show(event) {
    this.currentEvent = this.normalizeEvent(event);
    await this.renderModalContent();
    this.modal.classList.add('active');
    
    // Focus management for accessibility
    setTimeout(() => {
      const firstFocusable = this.modal.querySelector('button, a, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) firstFocusable.focus();
    }, 100);
  }

  close() {
    this.modal.classList.remove('active');
    this.currentEvent = null;
  }

  isOpen() {
    return this.modal.classList.contains('active');
  }

  normalizeEvent(event) {
    // Parse date and time
    const startDate = new Date(event.date || event.start || Date.now());
    const endDate = event.end ? new Date(event.end) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours

    return {
      id: event.id || `event-${Date.now()}`,
      title: event.title || 'Party',
      description: event.description || '',
      venue: event.venue || '',
      start: startDate,
      end: endDate,
      url: event.url || '',
      price: event.price || '',
      lat: event.lat || null,
      lng: event.lng || null
    };
  }

  async renderModalContent() {
    const modalBody = this.modal.querySelector('.calendar-modal-body');
    const conflicts = await this.detectConflicts(this.currentEvent);
    
    modalBody.innerHTML = `
      ${this.renderEventPreview()}
      ${conflicts.length > 0 ? this.renderConflicts(conflicts) : ''}
      ${this.renderReminderOptions()}
      ${this.renderPlatformOptions()}
      ${this.renderQuickActions()}
    `;

    this.bindModalEvents();
  }

  renderEventPreview() {
    const event = this.currentEvent;
    const formatTime = (date) => date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    const formatDate = (date) => date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    });

    return `
      <div class="calendar-event-preview">
        <div class="event-preview-header">
          <div class="event-preview-icon">🎉</div>
          <div class="event-preview-details">
            <h3 class="event-preview-title">${event.title}</h3>
            ${event.venue ? `<p class="event-preview-venue">📍 ${event.venue}</p>` : ''}
            <div class="event-preview-datetime">
              <div class="event-datetime-row">
                <svg class="event-datetime-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                </svg>
                <span>${formatDate(event.start)}</span>
              </div>
              <div class="event-datetime-row">
                <svg class="event-datetime-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                </svg>
                <span>${formatTime(event.start)} - ${formatTime(event.end)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderConflicts(conflicts) {
    return `
      <div class="calendar-conflicts">
        <div class="conflict-warning">
          <svg class="conflict-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <div class="conflict-content">
            <div class="conflict-title">Schedule Conflict Detected</div>
            <div class="conflict-description">
              This event overlaps with ${conflicts.length} existing ${conflicts.length === 1 ? 'event' : 'events'} in your calendar.
            </div>
            <div class="conflict-events">
              ${conflicts.map(conflict => `
                <div class="conflict-event">
                  <span class="conflict-event-name">${conflict.title}</span>
                  <span class="conflict-event-time">${conflict.timeRange}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderReminderOptions() {
    const defaultReminders = [
      { id: '15min', label: '15 minutes before', minutes: 15 },
      { id: '1hour', label: '1 hour before', minutes: 60 },
      { id: '1day', label: '1 day before', minutes: 1440 }
    ];

    return `
      <div class="reminder-options">
        <div class="reminder-title">Set Reminders</div>
        <div class="reminder-checkboxes">
          ${defaultReminders.map(reminder => `
            <label class="reminder-option">
              <input 
                type="checkbox" 
                class="reminder-checkbox" 
                data-minutes="${reminder.minutes}"
                ${this.reminderSettings.includes(reminder.minutes) ? 'checked' : ''}
              >
              <span class="reminder-label">${reminder.label}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderPlatformOptions() {
    return `
      <div class="calendar-platforms">
        <h3 class="calendar-platforms-title">Choose Calendar Platform</h3>
        <div class="platform-grid">
          <a href="#" class="platform-option platform-google" data-platform="google">
            <div class="platform-icon">📅</div>
            <div class="platform-details">
              <div class="platform-name">Google Calendar</div>
              <div class="platform-description">Add to your Google Calendar</div>
            </div>
          </a>
          
          <a href="#" class="platform-option platform-apple" data-platform="apple">
            <div class="platform-icon">🍎</div>
            <div class="platform-details">
              <div class="platform-name">Apple Calendar</div>
              <div class="platform-description">Works with iPhone, iPad, Mac</div>
            </div>
          </a>
          
          <a href="#" class="platform-option platform-outlook" data-platform="outlook">
            <div class="platform-icon">📧</div>
            <div class="platform-details">
              <div class="platform-name">Outlook</div>
              <div class="platform-description">Microsoft Outlook Calendar</div>
            </div>
          </a>
          
          <a href="#" class="platform-option platform-ics" data-platform="ics">
            <div class="platform-icon">📋</div>
            <div class="platform-details">
              <div class="platform-name">Download ICS</div>
              <div class="platform-description">Universal calendar file</div>
            </div>
          </a>
        </div>
      </div>
    `;
  }

  renderQuickActions() {
    return `
      <div class="calendar-quick-actions">
        <button class="quick-action quick-action--secondary" data-action="cancel">
          Cancel
        </button>
        <button class="quick-action" data-action="add-anyway">
          Add to Calendar
        </button>
      </div>
    `;
  }

  bindModalEvents() {
    // Platform selection
    this.modal.querySelectorAll('.platform-option').forEach(option => {
      option.addEventListener('click', (e) => {
        e.preventDefault();
        const platform = option.dataset.platform;
        this.addToCalendar(platform);
      });
    });

    // Quick actions
    this.modal.querySelectorAll('[data-action]').forEach(button => {
      button.addEventListener('click', (e) => {
        const action = button.dataset.action;
        if (action === 'cancel') {
          this.close();
        } else if (action === 'add-anyway') {
          this.addToCalendar('google'); // Default platform
        }
      });
    });

    // Reminder settings
    this.modal.querySelectorAll('.reminder-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const minutes = parseInt(e.target.dataset.minutes);
        if (e.target.checked) {
          if (!this.reminderSettings.includes(minutes)) {
            this.reminderSettings.push(minutes);
          }
        } else {
          this.reminderSettings = this.reminderSettings.filter(m => m !== minutes);
        }
        this.saveReminderSettings();
      });
    });
  }

  async addToCalendar(platform) {
    try {
      this.showLoading();
      
      // Save event to user's local calendar data
      this.saveUserEvent(this.currentEvent);
      
      const calendarUrl = this.generateCalendarUrl(platform, this.currentEvent);
      
      if (platform === 'ics') {
        this.downloadICSFile(this.currentEvent);
      } else {
        window.open(calendarUrl, '_blank');
      }
      
      await this.showSuccess(platform);
      
    } catch (error) {
      console.error('Failed to add to calendar:', error);
      this.showError('Failed to add event to calendar. Please try again.');
    }
  }

  generateCalendarUrl(platform, event) {
    const startTime = this.formatDateTime(event.start);
    const endTime = this.formatDateTime(event.end);
    const title = encodeURIComponent(event.title);
    const description = encodeURIComponent(this.buildDescription(event));
    const location = encodeURIComponent(event.venue || '');

    switch (platform) {
      case 'google':
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${description}&location=${location}`;
      
      case 'outlook':
        return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${event.start.toISOString()}&enddt=${event.end.toISOString()}&body=${description}&location=${location}`;
      
      case 'apple':
        // Apple Calendar uses webcal:// protocol but we'll fallback to ICS download
        return this.generateICSData(event);
        
      default:
        return this.generateICSData(event);
    }
  }

  generateICSData(event) {
    const startTime = this.formatDateTime(event.start);
    const endTime = this.formatDateTime(event.end);
    const timestamp = this.formatDateTime(new Date());
    const uid = `${event.id}@conference-party-app.web.app`;

    // Build reminders
    const reminders = this.reminderSettings.map(minutes => {
      return `BEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:${event.title}\r\nTRIGGER:-PT${minutes}M\r\nEND:VALARM\r\n`;
    }).join('');

    return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Conference Party App//EN\r\nBEGIN:VEVENT\r\nUID:${uid}\r\nDTSTAMP:${timestamp}\r\nDTSTART:${startTime}\r\nDTEND:${endTime}\r\nSUMMARY:${event.title}\r\nDESCRIPTION:${this.buildDescription(event)}\r\nLOCATION:${event.venue || ''}\r\n${reminders}END:VEVENT\r\nEND:VCALENDAR`;
  }

  downloadICSFile(event) {
    const icsData = this.generateICSData(event);
    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/[^a-zA-Z0-9]/g, '-')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  formatDateTime(date) {
    // Format for ICS: YYYYMMDDTHHMMSSZ
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  buildDescription(event) {
    let description = event.description || '';
    
    if (event.venue) {
      description += `\\n\\nVenue: ${event.venue}`;
    }
    
    if (event.price) {
      description += `\\n\\nPrice: ${event.price}`;
    }
    
    if (event.url) {
      description += `\\n\\nMore info: ${event.url}`;
    }
    
    description += `\\n\\nAdded via Conference Party App`;
    
    return description;
  }

  async detectConflicts(event) {
    const conflicts = [];
    const eventStart = event.start.getTime();
    const eventEnd = event.end.getTime();

    this.userCalendarEvents.forEach(existingEvent => {
      const existingStart = new Date(existingEvent.start).getTime();
      const existingEnd = new Date(existingEvent.end).getTime();

      // Check for overlap
      if ((eventStart < existingEnd) && (eventEnd > existingStart)) {
        conflicts.push({
          ...existingEvent,
          timeRange: `${new Date(existingEvent.start).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          })} - ${new Date(existingEvent.end).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          })}`
        });
      }
    });

    return conflicts;
  }

  showLoading() {
    const modalBody = this.modal.querySelector('.calendar-modal-body');
    modalBody.innerHTML = `
      <div class="calendar-loading">
        <div class="calendar-loading-spinner"></div>
        <span>Adding to calendar...</span>
      </div>
    `;
  }

  async showSuccess(platform) {
    const modalBody = this.modal.querySelector('.calendar-modal-body');
    const platformNames = {
      google: 'Google Calendar',
      apple: 'Apple Calendar',
      outlook: 'Outlook',
      ics: 'your calendar app'
    };

    modalBody.innerHTML = `
      <div class="calendar-success">
        <div class="success-icon">✓</div>
        <div class="success-title">Successfully Added!</div>
        <div class="success-description">
          Your event has been added to ${platformNames[platform] || 'your calendar'}. 
          ${this.reminderSettings.length > 0 ? `You'll receive ${this.reminderSettings.length} reminder${this.reminderSettings.length === 1 ? '' : 's'}.` : ''}
        </div>
      </div>
      <div class="calendar-quick-actions">
        <button class="quick-action" data-action="close">Done</button>
      </div>
    `;

    // Bind close action
    modalBody.querySelector('[data-action="close"]').addEventListener('click', () => {
      this.close();
    });

    // Auto-close after 3 seconds
    setTimeout(() => {
      if (this.isOpen()) this.close();
    }, 3000);
  }

  showError(message) {
    const modalBody = this.modal.querySelector('.calendar-modal-body');
    modalBody.innerHTML = `
      <div class="calendar-error">
        <div class="error-icon">✕</div>
        <div class="error-title">Error</div>
        <div class="error-description">${message}</div>
      </div>
      <div class="calendar-quick-actions">
        <button class="quick-action quick-action--secondary" data-action="close">Close</button>
        <button class="quick-action" data-action="retry">Try Again</button>
      </div>
    `;

    // Bind actions
    modalBody.querySelector('[data-action="close"]').addEventListener('click', () => {
      this.close();
    });
    
    modalBody.querySelector('[data-action="retry"]').addEventListener('click', () => {
      this.renderModalContent();
    });
  }

  saveUserEvent(event) {
    if (!this.userCalendarEvents.find(e => e.id === event.id)) {
      this.userCalendarEvents.push({
        id: event.id,
        title: event.title,
        start: event.start.toISOString(),
        end: event.end.toISOString(),
        venue: event.venue
      });
      this.saveUserEvents();
    }
  }

  loadUserEvents() {
    try {
      return JSON.parse(localStorage.getItem('user-calendar-events') || '[]');
    } catch {
      return [];
    }
  }

  saveUserEvents() {
    localStorage.setItem('user-calendar-events', JSON.stringify(this.userCalendarEvents));
  }

  loadReminderSettings() {
    try {
      return JSON.parse(localStorage.getItem('calendar-reminder-settings') || '[15, 60]');
    } catch {
      return [15, 60]; // Default: 15 minutes and 1 hour
    }
  }

  saveReminderSettings() {
    localStorage.setItem('calendar-reminder-settings', JSON.stringify(this.reminderSettings));
  }

  // Public API for checking if event is already saved
  isEventSaved(eventId) {
    return this.userCalendarEvents.some(e => e.id === eventId);
  }

  // Public API for getting user's saved events
  getUserEvents() {
    return [...this.userCalendarEvents];
  }
}

// Export for use
export { CalendarIntegration };