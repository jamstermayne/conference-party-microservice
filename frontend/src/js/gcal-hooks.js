// gcal-hooks.js — Smart "Add to Calendar" click handler with auth polling
import { status as getStatus, startOAuth as startOAuthPopup, create as createEvent } from './services/gcal.js?v=b037';

/**
 * Ensure user is authenticated with Google Calendar
 * Uses status polling to handle COOP restrictions
 */
async function ensureAuth() {
  const st = await getStatus();         // { connected: boolean }
  if (st.connected) return true;

  // Start OAuth in popup
  let popup;
  try {
    popup = await startOAuthPopup({ usePopup: true });
  } catch (e) {
    // Popup blocked or failed, fall back to redirect
    await startOAuthPopup({ usePopup: false });
    return false; // Will redirect, won't reach here
  }

  // Poll status until connected (popup may be blocked from closing by COOP)
  const deadline = Date.now() + 120000; // 2 minutes
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 1200));
    try {
      const s = await getStatus();
      if (s.connected) { 
        try { popup?.close?.(); } catch {} // Try to close popup
        return true; 
      }
    } catch (_) {}
    
    // Check if popup was closed by user
    try {
      if (popup && popup.closed) break;
    } catch {
      // COOP may prevent checking closed state
    }
  }
  return false;
}

/**
 * Extract event data from button/card with ISO date handling
 */
function extractEventData(btn) {
  const card = btn.closest('.vcard');
  if (!card) return null;
  
  const id = btn.dataset.id || card?.dataset.partyId;
  
  // Get title from card
  const title = card.querySelector('.vcard__title')?.textContent?.trim() || 'Event';
  
  // Get location from pin button or venue
  const locationEl = card.querySelector('.pin, [data-venue]');
  const location = locationEl?.textContent?.replace(/📍|🏢/g, '').trim() || '';
  
  // Get description
  const description = card.querySelector('.vcard__desc')?.textContent?.trim() || 
                     `${title} at ${location}`;
  
  // Get dates - check for ISO format in dataset
  let startIso = card.dataset.startIso || btn.dataset.startIso;
  let endIso = card.dataset.endIso || btn.dataset.endIso;
  
  // If no ISO dates, try to parse from time display
  if (!startIso) {
    const timeEl = card.querySelector('.meta .i-clock')?.parentElement;
    const timeText = timeEl?.textContent?.trim();
    
    if (timeText) {
      // Parse time range like "09:00 – 18:00"
      const timeMatch = timeText.match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);
      if (timeMatch) {
        const [, startTime, endTime] = timeMatch;
        // Default to next occurrence of the event (you might want to enhance this)
        const today = new Date();
        const [startHour, startMin] = startTime.split(':');
        const [endHour, endMin] = endTime.split(':');
        
        const startDate = new Date(today);
        startDate.setHours(parseInt(startHour), parseInt(startMin), 0, 0);
        
        const endDate = new Date(today);
        endDate.setHours(parseInt(endHour), parseInt(endMin), 0, 0);
        
        // If start time has passed, move to tomorrow
        if (startDate < new Date()) {
          startDate.setDate(startDate.getDate() + 1);
          endDate.setDate(endDate.getDate() + 1);
        }
        
        startIso = startDate.toISOString();
        endIso = endDate.toISOString();
      }
    }
  }
  
  // Default to 1 hour event starting now if no times found
  if (!startIso) {
    const now = new Date();
    startIso = now.toISOString();
    endIso = new Date(now.getTime() + 3600000).toISOString(); // +1 hour
  }
  
  return {
    id,
    summary: title,
    start: startIso,
    end: endIso,
    location,
    description
  };
}


/**
 * Wire up all "Add to Calendar" buttons with smart auth handling
 */
export function wireAddToCalendar(container = document) {
  container.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action="add-to-calendar"]');
    if (!btn) return;
    
    e.preventDefault();
    e.stopPropagation();

    try {
      // Ensure authenticated first
      const ok = await ensureAuth();
      if (!ok) {
        alert('Please complete Google sign-in to continue.');
        return;
      }

      // Extract event data from the card
      const eventData = extractEventData(btn);
      if (!eventData) {
        console.error('[gcal] Could not extract event data');
        alert('Could not get event details.');
        return;
      }

      // Update button state
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Adding...';

      // Create the calendar event
      try {
        await createEvent({
          summary: eventData.summary,
          location: eventData.location,
          description: eventData.description,
          start: eventData.start,
          end: eventData.end,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
        
        btn.textContent = 'Added ✓';
        btn.classList.add('btn-success');
        
        // Reset after 3 seconds
        setTimeout(() => {
          btn.textContent = originalText;
          btn.disabled = false;
          btn.classList.remove('btn-success');
        }, 3000);
      } catch (err) {
        console.error('[gcal] Failed to create event:', err);
        alert('Failed to add to calendar. Please try again.');
        btn.textContent = originalText;
        btn.disabled = false;
      }
    } catch (err) {
      console.error('[gcal] Add error:', err);
      alert('Could not add this to Calendar.');
    }
  });
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => wireAddToCalendar());

// Also wire up any dynamically added content
export default { wireAddToCalendar };