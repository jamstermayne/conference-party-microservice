/**
 * Modern Card Component - Conference Party App
 * Token-based, accessible, responsive event cards
 */

import { openICS, openGoogle } from './calendar-lite.js';

/**
 * Creates a modern event card element
 * @param {Object} event - Event data object
 * @returns {HTMLElement} Card element
 */
export function createModernCard(event) {
  const card = document.createElement('article');
  card.className = 'card card--event card--interactive';
  card.setAttribute('role', 'article');
  card.setAttribute('aria-label', `Event: ${event.title || 'Party'}`);
  
  // Format date and time
  const dateObj = event.date ? new Date(event.date) : null;
  const dateStr = dateObj ? dateObj.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  }) : '';
  
  const timeStr = event.time || event.start || '';
  const venue = event.venue || event.location || '';
  const price = event.price || '';
  const description = event.description || '';
  
  // Build card HTML
  card.innerHTML = `
    ${price ? `
      <span class="card__badge ${price.toLowerCase() === 'free' ? 'card__badge--free' : ''}">
        ${price}
      </span>
    ` : ''}
    
    <header class="card__header">
      <div class="card__eyebrow">
        <span class="card__time">${dateStr}</span>
        ${timeStr ? `<span>•</span><span class="card__time">${timeStr}</span>` : ''}
      </div>
      <h3 class="card__title">${event.title || 'Party'}</h3>
      ${venue ? `<p class="card__subtitle card__venue">${venue}</p>` : ''}
    </header>
    
    <div class="card__body">
      ${description ? `
        <p class="card__description">${description}</p>
      ` : ''}
      
      <div class="card__meta">
        ${event.tags && event.tags.length > 0 ? 
          event.tags.map(tag => `
            <span class="card__pill">${tag}</span>
          `).join('') : ''
        }
        ${event.capacity ? `
          <span class="card__pill card__pill--accent">
            ${event.capacity} spots
          </span>
        ` : ''}
      </div>
    </div>
    
    <footer class="card__actions">
      <button 
        class="btn btn--primary"
        data-action="cal-ics"
        aria-label="Add ${event.title} to calendar"
      >
        Add to Calendar
      </button>
      <button 
        class="btn btn--secondary"
        data-action="cal-google"
        aria-label="Add ${event.title} to Google Calendar"
      >
        <svg class="card-modern__icon" style="width: 16px; height: 16px; display: inline-block; margin-right: 4px; vertical-align: -2px;" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.89 2 1.99 2H19c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
        </svg>
        Google
      </button>
    </footer>
  `;
  
  // Add event listeners
  card.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]');
    if (!action) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    if (action.dataset.action === 'cal-ics') {
      openICS(event);
      showFeedback(card, 'Calendar event downloaded!');
    }
    if (action.dataset.action === 'cal-google') {
      openGoogle(event);
      showFeedback(card, 'Opening Google Calendar...');
    }
  }, { passive: false });
  
  // Add keyboard navigation
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const action = e.target.closest('[data-action]');
      if (action) {
        e.preventDefault();
        action.click();
      }
    }
  });
  
  return card;
}

/**
 * Creates a grid container for cards
 * @param {Array} events - Array of event objects
 * @returns {HTMLElement} Grid container with cards
 */
export function createCardGrid(events) {
  const grid = document.createElement('div');
  grid.className = 'card-modern-grid';
  grid.setAttribute('role', 'list');
  
  events.forEach(event => {
    const card = createModernCard(event);
    card.setAttribute('role', 'listitem');
    grid.appendChild(card);
  });
  
  return grid;
}

/**
 * Shows temporary feedback message on card
 * @param {HTMLElement} card - Card element
 * @param {string} message - Feedback message
 */
function showFeedback(card, message) {
  // Remove any existing feedback
  const existingFeedback = card.querySelector('.card-modern__feedback');
  if (existingFeedback) {
    existingFeedback.remove();
  }
  
  // Create feedback element
  const feedback = document.createElement('div');
  feedback.className = 'card-modern__feedback';
  feedback.textContent = message;
  feedback.style.cssText = `
    position: absolute;
    bottom: var(--s-4);
    left: 50%;
    transform: translateX(-50%);
    padding: var(--s-2) var(--s-3);
    background: var(--color-accent);
    color: white;
    border-radius: var(--r-2);
    font-size: 0.875rem;
    font-weight: 500;
    z-index: 10;
    animation: slideUp 300ms ease-out;
  `;
  
  card.appendChild(feedback);
  
  // Remove after 2 seconds
  setTimeout(() => {
    feedback.style.animation = 'fadeOut 300ms ease-out';
    setTimeout(() => feedback.remove(), 300);
  }, 2000);
}

/**
 * Adds loading state to card
 * @param {HTMLElement} card - Card element
 */
export function setCardLoading(card, loading = true) {
  if (loading) {
    card.classList.add('card-modern--loading');
    card.setAttribute('aria-busy', 'true');
  } else {
    card.classList.remove('card-modern--loading');
    card.setAttribute('aria-busy', 'false');
  }
}

/**
 * Updates card with new data
 * @param {HTMLElement} card - Card element
 * @param {Object} event - Updated event data
 */
export function updateCard(card, event) {
  // Add loading state
  setCardLoading(card, true);
  
  // Replace card content
  setTimeout(() => {
    const newCard = createModernCard(event);
    card.innerHTML = newCard.innerHTML;
    setCardLoading(card, false);
  }, 300);
}

/**
 * Initializes card animations and interactions
 */
export function initCardAnimations() {
  // Add CSS for animations if not already present
  if (!document.getElementById('card-modern-animations')) {
    const style = document.createElement('style');
    style.id = 'card-modern-animations';
    style.textContent = `
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
      
      @keyframes fadeOut {
        from {
          opacity: 1;
        }
        to {
          opacity: 0;
        }
      }
      
      /* Entrance animation for cards */
      .card-modern {
        animation: cardEntrance 400ms ease-out;
        animation-fill-mode: both;
      }
      
      @keyframes cardEntrance {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      /* Stagger animation for grid */
      .card-modern-grid .card-modern:nth-child(1) { animation-delay: 0ms; }
      .card-modern-grid .card-modern:nth-child(2) { animation-delay: 50ms; }
      .card-modern-grid .card-modern:nth-child(3) { animation-delay: 100ms; }
      .card-modern-grid .card-modern:nth-child(4) { animation-delay: 150ms; }
      .card-modern-grid .card-modern:nth-child(5) { animation-delay: 200ms; }
      .card-modern-grid .card-modern:nth-child(6) { animation-delay: 250ms; }
      .card-modern-grid .card-modern:nth-child(n+7) { animation-delay: 300ms; }
    `;
    document.head.appendChild(style);
  }
}

// Auto-initialize animations when module loads
initCardAnimations();

// Export for use in other modules
export default {
  createModernCard,
  createCardGrid,
  setCardLoading,
  updateCard,
  initCardAnimations
};