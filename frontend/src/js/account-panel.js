import { InvitesAPI } from './invites-api.js';

export async function renderAccount(root){
  const mount = root || document.getElementById('app');
  if (!mount) return;
  let email = localStorage.getItem('vel.email') || '';
  if (!email) {
    email = prompt('Enter your email (temp)') || '';
    if (email) localStorage.setItem('vel.email', email);
  }
  if (!email) { mount.innerHTML = '<div class="section-card"><div class="left-accent"></div><div>Email required.</div></div>'; return; }

  const { me } = await InvitesAPI.me(email);
  mount.innerHTML = `
    <section class="section-card">
      <div class="left-accent"></div>
      <header class="section-head">
        <h2 class="text-heading">Account</h2>
        <div class="subtle">${me.email}</div>
      </header>

      <div class="cards-grid">
        <article class="party-card">
          <div class="pc-top">
            <h3 class="pc-title">Your profile</h3>
            <div class="pc-badges">
              <span class="chip">${me.isAdmin ? 'Admin' : 'Member'}</span>
              <span class="chip">${me.invitesRemaining ?? 0} invites</span>
            </div>
          </div>
          <div class="pc-meta">
            <div class="pc-row"><span class="pc-ico">=d</span><span>${me.name || ''}</span></div>
            <div class="pc-row"><span class="pc-ico">=ç</span><span>${me.email}</span></div>
            <div class="pc-row"><span class="pc-ico">>í</span><span>Invited by: ${me.invitedBy || ''}</span></div>
          </div>
          <div class="pc-actions">
            <button class="btn btn-ghost" onclick="alert('SSO coming soon')">Link LinkedIn</button>
            <button class="btn">Export data</button>
          </div>
        </article>
      </div>
    </section>
  `;
}
export default { renderAccount };