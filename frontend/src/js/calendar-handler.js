/**
 * Global Calendar Handler
 * Handles all "Add to Calendar" actions throughout the app
 */
import SmartCalendar from './services/calendar-smart.js?v=b030';

// Initialize calendar handler
function initCalendarHandler() {
  // Listen for calendar button clicks globally
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action="addCalendar"]');
    if (!btn) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Extract event data from button attributes
    const eventData = {
      id: btn.dataset.id,
      title: btn.dataset.title || 'Event',
      location: btn.dataset.venue || '',
      description: btn.dataset.description || '',
      startTime: btn.dataset.start || new Date().toISOString(),
      endTime: btn.dataset.end || new Date(Date.now() + 3600000).toISOString()
    };
    
    // Parse when field if start/end not available
    if (!btn.dataset.start && btn.dataset.when) {
      const when = btn.dataset.when;
      // Try to parse time from when field (e.g., "Aug 21, 19:00-23:00")
      const timeMatch = when.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        const [, startHour, startMin, endHour, endMin] = timeMatch;
        const dateMatch = when.match(/(\w+)\s+(\d+)/);
        if (dateMatch) {
          const [, month, day] = dateMatch;
          const year = new Date().getFullYear();
          const monthNum = new Date(Date.parse(month + " 1, 2025")).getMonth();
          
          const startDate = new Date(year, monthNum, parseInt(day), parseInt(startHour), parseInt(startMin));
          const endDate = new Date(year, monthNum, parseInt(day), parseInt(endHour), parseInt(endMin));
          
          eventData.startTime = startDate.toISOString();
          eventData.endTime = endDate.toISOString();
        }
      }
    }
    
    // Update button state
    const originalText = btn.textContent;
    btn.textContent = 'Adding...';
    btn.disabled = true;
    
    try {
      const result = await SmartCalendar.addToCalendar(eventData);
      
      if (result.success) {
        btn.textContent = '✓ Added';
        btn.classList.add('success');
        
        // Track analytics
        if (window.gtag) {
          gtag('event', 'calendar_add', {
            event_id: eventData.id,
            method: result.method
          });
        }
        
        // Reset after delay
        setTimeout(() => {
          btn.textContent = originalText;
          btn.classList.remove('success');
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to add to calendar:', error);
      btn.textContent = 'Failed';
      btn.classList.add('error');
      
      // Reset after delay
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
        btn.classList.remove('error');
      }, 2000);
    }
  });
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCalendarHandler);
} else {
  initCalendarHandler();
}

// Export for manual initialization if needed
export { initCalendarHandler, SmartCalendar };