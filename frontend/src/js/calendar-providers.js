/**
 * Calendar Providers
 * Unified interface for Google Calendar, Outlook (.ics), and Meet to Match
 */

import { status, create, startOAuth, disconnect } from './services/gcal.js?v=b031';

/**
 * Add event to Google Calendar
 * Handles OAuth flow if not connected
 */
export async function addToGoogle(event) {
  try {
    // Check if already connected
    const connected = await status();
    
    if (!connected) {
      // Start OAuth flow with popup
      try {
        await startOAuth({ usePopup: true });
      } catch (error) {
        // If popup blocked, show toast with manual retry
        showToast('Please allow popups to connect Google Calendar', 'warning');
        return { success: false, error: 'Popup blocked' };
      }
    }
    
    // Create the event
    const result = await create(event);
    showToast('Added to Google Calendar', 'success');
    return { success: true, data: result };
    
  } catch (error) {
    console.error('Failed to add to Google Calendar:', error);
    showToast('Failed to add to calendar', 'error');
    return { success: false, error: error.message };
  }
}

/**
 * Generate and download .ics file for Outlook/Apple Calendar
 */
export function addToOutlook(event) {
  try {
    const ics = generateICS(event);
    downloadICS(ics, event.title);
    showToast('Calendar file downloaded', 'success');
    return { success: true, method: 'ics' };
  } catch (error) {
    console.error('Failed to generate ICS:', error);
    showToast('Failed to download calendar file', 'error');
    return { success: false, error: error.message };
  }
}

/**
 * Open Meet to Match with prefilled event details
 */
export function addToM2M(event) {
  try {
    // Build M2M URL with event parameters
    const params = new URLSearchParams({
      name: event.title || '',
      time: event.start || '',
      venue: event.location || event.venue || '',
      description: event.description || ''
    });
    
    const m2mUrl = `https://meettomatch.com/create?${params.toString()}`;
    window.open(m2mUrl, '_blank');
    
    showToast('Opening Meet to Match', 'info');
    return { success: true, method: 'm2m' };
  } catch (error) {
    console.error('Failed to open Meet to Match:', error);
    showToast('Failed to open Meet to Match', 'error');
    return { success: false, error: error.message };
  }
}

/**
 * Generate ICS file content
 */
function generateICS(event) {
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };
  
  const uid = `${Date.now()}@velocity.ai`;
  const now = formatDate(new Date());
  const start = formatDate(event.start || event.startISO);
  const end = formatDate(event.end || event.endISO || new Date(new Date(event.start).getTime() + 2 * 60 * 60 * 1000));
  
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//velocity.ai//Gamescom 2025//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeICS(event.title || 'Event')}`,
    event.location ? `LOCATION:${escapeICS(event.location || event.venue)}` : '',
    event.description ? `DESCRIPTION:${escapeICS(event.description)}` : '',
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean);
  
  return lines.join('\r\n');
}

/**
 * Escape special characters for ICS format
 */
function escapeICS(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

/**
 * Download ICS file
 */
function downloadICS(content, filename = 'event') {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
  // Check if a toast container exists, create if not
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const colors = {
    success: 'linear-gradient(135deg, #27ae60, #2ecc71)',
    error: 'linear-gradient(135deg, #e74c3c, #c0392b)',
    warning: 'linear-gradient(135deg, #f39c12, #f1c40f)',
    info: 'linear-gradient(135deg, #3498db, #2980b9)'
  };
  
  toast.style.cssText = `
    background: ${colors[type] || colors.info};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    font-size: 14px;
    font-weight: 500;
    pointer-events: auto;
    animation: slideInRight 0.3s ease;
    max-width: 300px;
  `;
  
  toast.textContent = message;
  container.appendChild(toast);
  
  // Auto remove after 4 seconds
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Add animation styles if not present
if (!document.querySelector('#calendar-providers-styles')) {
  const style = document.createElement('style');
  style.id = 'calendar-providers-styles';
  style.textContent = `
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// Export Google disconnect for compatibility
export { disconnect };

// Export all providers
export default {
  addToGoogle,
  addToOutlook,
  addToM2M,
  disconnect
};