/**
 * Organized Party List Display
 * Groups events by date and provides filtering
 */

class OrganizedPartyList {
  constructor() {
    this.parties = [];
    this.filteredParties = [];
    this.currentFilter = 'all';
    this.currentSort = 'date';
    this.currentDate = null;
  }

  async init() {
    await this.loadParties();
    this.render();
    this.attachEventListeners();
  }

  async loadParties() {
    try {
      const response = await fetch('/api/parties?conference=gamescom2025');
      const data = await response.json();
      this.parties = data.data || [];
      
      // Sort by date and time by default
      this.parties.sort((a, b) => {
        const dateA = new Date(a.start || `${a.date}T${a.time}`);
        const dateB = new Date(b.start || `${b.date}T${b.time}`);
        return dateA - dateB;
      });
      
      this.filteredParties = [...this.parties];
    } catch (error) {
      console.error('Failed to load parties:', error);
      this.parties = [];
      this.filteredParties = [];
    }
  }

  groupByDate() {
    const groups = {};
    
    this.filteredParties.forEach(party => {
      const date = party.date || party.start?.split('T')[0] || '2025-08-20';
      if (!groups[date]) {
        groups[date] = {
          date,
          dayName: this.formatDate(date),
          events: []
        };
      }
      groups[date].events.push(party);
    });
    
    // Sort groups by date
    return Object.values(groups).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
  }

  formatDate(dateStr) {
    const date = new Date(dateStr);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
  }

  formatTime(timeStr) {
    if (!timeStr) return 'TBA';
    
    if (timeStr.includes('T')) {
      const date = new Date(timeStr);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    }
    
    // Handle "HH:MM" format
    if (timeStr.includes(':')) {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    }
    
    return timeStr;
  }

  getCategoryColor(category) {
    const colors = {
      'opening': '#FF6B6B',
      'party': '#4ECDC4',
      'networking': '#45B7D1',
      'conference': '#96CEB4',
      'showcase': '#FFEAA7',
      'vip': '#DDA0DD',
      'esports': '#FF7675',
      'workshop': '#74B9FF',
      'community': '#A29BFE',
      'tournament': '#FD79A8',
      'summit': '#6C5CE7',
      'awards': '#FFD700',
      'closing': '#FF6B6B'
    };
    
    return colors[category?.toLowerCase()] || '#95A5A6';
  }

  filterByCategory(category) {
    this.currentFilter = category;
    
    if (category === 'all') {
      this.filteredParties = [...this.parties];
    } else {
      this.filteredParties = this.parties.filter(p => 
        (p.category || '').toLowerCase() === category.toLowerCase()
      );
    }
    
    this.renderEvents();
  }

  filterByDate(date) {
    this.currentDate = date;
    
    if (date === 'all') {
      this.filteredParties = [...this.parties];
    } else {
      this.filteredParties = this.parties.filter(p => 
        p.date === date || p.start?.startsWith(date)
      );
    }
    
    this.renderEvents();
  }

  searchEvents(query) {
    const searchTerm = query.toLowerCase();
    
    if (!searchTerm) {
      this.filteredParties = [...this.parties];
    } else {
      this.filteredParties = this.parties.filter(p => 
        p.title?.toLowerCase().includes(searchTerm) ||
        p.venue?.toLowerCase().includes(searchTerm) ||
        p.description?.toLowerCase().includes(searchTerm) ||
        p.category?.toLowerCase().includes(searchTerm)
      );
    }
    
    this.renderEvents();
  }

  render() {
    const container = document.querySelector('.party-list-container');
    if (!container) return;
    
    container.innerHTML = `
      <div class="organized-party-list">
        ${this.renderFilters()}
        ${this.renderStats()}
        <div class="events-timeline">
          ${this.renderEvents()}
        </div>
      </div>
    `;
  }

  renderFilters() {
    // Get unique categories
    const categories = [...new Set(this.parties.map(p => p.category || 'other'))];
    
    // Get unique dates
    const dates = [...new Set(this.parties.map(p => p.date || p.start?.split('T')[0]))].sort();
    
    return `
      <div class="party-filters">
        <div class="filter-row">
          <div class="search-box">
            <input type="text" 
                   id="party-search" 
                   placeholder="Search events..." 
                   class="search-input">
            <svg class="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
            </svg>
          </div>
        </div>
        
        <div class="filter-row">
          <div class="filter-group">
            <label>Date:</label>
            <select id="date-filter" class="filter-select">
              <option value="all">All Days</option>
              ${dates.map(date => `
                <option value="${date}">${this.formatDate(date)}</option>
              `).join('')}
            </select>
          </div>
          
          <div class="filter-group">
            <label>Category:</label>
            <div class="category-pills">
              <button class="category-pill ${this.currentFilter === 'all' ? 'active' : ''}" 
                      data-category="all">
                All
              </button>
              ${categories.sort().map(cat => `
                <button class="category-pill ${this.currentFilter === cat ? 'active' : ''}" 
                        data-category="${cat}"
                        style="--cat-color: ${this.getCategoryColor(cat)}">
                  ${cat}
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayEvents = this.parties.filter(p => 
      p.date === today || p.start?.startsWith(today)
    ).length;
    
    return `
      <div class="party-stats">
        <div class="stat-card">
          <div class="stat-number">${this.filteredParties.length}</div>
          <div class="stat-label">Events Shown</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${todayEvents}</div>
          <div class="stat-label">Today's Events</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${this.parties.length}</div>
          <div class="stat-label">Total Events</div>
        </div>
      </div>
    `;
  }

  renderEvents() {
    if (this.filteredParties.length === 0) {
      return `
        <div class="no-events">
          <svg width="64" height="64" viewBox="0 0 20 20" fill="currentColor" opacity="0.3">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clip-rule="evenodd"/>
          </svg>
          <p>No events found</p>
        </div>
      `;
    }
    
    const grouped = this.groupByDate();
    
    return grouped.map(group => `
      <div class="day-group">
        <div class="day-header">
          <h3>${group.dayName}</h3>
          <span class="event-count">${group.events.length} events</span>
        </div>
        
        <div class="day-events">
          ${group.events.map(event => this.renderEventCard(event)).join('')}
        </div>
      </div>
    `).join('');
  }

  renderEventCard(event) {
    const categoryColor = this.getCategoryColor(event.category);
    const isSaved = localStorage.getItem(`saved_${event.id}`) === 'true';
    
    return `
      <div class="event-card-organized" data-event-id="${event.id}">
        <div class="event-time">
          <div class="time-display">${this.formatTime(event.time || event.start)}</div>
          ${event.end ? `<div class="time-end">until ${this.formatTime(event.end)}</div>` : ''}
        </div>
        
        <div class="event-content">
          <div class="event-header">
            <h4 class="event-title">${event.title}</h4>
            <div class="event-badges">
              ${event.category ? `
                <span class="category-badge" style="background: ${categoryColor}">
                  ${event.category}
                </span>
              ` : ''}
              ${event.price ? `
                <span class="price-badge">
                  ${event.price === 'Free' ? '🎟️ Free' : 
                    event.price.includes('Invite') ? '🔒 ' + event.price : 
                    '💰 ' + event.price}
                </span>
              ` : ''}
            </div>
          </div>
          
          <div class="event-details">
            <div class="venue">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
              </svg>
              ${event.venue}
            </div>
            
            ${event.description ? `
              <div class="description">${event.description}</div>
            ` : ''}
          </div>
          
          <div class="event-actions">
            <button class="action-btn save-btn ${isSaved ? 'saved' : ''}" 
                    data-action="save" 
                    data-event-id="${event.id}">
              ${isSaved ? '⭐ Saved' : '☆ Save'}
            </button>
            
            <button class="action-btn map-btn" 
                    data-action="map" 
                    data-lat="${event.lat}" 
                    data-lng="${event.lng}">
              📍 Map
            </button>
            
            <button class="action-btn share-btn" 
                    data-action="share" 
                    data-event-id="${event.id}">
              🔗 Share
            </button>
          </div>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    // Search
    document.getElementById('party-search')?.addEventListener('input', (e) => {
      this.searchEvents(e.target.value);
    });
    
    // Date filter
    document.getElementById('date-filter')?.addEventListener('change', (e) => {
      this.filterByDate(e.target.value);
    });
    
    // Category pills
    document.querySelectorAll('.category-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        const category = e.currentTarget.dataset.category;
        
        // Update active state
        document.querySelectorAll('.category-pill').forEach(p => 
          p.classList.remove('active')
        );
        e.currentTarget.classList.add('active');
        
        this.filterByCategory(category);
      });
    });
    
    // Event actions
    document.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (!action) return;
      
      switch(action) {
        case 'save':
          this.toggleSave(e.target.closest('[data-event-id]').dataset.eventId);
          break;
        case 'map':
          this.showOnMap(
            e.target.closest('[data-lat]').dataset.lat,
            e.target.closest('[data-lng]').dataset.lng
          );
          break;
        case 'share':
          this.shareEvent(e.target.closest('[data-event-id]').dataset.eventId);
          break;
      }
    });
  }

  toggleSave(eventId) {
    const key = `saved_${eventId}`;
    const isSaved = localStorage.getItem(key) === 'true';
    
    localStorage.setItem(key, !isSaved);
    
    // Update UI
    const btn = document.querySelector(`[data-event-id="${eventId}"] .save-btn`);
    if (btn) {
      btn.classList.toggle('saved');
      btn.textContent = !isSaved ? '⭐ Saved' : '☆ Save';
    }
  }

  showOnMap(lat, lng) {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
  }

  shareEvent(eventId) {
    const event = this.parties.find(p => p.id === eventId);
    if (!event) return;
    
    const text = `Check out "${event.title}" at Gamescom 2025!\n${event.venue}\n${this.formatDate(event.date)} at ${this.formatTime(event.time || event.start)}`;
    
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: text,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(text);
      alert('Event details copied to clipboard!');
    }
  }
}

// Auto-initialize when imported
if (typeof window !== 'undefined') {
  window.OrganizedPartyList = OrganizedPartyList;
}