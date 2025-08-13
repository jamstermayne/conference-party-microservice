import Store from '/js/store.js';
import Events from '/assets/js/events.js';

function isAdmin(email){
  const admins = (window.__ENV?.ADMIN_EMAILS)||[];
  return !!email && admins.includes(String(email).toLowerCase());
}

function hofCard(person){
  const n = person?.name || 'New user';
  const h = person?.handle ? `@${person.handle}` : '';
  return `<div class="hof-card"><div class="badge">invited</div><div class="name">${n}</div><div class="meta">${h}</div></div>`;
}

export async function renderInvites(rootEl){
  const root = rootEl || document.getElementById('app'); if(!root) return;
  const me = Store.get('user')||{};
  const admin = isAdmin(me.email);
  const left = Store.get('invites.left') ?? (admin ? Infinity : 11);
  const redeemed = Store.get('invites.redeemed') || 0;
  const hall = Store.get('invites.hof') || []; // [{name,handle,ts}]

  root.innerHTML = `
    <section class="section-card">
      <div class="left-accent" aria-hidden="true"></div>
      <h2 class="text-heading">Invites</h2>
      <div class="text-secondary">Single-use. Share with your crew. You have <b>${left===Infinity?'∞':left}</b> left.</div>
      ${admin ? `<div class="badge">Admin</div>`:''}
      <div class="actions" style="margin:10px 0;">
        <button class="btn btn-primary" data-action="invite-send">Send Invite</button>
        <button class="btn" data-action="invite-copy">Copy Invite Link</button>
      </div>
    </section>

    <section class="section-card">
      <div class="left-accent" aria-hidden="true"></div>
      <h3 class="text-heading">Hall of Fame</h3>
      <div class="text-secondary">Everyone who joined via your invites.</div>
      <div class="hof-grid" id="hof">${hall.map(hofCard).join('')}</div>
    </section>
  `;

  root.querySelector('[data-action="invite-send"]').addEventListener('click', ()=>{
    // Backend integration goes here; for now, simulate:
    const cur = Store.get('invites.left') ?? (admin ? Infinity : 11);
    if(cur!==Infinity && cur<=0) return;
    const newCount = cur===Infinity ? Infinity : cur-1;
    Store.patch('invites.left', newCount);
    Events.emit?.('invite:sent');
  });

  root.querySelector('[data-action="invite-copy"]').addEventListener('click', async ()=>{
    const code = Math.random().toString(36).slice(2,8);
    const url = `${location.origin}/?invite=${code}`;
    try{ await navigator.clipboard.writeText(url);}catch{}
    Events.emit?.('ui:toast', { message: 'Invite link copied' });
  });

  // Auto-grant on admin send (for growth)
  Events.on?.('invite:redeemed', (payload)=>{
    const list = Store.get('invites.hof') || [];
    list.unshift({ name: payload?.name || 'New user', handle: payload?.handle || '', ts: Date.now() });
    Store.patch('invites.hof', list);
    const cur = Store.get('invites.left') ?? (admin ? Infinity : 11);
    if(cur!==Infinity){ Store.patch('invites.left', cur+11); } // new user gets 11 on redeem; admin remains unlimited
  });
}