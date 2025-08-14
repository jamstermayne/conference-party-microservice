// Dead simple Google Calendar integration - server-side OAuth only
const BASE = '/api/googleCalendar';

const ORIGIN =
  location.origin.includes('web.app')
    ? 'https://conference-party-app.web.app'
    : location.origin;

export const GCal = {
  // Check if connected
  isConnected: async () => {
    try {
      const r = await fetch(`${BASE}/status`, { 
        credentials: 'include' 
      });
      const data = await r.json();
      return data.connected || false;
    } catch {
      return false;
    }
  },

  // Start OAuth flow - popup or redirect
  startOAuth: async ({ usePopup = false } = {}) => {
    const url = `${BASE}/google/start`;
    if (!usePopup) {
      location.href = url;
      return;
    }

    const popup = window.open(url, 'gcal_oauth', 'width=600,height=700');
    if (!popup) throw new Error('Popup blocked');

    return new Promise((resolve, reject) => {
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          cleanup();
          reject(new Error('Popup closed'));
        }
      }, 500);

      function onMsg(ev) {
        if (ev.origin !== ORIGIN) return;
        const d = ev.data || {};
        if (d.type === 'gcal:connected') {
          cleanup();
          resolve(true);
        } else if (d.type === 'gcal:error') {
          cleanup();
          reject(new Error(d.reason || 'OAuth failed'));
        }
      }

      function cleanup() {
        clearInterval(checkClosed);
        window.removeEventListener('message', onMsg);
        try { popup.close(); } catch {}
      }

      window.addEventListener('message', onMsg);
    });
  },

  // List calendar events
  listEvents: async (range = 'week') => {
    try {
      const r = await fetch(`${BASE}/events?range=${range}`, { 
        credentials: 'include' 
      });
      if (!r.ok) return [];
      const data = await r.json();
      return data.events || [];
    } catch {
      return [];
    }
  },

  // Create event from party
  createFromParty: async (party) => {
    const r = await fetch(`${BASE}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        summary: party.title,
        location: party.venue || party.location,
        description: party.description || '',
        start: party.startISO || party.start,
        end: party.endISO || party.end,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
    });
    
    if (!r.ok) {
      throw new Error('Failed to create event');
    }
    
    return r.json();
  },

  // Disconnect calendar
  disconnect: async () => {
    const r = await fetch(`${BASE}/disconnect`, {
      method: 'POST',
      credentials: 'include'
    });
    return r.ok;
  },

  // Get user info
  getUser: async () => {
    try {
      const r = await fetch(`${BASE}/user`, {
        credentials: 'include'
      });
      if (!r.ok) return null;
      return r.json();
    } catch {
      return null;
    }
  }
};

// Re-export individual functions for tree-shaking
export const { isConnected, startOAuth, listEvents, createFromParty, disconnect, getUser } = GCal;

export default GCal;