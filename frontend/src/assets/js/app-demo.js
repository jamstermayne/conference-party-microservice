/**
 * Demo App Content
 * Beautiful content to show after hero landing
 */

class DemoApp {
  constructor() {
    this.events = [
      {
        id: 1,
        title: 'Opening Night Party',
        description: 'Kick off the conference with industry leaders and innovators',
        date: 'Aug 20, 2025',
        attendees: 500,
        tags: ['Networking', 'VIP', 'Open Bar'],
        image: 'https://picsum.photos/400/225?random=1',
        vip: true,
        live: false
      },
      {
        id: 2,
        title: 'Developer Meetup',
        description: 'Connect with game developers from around the world',
        date: 'Aug 21, 2025',
        attendees: 200,
        tags: ['Technical', 'Indie', 'AAA'],
        image: 'https://picsum.photos/400/225?random=2',
        vip: false,
        live: true
      },
      {
        id: 3,
        title: 'Publisher Showcase',
        description: 'Exclusive previews of upcoming releases',
        date: 'Aug 21, 2025',
        attendees: 350,
        tags: ['Business', 'Deals', 'Preview'],
        image: 'https://picsum.photos/400/225?random=3',
        vip: true,
        live: false
      },
      {
        id: 4,
        title: 'Indie Game Awards',
        description: 'Celebrate the best independent games of the year',
        date: 'Aug 22, 2025',
        attendees: 400,
        tags: ['Awards', 'Indie', 'Celebration'],
        image: 'https://picsum.photos/400/225?random=4',
        vip: false,
        live: false
      },
      {
        id: 5,
        title: 'Tech Talk: Next-Gen Gaming',
        description: 'Deep dive into emerging technologies shaping the future',
        date: 'Aug 22, 2025',
        attendees: 150,
        tags: ['Tech', 'AI', 'Cloud'],
        image: 'https://picsum.photos/400/225?random=5',
        vip: false,
        live: false
      },
      {
        id: 6,
        title: 'Closing Gala',
        description: 'End the conference in style with live entertainment',
        date: 'Aug 23, 2025',
        attendees: 600,
        tags: ['Networking', 'Party', 'VIP'],
        image: 'https://picsum.photos/400/225?random=6',
        vip: true,
        live: false
      }
    ];
    
    this.savedEvents = new Set();
    this.init();
  }

  init() {
    this.render();
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

      <!-- Floating Action Button -->
      <button class="fab" onclick="window.demoApp.showFilters()">
        <span>+</span>
      </button>
    `;
  }

  createEventCard(event, featured = false) {
    const isSaved = this.savedEvents.has(event.id);
    
    return `
      <div class="event-card ${featured ? 'featured' : ''}" data-event-id="${event.id}">
        <div class="event-card-image">
          <img src="${event.image}" alt="${event.title}" loading="lazy">
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
                      onclick="window.demoApp.toggleSave(${event.id})">
                ${isSaved ? '🔖' : '📌'}
              </button>
              <button class="event-card-action" onclick="window.demoApp.share(${event.id})">
                🔗
              </button>
              <button class="event-card-action" onclick="window.demoApp.showInfo(${event.id})">
                ℹ️
              </button>
            </div>
            <button class="event-card-rsvp ${isSaved ? 'confirmed' : ''}" 
                    onclick="window.demoApp.rsvp(${event.id})">
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
    const event = this.events.find(e => e.id === eventId);
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
    const event = this.events.find(e => e.id === eventId);
    this.showToast(`${event.title}: ${event.attendees} attendees expected`);
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

  showFilters() {
    this.showToast('Filter options coming soon!');
    if (window.haptic) {
      window.haptic.impact('medium');
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
`;
document.head.appendChild(style);