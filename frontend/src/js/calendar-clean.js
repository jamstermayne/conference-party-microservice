import { GCal } from './services/gcal.js?v=b034';
import { buildICS, downloadICS, outlookDeeplink } from './services/ics.js?v=b034';
import { draftICS } from './services/ggmail-ics.js?v=b034';
import { listEvents as m2mEvents } from '/js/services/m2m.js?v=b034';
import { mountM2MControls, mergeAndDedup } from '/js/m2m-hooks.js?v=b034';

export async function renderCalendar(mount){
  mount.innerHTML = '';
  const connected = await GCal.isConnected().catch(()=>false);
  if (!connected) {
    mount.innerHTML = `
      <section style="margin:24px">
        <h2>Your calendar</h2>
        <p>Connect Google Calendar to see your schedule here and one-click add parties.</p>
        <button class="vbtn primary" id="gcal-connect">Connect Google Calendar</button>
      </section>`;
    document.getElementById('gcal-connect')?.addEventListener('click', GCal.startOAuth);
    return;
  }

  const panel = document.createElement('section');
  panel.style.margin = '24px';
  panel.id = 'cal-root';
  panel.innerHTML = `
    <div id="cal-head" style="display:flex;gap:8px;margin-bottom:12px">
      <button class="vbtn" data-range="today">Today</button>
      <button class="vbtn" data-range="tomorrow">Tomorrow</button>
      <button class="vbtn" data-range="week">This week</button>
    </div>
    <div id="agenda" aria-busy="true"></div>`;
  mount.appendChild(panel);

  async function load(range='today'){
    const el = panel.querySelector('#agenda');
    el.setAttribute('aria-busy','true');
    try {
      // Fetch events from all sources
      const googleEvents = await GCal.listEvents(range);
      
      // Fetch M2M events
      let m2m = [];
      try { 
        const r = await m2mEvents(); 
        m2m = r.connected ? r.events : []; 
      } catch {}
      
      // Merge and deduplicate
      const events = mergeAndDedup(googleEvents, m2m);
      
      el.innerHTML = events.map(ev => `
        <article class="vcard">
          <div class="vcard__head">
            <div class="vcard__title">${ev.summary || ev.title}</div>
            <div class="vcard__badges">
              <span class="vpill ${ev.source === 'm2m' ? 'm2m' : ''}">${ev.source === 'm2m' ? 'MeetToMatch' : 'calendar'}</span>
            </div>
          </div>
          <div class="vmeta">📍 ${ev.location||'—'} • 🕒 ${ev.start}–${ev.end}</div>
          <div class="vactions">
            <button class="vbtn primary" data-add="${ev.id||''}">Google Calendar</button>
            <button class="vbtn" data-outlook='${JSON.stringify({id:ev.id||"", title:ev.summary, location:ev.location, start:ev.start, end:ev.end}).replace(/'/g,"&#39;")}'>Outlook</button>
            <button class="vbtn" data-m2m='${JSON.stringify({id:ev.id||"", title:ev.summary, location:ev.location, start:ev.start, end:ev.end}).replace(/'/g,"&#39;")}'>MeetToMatch (ICS)</button>
            <button class="vbtn" data-email-ics='${JSON.stringify({id:ev.id||"", title:ev.summary, location:ev.location, start:ev.start, end:ev.end}).replace(/'/g,"&#39;")}'>Email ICS</button>
          </div>
        </article>`).join('') || '<p style="color:#9aa7bf">No events.</p>';
    } finally {
      el.removeAttribute('aria-busy');
    }
  }
  panel.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-range]');
    if (btn) load(btn.dataset.range);
  });
  
  // Google Calendar add event
  panel.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-add]');
    if (btn) {
      const now = new Date(); 
      const start = new Date(now); 
      const end = new Date(now); 
      end.setHours(end.getHours()+1);
      await GCal.createFromParty({ 
        title:"Conference Party", 
        start:start.toISOString(), 
        end:end.toISOString(), 
        location:"Kölnmesse", 
        description:"From Conference Party App" 
      });
      btn.textContent = "Added ✓";
    }
  });

  // Outlook deeplink (no auth)
  panel.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-outlook]');
    if (btn) {
      const d = JSON.parse(btn.getAttribute('data-outlook'));
      const url = outlookDeeplink({
        title: d.title,
        body: "From Conference Party App",
        location: d.location || "",
        startISO: new Date(d.start).toISOString(),
        endISO: new Date(d.end).toISOString()
      });
      window.open(url, "_blank", "noopener,noreferrer");
    }
  });

  // MeetToMatch (ICS download)
  panel.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-m2m]');
    if (btn) {
      const d = JSON.parse(btn.getAttribute('data-m2m'));
      const ics = buildICS({
        uid: d.id || undefined,
        title: d.title,
        description: "From Conference Party App",
        location: d.location || "",
        startISO: new Date(d.start).toISOString(),
        endISO: new Date(d.end).toISOString()
      });
      downloadICS(ics, "MeetToMatch-invite.ics");
    }
  });

  // Email ICS via Gmail Draft (user types Microsoft email)
  panel.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-email-ics]');
    if (btn) {
      const to = prompt("Microsoft email to send the .ics to:");
      if (!to) return;
      const d = JSON.parse(btn.getAttribute('data-email-ics'));
      const ics = buildICS({
        uid: d.id || undefined,
        title: d.title,
        description: "From Conference Party App",
        location: d.location || "",
        startISO: new Date(d.start).toISOString(),
        endISO: new Date(d.end).toISOString()
      });
      const r = await draftICS({
        to, 
        subject: `Invite: ${d.title}`,
        html: "<p>Invite attached (.ics). Open in Outlook to add to your calendar.</p>",
        ics, 
        filename: "invite.ics"
      });
      btn.textContent = r.ok ? "Draft ready ✓" : "Email failed";
    }
  });
  
  load();
  
  // Mount M2M controls
  const head = document.getElementById("cal-head");
  mountM2MControls(head);
}

export default { renderCalendar };