// calendar-providers.js — provider selection service
import { status } from './gcal.js?v=b037';
import { showProviderModal } from '../components/calendar-providers.js?v=b037';
import { buildIcsAndDownload } from './ics.js?v=b037';

/**
 * Single entry point for calendar provider selection
 * Returns true if we should proceed with event creation, false otherwise
 * 
 * @param {Object} eventData - The event data to add to calendar
 * @returns {Promise<boolean>} - true if Google is connected or user made a choice, false if cancelled
 */
export async function openProviderModalIfNeeded(eventData) {
  try {
    // Check if already connected to Google Calendar
    const gcalStatus = await status();
    if (gcalStatus.connected) {
      // Already connected to Google, proceed immediately
      return true;
    }
  } catch (err) {
    console.warn('Could not check Google Calendar status:', err);
  }
  
  // Not connected, show provider modal and wait for user choice
  return new Promise((resolve) => {
    showProviderModal({
      onGoogle: async () => {
        // User chose Google - initiate OAuth flow
        // Store event data for after OAuth completes
        if (eventData) {
          sessionStorage.setItem('pendingCalendarEvent', JSON.stringify(eventData));
        }
        
        // Redirect to Google OAuth
        window.location.href = '/api/gcal/connect';
        
        // Won't reach here due to redirect, but resolve false for clarity
        resolve(false);
      },
      
      onOutlook: async () => {
        // User chose Outlook - download ICS file
        if (eventData) {
          try {
            await buildIcsAndDownload(eventData);
            resolve(true); // Successfully downloaded ICS
          } catch (err) {
            console.error('Failed to generate ICS:', err);
            resolve(false); // Failed to generate ICS
          }
        } else {
          resolve(false); // No event data provided
        }
      },
      
      onM2M: () => {
        // User chose Meet to Match
        // For now, just open M2M site (extend this when M2M API is ready)
        const m2mUrl = eventData?.m2mUrl || 'https://www.meettomatch.com/';
        window.open(m2mUrl, '_blank', 'noopener');
        resolve(true); // Consider this successful
      }
    });
    
    // If modal is closed without selection, resolve false
    // This is handled by the modal's close button/backdrop click
    // We can add a timeout or additional handling here if needed
  });
}

/**
 * Check if there's a pending event after OAuth redirect
 * Call this on page load to complete interrupted calendar additions
 */
export async function checkPendingCalendarEvent() {
  const pendingEvent = sessionStorage.getItem('pendingCalendarEvent');
  if (!pendingEvent) return;
  
  try {
    const eventData = JSON.parse(pendingEvent);
    sessionStorage.removeItem('pendingCalendarEvent');
    
    // Check if now connected to Google
    const gcalStatus = await status();
    if (gcalStatus.connected) {
      // Create the event that was pending
      const { create } = await import('./gcal.js?v=b037');
      await create({
        summary: eventData.title,
        location: eventData.venue || eventData.location,
        description: eventData.description,
        start: eventData.start,
        end: eventData.end,
        timeZone: eventData.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
      });
      
      // Show success message
      const { toast } = await import('../components/calendar-providers.js?v=b037');
      toast('✅ Event added to Google Calendar');
    }
  } catch (err) {
    console.error('Failed to create pending event:', err);
  }
}

// Auto-check for pending events on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Small delay to ensure Google auth is initialized
    setTimeout(checkPendingCalendarEvent, 1000);
  });
}