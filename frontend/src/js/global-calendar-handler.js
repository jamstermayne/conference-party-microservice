// Global calendar handler - can be imported once in your main app
import { createEvent } from './services/gcal-clean.js?v=b036';

// Make addToCalendar available globally
export async function addToCalendar(ev) {
  // `ev` should include title, start, end, location, description, etc.
  // We delegate to the service which ensures session (OAuth if needed).
  return await createEvent(ev);
}

// Wire up all calendar buttons on the page
export function wireCalendarButtons() {
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-calendar-add]');
    if (!btn) return;
    
    // Get event data from button
    const eventData = btn.dataset.event ? JSON.parse(btn.dataset.event) : btn.__event;
    if (!eventData) return;
    
    // Disable button during operation
    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = 'Adding...';
    
    try {
      await addToCalendar(eventData);
      btn.textContent = '✓ Added';
      setTimeout(() => {
        btn.textContent = originalText;
      }, 2000);
    } catch (error) {
      console.error('Failed to add to calendar:', error);
      btn.textContent = 'Failed';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
      }, 2000);
    }
  });
}

// Auto-wire on import (optional - comment out if you want manual control)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', wireCalendarButtons);
} else {
  wireCalendarButtons();
}

// Export for use in other modules
export default addToCalendar;