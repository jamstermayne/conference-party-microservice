/**
 * CALENDAR API MODULE  
 * Enhanced calendar sync with error handling for Professional Intelligence Platform
 * Based on GPT-5 architecture
 */

import { handleError, handleApiResponse, withRetry } from '../errors.js';

/**
 * Sync calendar with specified service
 * @param {string} service - Calendar service ('google', 'outlook', 'ics')
 * @param {Object} options - Sync options
 */
export async function syncCalendar(service, options = {}) {
  try {
    // Show loading state if container provided
    if (options.statusContainer) {
      const container = document.querySelector(options.statusContainer);
      if (container) {
        container.innerHTML = `
          <div class="sync-status syncing">
            <div class="sync-spinner"></div>
            <span>Syncing with ${service}...</span>
          </div>
        `;
      }
    }
    
    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}/api/calendar/sync?service=${encodeURIComponent(service)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': '3.1.0'
      },
      body: JSON.stringify({
        service,
        options
      })
    });

    const data = await handleApiResponse(res, 'calendar');

    if (!data.success) {
      throw new Error(data.error || 'Calendar sync failed');
    }
    
    // Update status container with success
    if (options.statusContainer) {
      updateSyncStatus(options.statusContainer, 'success', data);
    }
    
    // Show success toast
    if (window.showToast) {
      window.showToast(`${service} calendar synced successfully!`, 'success');
    }
    
    // Update store with calendar data
    if (window.Store && data.calendarData) {
      window.Store.patch('calendar', data.calendarData);
    }
    
    // Emit success event
    if (window.Events) {
      window.Events.emit('calendar:synced', { service, data });
    }
    
    return data;
    
  } catch (err) {
    // Update status container with error
    if (options.statusContainer) {
      updateSyncStatus(options.statusContainer, 'error', { error: err.message });
    }
    
    handleError('calendar', err);
    throw err;
  }
}

/**
 * Sync Google Calendar with retry mechanism
 * @param {Object} options - Sync options
 */
export async function syncGoogleCalendar(options = {}) {
  return withRetry(
    () => syncCalendar('google', options),
    3,
    2000,
    'calendar'
  );
}

/**
 * Subscribe to ICS calendar feed
 * @param {string} icsUrl - ICS feed URL
 * @param {Object} options - Subscription options
 */
export async function subscribeToICS(icsUrl, options = {}) {
  try {
    if (!icsUrl || !icsUrl.trim()) {
      throw new Error('ICS URL is required');
    }
    
    // Validate URL format
    try {
      new URL(icsUrl);
    } catch {
      throw new Error('Invalid ICS URL format');
    }
    
    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}/api/calendar/ics/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': '3.1.0'
      },
      body: JSON.stringify({
        url: icsUrl,
        options
      })
    });
    
    const data = await handleApiResponse(res, 'calendar');
    
    if (!data.success) {
      throw new Error(data.error || 'ICS subscription failed');
    }
    
    // Show success toast
    if (window.showToast) {
      window.showToast('Calendar subscription added successfully!', 'success');
    }
    
    // Update store
    if (window.Store && data.subscription) {
      const subscriptions = window.Store.get('calendar.subscriptions') || [];
      subscriptions.push(data.subscription);
      window.Store.patch('calendar.subscriptions', subscriptions);
    }
    
    // Emit success event
    if (window.Events) {
      window.Events.emit('calendar:ics-subscribed', { url: icsUrl, data });
    }
    
    return data;
    
  } catch (err) {
    handleError('calendar', err);
    throw err;
  }
}

/**
 * Export events to calendar format
 * @param {Array} eventIds - Array of event IDs to export
 * @param {string} format - Export format ('ics', 'google', 'outlook')
 */
export async function exportEvents(eventIds, format = 'ics') {
  try {
    if (!eventIds || eventIds.length === 0) {
      throw new Error('No events selected for export');
    }
    
    // Show loading toast
    if (window.showToast) {
      window.showToast('Preparing calendar export...', 'info', 2000);
    }
    
    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}/api/calendar/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': '3.1.0'
      },
      body: JSON.stringify({
        eventIds,
        format
      })
    });
    
    const data = await handleApiResponse(res, 'calendar');
    
    if (!data.success) {
      throw new Error(data.error || 'Export failed');
    }
    
    // Handle different export types
    if (format === 'ics' && data.downloadUrl) {
      // Trigger download
      const a = document.createElement('a');
      a.href = data.downloadUrl;
      a.download = data.filename || 'events.ics';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      if (window.showToast) {
        window.showToast('Calendar file downloaded!', 'success');
      }
    } else if ((format === 'google' || format === 'outlook') && data.redirectUrl) {
      // Redirect to external calendar service
      window.open(data.redirectUrl, '_blank');
      
      if (window.showToast) {
        window.showToast(`Opening ${format} calendar...`, 'info');
      }
    }
    
    // Track export for analytics
    if (window.gtag) {
      gtag('event', 'calendar_export', {
        'format': format,
        'event_count': eventIds.length
      });
    }
    
    // Emit export event
    if (window.Events) {
      window.Events.emit('calendar:exported', { eventIds, format, data });
    }
    
    return data;
    
  } catch (err) {
    handleError('calendar', err);
    throw err;
  }
}

/**
 * Update sync status UI
 * @param {string} containerSelector - Status container selector
 * @param {string} status - Status type ('syncing', 'success', 'error')
 * @param {Object} data - Status data
 */
function updateSyncStatus(containerSelector, status, data = {}) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  
  const statusMap = {
    syncing: {
      class: 'syncing',
      icon: '<div class="sync-spinner"></div>',
      message: 'Syncing...'
    },
    success: {
      class: 'success',
      icon: '✅',
      message: `Connected • ${data.found || 0} found • ${data.matched || 0} matched`
    },
    error: {
      class: 'error',
      icon: '❌',
      message: `Sync failed: ${data.error || 'Unknown error'}`
    }
  };
  
  const statusInfo = statusMap[status] || statusMap.error;
  
  container.innerHTML = `
    <div class="sync-status ${statusInfo.class}">
      ${statusInfo.icon}
      <span>${statusInfo.message}</span>
    </div>
  `;
  
  // Add appropriate ARIA attributes
  container.setAttribute('aria-live', 'polite');
  container.setAttribute('role', 'status');
}

/**
 * Get API base URL based on environment
 * @returns {string} API base URL
 */
function getApiBase() {
  return window.location.origin.includes('localhost') 
    ? 'http://localhost:5001/conference-party-app/us-central1'
    : 'https://us-central1-conference-party-app.cloudfunctions.net';
}

/**
 * Check calendar sync status
 * @returns {Promise<Object>} Sync status information
 */
export async function getCalendarStatus() {
  try {
    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}/api/calendar/status`, {
      headers: {
        'X-Client-Version': '3.1.0'
      }
    });
    
    return await handleApiResponse(res, 'calendar');
    
  } catch (err) {
    handleError('calendar', err);
    return { synced: false, services: [] };
  }
}

// Export additional utilities
export {
  syncGoogleCalendar,
  subscribeToICS,
  exportEvents,
  getCalendarStatus
};

console.log('✅ Calendar API module loaded');