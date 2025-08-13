/**
 * Invites view – Hall of Fame (accepted) + Pending
 * Uses shared .vcard hero style.
 */
const fallback = {
  left: 11,
  accepted: [
    { id:"u1", name:"Avery Chen", role:"Producer", company:"Indie North", joined:"Aug 10", avatar:"/assets/avatars/avery.png" },
    { id:"u2", name:"Marta Ruiz", role:"BizDev", company:"Arcadia", joined:"Aug 11", avatar:"/assets/avatars/marta.png" }
  ],
  pending: [
    { id:"p1", name:"(Invite) alex@studio.io", sent:"Aug 12", status:"sent", link:"https://velocity.ai/i/abc123" },
    { id:"p2", name:"(Invite) dev@conf.xyz",    sent:"Aug 12", status:"opened", link:"https://velocity.ai/i/def456" }
  ]
};

async function loadInvites(){
  try {
    const r = await fetch('/api/invites/me', { credentials:'include' });
    if (!r.ok) throw new Error('bad status');
    const data = await r.json();
    // Expect { left:number, accepted:[...], pending:[...] }
    return {
      left: data.left ?? fallback.left,
      accepted: Array.isArray(data.accepted) ? data.accepted : fallback.accepted,
      pending: Array.isArray(data.pending) ? data.pending : fallback.pending
    };
  } catch {
    return fallback;
  }
}

function hofCard(p){
  const subtitle = [p.role, p.company].filter(Boolean).join(" • ");
  return `
  <article class="vcard" data-id="${p.id}">
    <div class="vcard__head">
      <div class="vcard__title">${p.name}</div>
      <div class="vcard__badges">
        <span class="vpill live">accepted</span>
        ${p.joined ? `<span class="vpill">since ${p.joined}</span>` : ``}
      </div>
    </div>
    ${subtitle ? `<div class="vmeta">👤 ${subtitle}</div>` : ``}
    <div class="vactions">
      <button class="vbtn">View profile</button>
      <button class="vbtn">Message</button>
    </div>
  </article>`;
}

function pendingCard(inv){
  return `
  <article class="vcard" data-id="${inv.id}">
    <div class="vcard__head">
      <div class="vcard__title">${inv.name}</div>
      <div class="vcard__badges">
        <span class="vpill">${inv.status || 'pending'}</span>
        ${inv.sent ? `<span class="vpill">sent ${inv.sent}</span>` : ``}
      </div>
    </div>
    <div class="vmeta">🔗 Invite link ready</div>
    <div class="vactions">
      ${inv.link ? `<button class="vbtn" data-copy="${inv.link}">Copy link</button>` : ``}
      <button class="vbtn">Resend</button>
      <button class="vbtn">Revoke</button>
    </div>
  </article>`;
}

export async function renderInvites(mount){
  if (!mount) return;
  const data = await loadInvites();

  mount.innerHTML = `
  <section style="margin:24px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <h2 style="color:#eaf0ff;margin:0">Invites</h2>
      <div style="display:flex;gap:8px">
        <span class="vpill">Left: ${data.left}</span>
        <span class="vpill">Accepted: ${data.accepted.length}</span>
        <span class="vpill">Pending: ${data.pending.length}</span>
      </div>
    </div>

    <div style="margin:12px 0 8px;color:#9aa7bf;font-weight:700">Hall of Fame</div>
    <div id="hof-list">
      ${data.accepted.map(hofCard).join('') || `<div style="color:#9aa7bf">No accepted invites yet.</div>`}
    </div>

    <div style="margin:20px 0 8px;color:#9aa7bf;font-weight:700">Pending Invites</div>
    <div id="pending-list">
      ${data.pending.map(pendingCard).join('') || `<div style="color:#9aa7bf">No pending invites.</div>`}
    </div>

    <div style="margin-top:16px;display:flex;gap:8px">
      <button id="btn-new" class="vbtn primary">Create new invite</button>
      <button id="btn-bulk" class="vbtn">Bulk import</button>
    </div>
  </section>`;

  // Minimal UX: copy-to-clipboard for invite links
  mount.addEventListener('click', async (e)=>{
    const b = e.target.closest('[data-copy]');
    if (!b) return;
    try {
      await navigator.clipboard.writeText(b.getAttribute('data-copy'));
      b.textContent = 'Copied!';
      setTimeout(()=> b.textContent='Copy link', 1200);
    } catch {}
  });
}

export default { renderInvites };