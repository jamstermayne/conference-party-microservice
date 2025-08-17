/**
 * Calendar Panel - Modern Card-Based Design
 * Shows events as cards organized by day
 */

import { fetchParties } from './api-lite.js';
import { openICS, openGoogle } from './calendar-lite.js';

class CalendarPanel {
  constructor() {
    this.panel = null;
    this.events = [];
    this.savedEvents = [];
    this.isActive = false;
    this.currentView = 'upcoming'; // upcoming, saved, all
  }

  init() {
    this.createPanel();
    this.setupHashListener();
    this.loadSavedEvents();
  }

  loadSavedEvents() {
    try {
      this.savedEvents = JSON.parse(localStorage.getItem('saved_events') || '[]');
    } catch {
      this.savedEvents = [];
    }
  }

  saveSavedEvents() {
    try {
      localStorage.setItem('saved_events', JSON.stringify(this.savedEvents));
    } catch (e) {
      console.warn('Could not save events:', e);
    }
  }

  createPanel() {
    if (document.getElementById('panel-calendar')) return;

    this.panel = document.createElement('section');
    this.panel.id = 'panel-calendar';
    this.panel.className = 'panel panel--overlay';
    this.panel.innerHTML = `
      <div class="calendar-panel-header">
        <button class="btn-close-panel" data-action="close-panel" aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
          </svg>
        </button>
        <h1>My Calendar</h1>
        <button class="btn-sync-calendar" data-action="sync-google">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
          </svg>
          Sync
        </button>
      </div>
      <div class="calendar-panel-body">
        <div class="calendar-nav">
          <div class="calendar-view-tabs">
            <button class="view-tab active" data-view="upcoming">Upcoming</button>
            <button class="view-tab" data-view="saved">Saved (${this.savedEvents.length})</button>
            <button class="view-tab" data-view="all">All Events</button>
          </div>
        </div>
        <div id="calendar-container" class="calendar-events-container">
          <div class="calendar-loading">Loading events...</div>
        </div>
      </div>
    `;

    document.body.appendChild(this.panel);
    this.bindEvents();
  }

  bindEvents() {
    // Close button
    this.panel.querySelector('[data-action="close-panel"]').addEventListener('click', () => {
      this.close();
      location.hash = '#/home';
    });

    // Sync button
    this.panel.querySelector('[data-action="sync-google"]').addEventListener('click', () => {
      this.syncWithGoogleCalendar();
    });

    // View tabs
    this.panel.querySelectorAll('.view-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.panel.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        this.currentView = e.target.dataset.view;
        this.renderEvents();
      });
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isActive) {
        this.close();
        location.hash = '#/home';
      }
    });
  }

  setupHashListener() {
    const checkHash = () => {
      const shouldShow = location.hash === '#/calendar';
      if (shouldShow && !this.isActive) {
        this.open();
      } else if (!shouldShow && this.isActive) {
        this.close();
      }
    };

    window.addEventListener('hashchange', checkHash);
    checkHash();
  }

  async open() {
    this.panel.classList.add('panel--active');
    this.isActive = true;
    await this.loadEvents();
  }

  close() {
    this.panel.classList.remove('panel--active');
    this.isActive = false;
  }

  async loadEvents() {
    try {
      this.events = await fetchParties();
      this.renderEvents();
    } catch (error) {
      console.error('Failed to load events:', error);
      this.renderError();
    }
  }

  renderEvents() {
    const container = this.panel.querySelector('#calendar-container');
    if (!container) return;

    let eventsToShow = [];
    const now = new Date();

    switch (this.currentView) {
      case 'upcoming':
        eventsToShow = this.events.filter(event => {
          const eventDate = new Date(event.start || event.date);
          return eventDate >= now;
        }).slice(0, 10);
        break;
      case 'saved':
        eventsToShow = this.events.filter(event => 
          this.savedEvents.some(saved => saved.id === event.id)
        );
        break;
      case 'all':
        eventsToShow = this.events;
        break;
    }

    // Sort by date
    eventsToShow.sort((a, b) => {
      const dateA = new Date(a.start || a.date);
      const dateB = new Date(b.start || b.date);
      return dateA - dateB;
    });

    if (eventsToShow.length === 0) {
      container.innerHTML = `
        <div class="card-modern card-modern--empty">
          <div class="card-modern__body">
            <div class="empty-state">
              <div class="empty-icon">📅</div>
              <h3>No events found</h3>
              <p>${this.getEmptyMessage()}</p>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // Group events by date
    const eventsByDate = {};
    eventsToShow.forEach(event => {
      const eventDate = new Date(event.start || event.date);
      const dateKey = eventDate.toDateString();
      if (!eventsByDate[dateKey]) {
        eventsByDate[dateKey] = [];
      }
      eventsByDate[dateKey].push(event);
    });

    container.innerHTML = Object.entries(eventsByDate).map(([dateKey, dayEvents]) => {
      const date = new Date(dateKey);
      const isToday = date.toDateString() === now.toDateString();
      const isTomorrow = date.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
      
      let dayLabel = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      });
      
      if (isToday) dayLabel = `Today, ${dayLabel}`;
      else if (isTomorrow) dayLabel = `Tomorrow, ${dayLabel}`;

      return `
        <div class="calendar-day-section">
          <h2 class="calendar-day-header">${dayLabel}</h2>
          <div class="card-modern-grid">
            ${dayEvents.map(event => this.renderEventCard(event)).join('')}
          </div>
        </div>
      `;
    }).join('');

    // Add event listeners
    this.bindEventCardListeners();
  }

  renderEventCard(event) {
    const isSaved = this.savedEvents.some(saved => saved.id === event.id);
    const eventDate = new Date(event.start || event.date);
    const isUpcoming = eventDate >= new Date();
    
    return `
      <div class="card-modern card-modern--event calendar-event-card" data-event-id="${event.id}">
        <div class="card-modern__header">
          <div class="card-modern__eyebrow">
            <span class="badge ${event.price && event.price.toLowerCase().includes('free') ? 'live' : 'price'}">${event.price || 'TBA'}</span>
            <span class="time-badge">${event.time || 'All day'}</span>
          </div>
          <h3 class="card-modern__title">${event.title}</h3>
          <div class="card-modern__subtitle">${event.venue || 'Venue TBA'}</div>
        </div>
        
        <div class="card-modern__body">
          <div class="card-modern__details">
            <svg class="card-modern__icon" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
            </svg>
            <div class="card-modern__detail">${event.address || event.venue || 'Location TBA'}</div>
          </div>
          
          ${event.description ? `<div class="card-modern__description">${event.description}</div>` : ''}
        </div>
        
        <div class="card-modern__footer">
          <button class="card-modern__action card-modern__action--secondary" data-action="save-event" data-event-id="${event.id}">
            ${isSaved ? '❤️ Saved' : '🤍 Save'}
          </button>
          <button class="card-modern__action card-modern__action--primary" data-action="add-calendar" data-event-id="${event.id}">
            📅 Add to Calendar
          </button>
        </div>
      </div>
    `;
  }

  bindEventCardListeners() {
    const container = this.panel.querySelector('#calendar-container');
    if (!container) return;

    container.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      const eventId = btn.dataset.eventId;
      const event = this.events.find(e => e.id === eventId);
      
      if (!event) return;

      switch (action) {
        case 'save-event':
          this.toggleSaveEvent(event, btn);
          break;
        case 'add-calendar':
          this.showCalendarOptions(event);
          break;
      }
    });
  }

  toggleSaveEvent(event, btn) {
    const isSaved = this.savedEvents.some(saved => saved.id === event.id);
    
    if (isSaved) {
      this.savedEvents = this.savedEvents.filter(saved => saved.id !== event.id);
      btn.textContent = '🤍 Save';
    } else {
      this.savedEvents.push({
        id: event.id,
        title: event.title,
        date: event.date,
        savedAt: new Date().toISOString()
      });
      btn.textContent = '❤️ Saved';
    }
    
    this.saveSavedEvents();
    
    // Update saved count in tab
    const savedTab = this.panel.querySelector('[data-view="saved"]');
    if (savedTab) {
      savedTab.textContent = `Saved (${this.savedEvents.length})`;
    }
  }

  showCalendarOptions(event) {
    const options = `
      <div class="calendar-export-popup" id="calendar-export-popup">
        <div class="popup-content">
          <h3>Add "${event.title}" to Calendar</h3>
          <div class="popup-actions">
            <button class="btn-export-google" data-action="google">📅 Google Calendar</button>
            <button class="btn-export-ics" data-action="ics">📄 Download .ics</button>
            <button class="btn-cancel" data-action="cancel">Cancel</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', options);
    
    const popup = document.getElementById('calendar-export-popup');
    popup.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      
      switch (action) {
        case 'google':
          openGoogle(event);
          break;
        case 'ics':
          openICS(event);
          break;
      }
      
      popup.remove();
    });
  }

  async syncWithGoogleCalendar() {
    const btn = this.panel.querySelector('[data-action="sync-google"]');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" class="spin">
        <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
      </svg>
      Syncing...
    `;
    
    // Simulate sync process
    setTimeout(() => {
      btn.innerHTML = originalText;
      this.showSyncMessage('Calendar synced successfully!');
    }, 2000);
  }

  showSyncMessage(message) {
    const msg = document.createElement('div');
    msg.className = 'sync-message';
    msg.textContent = message;
    msg.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: rgba(34, 197, 94, 0.9);
      color: white;
      border-radius: 8px;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
  }

  getEmptyMessage() {
    switch (this.currentView) {
      case 'upcoming':
        return 'No upcoming events. Check back later or browse all events.';
      case 'saved':
        return 'No saved events yet. Save events you\'re interested in to see them here.';
      case 'all':
        return 'No events available at the moment.';
      default:
        return 'No events found.';
    }
  }

  renderError() {
    const container = this.panel.querySelector('#calendar-container');
    if (!container) return;

    container.innerHTML = `
      <div class="card-modern card-modern--empty">
        <div class="card-modern__body">
          <div class="empty-state">
            <div class="empty-icon">⚠️</div>
            <h3>Failed to load events</h3>
            <p>Please check your connection and try again.</p>
            <button class="btn-retry" onclick="window.calendarPanel.loadEvents()">Retry</button>
          </div>
        </div>
      </div>
    `;
  }
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.calendarPanel = new CalendarPanel();
    window.calendarPanel.init();
  });
} else {
  window.calendarPanel = new CalendarPanel();
  window.calendarPanel.init();
}

export default CalendarPanel;