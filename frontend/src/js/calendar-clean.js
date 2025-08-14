import { GCal } from './services/gcal.js?v=b032';

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
  panel.innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:12px">
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
      const events = await GCal.listEvents(range);
      el.innerHTML = events.map(ev => `
        <article class="vcard">
          <div class="vcard__head"><div class="vcard__title">${ev.summary}</div></div>
          <div class="vmeta">📍 ${ev.location||'—'} • 🕒 ${ev.start}–${ev.end}</div>
        </article>`).join('') || '<p style="color:#9aa7bf">No events.</p>';
    } finally {
      el.removeAttribute('aria-busy');
    }
  }
  panel.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-range]');
    if (btn) load(btn.dataset.range);
  });
  load();
}

export default { renderCalendar };