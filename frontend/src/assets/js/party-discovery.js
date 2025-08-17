/**
 * Party Discovery System Integration
 * =================================
 * Main controller that integrates search, calendar, and map functionality
 */

import { PartySearchEngine, PartySearchUI } from './party-search.js';
import { CalendarIntegration } from './calendar-enhanced.js';
import { MapDiscovery } from './map-discovery.js';
import { cardFor } from './cards-lite.js';

class PartyDiscoverySystem {
  constructor() {
    this.searchEngine = null;
    this.searchUI = null;
    this.calendar = null;
    this.map = null;
    this.container = null;
    this.currentEvents = [];
    this.currentView = 'search'; // 'search', 'map', 'schedule'
    this.savedEvents = new Set();
  }

  async initialize(container) {
    this.container = container;
    
    // Initialize API if available
    if (window.apiIntegration) {
      console.log('[PartyDiscovery] Using API integration');
      this.api = window.apiIntegration;
    }
    
    // Initialize components
    this.searchEngine = new PartySearchEngine();
    this.calendar = new CalendarIntegration();
    
    // Load data from API or fallback to local
    try {
      if (this.api) {
        const apiEvents = await this.api.getParties();
        if (apiEvents.length > 0) {
          this.searchEngine.parties = apiEvents;
          this.currentEvents = apiEvents;
          console.log('[PartyDiscovery] Loaded', apiEvents.length, 'events from API');
        } else {
          throw new Error('No events from API');
        }
      } else {
        throw new Error('API not available');
      }
    } catch (error) {
      console.log('[PartyDiscovery] Falling back to local data:', error.message);
      const initialized = await this.searchEngine.initialize();
      if (!initialized) {
        this.showError('Failed to load party data');
        return false;
      }
      this.currentEvents = this.searchEngine.parties;
    }
    
    // Render main interface
    this.render();
    
    // Initialize components
    this.initializeSearch();
    this.calendar.initialize();
    
    // Bind events
    this.bindEvents();
    
    return true;
  }

  render() {
    this.container.innerHTML = `
      <div class="party-discovery-system">
        <!-- Main Navigation -->
        <nav class="discovery-nav">
          <button class="nav-tab active" data-view="search">
            <svg class="nav-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" />
            </svg>
            <span>Search & Filter</span>
          </button>
          <button class="nav-tab" data-view="map">
            <svg class="nav-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
            </svg>
            <span>Map View</span>
          </button>
          <button class="nav-tab" data-view="schedule">
            <svg class="nav-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
            </svg>
            <span>My Schedule</span>
          </button>
        </nav>

        <!-- Content Areas -->
        <div class="discovery-content">
          <!-- Search View -->
          <div class="discovery-view discovery-view--search active" data-view="search">
            <div class="search-container"></div>
            <div class="results-container">
              <div class="results-grid"></div>
            </div>
          </div>

          <!-- Map View -->
          <div class="discovery-view discovery-view--map" data-view="map">
            <div class="map-container"></div>
          </div>

          <!-- Schedule View -->
          <div class="discovery-view discovery-view--schedule" data-view="schedule">
            <div class="schedule-header">
              <h2>My Event Schedule</h2>
              <div class="schedule-stats">
                <span class="stat">
                  <span class="stat-number">0</span>
                  <span class="stat-label">Events</span>
                </span>
                <span class="stat">
                  <span class="stat-number">0</span>
                  <span class="stat-label">Days</span>
                </span>
              </div>
            </div>
            <div class="schedule-timeline"></div>
          </div>
        </div>

        <!-- Floating Action Button -->
        <button class="fab-toggle" title="Quick Actions">
          <svg class="fab-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
        </button>

        <!-- Quick Actions Menu -->
        <div class="fab-menu" style="display: none;">
          <button class="fab-action" data-action="export-schedule">
            <svg class="fab-action-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
            <span>Export Calendar</span>
          </button>
          <button class="fab-action" data-action="share-schedule">
            <svg class="fab-action-icon" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
            <span>Share</span>
          </button>
          <button class="fab-action" data-action="clear-schedule">
            <svg class="fab-action-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clip-rule="evenodd" />
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <span>Clear All</span>
          </button>
        </div>
      </div>
    `;
  }

  initializeSearch() {
    const searchContainer = this.container.querySelector('.search-container');
    this.searchUI = new PartySearchUI(this.searchEngine);
    this.searchUI.render(searchContainer);
    
    // Listen for search results
    this.searchUI.onResults((results) => {
      this.updateResults(results.results);
    });
    
    // Show initial results
    this.updateResults(this.currentEvents);
  }

  async initializeMap() {
    if (this.map) return;
    
    const mapContainer = this.container.querySelector('.discovery-view--map .map-container');
    this.map = new MapDiscovery();
    
    try {
      await this.map.initialize(mapContainer, this.currentEvents);
      
      // Listen for venue selection
      mapContainer.addEventListener('venue-selected', (e) => {
        this.showVenueEvents(e.detail.venue, e.detail.events);
      });
      
    } catch (error) {
      console.error('Failed to initialize map:', error);
      mapContainer.innerHTML = `
        <div class="map-error">
          <h3>Map unavailable</h3>
          <p>Unable to load map. Please check your internet connection.</p>
        </div>
      `;
    }
  }

  updateResults(events) {
    this.currentEvents = events;
    const resultsGrid = this.container.querySelector('.results-grid');
    
    if (events.length === 0) {
      resultsGrid.innerHTML = `
        <div class="search-empty">
          <div class="search-empty-icon">🔍</div>
          <div class="search-empty-title">No events found</div>
          <div class="search-empty-subtitle">Try adjusting your search or filters</div>
        </div>
      `;
      return;
    }
    
    resultsGrid.innerHTML = `
      <div class="card-modern-grid">
        ${events.map(event => this.createEventCard(event)).join('')}
      </div>
    `;
    
    this.bindCardEvents();
    
    // Update map if initialized
    if (this.map) {
      this.map.updateEvents(events);
    }
  }

  createEventCard(event) {
    const isBookmarked = this.savedEvents.has(event.id);
    const cardElement = cardFor(event);
    
    // Add bookmark button and enhanced actions
    const actionsHtml = `
      <footer class="card-modern__footer">
        <button class="card-modern__action card-modern__action--secondary" 
                data-action="bookmark" data-event-id="${event.id}"
                aria-label="${isBookmarked ? 'Remove from' : 'Add to'} schedule">
          <svg class="bookmark-icon" width="16" height="16" viewBox="0 0 20 20" fill="${isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 19V5z" />
          </svg>
          ${isBookmarked ? 'Saved' : 'Save'}
        </button>
        <button class="card-modern__action card-modern__action--primary" 
                data-action="add-calendar" data-event-id="${event.id}">
          Add to Calendar
        </button>
      </footer>
    `;
    
    // Replace the existing footer
    const existingFooter = cardElement.querySelector('.card-modern__footer');
    if (existingFooter) {
      existingFooter.outerHTML = actionsHtml;
    }
    
    return cardElement.outerHTML;
  }

  bindCardEvents() {
    // Bookmark events
    this.container.querySelectorAll('[data-action="bookmark"]').forEach(button => {
      button.addEventListener('click', (e) => {
        const eventId = button.dataset.eventId;
        this.toggleBookmark(eventId, button);
      });
    });
    
    // Calendar events
    this.container.querySelectorAll('[data-action="add-calendar"]').forEach(button => {
      button.addEventListener('click', (e) => {
        const eventId = button.dataset.eventId;
        const event = this.currentEvents.find(e => e.id === eventId);
        if (event) {
          this.calendar.show(event);
        }
      });
    });
  }

  toggleBookmark(eventId, buttonElement) {
    const event = this.currentEvents.find(e => e.id === eventId);
    if (!event) return;
    
    const isBookmarked = this.savedEvents.has(eventId);
    
    if (isBookmarked) {
      this.savedEvents.delete(eventId);
      buttonElement.innerHTML = `
        <svg class="bookmark-icon" width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 19V5z" />
        </svg>
        Save
      `;
      buttonElement.setAttribute('aria-label', 'Add to schedule');
    } else {
      this.savedEvents.add(eventId);
      buttonElement.innerHTML = `
        <svg class="bookmark-icon" width="16" height="16" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 19V5z" />
        </svg>
        Saved
      `;
      buttonElement.setAttribute('aria-label', 'Remove from schedule');
    }
    
    this.saveSavedEvents();
    this.updateScheduleStats();
    
    // Show toast notification
    this.showToast(isBookmarked ? 'Removed from schedule' : 'Added to schedule');
  }

  showVenueEvents(venue, events) {
    // Switch to search view and filter by venue
    this.switchView('search');
    
    // Apply venue filter
    setTimeout(() => {
      this.searchUI.searchInput.value = venue.name;
      this.searchUI.handleSearchInput(venue.name);
    }, 100);
  }

  switchView(viewName) {
    this.currentView = viewName;
    
    // Update navigation
    this.container.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.view === viewName);
    });
    
    // Update content areas
    this.container.querySelectorAll('.discovery-view').forEach(view => {
      view.classList.toggle('active', view.dataset.view === viewName);
    });
    
    // Initialize view-specific components
    if (viewName === 'map' && !this.map) {
      this.initializeMap();
    } else if (viewName === 'schedule') {
      this.updateScheduleView();
    }
  }

  updateScheduleView() {
    const savedEvents = Array.from(this.savedEvents)
      .map(id => this.searchEngine.parties.find(e => e.id === id))
      .filter(Boolean)
      .sort((a, b) => new Date(a.date || a.start) - new Date(b.date || b.start));
    
    const scheduleTimeline = this.container.querySelector('.schedule-timeline');
    
    if (savedEvents.length === 0) {
      scheduleTimeline.innerHTML = `
        <div class="schedule-empty">
          <div class="schedule-empty-icon">📅</div>
          <div class="schedule-empty-title">No events in your schedule</div>
          <div class="schedule-empty-subtitle">Start by saving events you're interested in</div>
          <button class="schedule-empty-action" data-action="browse-events">
            Browse Events
          </button>
        </div>
      `;
      
      this.container.querySelector('[data-action="browse-events"]')?.addEventListener('click', () => {
        this.switchView('search');
      });
      
      return;
    }
    
    // Group events by date
    const eventsByDate = this.groupEventsByDate(savedEvents);
    
    scheduleTimeline.innerHTML = Object.entries(eventsByDate)
      .map(([date, events]) => this.createDateGroup(date, events))
      .join('');
    
    this.bindScheduleEvents();
  }

  groupEventsByDate(events) {
    const groups = {};
    
    events.forEach(event => {
      const date = (event.date || event.start || '').split('T')[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(event);
    });
    
    return groups;
  }

  createDateGroup(date, events) {
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    return `
      <div class="schedule-day">
        <div class="schedule-day-header">
          <h3 class="schedule-date">${formattedDate}</h3>
          <span class="schedule-count">${events.length} event${events.length === 1 ? '' : 's'}</span>
        </div>
        <div class="schedule-events">
          ${events.map(event => this.createScheduleEvent(event)).join('')}
        </div>
      </div>
    `;
  }

  createScheduleEvent(event) {
    const time = event.start || event.time || '';
    const timeFormatted = time ? new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) : '';
    
    return `
      <div class="schedule-event" data-event-id="${event.id}">
        <div class="schedule-event-time">${timeFormatted}</div>
        <div class="schedule-event-content">
          <h4 class="schedule-event-title">${event.title}</h4>
          <p class="schedule-event-venue">${event.venue || ''}</p>
          <div class="schedule-event-actions">
            <button class="schedule-action" data-action="view-details">Details</button>
            <button class="schedule-action" data-action="remove">Remove</button>
          </div>
        </div>
      </div>
    `;
  }

  bindScheduleEvents() {
    this.container.querySelectorAll('[data-action="view-details"]').forEach(button => {
      button.addEventListener('click', (e) => {
        const eventId = button.closest('.schedule-event').dataset.eventId;
        this.showEventDetails(eventId);
      });
    });
    
    this.container.querySelectorAll('[data-action="remove"]').forEach(button => {
      button.addEventListener('click', (e) => {
        const eventId = button.closest('.schedule-event').dataset.eventId;
        this.toggleBookmark(eventId, button);
        this.updateScheduleView();
      });
    });
  }

  showEventDetails(eventId) {
    const event = this.searchEngine.parties.find(e => e.id === eventId);
    if (event) {
      this.calendar.show(event);
    }
  }

  updateScheduleStats() {
    const savedEvents = Array.from(this.savedEvents)
      .map(id => this.searchEngine.parties.find(e => e.id === id))
      .filter(Boolean);
    
    const uniqueDates = new Set(savedEvents.map(e => (e.date || e.start || '').split('T')[0]));
    
    const statsNumbers = this.container.querySelectorAll('.stat-number');
    if (statsNumbers[0]) statsNumbers[0].textContent = savedEvents.length;
    if (statsNumbers[1]) statsNumbers[1].textContent = uniqueDates.size;
  }

  bindEvents() {
    // Navigation
    this.container.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchView(tab.dataset.view);
      });
    });
    
    // FAB Menu
    const fabToggle = this.container.querySelector('.fab-toggle');
    const fabMenu = this.container.querySelector('.fab-menu');
    
    fabToggle.addEventListener('click', () => {
      const isVisible = fabMenu.style.display !== 'none';
      fabMenu.style.display = isVisible ? 'none' : 'block';
    });
    
    // FAB Actions
    this.container.querySelectorAll('.fab-action').forEach(action => {
      action.addEventListener('click', (e) => {
        const actionType = action.dataset.action;
        this.handleFABAction(actionType);
        fabMenu.style.display = 'none';
      });
    });
    
    // Close FAB menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!fabToggle.contains(e.target) && !fabMenu.contains(e.target)) {
        fabMenu.style.display = 'none';
      }
    });
  }

  handleFABAction(actionType) {
    switch (actionType) {
      case 'export-schedule':
        this.exportSchedule();
        break;
      case 'share-schedule':
        this.shareSchedule();
        break;
      case 'clear-schedule':
        this.clearSchedule();
        break;
    }
  }

  exportSchedule() {
    const savedEvents = Array.from(this.savedEvents)
      .map(id => this.searchEngine.parties.find(e => e.id === id))
      .filter(Boolean);
    
    if (savedEvents.length === 0) {
      this.showToast('No events to export');
      return;
    }
    
    // Create ICS file for all events
    const icsData = this.createICSForEvents(savedEvents);
    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `gamescom-2025-schedule.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    this.showToast('Schedule exported successfully');
  }

  createICSForEvents(events) {
    const icsEvents = events.map(event => {
      const startDate = new Date(event.date || event.start || Date.now());
      const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours default
      
      return `BEGIN:VEVENT\r\nUID:${event.id}@conference-party-app.web.app\r\nDTSTART:${this.formatICSDate(startDate)}\r\nDTEND:${this.formatICSDate(endDate)}\r\nSUMMARY:${event.title}\r\nDESCRIPTION:${event.description || ''}\r\nLOCATION:${event.venue || ''}\r\nEND:VEVENT\r\n`;
    }).join('');
    
    return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Conference Party App//EN\r\n${icsEvents}END:VCALENDAR`;
  }

  formatICSDate(date) {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  async shareSchedule() {
    const savedEvents = Array.from(this.savedEvents);
    
    if (savedEvents.length === 0) {
      this.showToast('No events to share');
      return;
    }
    
    const shareText = `Check out my Gamescom 2025 schedule! I'm planning to attend ${savedEvents.length} events.`;
    const shareUrl = `${window.location.origin}${window.location.pathname}#schedule`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Gamescom 2025 Schedule',
          text: shareText,
          url: shareUrl
        });
      } catch (error) {
        this.fallbackShare(shareText, shareUrl);
      }
    } else {
      this.fallbackShare(shareText, shareUrl);
    }
  }

  fallbackShare(text, url) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${text} ${url}`);
      this.showToast('Share link copied to clipboard');
    } else {
      this.showToast('Sharing not supported');
    }
  }

  clearSchedule() {
    if (this.savedEvents.size === 0) {
      this.showToast('Schedule is already empty');
      return;
    }
    
    if (confirm('Are you sure you want to clear your entire schedule?')) {
      this.savedEvents.clear();
      this.saveSavedEvents();
      this.updateScheduleStats();
      this.updateScheduleView();
      this.showToast('Schedule cleared');
    }
  }

  showToast(message) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    
    // Style the toast
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'var(--color-surface)',
      color: 'var(--color-text)',
      padding: '12px 24px',
      borderRadius: '8px',
      border: '1px solid var(--color-border)',
      boxShadow: 'var(--elev-shadow)',
      zIndex: '10001',
      fontSize: '0.9rem',
      fontWeight: '500'
    });
    
    document.body.appendChild(toast);
    
    // Animate in
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    
    requestAnimationFrame(() => {
      toast.style.transition = 'all 0.3s ease';
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }

  showError(message) {
    this.container.innerHTML = `
      <div class="discovery-error">
        <div class="error-icon">⚠️</div>
        <div class="error-title">Error</div>
        <div class="error-message">${message}</div>
        <button class="error-retry" onclick="location.reload()">Retry</button>
      </div>
    `;
  }

  saveSavedEvents() {
    localStorage.setItem('party-saved-events', JSON.stringify(Array.from(this.savedEvents)));
  }

  loadSavedEvents() {
    try {
      const saved = JSON.parse(localStorage.getItem('party-saved-events') || '[]');
      this.savedEvents = new Set(saved);
    } catch {
      this.savedEvents = new Set();
    }
  }

  // Public API
  getSavedEvents() {
    return Array.from(this.savedEvents);
  }

  addEvent(eventId) {
    this.savedEvents.add(eventId);
    this.saveSavedEvents();
    this.updateScheduleStats();
  }

  removeEvent(eventId) {
    this.savedEvents.delete(eventId);
    this.saveSavedEvents();
    this.updateScheduleStats();
  }
}

// Export for use
export { PartyDiscoverySystem };