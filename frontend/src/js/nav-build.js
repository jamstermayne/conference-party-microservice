/**
 * nav-build.js
 * Rebuilds the Slack-inspired sidebar with correct #channels + accent bar.
 * Safe to run repeatedly; idempotent.
 */
import { bindSidebar, route, currentRoute } from '/js/router.js';
import Events from '/assets/js/events.js';

const CHANNELS = [
  { id: 'parties',   label: 'parties'   },
  { id: 'hotspots',  label: 'hotspots'  },
  { id: 'map',       label: 'map'       },
  { id: 'calendar',  label: 'calendar'  },
  { id: 'invites',   label: 'invites'   },
];

const UTIL = [
  // Account is NOT a channel — use gear icon
  { id: 'me',        label: 'Account',  icon: '⚙', isAccount: true },
  { id: 'settings',  label: 'settings' }, // optional: can hide later
];

function ensureSidebar() {
  const side = document.querySelector('#sidenav');
  if (!side) return;

  // Brand alignment fix
  side.innerHTML = `
    <div class="side-head">
      <div class="brand">
        <span class="brand-mark">velocity.ai</span>
        <span class="workspace">Gamescom 2025</span>
      </div>
    </div>
    <nav id="side-nav" class="side-nav" aria-label="Primary">
      <div class="side-section" id="channels"></div>
      <div class="side-section" id="account"></div>
    </nav>
  `;

  // Channels (#channel labels are added via CSS ::before)
  const chan = side.querySelector('#channels');
  CHANNELS.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'nav-link';
    btn.type = 'button';
    btn.setAttribute('data-route', c.id);
    btn.setAttribute('data-kind', 'channel');
    btn.textContent = c.label;        // NO LEADING '#'
    chan.appendChild(btn);
  });

  // Account / settings (no # prefix here)
  const acct = side.querySelector('#account');
  UTIL.forEach(u => {
    const btn = document.createElement('button');
    btn.className = 'nav-link util';
    btn.type = 'button';
    btn.setAttribute('data-route', u.id);
    btn.setAttribute('data-kind', u.isAccount ? 'account' : 'util');
    btn.innerHTML = u.isAccount
      ? `<span class="icon">⚙</span><span>${u.label}</span>`
      : `<span>${u.label}</span>`;
    acct.appendChild(btn);
  });

  // Accent bar support (handled by CSS + .active class)
  bindSidebar(side.querySelector('#side-nav'));

  // Ensure we activate the current route (fixes "blink then disappear")
  const r = currentRoute();
  const target = side.querySelector(`[data-route="${r}"]`);
  if (target) target.classList.add('active');
}

document.addEventListener('DOMContentLoaded', ensureSidebar);
Events.on('route', (r) => {
  // update active state on route changes
  const side = document.querySelector('#side-nav');
  if (!side) return;
  side.querySelectorAll('[data-route]').forEach(n => n.classList.toggle('active', n.dataset.route === r));
});