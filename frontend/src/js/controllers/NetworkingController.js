/**
 * NETWORKING CONTROLLER
 * Manages professional networking features including invites, proximity, and opportunities
 */

import { BaseController } from './BaseController.js?v=b022';
import { Store } from '../store.js?v=b022';
import { api } from '../services/api.js?v=b022';

export class NetworkingController extends BaseController {
  constructor(element) {
    super(element, { name: 'networking' });
    
    this.state = {
      profile: null,
      invites: {
        myCode: '',
        remaining: 10,
        sent: [],
        received: null
      },
      proximity: {
        enabled: false,
        nearby: [],
        venue: null
      },
      opportunities: {
        active: [],
        created: [],
        applied: []
      },
      connections: [],
      intentToggle: false
    };
  }

  /**
   * Initialize controller
   */
  async onInit() {
    await this.loadProfile();
    this.setupInviteSystem();
    this.setupProximityTracking();
    this.setupOpportunityToggle();
    this.loadConnections();
  }

  /**
   * Load user profile
   */
  async loadProfile() {
    const profile = Store.get('profile') || {};
    
    if (!profile.id) {
      // Generate anonymous profile if not exists
      profile.id = this.generateProfileId();
      profile.createdAt = Date.now();
      Store.patch('profile', profile);
    }
    
    this.setState({ profile });
  }

  /**
   * Setup invite system
   */
  setupInviteSystem() {
    const invites = Store.get('invites') || {};
    
    if (!invites.myCode) {
      invites.myCode = this.generateInviteCode();
      invites.remaining = 10;
      invites.sent = [];
      Store.patch('invites', invites);
    }
    
    this.setState({ invites });
    
    // Check for invite code in URL
    this.checkInviteCode();
  }

  /**
   * Check URL for invite code
   */
  checkInviteCode() {
    const params = new URLSearchParams(window.location.search);
    const inviteCode = params.get('invite');
    
    if (inviteCode && !Store.get('invites.received')) {
      this.acceptInvite(inviteCode);
    }
  }

  /**
   * Accept an invite
   */
  async acceptInvite(code) {
    try {
      const response = await api.validateInvite(code);
      
      if (response.valid) {
        Store.patch('invites.received', code);
        Store.patch('profile.invitedBy', response.inviterId);
        
        this.notify('Welcome! You\'ve joined via exclusive invite 🎉', 'success');
        this.emit('invite:accepted', { code });
      }
    } catch (error) {
      this.notify('Invalid invite code', 'error');
    }
  }

  /**
   * Send an invite
   */
  async sendInvite(target) {
    const { invites } = this.state;
    
    if (invites.remaining <= 0) {
      this.notify('No invites remaining', 'warning');
      return;
    }
    
    try {
      const inviteUrl = `${window.location.origin}?invite=${invites.myCode}`;
      
      if (target.type === 'email') {
        await api.sendInviteEmail(target.email, invites.myCode);
      } else if (target.type === 'share') {
        await navigator.share({
          title: 'Join Professional Intelligence',
          text: 'You\'re invited to the exclusive professional network',
          url: inviteUrl
        });
      } else {
        await navigator.clipboard.writeText(inviteUrl);
        this.notify('Invite link copied!', 'success');
      }
      
      // Track sent invite
      const sent = [...invites.sent, {
        target: target.value,
        timestamp: Date.now()
      }];
      
      Store.patch('invites.sent', sent);
      Store.patch('invites.remaining', invites.remaining - 1);
      
      this.setState({
        invites: {
          ...invites,
          sent,
          remaining: invites.remaining - 1
        }
      });
      
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Setup proximity tracking
   */
  setupProximityTracking() {
    const proximity = Store.get('proximity') || {};
    this.setState({ proximity });
    
    if (proximity.enabled) {
      this.startProximityTracking();
    }
    
    this.on('proximity:toggle', ({ enabled }) => {
      if (enabled) {
        this.startProximityTracking();
      } else {
        this.stopProximityTracking();
      }
    });
  }

  /**
   * Start proximity tracking
   */
  async startProximityTracking() {
    if (!navigator.geolocation) {
      this.notify('Location not supported', 'error');
      return;
    }
    
    try {
      const permission = await this.requestLocationPermission();
      if (!permission) return;
      
      this.proximityWatcher = navigator.geolocation.watchPosition(
        (position) => this.handleLocationUpdate(position),
        (error) => this.handleLocationError(error),
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 30000
        }
      );
      
      Store.patch('proximity.enabled', true);
      this.setState({ 
        proximity: { ...this.state.proximity, enabled: true }
      });
      
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Stop proximity tracking
   */
  stopProximityTracking() {
    if (this.proximityWatcher) {
      navigator.geolocation.clearWatch(this.proximityWatcher);
      this.proximityWatcher = null;
    }
    
    Store.patch('proximity.enabled', false);
    this.setState({ 
      proximity: { ...this.state.proximity, enabled: false, nearby: [] }
    });
  }

  /**
   * Handle location update
   */
  async handleLocationUpdate(position) {
    const { latitude, longitude } = position.coords;
    
    // Check for venue
    const venue = this.detectVenue(latitude, longitude);
    if (venue !== this.state.proximity.venue) {
      this.setState({
        proximity: { ...this.state.proximity, venue }
      });
      
      if (venue) {
        this.emit('proximity:venue', { venue });
        this.notify(`Welcome to ${venue.name}!`, 'info');
      }
    }
    
    // Check for nearby professionals
    try {
      const nearby = await api.getNearbyProfessionals(latitude, longitude);
      if (nearby?.length) {
        this.setState({
          proximity: { ...this.state.proximity, nearby }
        });
        this.emit('proximity:nearby', { professionals: nearby });
      }
    } catch (error) {
      console.warn('Failed to get nearby professionals');
    }
  }

  /**
   * Detect venue from coordinates
   */
  detectVenue(lat, lng) {
    const venues = [
      { 
        name: 'Koelnmesse', 
        lat: 50.9473, 
        lng: 6.9831, 
        radius: 0.01 
      },
      { 
        name: 'Gamescom Party Hub', 
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
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Request location permission
   */
  async requestLocationPermission() {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state !== 'denied';
    } catch {
      return true; // Fallback for browsers without permissions API
    }
  }

  /**
   * Handle location error
   */
  handleLocationError(error) {
    console.warn('Location error:', error);
    this.notify('Location unavailable', 'warning');
  }

  /**
   * Setup opportunity toggle
   */
  setupOpportunityToggle() {
    const intentToggle = Store.get('opportunities.intentToggle') || false;
    this.setState({ intentToggle });
    
    this.on('intent:toggle', ({ enabled }) => {
      Store.patch('opportunities.intentToggle', enabled);
      this.setState({ intentToggle: enabled });
      
      if (enabled) {
        this.broadcastIntent();
      } else {
        this.clearIntent();
      }
    });
  }

  /**
   * Broadcast professional intent
   */
  async broadcastIntent() {
    const profile = this.state.profile;
    if (!profile.persona || !profile.skills) {
      this.notify('Complete your profile first', 'warning');
      this.emit('navigate', { route: '/me' });
      return;
    }
    
    try {
      await api.broadcastIntent({
        profileId: profile.id,
        persona: profile.persona,
        skills: profile.skills,
        looking: profile.looking
      });
      
      this.notify('You\'re now discoverable! 🚀', 'success');
      
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Clear professional intent
   */
  async clearIntent() {
    try {
      await api.clearIntent(this.state.profile.id);
      this.notify('Discovery mode disabled', 'info');
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Load connections
   */
  async loadConnections() {
    const connections = Store.get('connections') || [];
    this.setState({ connections });
    
    // Sync with server
    try {
      const serverConnections = await api.getConnections(this.state.profile.id);
      if (serverConnections?.length) {
        Store.patch('connections', serverConnections);
        this.setState({ connections: serverConnections });
      }
    } catch (error) {
      console.warn('Failed to sync connections');
    }
  }

  /**
   * Connect with professional
   */
  async connectWith(targetId) {
    try {
      await api.createConnection(this.state.profile.id, targetId);
      
      const connections = [...this.state.connections, {
        id: targetId,
        timestamp: Date.now(),
        status: 'pending'
      }];
      
      Store.patch('connections', connections);
      this.setState({ connections });
      
      this.notify('Connection request sent!', 'success');
      
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Generate profile ID
   */
  generateProfileId() {
    return 'prof_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Generate invite code
   */
  generateInviteCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Action handlers
   */
  actionOpenInvite() {
    Store.actions.openModal({
      type: 'invite',
      data: this.state.invites
    });
  }

  actionToggleProximity() {
    const enabled = !this.state.proximity.enabled;
    this.emit('proximity:toggle', { enabled });
  }

  actionToggleIntent() {
    const enabled = !this.state.intentToggle;
    this.emit('intent:toggle', { enabled });
  }

  actionViewNearby() {
    Store.actions.openModal({
      type: 'nearby',
      data: this.state.proximity.nearby
    });
  }

  actionManageConnections() {
    this.emit('navigate', { route: '/people' });
  }

  /**
   * Template for rendering
   */
  template(data) {
    const { profile, invites, proximity, intentToggle, connections } = data;
    
    return `
      <div class="networking-controller">
        <div class="networking-stats">
          <div class="stat-card">
            <h3>Invites</h3>
            <p class="stat-value">${invites.remaining}/10</p>
            <button data-action="openInvite" class="primary-btn">
              Send Invite
            </button>
          </div>
          
          <div class="stat-card">
            <h3>Proximity</h3>
            <p class="stat-value">
              ${proximity.enabled ? 'Active' : 'Inactive'}
              ${proximity.venue ? ` @ ${proximity.venue.name}` : ''}
            </p>
            <button data-action="toggleProximity" class="toggle-btn">
              ${proximity.enabled ? 'Disable' : 'Enable'}
            </button>
            ${proximity.nearby.length > 0 ? `
              <button data-action="viewNearby" class="link-btn">
                ${proximity.nearby.length} nearby
              </button>
            ` : ''}
          </div>
          
          <div class="stat-card">
            <h3>Intent Toggle</h3>
            <p class="stat-value">${intentToggle ? 'Broadcasting' : 'Private'}</p>
            <button data-action="toggleIntent" class="toggle-btn">
              ${intentToggle ? 'Go Private' : 'Go Live'}
            </button>
          </div>
          
          <div class="stat-card">
            <h3>Connections</h3>
            <p class="stat-value">${connections.length}</p>
            <button data-action="manageConnections" class="secondary-btn">
              Manage
            </button>
          </div>
        </div>
        
        <div class="networking-features">
          <div class="feature-card">
            <h4>🎯 Professional Persona</h4>
            <p>${profile?.persona || 'Not set'}</p>
            <button data-action="editProfile" class="edit-btn">Edit</button>
          </div>
          
          <div class="feature-card">
            <h4>🔍 Discovery Settings</h4>
            <ul class="settings-list">
              <li>Skills: ${profile?.skills?.join(', ') || 'None'}</li>
              <li>Looking for: ${profile?.looking || 'Not specified'}</li>
              <li>Availability: ${profile?.available ? 'Open' : 'Busy'}</li>
            </ul>
          </div>
          
          <div class="feature-card">
            <h4>📊 Activity</h4>
            <ul class="activity-list">
              <li>Events saved: ${Store.get('events.saved')?.length || 0}</li>
              <li>Opportunities created: ${Store.get('opportunities.created')?.length || 0}</li>
              <li>Profile views: ${profile?.views || 0}</li>
            </ul>
          </div>
        </div>
        
        ${invites.myCode ? `
          <div class="invite-share">
            <h4>Your Invite Code</h4>
            <div class="code-display">
              <code>${invites.myCode}</code>
              <button data-action="copyCode" data-code="${invites.myCode}">
                Copy
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Store subscriptions
   */
  setupStoreSubscriptions() {
    this.subscribe('profile', (profile) => {
      this.setState({ profile });
    });
    
    this.subscribe('invites', (invites) => {
      this.setState({ invites });
    });
    
    this.subscribe('proximity', (proximity) => {
      this.setState({ proximity });
    });
    
    this.subscribe('connections', (connections) => {
      this.setState({ connections });
    });
  }

  /**
   * Cleanup on destroy
   */
  onDestroy() {
    this.stopProximityTracking();
  }
}

export default NetworkingController;