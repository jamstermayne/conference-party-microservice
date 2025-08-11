/**
 * PRODUCTION CALENDAR INTEGRATION
 * Google OAuth connect, Apple/Outlook ICS export, Meet-to-Match integration
 * Background sync triggers and flag management
 * Based on GPT-5 architecture for Professional Intelligence Platform
 */

import Store from './foundation/store.js';
import { Events } from './events.js';

/**
 * Production API base URL
 */
const API_BASE = window.location.origin.includes('localhost') 
  ? 'http://localhost:5001/conference-party-app/us-central1'
  : 'https://us-central1-conference-party-app.cloudfunctions.net';

/** =========================
 *  GOOGLE CALENDAR CONNECT
 *  ========================= */

/**
 * Connect Google Calendar with OAuth flow
 * @returns {Promise<void>}
 */
export async function connectGoogleCalendar() {
  Events.emit('ui:toast', { type: 'info', message: 'Connecting Google Calendar...' });
  
  try {
    const response = await fetch(`${API_BASE}/api/calendar/google/connect`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: Store.get('profile')?.id || 'anonymous'
      })
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    
    // Update calendar connection status in Store
    const currentCalendar = Store.get('calendar') || {};
    Store.set('calendar', {
      ...currentCalendar,
      googleConnected: true,
      meta: { 
        lastSync: Date.now(), 
        ...currentCalendar.meta,
        ...data.meta 
      }
    });
    
    Events.emit('ui:toast', { type: 'success', message: 'Google Calendar connected successfully' });
    
    // Track successful connection with Metrics
    if (window.Metrics) {
      window.Metrics.trackCalendarConnected('google');
    }
    if (window.gtag) {
      gtag('event', 'calendar_connected', {
        'provider': 'google',
        'user_id': Store.get('profile')?.id
      });
    }
    
    // Trigger initial sync
    Events.emit('calendar:google:sync');
    
  } catch (error) {
    console.error('Google Calendar connection failed:', error);
    Events.emit('ui:toast', { 
      type: 'error', 
      message: 'Google Calendar connection failed. Please try again.' 
    });
    
    // Track connection failure
    if (window.gtag) {
      gtag('event', 'calendar_connection_failed', {
        'provider': 'google',
        'error': error.message
      });
    }
  }
}

/** =========================
 *  ICS EXPORT (APPLE / OUTLOOK)
 *  ========================= */

/**
 * Download ICS calendar file for Apple Calendar or Outlook
 * @param {string} target - Target calendar system ('apple' or 'outlook')
 */
export function downloadICS(target = 'apple') {
  const selectedEvents = Store.get('events.selected') || Store.get('selectedEvents') || []; 
  
  if (!selectedEvents.length) {
    Events.emit('ui:toast', { 
      type: 'info', 
      message: 'Select parties to export first.' 
    });
    return;
  }

  // Request server to generate ICS (ensures correct timezones & UID)
  const endpoint = `${API_BASE}/api/calendar/export?target=${encodeURIComponent(target)}`;
  
  fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      events: selectedEvents,
      userId: Store.get('profile')?.id || 'anonymous'
    })
  })
    .then(async (response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = `velocity-${target}-events.ics`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      URL.revokeObjectURL(url);
      
      Events.emit('ui:toast', { 
        type: 'success', 
        message: `${target.charAt(0).toUpperCase() + target.slice(1)} calendar file downloaded` 
      });
      
      // Track successful export with Metrics
      if (window.Metrics) {
        window.Metrics.trackCalendarConnected('ics');
      }
      if (window.gtag) {
        gtag('event', 'calendar_exported', {
          'target': target,
          'event_count': selectedEvents.length,
          'user_id': Store.get('profile')?.id
        });
      }
    })
    .catch((error) => {
      console.error('ICS export failed:', error);
      Events.emit('ui:toast', { 
        type: 'error', 
        message: `${target} calendar export failed. Please try again.` 
      });
      
      // Track export failure
      if (window.gtag) {
        gtag('event', 'calendar_export_failed', {
          'target': target,
          'error': error.message
        });
      }
    });
}

/** =========================
 *  MEET-TO-MATCH INTEGRATION
 *  ========================= */

/**
 * Connect Meet-to-Match calendar integration
 * @returns {Promise<void>}
 */
export async function connectMeetToMatch() {
  try {
    Events.emit('ui:toast', { type: 'info', message: 'Connecting Meet-to-Match...' });
    
    const response = await fetch(`${API_BASE}/api/calendar/m2m/connect`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: Store.get('profile')?.id || 'anonymous'
      })
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    
    // Update calendar connection status
    const currentCalendar = Store.get('calendar') || {};
    Store.set('calendar', {
      ...currentCalendar,
      m2mConnected: true,
      meta: { 
        ...currentCalendar.meta, 
        lastM2M: Date.now(),
        ...data.meta
      }
    });
    
    Events.emit('ui:toast', { type: 'success', message: 'Meet-to-Match connected successfully' });
    
    // Track successful connection with Metrics
    if (window.Metrics) {
      window.Metrics.trackCalendarConnected('m2m');
    }
    if (window.gtag) {
      gtag('event', 'calendar_connected', {
        'provider': 'meet-to-match',
        'user_id': Store.get('profile')?.id
      });
    }
    
    // Kick off background sync
    Events.emit('calendar:m2m:sync');
    
  } catch (error) {
    console.error('Meet-to-Match connection failed:', error);
    Events.emit('ui:toast', { 
      type: 'error', 
      message: 'Meet-to-Match connection failed. Please try again.' 
    });
    
    // Track connection failure
    if (window.gtag) {
      gtag('event', 'calendar_connection_failed', {
        'provider': 'meet-to-match',
        'error': error.message
      });
    }
  }
}

/** =========================
 *  BACKGROUND SYNC HOOKS
 *  ========================= */

/**
 * Sync Google Calendar events
 * @returns {Promise<void>}
 */
async function syncGoogle() {
  try {
    const response = await fetch(`${API_BASE}/api/calendar/google/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: Store.get('profile')?.id || 'anonymous'
      })
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    
    // Update calendar events in Store
    const currentCalendar = Store.get('calendar') || {};
    Store.set('calendar', {
      ...currentCalendar,
      events: data.events || [],
      meta: { 
        ...currentCalendar.meta, 
        lastSync: Date.now(),
        eventCount: data.events?.length || 0
      }
    });
    
    Events.emit('ui:toast', { 
      type: 'success', 
      message: `Google Calendar synced (${data.events?.length || 0} events)` 
    });
    
    // Track successful sync
    if (window.gtag) {
      gtag('event', 'calendar_synced', {
        'provider': 'google',
        'event_count': data.events?.length || 0
      });
    }
    
  } catch (error) {
    console.error('Google Calendar sync failed:', error);
    Events.emit('ui:toast', { 
      type: 'error', 
      message: 'Google Calendar sync failed' 
    });
    
    // Track sync failure
    if (window.gtag) {
      gtag('event', 'calendar_sync_failed', {
        'provider': 'google',
        'error': error.message
      });
    }
  }
}

/**
 * Sync Meet-to-Match calendar data
 * @returns {Promise<void>}
 */
async function syncM2M() {
  try {
    const response = await fetch(`${API_BASE}/api/calendar/m2m/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: Store.get('profile')?.id || 'anonymous'
      })
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    
    // Merge M2M events with existing calendar events
    const currentCalendar = Store.get('calendar') || {};
    const currentEvents = currentCalendar.events || [];
    const mergedEvents = mergeByUID(currentEvents, data.events || []);
    
    Store.set('calendar', {
      ...currentCalendar,
      events: mergedEvents,
      meta: { 
        ...currentCalendar.meta, 
        lastM2M: Date.now(),
        m2mEventCount: data.events?.length || 0
      }
    });
    
    Events.emit('ui:toast', { 
      type: 'success', 
      message: `Meet-to-Match synced (${data.events?.length || 0} events)` 
    });
    
    // Track successful sync
    if (window.gtag) {
      gtag('event', 'calendar_synced', {
        'provider': 'meet-to-match',
        'event_count': data.events?.length || 0
      });
    }
    
  } catch (error) {
    console.error('Meet-to-Match sync failed:', error);
    Events.emit('ui:toast', { 
      type: 'error', 
      message: 'Meet-to-Match sync failed' 
    });
    
    // Track sync failure
    if (window.gtag) {
      gtag('event', 'calendar_sync_failed', {
        'provider': 'meet-to-match',
        'error': error.message
      });
    }
  }
}

/**
 * Merge events by UID, with newer events taking precedence
 * @param {Array} eventsA - First array of events
 * @param {Array} eventsB - Second array of events
 * @returns {Array} Merged array of events
 */
function mergeByUID(eventsA, eventsB) {
  const eventMap = new Map();
  
  // Add events from first array
  eventsA.forEach(event => {
    if (event.uid) {
      eventMap.set(event.uid, event);
    }
  });
  
  // Merge events from second array
  eventsB.forEach(event => {
    if (event.uid) {
      const existing = eventMap.get(event.uid);
      if (existing) {
        // Merge properties, with newer event taking precedence
        eventMap.set(event.uid, { ...existing, ...event });
      } else {
        eventMap.set(event.uid, event);
      }
    }
  });
  
  return Array.from(eventMap.values());
}

/** =========================
 *  EVENT WIRE-UP
 *  ========================= */

// Wire up calendar event handlers
Events.on('calendar:google:connect', connectGoogleCalendar);
Events.on('calendar:ics:download', (eventData) => downloadICS(eventData?.target || 'apple'));
Events.on('calendar:m2m:connect', connectMeetToMatch);
Events.on('calendar:m2m:sync', syncM2M);
Events.on('calendar:google:sync', syncGoogle);

// Export all functions
export {
  syncGoogle,
  syncM2M,
  mergeByUID
};

// Make available globally for backward compatibility
window.CalendarIntegration = {
  connectGoogleCalendar,
  downloadICS,
  connectMeetToMatch,
  syncGoogle,
  syncM2M
};

console.log('✅ Production Calendar Integration loaded');