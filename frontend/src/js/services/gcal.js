// minimal, solid client for backend-only OAuth
const BASE = '/api/googleCalendar';

export const GCal = {
  isConnected: async () => {
    const r = await fetch(`${BASE}/status`, { credentials: 'include' });
    if (!r.ok) return false;  // Never throws; UI can render CTA
    const j = await r.json().catch(() => ({connected: false}));
    return !!j.connected;
  },
  startOAuth: () => {
    location.assign(`${BASE}/google/start`);
  },
  listEvents: async (range = 'today') => {
    const r = await fetch(`${BASE}/events?range=${encodeURIComponent(range)}`, { 
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    });
    // Return empty array for auth errors instead of throwing
    if (r.status === 401 || r.status === 403) return [];
    if (!r.ok) throw new Error('events_failed');
    return r.json();
  },
  createFromParty: async (party) => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const r = await fetch(`${BASE}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    if (!r.ok) {
      // Surface a clean message instead of throwing raw 403
      const msg = r.status === 401 || r.status === 403
        ? 'Connect Google Calendar to add events'
        : `Calendar error (${r.status})`;
      throw new Error(msg);
    }
    return r.json();
  }
};

export default GCal;