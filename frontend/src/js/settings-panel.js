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
        <div id="adminMsg" style="margin-top:8px;color:#9aa7bf;"></div>
      </article>
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
}
export default { renderSettings };