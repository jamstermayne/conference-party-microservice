/**
 * PRODUCTION EVENTS CONTROLLER MODULE
 * Live API integration, Job/Ive empty/error handling, calendar hooks
 * Based on GPT-5 architecture for Professional Intelligence Platform
 */

import Events from './events.js';
import { emptyState, loadingState, errorState } from './ui-feedback.js';
import Store from './store.js';

/**
 * Production API base URL
 */
const API_BASE = window.location.origin.includes('localhost') 
  ? 'http://localhost:5001/conference-party-app/us-central1'
  : 'https://us-central1-conference-party-app.cloudfunctions.net';

/**
 * Load parties from live API
 */
async function loadParties() {
  const mount = document.querySelector('#event-list');
  if (!mount) return;

  try {
    // Show loading state
    loadingState('#event-list', 'Loading parties...');
    
    // Fetch events from production API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${API_BASE}/api/events?conference=gamescom2025`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const events = await response.json();
    
    // Handle empty state
    if (!events || !events.length) {
      return emptyState('#event-list', {
        icon: '🎪',
        title: 'No Parties Yet',
        message: 'New parties will appear here as they\'re announced.',
        action: {
          label: 'Refresh',
          onClick: () => loadParties()
        }
      });
    }
    
    // Store events and render
    Store.set('events', events);
    renderEvents(events);
    
    // Track successful load
    if (window.gtag) {
      gtag('event', 'events_loaded', {
        'event_count': events.length,
        'conference': 'gamescom2025'
      });
    }
    
  } catch (error) {
    console.error('Failed to load parties:', error);
    
    // Show error state
    errorState('#event-list', {
      title: 'Failed to Load Parties',
      message: 'Unable to load parties. Please check your connection and try again.',
      retry: () => loadParties()
    });
    
    // Show error toast
    Events.emit('ui:toast', {
      type: 'error',
      message: 'Failed to load parties. Please try again.'
    });
    
    // Track error
    if (window.gtag) {
      gtag('event', 'events_load_failed', {
        'error': error.message,
        'conference': 'gamescom2025'
      });
    }
  }
}

/**
 * Render events list
 * @param {Array} events - Array of event objects
 */
function renderEvents(events) {
  const mount = document.querySelector('#event-list');
  if (!mount) return;
  
  mount.innerHTML = `
    <div class="events-header">
      <h2>🎪 Gaming Industry Parties</h2>
      <p class="muted">Exclusive networking events during Gamescom 2025</p>
    </div>
    <div class="events-grid">
      ${events.map(renderEventCard).join('')}
    </div>
  `;

  // Set up event delegation for party actions
  mount.addEventListener('click', handleEventClick);
}

/**
 * Render individual event card
 * @param {Object} event - Event object
 * @returns {string} HTML string for event card
 */
function renderEventCard(event) {
  const savedEvents = Store.get('events.selected') || [];
  const isSaved = savedEvents.some(e => e.id === event.id);
  
  const startDate = new Date(event.start || event.date);
  const isValidDate = !isNaN(startDate.getTime());
  
  return `
    <article class="party-card" data-id="${event.id}">
      <div class="party-header">
        <h3 class="party-title">${escapeHtml(event.title || event.name)}</h3>
        ${event.category ? `<span class="party-category badge badge-${event.category.toLowerCase()}">${escapeHtml(event.category)}</span>` : ''}
      </div>
      
      <div class="party-details">
        <div class="party-meta">
          <span class="party-venue">
            📍 ${escapeHtml(event.venue || event.location || 'TBA')}
          </span>
          <span class="party-time">
            🕰️ ${isValidDate ? startDate.toLocaleString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            }) : 'TBA'}
          </span>
        </div>
        
        ${event.description ? `<p class="party-description">${escapeHtml(event.description.substring(0, 120))}${event.description.length > 120 ? '...' : ''}</p>` : ''}
        
        ${event.attendeeCount ? `<div class="party-stats">👥 ${event.attendeeCount} attending</div>` : ''}
      </div>
      
      <div class="party-actions">
        <button 
          class="btn ${isSaved ? 'btn-success' : 'btn-primary'}" 
          data-action="save" 
          data-id="${event.id}"
          aria-label="${isSaved ? 'Remove from saved events' : 'Save event'}"
        >
          ${isSaved ? '✓ Saved' : '💾 Save'}
        </button>
        
        <button 
          class="btn btn-secondary" 
          data-action="calendar" 
          data-id="${event.id}"
          aria-label="Add to calendar"
        >
          📅 Calendar
        </button>
        
        <button 
          class="btn btn-secondary" 
          data-action="nav" 
          data-id="${event.id}"
          aria-label="Navigate to venue"
        >
          🧭 Navigate
        </button>
      </div>
    </article>
  `;
}

/**
 * Handle click events on party cards
 * @param {Event} e - Click event
 */
function handleEventClick(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  
  e.preventDefault();
  
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  const events = Store.get('events') || [];
  const event = events.find(ev => ev.id === id);
  
  if (!event) {
    Events.emit('ui:toast', {
      type: 'error',
      message: 'Event not found. Please refresh the page.'
    });
    return;
  }

  switch (action) {
    case 'save':
      toggleSaveEvent(event, btn);
      break;
    case 'nav':
      openNavigation(event);
      break;
    case 'calendar':
      addToCalendar(event);
      break;
  }
}

/**
 * Toggle save state for an event
 * @param {Object} event - Event object
 * @param {Element} btn - Button element
 */
function toggleSaveEvent(event, btn) {
  const savedEvents = Store.get('events.selected') || [];
  const existingIndex = savedEvents.findIndex(e => e.id === event.id);
  
  if (existingIndex >= 0) {
    // Remove from saved
    const updated = savedEvents.filter(e => e.id !== event.id);
    Store.set('events.selected', updated);
    
    btn.textContent = '💾 Save';
    btn.className = 'btn btn-primary';
    btn.setAttribute('aria-label', 'Save event');
    
    Events.emit('ui:toast', {
      type: 'info',
      message: 'Removed from saved events'
    });
    
    // Track unsave
    if (window.gtag) {
      gtag('event', 'event_unsaved', {
        'event_id': event.id,
        'event_title': event.title || event.name
      });
    }
    
  } else {
    // Add to saved
    const updated = [...savedEvents, event];
    Store.set('events.selected', updated);
    
    btn.textContent = '✓ Saved';
    btn.className = 'btn btn-success';
    btn.setAttribute('aria-label', 'Remove from saved events');
    
    Events.emit('ui:toast', {
      type: 'success',
      message: 'Added to saved events'
    });
    
    // Track save
    if (window.gtag) {
      gtag('event', 'event_saved', {
        'event_id': event.id,
        'event_title': event.title || event.name
      });
    }
  }
  
  // Update invite count display if available
  const savedCount = Store.get('events.selected')?.length || 0;
  const countDisplay = document.querySelector('#saved-events-count');
  if (countDisplay) {
    countDisplay.textContent = savedCount;
  }
}

/**
 * Add event to calendar with suggestion for bulk sync
 * @param {Object} event - Event object
 */
function addToCalendar(event) {
  // Encourage full calendar integration
  Events.emit('ui:toast', {
    type: 'info',
    message: 'Tip: Connect Google Calendar or export ICS for bulk sync of all events.',
    duration: 5000
  });
  
  // Open calendar integration if available
  if (window.router && window.router.navigate) {
    window.router.navigate('/calendar');
  } else {
    // Fallback: emit calendar connection event
    Events.emit('calendar:connect:suggest', { event });
  }
  
  // Track calendar interest
  if (window.gtag) {
    gtag('event', 'calendar_interest', {
      'event_id': event.id,
      'event_title': event.title || event.name
    });
  }
}

/**
 * Open navigation to event venue
 * @param {Object} event - Event object
 */
function openNavigation(event) {
  const venue = event.venue || event.location;
  if (!venue) {
    Events.emit('ui:toast', {
      type: 'error',
      message: 'Venue information not available'
    });
    return;
  }
  
  const query = encodeURIComponent(venue);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
  
  // Open in new tab with proper security
  window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  
  Events.emit('ui:toast', {
    type: 'success',
    message: 'Opening navigation to ' + venue
  });
  
  // Track navigation
  if (window.gtag) {
    gtag('event', 'event_navigation', {
      'event_id': event.id,
      'venue': venue
    });
  }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, (match) => {
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return escapeMap[match];
  });
}

// Event handlers
Events.on('events:load', loadParties);
Events.on('events:refresh', loadParties);

// Route handler - load parties when events route is active
Events.on('route:change', (currentRoute) => {
  if (currentRoute.name === 'events' || currentRoute.name === 'home') {
    loadParties();
  }
});

// Auto-load on DOM ready if we're on the events page
document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname;
  if (currentPath === '/events' || currentPath === '/' || currentPath.includes('events')) {
    loadParties();
  }
});

// Export functions
export {
  loadParties,
  renderEvents,
  renderEventCard,
  toggleSaveEvent,
  addToCalendar,
  openNavigation
};

// Make available globally
window.EventsController = {
  loadParties,
  renderEvents,
  toggleSaveEvent,
  addToCalendar,
  openNavigation
};

console.log('✅ Production Events Controller loaded');