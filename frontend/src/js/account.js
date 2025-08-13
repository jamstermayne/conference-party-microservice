export function renderAccount(root){
  const wrap = document.createElement('section');
  wrap.className = 'section-card';
  wrap.innerHTML = `
    <div class="left-accent" aria-hidden="true"></div>
    <div class="section-body">
      <div class="header-row">
        <div class="header-title">Account</div>
        <div class="header-meta muted">Profile · Security · Integrations</div>
      </div>

      <div class="grid" style="grid-template-columns:1fr 1fr;gap:12px">
        <div class="card">
          <div class="card-header"><div class="card-title">Profile</div></div>
          <div class="card-body">
            <div class="card-row">Email: <span class="muted" id="acct-email">—</span></div>
            <div class="card-row">LinkedIn: <span class="muted" id="acct-li">Not connected</span></div>
          </div>
          <div class="card-actions">
            <button class="btn btn-outline" data-action="change-email">Change Email</button>
            <button class="btn btn-outline" data-action="connect-li">Connect LinkedIn</button>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">Security</div></div>
          <div class="card-body">
            <div class="card-row">Recovery email: <span class="muted" id="acct-recovery">Add a backup</span></div>
          </div>
          <div class="card-actions">
            <button class="btn btn-outline" data-action="change-password">Change Password</button>
            <button class="btn btn-outline" data-action="set-recovery">Add Backup Email</button>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">Invites</div></div>
          <div class="card-body">
            <div class="card-row">Invites left: <strong id="acct-invites">—</strong></div>
            <div class="card-row muted">Bonuses unlock as invites are redeemed.</div>
          </div>
          <div class="card-actions">
            <button class="btn btn-primary" data-action="view-invites">Manage Invites</button>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">Calendar</div></div>
          <div class="card-body">
            <div class="card-row">Google Calendar: <span class="muted">Not connected</span></div>
          </div>
          <div class="card-actions">
            <button class="btn btn-outline" data-action="connect-google">Connect Google</button>
          </div>
        </div>
      </div>
    </div>
  `;
  root.appendChild(wrap);
}