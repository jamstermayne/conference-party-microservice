import { InvitesAPI } from './invites-api.js';

function chip(txt){ return `<span class="chip">${txt}</span>`; }

export async function renderInvites(root){
  const mount = root || document.getElementById('app') || document.getElementById('main');
  if (!mount) return;

  // TEMP: get email from localStorage or prompt (until SSO fully wired)
  let email = localStorage.getItem('vel.email') || '';
  if (!email) {
    email = prompt('Enter your email to manage invites (temp)') || '';
    if (email) localStorage.setItem('vel.email', email);
  }
  if (!email) { mount.innerHTML = `<div class="section-card"><div class="left-accent"></div><div>Please provide email to view invites.</div></div>`; return; }

  mount.innerHTML = `
    <section class="section-card">
      <div class="left-accent"></div>
      <header class="section-head">
        <h2 class="text-heading">Invites</h2>
        <div class="subtle">Your codes • Hall of Fame • Remaining</div>
      </header>

      <div class="invites-grid">
        <div class="inv-column">
          <h3 class="text-sub">Your Codes</h3>
          <div id="codes" class="codes-list"></div>
          <div class="row" style="margin-top:10px; gap:8px;">
            <input id="genCount" type="number" min="1" max="11" value="3" class="input" style="width:90px">
            <button id="btnGen" class="btn btn-primary">Generate</button>
          </div>
          <div id="remain" class="subtle" style="margin-top:8px;"></div>
        </div>

        <div class="inv-column">
          <h3 class="text-sub">Hall of Fame</h3>
          <div id="hof" class="hof-list"></div>
        </div>
      </div>
    </section>
  `;

  const ui = {
    codes: mount.querySelector('#codes'),
    remain: mount.querySelector('#remain'),
    hof: mount.querySelector('#hof'),
    genCount: mount.querySelector('#genCount'),
    btnGen: mount.querySelector('#btnGen')
  };

  async function load(){
    const data = await InvitesAPI.mine(email);
    ui.remain.textContent = `Invites remaining: ${data.user?.isAdmin ? '∞ (admin)' : (data.user?.invitesRemaining ?? 0)}`;

    const created = (data.created||[]);
    ui.codes.innerHTML = created.length ? created.map(c=> `
      <div class="code-item">
        <code>${c.code}</code>
        ${chip(c.status)}
        <button data-copy="${c.code}" class="btn btn-ghost">Copy Link</button>
      </div>
    `).join('') : `<div class="empty">No invites yet. Generate some!</div>`;

    ui.codes.querySelectorAll('[data-copy]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const code = btn.getAttribute('data-copy');
        const link = `${location.origin}/#/invite?code=${code}`;
        navigator.clipboard.writeText(link);
        btn.textContent = 'Copied';
        setTimeout(()=> btn.textContent = 'Copy Link', 1200);
      });
    });

    const hof = created.filter((c)=>c.status==='redeemed').slice(0,30);
    ui.hof.innerHTML = hof.length ? hof.map(h=> `
      <div class="hof-item">
        <div class="avatar">${(h.redeemedByEmail||'?')[0]?.toUpperCase()||'?'}</div>
        <div class="meta">
          <div class="name">${h.redeemedByEmail||'Unknown'}</div>
          <div class="subtle">Joined • ${new Date(h.redeemedAt||Date.now()).toLocaleDateString()}</div>
        </div>
      </div>
    `).join('') : `<div class="empty">No redemptions yet. Share your codes!</div>`;
  }

  ui.btnGen.addEventListener('click', async ()=>{
    const n = Math.max(1, Math.min(11, Number(ui.genCount.value||1)));
    await InvitesAPI.generate(email, n);
    await load();
  });

  await load();
}
export default { renderInvites };