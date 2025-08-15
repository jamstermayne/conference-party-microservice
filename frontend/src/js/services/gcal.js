// Must use relative endpoints so hosting rewrites → Functions (no CSP wildcards)
export async function ensureGoogleSession({ popupWindow } = {}) {
  // Start backend OAuth (opens in provided window)
  if (popupWindow) popupWindow.location = '/api/googleCalendar/google/start';
  // Poll session status
  const ok = await waitFor(() => fetch('/api/googleCalendar/status').then(r => r.json()).then(j => j.connected), 12000);
  if (!ok) throw new Error('OAuth not completed');
}

export async function addToCalendar(party, { popupWindow } = {}) {
  const res = await fetch('/api/googleCalendar/create', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ event: party })
  });
  if (!res.ok) throw new Error('Create failed');
  if (popupWindow && !popupWindow.closed) popupWindow.close();
}

async function waitFor(fn, timeout = 10000, interval = 400) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    try { if (await fn()) return true; } catch {}
    await new Promise(r => setTimeout(r, interval));
  }
  return false;
}

// Additional compatibility exports for existing wire-calendar.js
export const isConnected = async () => {
  try {
    const r = await fetch('/api/googleCalendar/status', { credentials: 'include' });
    const data = await r.json();
    return data.connected || false;
  } catch {
    return false;
  }
};

export const startOAuth = async ({ usePopup = true } = {}) => {
  const url = '/api/googleCalendar/google/start';
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

    function cleanup() {
      clearInterval(checkClosed);
      try { popup.close(); } catch {}
    }

    // Simple polling approach - check status every 2 seconds
    const checkStatus = setInterval(async () => {
      try {
        const connected = await isConnected();
        if (connected) {
          cleanup();
          clearInterval(checkStatus);
          resolve(true);
        }
      } catch {}
    }, 2000);

    // Cleanup after timeout
    setTimeout(() => {
      cleanup();
      clearInterval(checkStatus);
      reject(new Error('OAuth timeout'));
    }, 60000);
  });
};

export const createFromParty = async (party) => {
  const res = await fetch('/api/googleCalendar/create', {
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
  
  if (!res.ok) {
    throw new Error('Failed to create event');
  }
  
  return res.json();
};

// Legacy exports for backward compatibility
export const disconnect = async () => {
  const r = await fetch('/api/googleCalendar/disconnect', {
    method: 'POST',
    credentials: 'include'
  });
  return r.ok;
};