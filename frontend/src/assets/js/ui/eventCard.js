// Event Card UI Component
export class EventCard {
  constructor(event) {
    this.event = event;
  }

  render() {
    const card = document.createElement('div');
    card.className = 'event-card';
    card.innerHTML = `
      <div class="event-card-header">
        <h3 class="event-card-title">${this.event.title || this.event.name}</h3>
        ${this.event.category ? `<span class="event-card-badge">${this.event.category}</span>` : ''}
      </div>
      <div class="event-card-meta">
        <span class="event-card-time">🕐 ${this.formatTime(this.event.start || this.event.date)}</span>
        <span class="event-card-location">📍 ${this.event.venue || this.event.location || 'TBA'}</span>
      </div>
      <div class="event-card-actions">
        <button class="event-card-action primary" data-action="save" data-id="${this.event.id}">
          💾 Save
        </button>
        <button class="event-card-action" data-action="calendar" data-id="${this.event.id}">
          📅 Calendar
        </button>
      </div>
    `;
    return card;
  }

  formatTime(dateString) {
    if (!dateString) return 'TBA';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }
}

export default EventCard;