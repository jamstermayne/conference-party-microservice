/**
 * account-controller.js
 * Builds a simple account hub with profile + stats + actions.
 */
import Store from '/js/store.js';
import Events from '/assets/js/events.js';

function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }

function renderAccount(root) {
  const user = Store.get('user') || {};
  const stats = {
    invitesLeft: Store.get('invites.left') ?? 0,
    invitesSent: (Store.get('invites.sent') || []).length || 0,
    invitesRedeemed: Store.get('invites.redeemed') || 0,
    contacts: (Store.get('contacts') || []).length || 0,
  };

  root.innerHTML = '';
  root.appendChild(el(`
    <section class="card card-filled account-head">
      <div class="account-id">
        <div class="avatar">${(user.name||'?').charAt(0).toUpperCase()}</div>
        <div class="who">
          <div class="name text-primary">${user.name || 'Your name'}</div>
          <div class="meta text-secondary">${user.email || 'Add a backup email'}</div>
          <div class="meta text-secondary">${user.linkedin || 'Link LinkedIn'}</div>
        </div>
      </div>
      <div class="account-actions">
        <button class="btn btn-primary" data-action="link-google">Link Google</button>
        <button class="btn btn-secondary" data-action="link-linkedin">Link LinkedIn</button>
        <button class="btn btn-outline" data-action="add-email">Add backup email</button>
      </div>
    </section>
  `));

  root.appendChild(el(`
    <section class="grid grid-3 account-stats">
      <div class="card card-outlined stat">
        <div class="label text-secondary">Invites left</div>
        <div class="value text-primary">${stats.invitesLeft}</div>
      </div>
      <div class="card card-outlined stat">
        <div class="label text-secondary">Invites sent</div>
        <div class="value text-primary">${stats.invitesSent}</div>
      </div>
      <div class="card card-outlined stat">
        <div class="label text-secondary">Redeemed</div>
        <div class="value text-primary">${stats.invitesRedeemed}</div>
      </div>
      <div class="card card-outlined stat">
        <div class="label text-secondary">Contacts</div>
        <div class="value text-primary">${stats.contacts}</div>
      </div>
    </section>
  `));

  root.appendChild(el(`
    <section class="card card-outlined account-links">
      <h3 class="text-primary">Account</h3>
      <ul class="account-list">
        <li><button class="btn btn-text" data-action="change-password">Change password</button></li>
        <li><button class="btn btn-text" data-action="manage-emails">Manage emails</button></li>
        <li><button class="btn btn-text" data-action="export-data">Export data</button></li>
      </ul>
    </section>
  `));

  // Wire simple actions (no backend—emit events)
  root.querySelectorAll('[data-action]').forEach(b=>{
    b.addEventListener('click', () => {
      const a = b.getAttribute('data-action');
      Events.emit('ui:toast', { type:'ok', message:`${a.replace(/-/g,' ')} (stub)` });
    });
  });
}

function ensureMount() {
  // Ensure there's a panel for route "me"
  let panel = document.querySelector('[data-panel="me"]');
  if (!panel) {
    panel = document.createElement('main');
    panel.id = 'panel-me';
    panel.setAttribute('data-panel','me');
    panel.hidden = true;
    panel.className = 'main-panel';
    document.querySelector('#app')?.appendChild(panel);
  }
  return panel;
}

function init() {
  const root = ensureMount();
  renderAccount(root);
}

document.addEventListener('DOMContentLoaded', init);
Events.on('route', (r) => { if (r === 'me') init(); });