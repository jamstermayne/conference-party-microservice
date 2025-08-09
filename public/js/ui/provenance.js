/**
 * PROVENANCE UI COMPONENT
 * Manages provenance chips and badges for connection context
 */

export const provenance = {
  /**
   * Create a provenance badge
   */
  createBadge(text, type = 'info', options = {}) {
    const badge = document.createElement('span');
    badge.className = `badge ${type}`;
    badge.textContent = text;
    
    if (options.icon) {
      badge.innerHTML = `${options.icon} ${text}`;
    }
    
    if (options.clickable) {
      badge.classList.add('badge-clickable');
      badge.setAttribute('tabindex', '0');
    }
    
    if (options.removable) {
      badge.classList.add('badge-removable');
      badge.innerHTML += ' <span class="badge-remove">×</span>';
      
      badge.querySelector('.badge-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        badge.remove();
        options.onRemove?.(badge);
      });
    }
    
    return badge;
  },
  
  /**
   * Create provenance chip for connections
   */
  createConnectionChip(data) {
    const { type, conference, event, metAt, source } = data;
    
    switch (type) {
      case 'conference':
        return this.createBadge(conference, 'info', {
          icon: '📍',
          clickable: true
        });
        
      case 'event':
        return this.createBadge(event, 'success', {
          icon: '🎉',
          clickable: true
        });
        
      case 'metAt':
        return this.createBadge(metAt, 'secondary', {
          icon: '🤝',
          clickable: true
        });
        
      case 'source':
        return this.createBadge(source, 'primary', {
          icon: this.getSourceIcon(source)
        });
        
      case 'nearby':
        return this.createBadge('Nearby', 'success', {
          icon: '📍',
          animated: true
        });
        
      case 'starred':
        return this.createBadge('Starred', 'warning', {
          icon: '⭐'
        });
        
      default:
        return this.createBadge(data.text || 'Unknown', data.type || 'info');
    }
  },
  
  /**
   * Get icon for source type
   */
  getSourceIcon(source) {
    const icons = {
      'google': '📅',
      'ics': '📋',
      'manual': '✍️',
      'scan': '📱',
      'proximity': '📡',
      'referral': '🔗',
      'linkedin': '💼',
      'meettomatch': '🤝'
    };
    
    return icons[source.toLowerCase()] || '📋';
  },
  
  /**
   * Create timeline badge
   */
  createTimelineBadge(timestamp, event, options = {}) {
    const badge = this.createBadge(
      this.formatTimelineBadge(timestamp, event),
      'secondary',
      options
    );
    
    badge.classList.add('badge-timeline');
    badge.dataset.timestamp = timestamp;
    
    return badge;
  },
  
  /**
   * Format timeline badge text
   */
  formatTimelineBadge(timestamp, event) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    let timeText;
    if (diffDays === 0) {
      timeText = 'Today';
    } else if (diffDays === 1) {
      timeText = 'Yesterday';
    } else if (diffDays < 7) {
      timeText = `${diffDays}d ago`;
    } else {
      timeText = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    return event ? `${timeText} • ${event}` : timeText;
  },
  
  /**
   * Create status badge
   */
  createStatusBadge(status) {
    const statusConfig = {
      connected: { text: 'Connected', type: 'success', icon: '✓' },
      pending: { text: 'Pending', type: 'warning', icon: '⏳' },
      invited: { text: 'Invited', type: 'info', icon: '📬' },
      declined: { text: 'Declined', type: 'error', icon: '✗' },
      blocked: { text: 'Blocked', type: 'error', icon: '🚫' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return this.createBadge(`${config.icon} ${config.text}`, config.type);
  },
  
  /**
   * Create skill badge
   */
  createSkillBadge(skill, level = null) {
    let text = skill;
    let type = 'info';
    
    if (level) {
      const levelConfig = {
        expert: { suffix: '⭐', type: 'warning' },
        advanced: { suffix: '▲', type: 'success' },
        intermediate: { suffix: '●', type: 'info' },
        beginner: { suffix: '○', type: 'secondary' }
      };
      
      const config = levelConfig[level.toLowerCase()];
      if (config) {
        text += ` ${config.suffix}`;
        type = config.type;
      }
    }
    
    const badge = this.createBadge(text, type);
    badge.classList.add('badge-skill');
    return badge;
  },
  
  /**
   * Create priority badge
   */
  createPriorityBadge(priority) {
    const priorityConfig = {
      high: { text: 'High Priority', type: 'error', icon: '🔴' },
      medium: { text: 'Medium Priority', type: 'warning', icon: '🟡' },
      low: { text: 'Low Priority', type: 'info', icon: '🟢' }
    };
    
    const config = priorityConfig[priority.toLowerCase()] || priorityConfig.medium;
    return this.createBadge(`${config.icon} ${config.text}`, config.type);
  },
  
  /**
   * Update provenance container
   */
  updateContainer(container, badges) {
    if (!container) return;
    
    // Clear existing badges
    container.innerHTML = '';
    
    // Add new badges
    badges.forEach(badgeData => {
      const badge = typeof badgeData === 'string' 
        ? this.createBadge(badgeData)
        : this.createConnectionChip(badgeData);
      
      container.appendChild(badge);
    });
  },
  
  /**
   * Animate badge addition
   */
  animateIn(badge) {
    badge.style.opacity = '0';
    badge.style.transform = 'scale(0.8)';
    badge.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    
    requestAnimationFrame(() => {
      badge.style.opacity = '1';
      badge.style.transform = 'scale(1)';
    });
    
    // Clean up styles after animation
    setTimeout(() => {
      badge.style.opacity = '';
      badge.style.transform = '';
      badge.style.transition = '';
    }, 250);
  },
  
  /**
   * Animate badge removal
   */
  animateOut(badge, onComplete) {
    badge.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    badge.style.opacity = '0';
    badge.style.transform = 'scale(0.8)';
    
    setTimeout(() => {
      badge.remove();
      onComplete?.();
    }, 200);
  },
  
  /**
   * Create badge group
   */
  createGroup(badges, options = {}) {
    const group = document.createElement('div');
    group.className = 'badge-group';
    
    if (options.wrap) group.classList.add('badge-group-wrap');
    if (options.spacing) group.classList.add(`badge-group-${options.spacing}`);
    
    badges.forEach(badgeData => {
      const badge = typeof badgeData === 'string'
        ? this.createBadge(badgeData)
        : this.createConnectionChip(badgeData);
      
      group.appendChild(badge);
    });
    
    return group;
  }
};

export default provenance;