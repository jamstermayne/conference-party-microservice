/**
 * invite-panel.js — Uses protected API with Firebase ID token
 * Endpoints used:
 *  GET    /api/invites/my
 *  POST   /api/invites/create   { email? }
 *  POST   /api/invites/revoke   { code }
 */
async function withToken(){
  try { return await window.Auth.getIdToken(true); }
  catch(e){ throw e; }
}
async function api(path, method="GET", body){
  const t = await withToken();
  const opt = { method, headers: { "Authorization":"Bearer "+t } };
  if (body) { opt.headers["Content-Type"]="application/json"; opt.body = JSON.stringify(body); }
  const r = await fetch(path, opt);
  const ct = r.headers.get("content-type")||"";
  const data = ct.includes("json") ? await r.json() : await r.text();
  if(!r.ok || (data && data.error)) throw new Error(data.error || r.statusText || "HTTP "+r.status);
  return data;
}

function btn(label, cls="vbtn", attrs=""){ return `<button class="${cls}" ${attrs}>${label}</button>`; }
function copy(text){ navigator.clipboard?.writeText(text).catch(()=>{}); }

function inviteCard(i){
  // i = {code, email?, createdAt, status: "pending"|"accepted", acceptedBy, acceptedAt, inviter, url}
  const title = i.email ? i.email : i.code;
  const badge = i.status === 'accepted' ? '<span class="vpill live">accepted</span>' : '<span class="vpill">pending</span>';
  const meta  = i.status === 'accepted'
      ? `👤 ${i.acceptedBy||'New user'} • 🕒 ${new Date(i.acceptedAt||i.createdAt).toLocaleString()}`
      : `🕒 ${new Date(i.createdAt).toLocaleString()}`;
  const actions = (i.status === 'pending')
      ? `${btn('Copy Link','vbtn','data-act="copy" data-url="'+(i.url||'')+'"')} ${btn('Revoke','vbtn','data-act="revoke" data-code="'+i.code+'"')}`
      : `${btn('Share','vbtn','data-act="copy" data-url="'+(i.url||'')+'"')}`;
  return `
    <article class="vcard" data-code="${i.code}">
      <div class="vcard__head">
        <div class="vcard__title">${title}</div>
        <div class="vcard__badges">${badge}</div>
      </div>
      <div class="vmeta">${meta}</div>
      <div class="vactions">${actions}</div>
    </article>`;
}

export async function renderInvites(mount){
  if(!mount) return;

  const user = window.Auth.current();
  mount.innerHTML = `
  <section style="margin:24px">
    <article class="vcard">
      <div class="vcard__head">
        <div class="vcard__title">Invites</div>
        <div class="vcard__badges"><span class="vpill">single-use</span></div>
      </div>

      <div class="vmeta" id="inv-meta">Sign in to manage your invites.</div>

      <div class="vactions" id="inv-auth">
        ${user ? '' : '<button class="vbtn primary" id="btnSignIn">Sign in with Google</button>'}
        ${user ? '<button class="vbtn" id="btnSignOut">Sign out</button>' : ''}
      </div>
    </article>

    <div id="authedArea" style="display:${user?'block':'none'};margin-top:14px">
      <article class="vcard">
        <div class="vcard__head">
          <div class="vcard__title">Your invite credits: <span id="inv-left">—</span></div>
        </div>
        <div class="vactions">
          <input id="inv-email" placeholder="optional email to prefill…" style="flex:1;min-width:220px;padding:8px;border-radius:10px;border:1px solid #2b2f45;background:#121a2a;color:#eaf0ff">
          <button class="vbtn primary" id="btnCreate">Create Invite</button>
        </div>
      </article>

      <h3 style="color:#eaf0ff;margin:16px 0 8px">Pending</h3>
      <div id="inv-pending"></div>

      <h3 style="color:#eaf0ff;margin:20px 0 8px">Hall of Fame (accepted)</h3>
      <div id="inv-hof"></div>
    </div>
  </section>`;

  // auth buttons
  const btnIn  = mount.querySelector('#btnSignIn');
  const btnOut = mount.querySelector('#btnSignOut');
  const meta   = mount.querySelector('#inv-meta');
  const authedArea = mount.querySelector('#authedArea');

  if(btnIn){
    btnIn.addEventListener('click', async ()=>{
      try { await window.Auth.signInGoogle(); location.hash = '#/invites'; location.reload(); }
      catch(e){ meta.textContent = 'Sign-in failed: '+(e?.message||e); }
    });
  }
  if(btnOut){
    btnOut.addEventListener('click', async ()=>{
      await window.Auth.signOut(); location.hash = '#/invites'; location.reload();
    });
  }

  if(!window.Auth.current()){ return; }

  async function refresh(){
    try{
      const data = await api('/api/invites/my','GET');
      // meta + credits
      meta.textContent = `Signed in as: ${window.Auth.current()?.email || 'unknown'}`;
      authedArea.style.display = 'block';
      const leftEl = mount.querySelector('#inv-left');
      leftEl.textContent = (data?.left ?? 0) === Infinity ? '∞' : (data?.left ?? 0);

      // pending
      const pend = Array.isArray(data?.pending) ? data.pending : [];
      mount.querySelector('#inv-pending').innerHTML = pend.length
        ? pend.map(inviteCard).join('')
        : '<p style="color:#9aa7bf">No pending invites.</p>';

      // accepted (Hall of Fame)
      const acc = Array.isArray(data?.accepted) ? data.accepted : [];
      mount.querySelector('#inv-hof').innerHTML = acc.length
        ? acc.map(inviteCard).join('')
        : '<p style="color:#9aa7bf">No accepted invites yet.</p>';
    }catch(e){
      meta.textContent = 'Error loading invites: ' + (e?.message||e);
    }
  }

  // create & revoke handlers (event delegation)
  mount.addEventListener('click', async (e)=>{
    const el = e.target.closest('button'); if(!el) return;
    const act = el.getAttribute('data-act');
    if (el.id === 'btnCreate'){
      el.disabled = true;
      try {
        const email = (mount.querySelector('#inv-email')?.value || '').trim() || undefined;
        const res = await api('/api/invites/create','POST', email ? { email } : {});
        if(res?.invite?.url){ copy(res.invite.url); }
        await refresh();
      } catch(err){
        alert('Create failed: ' + (err?.message || err));
      } finally { el.disabled = false; }
    }
    if (act === 'copy'){
      const url = el.getAttribute('data-url') || '';
      if(url){ copy(url); el.textContent='Copied'; setTimeout(()=>el.textContent='Copy Link',1200); }
    }
    if (act === 'revoke'){
      const code = el.getAttribute('data-code');
      if(code && confirm('Revoke this invite?')){
        try { await api('/api/invites/revoke','POST',{ code }); await refresh(); }
        catch(err){ alert('Revoke failed: ' + (err?.message || err)); }
      }
    }
  });

  await refresh();
}
export default { renderInvites };