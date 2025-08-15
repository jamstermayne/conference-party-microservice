// gcal-hooks.js — single-button click orchestration
import { create } from './services/gcal.js?v=b037';
import { openProviderModalIfNeeded } from './services/calendar-providers.js?v=b037';
import { toast } from './components/calendar-providers.js?v=b037';

/**
 * Extract event data from button/card
 */
function extractEventData(element) {
  const card = element.closest('.vcard, .card, .party-card, .section-card');
  
  // Try to get data from button attributes first
  const event = {
    title: element.dataset.title || 
           card?.querySelector('.vcard__title, .card-title, .vtitle')?.textContent?.trim() || 
           'Event',
    venue: element.dataset.venue || 
           element.dataset.location ||
           card?.querySelector('.venue, .location, [data-venue]')?.textContent?.replace('📍', '').trim() || 
           '',
    location: element.dataset.venue || element.dataset.location || '',
    start: element.dataset.start || element.dataset.startIso,
    end: element.dataset.end || element.dataset.endIso,
    description: element.dataset.description || 
                 card?.querySelector('.description')?.textContent?.trim() || 
                 'Added from Conference Party',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
  
  // Parse when field if start/end not available
  if (!event.start && element.dataset.when) {
    const when = element.dataset.when;
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
        
        event.start = startDate.toISOString();
        event.end = endDate.toISOString();
        event.startISO = event.start;
        event.endISO = event.end;
      }
    }
  }
  
  // If still no start/end times, use defaults
  if (!event.start) {
    event.start = new Date().toISOString();
    event.end = new Date(Date.now() + 3600000).toISOString(); // +1 hour
  }
  
  return event;
}


export function wireAddToCalendarButtons() {
  document.addEventListener('click', async (e) => {
    // Handle new standardized button selector
    const btn = e.target.closest('.add-to-calendar');
    if (!btn) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Get party ID from button or parent card
    const card = btn.closest('[data-party]');
    const partyId = btn.dataset.partyId || card?.dataset.partyId;
    
    // Get event data
    const eventData = extractEventData(btn);
    eventData.id = partyId;
    
    // Store original button state
    const originalText = btn.textContent;
    const originalDisabled = btn.disabled;
    
    try {
      // 1) Check if user is connected or needs provider selection
      const okToCreate = await openProviderModalIfNeeded(eventData);
      if (!okToCreate) return; // User cancelled or will redirect
      
      // 2) Create the event (Google flow for now; extend inside createEvent if needed)
      btn.disabled = true;
      btn.textContent = 'Adding...';
      
      try {
        await create({
          summary: eventData.title,
          location: eventData.venue || eventData.location,
          description: eventData.description,
          start: eventData.start,
          end: eventData.end,
          timeZone: eventData.timeZone
        });
        toast('✅ Added to your calendar');
        btn.textContent = '✓ Added';
        setTimeout(() => {
          btn.textContent = originalText;
          btn.disabled = originalDisabled;
        }, 2000);
      } catch (err) {
        console.error('[add-to-calendar] Failed to create event:', err);
        toast('Could not add. Try again.', 'error');
        btn.textContent = originalText;
        btn.disabled = originalDisabled;
      }
    } catch (err) {
      console.error('[add-to-calendar] Error:', err);
      toast('Something went wrong. Please try again.', 'error');
    }
  });
  
  // Legacy handler for old data-action="addCalendar" buttons
  document.addEventListener('click', async (e) => {
    const oldBtn = e.target.closest('[data-action="addCalendar"]:not(.add-to-calendar)');
    if (!oldBtn) return;
    
    e.preventDefault();
    
    // Convert to new format and trigger
    oldBtn.classList.add('add-to-calendar');
    if (!oldBtn.dataset.partyId && oldBtn.dataset.id) {
      oldBtn.dataset.partyId = oldBtn.dataset.id;
    }
    oldBtn.click();
  });
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', wireAddToCalendarButtons);
} else {
  wireAddToCalendarButtons();
}

// Listen for OAuth success messages from popup
window.addEventListener('message', (e) => {
  if (e.origin !== location.origin) return;
  
  if (e.data === 'gcal:connected' || e.data?.type === 'gcal:connected') {
    // OAuth successful
    toast('✅ Successfully connected to Google Calendar');
  }
});