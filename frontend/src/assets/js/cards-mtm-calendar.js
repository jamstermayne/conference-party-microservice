/**
 * MTM & Calendar Event Card Components
 * Enhanced event cards with calendar integration
 */

import { openICS, openGoogle } from './calendar-lite.js';

/**
 * Creates an MTM-style event card
 * @param {Object} event - Event data
 * @returns {HTMLElement} MTM card element
 */
export function createMTMCard(event) {
  const card = document.createElement('article');
  card.className = 'card-mtm card-mtm--entering';
  card.setAttribute('role', 'article');
  card.setAttribute('aria-label', `Event: ${event.title || 'Conference Event'}`);
  
  // Parse date
  const eventDate = event.date ? new Date(event.date + 'T00:00:00') : new Date();
  const day = eventDate.getDate();
  const month = eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const weekday = eventDate.toLocaleDateString('en-US', { weekday: 'short' });
  
  // Parse time
  const timeStr = event.time || event.start || '';
  const venue = event.venue || event.location || '';
  const price = event.price || '';
  const description = event.description || '';
  const attendees = event.attendees || 0;
  
  // Build card HTML
  card.innerHTML = `
    <!-- Date Block -->
    <div class="card-mtm__date">
      <div class="card-mtm__day">${day}</div>
      <div class="card-mtm__month">${month}</div>
      <div class="card-mtm__weekday">${weekday}</div>
    </div>
    
    <!-- Content Area -->
    <div class="card-mtm__content">
      <div class="card-mtm__header">
        <h3 class="card-mtm__title">${event.title || 'Conference Event'}</h3>
        ${price ? `
          <span class="card-mtm__badge ${price.toLowerCase() === 'free' ? 'card-mtm__badge--free' : ''}">
            ${price}
          </span>
        ` : ''}
      </div>
      
      <div class="card-mtm__meta">
        ${timeStr ? `
          <div class="card-mtm__meta-item">
            <svg class="card-mtm__icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/>
            </svg>
            <span>${timeStr}</span>
          </div>
        ` : ''}
        
        ${venue ? `
          <div class="card-mtm__meta-item">
            <svg class="card-mtm__icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <span>${venue}</span>
          </div>
        ` : ''}
        
        ${attendees > 0 ? `
          <div class="card-mtm__meta-item">
            <svg class="card-mtm__icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
            <span>${attendees} attending</span>
          </div>
        ` : ''}
      </div>
      
      ${description ? `
        <p class="card-mtm__description">${description}</p>
      ` : ''}
    </div>
    
    <!-- Footer Actions -->
    <div class="card-mtm__footer">
      <button 
        class="card-mtm__action card-mtm__action--primary"
        data-action="add-to-calendar"
        aria-label="Add ${event.title} to calendar"
      >
        Add to Calendar
      </button>
      <button 
        class="card-mtm__action"
        data-action="view-details"
        aria-label="View details for ${event.title}"
      >
        Details
      </button>
    </div>
  `;
  
  // Add event listeners
  card.addEventListener('click', handleCardAction.bind(null, event));
  
  // Remove entering animation class after animation completes
  setTimeout(() => card.classList.remove('card-mtm--entering'), 400);
  
  return card;
}

/**
 * Creates a calendar-style event card (compact)
 * @param {Object} event - Event data
 * @returns {HTMLElement} Calendar card element
 */
export function createCalendarCard(event) {
  const card = document.createElement('article');
  card.className = 'card-calendar card-calendar--entering';
  card.setAttribute('role', 'article');
  card.setAttribute('aria-label', `Calendar event: ${event.title}`);
  
  // Parse time
  const startTime = event.start || event.time || '9:00 AM';
  const endTime = event.end || '';
  const duration = event.duration || '1 hour';
  const venue = event.venue || event.location || 'Conference Center';
  const attendees = event.attendees || [];
  
  // Build card HTML
  card.innerHTML = `
    <!-- Time Slot -->
    <div class="card-calendar__time">
      <div class="card-calendar__time-start">${startTime}</div>
      <div class="card-calendar__time-duration">${duration}</div>
    </div>
    
    <!-- Content -->
    <div class="card-calendar__content">
      <h3 class="card-calendar__title">${event.title || 'Event'}</h3>
      
      <div class="card-calendar__location">
        <svg class="card-mtm__icon" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        </svg>
        <span>${venue}</span>
      </div>
      
      ${attendees.length > 0 || event.attendeeCount ? `
        <div class="card-calendar__attendees">
          <div class="card-calendar__avatar-stack">
            ${attendees.slice(0, 3).map((a, i) => `
              <div class="card-calendar__avatar" title="${a.name || 'Attendee'}">
                ${a.initials || a.name?.charAt(0) || 'A'}
              </div>
            `).join('')}
          </div>
          <span class="card-calendar__attendee-count">
            ${event.attendeeCount || attendees.length} attending
          </span>
        </div>
      ` : ''}
    </div>
  `;
  
  // Add click handler
  card.addEventListener('click', () => {
    card.classList.add('card-calendar--selected');
    handleCardAction(event, { target: card });
  });
  
  // Remove animation class
  setTimeout(() => card.classList.remove('card-calendar--entering'), 300);
  
  return card;
}

/**
 * Handle card actions
 */
function handleCardAction(event, e) {
  const action = e.target.closest('[data-action]');
  if (!action) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  switch (action.dataset.action) {
    case 'add-to-calendar':
      openICS(event);
      showFeedback(action, '✓ Added to calendar');
      break;
      
    case 'view-details':
      showEventDetails(event);
      break;
      
    case 'share':
      shareEvent(event);
      break;
      
    default:
      break;
  }
}

/**
 * Show temporary feedback on action
 */
function showFeedback(element, message) {
  const feedback = document.createElement('span');
  feedback.className = 'card-feedback';
  feedback.textContent = message;
  feedback.style.cssText = `
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(-8px);
    padding: var(--s-2) var(--s-3);
    background: var(--color-accent);
    color: white;
    border-radius: var(--r-2);
    font-size: 0.875rem;
    font-weight: 500;
    white-space: nowrap;
    pointer-events: none;
    animation: feedbackPulse 2s ease-out;
    z-index: 1000;
  `;
  
  element.style.position = 'relative';
  element.appendChild(feedback);
  
  setTimeout(() => feedback.remove(), 2000);
}

/**
 * Show event details (placeholder)
 */
function showEventDetails(event) {
  console.log('Show details for:', event.title);
  // This would open a modal or navigate to detail page
}

/**
 * Share event (uses Web Share API if available)
 */
async function shareEvent(event) {
  const shareData = {
    title: event.title,
    text: `Check out this event: ${event.title}`,
    url: window.location.href
  };
  
  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (err) {
      console.log('Share cancelled');
    }
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(`${event.title} - ${window.location.href}`);
    showFeedback(document.activeElement, 'Link copied!');
  }
}

/**
 * Create a grid of MTM cards
 */
export function createMTMGrid(events) {
  const grid = document.createElement('div');
  grid.className = 'card-modern-grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(320px, 1fr))';
  
  events.forEach((event, index) => {
    const card = createMTMCard(event);
    card.style.animationDelay = `${index * 50}ms`;
    grid.appendChild(card);
  });
  
  return grid;
}

/**
 * Create a calendar view with calendar cards
 */
export function createCalendarView(events) {
  const container = document.createElement('div');
  container.className = 'calendar-view';
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: var(--s-2);
    padding: var(--s-4);
  `;
  
  // Group events by time
  const sortedEvents = [...events].sort((a, b) => {
    const timeA = a.start || a.time || '00:00';
    const timeB = b.start || b.time || '00:00';
    return timeA.localeCompare(timeB);
  });
  
  sortedEvents.forEach((event, index) => {
    const card = createCalendarCard(event);
    card.style.animationDelay = `${index * 30}ms`;
    container.appendChild(card);
  });
  
  return container;
}

// Add feedback animation styles
if (!document.getElementById('mtm-calendar-animations')) {
  const style = document.createElement('style');
  style.id = 'mtm-calendar-animations';
  style.textContent = `
    @keyframes feedbackPulse {
      0% {
        opacity: 0;
        transform: translateX(-50%) translateY(0);
      }
      20% {
        opacity: 1;
        transform: translateX(-50%) translateY(-8px);
      }
      80% {
        opacity: 1;
        transform: translateX(-50%) translateY(-8px);
      }
      100% {
        opacity: 0;
        transform: translateX(-50%) translateY(-12px);
      }
    }
    
    .card-calendar--selected {
      background: rgba(107, 123, 255, 0.05);
      border-color: var(--color-accent);
    }
  `;
  document.head.appendChild(style);
}

// Export for use
export default {
  createMTMCard,
  createCalendarCard,
  createMTMGrid,
  createCalendarView
};