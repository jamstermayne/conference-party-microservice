/**
 * me-controller.js
 * Renders the Account ("Me") view as a premium card.
 * - Auto-populates from Store.profile if present
 * - LinkedIn-enhanced data shows role badge & richer fields
 * - Google/Email fallbacks render cleanly without role
 */
import Store from '/js/store.js';
import Events from '/assets/js/events.js';
import { normalizeProfileFallbacks } from './profile-map.js';

function badgeHTML(role) {
  if (!role) return '';
  return `<span class="badge badge-primary">${role}</span>`;
}

function stat(label, value) {
  return `<div class="acct-stat"><span class="label">${label}</span><span class="value">${value}</span></div>`;
}

function actionRow(profile) {
  const hasLinkedIn = profile?.source === 'linkedin';
  return `
    <div class="acct-actions">
      ${hasLinkedIn ? `
        <button class="btn btn-secondary" data-action="reconnect-linkedin">Reconnect LinkedIn</button>
      ` : `
        <button class="btn btn-primary" data-action="connect-linkedin">
          <img src="/assets/svg/linkedin.svg" alt="" class="btn-icon" /> Connect LinkedIn
        </button>
      `}
      <button class="btn btn-outline" data-route="settings">Account Settings</button>
    </div>
  `;
}

function hallOfFame(invitees = []) {
  if (!Array.isArray(invitees) || invitees.length === 0) {
    return `
      <div class="card card-outlined card-compact text-secondary">
        No invitees yet — share your invite link from <span class="text-accent">#invites</span> to build your Hall of Fame.
      </div>
    `;
  }
  const items = invitees.slice(0, 8).map(p => `
    <div class="hof-item" title="${p.name || ''}">
      <img src="${p.avatar || '/assets/img/avatar-default.png'}" alt="" />
      <div class="hof-name">${p.name || ''}</div>
    </div>
  `).join('');
  return `
    <div class="hof-wrap">
      ${items}
    </div>
  `;
}

export function renderMe(rootEl) {
  const root = rootEl || document.getElementById('app') || document.getElementById('route-me') || document.getElementById('main');
  if (!root) return;

  const rawProfile = Store.get?.('profile') || {};
  const profile = normalizeProfileFallbacks(rawProfile);

  const invitesLeft = Store.get?.('invites.left') ?? 11;
  const connections = Store.get?.('network.connections') ?? 0;
  const redeemed    = Store.get?.('invites.redeemed') ?? 0;
  const invitees    = Store.get?.('invites.hof') || []; // Hall of Fame list (optional)

  root.innerHTML = `
    <section class="section-card account-card">
      <div class="left-accent" aria-hidden="true"></div>
      <header class="acct-header">
        <div class="acct-ident">
          <div class="avatar">
            ${profile.avatar ? `<img src="${profile.avatar}" alt="${profile.name}" />` : `<div class="avatar-fallback" aria-hidden="true">V</div>`}
          </div>
          <div class="ident-meta">
            <h2 class="text-heading acct-name">
              ${profile.name}
              ${badgeHTML(profile.role)}
            </h2>
            ${profile.headline || profile.company ? `
              <div class="acct-sub text-secondary">
                ${[profile.headline, profile.company].filter(Boolean).join(' · ')}
              </div>
            ` : ''}
            ${profile.linkedinUrl ? `
              <div class="acct-links">
                <a href="${profile.linkedinUrl}" target="_blank" rel="noopener" class="text-accent">View LinkedIn</a>
              </div>
            ` : ''}
          </div>
        </div>
        ${actionRow(profile)}
      </header>

      <div class="acct-stats card card-glass">
        ${stat('Invites Left', invitesLeft)}
        ${stat('Invites Redeemed', redeemed)}
        ${stat('Connections', connections)}
        ${profile.email ? stat('Email', profile.email) : ''}
      </div>

      <div class="card card-elevated acct-hof">
        <div class="card-header">
          <h3 class="text-heading">Invite Hall of Fame</h3>
          <p class="text-secondary">People who joined via your invites</p>
        </div>
        <div class="card-body">
          ${hallOfFame(invitees)}
        </div>
      </div>
    </section>
  `;

  // Wire actions
  root.querySelector('[data-action="connect-linkedin"]')?.addEventListener('click', () => {
    Events.emit?.('auth:linkedin:start');
  });
  root.querySelector('[data-action="reconnect-linkedin"]')?.addEventListener('click', () => {
    Events.emit?.('auth:linkedin:start');
  });
}

// Legacy support
export const renderAccount = renderMe;