/**
 * Settings Panel
 * - Shows account summary
 * - Dev-only "Promote to Admin" for whitelisted emails
 * - Clean, dark theme, Slack-inspired
 */
import Store from '/js/store.js';
import Events from '/assets/js/events.js';
import { isAdmin, isWhitelistedEmail, promoteToAdmin, demoteAdmin, ensureProfileFromEnv } from '/js/admin.js';

function row(label, value, subtle=false) {
  return `
    <div class="kv">
      <div class="kv-label ${subtle ? 'text-muted' : ''}">${label}</div>
      <div class="kv-value">${value ?? '<span class="text-muted">—</span>'}</div>
    </div>
  `;
}

export function renderSettings(root) {
  const mount = root || document.getElementById('app') || document.getElementById('main');
  if (!mount) return;

  ensureProfileFromEnv();
  const profile = Store.get('profile') || {};
  const email = profile.email || '';
  const admin = isAdmin();
  const devCanSeeAdminToggle = isWhitelistedEmail(email);

  const adminBadge = admin ? `<span class="badge badge-admin" title="Admin">ADMIN</span>` : '';
  const invitesUnlimited = Store.get('invites.unlimited') === true;
  const invitesLeft = invitesUnlimited || !Number.isFinite(Store.get('invites.left')) ? '∞' : (Store.get('invites.left') ?? '—');

  mount.innerHTML = `
    <section class="section-card">
      <div class="left-accent" aria-hidden="true"></div>
      <header class="section-head">
        <h2 class="text-heading flex-row flex-center">
          Settings ${adminBadge}
        </h2>
      </header>

      <div class="card card-filled">
        <div class="stack stack-3">
          ${row('Name', profile.name)}
          ${row('Email', email)}
          ${row('LinkedIn', profile.linkedin ? `<a href="${profile.linkedin}" target="_blank" rel="noopener">View</a>` : null)}
          ${row('Invites Left', invitesLeft)}
          ${row('Theme', 'Dark', true)}
        </div>
      </div>

      ${devCanSeeAdminToggle ? `
        <div class="card card-outlined card-hover" style="margin-top:12px;">
          <div class="card-body">
            <h3 class="text-heading" style="margin-bottom:8px;">Developer Controls</h3>
            <p class="text-muted" style="margin-bottom:12px;">These controls are only visible to whitelisted emails (you). Toggling admin enables unlimited single-use invites and admin UI.</p>
            <div class="flex-row" style="gap:8px;">
              ${admin
                ? `<button id="demoteAdmin" class="btn btn-outline">Disable Admin</button>`
                : `<button id="promoteAdmin" class="btn btn-primary">Promote to Admin</button>`}
              <button id="seedInvites" class="btn btn-secondary btn-ghost">Seed +11 Invites</button>
            </div>
          </div>
        </div>
      ` : ''}

      <div class="card card-outlined" style="margin-top:12px;">
        <div class="card-body">
          <h3 class="text-heading" style="margin-bottom:8px;">Security</h3>
          <div class="stack stack-2">
            <button class="btn btn-outline" data-action="add-backup-email">Add backup email</button>
            <button class="btn btn-outline" data-action="add-phone">Add phone</button>
            <button class="btn btn-outline" data-action="change-password">Change password</button>
          </div>
        </div>
      </div>
    </section>
  `;

  // Wire up controls
  const promoteBtn = document.getElementById('promoteAdmin');
  const demoteBtn  = document.getElementById('demoteAdmin');
  const seedBtn    = document.getElementById('seedInvites');

  if (promoteBtn) {
    promoteBtn.addEventListener('click', () => {
      promoteToAdmin();
      renderSettings(mount);
    }, { passive:false });
  }

  if (demoteBtn) {
    demoteBtn.addEventListener('click', () => {
      demoteAdmin();
      renderSettings(mount);
    }, { passive:false });
  }

  if (seedBtn) {
    seedBtn.addEventListener('click', () => {
      // Adds +11 to current invites (still respects unlimited if enabled)
      if (Store.get('invites.unlimited')) {
        try { document.dispatchEvent(new CustomEvent('ui:toast', { detail: { type:'ok', message: 'Already unlimited invites (admin).' }})); } catch {}
        return;
      }
      const current = Number(Store.get('invites.left')) || 0;
      Store.set('invites.left', current + 11);
      Events.emit?.('invite:quota:updated', { unlimited: false });
      try { document.dispatchEvent(new CustomEvent('ui:toast', { detail: { type:'ok', message: 'Added +11 invites.' }})); } catch {}
      renderSettings(mount);
    }, { passive:false });
  }
}

export default { renderSettings };