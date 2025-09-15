/**
 * Demo App Content
 * Beautiful content to show after hero landing
 */

class DemoApp {
  constructor() {
    this.events = [];
    this.loadEvents(); // Load from API instead of hardcoded
    
    this.savedEvents = new Set();
    this.init();
  }

  async loadEvents() {
    try {
      console.log('[DemoApp] Fetching events from API...');
      const response = await fetch('/api/parties?conference=gamescom2025');
      const data = await response.json();
      const parties = data.data || data.parties || [];
      
      // Transform API data to match demo format - show ALL events
      this.events = parties.map((party, index) => ({
        id: party.id || index + 1,
        title: party.title || party.name || 'Untitled Event',
        description: party.description || 'Join us for this exciting event',
        date: this.formatDate(party.date || party.start),
        attendees: party.capacity || Math.floor(Math.random() * 400) + 100,
        tags: party.tags || this.generateTags(party.category || party.categoryId),
        image: this.getEventImage(party.category || 'default', index),
        vip: party.price?.includes('VIP') || party.category === 'vip',
        live: index === 1 // Make second event "live" for demo
      }));
      
      console.log(`[DemoApp] Loaded ${this.events.length} events from API`);
      this.render();
    } catch (error) {
      console.error('[DemoApp] Failed to load events:', error);
      // Use empty array as fallback
      this.events = [];
      this.render();
    }
  }
  
  formatDate(dateStr) {
    if (!dateStr) return 'TBD';
    try {
      const date = new Date(dateStr);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    } catch {
      return dateStr;
    }
  }
  
  generateTags(category) {
    const tagMap = {
      'topgolf': ['Networking', 'Sports', 'Fun'],
      'dinner': ['VIP', 'Exclusive', 'Networking'],
      'party': ['Networking', 'Party', 'Social'],
      'workshop': ['Technical', 'Learning', 'Hands-on'],
      'default': ['Networking', 'Conference', 'MAU']
    };
    return tagMap[category?.toLowerCase()] || tagMap.default;
  }
  
  getEventImage(category, index) {
    const images = [
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=225&fit=crop', // Conference
      'https://images.unsplash.com/photo-1511882150382-421056c89033?w=400&h=225&fit=crop', // Tech meetup
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&h=225&fit=crop', // Business
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=225&fit=crop', // Party
      'https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=400&h=225&fit=crop', // VIP
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=225&fit=crop'  // Awards
    ];
    return images[index % images.length];
  }

  init() {
    // Render initial loading state
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = '<div class="loading-state">Loading events...</div>';
    }
    this.attachEventListeners();
  }

  render() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
      <!-- Navigation -->
      <nav class="nav-bottom">
        <div class="nav-bottom-inner">
          <div class="nav-item active" data-section="discover">
            <div class="nav-item-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </div>
            <div class="nav-item-label">Discover</div>
          </div>
          <div class="nav-item" data-section="saved">
            <div class="nav-item-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
              ${this.savedEvents.size > 0 ? `<span class="nav-item-badge">${this.savedEvents.size}</span>` : ''}
            </div>
            <div class="nav-item-label">Saved</div>
          </div>
          <div class="nav-item" data-section="network">
            <div class="nav-item-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div class="nav-item-label">Network</div>
          </div>
          <div class="nav-item" data-section="calendar">
            <div class="nav-item-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <div class="nav-item-label">Calendar</div>
          </div>
          <div class="nav-item" data-section="profile">
            <div class="nav-item-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div class="nav-item-label">Profile</div>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="app-main">
        <div class="app-header">
          <h1>Discover Events</h1>
          <p>Find the perfect networking opportunities</p>
        </div>

        <!-- Event Grid -->
        <div class="event-grid">
          ${this.events.map((event, index) => this.createEventCard(event, index === 0)).join('')}
        </div>
      </main>
    `;
  }

  createEventCard(event, featured = false) {
    const isSaved = this.savedEvents.has(event.id);
    // Escape the event ID for use in onclick handlers
    const eventIdStr = typeof event.id === 'string' ? `'${event.id}'` : event.id;
    
    return `
      <div class="event-card ${featured ? 'featured' : ''}" data-event-id="${event.id}" style="cursor: pointer;">
        <div class="event-card-image" onclick="event.stopPropagation(); window.demoApp.showEventDetails(${eventIdStr})">
          <img src="${event.image}" alt="${event.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=225&fit=crop'">
          ${event.vip ? '<div class="event-card-vip">VIP</div>' : ''}
          ${event.live ? '<div class="event-card-live">LIVE NOW</div>' : ''}
        </div>
        <div class="event-card-content">
          <div class="event-card-meta">
            <div class="event-card-date">${event.date}</div>
            <div class="event-card-attendees">${event.attendees}</div>
          </div>
          <h3 class="event-card-title">${event.title}</h3>
          <p class="event-card-description">${event.description}</p>
          <div class="event-card-tags">
            ${event.tags.map(tag => `<span class="event-card-tag">${tag}</span>`).join('')}
          </div>
          <div class="event-card-actions">
            <div class="event-card-action-group">
              <button class="event-card-action event-card-action-save ${isSaved ? 'saved' : ''}" 
                      data-event-id="${event.id}" 
                      onclick="event.stopPropagation(); window.demoApp.toggleSave(${eventIdStr})">
                ${isSaved ? '🔖' : '📌'}
              </button>
              <button class="event-card-action" onclick="event.stopPropagation(); window.demoApp.share(${eventIdStr})">
                🔗
              </button>
              <button class="event-card-action" onclick="event.stopPropagation(); window.demoApp.showInfo(${eventIdStr})">
                ℹ️
              </button>
            </div>
            <button class="event-card-rsvp ${isSaved ? 'confirmed' : ''}" 
                    onclick="event.stopPropagation(); window.demoApp.rsvp(${eventIdStr})">
              ${isSaved ? 'Confirmed' : 'RSVP'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    // Navigation
    document.addEventListener('click', (e) => {
      const navItem = e.target.closest('.nav-item');
      if (navItem) {
        document.querySelectorAll('.nav-item').forEach(item => {
          item.classList.remove('active');
        });
        navItem.classList.add('active');
        
        // Haptic feedback
        if (window.haptic) {
          window.haptic.selection();
        }
        
        // Show different content based on section
        const section = navItem.dataset.section;
        this.showSection(section);
      }
    });

    // Card hover effects
    document.addEventListener('mousemove', (e) => {
      const card = e.target.closest('.event-card');
      if (card) {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mouse-x', `${x}%`);
        card.style.setProperty('--mouse-y', `${y}%`);
      }
    });
  }

  toggleSave(eventId) {
    const button = document.querySelector(`.event-card-action-save[data-event-id="${eventId}"]`);
    const rsvpButton = document.querySelector(`.event-card[data-event-id="${eventId}"] .event-card-rsvp`);
    
    if (this.savedEvents.has(eventId)) {
      this.savedEvents.delete(eventId);
      button.classList.remove('saved');
      button.textContent = '📌';
      rsvpButton.classList.remove('confirmed');
      rsvpButton.textContent = 'RSVP';
    } else {
      this.savedEvents.add(eventId);
      button.classList.add('saved');
      button.textContent = '🔖';
      rsvpButton.classList.add('confirmed');
      rsvpButton.textContent = 'Confirmed';
      
      // Show micro-FTUE if this is the third save
      if (this.savedEvents.size === 3 && window.microFTUE) {
        setTimeout(() => {
          const calendarBtn = document.querySelector('.nav-item[data-section="calendar"]');
          if (calendarBtn) {
            window.microFTUE.show('calendar-sync', calendarBtn);
          }
        }, 500);
      }
    }
    
    // Update badge
    this.updateSavedBadge();
    
    // Haptic feedback
    if (window.haptic) {
      window.haptic.notification('success');
    }
  }

  updateSavedBadge() {
    const savedNav = document.querySelector('.nav-item[data-section="saved"] .nav-item-icon');
    if (savedNav) {
      const existingBadge = savedNav.querySelector('.nav-item-badge');
      if (this.savedEvents.size > 0) {
        if (existingBadge) {
          existingBadge.textContent = this.savedEvents.size;
        } else {
          savedNav.innerHTML = `🔖<span class="nav-item-badge">${this.savedEvents.size}</span>`;
        }
      } else {
        savedNav.innerHTML = '🔖';
      }
    }
  }

  rsvp(eventId) {
    // Check if authenticated
    const isAuthenticated = localStorage.getItem('auth_token') !== null;
    
    if (!isAuthenticated) {
      // Trigger magic link auth
      document.dispatchEvent(new CustomEvent('auth:required', {
        detail: { 
          action: () => this.completeRSVP(eventId)
        }
      }));
    } else {
      this.completeRSVP(eventId);
    }
  }

  completeRSVP(eventId) {
    this.toggleSave(eventId);
    this.showToast('RSVP confirmed! Added to your calendar.');
  }

  share(eventId) {
    const event = this.events.find(e => e.id === eventId || e.id == eventId);
    if (!event) {
      console.error('[DemoApp] Event not found:', eventId);
      return;
    }
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.href
      });
    } else {
      this.showToast('Link copied to clipboard!');
    }
    
    if (window.haptic) {
      window.haptic.impact('light');
    }
  }

  showInfo(eventId) {
    const event = this.events.find(e => e.id === eventId || e.id == eventId);
    if (!event) {
      console.error('[DemoApp] Event not found:', eventId);
      return;
    }
    this.showToast(`${event.title}: ${event.attendees} attendees expected`);
  }

  showEventDetails(eventId) {
    // Stop event bubbling to prevent triggering button clicks
    if (window.event && window.event.target.closest('button')) {
      return;
    }
    
    // Handle both string and number IDs
    const eventData = this.events.find(e => e.id === eventId || e.id == eventId);
    if (!eventData) return;
    
    // Create a modal with event details
    const modal = document.createElement('div');
    modal.className = 'event-modal';
    modal.innerHTML = `
      <div class="event-modal-backdrop" onclick="this.parentElement.remove()"></div>
      <div class="event-modal-content">
        <button class="event-modal-close" onclick="this.closest('.event-modal').remove()">×</button>
        <div class="event-modal-image">
          <img src="${eventData.image}" alt="${eventData.title}" onerror="this.src='https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=225&fit=crop'">
          ${eventData.vip ? '<div class="event-modal-badge vip">VIP Event</div>' : ''}
          ${eventData.live ? '<div class="event-modal-badge live">LIVE NOW</div>' : ''}
        </div>
        <div class="event-modal-body">
          <h2>${eventData.title}</h2>
          <p class="event-modal-description">${eventData.description}</p>
          
          <div class="event-modal-info">
            <div class="event-modal-info-item">
              <span class="label">Date</span>
              <span class="value">${eventData.date}</span>
            </div>
            <div class="event-modal-info-item">
              <span class="label">Expected Attendees</span>
              <span class="value">${eventData.attendees}</span>
            </div>
            <div class="event-modal-info-item">
              <span class="label">Tags</span>
              <div class="event-modal-tags">
                ${eventData.tags.map(tag => `<span class="event-modal-tag">${tag}</span>`).join('')}
              </div>
            </div>
          </div>
          
          <div class="event-modal-actions">
            <button class="event-modal-btn primary" onclick="window.demoApp.rsvp('${eventData.id}'); this.closest('.event-modal').remove();">
              ${this.savedEvents.has(String(eventData.id)) ? 'Already RSVPed ✓' : 'RSVP to Event'}
            </button>
            <button class="event-modal-btn secondary" onclick="window.demoApp.share('${eventData.id}'); this.closest('.event-modal').remove();">
              Share Event
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add animation
    setTimeout(() => {
      modal.classList.add('active');
    }, 10);
    
    // Haptic feedback
    if (window.haptic) {
      window.haptic.selection();
    }
  }

  showSection(section) {
    const header = document.querySelector('.app-header h1');
    const titles = {
      discover: 'Discover Events',
      saved: 'Saved Events',
      network: 'Professional Network',
      calendar: 'My Calendar',
      profile: 'Profile Settings'
    };
    
    if (header) {
      header.textContent = titles[section] || 'MAU';
    }
    
    // Filter events for saved section
    if (section === 'saved') {
      const grid = document.querySelector('.event-grid');
      if (grid) {
        const savedEvents = this.events.filter(e => this.savedEvents.has(e.id));
        if (savedEvents.length > 0) {
          grid.innerHTML = savedEvents.map(event => this.createEventCard(event)).join('');
        } else {
          grid.innerHTML = `
            <div class="empty-state">
              <div class="empty-state-icon">🔖</div>
              <h3>No saved events yet</h3>
              <p>Save events you're interested in to see them here</p>
            </div>
          `;
        }
      }
    } else if (section === 'discover') {
      this.render();
    }
  }


  showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'fadeOut 300ms ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Initialize when app is ready
window.addEventListener('app-ready', () => {
  window.demoApp = new DemoApp();
});

// Also initialize if app is already visible
if (document.getElementById('app')?.style.display !== 'none') {
  window.demoApp = new DemoApp();
}

// Listen for auth completion to finish pending actions
document.addEventListener('auth:completed', (e) => {
  if (e.detail?.action && typeof e.detail.action === 'function') {
    e.detail.action();
  }
});

// Add required styles
const style = document.createElement('style');
style.textContent = `
  .app-main {
    padding: 20px;
    padding-bottom: 100px;
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .app-header {
    margin-bottom: 32px;
  }
  
  .app-header h1 {
    font-size: 32px;
    font-weight: 700;
    color: white;
    margin-bottom: 8px;
  }
  
  .app-header p {
    color: rgba(255, 255, 255, 0.6);
    font-size: 16px;
  }
  
  .empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 60px 20px;
  }
  
  .empty-state-icon {
    font-size: 64px;
    margin-bottom: 20px;
    opacity: 0.5;
  }
  
  .empty-state h3 {
    font-size: 24px;
    color: white;
    margin-bottom: 8px;
  }
  
  .empty-state p {
    color: rgba(255, 255, 255, 0.6);
  }
  
  /* Event Modal Styles */
  .event-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    opacity: 0;
    transition: opacity 300ms ease;
  }
  
  .event-modal.active {
    opacity: 1;
  }
  
  .event-modal-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    cursor: pointer;
  }
  
  .event-modal-content {
    position: relative;
    background: #1a1a2e;
    border-radius: 20px;
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    transform: scale(0.9);
    transition: transform 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }
  
  .event-modal.active .event-modal-content {
    transform: scale(1);
  }
  
  .event-modal-close {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 50%;
    color: white;
    font-size: 24px;
    cursor: pointer;
    z-index: 1;
    transition: all 200ms ease;
  }
  
  .event-modal-close:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: rotate(90deg);
  }
  
  .event-modal-image {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: 20px 20px 0 0;
    overflow: hidden;
  }
  
  .event-modal-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .event-modal-badge {
    position: absolute;
    top: 20px;
    left: 20px;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
  }
  
  .event-modal-badge.vip {
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    color: #000;
  }
  
  .event-modal-badge.live {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
    animation: pulse 2s infinite;
  }
  
  .event-modal-body {
    padding: 32px;
  }
  
  .event-modal-body h2 {
    font-size: 28px;
    font-weight: 700;
    color: white;
    margin-bottom: 12px;
  }
  
  .event-modal-description {
    color: rgba(255, 255, 255, 0.7);
    font-size: 16px;
    line-height: 1.6;
    margin-bottom: 24px;
  }
  
  .event-modal-info {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
  }
  
  .event-modal-info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  
  .event-modal-info-item:last-child {
    margin-bottom: 0;
  }
  
  .event-modal-info-item .label {
    color: rgba(255, 255, 255, 0.5);
    font-size: 14px;
  }
  
  .event-modal-info-item .value {
    color: white;
    font-weight: 600;
  }
  
  .event-modal-tags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .event-modal-tag {
    padding: 4px 12px;
    background: rgba(0, 122, 255, 0.2);
    color: #007aff;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
  }
  
  .event-modal-actions {
    display: flex;
    gap: 12px;
  }
  
  .event-modal-btn {
    flex: 1;
    padding: 16px;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 200ms ease;
  }
  
  .event-modal-btn.primary {
    background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
    color: white;
  }
  
  .event-modal-btn.primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 122, 255, 0.3);
  }
  
  .event-modal-btn.secondary {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .event-modal-btn.secondary:hover {
    background: rgba(255, 255, 255, 0.15);
  }
  
  @media (max-width: 640px) {
    .event-modal-content {
      max-width: 100%;
      margin: 10px;
    }
    
    .event-modal-body {
      padding: 24px;
    }
    
    .event-modal-actions {
      flex-direction: column;
    }
  }
`;
document.head.appendChild(style);