/**
 * HOME VIEWS MODULE
 * Template rendering functions for Professional Intelligence Platform home view
 */

import { ViewTX } from './viewTX.js?v=b011';

export function renderStatusCard(mount, s) {
  const html = `
  <section class="card">
    <div class="row" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <div>
        <div class="text-md" style="font-weight:700">Presence</div>
        <div class="text-sm" style="color:var(--text-secondary)">${s.presence.level.toUpperCase()} • ${s.presence.ttlHrs}h</div>
      </div>
      <button class="btn" data-action="presence.edit">Edit</button>
    </div>

    <div class="row" style="display:flex;justify-content:space-between;align-items:center">
      <div class="text-md" style="font-weight:700">Opportunity</div>
      <button class="btn" data-action="intent.toggle">${s.intent.on ? 'ON' : 'OFF'}</button>
    </div>

    <div class="row small" style="margin-top:8px;color:var(--text-secondary)">
      ${s.invites.left} invites left
    </div>
  </section>`;
  ViewTX.run(() => mount.innerHTML = html);
}

export function renderHotspots(mount, list) {
  const html = list.map(h => `
    <article class="hotspot-card" data-id="${h.id}">
      <header class="hotspot-header">${h.name}</header>
      <div class="hotspot-intelligence">${h.total || 0} professionals networking now</div>
      <div class="hotspot-breakdown">
        <span class="persona-pill persona-dev">${h.dev || 0} Dev</span>
        <span class="persona-pill persona-pub">${h.pub || 0} Pub</span>
        <span class="persona-pill persona-inv">${h.inv || 0} Inv</span>
        <span class="persona-pill persona-sp">${h.sp || 0} SP</span>
      </div>
      ${(h.total || 0) >= 3 ? `<button class="reveal-btn" data-action="hotspot.reveal" data-id="${h.id}">Reveal Who's Here</button>` : ``}
    </article>
  `).join('');
  ViewTX.run(() => mount.innerHTML = html);
}

export function renderEvents(mount, events) {
  const html = events.map(ev => `
    <article class="event-card" data-id="${ev.id}">
      <div class="event-header">
        <div class="event-title">${ev.title}</div>
        <div class="event-time">${ev.timeLabel}</div>
      </div>
      <div class="event-venue">${ev.venue}</div>
      <div class="event-attendance">${ev.attending || 0} people going</div>
      <div class="event-actions">
        <button class="action-button rsvp-button" data-action="event.rsvp" data-id="${ev.id}">RSVP</button>
        <button class="action-button calendar-button" data-action="event.calendar" data-id="${ev.id}">📅 Calendar</button>
        <button class="action-button navigate-button" data-action="event.navigate" data-id="${ev.id}">🧭 Navigate</button>
      </div>
    </article>
  `).join('');
  ViewTX.run(() => mount.innerHTML = html);
}

// Additional Professional Intelligence home view components

export function renderNetworkOverview(mount, network) {
  const html = `
    <section class="network-overview card">
      <header class="card-header">
        <h3 class="card-title">Professional Network</h3>
        <span class="network-status ${network.connections > 0 ? 'active' : 'dormant'}">
          ${network.connections > 0 ? '🟢 Active' : '⭕ Building'}
        </span>
      </header>
      
      <div class="network-stats">
        <div class="stat-group">
          <div class="stat-number">${network.connections || 0}</div>
          <div class="stat-label">Connections</div>
        </div>
        <div class="stat-group">
          <div class="stat-number">${network.events || 0}</div>
          <div class="stat-label">Events</div>
        </div>
        <div class="stat-group">
          <div class="stat-number">${network.messages || 0}</div>
          <div class="stat-label">Messages</div>
        </div>
      </div>

      ${network.history && network.history.length > 0 ? `
        <div class="recent-activity">
          <h4 class="activity-title">Recent Activity</h4>
          ${network.history.slice(0, 3).map(activity => `
            <div class="activity-item">
              <span class="activity-icon">${getActivityIcon(activity.type)}</span>
              <span class="activity-text">${activity.description}</span>
              <span class="activity-time">${formatTimeAgo(activity.timestamp)}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="network-actions">
        <button class="btn btn-primary" data-action="network.discover">Discover People</button>
        <button class="btn btn-ghost" data-action="network.analytics">View Analytics</button>
      </div>
    </section>
  `;
  ViewTX.run(() => mount.innerHTML = html);
}

export function renderQuickActions(mount, user, context = {}) {
  const actions = getContextualActions(user, context);
  
  const html = `
    <section class="quick-actions card">
      <header class="card-header">
        <h3 class="card-title">Quick Actions</h3>
        <span class="context-indicator">${context.venue || 'Gamescom'}</span>
      </header>
      
      <div class="action-grid">
        ${actions.map(action => `
          <button class="action-tile" data-action="${action.id}" ${action.disabled ? 'disabled' : ''}>
            <div class="action-icon">${action.icon}</div>
            <div class="action-label">${action.label}</div>
            ${action.badge ? `<div class="action-badge">${action.badge}</div>` : ''}
          </button>
        `).join('')}
      </div>
    </section>
  `;
  ViewTX.run(() => mount.innerHTML = html);
}

export function renderOpportunityWidget(mount, opportunities) {
  const topMatches = opportunities.slice(0, 2); // Show top 2 matches
  
  const html = `
    <section class="opportunity-widget card">
      <header class="card-header">
        <h3 class="card-title">Top Opportunities</h3>
        <span class="match-count">${opportunities.length} matches</span>
      </header>

      ${topMatches.length > 0 ? `
        <div class="opportunity-preview">
          ${topMatches.map(opp => `
            <div class="opportunity-mini" data-id="${opp.id}">
              <div class="opportunity-match">
                <span class="match-score">${Math.round(opp.matchScore * 100)}%</span>
                <span class="match-label">match</span>
              </div>
              <div class="opportunity-content">
                <div class="opportunity-title">${opp.title}</div>
                <div class="opportunity-company">${opp.company}</div>
                <div class="opportunity-type">${opp.type}</div>
              </div>
              <button class="quick-apply-btn" data-action="opportunity.quick-apply" data-id="${opp.id}">
                Quick Apply
              </button>
            </div>
          `).join('')}
        </div>

        <div class="opportunity-actions">
          <button class="btn btn-primary" data-action="opportunities.view-all">
            View All ${opportunities.length} Opportunities
          </button>
        </div>
      ` : `
        <div class="empty-opportunities">
          <div class="empty-icon">🎯</div>
          <div class="empty-message">Enable opportunity matching to see personalized recommendations</div>
          <button class="btn btn-primary" data-action="intent.enable">Enable Opportunities</button>
        </div>
      `}
    </section>
  `;
  ViewTX.run(() => mount.innerHTML = html);
}

export function renderProximityAlert(mount, nearbyData) {
  if (!nearbyData || nearbyData.length === 0) {
    ViewTX.run(() => mount.innerHTML = '');
    return;
  }

  const html = `
    <section class="proximity-alert card alert-card">
      <div class="alert-header">
        <div class="alert-icon">📡</div>
        <div class="alert-content">
          <div class="alert-title">Professionals Nearby</div>
          <div class="alert-subtitle">${nearbyData.length} professionals in your area</div>
        </div>
        <button class="alert-dismiss" data-action="proximity.dismiss">×</button>
      </div>
      
      <div class="nearby-preview">
        ${nearbyData.slice(0, 3).map(person => `
          <div class="nearby-person">
            <div class="person-avatar" style="background: ${getPersonaColor(person.persona)}">
              ${person.name ? person.name.charAt(0) : '?'}
            </div>
            <div class="person-info">
              <div class="person-name">${person.name || 'Professional'}</div>
              <div class="person-distance">${person.distance}m away</div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="proximity-actions">
        <button class="btn btn-primary" data-action="proximity.explore">Explore Nearby</button>
        <button class="btn btn-ghost" data-action="proximity.settings">Settings</button>
      </div>
    </section>
  `;
  ViewTX.run(() => mount.innerHTML = html);
}

export function renderInviteStatus(mount, inviteData) {
  const { left, sent, pending, accepted } = inviteData;
  const acceptanceRate = sent > 0 ? Math.round((accepted / sent) * 100) : 0;
  
  const html = `
    <section class="invite-status card">
      <header class="card-header">
        <h3 class="card-title">Invite Status</h3>
        <span class="invite-badge">${left} left</span>
      </header>

      <div class="invite-metrics">
        <div class="metric-item">
          <div class="metric-number">${sent || 0}</div>
          <div class="metric-label">Sent</div>
        </div>
        <div class="metric-item">
          <div class="metric-number">${pending || 0}</div>
          <div class="metric-label">Pending</div>
        </div>
        <div class="metric-item">
          <div class="metric-number">${accepted || 0}</div>
          <div class="metric-label">Accepted</div>
        </div>
        <div class="metric-item">
          <div class="metric-number">${acceptanceRate}%</div>
          <div class="metric-label">Rate</div>
        </div>
      </div>

      <div class="invite-actions">
        <button class="btn btn-primary" data-action="invite.send" ${left <= 0 ? 'disabled' : ''}>
          Send Invite
        </button>
        <button class="btn btn-ghost" data-action="invite.manage">Manage</button>
      </div>
    </section>
  `;
  ViewTX.run(() => mount.innerHTML = html);
}

// Helper functions
function getActivityIcon(type) {
  const icons = {
    connection: '🤝',
    message: '💬',
    event: '📅',
    opportunity: '🎯',
    profile_view: '👁️'
  };
  return icons[type] || '📍';
}

function formatTimeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
}

function getPersonaColor(persona) {
  const colors = {
    developer: 'var(--dev-color)',
    publisher: 'var(--pub-color)', 
    investor: 'var(--inv-color)',
    service: 'var(--sp-color)'
  };
  return colors[persona] || 'var(--accent-primary)';
}

function getContextualActions(user, context) {
  const baseActions = [
    { id: 'invite.quick', icon: '📨', label: 'Send Invite', badge: null },
    { id: 'proximity.scan', icon: '📡', label: 'Scan Area', badge: null },
    { id: 'opportunities.browse', icon: '🎯', label: 'Opportunities', badge: null },
    { id: 'events.tonight', icon: '🌙', label: 'Tonight', badge: null }
  ];

  // Add contextual actions based on user state and location
  const actions = [...baseActions];

  if (context.venue) {
    actions.push({
      id: 'venue.navigate',
      icon: '🧭',
      label: 'Navigate',
      badge: null
    });
  }

  if (context.nearbyCount > 0) {
    actions[1].badge = context.nearbyCount;
  }

  if (!user?.intent?.on) {
    actions[2].disabled = true;
  }

  return actions;
}

// Export additional utilities
export const homeViewHelpers = {
  getActivityIcon,
  formatTimeAgo,
  getPersonaColor,
  getContextualActions
};

// Attach to window for debugging
if (typeof window !== 'undefined') {
  window.homeViews = {
    renderStatusCard,
    renderHotspots,
    renderEvents,
    renderNetworkOverview,
    renderQuickActions,
    renderOpportunityWidget,
    renderProximityAlert,
    renderInviteStatus
  };
}