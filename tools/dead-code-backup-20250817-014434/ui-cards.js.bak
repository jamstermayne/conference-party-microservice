export function eventCardHTML(e){
  const price = e.price ? `From ${e.price}` : (e.free ? 'Free' : '');
  return `
  <article class="vcard" data-kind="event" data-id="${e.id||''}">
    <div class="v-head">
      <div class="v-title">${e.title || 'Untitled Event'}</div>
      <div class="v-badges">
        ${price ? `<span class="v-pill">${price}</span>` : ''}
        ${e.live ? `<span class="v-pill ok">live</span>` : ''}
      </div>
    </div>
    <div class="v-meta">
      <span>📍 ${e.venue || 'TBA'}</span>
      <span>🗓️ ${e.when || ''}</span>
    </div>
    <div class="v-actions">
      <button class="v-btn" data-action="sync" data-id="${e.id||''}">Save & Sync</button>
      <button class="v-btn ghost" data-action="details" data-id="${e.id||''}">Details</button>
    </div>
  </article>`;
}

export function contactCardHTML(c){
  return `
  <article class="vcard" data-kind="contact" data-id="${c.id||''}">
    <div class="v-head">
      <div class="v-title">${c.name || 'Unknown'}</div>
      <div class="v-badges">
        ${c.role ? `<span class="v-pill">${c.role}</span>` : ''}
        ${c.company ? `<span class="v-pill">${c.company}</span>` : ''}
      </div>
    </div>
    <div class="v-meta">
      ${c.email ? `<span>✉️ ${c.email}</span>` : ''}
      ${c.phone ? `<span>☎️ ${c.phone}</span>` : ''}
    </div>
    <div class="v-actions">
      <button class="v-btn" data-action="invite" data-id="${c.id||''}">Invite</button>
      <button class="v-btn ghost" data-action="share" data-id="${c.id||''}">Share</button>
    </div>
  </article>`;
}

export function meCardHTML(me){
  return `
  <article class="vcard" data-kind="me">
    <div class="v-head">
      <div class="v-title">${me.name || 'Your Profile'}</div>
      <div class="v-badges">
        ${me.role ? `<span class="v-pill">${me.role}</span>` : ''}
        ${me.status ? `<span class="v-pill ok">${me.status}</span>` : ''}
      </div>
    </div>
    <div class="v-meta">
      ${me.email ? `<span>✉️ ${me.email}</span>` : ''}
      ${me.linkedin ? `<span>🔗 LinkedIn linked</span>` : ''}
    </div>
    <div class="v-actions">
      <button class="v-btn" data-action="edit-profile">Edit Profile</button>
      <button class="v-btn ghost" data-action="manage-account">Account Settings</button>
    </div>
  </article>`;
}

export function inviteCardHTML(inv){
  const statusPill = inv.status==='redeemed' ? 'ok' : (inv.status==='expired' ? 'warn' : 'muted');
  return `
  <article class="vcard" data-kind="invite" data-id="${inv.code||''}">
    <div class="v-head">
      <div class="v-title">${inv.toName || inv.email || 'Invite'}</div>
      <div class="v-badges">
        <span class="v-pill ${statusPill}">${inv.status||'pending'}</span>
        ${inv.sentAt ? `<span class="v-pill muted">sent ${inv.sentAt}</span>` : ''}
      </div>
    </div>
    <div class="v-meta">
      ${inv.email ? `<span>✉️ ${inv.email}</span>` : ''}
      ${inv.note ? `<span>📝 ${inv.note}</span>` : ''}
    </div>
    <div class="v-actions">
      ${inv.status==='redeemed'
        ? '<button class="v-btn ghost" disabled>Redeemed</button>'
        : `<button class="v-btn" data-action="resend" data-code="${inv.code||''}">Resend</button>`}
      <button class="v-btn ghost" data-action="copy" data-code="${inv.code||''}">Copy Link</button>
    </div>
  </article>`;
}