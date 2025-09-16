/**
 * Authentication Module - Micro-Frontend
 *
 * Single Responsibility: User authentication and session management
 * Zero dependencies on other modules
 * Communicates via Platform event bus only
 */

class AuthModule {
  constructor(platform) {
    this.platform = platform;
    this.container = null;
    this.state = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    };

    this.init();
  }

  init() {
    console.log('[AuthModule] Initializing');

    // Listen to platform events we care about
    this.platform.on('app:startup', () => {
      this.checkExistingSession();
    });

    // Subscribe to logout requests from other modules
    this.platform.on('auth:logout', () => {
      this.logout();
    });
  }

  // ==========================================
  // MODULE INTERFACE (Required by Platform)
  // ==========================================

  /**
   * Mount auth module in container
   */
  async mount(container) {
    this.container = container;

    // Check if already authenticated
    await this.checkExistingSession();

    if (this.state.isAuthenticated) {
      this.renderAuthenticatedState();
    } else {
      this.renderLoginForm();
    }

    console.log('[AuthModule] Mounted');
  }

  /**
   * Unmount and cleanup
   */
  async unmount() {
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }

    console.log('[AuthModule] Unmounted');
  }

  /**
   * Get current module state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Set module state (for testing/debugging)
   */
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.updateUI();
  }

  // ==========================================
  // AUTHENTICATION LOGIC
  // ==========================================

  /**
   * Check for existing authentication session
   */
  async checkExistingSession() {
    this.setState({ isLoading: true });

    try {
      // Check localStorage for session
      const savedUser = localStorage.getItem('user');
      const savedProfile = localStorage.getItem('smartProfile');

      if (savedUser) {
        const user = JSON.parse(savedUser);
        await this.setAuthenticated(user);
      } else if (savedProfile) {
        // Legacy profile format
        const profile = JSON.parse(savedProfile);
        const user = {
          id: Date.now(),
          name: profile.name,
          email: profile.email,
          company: profile.company,
          role: profile.role
        };
        await this.setAuthenticated(user);
      }

    } catch (error) {
      console.error('[AuthModule] Session check failed:', error);
      this.setState({ error: 'Session validation failed' });
    } finally {
      this.setState({ isLoading: false });
    }
  }

  /**
   * Authenticate user with email/password
   */
  async login(email, password) {
    this.setState({ isLoading: true, error: null });

    try {
      // Simulate API call (replace with real API)
      const response = await this.callAuthAPI('/api/auth/login', {
        email,
        password
      });

      if (response.success) {
        await this.setAuthenticated(response.user);
        return { success: true };
      } else {
        throw new Error(response.message || 'Login failed');
      }

    } catch (error) {
      console.error('[AuthModule] Login failed:', error);
      this.setState({
        error: error.message || 'Login failed',
        isLoading: false
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Register new user
   */
  async register(userData) {
    this.setState({ isLoading: true, error: null });

    try {
      const response = await this.callAuthAPI('/api/auth/register', userData);

      if (response.success) {
        await this.setAuthenticated(response.user);
        return { success: true };
      } else {
        throw new Error(response.message || 'Registration failed');
      }

    } catch (error) {
      console.error('[AuthModule] Registration failed:', error);
      this.setState({
        error: error.message || 'Registration failed',
        isLoading: false
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Logout user
   */
  async logout() {
    this.setState({ isLoading: true });

    try {
      // Clear session
      localStorage.removeItem('user');
      localStorage.removeItem('smartProfile');
      sessionStorage.clear();

      // Reset state
      this.setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });

      // Notify other modules
      this.platform.emit('auth:logout', {});
      this.platform.setUser(null);

      // Update UI
      this.renderLoginForm();

      console.log('[AuthModule] User logged out');

    } catch (error) {
      console.error('[AuthModule] Logout failed:', error);
      this.setState({ error: 'Logout failed', isLoading: false });
    }
  }

  /**
   * Set user as authenticated
   */
  async setAuthenticated(user) {
    // Store user data
    localStorage.setItem('user', JSON.stringify(user));

    // Update state
    this.setState({
      user,
      isAuthenticated: true,
      isLoading: false,
      error: null
    });

    // Notify platform and other modules
    this.platform.setUser(user);
    this.platform.emit('auth:login', { user });

    console.log('[AuthModule] User authenticated:', user.email);
  }

  // ==========================================
  // API CALLS
  // ==========================================

  /**
   * Make authenticated API call
   */
  async callAuthAPI(endpoint, data) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      return await response.json();

    } catch (error) {
      // Fallback for demo - simulate successful auth
      if (endpoint.includes('/login') && data.email) {
        return {
          success: true,
          user: {
            id: Date.now(),
            email: data.email,
            name: data.email.split('@')[0],
            company: 'Demo Company',
            role: 'Professional'
          }
        };
      }

      if (endpoint.includes('/register')) {
        return {
          success: true,
          user: {
            id: Date.now(),
            ...data
          }
        };
      }

      throw error;
    }
  }

  // ==========================================
  // UI RENDERING
  // ==========================================

  /**
   * Render login form
   */
  renderLoginForm() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="auth-module">
        <div class="auth-container">
          <div class="auth-header">
            <h2>Welcome to MAU 2025</h2>
            <p>Sign in to access professional networking</p>
          </div>

          ${this.state.error ? `
            <div class="auth-error">
              <span>⚠️ ${this.state.error}</span>
            </div>
          ` : ''}

          <form class="auth-form" id="loginForm">
            <div class="form-group">
              <label for="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="sarah@company.com"
                required
                ${this.state.isLoading ? 'disabled' : ''}
              />
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Enter your password"
                required
                ${this.state.isLoading ? 'disabled' : ''}
              />
            </div>

            <button
              type="submit"
              class="auth-btn auth-btn-primary"
              ${this.state.isLoading ? 'disabled' : ''}
            >
              ${this.state.isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div class="auth-divider">
            <span>or</span>
          </div>

          <button class="auth-btn auth-btn-secondary" id="registerBtn">
            Create New Account
          </button>

          <div class="auth-footer">
            <p>Demo Mode: Any email will work</p>
          </div>
        </div>
      </div>
    `;

    this.attachEventHandlers();
    this.injectStyles();
  }

  /**
   * Render authenticated state
   */
  renderAuthenticatedState() {
    if (!this.container) return;

    const user = this.state.user;

    this.container.innerHTML = `
      <div class="auth-module">
        <div class="auth-authenticated">
          <div class="user-info">
            <div class="user-avatar">
              ${user.name?.charAt(0) || '?'}
            </div>
            <div class="user-details">
              <h3>${user.name || 'User'}</h3>
              <p>${user.email}</p>
              <small>${user.company || ''} ${user.role ? '• ' + user.role : ''}</small>
            </div>
          </div>

          <button class="auth-btn auth-btn-outline" id="logoutBtn">
            Sign Out
          </button>
        </div>
      </div>
    `;

    this.attachEventHandlers();
  }

  /**
   * Attach event handlers to UI elements
   */
  attachEventHandlers() {
    const loginForm = document.getElementById('loginForm');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(loginForm);
        await this.login(
          formData.get('email'),
          formData.get('password')
        );
      });
    }

    if (registerBtn) {
      registerBtn.addEventListener('click', () => {
        this.showRegistrationForm();
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.logout();
      });
    }
  }

  /**
   * Show registration form
   */
  showRegistrationForm() {
    // For demo - just simulate registration with email
    const email = prompt('Enter your email for demo registration:');
    if (email) {
      this.register({
        email,
        name: email.split('@')[0],
        company: 'Demo Company',
        role: 'Professional'
      });
    }
  }

  /**
   * Update UI based on current state
   */
  updateUI() {
    if (this.state.isAuthenticated) {
      this.renderAuthenticatedState();
    } else {
      this.renderLoginForm();
    }
  }

  /**
   * Inject module-specific styles
   */
  injectStyles() {
    if (document.getElementById('auth-module-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'auth-module-styles';
    styles.textContent = `
      .auth-module {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 20px;
      }

      .auth-container, .auth-authenticated {
        background: white;
        border-radius: 16px;
        padding: 40px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        max-width: 400px;
        width: 100%;
      }

      .auth-header {
        text-align: center;
        margin-bottom: 32px;
      }

      .auth-header h2 {
        color: #2d3748;
        font-size: 24px;
        margin-bottom: 8px;
      }

      .auth-header p {
        color: #718096;
        font-size: 16px;
      }

      .auth-error {
        background: #fed7d7;
        color: #c53030;
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 20px;
        text-align: center;
      }

      .form-group {
        margin-bottom: 20px;
      }

      .form-group label {
        display: block;
        color: #4a5568;
        font-weight: 600;
        margin-bottom: 8px;
      }

      .form-group input {
        width: 100%;
        padding: 12px 16px;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        font-size: 16px;
        transition: border-color 0.2s;
      }

      .form-group input:focus {
        outline: none;
        border-color: #667eea;
      }

      .auth-btn {
        width: 100%;
        padding: 14px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
      }

      .auth-btn-primary {
        background: #667eea;
        color: white;
      }

      .auth-btn-primary:hover:not(:disabled) {
        background: #5a67d8;
        transform: translateY(-2px);
      }

      .auth-btn-secondary {
        background: transparent;
        color: #667eea;
        border: 2px solid #667eea;
      }

      .auth-btn-secondary:hover {
        background: #667eea;
        color: white;
      }

      .auth-btn-outline {
        background: transparent;
        color: #e53e3e;
        border: 2px solid #e53e3e;
      }

      .auth-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .auth-divider {
        text-align: center;
        margin: 24px 0;
        position: relative;
      }

      .auth-divider::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 1px;
        background: #e2e8f0;
      }

      .auth-divider span {
        background: white;
        color: #a0aec0;
        padding: 0 16px;
      }

      .auth-footer {
        text-align: center;
        margin-top: 24px;
      }

      .auth-footer p {
        color: #a0aec0;
        font-size: 14px;
      }

      .user-info {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;
      }

      .user-avatar {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: #667eea;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        font-weight: bold;
      }

      .user-details h3 {
        margin: 0 0 4px 0;
        color: #2d3748;
      }

      .user-details p {
        margin: 0 0 4px 0;
        color: #4a5568;
      }

      .user-details small {
        color: #718096;
      }
    `;

    document.head.appendChild(styles);
  }

  // ==========================================
  // PUBLIC API
  // ==========================================

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return this.state.isAuthenticated;
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.state.user;
  }

  /**
   * Force refresh user session
   */
  async refreshSession() {
    await this.checkExistingSession();
  }
}

export default AuthModule;