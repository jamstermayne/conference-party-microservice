/**
 * GOOGLE CALENDAR SERVICE
 * Backend performs OAuth with Google Calendar and stores tokens server-side.
 * Frontend only triggers connect and lists events via your backend.
 */

export async function connect(){
  // Opens a popup to your backend OAuth start; resolves when cookie/session set.
  // Implementation option A: window.open + postMessage handshake
  // Implementation option B (simpler): redirect with '#' return then go back
  const url = '/api/google/connect?return=' + encodeURIComponent(location.href);
  const w = window.open(url, 'gcal', 'width=600,height=700');
  if (!w) throw new Error('Popup blocked');

  return new Promise((resolve, reject)=>{
    const timer = setInterval(()=>{
      if (w.closed) { clearInterval(timer); resolve(true); }
    }, 500);
    // Optional: postMessage handshake for stronger check
    setTimeout(()=> { /* fallback resolve on close */ }, 1000*120);
  });
}

export async function list({ timeMin, timeMax }){
  const r = await fetch(`/api/google/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`, { credentials:'include' });
  if (!r.ok) throw new Error('Google events list failed');
  return r.json(); // [{id,summary,start,end,location,attendees[],sourceHint}]
}

export async function disconnect(){
  const r = await fetch('/api/google/disconnect', { method: 'POST', credentials: 'include' });
  if (!r.ok) throw new Error('Google disconnect failed');
  return r.json();
}

export async function getStatus(){
  const r = await fetch('/api/google/status', { credentials: 'include' });
  if (!r.ok) return { connected: false };
  return r.json(); // { connected: boolean, email?: string, lastSync?: timestamp }
}