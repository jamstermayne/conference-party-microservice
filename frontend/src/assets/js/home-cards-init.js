/**
 * Initialize home page with modern cards in 2-column layout
 */

import { fetchAll, getPartiesByDate } from './parties-data.js';
import { cardFor } from './cards-lite.js';

async function initHomeCards() {
  // Check if there's a featured events section
  const featuredSection = document.querySelector('.home-section[data-section="featured"]');
  if (!featuredSection) {
    // Create featured section
    const homePanel = document.querySelector('.home-panel') || document.querySelector('#home-panel');
    if (!homePanel) return;
    
    const section = document.createElement('section');
    section.className = 'home-section';
    section.dataset.section = 'featured';
    section.innerHTML = `
      <h2>Featured Events</h2>
      <div class="card-modern-grid" style="grid-template-columns: repeat(2, 1fr);"></div>
    `;
    
    // Insert before parties section if it exists
    const partiesSection = homePanel.querySelector('[data-section="parties"]');
    if (partiesSection) {
      homePanel.insertBefore(section, partiesSection);
    } else {
      homePanel.appendChild(section);
    }
  }
  
  // Load events
  await fetchAll();
  
  // Get today's date
  const today = new Date().toISOString().slice(0, 10);
  
  // Try to get today's events, or the next available date
  let events = await getPartiesByDate(today);
  
  if (!events || events.length === 0) {
    // Get all available dates and find the next one
    const dates = await getAllDates();
    if (dates && dates.length > 0) {
      // Find the next date after today
      const nextDate = dates.find(d => d >= today) || dates[0];
      events = await getPartiesByDate(nextDate);
    }
  }
  
  // Display up to 4 featured events in 2x2 grid
  const grid = document.querySelector('.home-section[data-section="featured"] .card-modern-grid');
  if (grid && events && events.length > 0) {
    const featured = events.slice(0, 4);
    featured.forEach(event => {
      const card = cardFor(event);
      grid.appendChild(card);
    });
  }
}

// Helper to get all dates
async function getAllDates() {
  await fetchAll();
  // This should be exported from parties-data.js
  return window._partiesCache?.dates || [];
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHomeCards);
} else {
  // Delay slightly to ensure other scripts have loaded
  setTimeout(initHomeCards, 500);
}

export { initHomeCards };