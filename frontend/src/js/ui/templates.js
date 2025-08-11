/**
 * TEMPLATES MODULE
 * HTML template generation for Professional Intelligence Platform
 */

class Templates {
  constructor() {
    this.cache = new Map();
    this.helpers = this.createHelpers();
  }

  /**
   * Profile card template
   */
  profileCard(data) {
    const {
      id,
      name = 'Anonymous',
      title = 'Professional',
      persona = 'developer',
      level = 'starter',
      avatar = null,
      distance = null,
      status = 'offline',
      skills = [],
      isNearby = false,
      isAlumni = false
    } = data;

    const statusIcon = {
      available: '🟢',
      busy: '🟡',
      offline: '⚫',
      private: '🔴'
    }[status] || '⚫';

    const levelColors = {
      starter: 'var(--pi-level-starter)',
      connected: 'var(--pi-level-connected)',
      influencer: 'var(--pi-level-influencer)',
      leader: 'var(--pi-level-leader)',
      legend: 'var(--pi-level-legend)'
    };

    return `
      <div class="pi-profile" data-profile-id="${id}">
        <div class="pi-profile-avatar" style="background: ${this.getPersonaGradient(persona)}">
          ${avatar ? `<img src="${avatar}" alt="${name}">` : name.charAt(0)}
          <div class="pi-profile-status ${status}"></div>
        </div>
        
        <div class="pi-profile-info">
          <div class="pi-profile-name">${this.escapeHtml(name)}</div>
          <div class="pi-profile-title">${this.escapeHtml(title)}</div>
          
          ${skills.length > 0 ? `
            <div class="pi-profile-tags">
              ${skills.slice(0, 3).map(skill => 
                `<span class="pi-profile-tag">${this.escapeHtml(skill)}</span>`
              ).join('')}
            </div>
          ` : ''}
          
          ${distance ? `
            <div class="pi-proximity">
              <div class="pi-proximity-icon"></div>
              <span>${distance}m away</span>
            </div>
          ` : ''}
        </div>
        
        <div class="pi-profile-level" style="background: ${levelColors[level]}">
          ⭐ ${level.charAt(0).toUpperCase() + level.slice(1)}
        </div>
        
        <div class="pi-profile-actions">
          <button class="btn btn-primary" data-action="connect">
            🤝 Connect
          </button>
          <button class="btn btn-ghost" data-action="message">
            💬
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Opportunity card template
   */
  opportunityCard(data) {
    const {
      id,
      title = 'Untitled Opportunity',
      description = '',
      type = 'collaboration',
      skills = [],
      matchScore = 0,
      company = '',
      remote = false,
      urgent = false,
      createdAt = new Date(),
      applications = 0
    } = data;

    const typeIcons = {
      collaboration: '🤝',
      investment: '💰',
      hiring: '👔',
      partnership: '🚀'
    };

    return `
      <div class="pi-opportunity" data-opportunity-id="${id}">
        <div class="pi-opportunity-header">
          <div class="pi-opportunity-match">
            <span class="pi-opportunity-match-score">${Math.round(matchScore * 100)}%</span>
            <span>Match</span>
          </div>
          <div class="pi-opportunity-type">${typeIcons[type]} ${type}</div>
        </div>
        
        <div class="pi-opportunity-content">
          <h3 class="pi-opportunity-title">${this.escapeHtml(title)}</h3>
          
          ${company ? `<div class="pi-opportunity-company">📍 ${this.escapeHtml(company)}</div>` : ''}
          
          <p class="pi-opportunity-description">
            ${this.escapeHtml(this.truncate(description, 120))}
          </p>
          
          ${skills.length > 0 ? `
            <div class="pi-opportunity-skills">
              ${skills.slice(0, 5).map(skill => 
                `<span class="pi-opportunity-skill">${this.escapeHtml(skill)}</span>`
              ).join('')}
            </div>
          ` : ''}
          
          <div class="pi-opportunity-meta">
            ${remote ? '<span class="pi-meta-tag">🌍 Remote</span>' : ''}
            ${urgent ? '<span class="pi-meta-tag urgent">⚡ Urgent</span>' : ''}
            <span class="pi-meta-tag">${applications} applications</span>
            <span class="pi-meta-tag">${this.timeAgo(createdAt)}</span>
          </div>
        </div>
        
        <div class="pi-opportunity-actions">
          <button class="pi-opportunity-btn pi-opportunity-btn-primary" data-action="apply">
            Apply Now
          </button>
          <button class="pi-opportunity-btn pi-opportunity-btn-secondary" data-action="save">
            Save for Later
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Event card template
   */
  eventCard(data) {
    const {
      id,
      name = 'Untitled Event',
      description = '',
      date,
      startTime = 'TBA',
      venue = 'TBA',
      category = 'networking',
      hosts = '',
      capacity = null,
      attending = 0,
      isUGC = false,
      creator = null
    } = data;

    const categoryIcons = {
      networking: '🤝',
      afterparty: '🎉',
      mixer: '🍸',
      launch: '🚀',
      conference: '🎤'
    };

    return `
      <article class="event-card ${isUGC ? 'ugc-event' : ''}" data-event-id="${id}">
        <div class="event-header">
          <div class="event-badges">
            ${isUGC ? 
              '<span class="badge badge-ugc">👥 Community</span>' : 
              '<span class="badge badge-official">✨ Official</span>'
            }
            <span class="badge badge-category">
              ${categoryIcons[category]} ${category.charAt(0).toUpperCase() + category.slice(1)}
            </span>
          </div>
          <h3 class="event-title">${this.escapeHtml(name)}</h3>
        </div>
        
        <div class="event-meta">
          <div class="meta-item">
            <span class="meta-icon">📅</span>
            <span class="meta-text">${this.formatDate(date)}</span>
          </div>
          <div class="meta-item">
            <span class="meta-icon">🕐</span>
            <span class="meta-text">${startTime}</span>
          </div>
          <div class="meta-item">
            <span class="meta-icon">📍</span>
            <span class="meta-text">${this.escapeHtml(venue)}</span>
          </div>
          ${capacity ? `
            <div class="meta-item">
              <span class="meta-icon">👥</span>
              <span class="meta-text">${attending}/${capacity}</span>
            </div>
          ` : ''}
        </div>
        
        ${description ? `
          <p class="event-description">${this.escapeHtml(this.truncate(description, 120))}</p>
        ` : ''}
        
        ${hosts ? `
          <div class="event-hosts">
            <span class="hosts-label">Hosted by:</span>
            <span class="hosts-names">${this.escapeHtml(hosts)}</span>
          </div>
        ` : ''}
        
        ${isUGC && creator ? `
          <div class="creator-info">Created by ${this.escapeHtml(creator)}</div>
        ` : ''}
        
        <div class="event-actions">
          <button class="btn btn-primary" data-action="save">
            📅 Save Event
          </button>
          <button class="btn btn-secondary" data-action="share">
            📤 Share
          </button>
          <button class="btn btn-ghost" data-action="directions">
            🗺️ Directions
          </button>
        </div>
      </article>
    `;
  }

  /**
   * Status card template for home view
   */
  statusCard(data) {
    const {
      user,
      nearbyCount = 0,
      opportunityCount = 0,
      eventCount = 0,
      level = 'starter',
      score = 0
    } = data;

    return `
      <div class="status-card pi-card">
        <div class="status-header">
          <div class="user-avatar">
            ${user.name ? user.name.charAt(0) : '?'}
          </div>
          <div class="user-info">
            <h2>Welcome, ${this.escapeHtml(user.name || 'Professional')}!</h2>
            <div class="user-level">
              Level: <span class="level-badge">${level}</span>
              <span class="score">${score} pts</span>
            </div>
          </div>
        </div>
        
        <div class="status-stats">
          <div class="stat-item" data-action="people.nearby">
            <div class="stat-number">${nearbyCount}</div>
            <div class="stat-label">Nearby</div>
          </div>
          <div class="stat-item" data-action="opportunities.view">
            <div class="stat-number">${opportunityCount}</div>
            <div class="stat-label">Opportunities</div>
          </div>
          <div class="stat-item" data-action="events.tonight">
            <div class="stat-number">${eventCount}</div>
            <div class="stat-label">Tonight</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Empty state template
   */
  emptyState(data) {
    const {
      icon = '🔍',
      title = 'Nothing here yet',
      subtitle = '',
      action = null,
      actionHandler = null
    } = data;

    return `
      <div class="empty-state">
        <div class="empty-icon">${icon}</div>
        <h3 class="empty-title">${this.escapeHtml(title)}</h3>
        ${subtitle ? `<p class="empty-subtitle">${this.escapeHtml(subtitle)}</p>` : ''}
        ${action && actionHandler ? `
          <button class="btn btn-primary" data-action="${actionHandler}">
            ${this.escapeHtml(action)}
          </button>
        ` : ''}
      </div>
    `;
  }

  /**
   * Intent toggle template
   */
  intentToggle(data) {
    const { enabled = false, description = '' } = data;

    return `
      <div class="intent-toggle-card pi-card">
        <div class="intent-header">
          <h3>🎯 Opportunity Intent</h3>
          <label class="toggle-switch">
            <input type="checkbox" ${enabled ? 'checked' : ''} data-action="intent.toggle">
            <span class="toggle-slider"></span>
          </label>
        </div>
        <p class="intent-description">${this.escapeHtml(description)}</p>
        <div class="intent-status ${enabled ? 'enabled' : 'disabled'}">
          ${enabled ? '✅ You\'re open to opportunities' : '🔒 Opportunity matching disabled'}
        </div>
      </div>
    `;
  }

  /**
   * Loading state template
   */
  loadingState(message = 'Loading...') {
    return `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p class="loading-message">${this.escapeHtml(message)}</p>
      </div>
    `;
  }

  /**
   * Create template helpers
   */
  createHelpers() {
    return {
      escapeHtml: this.escapeHtml.bind(this),
      truncate: this.truncate.bind(this),
      formatDate: this.formatDate.bind(this),
      timeAgo: this.timeAgo.bind(this),
      getPersonaGradient: this.getPersonaGradient.bind(this)
    };
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Truncate text
   */
  truncate(text, maxLength) {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength).trim() + '...';
  }

  /**
   * Format date
   */
  formatDate(dateStr) {
    if (!dateStr) return 'TBA';
    
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const dayDiff = Math.floor((eventDate - today) / (1000 * 60 * 60 * 24));
    
    if (dayDiff === 0) return 'Today';
    if (dayDiff === 1) return 'Tomorrow';
    if (dayDiff === -1) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    });
  }

  /**
   * Time ago helper
   */
  timeAgo(date) {
    if (!date) return '';
    
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return new Date(date).toLocaleDateString();
  }

  /**
   * Get persona gradient
   */
  getPersonaGradient(persona) {
    const gradients = {
      developer: 'linear-gradient(135deg, #10b981, #059669)',
      publisher: 'linear-gradient(135deg, #f59e0b, #d97706)',
      investor: 'linear-gradient(135deg, #6366f1, #4f46e5)',
      service: 'linear-gradient(135deg, #a855f7, #9333ea)'
    };
    
    return gradients[persona] || gradients.developer;
  }

  /**
   * Clear template cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cached template or generate new one
   */
  getCached(key, generator) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    const result = generator();
    this.cache.set(key, result);
    return result;
  }
}

// Create singleton instance
export const templates = new Templates();

// Export class for testing
export default Templates;

// Inject small template fragments (kept minimal to avoid duplication)
document.addEventListener('DOMContentLoaded', () => {
  // Opportunity toggle template fragment
  const toggleContainer = document.getElementById('tpl-toggle');
  if (toggleContainer) {
    toggleContainer.innerHTML = `
      <section class="opportunity-toggle-container">
        <div class="toggle-label">Opportunity Visibility</div>
        <div class="opportunity-switch" data-action="intent.toggle">
          <div class="switch-handle"></div>
        </div>
      </section>
    `;
  }

  // Invite card template fragment
  const inviteContainer = document.getElementById('tpl-invite-card');
  if (inviteContainer) {
    inviteContainer.innerHTML = `
      <section class="invite-container">
        <div class="invite-scarcity">
          <span class="invites-remaining" id="invites-remaining">10</span>
        </div>
        <div class="invite-code-display">
          <span class="invite-code" id="invite-code">GC2025-_____</span>
        </div>
        <button class="share-button" data-action="invite.share">Share Invite</button>
      </section>
    `;
  }
});