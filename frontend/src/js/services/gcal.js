// minimal, solid client for backend-only OAuth
const BASE = '/api/googleCalendar';

export const GCal = {
  isConnected: async () => {
    const r = await fetch(`${BASE}/status`, { credentials: 'include' });
    return r.ok;
  },
  startOAuth: () => {
    location.assign(`${BASE}/google/start`);
  },
  listEvents: async (range = 'today') => {
    const r = await fetch(`${BASE}/events?range=${encodeURIComponent(range)}`, { credentials: 'include' });
    if (!r.ok) throw new Error('events_failed');
    return r.json();
  },
  createFromParty: async (party) => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const r = await fetch(`${BASE}/create`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        summary: party.title,
        location: party.venue,
        start: party.startISO,
        end: party.endISO,
        timeZone: tz,
        privateKey: { partyId: party.id } // for idempotency
      })
    });
    if (!r.ok) throw new Error('create_failed');
    return r.json();
  }
};

export default GCal;