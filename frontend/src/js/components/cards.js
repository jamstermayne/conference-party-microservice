// Reusable hero card factory for Parties, Calendar, Invites, Contacts, Me
export function cardGrid(container){
  container.classList.add('hero-wrap');
  return container;
}

export function partyCard(evt){
  const el = document.createElement('div');
  el.className = 'section-card party-card';
  
  // If start and end times are provided, set duration slots
  if (evt.start && evt.end) {
    el.dataset.start = evt.start;
    el.dataset.end = evt.end;
  }
  
  el.innerHTML = `
    <div class="section-head">
      <div>${escapeHTML(evt.category || 'Recommended events')}</div>
      ${evt.ribbon ? `<div class="badge">${escapeHTML(evt.ribbon)}</div>` : '<span style="opacity:.6;font-size:.85rem">Scroll to explore</span>'}
    </div>
    <div class="card">
      <div class="card-title">${escapeHTML(evt.title)}</div>
      <div class="meta">
        ${evt.price ? `<span class="badge price">From ${escapeHTML(evt.price)}</span>`:''}
        ${evt.live ? `<span class="badge live">live</span>`:''}
      </div>
      <div class="card-sub">📍 ${escapeHTML(evt.venue || '')}</div>
      <div class="card-sub">📅 ${escapeHTML(evt.when || '')}</div>
      <div class="actions">
        <button class="btn primary" data-action="addCalendar" data-id="${evt.id}" 
                data-title="${escapeHTML(evt.title)}"
                data-venue="${escapeHTML(evt.venue || '')}"
                data-when="${escapeHTML(evt.when || '')}"
                data-start="${evt.start || ''}"
                data-end="${evt.end || ''}">Add to Calendar</button>
        <button class="btn ghost" data-action="details" data-id="${evt.id}">Details</button>
      </div>
    </div>
  `;
  return el;
}

export function inviteCard(inv){
  const el = document.createElement('div');
  el.className = 'section-card';
  const statusClass = inv.status === 'redeemed' ? 'live' : inv.status === 'pending' ? 'pending' : inv.status === 'revoked' ? 'revoked' : '';
  const statusLabel = inv.status || 'pending';
  el.innerHTML = `
    <div class="section-head">
      <div>Invite</div>
      <div class="badge ${statusClass}">${escapeHTML(statusLabel)}</div>
    </div>
    <div class="card">
      <div class="card-title">${escapeHTML(inv.email || inv.name || 'Invitee')}</div>
      <div class="card-sub">Code: ${escapeHTML(inv.code)}</div>
      <div class="meta">
        ${inv.sentAt ? `<span class="badge">Sent ${escapeHTML(inv.sentAt)}</span>`:''}
        ${inv.redeemedAt ? `<span class="badge live">Redeemed ${escapeHTML(inv.redeemedAt)}</span>`:''}
      </div>
      <div class="actions">
        ${inv.status === 'pending' ? `<button class="btn primary" data-action="resend" data-code="${inv.code}">Resend</button>`:''}
        <button class="btn ghost" data-action="copy" data-code="${inv.code}">Copy Link</button>
      </div>
    </div>
  `;
  return el;
}

export function contactCard(person){
  const el = document.createElement('div');
  el.className = 'section-card';
  el.innerHTML = `
    <div class="section-head">
      <div>Contact</div>
      ${person.tag ? `<div class="badge">${escapeHTML(person.tag)}</div>`:''}
    </div>
    <div class="card">
      <div class="profile-row">
        <div class="avatar">${escapeHTML(initials(person.name || '?'))}</div>
        <div>
          <div class="card-title">${escapeHTML(person.name || 'Unknown')}</div>
          <div class="card-sub">${escapeHTML(person.role || '')}</div>
        </div>
      </div>
      <div class="meta">
        ${person.company ? `<span class="badge">${escapeHTML(person.company)}</span>`:''}
        ${person.linkedIn ? `<span class="badge">LinkedIn</span>`:''}
      </div>
      <div class="actions">
        ${person.linkedIn ? `<a class="btn primary" href="${person.linkedIn}" target="_blank" rel="noreferrer">Open LinkedIn</a>`:''}
        ${person.email ? `<a class="btn ghost" href="mailto:${person.email}">Email</a>`:''}
      </div>
    </div>
  `;
  return el;
}

export function meCard(profile){
  const el = document.createElement('div');
  el.className = 'section-card';
  el.innerHTML = `
    <div class="section-head">
      <div>My Profile</div>
      ${profile.badge ? `<div class="badge live">${escapeHTML(profile.badge)}</div>`:''}
    </div>
    <div class="card profile">
      <div class="profile-row">
        <div class="avatar">${escapeHTML(initials(profile.name || '?'))}</div>
        <div>
          <div class="card-title">${escapeHTML(profile.name || 'Your Name')}</div>
          <div class="card-sub">${escapeHTML(profile.role || '')}</div>
        </div>
      </div>
      <div class="meta">
        ${profile.company ? `<span class="badge">${escapeHTML(profile.company)}</span>`:''}
        ${profile.email ? `<span class="badge">${escapeHTML(profile.email)}</span>`:''}
      </div>
      <div class="actions">
        <button class="btn primary" data-action="editProfile">Edit Profile</button>
        <button class="btn ghost" data-action="manageAccount">Account</button>
      </div>
    </div>
  `;
  return el;
}

export function calendarSlotCard(slot){
  const el = document.createElement('div');
  el.className = 'section-card card-slot calendar-card';
  const isBusy = !!slot.title;
  
  // If start and end times are provided, set duration slots
  if (slot.start && slot.end) {
    el.dataset.start = slot.start;
    el.dataset.end = slot.end;
  }
  
  el.innerHTML = `
    <div class="section-head">
      <div>${escapeHTML(slot.dayLabel || slot.date || '')}</div>
      <div class="badge ${isBusy ? 'live' : ''}">${isBusy ? 'busy' : 'available'}</div>
    </div>
    <div class="card">
      <div class="card-title">${escapeHTML(slot.title || 'Available')}</div>
      <div class="card-sub">⏰ ${escapeHTML(slot.time || '')}</div>
      ${slot.location ? `<div class="card-sub">📍 ${escapeHTML(slot.location)}</div>`:''}
      <div class="actions">
        ${isBusy ? `<button class="btn ghost" data-action="openEvent" data-id="${slot.id}">Open</button>`
                 : `<button class="btn primary" data-action="addMeeting" data-at="${slot.time}" data-date="${slot.date}">Add Meeting</button>`}
      </div>
    </div>
  `;
  return el;
}

/* utils */
function escapeHTML(s=''){ return String(s).replace(/[&<>"]/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }
function initials(name){ return name.split(/\s+/).map(x=>x[0]||'').join('').slice(0,2).toUpperCase(); }