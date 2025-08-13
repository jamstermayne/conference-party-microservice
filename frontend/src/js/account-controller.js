/**
 * Account Hub (v1) — aggregates profile + invites + connections
 * Vanilla JS, Events/Store integrated, safe if APIs are missing.
 */
import Events from '/assets/js/events.js?v=b011';
import Store from '/js/store.js?v=b011';
import { toast, emptyState } from '/js/ui-feedback.js?v=b011';

const API_BASE = (window.__ENV && window.__ENV.API_BASE) || '/api';

function el(html){ const t=document.createElement('template'); t.innerHTML=html.trim(); return t.content.firstElementChild; }

function field(label, value, id){
  return el(`
    <div class="acc-field">
      <label for="${id}">${label}</label>
      <input id="${id}" type="text" value="${value || ''}" />
    </div>
  `);
}

function stat(label, value){
  return el(`
    <div class="acc-stat card card-compact">
      <div class="acc-stat-val">${value ?? 0}</div>
      <div class="acc-stat-label">${label}</div>
    </div>
  `);
}

async function getJSON(url) {
  try {
    const r = await fetch(url); if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch(e) {
    return null;
  }
}

async function loadAggregates(){
  // Soft calls; tolerate missing endpoints
  const [inv, conn] = await Promise.allSettled([
    getJSON(`${API_BASE}/invites/status`),
    getJSON(`${API_BASE}/network/summary`)
  ]);

  const invitesLeft   = inv.value?.left ?? Store.get('invites.left') ?? 0;
  const invitesSent   = inv.value?.sent ?? Store.get('invites.sent') ?? 0;
  const invitesUsed   = inv.value?.used ?? Store.get('invites.used') ?? 0;
  const connections   = conn.value?.connections ?? Store.get('network.connections') ?? 0;
  const eventsJoined  = conn.value?.events ?? Store.get('network.events') ?? 0;

  return { invitesLeft, invitesSent, invitesUsed, connections, eventsJoined };
}

function profileSection(user){
  const name = user?.name || '';
  const email = user?.email || '';
  const backup = user?.backupEmail || '';
  const phone = user?.phone || '';
  const li = user?.linkedin || '';

  const card = el(`
    <section class="acc-card card card-elevated">
      <header class="acc-card-header">
        <div class="acc-icon">⚙️</div>
        <h2>Account</h2>
      </header>
      <div class="acc-grid">
      </div>
      <div class="acc-actions">
        <button class="btn btn-primary" data-action="save-profile">Save</button>
      </div>
    </section>
  `);

  const grid = card.querySelector('.acc-grid');
  grid.append(
    field('Display name', name, 'acc-name'),
    field('Email', email, 'acc-email'),
    field('Backup email (recommended)', backup, 'acc-backup'),
    field('Phone', phone, 'acc-phone'),
    field('LinkedIn URL', li, 'acc-li')
  );

  card.addEventListener('click', async (e)=>{
    const btn = e.target.closest('button[data-action="save-profile"]');
    if (!btn) return;
    // persist locally (and emit for backend if available)
    const next = {
      name: document.getElementById('acc-name')?.value.trim(),
      email: document.getElementById('acc-email')?.value.trim(),
      backupEmail: document.getElementById('acc-backup')?.value.trim(),
      phone: document.getElementById('acc-phone')?.value.trim(),
      linkedin: document.getElementById('acc-li')?.value.trim(),
    };
    Store.patch('user.profile', next);
    Events.emit('profile:updated', next);
    // Optionally POST to API if endpoint exists
    try {
      if (window.__ENV?.PROFILE_API) {
        await fetch(`${API_BASE}/profile`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(next)});
      }
      toast('Profile saved', 'ok');
    } catch { toast('Saved locally. Network failed.', 'warning'); }
  });

  return card;
}

function securitySection(){
  const card = el(`
    <section class="acc-card card card-elevated">
      <header class="acc-card-header">
        <div class="acc-icon">🔒</div>
        <h2>Security</h2>
      </header>
      <div class="acc-actions gap">
        <button class="btn btn-secondary" data-action="link-google">Link Google</button>
        <button class="btn btn-secondary" data-action="link-linkedin">Link LinkedIn</button>
        <button class="btn btn-outline" data-action="add-recovery">Add recovery email</button>
      </div>
    </section>
  `);

  card.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'link-google')  Events.emit('auth:google');
    if (action === 'link-linkedin') Events.emit('auth:linkedin');
    if (action === 'add-recovery')  toast('Enter a backup email above and hit Save.', 'ok');
  });

  return card;
}

function summarySection(stats){
  const { invitesLeft, invitesSent, invitesUsed, connections, eventsJoined } = stats;
  const card = el(`
    <section class="acc-card card card-elevated">
      <header class="acc-card-header">
        <div class="acc-icon">📊</div>
        <h2>Summary</h2>
      </header>
      <div class="acc-stats">
      </div>
    </section>
  `);
  const wrap = card.querySelector('.acc-stats');
  wrap.append(
    stat('Invites left', invitesLeft),
    stat('Invites sent', invitesSent),
    stat('Invites redeemed', invitesUsed),
    stat('Connections', connections),
    stat('Events joined', eventsJoined)
  );
  return card;
}

export async function initAccountView() {
  const root = document.getElementById('route-account') || document.getElementById('main') || document.getElementById('page-root');
  if (!root) return;

  root.innerHTML = `
    <div class="account-view">
      <header class="account-header">
        <div class="hash-tag">#</div>
        <h1 class="ph-title">account</h1>
      </header>
      <div class="account-grid" id="account-grid"></div>
    </div>
  `;

  const user = Store.get('user') || {};
  const grid = document.getElementById('account-grid');

  const [stats] = await Promise.all([loadAggregates()]);

  grid.append(
    profileSection(user.profile || user),
    securitySection(),
    summarySection(stats)
  );
}

// Keep legacy renderAccount for compatibility
export function renderAccount() {
  return initAccountView();
}

// Auto-init on route change
try {
  document.addEventListener('route:change', (e)=>{
    if ((e.detail?.name) === 'account') initAccountView();
  });
} catch {}

// Legacy hashchange support
window.addEventListener('hashchange', () => {
  if (location.hash.replace('#/','') === 'account') initAccountView();
});

console.log('✅ Account controller loaded');

export default { initAccountView, renderAccount };