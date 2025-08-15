// gcal-hooks.js — single-button click orchestration
import { status, create, safeClose } from './services/gcal.js?v=b037';
import { showProviderModal, toast } from './components/calendar-providers.js?v=b037';
import { buildIcsAndDownload } from './services/ics.js?v=b037';

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
    // Handle both old and new button selectors
    const btn = e.target.closest('[data-add-to-calendar], [data-action="addCalendar"]');
    if (!btn) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Get event data
    const eventData = extractEventData(btn);
    
    // If there's an __eventData property on a parent element, use that
    const cardElement = btn.closest('[data-event]');
    if (cardElement && cardElement.__eventData) {
      Object.assign(eventData, cardElement.__eventData);
    }
    
    try {
      // Check if already connected to Google
      const s = await status();
      if (s.connected) {
        // Already connected - create event immediately
        const originalText = btn.textContent;
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
          toast('✅ Added to Google Calendar');
          btn.textContent = '✓ Added';
          setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
          }, 2000);
        } catch (err) {
          console.error('Failed to create event:', err);
          toast('Failed to add event. Please try again.', 'error');
          btn.textContent = originalText;
          btn.disabled = false;
        }
        return;
      }
      
      // Not connected → show provider choices
      showProviderModal({
        onGoogle: async () => {
          const popup = window.open(
            '/api/googleCalendar/google/start',
            'gcal',
            'width=550,height=680,noopener'
          );
          
          if (!popup) {
            toast('Please allow popups to connect Google Calendar', 'warning');
            return;
          }
          
          // Show loading state
          toast('Connecting to Google Calendar...', 'info');
          
          // Poll backend status
          const deadline = Date.now() + 90_000;
          let connected = false;
          
          while (Date.now() < deadline && !connected) {
            await new Promise(r => setTimeout(r, 1500));
            
            // Check if popup is still open (wrapped for COOP)
            try {
              if (popup.closed) break;
            } catch {
              // Can't check due to COOP, continue polling
            }
            
            const checkStatus = await status();
            connected = checkStatus.connected;
          }
          
          safeClose(popup);
          
          if (!connected) {
            toast('Google sign-in cancelled', 'info');
            return;
          }
          
          // Now create the event
          try {
            await create({
              summary: eventData.title,
              location: eventData.venue || eventData.location,
              description: eventData.description,
              start: eventData.start,
              end: eventData.end,
              timeZone: eventData.timeZone
            });
            toast('✅ Connected & added to Google Calendar');
          } catch (err) {
            console.error('Failed to create event after OAuth:', err);
            toast('Connected but failed to add event. Please try again.', 'error');
          }
        },
        
        onOutlook: async () => {
          try {
            await buildIcsAndDownload(eventData);
            toast('📥 Downloaded .ics for Outlook');
          } catch (err) {
            console.error('Failed to generate .ics:', err);
            toast('Failed to generate calendar file', 'error');
          }
        },
        
        onM2M: () => {
          // Deep-link to the M2M event landing or generic page if unknown
          const url = eventData.m2mUrl || 'https://www.meettomatch.com/';
          window.open(url, '_blank', 'noopener');
          toast('📋 Opening MeetToMatch - ensure your calendar is connected there');
        }
      });
      
    } catch (err) {
      console.error('Calendar button error:', err);
      toast('Something went wrong. Please try again.', 'error');
    }
  });
  
  // Also handle the old calendar menu buttons (remove them if they exist)
  document.addEventListener('click', (e) => {
    const menuBtn = e.target.closest('[data-action="calendarMenu"], .btn-menu');
    if (menuBtn) {
      e.preventDefault();
      e.stopPropagation();
      // Trigger the main button instead
      const mainBtn = menuBtn.parentElement?.querySelector('[data-action="addCalendar"]');
      if (mainBtn) {
        mainBtn.click();
      }
    }
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