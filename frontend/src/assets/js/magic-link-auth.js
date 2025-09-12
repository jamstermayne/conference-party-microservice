/**
 * Magic Link Authentication System
 * Seamless, passwordless authentication inspired by Slack/Medium
 */

class MagicLinkAuth {
  constructor() {
    this.isAuthenticated = localStorage.getItem('auth_token') !== null;
    this.userEmail = localStorage.getItem('user_email') || null;
    this.pendingAction = null;
    this.mockDelay = 2000; // Simulate network delay
    
    this.init();
  }

  init() {
    this.injectStyles();
    this.setupEventListeners();
    this.checkAuthState();
  }

  checkAuthState() {
    // Check if returning from magic link
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const email = urlParams.get('email');
    
    if (token && email) {
      this.completeMagicLinkAuth(token, email);
    }
  }

  setupEventListeners() {
    // Listen for auth-required events
    document.addEventListener('auth:required', (e) => {
      this.pendingAction = e.detail?.action || null;
      this.show();
    });

    // Listen for logout
    document.addEventListener('auth:logout', () => {
      this.logout();
    });
  }

  show(action = null) {
    if (this.isAuthenticated && !action) {
      // Already authenticated
      this.triggerPendingAction();
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'magic-auth-modal';
    modal.innerHTML = `
      <div class="magic-auth-backdrop" onclick="window.magicAuth.close()"></div>
      <div class="magic-auth-content">
        <button class="magic-auth-close" onclick="window.magicAuth.close()">×</button>
        
        <div class="magic-auth-header">
          <div class="magic-auth-icon">
            <div class="magic-auth-icon-inner">✨</div>
          </div>
          <h2 class="magic-auth-title">Sign in to MAU</h2>
          <p class="magic-auth-subtitle">No password needed. We'll email you a magic link.</p>
        </div>

        <form class="magic-auth-form" onsubmit="window.magicAuth.handleSubmit(event)">
          <div class="magic-auth-input-group">
            <input 
              type="email" 
              id="magic-auth-email"
              class="magic-auth-input" 
              placeholder="name@company.com"
              required
              autocomplete="email"
              value="${this.userEmail || ''}"
            >
            <label for="magic-auth-email" class="magic-auth-label">Work Email</label>
          </div>

          <button type="submit" class="magic-auth-submit">
            <span class="magic-auth-submit-text">Send Magic Link</span>
            <span class="magic-auth-submit-icon">→</span>
          </button>

          <div class="magic-auth-divider">
            <span>or continue with</span>
          </div>

          <div class="magic-auth-social">
            <button type="button" class="magic-auth-social-btn" onclick="window.magicAuth.socialAuth('google')">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Google</span>
            </button>
            <button type="button" class="magic-auth-social-btn" onclick="window.magicAuth.socialAuth('linkedin')">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="#0077B5" d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
              </svg>
              <span>LinkedIn</span>
            </button>
          </div>

          <p class="magic-auth-terms">
            By signing in, you agree to our 
            <a href="#" onclick="event.preventDefault()">Terms</a> and 
            <a href="#" onclick="event.preventDefault()">Privacy Policy</a>
          </p>
        </form>

        <!-- Success State -->
        <div class="magic-auth-success" style="display: none;">
          <div class="magic-auth-success-icon">📧</div>
          <h3>Check your email!</h3>
          <p>We've sent a magic link to <strong class="magic-auth-email-display"></strong></p>
          <p class="magic-auth-success-hint">Click the link in the email to sign in instantly.</p>
          
          <button class="magic-auth-resend" onclick="window.magicAuth.resendEmail()">
            Resend email
          </button>
          
          <div class="magic-auth-mock-hint">
            <p>🎭 Demo Mode: Click below to simulate email arrival</p>
            <button class="magic-auth-mock-btn" onclick="window.magicAuth.simulateEmailClick()">
              Simulate Magic Link Click
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div class="magic-auth-loading" style="display: none;">
          <div class="magic-auth-spinner"></div>
          <p>Sending magic link...</p>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    
    // Animate in
    requestAnimationFrame(() => {
      modal.classList.add('active');
      const input = modal.querySelector('#magic-auth-email');
      if (input && !this.userEmail) {
        input.focus();
      }
    });

    // Haptic feedback
    if (window.haptic) {
      window.haptic.impact('light');
    }
  }

  async handleSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const email = form.querySelector('#magic-auth-email').value;
    
    if (!this.validateEmail(email)) {
      this.showError('Please enter a valid email address');
      return;
    }

    // Show loading state
    const modal = document.querySelector('.magic-auth-modal');
    const formDiv = modal.querySelector('.magic-auth-form');
    const successDiv = modal.querySelector('.magic-auth-success');
    const loadingDiv = modal.querySelector('.magic-auth-loading');
    
    formDiv.style.display = 'none';
    loadingDiv.style.display = 'flex';

    // Haptic feedback
    if (window.haptic) {
      window.haptic.impact('medium');
    }

    // Simulate API call
    await this.sleep(this.mockDelay);

    // Show success state
    loadingDiv.style.display = 'none';
    successDiv.style.display = 'block';
    modal.querySelector('.magic-auth-email-display').textContent = email;
    
    // Store email for later
    this.pendingEmail = email;
    
    // Show toast
    this.showToast('Magic link sent! Check your email.');
    
    // Haptic success
    if (window.haptic) {
      window.haptic.notification('success');
    }
  }

  async simulateEmailClick() {
    // Generate mock token
    const token = this.generateMockToken();
    const email = this.pendingEmail;
    
    // Show loading
    const modal = document.querySelector('.magic-auth-modal');
    const successDiv = modal.querySelector('.magic-auth-success');
    const loadingDiv = modal.querySelector('.magic-auth-loading');
    
    successDiv.style.display = 'none';
    loadingDiv.style.display = 'flex';
    loadingDiv.querySelector('p').textContent = 'Signing you in...';
    
    await this.sleep(1000);
    
    // Complete authentication
    this.completeMagicLinkAuth(token, email);
  }

  completeMagicLinkAuth(token, email) {
    // Store auth data
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_email', email);
    localStorage.setItem('auth_timestamp', Date.now().toString());
    
    this.isAuthenticated = true;
    this.userEmail = email;
    
    // Close modal
    this.close();
    
    // Show success
    this.showAuthSuccess(email);
    
    // Trigger pending action
    this.triggerPendingAction();
    
    // Update UI
    this.updateAuthUI();
    
    // Clear URL params
    if (window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  showAuthSuccess(email) {
    const successModal = document.createElement('div');
    successModal.className = 'magic-auth-welcome';
    successModal.innerHTML = `
      <div class="magic-auth-welcome-content">
        <div class="magic-auth-welcome-icon">🎉</div>
        <h2>Welcome to MAU!</h2>
        <p>You're signed in as <strong>${email}</strong></p>
        <button class="magic-auth-welcome-btn" onclick="this.parentElement.parentElement.remove()">
          Start Exploring
        </button>
      </div>
    `;
    
    document.body.appendChild(successModal);
    
    // Animate in
    requestAnimationFrame(() => {
      successModal.classList.add('active');
    });
    
    // Auto close after 3 seconds
    setTimeout(() => {
      successModal.classList.remove('active');
      setTimeout(() => successModal.remove(), 300);
    }, 3000);
    
    // Haptic celebration
    if (window.haptic) {
      window.haptic.notification('success');
    }
  }

  async socialAuth(provider) {
    const modal = document.querySelector('.magic-auth-modal');
    const formDiv = modal.querySelector('.magic-auth-form');
    const loadingDiv = modal.querySelector('.magic-auth-loading');
    
    formDiv.style.display = 'none';
    loadingDiv.style.display = 'flex';
    loadingDiv.querySelector('p').textContent = `Connecting to ${provider}...`;
    
    // Haptic feedback
    if (window.haptic) {
      window.haptic.impact('medium');
    }
    
    // Simulate OAuth flow
    await this.sleep(1500);
    
    // Generate mock email based on provider
    const mockEmail = provider === 'google' 
      ? 'user@gmail.com' 
      : 'professional@linkedin.com';
    
    const token = this.generateMockToken();
    this.completeMagicLinkAuth(token, mockEmail);
  }

  triggerPendingAction() {
    if (this.pendingAction) {
      document.dispatchEvent(new CustomEvent('auth:completed', {
        detail: { action: this.pendingAction }
      }));
      this.pendingAction = null;
    }
  }

  updateAuthUI() {
    // Update profile nav item
    const profileNav = document.querySelector('.nav-item[data-section="profile"] .nav-item-icon');
    if (profileNav && this.isAuthenticated) {
      profileNav.innerHTML = '✓';
      profileNav.style.background = 'linear-gradient(135deg, #34c759 0%, #30d158 100%)';
      profileNav.style.borderRadius = '50%';
      profileNav.style.width = '24px';
      profileNav.style.height = '24px';
      profileNav.style.display = 'flex';
      profileNav.style.alignItems = 'center';
      profileNav.style.justifyContent = 'center';
      profileNav.style.color = 'white';
    }
  }

  async resendEmail() {
    const resendBtn = document.querySelector('.magic-auth-resend');
    resendBtn.disabled = true;
    resendBtn.textContent = 'Sending...';
    
    await this.sleep(1000);
    
    resendBtn.textContent = 'Email sent!';
    setTimeout(() => {
      resendBtn.disabled = false;
      resendBtn.textContent = 'Resend email';
    }, 3000);
    
    this.showToast('Magic link resent!');
  }

  close() {
    const modal = document.querySelector('.magic-auth-modal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    }
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('auth_timestamp');
    
    this.isAuthenticated = false;
    this.userEmail = null;
    
    this.showToast('Signed out successfully');
    
    // Reset UI
    location.reload();
  }

  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  generateMockToken() {
    return 'mau_' + Math.random().toString(36).substr(2) + Date.now().toString(36);
  }

  showError(message) {
    const input = document.querySelector('#magic-auth-email');
    if (input) {
      input.classList.add('error');
      setTimeout(() => input.classList.remove('error'), 3000);
    }
    this.showToast(message, 'error');
  }

  showToast(message, type = 'success') {
    const existing = document.querySelector('.magic-auth-toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = `magic-auth-toast magic-auth-toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
      toast.classList.add('active');
    });
    
    setTimeout(() => {
      toast.classList.remove('active');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Magic Auth Modal */
      .magic-auth-modal {
        position: fixed;
        inset: 0;
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        opacity: 0;
        visibility: hidden;
        transition: all 300ms ease;
      }
      
      .magic-auth-modal.active {
        opacity: 1;
        visibility: visible;
      }
      
      .magic-auth-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        cursor: pointer;
      }
      
      .magic-auth-content {
        position: relative;
        background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        padding: 40px;
        max-width: 420px;
        width: 100%;
        transform: scale(0.9);
        transition: transform 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }
      
      .magic-auth-modal.active .magic-auth-content {
        transform: scale(1);
      }
      
      .magic-auth-close {
        position: absolute;
        top: 20px;
        right: 20px;
        width: 32px;
        height: 32px;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: 50%;
        color: rgba(255, 255, 255, 0.6);
        font-size: 20px;
        cursor: pointer;
        transition: all 200ms ease;
      }
      
      .magic-auth-close:hover {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        transform: rotate(90deg);
      }
      
      .magic-auth-header {
        text-align: center;
        margin-bottom: 32px;
      }
      
      .magic-auth-icon {
        width: 80px;
        height: 80px;
        margin: 0 auto 20px;
        background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 10px 30px rgba(0, 122, 255, 0.3);
      }
      
      .magic-auth-icon-inner {
        font-size: 40px;
        animation: sparkle 2s infinite;
      }
      
      @keyframes sparkle {
        0%, 100% { transform: scale(1) rotate(0deg); }
        50% { transform: scale(1.1) rotate(10deg); }
      }
      
      .magic-auth-title {
        font-size: 28px;
        font-weight: 700;
        color: white;
        margin-bottom: 8px;
      }
      
      .magic-auth-subtitle {
        color: rgba(255, 255, 255, 0.6);
        font-size: 16px;
        line-height: 1.5;
      }
      
      .magic-auth-form {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      
      .magic-auth-input-group {
        position: relative;
      }
      
      .magic-auth-input {
        width: 100%;
        padding: 16px;
        background: rgba(255, 255, 255, 0.05);
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: white;
        font-size: 16px;
        transition: all 200ms ease;
      }
      
      .magic-auth-input:focus {
        outline: none;
        border-color: #007aff;
        background: rgba(255, 255, 255, 0.08);
        box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1);
      }
      
      .magic-auth-input.error {
        border-color: #ff3b30;
        animation: shake 300ms ease;
      }
      
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }
      
      .magic-auth-label {
        position: absolute;
        top: -10px;
        left: 12px;
        background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%);
        padding: 0 8px;
        color: rgba(255, 255, 255, 0.6);
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      .magic-auth-submit {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 16px;
        background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
        border: none;
        border-radius: 12px;
        color: white;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 200ms ease;
        position: relative;
        overflow: hidden;
      }
      
      .magic-auth-submit::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%);
        transform: translateX(-100%);
        transition: transform 600ms ease;
      }
      
      .magic-auth-submit:hover::before {
        transform: translateX(100%);
      }
      
      .magic-auth-submit:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 30px rgba(0, 122, 255, 0.3);
      }
      
      .magic-auth-divider {
        text-align: center;
        color: rgba(255, 255, 255, 0.4);
        font-size: 14px;
        margin: 8px 0;
      }
      
      .magic-auth-social {
        display: flex;
        gap: 12px;
      }
      
      .magic-auth-social-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: white;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 200ms ease;
      }
      
      .magic-auth-social-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: translateY(-2px);
      }
      
      .magic-auth-terms {
        text-align: center;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.4);
        line-height: 1.5;
      }
      
      .magic-auth-terms a {
        color: #007aff;
        text-decoration: none;
      }
      
      .magic-auth-terms a:hover {
        text-decoration: underline;
      }
      
      /* Success State */
      .magic-auth-success {
        text-align: center;
        padding: 20px;
        animation: fadeIn 300ms ease;
      }
      
      .magic-auth-success-icon {
        font-size: 64px;
        margin-bottom: 20px;
      }
      
      .magic-auth-success h3 {
        font-size: 24px;
        color: white;
        margin-bottom: 12px;
      }
      
      .magic-auth-success p {
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 8px;
      }
      
      .magic-auth-success strong {
        color: white;
      }
      
      .magic-auth-resend {
        margin-top: 20px;
        padding: 12px 24px;
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        color: white;
        font-size: 14px;
        cursor: pointer;
        transition: all 200ms ease;
      }
      
      .magic-auth-resend:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.1);
      }
      
      .magic-auth-resend:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .magic-auth-mock-hint {
        margin-top: 32px;
        padding-top: 32px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .magic-auth-mock-hint p {
        font-size: 12px;
        color: rgba(255, 149, 0, 0.8);
        margin-bottom: 12px;
      }
      
      .magic-auth-mock-btn {
        padding: 12px 24px;
        background: linear-gradient(135deg, #ff9500 0%, #ff6200 100%);
        border: none;
        border-radius: 12px;
        color: white;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 200ms ease;
      }
      
      .magic-auth-mock-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(255, 149, 0, 0.3);
      }
      
      /* Loading State */
      .magic-auth-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        gap: 20px;
      }
      
      .magic-auth-spinner {
        width: 48px;
        height: 48px;
        border: 3px solid rgba(255, 255, 255, 0.1);
        border-top-color: #007aff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      /* Welcome Modal */
      .magic-auth-welcome {
        position: fixed;
        inset: 0;
        z-index: 2001;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        opacity: 0;
        visibility: hidden;
        transition: all 300ms ease;
      }
      
      .magic-auth-welcome.active {
        opacity: 1;
        visibility: visible;
      }
      
      .magic-auth-welcome-content {
        background: linear-gradient(135deg, #34c759 0%, #30d158 100%);
        border-radius: 24px;
        padding: 40px;
        text-align: center;
        color: white;
        transform: scale(0.9);
        transition: transform 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }
      
      .magic-auth-welcome.active .magic-auth-welcome-content {
        transform: scale(1);
      }
      
      .magic-auth-welcome-icon {
        font-size: 64px;
        margin-bottom: 20px;
      }
      
      .magic-auth-welcome h2 {
        font-size: 32px;
        margin-bottom: 12px;
      }
      
      .magic-auth-welcome p {
        font-size: 18px;
        margin-bottom: 24px;
        opacity: 0.95;
      }
      
      .magic-auth-welcome-btn {
        padding: 14px 32px;
        background: white;
        border: none;
        border-radius: 12px;
        color: #34c759;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 200ms ease;
      }
      
      .magic-auth-welcome-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      }
      
      /* Toast */
      .magic-auth-toast {
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        padding: 14px 24px;
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: white;
        font-size: 14px;
        font-weight: 500;
        z-index: 2002;
        transition: transform 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }
      
      .magic-auth-toast.active {
        transform: translateX(-50%) translateY(0);
      }
      
      .magic-auth-toast-error {
        background: rgba(255, 59, 48, 0.9);
        border-color: rgba(255, 59, 48, 0.3);
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      /* Mobile optimizations */
      @media (max-width: 480px) {
        .magic-auth-content {
          padding: 24px;
        }
        
        .magic-auth-title {
          font-size: 24px;
        }
        
        .magic-auth-social {
          flex-direction: column;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Initialize and expose globally
const magicAuth = new MagicLinkAuth();
window.magicAuth = magicAuth;

// Export for module usage
export default magicAuth;