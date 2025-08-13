/**
 * EVENTS API MODULE
 * Enhanced event loading with error handling and empty states
 * Based on GPT-5 architecture for Professional Intelligence Platform
 */

import { handleError, showEmptyState, showLoadingState, clearContainerState, handleApiResponse } from '../errors.js?v=b011';

/**
 * Load events with enhanced error handling and empty states
 * @param {string} container - Container selector (default: '#event-list')
 * @param {Object} options - Loading options
 */
export async function loadEvents(container = '#event-list', options = {}) {
  try {
    // Clear any existing state and show loading
    clearContainerState(container);
    showLoadingState(container, 'Loading exclusive events...');
    
    // Determine API endpoint based on environment
    const apiBase = getApiBase();
    const endpoint = options.filter ? `/api/events?filter=${options.filter}` : '/api/events';
    
    const res = await fetch(`${apiBase}${endpoint}`, {
      headers: {
        'X-Client-Version': '3.1.0',
        'X-Environment': 'production'
      }
    });
    
    const data = await handleApiResponse(res, 'events');
    
    // Clear loading state
    clearContainerState(container);
    
    if (!data.events || data.events.length === 0) {
      showEmptyState(
        container, 
        'No upcoming parties. Check back soon!', 
        '/assets/images/empty-events.svg',
        {
          type: 'events',
          title: 'No Events Yet',
          action: {
            text: 'Refresh',
            handler: `loadEvents('${container}')`
          }
        }
      );
      return [];
    }

    renderEvents(data.events, container);
    
    // Emit success event
    if (window.Events) {
      window.Events.emit('events:loaded', { count: data.events.length, container });
    }
    
    return data.events;
    
  } catch (err) {
    clearContainerState(container);
    handleError('events', err);
    
    // Show error state in container instead of just toast
    const containerElement = document.querySelector(container);
    if (containerElement) {
      showEmptyState(
        container,
        'Unable to load events. Please check your connection and try again.',
        null,
        {
          type: 'events',
          title: 'Connection Error',
          action: {
            text: 'Retry',
            handler: `loadEvents('${container}')`
          }
        }
      );
    }
    
    return [];
  }
}

/**
 * Load featured/highlighted events
 * @param {string} container - Container selector
 */
export async function loadFeaturedEvents(container = '#featured-events') {
  return loadEvents(container, { filter: 'featured' });
}

/**
 * Load today's events
 * @param {string} container - Container selector
 */
export async function loadTodaysEvents(container = '#todays-events') {
  return loadEvents(container, { filter: 'today' });
}

/**
 * Render events to container
 * @param {Array} events - Array of event objects
 * @param {string} container - Container selector
 */
function renderEvents(events, container) {
  const containerElement = document.querySelector(container);
  if (!containerElement) {
    console.error(`Events container not found: ${container}`);
    return;
  }

  // Enhanced event card rendering with Professional Intelligence Platform styling
  containerElement.innerHTML = events.map(event => `
    <div class="event-card" data-event-id="${event.id}" role="article">
      <div class="event-head">
        <h3 class="title">${escapeHtml(event.title || event.name || 'Untitled Event')}</h3>
        <span class="time">${formatEventTime(event.startDate || event.date)}</span>
      </div>
      
      <div class="row">
        <span class="venue">${escapeHtml(event.venue || event.location || 'TBA')}</span>
        ${event.attendeeCount ? `<span class="attendees">${event.attendeeCount} attending</span>` : ''}
      </div>
      
      ${event.personas && event.personas.length > 0 ? `
        <div class="persona-pills">
          ${event.personas.map(persona => `
            <span class="pill pill-${persona.toLowerCase()}">${persona}</span>
          `).join('')}
        </div>
      ` : ''}
      
      ${event.description ? `
        <p class="event-description">${escapeHtml(event.description.substring(0, 120))}${event.description.length > 120 ? '...' : ''}</p>
      ` : ''}
      
      <div class="cta-row">
        <button class="btn btn-primary" onclick="handleEventAction('${event.id}', 'join')" 
                aria-label="Join ${escapeHtml(event.title || 'event')}">
          ${event.joined ? 'Joined' : 'Join Party'}
        </button>
        ${event.canInvite ? `
          <button class="btn btn-secondary" onclick="handleEventAction('${event.id}', 'invite')"
                  aria-label="Invite others to ${escapeHtml(event.title || 'event')}">
            Invite
          </button>
        ` : ''}
      </div>
    </div>
  `).join('');
  
  // Add event listeners for accessibility
  enhanceEventCards(containerElement);
}

/**
 * Enhance event cards with keyboard navigation and accessibility
 * @param {HTMLElement} container - Container element
 */
function enhanceEventCards(container) {
  const cards = container.querySelectorAll('.event-card');
  
  cards.forEach(card => {
    // Make cards focusable for keyboard navigation
    card.setAttribute('tabindex', '0');
    
    // Add keyboard support
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const primaryButton = card.querySelector('.btn-primary');
        if (primaryButton) {
          primaryButton.click();
        }
      }
    });
    
    // Add hover effects and focus management
    card.addEventListener('mouseenter', () => {
      card.classList.add('hovered');
    });
    
    card.addEventListener('mouseleave', () => {
      card.classList.remove('hovered');
    });
  });
}

/**
 * Handle event actions (join, invite, etc.)
 * @param {string} eventId - Event ID
 * @param {string} action - Action type
 */
window.handleEventAction = async function(eventId, action) {
  try {
    const apiBase = getApiBase();
    
    const res = await fetch(`${apiBase}/api/events/${eventId}/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': '3.1.0'
      }
    });
    
    const data = await handleApiResponse(res, 'events');
    
    if (data.success) {
      // Update UI based on action
      const card = document.querySelector(`[data-event-id="${eventId}"]`);
      if (card && action === 'join') {
        const button = card.querySelector('.btn-primary');
        if (button) {
          button.textContent = 'Joined';
          button.classList.add('joined');
        }
      }
      
      // Show success toast
      if (window.showToast) {
        const messages = {
          join: 'Successfully joined the party!',
          invite: 'Invite sent successfully!',
          leave: 'Left the event',
          save: 'Event saved to your calendar'
        };
        window.showToast(messages[action] || 'Action completed', 'success');
      }
      
      // Emit event for other modules
      if (window.Events) {
        window.Events.emit(`event:${action}`, { eventId, data });
      }
    }
    
  } catch (err) {
    handleError('events', err);
  }
};

/**
 * Get API base URL based on environment
 * @returns {string} API base URL
 */
function getApiBase() {
  return window.location.origin.includes('localhost') 
    ? 'http://localhost:5001/conference-party-app/us-central1'
    : 'https://us-central1-conference-party-app.cloudfunctions.net';
}

/**
 * Format event time for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted time
 */
function formatEventTime(dateString) {
  if (!dateString) return 'TBA';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  } catch (err) {
    return dateString;
  }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Export for use in other modules
export {
  loadFeaturedEvents,
  loadTodaysEvents
};

console.log('✅ Events API module loaded');