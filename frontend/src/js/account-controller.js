// account-controller.js
import { getSaved } from './selection-store.js';
import { toast } from './ui-feedback.js';
import { getJSON } from './http.js';

function block(title, value, action = '') {
  return `
  <div class="event-card" role="group" aria-label="${title}">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <h3>${title}</h3>
      ${action ? `<button class="btn-ghost" data-action="${action}">Manage</button>` : ''}
    </div>
    <div style="color:#b9c1ce;font-size:14px;margin-top:6px;">${value}</div>
  </div>`;
}

export async function renderAccount(ROOT) {
  if (!ROOT) return;
  
  let server = {};
  try {
    server = await getJSON('/api/account'); // ok if 404 – we'll fall back
  } catch {}
  
  const saved = getSaved();

  ROOT.innerHTML = `
    <div class="section-card">
      <div class="left-accent" aria-hidden="true"></div>
      <h2 class="text-heading">Account</h2>
      <p class="text-secondary">Manage your profile and settings</p>
      <div class="card-grid" style="margin-top: 20px;">
        ${block('Saved Events', `${saved.length} selected (max 3)`)}
        ${block('Invites Sent', String(server.invitesSent ?? '—'))}
        ${block('Invites Redeemed', String(server.invitesRedeemed ?? '—'))}
        ${block('Invites Left', String(server.invitesLeft ?? '—'))}
        ${block('Email', server.email ?? '—', 'email')}
        ${block('Phone', server.phone ?? '—', 'phone')}
        ${block('LinkedIn', server.linkedin ?? '—', 'linkedin')}
        ${block('Security', 'Change password or unlink providers', 'security')}
      </div>
    </div>
  `;
  
  ROOT.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    toast(`${action} settings coming soon`, 'info');
  });
}

export default { renderAccount };