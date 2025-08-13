/**
 * AccountController — aggregates profile + invites + contacts
 * Route: data-route="account"
 */
import Store from '../store.js?v=b022';
import Events from '../events.js?v=b022';

export default class AccountController {
  constructor(root) {
    this.root = root;
    this.el = document.createElement('div');
    this.el.className = 'account screen';
  }

  mount() {
    this.render();
    // live updates
    this.unsub = Events.on('store:changed', (path) => {
      if (
        path.startsWith('profile') ||
        path.startsWith('invites') ||
        path.startsWith('contacts') ||
        path.startsWith('calendar')
      ) this.render();
    });
  }

  unmount() { this.unsub && this.unsub(); }

  read() {
    const profile  = Store.get('profile') || {};
    const invites  = Store.get('invites') || {};
    const contacts = Store.get('contacts') || {};
    return {
      name: profile.name || '—',
      email: profile.email || '—',
      phone: profile.phone || '—',
      linkedin: profile.linkedin || '',
      invitesLeft: Number(invites.left ?? 0),
      invitesSent: Number(invites.sent ?? 0),
      invitesRedeemed: Number(invites.redeemed ?? 0),
      contactsCount: Number(contacts.count ?? (contacts.items?.length || 0)),
      calendarGoogle: !!Store.get('calendar.googleConnected'),
    };
  }

  render() {
    const d = this.read();

    this.el.innerHTML = `
      <header class="account-head">
        <h1 class="text-heading">Account</h1>
        <button class="btn btn-outline" data-action="signout">Sign out</button>
      </header>

      <section class="card card-filled account-section">
        <h2 class="section-title">Your information</h2>
        <div class="rows">
          ${row('Name', d.name)}
          ${row('Email', d.email, 'edit-email')}
          ${row('Mobile Number', d.phone, 'edit-phone')}
          ${row('LinkedIn', d.linkedin ? escapeHtml(d.linkedin) : 'Not linked', 'connect-linkedin')}
          ${row('Calendar', d.calendarGoogle ? 'Google connected' : 'Not connected', 'connect-calendar')}
        </div>
      </section>

      <section class="card card-filled account-section">
        <h2 class="section-title">Network & Invites</h2>
        <div class="stats">
          ${stat('Contacts', d.contactsCount)}
          ${stat('Invites sent', d.invitesSent)}
          ${stat('Invites redeemed', d.invitesRedeemed)}
          ${stat('Invites left', d.invitesLeft)}
        </div>
        <div class="actions">
          <button class="btn btn-primary" data-action="sync-contacts">Sync contacts</button>
          <button class="btn" data-action="manage-invites">Manage invites</button>
        </div>
      </section>

      <section class="card card-filled account-section gradient-callout">
        <div class="callout-text">
          <h3 class="text-heading-sm">Need help?</h3>
          <p class="text-secondary">We've got your back. Browse help articles or contact us.</p>
        </div>
        <button class="btn btn-glass" data-action="open-help">Help Center</button>
      </section>
    `;

    wire(this.el);
    this.root.replaceChildren(this.el);
  }
}

// helpers
function row(label, value, action) {
  return `
    <button class="row" ${action ? `data-action="${action}"` : ''}>
      <span class="row-label">${label}</span>
      <span class="row-value">${escapeHtml(String(value))}</span>
      <span class="row-caret">›</span>
    </button>
  `;
}
function stat(label, value) {
  return `
    <div class="stat">
      <div class="stat-value">${Number.isFinite(value) ? value : '—'}</div>
      <div class="stat-label">${label}</div>
    </div>
  `;
}
function wire(root) {
  root.querySelectorAll('[data-action]').forEach(el=>{
    el.addEventListener('click', (e)=>{
      const a = el.getAttribute('data-action');
      switch(a){
        case 'signout':      Events.emit('auth:signout'); break;
        case 'sync-contacts':Events.emit('contacts:sync'); break;
        case 'manage-invites':Events.emit('route', '#/invites'); break;
        case 'edit-email':   Events.emit('modal:open', { type:'edit-email' }); break;
        case 'edit-phone':   Events.emit('modal:open', { type:'edit-phone' }); break;
        case 'connect-linkedin': Events.emit('auth:linkedin'); break;
        case 'connect-calendar': Events.emit('calendar:connect'); break;
        case 'open-help':    Events.emit('route', '#/help'); break;
      }
    }, { passive:false });
  });
}
function escapeHtml(s){ return s.replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }