/**
 * Minimal Google Calendar Service
 * Clean interface to backend OAuth endpoints
 */

export const GCal = {
  /**
   * Check if user has connected Google Calendar
   */
  isConnected: async () => {
    try {
      const response = await fetch('/googleCalendar/status');
      return response.ok;
    } catch {
      return false;
    }
  },

  /**
   * Start OAuth flow (full page redirect)
   */
  startOAuth: () => {
    // Store current location to return after auth
    sessionStorage.setItem('calendar_return', window.location.hash);
    location.assign('/googleCalendar/google/start');
  },

  /**
   * List calendar events
   * @param {string} range - 'today', 'tomorrow', or 'week'
   */
  listEvents: async (range = 'today') => {
    const response = await fetch(`/googleCalendar/events?range=${range}`);
    if (!response.ok) throw new Error('events_failed');
    return response.json();
  },

  /**
   * Create calendar event from party data
   * @param {Object} party - Party object with title, venue, dates
   */
  createFromParty: async (party) => {
    const response = await fetch('/googleCalendar/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        summary: party.title,
        location: party.venue,
        start: party.startISO || party.start,
        end: party.endISO || party.end,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        privateKey: { partyId: party.id }
      })
    });
    if (!response.ok) throw new Error('create_failed');
    return response.json();
  },

  /**
   * Disconnect calendar (optional)
   */
  disconnect: async () => {
    try {
      const response = await fetch('/googleCalendar/disconnect', {
        method: 'POST'
      });
      return response.ok;
    } catch {
      return false;
    }
  }
};

// Handle OAuth callback return
if (window.location.search.includes('calendar=connected')) {
  const returnHash = sessionStorage.getItem('calendar_return') || '#calendar';
  sessionStorage.removeItem('calendar_return');
  window.history.replaceState({}, '', window.location.pathname + returnHash);
}

export default GCal;