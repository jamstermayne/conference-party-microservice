// --- Status: are we connected? ---
export async function status() {
  try {
    const r = await fetch('/api/googleCalendar/status', { credentials: 'include' });
    return await r.json(); // { connected: boolean, ... }
  } catch {
    return { connected: false };
  }
}

// --- Popup OAuth and wait until session cookie present ---
async function startOAuthInPopup() {
  const w = window.open(
    '/api/googleCalendar/google/start',
    'gcal_oauth',
    'width=550,height=680,menubar=no,toolbar=no,status=no,noopener'
  );
  if (!w) throw new Error('Popup blocked');

  // Poll status until connected or window closed (max ~90s)
  const deadline = Date.now() + 90_000;
  let windowClosed = false;
  
  while (Date.now() < deadline) {
    // Check if window is closed (wrapped to handle COOP restrictions)
    try {
      // Try to access window.closed - may fail due to COOP
      if (w.closed) {
        windowClosed = true;
        break;
      }
    } catch (e) {
      // COOP policy prevents access - check connection status instead
      // The window might be closed, but we can't tell directly
    }
    
    // Check if connected
    const s = await status();
    if (s.connected) {
      try { 
        // Try to close the window - may fail due to COOP
        w.close(); 
      } catch {
        // Window might already be closed or COOP prevents closing
        // Send a message to the popup to close itself
        try {
          w.postMessage({ action: 'close' }, '*');
        } catch {}
      }
      return true;
    }
    
    // If we can't check window.closed due to COOP, rely on status checks
    await new Promise(r => setTimeout(r, 800));
  }
  
  // Try to close if still open
  try { 
    w.close(); 
  } catch {
    // Send message to popup to close itself
    try {
      w.postMessage({ action: 'close' }, '*');
    } catch {}
  }
  
  return (await status()).connected === true;
}

export async function ensureConnected() {
  const s1 = await status();
  if (s1.connected) return true;
  return await startOAuthInPopup();
}

// --- Create calendar event on backend (requires session cookie) ---
export async function createEvent(payload) {
  const ok = await ensureConnected();
  if (!ok) throw new Error('No session');

  const res = await fetch('/api/googleCalendar/create', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',            // <<< IMPORTANT
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || 'Create failed');
  }
  return res.json();
}

// --- Provide the missing export used by calendar-providers.js ---
export async function disconnect() {
  try {
    await fetch('/api/googleCalendar/disconnect', {
      method: 'POST',
      credentials: 'include'
    });
  } catch {}
  // Optional local cleanup if you store anything
  try { localStorage.removeItem('gcal'); } catch {}
}

// --- Convenience exports for compatibility ---
export const isConnected = async () => (await status()).connected;
export const startOAuth = async ({ usePopup = true } = {}) => {
  if (!usePopup) {
    window.location.href = '/api/googleCalendar/google/start';
    return;
  }
  return startOAuthInPopup();
};

// --- List events ---
export async function listEvents(range = 'week') {
  try {
    const r = await fetch(`/api/googleCalendar/events?range=${range}`, {
      credentials: 'include'
    });
    if (!r.ok) return [];
    const data = await r.json();
    return data.events || [];
  } catch {
    return [];
  }
}

// --- Create from party object ---
export async function createFromParty(party) {
  return createEvent({
    summary: party.title || party.summary || 'Event',
    location: party.venue || party.location || '',
    description: party.description || '',
    start: party.startISO || party.start || new Date().toISOString(),
    end: party.endISO || party.end || new Date(Date.now() + 3600000).toISOString(),
    timeZone: party.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
  });
}

// --- Get user info ---
export async function getUser() {
  try {
    const r = await fetch('/api/googleCalendar/user', {
      credentials: 'include'
    });
    if (!r.ok) return null;
    return r.json();
  } catch {
    return null;
  }
}

// Default export for backward compatibility
export default {
  status,
  ensureConnected,
  createEvent,
  disconnect,
  isConnected,
  startOAuth,
  listEvents,
  createFromParty,
  getUser
};