// Calendar View Component
import Events from './foundation/events.js';

class CalendarView {
  constructor() {
    this.currentDate = new Date();
    this.events = [];
    this.init();
  }

  init() {
    Events.on('calendar:render', (data) => this.render(data.container));
    Events.on('calendar:events', (data) => this.setEvents(data.events));
  }

  setEvents(events) {
    this.events = events || [];
    Events.emit('calendar:updated', { events: this.events });
  }

  render(container) {
    if (!container) return;
    
    const view = document.createElement('div');
    view.className = 'calendar-view fade-in';
    view.innerHTML = this.generateHTML();
    
    container.innerHTML = '';
    container.appendChild(view);
    
    this.bindEvents(view);
  }

  generateHTML() {
    return `
      <div class="calendar-header">
        <h2 class="calendar-title">${this.getMonthName()} ${this.currentDate.getFullYear()}</h2>
        <div class="calendar-nav">
          <button class="btn" data-action="prev-month">‹</button>
          <button class="btn btn-primary" data-action="today">Today</button>
          <button class="btn" data-action="next-month">›</button>
        </div>
      </div>
      ${this.generateWeekStrip()}
      ${this.generateGrid()}
    `;
  }

  generateWeekStrip() {
    const days = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      
      const isToday = date.toDateString() === today.toDateString();
      const dayEvents = this.getEventsForDate(date);
      
      days.push(`
        <div class="week-day ${isToday ? 'week-day--today' : ''}" data-date="${date.toISOString()}">
          <div class="week-day__date">${date.getDate()}</div>
          <div class="week-day__name">${this.getDayName(date)}</div>
          <div class="week-day__events">
            ${dayEvents.slice(0, 3).map(event => `
              <div class="week-event">${event.name}</div>
            `).join('')}
            ${dayEvents.length > 3 ? `<div class="week-event">+${dayEvents.length - 3} more</div>` : ''}
          </div>
        </div>
      `);
    }
    
    return `<div class="week-strip">${days.join('')}</div>`;
  }

  generateGrid() {
    // Simplified grid generation
    return `
      <div class="calendar-grid">
        ${this.generateDays()}
      </div>
    `;
  }

  generateDays() {
    const days = [];
    const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
    const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
    const today = new Date();
    
    // Add days from previous month
    for (let i = firstDay.getDay(); i > 0; i--) {
      const date = new Date(firstDay);
      date.setDate(firstDay.getDate() - i);
      days.push(this.generateDay(date, true));
    }
    
    // Add days from current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
      const isToday = date.toDateString() === today.toDateString();
      days.push(this.generateDay(date, false, isToday));
    }
    
    // Fill remaining cells
    const totalCells = Math.ceil(days.length / 7) * 7;
    for (let i = days.length; i < totalCells; i++) {
      const date = new Date(lastDay);
      date.setDate(lastDay.getDate() + (i - days.length + 1));
      days.push(this.generateDay(date, true));
    }
    
    return days.join('');
  }

  generateDay(date, otherMonth = false, isToday = false) {
    const dayEvents = this.getEventsForDate(date);
    const classes = ['calendar-day'];
    
    if (otherMonth) classes.push('calendar-day--other-month');
    if (isToday) classes.push('calendar-day--today');
    
    return `
      <div class="${classes.join(' ')}" data-date="${date.toISOString()}">
        <div class="calendar-day__number">${date.getDate()}</div>
        ${dayEvents.slice(0, 2).map(event => `
          <div class="calendar-event" title="${event.name}">${event.name}</div>
        `).join('')}
        ${dayEvents.length > 2 ? `<div class="calendar-event">+${dayEvents.length - 2}</div>` : ''}
      </div>
    `;
  }

  bindEvents(view) {
    Events.on('action:prev-month', () => this.navigate(-1));
    Events.on('action:next-month', () => this.navigate(1));
    Events.on('action:today', () => this.goToToday());
  }

  navigate(direction) {
    this.currentDate.setMonth(this.currentDate.getMonth() + direction);
    Events.emit('calendar:render', { container: document.querySelector('.calendar-view')?.parentElement });
  }

  goToToday() {
    this.currentDate = new Date();
    Events.emit('calendar:render', { container: document.querySelector('.calendar-view')?.parentElement });
  }

  getEventsForDate(date) {
    return this.events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString();
    });
  }

  getMonthName() {
    return this.currentDate.toLocaleDateString('en-US', { month: 'long' });
  }

  getDayName(date) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
}

// Initialize calendar
const calendar = new CalendarView();

export default calendar;