/**
 * Matchmaking Client
 * Connects frontend to matchmaking microservice API
 * Integrates with modern design system
 */

class MatchmakingClient {
  constructor() {
    // Use matchmaking microservice endpoint
    this.apiBase = window.location.hostname === 'localhost'
      ? 'http://localhost:5001/conference-party-app/us-central1/matchmakingService'
      : 'https://us-central1-conference-party-app.cloudfunctions.net/matchmakingService';

    this.authToken = null;
    this.currentProfile = null;
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 seconds

    this.init();
  }

  async init() {
    // Get or generate auth token
    this.authToken = await this.getAuthToken();

    // Load user profile if token exists
    if (this.authToken) {
      await this.loadProfile();
    }
  }

  async getAuthToken() {
    // Try Firebase auth first
    if (typeof firebase !== 'undefined' && firebase.auth) {
      const user = firebase.auth().currentUser;
      if (user) {
        return await user.getIdToken();
      }
    }

    // Generate demo token for testing
    const demoToken = localStorage.getItem('matchmaking_token');
    if (!demoToken) {
      const newToken = 'demo_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('matchmaking_token', newToken);
      return newToken;
    }
    return demoToken;
  }

  /**
   * Load user profile from matchmaking service
   */
  async loadProfile() {
    try {
      const response = await this.request('/profile');
      if (response.success) {
        this.currentProfile = response.profile;
        return this.currentProfile;
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData) {
    try {
      const response = await this.request('/profile', {
        method: 'POST',
        body: profileData
      });
      if (response.success) {
        this.currentProfile = response.profile;
        this.showNotification('Profile updated successfully', 'success');
        return this.currentProfile;
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      this.showNotification('Failed to update profile', 'error');
      throw error;
    }
  }

  /**
   * Generate new matches
   */
  async generateMatches(options = {}) {
    try {
      const response = await this.request('/matches/generate', {
        method: 'POST',
        body: {
          limit: options.limit || 10,
          radius: options.radius || 5000
        }
      });

      if (response.success) {
        return response.matches;
      }
      return [];
    } catch (error) {
      console.error('Error generating matches:', error);
      this.showNotification('Failed to generate matches', 'error');
      return this.getDemoMatches();
    }
  }

  /**
   * Get existing matches
   */
  async getMatches(status = null, limit = 20) {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      params.append('limit', limit.toString());

      const response = await this.request(`/matches?${params}`);
      if (response.success) {
        return response.matches;
      }
      return [];
    } catch (error) {
      console.error('Error getting matches:', error);
      return this.getDemoMatches();
    }
  }

  /**
   * Swipe on a match
   */
  async swipe(matchId, action) {
    try {
      const response = await this.request('/swipe', {
        method: 'POST',
        body: {
          matchId,
          action // 'like' or 'pass'
        },
        noCache: true
      });

      if (response.success) {
        if (response.mutual) {
          this.showNotification("It's a match! 🎉", 'success', { duration: 5000 });
        }
        return response;
      }
    } catch (error) {
      console.error('Error swiping:', error);
      this.showNotification('Failed to process swipe', 'error');
      throw error;
    }
  }

  /**
   * Get nearby users
   */
  async getNearbyUsers(radius = 1000, limit = 20) {
    try {
      const params = new URLSearchParams({
        radius: radius.toString(),
        limit: limit.toString()
      });

      const response = await this.request(`/nearby?${params}`);
      if (response.success) {
        return response.users;
      }
      return [];
    } catch (error) {
      console.error('Error getting nearby users:', error);
      return [];
    }
  }

  /**
   * Make authenticated request to API
   */
  async request(endpoint, options = {}) {
    const url = `${this.apiBase}${endpoint}`;

    // Check cache for GET requests
    const cacheKey = `${options.method || 'GET'}_${endpoint}_${JSON.stringify(options.body || {})}`;
    if (!options.noCache && (!options.method || options.method === 'GET')) {
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
          ...options.headers
        },
        body: options.body ? JSON.stringify(options.body) : undefined
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Cache successful GET requests
      if (!options.method || options.method === 'GET') {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      }

      return data;
    } catch (error) {
      console.error('[MatchmakingClient] Request failed:', error);

      // Return cached data if available on error
      if (this.cache.has(cacheKey)) {
        console.log('[MatchmakingClient] Returning stale cache on error');
        return this.cache.get(cacheKey).data;
      }

      throw error;
    }
  }

  /**
   * Render matches in UI using design system
   */
  renderMatches(matches, containerId = 'matches-container') {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (matches.length === 0) {
      container.innerHTML = `
        <div class="card card--outlined">
          <div class="card__body">
            <p class="text-center text-secondary">No matches found. Try adjusting your profile or check back later.</p>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = matches.map(match => {
      const matchUser = match.matchedUser || {};
      const score = Math.round(match.score * 100);

      return `
        <div class="card card--interactive card--fade-in" data-match-id="${match.id}">
          <div class="card__header">
            <div class="flex-1">
              <h3 class="card__title">${matchUser.displayName || 'Unknown User'}</h3>
              ${matchUser.company ? `<p class="card__subtitle">${matchUser.position || 'Professional'} at ${matchUser.company}</p>` : ''}
            </div>
            <div class="card__badge ${score >= 80 ? 'card__badge--success' : ''}">
              ${score}% Match
            </div>
          </div>

          ${matchUser.bio ? `
            <div class="card__body">
              <p>${matchUser.bio}</p>
            </div>
          ` : ''}

          ${match.reasons && match.reasons.length > 0 ? `
            <div class="card__meta">
              ${match.reasons.map(reason => `
                <span class="card__meta-item">
                  <svg class="card__meta-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                    <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 100 4h2a2 2 0 100-4h-.5a1 1 0 000-2H8a2 2 0 012-2z"/>
                  </svg>
                  ${reason}
                </span>
              `).join('')}
            </div>
          ` : ''}

          ${match.commonInterests && match.commonInterests.length > 0 ? `
            <div class="card__divider"></div>
            <div class="flex gap-2 flex-wrap">
              ${match.commonInterests.map(interest => `
                <span class="badge badge--primary">${interest}</span>
              `).join('')}
            </div>
          ` : ''}

          <div class="card__footer">
            <button class="btn btn--primary btn--sm" onclick="matchmakingClient.handleSwipe('${match.id}', 'like')">
              <svg class="btn__icon" width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/>
              </svg>
              Like
            </button>
            <button class="btn btn--secondary btn--sm" onclick="matchmakingClient.handleSwipe('${match.id}', 'pass')">
              Pass
            </button>
            ${matchUser.uid ? `
              <button class="btn btn--ghost btn--sm" onclick="matchmakingClient.viewProfile('${matchUser.uid}')">
                View Profile
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Handle swipe action
   */
  async handleSwipe(matchId, action) {
    try {
      const result = await this.swipe(matchId, action);

      // Remove card with animation
      const card = document.querySelector(`[data-match-id="${matchId}"]`);
      if (card) {
        card.classList.add('card--slide-out');
        setTimeout(() => card.remove(), 300);
      }

      // Load next match if needed
      const container = document.getElementById('matches-container');
      if (container && container.children.length <= 1) {
        const newMatches = await this.generateMatches({ limit: 5 });
        if (newMatches.length > 0) {
          this.renderMatches(newMatches);
        }
      }

      return result;
    } catch (error) {
      console.error('Error handling swipe:', error);
    }
  }

  /**
   * View user profile
   */
  viewProfile(userId) {
    console.log('Viewing profile:', userId);
    // Could open a modal or navigate to profile page
    window.location.hash = `#profile/${userId}`;
  }

  /**
   * Update user location
   */
  async updateLocation(lat, lng, venue = null) {
    try {
      const response = await this.request('/profile', {
        method: 'POST',
        body: {
          location: { lat, lng, venue }
        },
        noCache: true
      });

      if (response.success) {
        this.showNotification('Location updated', 'success');
        return true;
      }
    } catch (error) {
      console.error('Error updating location:', error);
      return false;
    }
  }

  /**
   * Show notification using design system
   */
  showNotification(message, type = 'success', options = {}) {
    const notification = document.createElement('div');
    notification.className = `notification notification--${type} notification--slide-in`;

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    notification.innerHTML = `
      <div class="notification__icon">${options.icon || icons[type] || icons.info}</div>
      <div class="notification__content">
        <div class="notification__message">${message}</div>
      </div>
      <button class="notification__close" aria-label="Close">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4.293 4.293a1 1 0 011.414 0L8 6.586l2.293-2.293a1 1 0 111.414 1.414L9.414 8l2.293 2.293a1 1 0 01-1.414 1.414L8 9.414l-2.293 2.293a1 1 0 01-1.414-1.414L6.586 8 4.293 5.707a1 1 0 010-1.414z"/>
        </svg>
      </button>
    `;

    // Add to notification container
    let container = document.querySelector('.notifications-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'notifications-container';
      document.body.appendChild(container);
    }

    container.appendChild(notification);

    // Auto remove after duration
    const duration = options.duration || 3000;
    setTimeout(() => {
      notification.classList.add('notification--slide-out');
      setTimeout(() => notification.remove(), 300);
    }, duration);

    // Close button handler
    notification.querySelector('.notification__close').addEventListener('click', () => {
      notification.classList.add('notification--slide-out');
      setTimeout(() => notification.remove(), 300);
    });
  }

  /**
   * Initialize matching UI when DOM is ready
   */
  async initUI() {
    // Add loading state
    const container = document.getElementById('matches-container');
    if (container) {
      container.innerHTML = '<div class="card card--loading"><div class="skeleton skeleton--title"></div><div class="skeleton skeleton--text"></div></div>';
    }

    // Fetch and display matches
    const matches = await this.generateMatches();
    this.renderMatches(matches);

    // Add refresh button handler
    const refreshBtn = document.getElementById('refresh-matches');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        refreshBtn.disabled = true;
        refreshBtn.classList.add('btn--loading');
        const matches = await this.generateMatches();
        this.renderMatches(matches);
        refreshBtn.disabled = false;
        refreshBtn.classList.remove('btn--loading');
      });
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('[MatchmakingClient] Cache cleared');
  }

  /**
   * Get client stats for debugging
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      currentProfile: this.currentProfile?.uid,
      authToken: this.authToken ? 'Present' : 'Missing',
      apiBase: this.apiBase
    };
  }

  /**
   * Demo matches fallback
   */
  getDemoMatches() {
    return [
      {
        id: 'demo_match_1',
        user1: 'demo_user',
        user2: 'user_2',
        score: 0.85,
        reasons: ['Both work in Gaming', 'Shared interests: Web Development, AI'],
        status: 'pending',
        createdAt: new Date().toISOString(),
        commonInterests: ['Web Development', 'AI', 'Cloud Computing'],
        matchedUser: {
          uid: 'user_2',
          displayName: 'Alex Chen',
          company: 'GameStudio',
          position: 'Lead Developer',
          bio: 'Building the next generation of gaming experiences',
          photoURL: null
        }
      },
      {
        id: 'demo_match_2',
        user1: 'demo_user',
        user2: 'user_3',
        score: 0.75,
        reasons: ['Similar skills: JavaScript, React', 'Looking for: Partnership'],
        status: 'pending',
        createdAt: new Date().toISOString(),
        commonInterests: ['Mobile Development', 'React'],
        matchedUser: {
          uid: 'user_3',
          displayName: 'Sarah Johnson',
          company: 'TechVentures',
          position: 'Product Manager',
          bio: 'Connecting innovators with opportunities',
          photoURL: null
        }
      },
      {
        id: 'demo_match_3',
        user1: 'demo_user',
        user2: 'user_4',
        score: 0.65,
        reasons: ['Potential networking opportunity'],
        status: 'pending',
        createdAt: new Date().toISOString(),
        commonInterests: ['Blockchain'],
        matchedUser: {
          uid: 'user_4',
          displayName: 'Marcus Schmidt',
          company: 'InnovateLab',
          position: 'CTO',
          bio: 'Exploring emerging technologies',
          photoURL: null
        }
      }
    ];
  }
}

// Create global instance
window.matchmakingClient = new MatchmakingClient();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('matches-container')) {
      window.matchmakingClient.initUI();
    }
  });
} else {
  if (document.getElementById('matches-container')) {
    window.matchmakingClient.initUI();
  }
}

// Add notification styles for design system integration
const style = document.createElement('style');
style.textContent = `
  /* Notification Container */
  .notifications-container {
    position: fixed;
    top: var(--space-4);
    right: var(--space-4);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    pointer-events: none;
  }

  .notifications-container > * {
    pointer-events: auto;
  }

  /* Notification Component */
  .notification {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    max-width: 400px;
    min-width: 300px;
  }

  .notification__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-full);
    font-size: var(--text-lg);
  }

  .notification--success .notification__icon {
    background: rgba(16, 185, 129, 0.1);
    color: var(--success-light);
  }

  .notification--error .notification__icon {
    background: rgba(239, 68, 68, 0.1);
    color: var(--error-light);
  }

  .notification--warning .notification__icon {
    background: rgba(245, 158, 11, 0.1);
    color: var(--warning-light);
  }

  .notification--info .notification__icon {
    background: rgba(139, 92, 246, 0.1);
    color: var(--primary-400);
  }

  .notification__content {
    flex: 1;
  }

  .notification__message {
    color: var(--text-primary);
    font-size: var(--text-sm);
    line-height: var(--leading-relaxed);
  }

  .notification__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: transparent;
    border: none;
    color: var(--text-tertiary);
    cursor: pointer;
    border-radius: var(--radius-md);
    transition: all var(--duration-200) var(--ease-out);
  }

  .notification__close:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-secondary);
  }

  /* Animations */
  .notification--slide-in {
    animation: notificationSlideIn var(--duration-300) var(--ease-out);
  }

  .notification--slide-out {
    animation: notificationSlideOut var(--duration-300) var(--ease-in);
  }

  @keyframes notificationSlideIn {
    from {
      transform: translateX(calc(100% + var(--space-4)));
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes notificationSlideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(calc(100% + var(--space-4)));
      opacity: 0;
    }
  }

  /* Card slide out animation */
  .card--slide-out {
    animation: cardSlideOut var(--duration-300) var(--ease-in) forwards;
  }

  @keyframes cardSlideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }

  /* Badge styles */
  .badge {
    display: inline-flex;
    align-items: center;
    padding: var(--space-1) var(--space-2);
    font-size: var(--text-xs);
    font-weight: var(--font-semibold);
    border-radius: var(--radius-full);
    text-transform: uppercase;
    letter-spacing: var(--tracking-wider);
  }

  .badge--primary {
    background: rgba(139, 92, 246, 0.1);
    color: var(--primary-400);
    border: 1px solid rgba(139, 92, 246, 0.2);
  }

  /* Utility classes */
  .flex { display: flex; }
  .flex-1 { flex: 1; }
  .gap-2 { gap: var(--space-2); }
  .flex-wrap { flex-wrap: wrap; }
  .text-center { text-align: center; }
  .text-secondary { color: var(--text-secondary); }
`;

// Only append if not already added
if (!document.querySelector('style[data-matchmaking-styles]')) {
  style.setAttribute('data-matchmaking-styles', 'true');
  document.head.appendChild(style);
}