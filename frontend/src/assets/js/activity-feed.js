/**
 * Live Activity Feed
 * Real-time conference activity stream
 */

class ActivityFeed {
  constructor() {
    this.activities = [];
    this.isOpen = false;
    this.autoUpdate = true;
    
    this.activityTemplates = [
      { icon: 'network', text: '{name} connected with {other}', type: 'connection' },
      { icon: 'target', text: '{name} RSVP\'d to {event}', type: 'rsvp' },
      { icon: 'discover', text: '{name} checked in at {location}', type: 'checkin' },
      { icon: 'vip', text: '{name} earned {achievement}', type: 'achievement' },
      { icon: 'message', text: '{name} started a discussion about {topic}', type: 'discussion' },
      { icon: 'share', text: '{name} shared a photo from {event}', type: 'photo' },
      { icon: 'activity', text: '{name} is playing {game} at {booth}', type: 'gaming' },
      { icon: 'profile', text: '{name} is at the networking lounge', type: 'networking' },
      { icon: 'features', text: '{speaker} started presenting: {talk}', type: 'presentation' },
      { icon: 'live', text: '{event} is trending now!', type: 'trending' }
    ];
    
    this.names = [
      'Sarah Chen', 'Marcus Johnson', 'Emma Wilson', 'Alex Kumar',
      'Lisa Park', 'James Mitchell', 'Sofia Rodriguez', 'David Kim',
      'Anna Schmidt', 'Tom Anderson', 'Maya Patel', 'Chris Lee'
    ];
    
    this.events = [
      'Opening Night Party', 'Developer Meetup', 'Publisher Showcase',
      'Indie Game Awards', 'Tech Talk: Next-Gen Gaming', 'Closing Gala'
    ];
    
    this.locations = [
      'Hall 7', 'North Entrance', 'VIP Lounge', 'Demo Zone',
      'Main Stage', 'Food Court', 'Business Center', 'Outdoor Pavilion'
    ];
    
    this.init();
  }

  init() {
    this.injectStyles();
    this.createFeedUI();
    this.generateInitialActivities();
    this.startLiveUpdates();
  }

  createFeedUI() {
    // Activity Feed Button
    const feedBtn = document.createElement('button');
    feedBtn.className = 'activity-feed-btn';
    feedBtn.innerHTML = `
      <span class="activity-feed-btn-icon">${window.getIcon ? window.getIcon('activity') : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>'}</span>
      <span class="activity-feed-btn-pulse"></span>
    `;
    feedBtn.onclick = () => this.toggle();
    document.body.appendChild(feedBtn);

    // Activity Feed Panel
    const panel = document.createElement('div');
    panel.className = 'activity-feed-panel';
    panel.innerHTML = `
      <div class="activity-feed-header">
        <div class="activity-feed-title">
          <h3>Live Activity</h3>
          <div class="activity-feed-live">
            <span class="activity-feed-live-dot"></span>
            <span>LIVE</span>
          </div>
        </div>
        <div class="activity-feed-controls">
          <button class="activity-feed-filter" onclick="window.activityFeed.showFilters()">
            <span>${window.getIcon ? window.getIcon('target') : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>'}</span>
          </button>
          <button class="activity-feed-close" onclick="window.activityFeed.close()">
            <span>×</span>
          </button>
        </div>
      </div>

      <div class="activity-feed-stats">
        <div class="activity-stat">
          <span class="activity-stat-value">2,847</span>
          <span class="activity-stat-label">Online Now</span>
        </div>
        <div class="activity-stat">
          <span class="activity-stat-value">156</span>
          <span class="activity-stat-label">Active Events</span>
        </div>
        <div class="activity-stat">
          <span class="activity-stat-value">89%</span>
          <span class="activity-stat-label">Engagement</span>
        </div>
      </div>

      <div class="activity-feed-content">
        <div class="activity-feed-list"></div>
      </div>

      <div class="activity-feed-footer">
        <button class="activity-feed-pause" onclick="window.activityFeed.toggleAutoUpdate()">
          <span class="pause-icon">⏸</span>
          <span class="pause-text">Pause Updates</span>
        </button>
      </div>
    `;
    document.body.appendChild(panel);
  }

  generateInitialActivities() {
    // Generate 10 initial activities
    for (let i = 0; i < 10; i++) {
      this.activities.push(this.generateActivity(Date.now() - (i * 60000)));
    }
    this.renderActivities();
  }

  generateActivity(timestamp = Date.now()) {
    const template = this.activityTemplates[Math.floor(Math.random() * this.activityTemplates.length)];
    const name = this.names[Math.floor(Math.random() * this.names.length)];
    const other = this.names[Math.floor(Math.random() * this.names.length)];
    const event = this.events[Math.floor(Math.random() * this.events.length)];
    const location = this.locations[Math.floor(Math.random() * this.locations.length)];
    
    let text = template.text
      .replace('{name}', name)
      .replace('{other}', other)
      .replace('{event}', event)
      .replace('{location}', location)
      .replace('{achievement}', 'Early Bird Badge')
      .replace('{topic}', 'game monetization')
      .replace('{game}', 'Cyberpunk 2077')
      .replace('{booth}', 'CD Projekt Red')
      .replace('{speaker}', 'John Carmack')
      .replace('{talk}', 'The Future of VR Gaming');
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      icon: template.icon,
      text: text,
      type: template.type,
      timestamp: timestamp,
      isNew: Date.now() - timestamp < 5000
    };
  }

  renderActivities() {
    const list = document.querySelector('.activity-feed-list');
    if (!list) return;

    list.innerHTML = this.activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50)
      .map(activity => this.createActivityItem(activity))
      .join('');
  }

  createActivityItem(activity) {
    const timeAgo = this.getTimeAgo(activity.timestamp);
    const iconSvg = window.getIcon ? window.getIcon(activity.icon) : this.getFallbackIcon(activity.icon);
    
    return `
      <div class="activity-item ${activity.isNew ? 'new' : ''} ${activity.type}" 
           data-id="${activity.id}">
        <span class="activity-icon">${iconSvg}</span>
        <div class="activity-content">
          <p class="activity-text">${activity.text}</p>
          <span class="activity-time">${timeAgo}</span>
        </div>
      </div>
    `;
  }

  getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  startLiveUpdates() {
    // Add new activity every 3-8 seconds
    setInterval(() => {
      if (!this.autoUpdate || !this.isOpen) return;
      
      const newActivity = this.generateActivity();
      this.activities.unshift(newActivity);
      
      // Keep only last 100 activities
      if (this.activities.length > 100) {
        this.activities = this.activities.slice(0, 100);
      }
      
      this.addActivityWithAnimation(newActivity);
      this.updateStats();
      
      // Haptic feedback for new activity
      if (window.haptic) {
        window.haptic.impact('light');
      }
    }, 3000 + Math.random() * 5000);

    // Update timestamps every minute
    setInterval(() => {
      if (this.isOpen) {
        this.renderActivities();
      }
    }, 60000);
  }

  addActivityWithAnimation(activity) {
    const list = document.querySelector('.activity-feed-list');
    if (!list) return;

    const newItem = document.createElement('div');
    newItem.innerHTML = this.createActivityItem(activity);
    const activityElement = newItem.firstElementChild;
    
    // Insert at the beginning
    list.insertBefore(activityElement, list.firstChild);
    
    // Animate in
    requestAnimationFrame(() => {
      activityElement.style.animation = 'slideInFromTop 500ms ease-out';
    });
    
    // Remove oldest if too many
    const items = list.querySelectorAll('.activity-item');
    if (items.length > 50) {
      items[items.length - 1].remove();
    }
  }

  updateStats() {
    // Randomly update stats to simulate live data
    const onlineElement = document.querySelector('.activity-stat-value');
    if (onlineElement) {
      const current = parseInt(onlineElement.textContent.replace(',', ''));
      const change = Math.floor(Math.random() * 10) - 5;
      onlineElement.textContent = (current + change).toLocaleString();
    }
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    const panel = document.querySelector('.activity-feed-panel');
    panel.classList.add('active');
    this.isOpen = true;
    
    // Refresh activities
    this.renderActivities();
    
    if (window.haptic) {
      window.haptic.impact('medium');
    }
  }

  close() {
    const panel = document.querySelector('.activity-feed-panel');
    panel.classList.remove('active');
    this.isOpen = false;
    
    if (window.haptic) {
      window.haptic.impact('light');
    }
  }

  toggleAutoUpdate() {
    this.autoUpdate = !this.autoUpdate;
    
    const pauseBtn = document.querySelector('.activity-feed-pause');
    const icon = pauseBtn.querySelector('.pause-icon');
    const text = pauseBtn.querySelector('.pause-text');
    
    if (this.autoUpdate) {
      icon.innerHTML = window.getIcon ? window.getIcon('activity') : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>';
      text.textContent = 'Pause Updates';
      this.showToast('Live updates resumed');
    } else {
      icon.innerHTML = window.getIcon ? window.getIcon('activity') : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>';
      text.textContent = 'Resume Updates';
      this.showToast('Updates paused');
    }
    
    if (window.haptic) {
      window.haptic.selection();
    }
  }

  showFilters() {
    // Would show filter options
    this.showToast('Filter options coming soon!');
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'activity-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
      toast.classList.add('active');
    });
    
    setTimeout(() => {
      toast.classList.remove('active');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Activity Feed Button */
      .activity-feed-btn {
        position: fixed;
        bottom: 220px;
        right: 24px;
        width: 56px;
        height: 56px;
        background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%);
        border: none;
        border-radius: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 8px 24px rgba(255, 107, 107, 0.3);
        z-index: 997;
        transition: all 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }
      
      .activity-feed-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 12px 32px rgba(255, 107, 107, 0.4);
      }
      
      .activity-feed-btn-icon {
        font-size: 24px;
        position: relative;
        z-index: 2;
      }
      
      .activity-feed-btn-pulse {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%);
        animation: pulse-ring 2s infinite;
      }
      
      @keyframes pulse-ring {
        0% {
          transform: scale(1);
          opacity: 1;
        }
        100% {
          transform: scale(1.5);
          opacity: 0;
        }
      }
      
      /* Activity Feed Panel */
      .activity-feed-panel {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 380px;
        height: calc(100vh - 40px);
        max-height: 700px;
        background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        display: flex;
        flex-direction: column;
        z-index: 998;
        transform: translateX(420px);
        opacity: 0;
        visibility: hidden;
        transition: all 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      }
      
      .activity-feed-panel.active {
        transform: translateX(0);
        opacity: 1;
        visibility: visible;
      }
      
      .activity-feed-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .activity-feed-title {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .activity-feed-title h3 {
        font-size: 20px;
        font-weight: 600;
        color: white;
        margin: 0;
      }
      
      .activity-feed-live {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        background: rgba(255, 59, 48, 0.2);
        border: 1px solid rgba(255, 59, 48, 0.3);
        border-radius: 12px;
        color: #ff3b30;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      .activity-feed-live-dot {
        width: 6px;
        height: 6px;
        background: #ff3b30;
        border-radius: 50%;
        animation: livePulse 2s infinite;
      }
      
      @keyframes livePulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.3;
        }
      }
      
      .activity-feed-controls {
        display: flex;
        gap: 8px;
      }
      
      .activity-feed-filter,
      .activity-feed-close {
        width: 32px;
        height: 32px;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: 50%;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 200ms ease;
      }
      
      .activity-feed-filter:hover,
      .activity-feed-close:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      /* Stats */
      .activity-feed-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1px;
        background: rgba(255, 255, 255, 0.1);
        margin: 1px 0;
      }
      
      .activity-stat {
        background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%);
        padding: 16px;
        text-align: center;
      }
      
      .activity-stat-value {
        display: block;
        font-size: 24px;
        font-weight: 700;
        color: white;
        margin-bottom: 4px;
      }
      
      .activity-stat-label {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      /* Content */
      .activity-feed-content {
        flex: 1;
        overflow-y: auto;
        padding: 12px;
      }
      
      .activity-feed-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .activity-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        transition: all 200ms ease;
      }
      
      .activity-item:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.1);
      }
      
      .activity-item.new {
        border-color: rgba(0, 122, 255, 0.3);
        background: rgba(0, 122, 255, 0.05);
      }
      
      @keyframes slideInFromTop {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .activity-icon {
        font-size: 20px;
        flex-shrink: 0;
      }
      
      .activity-content {
        flex: 1;
        min-width: 0;
      }
      
      .activity-text {
        font-size: 14px;
        color: white;
        margin: 0 0 4px 0;
        line-height: 1.5;
      }
      
      .activity-time {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.4);
      }
      
      /* Activity types */
      .activity-item.connection {
        border-left: 3px solid #007aff;
      }
      
      .activity-item.rsvp {
        border-left: 3px solid #34c759;
      }
      
      .activity-item.achievement {
        border-left: 3px solid #ffd700;
      }
      
      .activity-item.trending {
        border-left: 3px solid #ff6b6b;
      }
      
      /* Footer */
      .activity-feed-footer {
        padding: 16px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .activity-feed-pause {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 10px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: white;
        font-size: 14px;
        cursor: pointer;
        transition: all 200ms ease;
      }
      
      .activity-feed-pause:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      
      /* Toast */
      .activity-toast {
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        padding: 12px 20px;
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: white;
        font-size: 14px;
        z-index: 1001;
        transition: transform 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }
      
      .activity-toast.active {
        transform: translateX(-50%) translateY(0);
      }
      
      /* Mobile */
      @media (max-width: 480px) {
        .activity-feed-panel {
          width: calc(100vw - 40px);
          height: calc(100vh - 40px);
        }
        
        .activity-feed-stats {
          grid-template-columns: repeat(3, 1fr);
        }
      }
    `;
    document.head.appendChild(style);
  }

  getFallbackIcon(iconName) {
    const icons = {
      network: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
      target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>',
      discover: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>',
      vip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>',
      message: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
      share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>',
      activity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>',
      profile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
      features: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"></path></svg>',
      live: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="#ff3b30"/></svg>'
    };
    return icons[iconName] || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg>';
  }
}

// Initialize activity feed
window.activityFeed = new ActivityFeed();

export default window.activityFeed;