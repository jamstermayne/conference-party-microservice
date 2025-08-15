// --- Status: are we connected? ---
export async function status() {
  try {
    const r = await fetch('/api/googleCalendar/status', { credentials: 'include' });
    return await r.json(); // { connected: boolean, ... }
  } catch {
    return { connected: false };
  }
}

// --- Popup OAuth with URL builder callback ---
async function startOAuthInPopup(buildAuthUrl) {
  // Open popup synchronously on user gesture
  const width = 560, height = 700;
  const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);
  const features = `popup=yes,noopener=yes,resizable=yes,scrollbars=yes,width=${width},height=${height},left=${left},top=${top}`;
  
  // Open immediately - critical for popup blockers
  const w = window.open('about:blank', 'gcal_oauth', features);
  
  // If blocked, fallback to full-page redirect
  if (!w) {
    const authUrl = buildAuthUrl ? await buildAuthUrl() : '/api/googleCalendar/google/start';
    window.location.assign(authUrl);
    return { connected: false, fallback: true };
  }
  
  // Now set the URL after popup exists
  try {
    const authUrl = buildAuthUrl ? await buildAuthUrl() : '/api/googleCalendar/google/start';
    w.location.href = authUrl;
    return w; // Return window for external polling
  } catch (err) {
    w.close();
    throw new Error('Failed to navigate popup');
  }
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
export const startOAuth = async (e, buildAuthUrl) => {
  // Handle event if provided
  if (e?.preventDefault) {
    e.preventDefault();
  }
  
  // If no buildAuthUrl provided, use default
  if (!buildAuthUrl) {
    buildAuthUrl = async () => '/api/googleCalendar/google/start';
  }
  
  // Open popup synchronously during click event
  const width = 560, height = 700;
  const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);
  const features = `popup=yes,noopener=yes,resizable=yes,scrollbars=yes,width=${width},height=${height},left=${left},top=${top}`;
  
  // CRITICAL: Open immediately on click - no await before this!
  const popup = window.open('about:blank', 'gcal_oauth', features);
  
  // If blocked, fallback to full-page redirect
  if (!popup) {
    const authUrl = await buildAuthUrl();
    window.location.assign(authUrl);
    return;
  }
  
  // Fetch URL and navigate popup
  try {
    const authUrl = await buildAuthUrl();
    popup.location.href = authUrl;
    
    // Poll for completion
    return pollForCompletion(popup);
  } catch (err) {
    popup.close();
    throw err;
  }
};

// Helper to poll for OAuth completion
async function pollForCompletion(popup) {
  const deadline = Date.now() + 90_000;
  
  while (Date.now() < deadline) {
    // Check if window is closed
    try {
      if (popup.closed) {
        break;
      }
    } catch {
      // COOP prevents access
    }
    
    // Check if connected
    const s = await status();
    if (s.connected) {
      try { 
        popup.close(); 
      } catch {
        // Send message to close
        try {
          popup.postMessage({ action: 'close' }, '*');
        } catch {}
      }
      return { connected: true };
    }
    
    await new Promise(r => setTimeout(r, 500));
  }
  
  // Check final status
  const finalStatus = await status();
  return { connected: finalStatus.connected };
}

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