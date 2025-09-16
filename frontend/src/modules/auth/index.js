/**
 * Authentication Module
 *
 * SINGLE RESPONSIBILITY: User authentication and session management
 * - User login/logout
 * - Session validation
 * - OAuth integration (Google, LinkedIn)
 * - Magic link authentication
 * - User profile management
 *
 * This module is completely isolated and communicates only through the Platform event bus
 */

import platform from '../core/platform.js';

class AuthModule {
  constructor() {
    this.container = null;
    this.state = {
      isAuthenticated: false,
      user: null,
      session: null,
      loading: false,
      error: null
    };

    // Bind methods
    this.mount = this.mount.bind(this);
    this.unmount = this.unmount.bind(this);
    this.handleLogin = this.handleLogin.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
  }

  // ============= MODULE LIFECYCLE =============

  /**
   * Mount the module to a container
   */
  async mount(container) {
    this.container = container;
    console.log('[AuthModule] Mounting...');

    // Check for existing session
    await this.checkExistingSession();

    // Render initial UI
    this.render();

    // Register event listeners
    this.registerEventListeners();

    console.log('[AuthModule] Mounted successfully');
  }

  /**
   * Unmount the module and clean up
   */
  async unmount() {
    console.log('[AuthModule] Unmounting...');

    // Clean up event listeners
    this.unregisterEventListeners();

    // Clear container
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }

    console.log('[AuthModule] Unmounted successfully');
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

  // ============= AUTHENTICATION LOGIC =============

  /**
   * Check for existing session on mount
   */
  async checkExistingSession() {
    try {
      // Check localStorage for session
      const storedSession = localStorage.getItem('auth_session');
      if (storedSession) {
        const session = JSON.parse(storedSession);

        // Validate session expiry
        if (session.expiresAt > Date.now()) {
          // Validate with backend
          const isValid = await this.validateSession(session.token);
          if (isValid) {
            this.setState({
              isAuthenticated: true,
              user: session.user,
              session: session
            });

            // Update platform user
            platform.setUser(session.user);

            // Emit login event
            platform.emit('auth:session-restored', { user: session.user });
            return;
          }
        }

        // Session expired or invalid
        localStorage.removeItem('auth_session');
      }
    } catch (error) {
      console.error('[AuthModule] Session check failed:', error);
    }
  }

  /**
   * Validate session with backend
   */
  async validateSession(token) {
    try {
      const response = await fetch('/api/auth/validate', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('[AuthModule] Session validation failed:', error);
      return false;
    }
  }

  /**
   * Handle email/password login
   */
  async handleLogin(email, password) {
    this.setState({ loading: true, error: null });

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();

      // Store session
      const session = {
        token: data.token,
        user: data.user,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      };

      localStorage.setItem('auth_session', JSON.stringify(session));

      // Update state
      this.setState({
        isAuthenticated: true,
        user: data.user,
        session: session,
        loading: false
      });

      // Update platform user
      platform.setUser(data.user);

      // Emit login event
      platform.emit('auth:login', { user: data.user });

    } catch (error) {
      console.error('[AuthModule] Login failed:', error);
      this.setState({
        loading: false,
        error: error.message
      });
    }
  }

  /**
   * Handle logout
   */
  async handleLogout() {
    try {
      // Call backend logout
      const token = this.state.session?.token;
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('[AuthModule] Logout error:', error);
    }

    // Clear local session
    localStorage.removeItem('auth_session');

    // Update state
    this.setState({
      isAuthenticated: false,
      user: null,
      session: null
    });

    // Clear platform user
    platform.setUser(null);

    // Emit logout event
    platform.emit('auth:logout', {});

    // Re-render
    this.render();
  }

  /**
   * Handle OAuth login (Google/LinkedIn)
   */
  async handleOAuthLogin(provider) {
    this.setState({ loading: true, error: null });

    try {
      // Redirect to OAuth flow
      window.location.href = `/api/auth/oauth/${provider}`;
    } catch (error) {
      console.error(`[AuthModule] OAuth ${provider} login failed:`, error);
      this.setState({
        loading: false,
        error: error.message
      });
    }
  }

  /**
   * Handle magic link request
   */
  async handleMagicLink(email) {
    this.setState({ loading: true, error: null });

    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error('Failed to send magic link');
      }

      this.setState({
        loading: false,
        magicLinkSent: true
      });

    } catch (error) {
      console.error('[AuthModule] Magic link failed:', error);
      this.setState({
        loading: false,
        error: error.message
      });
    }
  }

  // ============= UI RENDERING =============

  /**
   * Render the authentication UI
   */
  render() {
    if (!this.container) return;

    if (this.state.isAuthenticated) {
      this.renderAuthenticatedView();
    } else {
      this.renderLoginView();
    }
  }

  /**
   * Render login view
   */
  renderLoginView() {
    this.container.innerHTML = `
      <div class="auth-module">
        <h2>Sign In</h2>

        ${this.state.error ? `
          <div class="auth-error">${this.state.error}</div>
        ` : ''}

        <form id="auth-login-form" class="auth-form">
          <input
            type="email"
            id="auth-email"
            placeholder="Email"
            required
            ${this.state.loading ? 'disabled' : ''}
          />

          <input
            type="password"
            id="auth-password"
            placeholder="Password"
            required
            ${this.state.loading ? 'disabled' : ''}
          />

          <button type="submit" ${this.state.loading ? 'disabled' : ''}>
            ${this.state.loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div class="auth-divider">or</div>

        <div class="auth-oauth">
          <button id="auth-google" class="auth-oauth-btn" ${this.state.loading ? 'disabled' : ''}>
            Sign in with Google
          </button>

          <button id="auth-linkedin" class="auth-oauth-btn" ${this.state.loading ? 'disabled' : ''}>
            Sign in with LinkedIn
          </button>
        </div>

        <div class="auth-magic">
          <button id="auth-magic-link" ${this.state.loading ? 'disabled' : ''}>
            Send Magic Link
          </button>
        </div>
      </div>
    `;

    // Attach event listeners
    this.attachLoginListeners();
  }

  /**
   * Render authenticated view
   */
  renderAuthenticatedView() {
    const user = this.state.user;

    this.container.innerHTML = `
      <div class="auth-module authenticated">
        <div class="auth-user">
          <h3>Welcome, ${user.name || user.email}</h3>
          <p>${user.email}</p>
          ${user.company ? `<p>${user.company}</p>` : ''}
        </div>

        <button id="auth-logout" class="auth-logout-btn">
          Sign Out
        </button>
      </div>
    `;

    // Attach logout listener
    const logoutBtn = this.container.querySelector('#auth-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', this.handleLogout);
    }
  }

  /**
   * Attach login form listeners
   */
  attachLoginListeners() {
    // Login form
    const loginForm = this.container.querySelector('#auth-login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = this.container.querySelector('#auth-email').value;
        const password = this.container.querySelector('#auth-password').value;
        await this.handleLogin(email, password);
      });
    }

    // OAuth buttons
    const googleBtn = this.container.querySelector('#auth-google');
    if (googleBtn) {
      googleBtn.addEventListener('click', () => this.handleOAuthLogin('google'));
    }

    const linkedinBtn = this.container.querySelector('#auth-linkedin');
    if (linkedinBtn) {
      linkedinBtn.addEventListener('click', () => this.handleOAuthLogin('linkedin'));
    }

    // Magic link
    const magicBtn = this.container.querySelector('#auth-magic-link');
    if (magicBtn) {
      magicBtn.addEventListener('click', async () => {
        const email = this.container.querySelector('#auth-email').value;
        if (email) {
          await this.handleMagicLink(email);
        } else {
          this.setState({ error: 'Please enter your email first' });
        }
      });
    }
  }

  // ============= EVENT HANDLING =============

  /**
   * Register platform event listeners
   */
  registerEventListeners() {
    // Listen for logout requests from other modules
    this.logoutHandler = () => this.handleLogout();
    platform.on('auth:request-logout', this.logoutHandler);

    // Listen for session refresh requests
    this.refreshHandler = () => this.checkExistingSession();
    platform.on('auth:request-refresh', this.refreshHandler);
  }

  /**
   * Unregister event listeners
   */
  unregisterEventListeners() {
    if (this.logoutHandler) {
      platform.off('auth:request-logout', this.logoutHandler);
    }

    if (this.refreshHandler) {
      platform.off('auth:request-refresh', this.refreshHandler);
    }
  }

  // ============= PUBLIC API =============

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
   * Get session token
   */
  getToken() {
    return this.state.session?.token;
  }

  /**
   * Programmatic login
   */
  async login(email, password) {
    return this.handleLogin(email, password);
  }

  /**
   * Programmatic logout
   */
  async logout() {
    return this.handleLogout();
  }
}

// Export module
export default AuthModule;