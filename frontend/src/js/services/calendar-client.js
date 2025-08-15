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
    this.baseUrl = '/api/calendar';
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
    const { url } = await authed('/api/calendar/google/start');
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
    const { connected, events } = await authed(`/api/calendar/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
    return { connected, events };
  } catch(e){ if (e.status===401) return { connected:false, events:[] }; return { connected:false, events:[] }; }
}

async function addAndSync(p){
  try {
    await authed('/api/calendar/create', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        partyId: p.id, title: p.title, start: p.startISO, end: p.endISO,
        location: p.venue, description: p.description||''
      })
    });
    toast('Saved to your calendar ✓'); markSynced(p.id);
  } catch(e){
    if (e.status===412 && e.body?.error==='not_connected') { return fallbackICS(p); }
    toast('Could not save. Exporting ICS…'); return fallbackICS(p);
  }
}

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  t.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--neutral-300);color:white;padding:12px 20px;border-radius:4px;z-index:9999';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function markSynced(partyId) {
  const el = document.querySelector(`[data-party-id="${partyId}"]`);
  if (el) el.classList.add('synced');
}

function fallbackICS(p) {
  const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:${p.id}@conference-party-app.web.app
SUMMARY:${p.title}
DTSTART:${p.startISO.replace(/[-:]/g,'').replace('.000Z','Z')}
DTEND:${p.endISO.replace(/[-:]/g,'').replace('.000Z','Z')}
LOCATION:${p.venue}
DESCRIPTION:${p.description||''}
END:VEVENT
END:VCALENDAR`;
  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${p.id}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

window.CalendarClient = CalendarClient;
window.connectGoogle = connectGoogle;
window.dayBounds = dayBounds;
window.loadUserEvents = loadUserEvents;
window.addAndSync = addAndSync;
window.fallbackICS = fallbackICS;