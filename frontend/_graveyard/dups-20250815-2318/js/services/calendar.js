/**
 * CALENDAR SERVICE
 * Event calendar integration and iCal export functionality
 */

export function downloadICS(ev){
  const dtstart = toICSDate(ev.start || new Date());
  const dtend = toICSDate(ev.end || new Date(Date.now()+60*60*1000));
  const uid = `${ev.id}@pronet`;
  const ics = [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//ProNet//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${escapeICS(ev.title)}`,
    `LOCATION:${escapeICS(ev.venue||'')}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([ics], {type:'text/calendar'});
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href:url, download:`${slug(ev.title)}.ics` });
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function toICSDate(d){
  const pad = n=> String(n).padStart(2,'0');
  const yyyy = d.getUTCFullYear(), mm = pad(d.getUTCMonth()+1), dd = pad(d.getUTCDate());
  const hh = pad(d.getUTCHours()), mi = pad(d.getUTCMinutes()), ss = pad(d.getUTCSeconds());
  return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
}

function escapeICS(s){ return (s||'').replace(/([,;])/g,'\\$1'); }

function slug(s){ return (s||'event').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }

// Legacy class-based calendar service for backward compatibility
class CalendarService {
  constructor() {
    this.savedEvents = [];
    this.subscriptions = [];
    this.initialized = false;
  }

  /**
   * Initialize calendar service
   */
  async init() {
    if (this.initialized) return;

    try {
      await this.loadSavedEvents();
      this.initialized = true;
      console.log('✅ Calendar service initialized');
    } catch (error) {
      console.error('Calendar service initialization failed:', error);
    }
  }

  /**
   * Load saved events from storage
   */
  async loadSavedEvents() {
    try {
      // Load from localStorage
      const cached = localStorage.getItem('calendar.savedEvents');
      if (cached) {
        this.savedEvents = JSON.parse(cached);
      }

      // Sync with server if available
      const response = await fetch('/api/calendar/saved-events');
      if (response.ok) {
        const serverEvents = await response.json();
        this.savedEvents = serverEvents;
        this.cacheSavedEvents();
      }
    } catch (error) {
      console.warn('Failed to load saved events:', error);
    }
  }

  /**
   * Cache saved events locally
   */
  cacheSavedEvents() {
    localStorage.setItem('calendar.savedEvents', JSON.stringify(this.savedEvents));
  }

  /**
   * Add event to user's calendar
   */
  async addEvent(eventData) {
    try {
      const calendarEvent = this.formatEventForCalendar(eventData);
      
      // Save to server
      const response = await fetch('/api/calendar/add-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calendarEvent)
      });

      if (response.ok) {
        // Add to local saved events
        this.savedEvents.push({
          id: calendarEvent.id,
          originalEventId: eventData.id,
          addedAt: new Date().toISOString(),
          ...calendarEvent
        });
        
        this.cacheSavedEvents();
        this.notifySubscribers('event_added', calendarEvent);
        
        return { success: true, eventId: calendarEvent.id };
      } else {
        throw new Error('Failed to add event to calendar');
      }
    } catch (error) {
      console.error('Failed to add event:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove event from calendar
   */
  async removeEvent(eventId) {
    try {
      const response = await fetch(`/api/calendar/remove-event/${eventId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Remove from local saved events
        this.savedEvents = this.savedEvents.filter(event => event.id !== eventId);
        this.cacheSavedEvents();
        this.notifySubscribers('event_removed', { eventId });
        
        return { success: true };
      } else {
        throw new Error('Failed to remove event from calendar');
      }
    } catch (error) {
      console.error('Failed to remove event:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Format event data for calendar
   */
  formatEventForCalendar(eventData) {
    const startDate = this.parseEventDateTime(eventData);
    const endDate = this.calculateEndTime(startDate, eventData.duration);

    return {
      id: `pronet-event-${eventData.id}`,
      title: eventData.name || eventData['Event Name'] || 'Gamescom Event',
      description: this.formatDescription(eventData),
      location: eventData.venue || eventData.Address || eventData.address || 'Koelnmesse, Cologne',
      startDate: startDate,
      endDate: endDate,
      allDay: false,
      category: eventData.category || 'networking',
      url: `${window.location.origin}/#/events/${eventData.id}`,
      organizer: eventData.hosts || eventData.creator || 'Gamescom 2025',
      attendees: [],
      reminders: [
        { method: 'popup', minutes: 30 },
        { method: 'popup', minutes: 10 }
      ]
    };
  }

  /**
   * Parse event date and time
   */
  parseEventDateTime(eventData) {
    const dateStr = eventData.date || eventData.Date;
    const timeStr = eventData.startTime || eventData['Start Time'] || '20:00';
    
    if (!dateStr) {
      // Default to today if no date specified
      const today = new Date();
      return new Date(today.getFullYear(), today.getMonth(), today.getDate(), 20, 0);
    }

    try {
      const date = new Date(dateStr);
      const [hours, minutes] = timeStr.split(':').map(num => parseInt(num) || 0);
      
      date.setHours(hours, minutes, 0, 0);
      return date;
    } catch (error) {
      console.warn('Failed to parse event date/time:', error);
      return new Date(); // Fallback to now
    }
  }

  /**
   * Calculate event end time
   */
  calculateEndTime(startDate, duration) {
    const endDate = new Date(startDate);
    
    if (duration && typeof duration === 'number') {
      // Duration in minutes
      endDate.setMinutes(endDate.getMinutes() + duration);
    } else if (duration && typeof duration === 'string') {
      // Parse duration string (e.g., "2h", "90min")
      const match = duration.match(/(\d+)(h|min|hour|minute)/i);
      if (match) {
        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        
        if (unit.startsWith('h')) {
          endDate.setHours(endDate.getHours() + value);
        } else {
          endDate.setMinutes(endDate.getMinutes() + value);
        }
      } else {
        // Default to 2 hours
        endDate.setHours(endDate.getHours() + 2);
      }
    } else {
      // Default to 2 hours for networking events
      endDate.setHours(endDate.getHours() + 2);
    }
    
    return endDate;
  }

  /**
   * Format event description for calendar
   */
  formatDescription(eventData) {
    let description = eventData.description || '';
    
    // Add event details
    const details = [];
    
    if (eventData.category) {
      details.push(`Category: ${eventData.category}`);
    }
    
    if (eventData.hosts) {
      details.push(`Hosted by: ${eventData.hosts}`);
    }
    
    if (eventData.capacity) {
      details.push(`Capacity: ${eventData.capacity}`);
    }
    
    if (eventData.isUGC) {
      details.push('Community Event');
    }
    
    // Add Gamescom context
    details.push('Part of Gamescom 2025');
    details.push('Added via ProNet - Professional Intelligence Platform');
    
    if (description) {
      description += '\n\n';
    }
    
    description += details.join('\n');
    
    return description;
  }

  /**
   * Generate iCal content for event
   */
  generateICSContent(eventData) {
    const calEvent = this.formatEventForCalendar(eventData);
    
    const formatDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    const escapeText = (text) => {
      return text.replace(/[,;\\]/g, '\\$&').replace(/\n/g, '\\n');
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ProNet//Professional Intelligence Platform//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${calEvent.id}@pronet.gamescom`,
      `DTSTART:${formatDate(calEvent.startDate)}`,
      `DTEND:${formatDate(calEvent.endDate)}`,
      `SUMMARY:${escapeText(calEvent.title)}`,
      `DESCRIPTION:${escapeText(calEvent.description)}`,
      `LOCATION:${escapeText(calEvent.location)}`,
      `ORGANIZER;CN=${calEvent.organizer}:mailto:noreply@pronet.gamescom`,
      `URL:${calEvent.url}`,
      `CATEGORIES:${calEvent.category.toUpperCase()}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'BEGIN:VALARM',
      'TRIGGER:-PT30M',
      'DESCRIPTION:Event reminder',
      'ACTION:DISPLAY',
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-PT10M',
      'DESCRIPTION:Event starting soon',
      'ACTION:DISPLAY',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    return icsContent;
  }

  /**
   * Generate calendar URL for different platforms
   */
  generateCalendarUrl(eventData, platform = 'google') {
    const calEvent = this.formatEventForCalendar(eventData);
    
    const formatDateForUrl = (date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z');
    };

    const startDate = formatDateForUrl(calEvent.startDate);
    const endDate = formatDateForUrl(calEvent.endDate);

    switch (platform) {
      case 'google':
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(calEvent.title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(calEvent.description)}&location=${encodeURIComponent(calEvent.location)}`;

      case 'outlook':
        return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(calEvent.title)}&startdt=${startDate}&enddt=${endDate}&body=${encodeURIComponent(calEvent.description)}&location=${encodeURIComponent(calEvent.location)}`;

      case 'yahoo':
        return `https://calendar.yahoo.com/?v=60&view=d&type=20&title=${encodeURIComponent(calEvent.title)}&st=${startDate}&dur=${Math.ceil((calEvent.endDate - calEvent.startDate) / (60 * 60 * 1000))}00&desc=${encodeURIComponent(calEvent.description)}&in_loc=${encodeURIComponent(calEvent.location)}`;

      default:
        return this.generateICSDataUrl(eventData);
    }
  }

  /**
   * Generate ICS data URL for download
   */
  generateICSDataUrl(eventData) {
    const icsContent = this.generateICSContent(eventData);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    return URL.createObjectURL(blob);
  }

  /**
   * Download ICS file
   */
  downloadICSFile(eventData) {
    const url = this.generateICSDataUrl(eventData);
    const filename = `${eventData.name || 'event'}.ics`.replace(/[^a-z0-9.-]/gi, '_');
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /**
   * Get all user's saved events
   */
  getSavedEvents() {
    return [...this.savedEvents];
  }

  /**
   * Check if event is saved
   */
  isEventSaved(eventId) {
    return this.savedEvents.some(event => event.originalEventId === eventId);
  }

  /**
   * Get events for a specific date range
   */
  getEventsInRange(startDate, endDate) {
    return this.savedEvents.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate >= startDate && eventDate <= endDate;
    });
  }

  /**
   * Get today's events
   */
  getTodaysEvents() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    return this.getEventsInRange(startOfDay, endOfDay);
  }

  /**
   * Get upcoming events (next 7 days)
   */
  getUpcomingEvents() {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    
    return this.getEventsInRange(now, nextWeek);
  }

  /**
   * Export all calendar data
   */
  async exportAllEvents() {
    try {
      // Create multi-event ICS file
      const events = this.savedEvents.map(event => this.generateICSContent(event));
      
      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//ProNet//Professional Intelligence Platform//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        ...events.map(content => 
          content.split('\n').slice(4, -1).join('\n') // Remove individual calendar headers
        ),
        'END:VCALENDAR'
      ].join('\r\n');

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'pronet-gamescom-events.ics';
      link.click();
      
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to export events:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Subscribe to calendar events
   */
  subscribe(callback) {
    this.subscriptions.push(callback);
    
    return () => {
      const index = this.subscriptions.indexOf(callback);
      if (index > -1) {
        this.subscriptions.splice(index, 1);
      }
    };
  }

  /**
   * Notify subscribers
   */
  notifySubscribers(event, data) {
    this.subscriptions.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Calendar subscriber error:', error);
      }
    });
  }

  /**
   * Get calendar statistics
   */
  getStats() {
    const now = new Date();
    const thisMonth = this.savedEvents.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate.getMonth() === now.getMonth() && 
             eventDate.getFullYear() === now.getFullYear();
    });

    return {
      totalSaved: this.savedEvents.length,
      thisMonth: thisMonth.length,
      upcoming: this.getUpcomingEvents().length,
      today: this.getTodaysEvents().length
    };
  }

  /**
   * Clear all calendar data
   */
  clearData() {
    this.savedEvents = [];
    localStorage.removeItem('calendar.savedEvents');
  }

  /**
   * Destroy calendar service
   */
  destroy() {
    this.clearData();
    this.subscriptions = [];
    this.initialized = false;
    console.log('🗑️ Calendar service destroyed');
  }
}

// Create singleton instance
export const calendar = new CalendarService();

// Export class for testing
export default CalendarService;