// ui/eventCard.js — premium event card renderer (vanilla)
import { Store, Events } from '../state.js';

const SVG = {
  clock: `<svg class="ico" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" opacity=".6"/><path d="M12 7v6l4 2" stroke="currentColor" stroke-linecap="round"/></svg>`,
  pin: `<svg class="ico" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-5.4 7-11a7 7 0 1 0 -14 0c0 5.6 7 11 7 11z" stroke="currentColor"/><circle cx="12" cy="10" r="2.5" stroke="currentColor"/></svg>`,
  users: `<svg class="ico" viewBox="0 0 24 24" fill="none"><path d="M17 21v-1a4 4 0 0 0-4-4h-2a4 4 0 0 0-4 4v1" stroke="currentColor"/><circle cx="12" cy="7" r="3" stroke="currentColor"/></svg>`,
  star: `<svg class="ico" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2L12 16.8l-6.4 4.4 2.4-7.2-6-4.8h7.6L12 2z" stroke="currentColor"/></svg>`,
  heart: `<svg class="ico" viewBox="0 0 24 24" fill="none"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7z" stroke="currentColor"/></svg>`
};

function esc(s){
  return String(s||'').replace(/[&<>"']/g, m => ({ 
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

function minsToStartISO(iso){
  if (!iso) return null;
  const t = new Date(iso).getTime() - Date.now();
  return Math.round(t/60000);
}

function formatEventTime(dateStr) {
  if (!dateStr) return 'TBD';
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function formatCapacity(event) {
  if (event.capacity) return `${event.capacity} capacity`;
  if (event.attendees && event.attendees.length > 0) return `${event.attendees.length} attending`;
  if (event.rsvpCount) return `${event.rsvpCount} RSVPs`;
  return null;
}

export function renderEventCard(ev, { saved = false, badge = null } = {}) {
  if (!ev) return '';
  
  const soonMins = minsToStartISO(ev.start || ev.date);
  const live = soonMins !== null && soonMins > 0 && soonMins <= 60 
    ? `<span class="ev-live">Starts in ${soonMins}m</span>` 
    : '';
  
  const cap = formatCapacity(ev);
  
  // Handle personas - support both object format and array format
  const personas = ev.persona || ev.personas || {};
  const personaArray = Array.isArray(personas) ? personas : [];
  
  let pills = '';
  if (typeof personas === 'object' && !Array.isArray(personas)) {
    const pillsArray = [
      personas.dev ? `<span class="ev-pill dev">${esc(personas.dev)} DEV</span>` : '',
      personas.pub ? `<span class="ev-pill pub">${esc(personas.pub)} PUB</span>` : '',
      personas.inv ? `<span class="ev-pill inv">${esc(personas.inv)} INV</span>` : '',
      personas.sp  ? `<span class="ev-pill sp">${esc(personas.sp)} SP</span>`  : ''
    ].filter(Boolean);
    pills = pillsArray.join('');
  } else if (personaArray.length > 0) {
    pills = personaArray.map(p => {
      const type = (p.type || 'dev').toLowerCase();
      const label = p.label || p.name || type.toUpperCase();
      return `<span class="ev-pill ${type}">${esc(label)}</span>`;
    }).join('');
  }
  
  // Handle event ID - support both id and eventId
  const eventId = ev.id || ev.eventId || 'unknown';
  
  // Format event time
  const timeDisplay = formatEventTime(ev.start || ev.date);
  
  // Handle venue/location
  const venue = ev.venue || ev.location || ev.address || 'TBD';
  
  // Handle description
  const description = ev.description || ev.summary || '';
  
  // Handle badge - could be tier, category, priority, etc.
  const cardBadge = badge || ev.tier || ev.category || ev.priority || null;
  
  return `
  <article class="evcard stagger" data-id="${esc(eventId)}">
    <div class="ev-head">
      <h3 class="ev-title">${esc(ev.title || ev.name || 'Untitled Event')}</h3>
      ${cardBadge ? `<span class="ev-badge">${esc(cardBadge)}</span>` : ''}
    </div>

    <div class="ev-meta">
      <span class="ev-chip">${SVG.clock}${esc(timeDisplay)}</span>
      <span class="ev-chip">${SVG.pin}${esc(venue)}</span>
      ${cap ? `<span class="ev-chip">${SVG.users}${esc(cap)}</span>` : ''}
      ${live}
    </div>

    ${description ? `<p class="ev-desc">${esc(description)}</p>` : ''}

    ${pills ? `<div class="ev-personas">${pills}</div>` : ''}

    <div class="ev-actions">
      <button class="btn ev-btn primary" data-action="rsvp" data-id="${esc(eventId)}">
        RSVP
      </button>
      <button class="btn ev-btn ghost" data-action="save" data-id="${esc(eventId)}">
        ${saved ? 'Saved' : 'Save'}
      </button>
      <button class="btn ev-btn ghost" data-action="share" data-id="${esc(eventId)}">
        Share
      </button>
      <button class="btn ev-btn ghost" data-action="nav" data-id="${esc(eventId)}">
        Navigate
      </button>
    </div>
  </article>`;
}

// Render multiple event cards with stagger animation
export function renderEventGrid(events, options = {}) {
  const { 
    savedIds = [], 
    containerClass = 'event-grid',
    showLoading = false 
  } = options;
  
  if (showLoading) {
    return `<div class="${containerClass} loading">Loading events...</div>`;
  }
  
  if (!events || events.length === 0) {
    return `<div class="${containerClass}"></div>`;
  }
  
  const cardsHtml = events.map((event, index) => {
    const saved = savedIds.includes(event.id || event.eventId);
    const card = renderEventCard(event, { saved });
    
    // Add stagger delay for animation
    return card.replace('class="evcard stagger"', 
      `class="evcard stagger" style="animation-delay: ${index * 50}ms"`);
  }).join('');
  
  return `<div class="${containerClass}">${cardsHtml}</div>`;
}

// Helper function to get saved event IDs from store
export function getSavedEventIds() {
  const savedEvents = Store.get('events.selected') || [];
  return savedEvents.map(event => event.id || event.eventId).filter(Boolean);
}

// Helper function to find event by ID
export function findEventById(events, id) {
  if (!events || !id) return null;
  return events.find(event => (event.id || event.eventId) === id);
}

// Event action handlers
export const eventActions = {
  // Save/unsave event
  toggleSave(eventId, events = []) {
    const event = findEventById(events, eventId) || { id: eventId };
    const selected = Store.get('events.selected') || [];
    const exists = selected.some(e => (e.id || e.eventId) === eventId);
    
    const next = exists 
      ? selected.filter(e => (e.id || e.eventId) !== eventId)
      : [...selected, event];
    
    Store.set('events.selected', next);
    
    // Update button text
    const btn = document.querySelector(`[data-action="save"][data-id="${eventId}"]`);
    if (btn) {
      btn.textContent = exists ? 'Save' : 'Saved';
      
      // Add micro-pulse animation
      btn.classList.add('success-pulse');
      btn.addEventListener('animationend', () => {
        btn.classList.remove('success-pulse');
      }, { once: true });
    }
    
    // Emit events
    Events.emit('ui:toast', {
      type: 'success',
      message: exists ? 'Event removed' : 'Event saved!'
    });
    
    Events.emit('event:saved', { event, saved: !exists });
    
    // Trigger calendar prompt after second save
    if (!exists && next.length === 2 && !Store.get('calendar.googleConnected')) {
      setTimeout(() => Events.emit('calendar:prompt'), 1500);
    }
    
    return !exists;
  },

  // Share event
  share(eventId, events = []) {
    const event = findEventById(events, eventId);
    const title = event ? `${event.title || event.name}` : 'Gamescom Event';
    const venue = event ? ` @ ${event.venue || event.location || 'TBD'}` : '';
    const text = `${title}${venue}`;
    const url = `${window.location.origin}/#/events`;
    
    if (navigator.share) {
      navigator.share({ 
        title: 'Gamescom 2025 Events', 
        text, 
        url 
      }).catch(() => {
        // Fallback to clipboard
        this.copyToClipboard(`${text} - ${url}`);
      });
    } else {
      // Fallback to clipboard
      this.copyToClipboard(`${text} - ${url}`);
    }
    
    // Track sharing
    Events.emit('analytics:track', {
      event: 'event_shared',
      eventId,
      method: navigator.share ? 'native' : 'clipboard'
    });
  },

  // Copy to clipboard fallback
  copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        Events.emit('ui:toast', {
          type: 'success',
          message: 'Link copied to clipboard!'
        });
      });
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      
      Events.emit('ui:toast', {
        type: 'success',
        message: 'Link copied!'
      });
    }
  },

  // RSVP to event
  rsvp(eventId, events = []) {
    Events.emit('events:rsvp', { eventId });
    Events.emit('ui:toast', {
      type: 'info',
      message: 'RSVP feature coming soon!'
    });
    
    // Track RSVP intent
    Events.emit('analytics:track', {
      event: 'event_rsvp_attempted',
      eventId
    });
  },

  // Navigate to event
  navigate(eventId, events = []) {
    const event = findEventById(events, eventId);
    if (event && (event.address || event.venue || event.location)) {
      const location = encodeURIComponent(event.address || event.venue || event.location);
      const url = `https://maps.google.com?q=${location}`;
      window.open(url, '_blank');
      
      Events.emit('analytics:track', {
        event: 'event_navigation_opened',
        eventId
      });
    } else {
      Events.emit('ui:toast', {
        type: 'warning',
        message: 'Location not available for this event'
      });
    }
  }
};

export default {
  renderEventCard,
  renderEventGrid,
  getSavedEventIds,
  findEventById,
  eventActions
};