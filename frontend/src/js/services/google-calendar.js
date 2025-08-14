// Check connection status
export async function isConnected() {
  try {
    const r = await fetch("/api/googleCalendar/status", { 
      credentials: 'include' 
    });
    const data = await r.json();
    return data.connected || false;
  } catch {
    return false;
  }
}

// Start OAuth flow
export async function startOAuth() {
  const w = 520, h = 620;
  const y = Math.max(0, (window.outerHeight - h) / 2);
  const x = Math.max(0, (window.outerWidth  - w) / 2);
  const popup = window.open("/api/googleCalendar/google/start", "gcal_oauth",
    `width=${w},height=${h},left=${x},top=${y},resizable=yes,scrollbars=yes`);
  if (!popup) alert("Please allow popups to connect Google Calendar.");
  
  // Poll for connection
  const deadline = Date.now() + 90000;
  while (Date.now() < deadline) {
    if (popup.closed) break;
    const connected = await isConnected();
    if (connected) {
      try { popup.close(); } catch {}
      return true;
    }
    await new Promise(r => setTimeout(r, 800));
  }
  return await isConnected();
}

// Ensure connected before operations
async function ensureConnected() {
  const connected = await isConnected();
  if (connected) return true;
  return await startOAuth();
}

// Add event to calendar (with auto-connect)
export async function addToCalendar(evt) {
  // Ensure we're connected first
  const connected = await ensureConnected();
  if (!connected) throw new Error('Not connected to Google Calendar');
  
  const eventData = {
    ...evt,
    timeZone: evt.timeZone || 'Europe/Berlin'
  };
  const res = await fetch("/api/googleCalendar/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: 'include',  // <<< CRITICAL
    body: JSON.stringify(eventData)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.warn("[gcal] create failed", data?.error || res.statusText);
    throw new Error(data?.error || res.statusText);
  }
  console.log("[gcal] created", data);
  return data;
}

// List calendar events
export async function listEvents() {
  const r = await fetch("/api/googleCalendar/events", {
    credentials: 'include'  // <<< CRITICAL
  });
  if (!r.ok) throw new Error("Not authorized or no events");
  return r.json();
}

// Disconnect calendar
export async function disconnect() {
  try {
    const r = await fetch("/api/googleCalendar/disconnect", {
      method: "POST",
      credentials: 'include'  // <<< CRITICAL
    });
    return r.ok;
  } catch {
    return false;
  }
}
