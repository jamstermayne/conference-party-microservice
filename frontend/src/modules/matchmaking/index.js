/**
 * Matchmaking Module
 *
 * SINGLE RESPONSIBILITY: Professional networking and AI-powered matching
 * - Profile creation and management
 * - Match generation and scoring
 * - Connection requests and approvals
 * - Professional networking features
 *
 * This module is completely isolated and communicates only through the Platform event bus
 */

import platform from '../core/platform.js';

class MatchmakingModule {
  constructor() {
    this.container = null;
    this.state = {
      profile: null,
      matches: [],
      connections: [],
      isProfileComplete: false,
      loading: false,
      error: null,
      view: 'welcome' // 'welcome', 'profile', 'matches', 'connections'
    };

    // Bind methods
    this.mount = this.mount.bind(this);
    this.unmount = this.unmount.bind(this);
    this.createProfile = this.createProfile.bind(this);
    this.findMatches = this.findMatches.bind(this);
    this.sendConnectionRequest = this.sendConnectionRequest.bind(this);
  }

  // ============= MODULE LIFECYCLE =============

  /**
   * Mount the module to a container
   */
  async mount(container) {
    this.container = container;
    console.log('[MatchmakingModule] Mounting...');

    // Register event listeners
    this.registerEventListeners();

    // Check if user is authenticated
    const user = platform.getUser();
    if (user) {
      await this.loadUserProfile(user.id);
    }

    // Render initial UI
    this.render();

    console.log('[MatchmakingModule] Mounted successfully');
  }

  /**
   * Unmount the module and clean up
   */
  async unmount() {
    console.log('[MatchmakingModule] Unmounting...');

    // Clean up event listeners
    this.unregisterEventListeners();

    // Clear container
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }

    // Reset state
    this.state = {
      profile: null,
      matches: [],
      connections: [],
      isProfileComplete: false,
      loading: false,
      error: null,
      view: 'welcome'
    };

    console.log('[MatchmakingModule] Unmounted successfully');
  }

  /**
   * Get module state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Set module state
   */
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.render();
  }

  // ============= MATCHMAKING LOGIC =============

  /**
   * Load user profile
   */
  async loadUserProfile(userId) {
    try {
      // Check localStorage for profile
      const stored = localStorage.getItem(`matchmaking_profile_${userId}`);
      if (stored) {
        const profile = JSON.parse(stored);
        this.setState({
          profile: profile,
          isProfileComplete: this.isProfileComplete(profile),
          view: this.isProfileComplete(profile) ? 'matches' : 'profile'
        });

        if (this.isProfileComplete(profile)) {
          await this.findMatches();
        }
      }
    } catch (error) {
      console.error('[MatchmakingModule] Failed to load profile:', error);
    }
  }

  /**
   * Check if profile is complete
   */
  isProfileComplete(profile) {
    return profile &&
           profile.businessType &&
           profile.companySize &&
           profile.roles &&
           profile.roles.length > 0 &&
           profile.lookingFor &&
           profile.lookingFor.length > 0;
  }

  /**
   * Create or update profile
   */
  async createProfile(profileData) {
    const user = platform.getUser();
    if (!user) {
      platform.emit('matchmaking:require-auth', {
        action: 'create-profile'
      });
      return;
    }

    this.setState({ loading: true });

    try {
      const profile = {
        userId: user.id,
        ...profileData,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Save to localStorage (in real app, would sync with API)
      localStorage.setItem(
        `matchmaking_profile_${user.id}`,
        JSON.stringify(profile)
      );

      this.setState({
        profile: profile,
        isProfileComplete: true,
        loading: false,
        view: 'matches'
      });

      // Find matches
      await this.findMatches();

      // Emit event
      platform.emit('matchmaking:profile-created', {
        userId: user.id,
        profile: profile
      });

    } catch (error) {
      console.error('[MatchmakingModule] Failed to create profile:', error);
      this.setState({
        loading: false,
        error: error.message
      });
    }
  }

  /**
   * Find matches for user
   */
  async findMatches() {
    if (!this.state.profile) return;

    this.setState({ loading: true });

    try {
      // Mock AI matching algorithm
      const mockMatches = this.generateMockMatches();

      this.setState({
        matches: mockMatches,
        loading: false
      });

      // Emit event
      platform.emit('matchmaking:matches-found', {
        userId: this.state.profile.userId,
        matchCount: mockMatches.length,
        matches: mockMatches
      });

    } catch (error) {
      console.error('[MatchmakingModule] Failed to find matches:', error);
      this.setState({
        loading: false,
        error: error.message
      });
    }
  }

  /**
   * Generate mock matches for demo
   */
  generateMockMatches() {
    const profiles = [
      {
        id: '1',
        name: 'Sarah Chen',
        company: 'Indie Game Studio',
        role: 'Game Designer',
        businessType: 'Developer',
        lookingFor: ['Publisher', 'Investor'],
        commonInterests: ['Game Design', 'Indie Development'],
        score: 92
      },
      {
        id: '2',
        name: 'Alex Rodriguez',
        company: 'VR Ventures',
        role: 'CTO',
        businessType: 'Publisher',
        lookingFor: ['Developer', 'Technology'],
        commonInterests: ['VR Gaming', 'Technology'],
        score: 87
      },
      {
        id: '3',
        name: 'Emma Wilson',
        company: 'Game Capital',
        role: 'Investment Manager',
        businessType: 'Investor',
        lookingFor: ['Developer', 'Publishing'],
        commonInterests: ['Gaming Industry', 'Investment'],
        score: 84
      }
    ];

    // Filter based on user's lookingFor
    const userLookingFor = this.state.profile.lookingFor || [];
    return profiles.filter(profile =>
      userLookingFor.includes(profile.businessType)
    );
  }

  /**
   * Send connection request
   */
  async sendConnectionRequest(matchId, message = '') {
    const user = platform.getUser();
    if (!user) return;

    try {
      const connection = {
        id: Date.now().toString(),
        fromUserId: user.id,
        toUserId: matchId,
        message: message,
        status: 'pending',
        createdAt: Date.now()
      };

      // Add to connections
      this.state.connections.push(connection);

      // Save to localStorage
      localStorage.setItem(
        `matchmaking_connections_${user.id}`,
        JSON.stringify(this.state.connections)
      );

      this.render();

      // Emit event
      platform.emit('matchmaking:connection-request', {
        connectionId: connection.id,
        fromUserId: user.id,
        toUserId: matchId,
        message: message
      });

    } catch (error) {
      console.error('[MatchmakingModule] Failed to send connection:', error);
    }
  }

  // ============= UI RENDERING =============

  /**
   * Render the matchmaking UI
   */
  render() {
    if (!this.container) return;

    const user = platform.getUser();

    if (!user) {
      this.renderRequireAuth();
      return;
    }

    switch (this.state.view) {
      case 'welcome':
        this.renderWelcome();
        break;
      case 'profile':
        this.renderProfile();
        break;
      case 'matches':
        this.renderMatches();
        break;
      case 'connections':
        this.renderConnections();
        break;
      default:
        this.renderWelcome();
    }
  }

  /**
   * Render require authentication view
   */
  renderRequireAuth() {
    this.container.innerHTML = `
      <div class="matchmaking-module">
        <div class="matchmaking-auth-required">
          <h2>🤝 Professional Matchmaking</h2>
          <p>Connect with the right people at Gamescom</p>
          <div class="auth-prompt">
            <p>Please log in to start networking</p>
            <button id="matchmaking-request-auth">Sign In to Continue</button>
          </div>
        </div>
      </div>
    `;

    const authBtn = this.container.querySelector('#matchmaking-request-auth');
    if (authBtn) {
      authBtn.addEventListener('click', () => {
        platform.emit('matchmaking:require-auth', {
          action: 'start-networking'
        });
      });
    }
  }

  /**
   * Render welcome view
   */
  renderWelcome() {
    this.container.innerHTML = `
      <div class="matchmaking-module">
        <div class="matchmaking-welcome">
          <h2>🤝 Professional Matchmaking</h2>
          <p>AI-powered networking for game industry professionals</p>

          <div class="matchmaking-features">
            <div class="feature">
              <span class="feature-icon">🎯</span>
              <div>
                <h3>Smart Matching</h3>
                <p>Find the right connections based on your goals</p>
              </div>
            </div>
            <div class="feature">
              <span class="feature-icon">🚀</span>
              <div>
                <h3>Business Growth</h3>
                <p>Connect with investors, publishers, and partners</p>
              </div>
            </div>
            <div class="feature">
              <span class="feature-icon">⚡</span>
              <div>
                <h3>Instant Connect</h3>
                <p>Send connection requests and schedule meetings</p>
              </div>
            </div>
          </div>

          <button id="matchmaking-start" class="matchmaking-cta">
            Create Your Profile
          </button>
        </div>
      </div>
    `;

    const startBtn = this.container.querySelector('#matchmaking-start');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.setState({ view: 'profile' });
      });
    }
  }

  /**
   * Render profile creation view
   */
  renderProfile() {
    this.container.innerHTML = `
      <div class="matchmaking-module">
        <div class="matchmaking-profile">
          <h2>Create Your Professional Profile</h2>

          <form id="matchmaking-profile-form" class="profile-form">
            <div class="form-group">
              <label>Business Type</label>
              <select name="businessType" required>
                <option value="">Select your business type</option>
                <option value="Developer">Game Developer</option>
                <option value="Publisher">Publisher</option>
                <option value="Investor">Investor</option>
                <option value="Service Provider">Service Provider</option>
              </select>
            </div>

            <div class="form-group">
              <label>Company Size</label>
              <select name="companySize" required>
                <option value="">Select company size</option>
                <option value="Solo">Solo Developer</option>
                <option value="2-10">2-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="200+">200+ employees</option>
              </select>
            </div>

            <div class="form-group">
              <label>Your Roles (select all that apply)</label>
              <div class="checkbox-group">
                <label><input type="checkbox" name="roles" value="Developer"> Developer</label>
                <label><input type="checkbox" name="roles" value="Designer"> Designer</label>
                <label><input type="checkbox" name="roles" value="Producer"> Producer</label>
                <label><input type="checkbox" name="roles" value="Artist"> Artist</label>
                <label><input type="checkbox" name="roles" value="CEO"> CEO/Founder</label>
                <label><input type="checkbox" name="roles" value="CTO"> CTO</label>
                <label><input type="checkbox" name="roles" value="Business Dev"> Business Development</label>
              </div>
            </div>

            <div class="form-group">
              <label>Looking For (select all that apply)</label>
              <div class="checkbox-group">
                <label><input type="checkbox" name="lookingFor" value="Developer"> Developers</label>
                <label><input type="checkbox" name="lookingFor" value="Publisher"> Publishers</label>
                <label><input type="checkbox" name="lookingFor" value="Investor"> Investors</label>
                <label><input type="checkbox" name="lookingFor" value="Service Provider"> Service Providers</label>
                <label><input type="checkbox" name="lookingFor" value="Technology"> Technology Partners</label>
                <label><input type="checkbox" name="lookingFor" value="Marketing"> Marketing Partners</label>
              </div>
            </div>

            <button type="submit" class="profile-submit" ${this.state.loading ? 'disabled' : ''}>
              ${this.state.loading ? 'Creating Profile...' : 'Find My Matches'}
            </button>
          </form>
        </div>
      </div>
    `;

    const form = this.container.querySelector('#matchmaking-profile-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);

        // Get roles
        const roles = Array.from(form.querySelectorAll('input[name="roles"]:checked'))
          .map(input => input.value);

        // Get lookingFor
        const lookingFor = Array.from(form.querySelectorAll('input[name="lookingFor"]:checked'))
          .map(input => input.value);

        const profileData = {
          businessType: formData.get('businessType'),
          companySize: formData.get('companySize'),
          roles: roles,
          lookingFor: lookingFor
        };

        this.createProfile(profileData);
      });
    }
  }

  /**
   * Render matches view
   */
  renderMatches() {
    this.container.innerHTML = `
      <div class="matchmaking-module">
        <div class="matchmaking-nav">
          <button class="nav-btn active" id="nav-matches">Matches</button>
          <button class="nav-btn" id="nav-connections">Connections</button>
          <button class="nav-btn" id="nav-profile">Profile</button>
        </div>

        <div class="matchmaking-matches">
          <h2>Your Matches (${this.state.matches.length})</h2>

          ${this.state.loading ? this.renderLoading() : ''}
          ${this.state.matches.length === 0 && !this.state.loading ? `
            <div class="no-matches">
              <p>Finding your perfect matches...</p>
              <button id="refresh-matches">Refresh Matches</button>
            </div>
          ` : ''}

          <div class="matches-grid">
            ${this.state.matches.map(match => this.renderMatchCard(match)).join('')}
          </div>
        </div>
      </div>
    `;

    this.attachNavigationListeners();
    this.attachMatchListeners();
  }

  /**
   * Render connections view
   */
  renderConnections() {
    this.container.innerHTML = `
      <div class="matchmaking-module">
        <div class="matchmaking-nav">
          <button class="nav-btn" id="nav-matches">Matches</button>
          <button class="nav-btn active" id="nav-connections">Connections</button>
          <button class="nav-btn" id="nav-profile">Profile</button>
        </div>

        <div class="matchmaking-connections">
          <h2>Your Connections (${this.state.connections.length})</h2>

          ${this.state.connections.length === 0 ? `
            <div class="no-connections">
              <p>No connections yet. Start by sending some connection requests!</p>
            </div>
          ` : `
            <div class="connections-list">
              ${this.state.connections.map(conn => this.renderConnectionItem(conn)).join('')}
            </div>
          `}
        </div>
      </div>
    `;

    this.attachNavigationListeners();
  }

  /**
   * Render loading state
   */
  renderLoading() {
    return `
      <div class="matchmaking-loading">
        <div class="loading-spinner"></div>
        <p>Finding your matches...</p>
      </div>
    `;
  }

  /**
   * Render match card
   */
  renderMatchCard(match) {
    const hasConnection = this.state.connections.some(conn => conn.toUserId === match.id);

    return `
      <div class="match-card">
        <div class="match-header">
          <div class="match-avatar">
            ${match.name.charAt(0).toUpperCase()}
          </div>
          <div class="match-info">
            <h3>${match.name}</h3>
            <p>${match.role} at ${match.company}</p>
            <div class="match-score">Match Score: ${match.score}%</div>
          </div>
        </div>

        <div class="match-details">
          <div class="match-type">${match.businessType}</div>
          <div class="common-interests">
            <strong>Common Interests:</strong>
            ${match.commonInterests.map(interest =>
              `<span class="interest-tag">${interest}</span>`
            ).join('')}
          </div>
        </div>

        <div class="match-actions">
          ${hasConnection ? `
            <button class="match-btn connected" disabled>
              ✓ Connection Sent
            </button>
          ` : `
            <button class="match-btn connect" data-match-id="${match.id}">
              Connect
            </button>
          `}
        </div>
      </div>
    `;
  }

  /**
   * Render connection item
   */
  renderConnectionItem(connection) {
    return `
      <div class="connection-item">
        <div class="connection-status ${connection.status}">
          ${connection.status}
        </div>
        <div class="connection-details">
          <p>Connection request sent</p>
          ${connection.message ? `<p class="connection-message">"${connection.message}"</p>` : ''}
          <p class="connection-date">${new Date(connection.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
    `;
  }

  /**
   * Attach navigation listeners
   */
  attachNavigationListeners() {
    const navButtons = this.container.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.id.replace('nav-', '');
        this.setState({ view });
      });
    });
  }

  /**
   * Attach match action listeners
   */
  attachMatchListeners() {
    const connectButtons = this.container.querySelectorAll('.connect');
    connectButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const matchId = btn.dataset.matchId;
        const message = prompt('Add a personal message (optional):') || '';
        this.sendConnectionRequest(matchId, message);
      });
    });

    const refreshBtn = this.container.querySelector('#refresh-matches');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.findMatches());
    }
  }

  // ============= EVENT HANDLING =============

  /**
   * Register platform event listeners
   */
  registerEventListeners() {
    // Listen for user login
    this.loginHandler = (data) => {
      if (data.user) {
        this.loadUserProfile(data.user.id);
        this.render();
      }
    };
    platform.on('auth:login', this.loginHandler);

    // Listen for user logout
    this.logoutHandler = () => {
      this.setState({
        profile: null,
        matches: [],
        connections: [],
        isProfileComplete: false,
        view: 'welcome'
      });
    };
    platform.on('auth:logout', this.logoutHandler);

    // Listen for events to suggest networking opportunities
    this.eventSelectedHandler = (data) => {
      // Could suggest matches attending the same event
      console.log('[MatchmakingModule] Event selected, could suggest attendees:', data.event.title);
    };
    platform.on('events:event-selected', this.eventSelectedHandler);
  }

  /**
   * Unregister event listeners
   */
  unregisterEventListeners() {
    if (this.loginHandler) platform.off('auth:login', this.loginHandler);
    if (this.logoutHandler) platform.off('auth:logout', this.logoutHandler);
    if (this.eventSelectedHandler) platform.off('events:event-selected', this.eventSelectedHandler);
  }

  // ============= PUBLIC API =============

  /**
   * Get user profile
   */
  getProfile() {
    return this.state.profile;
  }

  /**
   * Get matches
   */
  getMatches() {
    return [...this.state.matches];
  }

  /**
   * Get connections
   */
  getConnections() {
    return [...this.state.connections];
  }
}

// Export module
export default MatchmakingModule;