import { initMtmSettings } from './integrations/mtm.js';

export async function renderSettings(mount){
  if(!mount) return;
  const allowed = new Set(['jamy@nigriconsulting.com','jamynigri@gmail.com']);
  const user = (window.firebase?.auth?.().currentUser) || null;
  const email = user?.email || '';
  const canSelfPromote = email && allowed.has(email.toLowerCase());

  mount.innerHTML = `
    <section style="margin:24px">
      <article class="vcard">
        <div class="vcard__head">
          <div class="vcard__title">Account Settings</div>
        </div>
        <div class="vmeta">Signed in as: ${email || 'Guest'}</div>
        <div class="vactions" id="adminActions"></div>
        <div id="adminMsg" style="margin-top:8px;color:var(--text-muted);"></div>
      </article>
      
      <!-- MeetToMatch Integration -->
      <section class="card" id="mtm-card" data-role="mtm" style="margin-top:24px">
        <header class="row between">
          <h3>MeetToMatch</h3>
          <span id="mtm-status-badge" class="badge">Checking…</span>
        </header>

        <div class="stack">
          <!-- Connect -->
          <label>Private ICS URL (from your MeetToMatch account)</label>
          <div class="row">
            <input id="mtm-ics" type="password" placeholder="https://app.meettomatch.com/.../private.ics" class="grow">
            <button id="mtm-connect" class="primary">Connect</button>
          </div>
          <small class="muted">
            Only the server sees this URL. It's stored encrypted and never exposed in the browser.
          </small>

          <!-- Manual sync -->
          <div class="row">
            <button id="mtm-sync-now">Sync now</button>
            <span id="mtm-last-sync" class="muted"></span>
          </div>

          <hr />

          <!-- Google mirror -->
          <div class="row">
            <label class="row">
              <input type="checkbox" id="mtm-mirror-toggle">
              <span>Mirror MeetToMatch events to Google Calendar</span>
            </label>
          </div>
          <div class="row">
            <label style="min-width:160px">Google Calendar ID</label>
            <input id="mtm-cal-id" placeholder="primary" value="primary">
          </div>
          <div class="row">
            <button id="mtm-save-mirror">Save mirroring</button>
          </div>

          <small class="muted" id="mtm-hint">
            When enabled, new/updated MTM events will be created/updated in your Google Calendar.
          </small>
        </div>
      </section>
    </section>
  `;

  const actions = document.getElementById('adminActions');
  const msg = document.getElementById('adminMsg');

  if (canSelfPromote) {
    const btn = document.createElement('button');
    btn.className = 'vbtn primary';
    btn.textContent = 'Promote me to Admin';
    btn.addEventListener('click', async ()=>{
      try{
        btn.disabled = true;
        msg.textContent = 'Promoting…';
        const t = await window.firebase.auth().currentUser.getIdToken(true);
        const r = await fetch('/api/admin/promoteByEmail', {
          method:'POST',
          headers:{'Content-Type':'application/json','Authorization':'Bearer '+t},
          body: JSON.stringify({ email })
        });
        const data = await r.json();
        if(data?.success){
          msg.textContent = '✅ You are now an admin.';
        }else{
          msg.textContent = '❌ Failed: ' + (data?.error || r.status);
        }
      }catch(e){
        msg.textContent = '❌ Error: ' + (e?.message || String(e));
      }finally{
        btn.disabled = false;
      }
    });
    actions.appendChild(btn);
  } else {
    msg.textContent = email ? 'No admin actions available for this account.' : 'Sign in to access admin actions.';
  }
  
  // Initialize MTM settings
  await initMtmSettings();
}
export default { renderSettings };