/**
 * Calendar Panel
 * Slide-in panel for calendar view
 */

import { HolisticCalendar } from './calendar-holistic.js';

class CalendarPanel {
  constructor() {
    this.panel = null;
    this.calendar = null;
    this.isActive = false;
  }

  init() {
    this.createPanel();
    this.setupHashListener();
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
        <div class="calendar-header-actions"></div>
      </div>
      <div id="calendar-container" class="calendar-panel-body">
        <div class="calendar-loading">Loading calendar...</div>
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

    // Initialize calendar if not already done
    if (!this.calendar) {
      const { default: HolisticCalendar } = await import('./calendar-holistic.js');
      this.calendar = new HolisticCalendar();
      await this.calendar.init();
    }
  }

  close() {
    this.panel.classList.remove('panel--active');
    this.isActive = false;
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