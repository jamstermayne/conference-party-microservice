async function authed(url, opts={}) {
  const u = firebase.auth().currentUser;
  const headers = { ...(opts.headers||{}) };
  if (u) headers.Authorization = `Bearer ${await u.getIdToken()}`;
  const r = await fetch(url, { ...opts, headers });
  const j = await r.json().catch(()=> ({}));
  if (!r.ok) throw Object.assign(new Error('api_error'), { status:r.status, body:j });
  return j;
}

class CalendarClient {
  constructor() {
    this.baseUrl = 'https://us-central1-conference-party-app.cloudfunctions.net/api/calendar';
  }

  async getAuthUrl() {
    return authed(`${this.baseUrl}/google/start`);
  }

  async getEvents(from, to) {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return authed(`${this.baseUrl}/events?${params}`);
  }

  async createEvent(partyData) {
    return authed(`${this.baseUrl}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partyData)
    });
  }

  async deleteEvent(partyId) {
    return authed(`${this.baseUrl}/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partyId })
    });
  }
}

async function connectGoogle(){
  try {
    const { url } = await authed('https://us-central1-conference-party-app.cloudfunctions.net/api/calendar/google/start');
    const w = window.open(url + '&state=' + encodeURIComponent(await firebase.auth().currentUser.getIdToken()),
                          '_blank','width=520,height=640');
    if (!w) { alert('Please allow popups to connect Google Calendar.'); return; }
    const t = setInterval(()=>{ if (w.closed){ clearInterval(t); location.reload(); } }, 700);
  } catch(e){ console.warn(e); alert('Could not start Google connect.'); }
}

function dayBounds(d=new Date()) {
  const s = new Date(d); s.setHours(8,0,0,0);
  const e = new Date(d); e.setHours(22,0,0,0);
  return { from: s.toISOString(), to: e.toISOString() };
}

async function loadUserEvents(){
  try {
    const { from, to } = dayBounds();
    const { connected, events } = await authed(`https://us-central1-conference-party-app.cloudfunctions.net/api/calendar/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
    return { connected, events };
  } catch(e){ if (e.status===401) return { connected:false, events:[] }; return { connected:false, events:[] }; }
}

window.CalendarClient = CalendarClient;
window.connectGoogle = connectGoogle;
window.dayBounds = dayBounds;
window.loadUserEvents = loadUserEvents;