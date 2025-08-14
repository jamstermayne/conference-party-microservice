/**
 * Ultra-minimal Google Calendar Service
 */
export const GCal = {
  isConnected: () => fetch('/googleCalendar/status').then(r => r.ok),
  
  startOAuth: () => location.assign('/googleCalendar/google/start'),
  
  listEvents: async (range = 'today') => {
    const r = await fetch(`/googleCalendar/events?range=${range}`);
    if (!r.ok) throw new Error('Failed to fetch events');
    return r.json();
  },
  
  createFromParty: async (party) => {
    const r = await fetch('/googleCalendar/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        summary: party.title,
        location: party.venue,
        start: party.startISO,
        end: party.endISO,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
    });
    if (!r.ok) throw new Error('Failed to create event');
    return r.json();
  }
};

export default GCal;