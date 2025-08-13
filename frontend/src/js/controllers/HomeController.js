/**
 * HOME CONTROLLER
 * Main dashboard and activity feed for the Professional Intelligence Platform
 */

import { BaseController } from './BaseController.js?v=b022';
import { Store } from '../store.js?v=b022';
import { api } from '../services/api.js?v=b022';

export class HomeController extends BaseController {
  constructor(element) {
    super(element, { name: 'home' });
    
    this.state = {
      todayEvents: [],
      recentActivity: [],
      nearbyProfessionals: [],
      quickStats: {
        eventsSaved: 0,
        connectionsCount: 0,
        invitesLeft: 10,
        profileViews: 0
      },
      weatherInfo: null,
      locationVenue: null
    };
  }

  /**
   * Initialize controller
   */
  async onInit() {
    await this.loadDashboardData();
    this.setupActivityFeed();
    this.setupLocationServices();
    this.startPeriodicUpdates();
  }

  /**
   * Load dashboard data
   */
  async loadDashboardData() {
    await Promise.all([
      this.loadTodayEvents(),
      this.loadQuickStats(),
      this.loadRecentActivity(),
      this.loadNearbyProfessionals()
    ]);
  }

  /**
   * Load events for today
   */
  async loadTodayEvents() {
    const allEvents = Store.get('events.list') || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayEvents = allEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= today && eventDate < tomorrow;
    }).slice(0, 3);
    
    this.setState({ todayEvents });
  }

  /**
   * Load quick stats
   */
  async loadQuickStats() {
    const stats = {
      eventsSaved: (Store.get('events.saved') || []).length,
      connectionsCount: (Store.get('connections') || []).length,
      invitesLeft: Store.get('invites.remaining') || 10,
      profileViews: Store.get('profile.views') || 0
    };
    
    this.setState({ quickStats: stats });
  }

  /**
   * Load recent activity
   */
  async loadRecentActivity() {
    const activities = [];
    
    // Recent event saves
    const recentSaves = Store.get('analytics.eventSaves') || [];
    recentSaves.slice(-3).forEach(save => {
      activities.push({
        type: 'event_save',
        title: 'Saved an event',
        description: save.eventTitle,
        timestamp: save.timestamp,
        icon: '📅'
      });
    });
    
    // Recent connections
    const recentConnections = Store.get('analytics.connections') || [];
    recentConnections.slice(-2).forEach(conn => {
      activities.push({
        type: 'connection',
        title: 'New connection',
        description: conn.name,
        timestamp: conn.timestamp,
        icon: '🤝'
      });
    });
    
    // Recent profile views
    const lastProfileView = Store.get('analytics.lastProfileView');
    if (lastProfileView) {
      activities.push({
        type: 'profile_view',
        title: 'Profile viewed',
        description: 'Someone viewed your profile',
        timestamp: lastProfileView,
        icon: '👁️'
      });
    }
    
    // Sort by timestamp
    activities.sort((a, b) => b.timestamp - a.timestamp);
    
    this.setState({ recentActivity: activities.slice(0, 5) });
  }

  /**
   * Load nearby professionals
   */
  async loadNearbyProfessionals() {
    const nearby = Store.get('proximity.nearby') || [];
    this.setState({ nearbyProfessionals: nearby.slice(0, 3) });
  }

  /**
   * Setup activity feed
   */
  setupActivityFeed() {
    this.on('activity:refresh', () => {
      this.loadRecentActivity();
    });
    
    // Listen for new activities
    this.on('event:saved', (data) => {
      this.trackActivity('event_save', data);
    });
    
    this.on('connection:made', (data) => {
      this.trackActivity('connection', data);
    });
  }

  /**
   * Setup location services
   */
  setupLocationServices() {
    const proximityEnabled = Store.get('proximity.enabled');
    if (proximityEnabled) {
      this.detectVenue();
      this.loadWeatherInfo();
    }
  }

  /**
   * Start periodic updates
   */
  startPeriodicUpdates() {
    // Update every 5 minutes
    this.updateInterval = setInterval(() => {
      this.loadDashboardData();
    }, 5 * 60 * 1000);
  }

  /**
   * Detect current venue
   */
  async detectVenue() {
    if (!navigator.geolocation) return;
    
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          maximumAge: 5 * 60 * 1000
        });
      });
      
      const { latitude, longitude } = position.coords;
      const venue = this.identifyVenue(latitude, longitude);
      
      if (venue) {
        this.setState({ locationVenue: venue });
        Store.patch('proximity.currentVenue', venue);
      }
    } catch (error) {
      console.warn('Location detection failed');
    }
  }

  /**
   * Identify venue from coordinates
   */
  identifyVenue(lat, lng) {
    const venues = [
      {
        name: 'Koelnmesse',
        description: 'Gamescom 2025',
        lat: 50.9473,
        lng: 6.9831,
        radius: 0.01
      },
      {
        name: 'Gamescom Party Hub',
        description: 'Official after-party venue',
        lat: 50.9369,
        lng: 6.9603,
        radius: 0.005
      }
    ];
    
    for (const venue of venues) {
      const distance = this.calculateDistance(lat, lng, venue.lat, venue.lng);
      if (distance <= venue.radius) {
        return venue;
      }
    }
    
    return null;
  }

  /**
   * Calculate distance between coordinates
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Load weather information
   */
  async loadWeatherInfo() {
    try {
      // Placeholder for weather API integration
      const weatherInfo = {
        temperature: '22°C',
        condition: 'Partly cloudy',
        icon: '⛅'
      };
      
      this.setState({ weatherInfo });
    } catch (error) {
      console.warn('Weather info unavailable');
    }
  }

  /**
   * Track activity
   */
  trackActivity(type, data) {
    const activity = {
      type,
      timestamp: Date.now(),
      ...data
    };
    
    const activities = Store.get('analytics.activities') || [];
    activities.unshift(activity);
    
    // Keep last 20 activities
    if (activities.length > 20) {
      activities.splice(20);
    }
    
    Store.patch('analytics.activities', activities);
    this.loadRecentActivity();
  }

  /**
   * Action handlers
   */
  actionViewAllEvents() {
    this.emit('navigate', { route: '/events' });
  }

  actionViewProfile() {
    this.emit('navigate', { route: '/me' });
  }

  actionOpenInvites() {
    this.emit('navigate', { route: '/invite' });
  }

  actionRefreshFeed() {
    this.loadDashboardData();
    this.notify('Feed refreshed', 'info');
  }

  actionViewConnections() {
    this.emit('navigate', { route: '/people' });
  }

  actionToggleProximity() {
    const enabled = !Store.get('proximity.enabled');
    Store.patch('proximity.enabled', enabled);
    
    if (enabled) {
      this.detectVenue();
      this.notify('Location tracking enabled', 'success');
    } else {
      this.setState({ locationVenue: null });
      this.notify('Location tracking disabled', 'info');
    }
  }

  /**
   * Template for rendering
   */
  template(data) {
    const { 
      todayEvents, 
      recentActivity, 
      nearbyProfessionals, 
      quickStats, 
      weatherInfo,
      locationVenue 
    } = data;
    
    return `
      <div class="home-controller">
        <div class="home-header">
          <h1>Good ${this.getTimeOfDay()}</h1>
          <p class="home-subtitle">Ready for professional connections?</p>
          ${weatherInfo ? `
            <div class="weather-info">
              ${weatherInfo.icon} ${weatherInfo.temperature}, ${weatherInfo.condition}
            </div>
          ` : ''}
          ${locationVenue ? `
            <div class="venue-info">
              📍 You're at ${locationVenue.name}
              <span class="venue-desc">${locationVenue.description}</span>
            </div>
          ` : ''}
        </div>
        
        <div class="quick-stats">
          <div class="stat-card" data-action="viewAllEvents">
            <span class="stat-value">${quickStats.eventsSaved}</span>
            <span class="stat-label">Events Saved</span>
          </div>
          <div class="stat-card" data-action="viewConnections">
            <span class="stat-value">${quickStats.connectionsCount}</span>
            <span class="stat-label">Connections</span>
          </div>
          <div class="stat-card" data-action="openInvites">
            <span class="stat-value">${quickStats.invitesLeft}</span>
            <span class="stat-label">Invites Left</span>
          </div>
          <div class="stat-card" data-action="viewProfile">
            <span class="stat-value">${quickStats.profileViews}</span>
            <span class="stat-label">Profile Views</span>
          </div>
        </div>
        
        <div class="dashboard-sections">
          <section class="today-events">
            <div class="section-header">
              <h2>Today's Events</h2>
              <button data-action="viewAllEvents" class="link-btn">View all</button>
            </div>
            
            ${todayEvents.length > 0 ? `
              <div class="events-list">
                ${todayEvents.map(event => `
                  <div class="event-card mini">
                    <div class="event-time">${this.formatTime(event.date)}</div>
                    <div class="event-info">
                      <h3>${event.title}</h3>
                      <p>${event.venue || 'TBA'}</p>
                    </div>
                    <button data-action="viewEvent" data-event-id="${event.id}" class="view-btn">
                      View
                    </button>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="empty-state">
                <p>No events today</p>
                <button data-action="viewAllEvents" class="secondary-btn">
                  Explore Events
                </button>
              </div>
            `}
          </section>
          
          <section class="activity-feed">
            <div class="section-header">
              <h2>Recent Activity</h2>
              <button data-action="refreshFeed" class="refresh-btn">🔄</button>
            </div>
            
            ${recentActivity.length > 0 ? `
              <ul class="activity-list">
                ${recentActivity.map(activity => `
                  <li class="activity-item">
                    <span class="activity-icon">${activity.icon}</span>
                    <div class="activity-content">
                      <h4>${activity.title}</h4>
                      <p>${activity.description}</p>
                      <span class="activity-time">${this.timeAgo(activity.timestamp)}</span>
                    </div>
                  </li>
                `).join('')}
              </ul>
            ` : `
              <div class="empty-state">
                <p>No recent activity</p>
                <p class="hint">Start networking to see activity here</p>
              </div>
            `}
          </section>
          
          ${nearbyProfessionals.length > 0 ? `
            <section class="nearby-section">
              <div class="section-header">
                <h2>Nearby Professionals</h2>
                <span class="proximity-indicator active">🟢 Live</span>
              </div>
              
              <div class="professionals-list">
                ${nearbyProfessionals.map(person => `
                  <div class="professional-card mini">
                    <div class="person-avatar">
                      ${person.avatar || person.name.charAt(0)}
                    </div>
                    <div class="person-info">
                      <h4>${person.name}</h4>
                      <p>${person.role} at ${person.company}</p>
                    </div>
                    <button data-action="connect" data-person-id="${person.id}" class="connect-btn">
                      Connect
                    </button>
                  </div>
                `).join('')}
              </div>
            </section>
          ` : Store.get('proximity.enabled') ? `
            <section class="proximity-section">
              <h2>Proximity Detection</h2>
              <p>Looking for nearby professionals...</p>
              <button data-action="toggleProximity" class="secondary-btn">
                Disable Location
              </button>
            </section>
          ` : `
            <section class="proximity-section">
              <h2>Discover Nearby</h2>
              <p>Enable location to find professionals near you</p>
              <button data-action="toggleProximity" class="primary-btn">
                Enable Location
              </button>
            </section>
          `}
        </div>
        
        <div class="home-actions">
          <button data-action="viewAllEvents" class="action-btn primary">
            🎉 Browse Events
          </button>
          <button data-action="viewConnections" class="action-btn secondary">
            👥 My Network
          </button>
          <button data-action="openInvites" class="action-btn secondary">
            📬 Send Invites
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Get time of day greeting
   */
  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  /**
   * Format time for display
   */
  formatTime(date) {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(new Date(date));
  }

  /**
   * Calculate time ago
   */
  timeAgo(timestamp) {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  }

  /**
   * Store subscriptions
   */
  setupStoreSubscriptions() {
    this.subscribe('events.saved', () => {
      this.loadQuickStats();
      this.loadTodayEvents();
    });
    
    this.subscribe('connections', () => {
      this.loadQuickStats();
      this.loadRecentActivity();
    });
    
    this.subscribe('proximity.nearby', (nearby) => {
      this.setState({ nearbyProfessionals: nearby.slice(0, 3) });
    });
    
    this.subscribe('proximity.currentVenue', (venue) => {
      this.setState({ locationVenue: venue });
    });
  }

  /**
   * Cleanup on destroy
   */
  onDestroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}

export default HomeController;