import { myInvites, createInvite, revokeInvite } from '/js/services/invites.js?v=b021';

export async function renderInvites(mount){
  if(!mount) return;
  mount.innerHTML = `
    <section style="margin:24px">
      <h2 style="color:#eaf0ff;margin:0 0 12px 0">Invites</h2>
      <div id="inv-summary" style="color:#9aa7bf;margin-bottom:12px"></div>

      <div style="display:flex;gap:8px;margin-bottom:16px">
        <input id="inv-email" type="email" placeholder="recipient@email.com" style="flex:1;padding:10px;border-radius:10px;border:1px solid #2a3146;background:#0f1625;color:#eaf0ff" />
        <button id="btn-create" class="vbtn primary">Create Invite</button>
      </div>

      <h3 style="color:#cbd7ff;margin:16px 0 8px">Pending</h3>
      <div id="pending"></div>

      <h3 style="color:#cbd7ff;margin:16px 0 8px">Hall of Fame</h3>
      <div id="accepted"></div>
    </section>
  `;

  const summary = document.getElementById('inv-summary');
  const pending = document.getElementById('pending');
  const accepted = document.getElementById('accepted');

  async function refresh(){
    const data = await myInvites();
    summary.textContent = `Invites left: ${data.left}`;
    pending.innerHTML = (data.sent.filter(x=>x.status==='pending').map(x => `
      <article class="vcard" data-code="${x.code}">
        <div class="vcard__head">
          <div class="vcard__title">${x.email||'Invite link'}</div>
          <div class="vcard__badges"><span class="vpill">expires ${new Date(x.expiresAt).toLocaleDateString()}</span></div>
        </div>
        <div class="vmeta">🔗 ${x.link}</div>
        <div class="vactions">
          <button class="vbtn" data-act="copy" data-link="${x.link}">Copy</button>
          <button class="vbtn" data-act="revoke" data-code="${x.code}">Revoke</button>
        </div>
      </article>
    `).join('')) || '<p style="color:#7783a0">No pending invites.</p>';

    accepted.innerHTML = (data.accepted.map(x => `
      <article class="vcard">
        <div class="vcard__head">
          <div class="vcard__title">${x.acceptedEmail || 'New user'}</div>
          <div class="vcard__badges"><span class="vpill live">accepted</span></div>
        </div>
        <div class="vmeta">🎉 Joined on ${x.acceptedAt?.seconds ? new Date(x.acceptedAt.seconds*1000).toLocaleString() : ''}</div>
      </article>
    `).join('')) || '<p style="color:#7783a0">No accepted invites yet.</p>';
  }

  mount.addEventListener('click', async (e)=>{
    const b = e.target.closest('button[vbtn],.vbtn'); if(!b) return;
    const act = b.dataset.act;
    if (act === 'copy') {
      const link = b.dataset.link; try { await navigator.clipboard.writeText(link); b.textContent='Copied!'; setTimeout(()=>b.textContent='Copy',1200);} catch {}
    }
    if (act === 'revoke') {
      const code = b.dataset.code; try { await revokeInvite(code); await refresh(); } catch(err){ console.warn(err); }
    }
  });

  document.getElementById('btn-create').addEventListener('click', async ()=>{
    const email = (document.getElementById('inv-email').value||'').trim() || null;
    try { await createInvite(email); document.getElementById('inv-email').value=''; await refresh(); } catch(err){ console.warn(err); }
  });

  refresh();
}
export default { renderInvites };