/**
 * ui-card.js — Shared card factory for all views
 * Build: b018
 */

// Ensure cards CSS is loaded
export function ensureCardsCss() {
  if (!document.querySelector('link[data-cards="1"]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = '/assets/css/cards.css?v=b022';
    l.setAttribute('data-cards', '1');
    document.head.appendChild(l);
  }
}

// HTML escape function
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

// Map party/event data to card props
function mapParty(p) {
  return {
    id: p.id || 'party-' + Math.random().toString(36).substr(2, 9),
    title: p.title || p.name || 'Untitled Event',
    subtitle: p.venue || p.location || '',
    meta: [
      p.when || p.date || '',
      p.price || (p.free ? 'Free' : '')
    ].filter(Boolean),
    badges: [
      p.live && { text: 'live', class: 'live' },
      p.free && { text: 'free', class: 'free' }
    ].filter(Boolean),
    actions: [
      { text: 'Save', kind: 'primary' },
      { text: 'Sync', kind: 'ghost' }
    ]
  };
}

// Map contact/person data to card props
function mapContact(c) {
  return {
    id: c.id || 'contact-' + Math.random().toString(36).substr(2, 9),
    title: c.name || 'Anonymous',
    subtitle: [c.role, c.company].filter(Boolean).join(' · '),
    meta: [
      c.location || '',
      c.linkedin || ''
    ].filter(Boolean),
    badges: [
      c.status === 'online' && { text: 'online', class: 'live' },
      c.verified && { text: 'verified', class: 'free' }
    ].filter(Boolean),
    actions: [
      { text: 'Connect', kind: 'primary' },
      { text: 'Message', kind: 'ghost' }
    ]
  };
}

// Map invite data to card props
function mapInvite(i) {
  return {
    id: i.id || 'invite-' + Math.random().toString(36).substr(2, 9),
    title: i.title || 'Exclusive Invite',
    subtitle: i.from || i.email || 'Invitee',
    meta: [
      i.event || '',
      i.expires || ''
    ].filter(Boolean),
    badges: [
      i.premium && { text: 'premium', class: 'live' },
      i.urgent && { text: 'urgent', class: 'free' }
    ].filter(Boolean),
    actions: [
      { text: 'Accept', kind: 'primary' },
      { text: 'Decline', kind: 'ghost' }
    ]
  };
}

// Main hero card renderer
export function renderCard(props) {
  const {
    id = '',
    title = 'Untitled',
    subtitle = '',
    meta = [],
    badges = [],
    actions = []
  } = props;

  const badgeHtml = badges.map(b => 
    `<span class="pill ${b.class || ''}">${escapeHtml(b.text)}</span>`
  ).join('');

  const metaHtml = meta.map(m => 
    `<li>${escapeHtml(m)}</li>`
  ).join('');

  const actionHtml = actions.map(a => 
    `<button class="btn ${a.kind || ''}">${escapeHtml(a.text)}</button>`
  ).join('');

  return `
    <article class="vcard" data-id="${escapeHtml(id)}">
      <div class="vhead">
        <div>
          <div class="vtitle">${escapeHtml(title)}</div>
          ${subtitle ? `<div class="vsub">${escapeHtml(subtitle)}</div>` : ''}
          ${badgeHtml ? `<div class="vbadges">${badgeHtml}</div>` : ''}
        </div>
      </div>
      ${metaHtml ? `<ul class="meta">${metaHtml}</ul>` : ''}
      ${actionHtml ? `<div class="actions">${actionHtml}</div>` : ''}
    </article>
  `;
}

// Create hero card with type-specific mapping
export function createHeroCard(kind, data = {}) {
  ensureCardsCss();
  
  let props;
  switch (kind) {
    case 'party':
      props = mapParty(data);
      break;
    case 'contact':
      props = mapContact(data);
      break;
    case 'invite':
      props = mapInvite(data);
      break;
    case 'me':
      props = {
        title: data.name || 'Profile',
        subtitle: data.email || '',
        meta: [data.company || '', data.role || ''].filter(Boolean),
        badges: [],
        actions: [{ text: 'Edit', kind: 'primary' }]
      };
      break;
    case 'slot':
      props = {
        title: data.title || 'Time Slot',
        subtitle: data.time || '',
        meta: [data.venue || ''].filter(Boolean),
        badges: data.badges || [],
        actions: data.actions || []
      };
      break;
    default:
      props = data;
  }
  
  return renderCard(props);
}

// Convenience factories
export function partyCard(party) {
  return createHeroCard('party', party);
}

export function contactCard(contact) {
  return createHeroCard('contact', contact);
}

export function inviteCard(invite) {
  return createHeroCard('invite', invite);
}

// Render array of items
export function renderCards(items, kind) {
  ensureCardsCss();
  return items.map(item => createHeroCard(kind, item)).join('');
}

export default {
  ensureCardsCss,
  createHeroCard,
  renderCard,
  partyCard,
  contactCard,
  inviteCard,
  renderCards,
  mapParty,
  mapContact,
  mapInvite
};