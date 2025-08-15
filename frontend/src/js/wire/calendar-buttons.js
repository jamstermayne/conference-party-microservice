// calendar-buttons.js
function buildEventFromCard(btn) {
  // Find the closest card, pull the data attributes from party card template
  const card = btn.closest('.vcard');
  const title = card?.dataset.title || 'Party';
  const start = card?.dataset.start;      // e.g., "2025-08-21T19:00:00Z"
  const end   = card?.dataset.end;        // e.g., "2025-08-21T22:00:00Z"
  const where = card?.dataset.location || '';
  const desc  = card?.dataset.desc || '';
  return { title, start, end, where, desc };
}

async function status() {
  const r = await fetch('/api/googleCalendar/status', { credentials: 'include' });
  return r.ok ? r.json() : { connected:false };
}

async function createGCal(eventPayload) {
  const r = await fetch('/api/googleCalendar/create', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify(eventPayload),
  });
  if (!r.ok) throw new Error('create-failed');
  return r.json();
}

function openOAuthPopup() {
  // Open synchronously on the click to avoid blockers
  const w = window.open('/api/googleCalendar/google/start', 'gcal_auth', 'popup=yes,width=520,height=680');
  return w;
}

function startOAuthWithFallback() {
  const w = openOAuthPopup();
  if (!w || w.closed) {
    // Popup blocked—fallback to full-page
    window.location.href = '/api/googleCalendar/google/start';
    return null;
  }
  return w;
}

async function ensureGCalConnected() {
  const s = await status();
  if (s.connected) return true;

  // Start OAuth and wait for message or poll
  const popup = startOAuthWithFallback();
  if (!popup) return false; // full-page redirect has taken over

  // Best effort: listen for postMessage from callback
  const ok = await new Promise(resolve => {
    let done = false;
    const timer = setInterval(async () => {
      const st = await status();
      if (st.connected && !done) { done = true; clearInterval(timer); resolve(true); }
    }, 800);
    // Safety timeout
    setTimeout(() => { if (!done) { clearInterval(timer); resolve(false); } }, 90_000);
    window.addEventListener('message', (evt) => {
      if (typeof evt.data === 'string' && evt.data.includes('gcal:connected')) {
        done = true; clearInterval(timer); resolve(true);
      }
    }, { once:true });
  });

  try { popup.close(); } catch {}
  return ok;
}

// Outlook (ICS) helper
function downloadICS(ev) {
  // Minimal ICS content — adjust as needed
  const pad = s => (s < 10 ? '0' + s : s);
  const toICS = iso => {
    const d = new Date(iso);
    return d.getUTCFullYear()
      + pad(d.getUTCMonth()+1) + pad(d.getUTCDate())
      + 'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z';
  };
  const ics =
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Velocity//Conf Parties//EN
BEGIN:VEVENT
UID:${crypto.randomUUID()}
DTSTAMP:${toICS(new Date().toISOString())}
DTSTART:${toICS(ev.start)}
DTEND:${toICS(ev.end || ev.start)}
SUMMARY:${ev.title}
LOCATION:${ev.where || ''}
DESCRIPTION:${ev.desc || ''}
END:VEVENT
END:VCALENDAR`;
  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${(ev.title||'event').replace(/\s+/g,'_')}.ics`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
}

// Meet to Match — open login (you provided the URL)
const M2M_LOGIN = 'https://app.meettomatch.com/cologne2025/site/signin/selector/';

function wireCalendarButtons() {
  document.addEventListener('click', async (e) => {
    const t = e.target.closest('.btn-add-to-calendar, .btn-cal-google, .btn-cal-outlook, .btn-cal-m2m');
    if (!t) return;

    e.preventDefault();
    const ev = buildEventFromCard(t);

    if (t.matches('.btn-add-to-calendar, .btn-cal-google')) {
      // Google path: connect-on-demand then create
      const ok = await ensureGCalConnected();
      if (!ok) return; // redirected or user cancelled
      try {
        await createGCal(ev);
        // Optional: toast
        console.log('✅ Added to Google Calendar');
      } catch {
        console.warn('Create failed; show toast');
      }
    } else if (t.matches('.btn-cal-outlook')) {
      downloadICS(ev);
    } else if (t.matches('.btn-cal-m2m')) {
      window.open(M2M_LOGIN, '_blank', 'noopener');
    }
  });
}

export { wireCalendarButtons };