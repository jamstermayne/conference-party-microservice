import { Store, Events, EVENTS } from './state.js';
import authManager from './auth.js';

// Auth View Component - Can be used as modal or inline
export function AuthView(options = {}) {
  const {
    mode = 'inline', // 'inline' or 'modal'
    title = 'Sign In to Velocity',
    subtitle = 'Connect with gaming professionals at Gamescom 2025',
    showGuest = true
  } = options;

  const container = document.createElement('div');
  container.className = mode === 'modal' ? 'auth-modal' : 'auth-container';
  
  container.innerHTML = `
    ${mode === 'modal' ? '<div class="auth-modal-overlay"></div>' : ''}
    <div class="auth-content">
      ${mode === 'modal' ? '<button class="auth-close" aria-label="Close">×</button>' : ''}
      
      <div class="auth-header">
        <h2 class="auth-title">${title}</h2>
        <p class="auth-subtitle">${subtitle}</p>
      </div>
      
      <div class="auth-buttons">
        <button id="btn-google" class="btn btn-google">
          <svg class="icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
        
        <button id="btn-linkedin" class="btn btn-linkedin">
          <img src="assets/svg/linkedin.svg" alt="" class="icon" aria-hidden="true">
          Continue with LinkedIn
        </button>
        
        ${showGuest ? `
          <div class="auth-divider">
            <span>or</span>
          </div>
          
          <button id="btn-guest" class="btn btn-ghost">
            Continue as Guest
          </button>
        ` : ''}
      </div>
      
      <div class="auth-benefits">
        <div class="benefit-item">
          <span class="benefit-icon">✓</span>
          <span>Sync across devices</span>
        </div>
        <div class="benefit-item">
          <span class="benefit-icon">✓</span>
          <span>Save your events</span>
        </div>
        <div class="benefit-item">
          <span class="benefit-icon">✓</span>
          <span>Connect with attendees</span>
        </div>
        <div class="benefit-item">
          <span class="benefit-icon">✓</span>
          <span>Get personalized recommendations</span>
        </div>
      </div>
      
      <p class="auth-privacy">
        <small>We respect your privacy. No spam, ever.</small>
      </p>
    </div>
  `;
  
  // Setup event handlers
  setupAuthHandlers(container, mode);
  
  return container;
}

function setupAuthHandlers(container, mode) {
  // Google button
  const googleBtn = container.querySelector('#btn-google');
  if (googleBtn) {
    googleBtn.addEventListener('click', () => {
      authManager.startAuth('google');
    });
  }
  
  // LinkedIn button
  const linkedInBtn = container.querySelector('#btn-linkedin');
  if (linkedInBtn) {
    linkedInBtn.addEventListener('click', () => {
      authManager.startAuth('linkedin');
    });
  }
  
  // Guest button
  const guestBtn = container.querySelector('#btn-guest');
  if (guestBtn) {
    guestBtn.addEventListener('click', () => {
      Store.profile = {
        isGuest: true,
        firstName: 'Guest',
        authenticated: false
      };
      Events.emit(EVENTS.AUTH_SKIPPED);
      
      if (mode === 'modal') {
        container.remove();
      }
    });
  }
  
  // Close button (modal only)
  const closeBtn = container.querySelector('.auth-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      container.remove();
    });
  }
  
  // Overlay click (modal only)
  const overlay = container.querySelector('.auth-modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', () => {
      container.remove();
    });
  }
}

// Helper function to show auth modal
export function showAuthModal(options = {}) {
  const existingModal = document.querySelector('.auth-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  const modal = AuthView({ ...options, mode: 'modal' });
  document.body.appendChild(modal);
  
  // Add animation class after append
  requestAnimationFrame(() => {
    modal.classList.add('auth-modal-show');
  });
  
  return modal;
}

// Add auth modal styles
const authStyles = `
.auth-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.auth-modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
}

.auth-modal .auth-content {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--b);
  border-radius: var(--r);
  padding: 2rem;
  max-width: 420px;
  width: 100%;
  box-shadow: var(--shadow);
  animation: slideUp 0.3s ease;
}

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

.auth-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: var(--muted);
  font-size: 1.5rem;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all var(--fast) ease;
}

.auth-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text);
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: var(--text);
}

.auth-subtitle {
  color: var(--muted);
  margin: 0;
}

.auth-divider {
  text-align: center;
  margin: 1rem 0;
  position: relative;
}

.auth-divider span {
  background: var(--surface);
  padding: 0 1rem;
  color: var(--muted);
  font-size: 0.875rem;
  position: relative;
}

.auth-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--b);
}

.auth-benefits {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--b);
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  color: var(--muted);
  font-size: 0.875rem;
}

.benefit-icon {
  color: var(--ok);
  font-weight: bold;
}

.auth-privacy {
  text-align: center;
  margin-top: 1.5rem;
  color: var(--muted);
}

.auth-container {
  padding: 2rem;
}

.auth-container .auth-content {
  max-width: 420px;
  margin: 0 auto;
}
`;

// Inject styles if not already present
if (!document.querySelector('#auth-view-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'auth-view-styles';
  styleElement.textContent = authStyles;
  document.head.appendChild(styleElement);
}

// Export for global use
export default { AuthView, showAuthModal };