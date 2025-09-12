/**
 * Registration Flow Component
 * Beautiful, frictionless registration UI with magic link and social auth
 */

export class RegistrationFlow extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.magicAuth = null;
    this.registrationData = {};
    this.isLoading = false;
    this.completionScore = 0;
  }
  
  async connectedCallback() {
    // Import MagicAuthSystem
    const { MagicAuthSystem } = await import('../auth/magic-auth.js');
    this.magicAuth = new MagicAuthSystem();
    
    // Get registration data from URL
    this.registrationData = await this.quickRegisterFromURL();
    this.completionScore = this.calculateCompletionScore(this.registrationData);
    
    this.render();
    this.attachEventListeners();
  }
  
  async quickRegisterFromURL() {
    const params = new URLSearchParams(window.location.search);
    const email = params.get('register') || params.get('email');
    const name = params.get('name');
    const company = params.get('company');
    const title = params.get('title');
    
    const data = { email, name, company, title };
    
    // Try to enrich from email domain
    if (email && !company) {
      try {
        const { companyIntelligence } = await import('../services/company-intelligence.js');
        const companyInfo = await companyIntelligence.getCompanyFromEmail(email);
        if (companyInfo) {
          data.company = companyInfo.name;
          data.industry = companyInfo.industry;
        }
      } catch (error) {
        console.debug('Company enrichment failed:', error);
      }
    }
    
    return data;
  }
  
  calculateCompletionScore(data) {
    const fields = ['email', 'name', 'company', 'title'];
    const completed = fields.filter(field => data[field]?.trim()).length;
    return completed / fields.length;
  }
  
  async handleGoogleAuth() {
    this.isLoading = true;
    this.updateLoadingState();
    
    try {
      const enhancedProfile = await this.magicAuth.enhanceProfileFromSocial('google');
      
      // Save profile
      localStorage.setItem('userProfile', JSON.stringify(enhancedProfile));
      
      // Show success animation
      await this.showSuccessAnimation();
      
      // Redirect to dashboard or home
      window.location.href = '/#dashboard';
    } catch (error) {
      console.error('Google auth failed:', error);
      this.showError('Google authentication failed. Please try again.');
    } finally {
      this.isLoading = false;
      this.updateLoadingState();
    }
  }
  
  async handleMagicLink() {
    if (!this.registrationData.email) {
      this.showError('Email is required for magic link');
      return;
    }
    
    this.isLoading = true;
    this.updateLoadingState();
    
    try {
      await this.magicAuth.sendMagicLink(this.registrationData.email, {
        ...this.registrationData,
        returnUrl: window.location.origin + '/complete-registration'
      });
      
      this.showMagicLinkSent();
    } catch (error) {
      console.error('Magic link failed:', error);
      this.showError('Failed to send magic link. Please try again.');
    } finally {
      this.isLoading = false;
      this.updateLoadingState();
    }
  }
  
  async handleLinkedInAuth() {
    this.isLoading = true;
    this.updateLoadingState();
    
    try {
      // Open LinkedIn OAuth popup
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.innerWidth - width) / 2;
      const top = window.screenY + (window.innerHeight - height) / 2;
      
      const popup = window.open(
        '/api/linkedin/start',
        'linkedin-auth',
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      // Listen for OAuth completion
      window.addEventListener('message', async (event) => {
        if (event.data.type === 'oauth-success' && event.data.provider === 'linkedin') {
          popup?.close();
          
          // Enhance profile with LinkedIn data
          const enhancedProfile = await this.magicAuth.enhanceProfileFromSocial('linkedin');
          localStorage.setItem('userProfile', JSON.stringify(enhancedProfile));
          
          await this.showSuccessAnimation();
          window.location.href = '/#dashboard';
        }
      });
    } catch (error) {
      console.error('LinkedIn auth failed:', error);
      this.showError('LinkedIn authentication failed. Please try again.');
    } finally {
      this.isLoading = false;
      this.updateLoadingState();
    }
  }
  
  showSuccessAnimation() {
    return new Promise(resolve => {
      const successEl = this.shadowRoot.querySelector('.success-overlay');
      successEl.classList.add('show');
      setTimeout(resolve, 2000);
    });
  }
  
  showMagicLinkSent() {
    const messageEl = this.shadowRoot.querySelector('.magic-link-message');
    messageEl.innerHTML = `
      <div class="success-message">
        <svg class="checkmark" width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" stroke="#10b981" stroke-width="2" fill="none" />
          <path d="M12 20 L18 26 L28 14" stroke="#10b981" stroke-width="3" fill="none" />
        </svg>
        <h3>Magic link sent!</h3>
        <p>Check your email at <strong>${this.registrationData.email}</strong></p>
        <p class="hint">The link will expire in 15 minutes</p>
      </div>
    `;
    messageEl.classList.add('show');
  }
  
  showError(message) {
    const errorEl = this.shadowRoot.querySelector('.error-message');
    errorEl.textContent = message;
    errorEl.classList.add('show');
    setTimeout(() => errorEl.classList.remove('show'), 5000);
  }
  
  updateLoadingState() {
    const buttons = this.shadowRoot.querySelectorAll('button');
    buttons.forEach(btn => {
      btn.disabled = this.isLoading;
      if (this.isLoading) {
        btn.classList.add('loading');
      } else {
        btn.classList.remove('loading');
      }
    });
  }
  
  attachEventListeners() {
    this.shadowRoot.querySelector('#google-auth')?.addEventListener('click', 
      () => this.handleGoogleAuth());
    
    this.shadowRoot.querySelector('#magic-link')?.addEventListener('click', 
      () => this.handleMagicLink());
    
    this.shadowRoot.querySelector('#linkedin-auth')?.addEventListener('click',
      () => this.handleLinkedInAuth());
  }
  
  render() {
    const scorePercent = Math.round(this.completionScore * 100);
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        
        * {
          box-sizing: border-box;
        }
        
        .container {
          max-width: 450px;
          margin: 0 auto;
          padding-top: 3rem;
        }
        
        /* Progress Bar */
        .progress-section {
          margin-bottom: 2rem;
        }
        
        .progress-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        
        .sparkle-icon {
          width: 20px;
          height: 20px;
          color: white;
        }
        
        .progress-text {
          color: white;
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 9999px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981 0%, #3b82f6 100%);
          border-radius: 9999px;
          transition: width 0.5s ease;
          width: ${scorePercent}%;
        }
        
        /* Info Card */
        .info-card {
          background: rgba(255, 255, 255, 0.95);
          border: 2px solid #10b981;
          border-radius: 1rem;
          padding: 1rem;
          margin-bottom: 1.5rem;
          animation: slideUp 0.5s ease;
        }
        
        .info-card h3 {
          color: #059669;
          font-size: 0.875rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }
        
        .info-item {
          color: #047857;
          font-size: 0.875rem;
          margin: 0.25rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        /* Main Card */
        .card {
          background: white;
          border-radius: 1.5rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          padding: 2.5rem;
          animation: slideUp 0.3s ease;
        }
        
        .header {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 0.5rem 0;
        }
        
        .subtitle {
          color: #6b7280;
          font-size: 0.95rem;
          margin: 0;
        }
        
        /* Buttons */
        button {
          width: 100%;
          padding: 0.875rem 1rem;
          border-radius: 0.75rem;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          border: none;
          position: relative;
        }
        
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        button.loading::before {
          content: '';
          position: absolute;
          width: 20px;
          height: 20px;
          border: 2px solid currentColor;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        .google-btn {
          background: white;
          border: 2px solid #e5e7eb;
          color: #374151;
          margin-bottom: 1rem;
        }
        
        .google-btn:hover:not(:disabled) {
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }
        
        .linkedin-btn {
          background: #0077b5;
          color: white;
          margin-bottom: 1rem;
        }
        
        .linkedin-btn:hover:not(:disabled) {
          background: #005885;
          box-shadow: 0 4px 12px rgba(0, 119, 181, 0.3);
        }
        
        .magic-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .magic-btn:hover:not(:disabled) {
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
          transform: translateY(-1px);
        }
        
        .recommended {
          background: #dcfce7;
          color: #166534;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-weight: 600;
        }
        
        /* Divider */
        .divider {
          position: relative;
          text-align: center;
          margin: 1.5rem 0;
        }
        
        .divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: #e5e7eb;
        }
        
        .divider span {
          background: white;
          padding: 0 1rem;
          position: relative;
          color: #9ca3af;
          font-size: 0.875rem;
        }
        
        /* Email hint */
        .email-hint {
          text-align: center;
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.5rem;
        }
        
        .email-error {
          color: #ef4444;
        }
        
        /* Trust section */
        .trust {
          margin-top: 1.5rem;
          text-align: center;
        }
        
        .trust-text {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 0.75rem;
        }
        
        .logos {
          display: flex;
          justify-content: center;
          gap: 1rem;
          opacity: 0.6;
        }
        
        .logo-placeholder {
          width: 60px;
          height: 24px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 0.25rem;
        }
        
        /* Messages */
        .error-message,
        .magic-link-message {
          position: fixed;
          top: 2rem;
          right: 2rem;
          background: white;
          border-radius: 0.75rem;
          padding: 1rem 1.5rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          transform: translateX(400px);
          transition: transform 0.3s ease;
          z-index: 1000;
        }
        
        .error-message {
          border-left: 4px solid #ef4444;
          color: #991b1b;
        }
        
        .error-message.show,
        .magic-link-message.show {
          transform: translateX(0);
        }
        
        .success-message {
          text-align: center;
        }
        
        .success-message h3 {
          color: #059669;
          margin: 0.5rem 0;
        }
        
        .success-message p {
          color: #6b7280;
          margin: 0.25rem 0;
          font-size: 0.875rem;
        }
        
        .success-message .hint {
          font-size: 0.75rem;
          opacity: 0.7;
        }
        
        .checkmark {
          animation: checkmark 0.5s ease;
        }
        
        /* Success overlay */
        .success-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(16, 185, 129, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        
        .success-overlay.show {
          opacity: 1;
          pointer-events: all;
        }
        
        .success-content {
          text-align: center;
          color: white;
        }
        
        .success-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 1rem;
          animation: bounce 1s ease;
        }
        
        /* Animations */
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }
        
        @keyframes checkmark {
          from {
            stroke-dasharray: 50;
            stroke-dashoffset: 50;
          }
          to {
            stroke-dasharray: 50;
            stroke-dashoffset: 0;
          }
        }
        
        /* Icons */
        .icon {
          width: 20px;
          height: 20px;
        }
      </style>
      
      <div class="container">
        <!-- Progress indicator -->
        <div class="progress-section">
          <div class="progress-header">
            <svg class="sparkle-icon" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2l2.5 5 5.5 1-4 4 1 5.5L10 14l-5 3.5 1-5.5-4-4 5.5-1L10 2z"/>
            </svg>
            <span class="progress-text">Profile ${scorePercent}% complete</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
        </div>
        
        <!-- Pre-filled information -->
        ${(this.registrationData.name || this.registrationData.company) ? `
          <div class="info-card">
            <h3>✨ We found your information!</h3>
            ${this.registrationData.name ? `
              <div class="info-item">👤 ${this.registrationData.name}</div>
            ` : ''}
            ${this.registrationData.company ? `
              <div class="info-item">🏢 ${this.registrationData.company}</div>
            ` : ''}
            ${this.registrationData.title ? `
              <div class="info-item">💼 ${this.registrationData.title}</div>
            ` : ''}
          </div>
        ` : ''}
        
        <!-- Main registration card -->
        <div class="card">
          <div class="header">
            <h1>Complete Your Registration</h1>
            <p class="subtitle">One click to unlock intelligent networking at Gamescom 2025</p>
          </div>
          
          <!-- Google authentication -->
          <button id="google-auth" class="google-btn">
            <svg class="icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continue with Google</span>
            <span class="recommended">Recommended</span>
          </button>
          
          <!-- LinkedIn authentication -->
          <button id="linkedin-auth" class="linkedin-btn">
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            <span>Continue with LinkedIn</span>
          </button>
          
          <!-- Divider -->
          <div class="divider">
            <span>or</span>
          </div>
          
          <!-- Magic link -->
          <button id="magic-link" class="magic-btn">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="5" width="18" height="14" rx="2"/>
              <polyline points="3,7 12,13 21,7"/>
            </svg>
            <span>Send Magic Link</span>
          </button>
          
          ${this.registrationData.email ? `
            <p class="email-hint">Magic link will be sent to ${this.registrationData.email}</p>
          ` : `
            <p class="email-hint email-error">Email required for magic link</p>
          `}
        </div>
        
        <!-- Trust indicators -->
        <div class="trust">
          <p class="trust-text">Trusted by professionals at</p>
          <div class="logos">
            <div class="logo-placeholder"></div>
            <div class="logo-placeholder"></div>
            <div class="logo-placeholder"></div>
          </div>
        </div>
      </div>
      
      <!-- Error message -->
      <div class="error-message"></div>
      
      <!-- Magic link sent message -->
      <div class="magic-link-message"></div>
      
      <!-- Success overlay -->
      <div class="success-overlay">
        <div class="success-content">
          <svg class="success-icon" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="38" stroke="white" stroke-width="3"/>
            <path d="M20 40 L35 55 L60 25" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <h2>Welcome to Gamescom 2025!</h2>
          <p>Redirecting to your dashboard...</p>
        </div>
      </div>
    `;
  }
}

// Register the component
customElements.define('registration-flow', RegistrationFlow);