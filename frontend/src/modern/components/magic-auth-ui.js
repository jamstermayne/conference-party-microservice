/**
 * Magic Auth UI Component
 * Frictionless authentication interface
 */

class MagicAuthUI extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.authSystem = window.MagicAuthSystem || null;
    this.state = {
      mode: 'initial', // initial, email, sent, verifying, complete
      email: '',
      prefilled: {},
      loading: false,
      error: null
    };
  }
  
  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.checkForPrefill();
    this.checkForMagicLink();
  }
  
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 400px;
          margin: 0 auto;
        }
        
        .auth-container {
          background: white;
          border-radius: 12px;
          padding: 32px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .auth-header {
          text-align: center;
          margin-bottom: 32px;
        }
        
        .auth-title {
          font-size: 24px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0 0 8px 0;
        }
        
        .auth-subtitle {
          font-size: 14px;
          color: #666;
          margin: 0;
        }
        
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .input-group {
          position: relative;
        }
        
        .input-label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: #666;
          margin-bottom: 4px;
        }
        
        .input-field {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          font-size: 16px;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        
        .input-field:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .input-field.prefilled {
          background: #f0f9ff;
          border-color: #3b82f6;
        }
        
        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .btn-primary {
          background: #3b82f6;
          color: white;
        }
        
        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }
        
        .btn-secondary {
          background: white;
          color: #666;
          border: 1px solid #e0e0e0;
        }
        
        .btn-secondary:hover:not(:disabled) {
          background: #f9fafb;
        }
        
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .social-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e0e0e0;
        }
        
        .social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 12px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .social-btn:hover {
          background: #f9fafb;
          border-color: #d0d0d0;
        }
        
        .social-icon {
          width: 20px;
          height: 20px;
        }
        
        .divider {
          text-align: center;
          color: #999;
          font-size: 12px;
          margin: 20px 0;
          position: relative;
        }
        
        .divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: #e0e0e0;
        }
        
        .divider-text {
          background: white;
          padding: 0 12px;
          position: relative;
        }
        
        .success-message {
          background: #10b981;
          color: white;
          padding: 16px;
          border-radius: 8px;
          text-align: center;
          animation: slideIn 0.3s ease-out;
        }
        
        .error-message {
          background: #ef4444;
          color: white;
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
          animation: slideIn 0.3s ease-out;
        }
        
        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #ffffff;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .prefill-badge {
          display: inline-block;
          background: #3b82f6;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          margin-left: 8px;
        }
        
        .quick-profile {
          background: #f0f9ff;
          border: 1px solid #3b82f6;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }
        
        .profile-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        
        .profile-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #3b82f6;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 600;
        }
        
        .profile-info {
          flex: 1;
        }
        
        .profile-name {
          font-weight: 600;
          color: #1a1a1a;
        }
        
        .profile-company {
          font-size: 14px;
          color: #666;
        }
        
        .completion-bar {
          height: 4px;
          background: #e0e0e0;
          border-radius: 2px;
          margin-top: 12px;
          overflow: hidden;
        }
        
        .completion-fill {
          height: 100%;
          background: #3b82f6;
          border-radius: 2px;
          transition: width 0.3s ease-out;
        }
      </style>
      
      <div class="auth-container">
        ${this.renderContent()}
      </div>
    `;
  }
  
  renderContent() {
    switch (this.state.mode) {
      case 'initial':
        return this.renderInitial();
      case 'email':
        return this.renderEmailForm();
      case 'sent':
        return this.renderEmailSent();
      case 'verifying':
        return this.renderVerifying();
      case 'complete':
        return this.renderComplete();
      default:
        return this.renderInitial();
    }
  }
  
  renderInitial() {
    const hasPrefill = Object.keys(this.state.prefilled).length > 0;
    
    return `
      <div class="auth-header">
        <h2 class="auth-title">Welcome to Conference Intelligence</h2>
        <p class="auth-subtitle">Sign in or create your account in seconds</p>
      </div>
      
      ${hasPrefill ? this.renderQuickProfile() : ''}
      
      <div class="auth-form">
        <button class="btn btn-primary" data-action="email">
          <svg class="loading-spinner" style="display: none;" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
          </svg>
          <span>Continue with Email</span>
        </button>
        
        <div class="divider">
          <span class="divider-text">or continue with</span>
        </div>
        
        <div class="social-buttons">
          <button class="social-btn" data-action="google">
            <svg class="social-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Google</span>
          </button>
          
          <button class="social-btn" data-action="linkedin">
            <svg class="social-icon" viewBox="0 0 24 24">
              <path fill="#0077B5" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            <span>LinkedIn</span>
          </button>
          
          <button class="social-btn" data-action="microsoft">
            <svg class="social-icon" viewBox="0 0 24 24">
              <path fill="#F25022" d="M0 0h11.377v11.377H0z"/>
              <path fill="#7FBA00" d="M12.623 0H24v11.377H12.623z"/>
              <path fill="#00B4F0" d="M0 12.623h11.377V24H0z"/>
              <path fill="#FFB900" d="M12.623 12.623H24V24H12.623z"/>
            </svg>
            <span>Microsoft</span>
          </button>
        </div>
        
        ${this.state.error ? `
          <div class="error-message">${this.state.error}</div>
        ` : ''}
      </div>
    `;
  }
  
  renderQuickProfile() {
    const { name, company, email } = this.state.prefilled;
    const initial = name ? name.charAt(0).toUpperCase() : '?';
    
    return `
      <div class="quick-profile">
        <div class="profile-header">
          <div class="profile-avatar">${initial}</div>
          <div class="profile-info">
            <div class="profile-name">${name || 'Your Name'}</div>
            <div class="profile-company">${company || email || 'Your Company'}</div>
          </div>
        </div>
        <div class="completion-bar">
          <div class="completion-fill" style="width: 40%"></div>
        </div>
      </div>
    `;
  }
  
  renderEmailForm() {
    return `
      <div class="auth-header">
        <h2 class="auth-title">Enter your email</h2>
        <p class="auth-subtitle">We'll send you a magic link to sign in</p>
      </div>
      
      <div class="auth-form">
        <div class="input-group">
          <label class="input-label" for="email">
            Email address
            ${this.state.prefilled.email ? '<span class="prefill-badge">Prefilled</span>' : ''}
          </label>
          <input
            type="email"
            id="email"
            class="input-field ${this.state.prefilled.email ? 'prefilled' : ''}"
            placeholder="you@company.com"
            value="${this.state.prefilled.email || this.state.email}"
            ${this.state.loading ? 'disabled' : ''}
          />
        </div>
        
        ${this.state.prefilled.name ? `
          <div class="input-group">
            <label class="input-label" for="name">
              Name
              <span class="prefill-badge">Prefilled</span>
            </label>
            <input
              type="text"
              id="name"
              class="input-field prefilled"
              value="${this.state.prefilled.name}"
              ${this.state.loading ? 'disabled' : ''}
            />
          </div>
        ` : ''}
        
        ${this.state.prefilled.company ? `
          <div class="input-group">
            <label class="input-label" for="company">
              Company
              <span class="prefill-badge">Prefilled</span>
            </label>
            <input
              type="text"
              id="company"
              class="input-field prefilled"
              value="${this.state.prefilled.company}"
              ${this.state.loading ? 'disabled' : ''}
            />
          </div>
        ` : ''}
        
        <button class="btn btn-primary" data-action="send-magic-link" ${this.state.loading ? 'disabled' : ''}>
          ${this.state.loading ? '<div class="loading-spinner"></div>' : ''}
          <span>${this.state.loading ? 'Sending...' : 'Send Magic Link'}</span>
        </button>
        
        <button class="btn btn-secondary" data-action="back">
          Back
        </button>
        
        ${this.state.error ? `
          <div class="error-message">${this.state.error}</div>
        ` : ''}
      </div>
    `;
  }
  
  renderEmailSent() {
    return `
      <div class="auth-header">
        <h2 class="auth-title">Check your email</h2>
        <p class="auth-subtitle">We sent a magic link to ${this.state.email}</p>
      </div>
      
      <div class="success-message">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
        </svg>
        <p style="margin: 16px 0 0 0;">Click the link in your email to sign in</p>
      </div>
      
      <div style="margin-top: 24px; text-align: center;">
        <p style="color: #666; font-size: 14px; margin-bottom: 16px;">
          Didn't receive the email? Check your spam folder or
        </p>
        <button class="btn btn-secondary" data-action="resend">
          Resend Email
        </button>
      </div>
    `;
  }
  
  renderVerifying() {
    return `
      <div class="auth-header">
        <h2 class="auth-title">Verifying...</h2>
        <p class="auth-subtitle">Please wait while we sign you in</p>
      </div>
      
      <div style="display: flex; justify-content: center; padding: 48px 0;">
        <div class="loading-spinner" style="width: 48px; height: 48px; border-color: #3b82f6;"></div>
      </div>
    `;
  }
  
  renderComplete() {
    return `
      <div class="auth-header">
        <h2 class="auth-title">Welcome!</h2>
        <p class="auth-subtitle">You're all set</p>
      </div>
      
      <div class="success-message">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <p style="margin: 16px 0 0 0;">Successfully signed in!</p>
      </div>
      
      <div style="margin-top: 24px;">
        <button class="btn btn-primary" data-action="continue">
          Continue to App
        </button>
      </div>
    `;
  }
  
  setupEventListeners() {
    this.shadowRoot.addEventListener('click', async (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (!action) return;
      
      switch (action) {
        case 'email':
          this.setState({ mode: 'email' });
          break;
          
        case 'google':
          await this.handleSocialLogin('google');
          break;
          
        case 'linkedin':
          await this.handleSocialLogin('linkedin');
          break;
          
        case 'microsoft':
          await this.handleSocialLogin('microsoft');
          break;
          
        case 'send-magic-link':
          await this.handleSendMagicLink();
          break;
          
        case 'back':
          this.setState({ mode: 'initial', error: null });
          break;
          
        case 'resend':
          await this.handleSendMagicLink();
          break;
          
        case 'continue':
          this.handleContinue();
          break;
      }
    });
    
    this.shadowRoot.addEventListener('input', (e) => {
      if (e.target.id === 'email') {
        this.state.email = e.target.value;
      }
    });
    
    this.shadowRoot.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && this.state.mode === 'email') {
        this.handleSendMagicLink();
      }
    });
  }
  
  async checkForPrefill() {
    if (!this.authSystem) return;
    
    try {
      const prefilled = await this.authSystem.quickRegisterFromURL();
      if (Object.values(prefilled).some(v => v)) {
        this.setState({ prefilled });
      }
    } catch (error) {
      console.error('[MagicAuthUI] Prefill error:', error);
    }
  }
  
  async checkForMagicLink() {
    if (!this.authSystem) return;
    
    // Check if returning from magic link
    if (window.location.search.includes('mode=signIn')) {
      this.setState({ mode: 'verifying' });
      
      try {
        const result = await this.authSystem.verifyMagicLink();
        
        if (result.success) {
          this.setState({ mode: 'complete' });
          
          // Emit success event
          this.dispatchEvent(new CustomEvent('auth:success', {
            detail: result,
            bubbles: true
          }));
        } else {
          this.setState({ 
            mode: 'initial', 
            error: result.error || 'Invalid magic link' 
          });
        }
      } catch (error) {
        this.setState({ 
          mode: 'initial', 
          error: 'Verification failed. Please try again.' 
        });
      }
    }
  }
  
  async handleSendMagicLink() {
    const email = this.shadowRoot.querySelector('#email')?.value;
    
    if (!email || !this.authSystem) {
      this.setState({ error: 'Please enter your email' });
      return;
    }
    
    this.setState({ loading: true, error: null });
    
    try {
      const additionalData = {
        name: this.state.prefilled.name,
        company: this.state.prefilled.company,
        referralCode: this.state.prefilled.referralCode
      };
      
      const result = await this.authSystem.sendMagicLink(email, additionalData);
      
      if (result.success) {
        this.setState({ 
          mode: 'sent', 
          email: result.email,
          loading: false 
        });
      } else {
        throw new Error('Failed to send magic link');
      }
    } catch (error) {
      this.setState({ 
        loading: false, 
        error: error.message || 'Failed to send magic link' 
      });
    }
  }
  
  async handleSocialLogin(provider) {
    if (!this.authSystem) return;
    
    this.setState({ loading: true, error: null });
    
    try {
      const profile = await this.authSystem.enhanceProfileFromSocial(provider);
      
      this.setState({ mode: 'complete' });
      
      // Emit success event
      this.dispatchEvent(new CustomEvent('auth:success', {
        detail: { profile, provider },
        bubbles: true
      }));
    } catch (error) {
      this.setState({ 
        loading: false, 
        error: `${provider} sign in failed. Please try again.` 
      });
    }
  }
  
  handleContinue() {
    // Redirect to main app or emit event
    this.dispatchEvent(new CustomEvent('auth:continue', {
      bubbles: true
    }));
    
    // If no handler, redirect to home
    if (!this.hasAttribute('no-redirect')) {
      window.location.href = '/';
    }
  }
  
  setState(updates) {
    Object.assign(this.state, updates);
    this.render();
  }
}

// Register custom element
customElements.define('magic-auth-ui', MagicAuthUI);

// Export for module usage
export default MagicAuthUI;