// minimal, solid client for backend-only OAuth
const BASE = '/api/googleCalendar';

export const GCal = {
  isConnected: async () => {
    const r = await fetch(`${BASE}/status`, { credentials: 'include' });
    if (!r.ok) return false;  // Never throws; UI can render CTA
    const j = await r.json().catch(() => ({connected: false}));
    return !!j.connected;
  },
  startOAuth: (usePopup = true) => {
    const authUrl = `${BASE}/google/start`;
    
    if (usePopup) {
      const w = 500;
      const h = 600;
      const y = Math.max(0, (window.outerHeight - h) / 2);
      const x = Math.max(0, (window.outerWidth - w) / 2);
      
      const popup = window.open(authUrl, 'gcal_oauth',
        `width=${w},height=${h},left=${x},top=${y},resizable=yes,scrollbars=yes`);
      
      if (!popup) {
        // Popup blocked, fallback to redirect
        location.assign(authUrl);
        return;
      }
      
      // Return a promise that resolves when auth completes
      return new Promise((resolve, reject) => {
        const messageHandler = (event) => {
          if (event.origin !== location.origin) return;
          if (event.data?.type === 'gcal-auth') {
            window.removeEventListener('message', messageHandler);
            if (event.data.ok) {
              resolve(event.data);
            } else {
              reject(new Error(event.data.error || 'Authentication failed'));
            }
          }
        };
        
        window.addEventListener('message', messageHandler);
        
        // Check if popup is closed
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageHandler);
            reject(new Error('Popup closed'));
          }
        }, 1000);
      });
    } else {
      // Direct redirect
      location.assign(authUrl);
    }
  },
  listEvents: async (range = 'today') => {
    const r = await fetch(`${BASE}/events?range=${encodeURIComponent(range)}`, { 
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    });
    // Return empty array for auth errors instead of throwing
    if (r.status === 401 || r.status === 403) return [];
    if (!r.ok) throw new Error('events_failed');
    const j = await r.json();
    return j.events || [];
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