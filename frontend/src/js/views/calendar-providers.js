// views/calendar-providers.js
import { isConnected, startOAuth, disconnect } from '../services/gcal-clean.js?v=b030';
import { createIcsFileForNextEvent } from '../services/ics.js?v=b030';

export async function renderCalendar(mount){
  mount.innerHTML = `
    <h1>Your calendar</h1>
    <p>Connect a provider so you can see your schedule here and one-click add parties.</p>
    <div class="provider-grid" id="providerGrid">
      ${cardGoogle({ connected:false })}
      ${cardMicrosoft()}
      ${cardMeetToMatch()}
    </div>
  `;
  try {
    const connected = await isConnected();
    const n = mount.querySelector('#card-google');
    n.outerHTML = cardGoogle({ connected });
    wireGoogle(mount);
  } catch(e){ wireGoogle(mount); }
  wireMicrosoft(mount);
  wireM2M(mount);
}

/* --- Cards --- */
function cardGoogle({connected}) {
  return `
  <div class="provider-card ${connected ? 'connected':''}" id="card-google">
    <div class="title">🟣 Google Calendar</div>
    <div class="subtitle">${connected ? 'Connected' : 'Not connected'}</div>
    <div class="actions">
      ${connected
        ? `<button class="btn btn-secondary" id="g-disconnect">Disconnect</button>`
        : `<button class="btn btn-primary" id="g-connect">Connect Google</button>`
      }
    </div>
  </div>`;
}
function cardMicrosoft(){
  return `
  <div class="provider-card" id="card-ms">
    <div class="title">🟦 Microsoft / Outlook</div>
    <div class="subtitle">Two quick options</div>
    <div class="actions">
      <button class="btn btn-secondary" id="ms-open-web">Open Outlook Web</button>
      <button class="btn" id="ms-download-ics">Download .ics</button>
    </div>
  </div>`;
}
function cardMeetToMatch(){
  return `
  <div class="provider-card" id="card-m2m">
    <div class="title">🟣 MeetToMatch</div>
    <div class="subtitle">Keep your M2M schedule in sync with saved parties</div>
    <div class="actions">
      <button class="btn btn-secondary" id="m2m-open">Open MeetToMatch</button>
      <button class="btn" id="m2m-help">How it works</button>
    </div>
  </div>`;
}

/* --- Wiring --- */
function wireGoogle(root){
  const connect = root.querySelector('#g-connect');
  const disconnectBtn = root.querySelector('#g-disconnect');
  if (connect) {
    connect.addEventListener('click', async () => {
      try {
        await startOAuth({ usePopup: true });
        location.reload();
      } catch(e) {
        console.warn('OAuth failed:', e);
      }
    });
  }
  if (disconnectBtn) {
    disconnectBtn.addEventListener('click', async () => {
      try { 
        await disconnect(); 
        location.reload(); 
      } catch(e) { 
        console.warn(e); 
      }
    });
  }
}
function wireMicrosoft(root){
  const toWeb = root.querySelector('#ms-open-web');
  const dlIcs = root.querySelector('#ms-download-ics');
  if (toWeb) toWeb.addEventListener('click', () =>
    window.open('https://outlook.live.com/calendar/0/view/month', '_blank', 'noopener')
  );
  if (dlIcs) dlIcs.addEventListener('click', async () => {
    try {
      const url = await createIcsFileForNextEvent(); // implement in services/ics.js
      window.location.href = url;
    } catch(e){ alert('Could not generate .ics yet.'); }
  });
}
function wireM2M(root){
  const open = root.querySelector('#m2m-open');
  const help = root.querySelector('#m2m-help');
  if (open) open.addEventListener('click', () => window.open('https://www.meettomatch.com/', '_blank', 'noopener'));
  if (help) help.addEventListener('click', () =>
    alert('When a party card has a MeetToMatch link, click it to add that slot in M2M. We remember your preference.')
  );
}
