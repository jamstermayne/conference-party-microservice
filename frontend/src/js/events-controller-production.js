// Production Events Controller: Party listing and management
import Events from './events.js';
import Store from './store.js';
import { emptyState, showLoading, showError } from './ui-feedback-production.js';
import Calendar from './calendar-production.js';

// Load parties from API or local data
export async function loadParties() {
  const mount = document.querySelector('#event-list, #main-content, [data-events-container]');
  if (!mount) return;
  
  // Show loading state
  showLoading(mount, 'Loading parties...');
  
  try {
    // Try to load from API first
    const response = await fetch('/api/events?conference=gamescom2025').catch(() => null);
    let events = [];
    
    if (response && response.ok) {
      events = await response.json();
    } else {
      // Fallback to local data
      const localResponse = await fetch('/data/parties.json').catch(() => null);
      if (localResponse && localResponse.ok) {
        events = await localResponse.json();
      }
    }
    
    // Filter and sort events
    events = processEvents(events);
    
    // Store in state
    Store.set('events', events);
    
    if (!events.length) {
      emptyState(mount, {
        icon: '🎉',
        title: 'No Parties Yet',
        message: 'New parties will appear here as they\'re announced.',
        action: {
          label: 'Refresh',
          onClick: () => loadParties()
        }
      });
      return;
    }
    
    // Render events
    render(events, mount);
    
    // Emit success event
    Events.emit('events:loaded', { count: events.length });
    
  } catch (error) {
    console.error('Failed to load parties:', error);
    
    showError(mount, {
      title: 'Failed to Load Parties',
      message: 'Unable to fetch party data. Please check your connection.',
      retry: () => loadParties()
    });
    
    Events.emit('ui:toast', {
      type: 'error',
      message: 'Failed to load parties'
    });
  }
}

// Process and enhance event data
function processEvents(events) {
  if (!Array.isArray(events)) return [];
  
  return events
    .map(event => ({
      ...event,
      id: event.id || generateEventId(event),
      saved: isEventSaved(event.id || generateEventId(event)),
      timestamp: new Date(event.start || event.date).getTime()
    }))
    .filter(event => {
      // Filter out past events (optional)
      const eventTime = new Date(event.start || event.date).getTime();
      const now = Date.now();
      const hoursPast = (now - eventTime) / (1000 * 60 * 60);
      return hoursPast < 24; // Show events up to 24 hours after they started
    })
    .sort((a, b) => a.timestamp - b.timestamp);
}

// Generate consistent event ID
function generateEventId(event) {
  const str = `${event.title}-${event.venue}-${event.start || event.date}`;
  return btoa(str).replace(/[^a-zA-Z0-9]/g, '').substring(0, 12);
}

// Check if event is saved
function isEventSaved(eventId) {
  const saved = Store.get('events.selected') || [];
  return saved.some(e => e.id === eventId);
}

// Render events list
function render(events, mount) {
  // Group events by day
  const grouped = groupEventsByDay(events);
  
  let html = '<div class="events-container">';
  
  for (const [day, dayEvents] of Object.entries(grouped)) {
    html += `
      <div class="events-day-group">
        <h3 class="events-day-title">${day}</h3>
        <div class="events-list">
          ${dayEvents.map(event => renderCard(event)).join('')}
        </div>
      </div>
    `;
  }
  
  html += '</div>';
  
  mount.innerHTML = html;
  
  // Wire up event handlers using delegation
  mount.addEventListener('click', handleEventClick, { once: false });
}

// Group events by day
function groupEventsByDay(events) {
  const grouped = {};
  const today = new Date().toDateString();
  const tomorrow = new Date(Date.now() + 86400000).toDateString();
  
  events.forEach(event => {
    const eventDate = new Date(event.start || event.date);
    const dateStr = eventDate.toDateString();
    
    let dayLabel;
    if (dateStr === today) {
      dayLabel = 'Today';
    } else if (dateStr === tomorrow) {
      dayLabel = 'Tomorrow';
    } else {
      dayLabel = eventDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
    
    if (!grouped[dayLabel]) {
      grouped[dayLabel] = [];
    }
    grouped[dayLabel].push(event);
  });
  
  return grouped;
}

// Render individual event card
function renderCard(event) {
  const saved = event.saved;
  const time = formatEventTime(event.start || event.date);
  const endTime = event.end ? formatEventTime(event.end) : '';
  
  return `
    <article class="party-card ${saved ? 'saved' : ''}" data-event-id="${event.id}">
      <div class="party-header">
        <h3 class="party-title">${escapeHtml(event.title || event.name)}</h3>
        ${saved ? '<span class="party-saved-badge">Saved</span>' : ''}
      </div>
      
      <div class="party-meta">
        <div class="party-time">
          <span class="icon">🕐</span>
          ${time}${endTime ? ` - ${endTime}` : ''}
        </div>
        <div class="party-venue">
          <span class="icon">📍</span>
          ${escapeHtml(event.venue || event.location || 'TBA')}
        </div>
        ${event.capacity ? `
          <div class="party-capacity">
            <span class="icon">👥</span>
            ${event.capacity} people
          </div>
        ` : ''}
      </div>
      
      ${event.description ? `
        <p class="party-description">${escapeHtml(event.description)}</p>
      ` : ''}
      
      <div class="party-actions">
        <button class="btn ${saved ? 'btn-secondary' : 'btn-primary'}" 
                data-action="save" 
                data-event-id="${event.id}">
          ${saved ? 'Unsave' : 'Save'}
        </button>
        <button class="btn btn-secondary" 
                data-action="calendar" 
                data-event-id="${event.id}">
          <span class="icon">📅</span> Calendar
        </button>
        <button class="btn btn-secondary" 
                data-action="navigate" 
                data-event-id="${event.id}">
          <span class="icon">🗺</span> Navigate
        </button>
        ${event.url ? `
          <button class="btn btn-secondary" 
                  data-action="info" 
                  data-event-id="${event.id}">
            <span class="icon">ℹ</span> Info
          </button>
        ` : ''}
      </div>
    </article>
  `;
}

// Handle event card clicks
function handleEventClick(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  const action = btn.dataset.action;
  const eventId = btn.dataset.eventId;
  
  if (!eventId) return;
  
  const events = Store.get('events') || [];
  const event = events.find(e => e.id === eventId);
  
  if (!event) return;
  
  switch (action) {
    case 'save':
      toggleSaveEvent(event, btn);
      break;
    case 'calendar':
      Calendar.addToCalendar(event);
      break;
    case 'navigate':
      navigateToVenue(event);
      break;
    case 'info':
      showEventInfo(event);
      break;
  }
}

// Toggle save/unsave event
function toggleSaveEvent(event, btn) {
  const saved = Store.get('events.selected') || [];
  const exists = saved.some(e => e.id === event.id);
  
  let newSaved;
  if (exists) {
    // Remove from saved
    newSaved = saved.filter(e => e.id !== event.id);
    btn.textContent = 'Save';
    btn.classList.remove('btn-secondary');
    btn.classList.add('btn-primary');
    
    Events.emit('ui:toast', {
      type: 'info',
      message: 'Event removed from saved'
    });
  } else {
    // Add to saved
    newSaved = [...saved, event];
    btn.textContent = 'Unsave';
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-secondary');
    
    Events.emit('ui:toast', {
      type: 'success',
      message: 'Event saved!'
    });
  }
  
  Store.set('events.selected', newSaved);
  
  // Update card appearance
  const card = btn.closest('.party-card');
  if (card) {
    card.classList.toggle('saved', !exists);
  }
  
  Events.emit('event:saved', { event, saved: !exists });
}

// Navigate to venue
function navigateToVenue(event) {
  const venue = event.venue || event.location;
  if (!venue) {
    Events.emit('ui:toast', {
      type: 'warning',
      message: 'No venue information available'
    });
    return;
  }
  
  const query = encodeURIComponent(venue + ', Cologne, Germany');
  const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
  
  window.open(url, '_blank', 'noopener,noreferrer');
  
  Events.emit('event:navigate', { event, venue });
}

// Show detailed event info
function showEventInfo(event) {
  if (event.url) {
    window.open(event.url, '_blank', 'noopener,noreferrer');
  } else {
    Events.emit('ui:modal', {
      title: event.title || event.name,
      content: `
        <div class="event-info">
          <p><strong>Time:</strong> ${formatEventTime(event.start || event.date)}${event.end ? ` - ${formatEventTime(event.end)}` : ''}</p>
          <p><strong>Venue:</strong> ${event.venue || event.location || 'TBA'}</p>
          ${event.description ? `<p><strong>Description:</strong> ${event.description}</p>` : ''}
          ${event.capacity ? `<p><strong>Capacity:</strong> ${event.capacity} people</p>` : ''}
          ${event.organizer ? `<p><strong>Organizer:</strong> ${event.organizer}</p>` : ''}
        </div>
      `,
      buttons: [
        {
          label: 'Close',
          primary: true
        }
      ]
    });
  }
  
  Events.emit('event:info', { event });
}

// Format event time
function formatEventTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// Escape HTML to prevent XSS
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Search/filter events
export function filterEvents(query) {
  const events = Store.get('events') || [];
  
  if (!query) {
    render(events, document.querySelector('#event-list'));
    return;
  }
  
  const filtered = events.filter(event => {
    const searchStr = `${event.title} ${event.venue} ${event.description}`.toLowerCase();
    return searchStr.includes(query.toLowerCase());
  });
  
  const mount = document.querySelector('#event-list');
  if (filtered.length) {
    render(filtered, mount);
  } else {
    emptyState(mount, {
      icon: '🔍',
      title: 'No matches found',
      message: `No parties match "${query}"`,
      action: {
        label: 'Clear search',
        onClick: () => {
          Events.emit('search:clear');
          loadParties();
        }
      }
    });
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Auto-load if on events page
  if (window.location.hash === '#/events' || document.querySelector('#event-list')) {
    loadParties();
  }
  
  // Listen for route changes
  Events.on('route:change', (route) => {
    if (route.name === 'events') {
      loadParties();
    }
  });
  
  // Listen for search events
  Events.on('search', ({ query }) => {
    filterEvents(query);
  });
  
  // Listen for refresh requests
  Events.on('events:refresh', loadParties);
});

// Export API
export default {
  loadParties,
  filterEvents,
  processEvents,
  isEventSaved
};