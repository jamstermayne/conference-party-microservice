// Production Calendar: Google OAuth, ICS export, Meet-to-Match
import Store from './store.js';
import Events from './events.js';

// Calendar API (simulated for now as backend doesn't have these endpoints yet)
async function api(path, method = 'GET', body) {
  try {
    // For now, simulate calendar operations locally
    if (path.includes('/calendar')) {
      return simulateCalendarAPI(path, method, body);
    }
    
    const response = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('Calendar API Error:', error);
    throw error;
  }
}

// Simulate calendar API responses
function simulateCalendarAPI(path, method, body) {
  if (path.includes('/google/connect')) {
    Store.patch('calendar.googleConnected', true);
    return Promise.resolve({ connected: true });
  }
  
  if (path.includes('/google/sync')) {
    const events = Store.get('events') || [];
    return Promise.resolve({ events, synced: true });
  }
  
  if (path.includes('/m2m/connect')) {
    Store.patch('calendar.m2mConnected', true);
    return Promise.resolve({ connected: true });
  }
  
  if (path.includes('/m2m/sync')) {
    return Promise.resolve({ events: [], synced: true });
  }
  
  return Promise.resolve({});
}

// Connect Google Calendar
export async function connectGoogleCalendar() {
  Events.emit('ui:toast', { type: 'info', message: 'Connecting Google Calendar...' });
  
  try {
    // In production, this would OAuth flow
    // For now, simulate connection
    await api('/api/calendar/google/connect', 'POST');
    
    Store.patch('calendar', {
      googleConnected: true,
      meta: {
        ...Store.get('calendar.meta'),
        lastSync: Date.now()
      }
    });
    
    Events.emit('ui:toast', { type: 'success', message: 'Google Calendar connected' });
    Events.emit('calendar:google:sync');
    
    return { success: true };
  } catch (error) {
    Events.emit('ui:toast', { type: 'error', message: 'Failed to connect Google Calendar' });
    throw error;
  }
}

// Sync Google Calendar
export async function syncGoogle() {
  try {
    const data = await api('/api/calendar/google/sync');
    
    Store.patch('calendar', {
      events: data.events,
      meta: {
        ...Store.get('calendar.meta'),
        lastSync: Date.now()
      }
    });
    
    Events.emit('ui:toast', { type: 'success', message: 'Calendar synced' });
    return data;
  } catch (error) {
    Events.emit('ui:toast', { type: 'error', message: 'Sync failed' });
    throw error;
  }
}

// Export calendar as ICS file
export function exportICS(target = 'apple') {
  const selected = Store.get('events.selected') || Store.get('events') || [];
  
  if (!selected.length) {
    Events.emit('ui:toast', { type: 'info', message: 'No events to export' });
    return;
  }
  
  // Generate ICS content
  const icsContent = generateICS(selected, target);
  
  // Create download
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `gamescom-2025-${target}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  Events.emit('ui:toast', { type: 'success', message: 'Calendar exported' });
}

// Generate ICS file content
function generateICS(events, target) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Conference Party App//Gamescom 2025//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Gamescom 2025 Parties`,
    `X-WR-CALDESC:Exclusive party events for Gamescom 2025`
  ];
  
  events.forEach(event => {
    const uid = event.id || crypto.randomUUID();
    const start = formatICSDate(event.start || event.date);
    const end = formatICSDate(event.end || addHours(event.start || event.date, 3));
    
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}@conference-party-app.web.app`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${escapeICS(event.title || event.name)}`,
      `DESCRIPTION:${escapeICS(event.description || '')}`,
      `LOCATION:${escapeICS(event.venue || event.location || '')}`,
      `URL:${event.url || ''}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  });
  
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

// Format date for ICS
function formatICSDate(date) {
  const d = new Date(date);
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

// Add hours to date
function addHours(date, hours) {
  const d = new Date(date);
  d.setHours(d.getHours() + hours);
  return d;
}

// Escape ICS special characters
function escapeICS(str) {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

// Connect Meet-to-Match
export async function connectMeetToMatch() {
  try {
    await api('/api/calendar/m2m/connect', 'POST');
    
    Store.patch('calendar', {
      m2mConnected: true,
      meta: {
        ...Store.get('calendar.meta'),
        lastM2M: Date.now()
      }
    });
    
    Events.emit('ui:toast', { type: 'success', message: 'Meet-to-Match connected' });
    Events.emit('calendar:m2m:sync');
    
    return { success: true };
  } catch (error) {
    Events.emit('ui:toast', { type: 'error', message: 'Failed to connect Meet-to-Match' });
    throw error;
  }
}

// Sync Meet-to-Match
export async function syncM2M() {
  try {
    const data = await api('/api/calendar/m2m/sync');
    const current = Store.get('calendar.events') || [];
    const merged = mergeByUID(current, data.events || []);
    
    Store.patch('calendar', {
      events: merged,
      meta: {
        ...Store.get('calendar.meta'),
        lastM2M: Date.now()
      }
    });
    
    Events.emit('ui:toast', { type: 'success', message: 'Meet-to-Match synced' });
    return { events: merged };
  } catch (error) {
    Events.emit('ui:toast', { type: 'error', message: 'M2M sync failed' });
    throw error;
  }
}

// Merge events by UID
function mergeByUID(a, b) {
  const map = new Map(a.map(e => [e.uid || e.id, e]));
  b.forEach(e => map.set(e.uid || e.id, { ...map.get(e.uid || e.id), ...e }));
  return Array.from(map.values());
}

// Add event to calendar
export function addToCalendar(event, method = 'google') {
  if (method === 'google' && Store.get('calendar.googleConnected')) {
    // Add to Google Calendar
    Events.emit('calendar:google:add', event);
    Events.emit('ui:toast', { type: 'success', message: 'Added to Google Calendar' });
  } else if (method === 'apple') {
    // Export single event as ICS
    exportICS('apple');
  } else {
    // Show calendar options
    Events.emit('calendar:options', { event });
  }
}

// Calendar UI component
export function renderCalendarButton(event) {
  return `
    <button class="btn btn-secondary calendar-btn" data-event-id="${event.id}">
      <span class="icon">📅</span>
      Add to Calendar
    </button>
  `;
}

// Listen for calendar events
Events.on('calendar:google:connect', connectGoogleCalendar);
Events.on('calendar:google:sync', syncGoogle);
Events.on('calendar:ics:export', ({ target }) => exportICS(target || 'apple'));
Events.on('calendar:m2m:connect', connectMeetToMatch);
Events.on('calendar:m2m:sync', syncM2M);

// Handle calendar button clicks
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.calendar-btn');
  if (!btn) return;
  
  const eventId = btn.dataset.eventId;
  const events = Store.get('events') || [];
  const event = events.find(e => e.id === eventId);
  
  if (event) {
    addToCalendar(event);
  }
});

// Initialize calendar state
document.addEventListener('DOMContentLoaded', () => {
  // Check calendar connection status
  const googleConnected = Store.get('calendar.googleConnected');
  const m2mConnected = Store.get('calendar.m2mConnected');
  
  if (googleConnected || m2mConnected) {
    console.log('✅ Calendar integrations ready');
  }
});

// Export API
export default {
  connectGoogleCalendar,
  syncGoogle,
  exportICS,
  connectMeetToMatch,
  syncM2M,
  addToCalendar,
  renderCalendarButton
};