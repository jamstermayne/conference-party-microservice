import { errorHandler } from './error-handler.js';

// Error state UI components
export function createErrorState(type, context = {}) {
  const container = document.createElement('div');
  container.className = 'error-state';
  
  switch (type) {
    case 'loading':
      container.innerHTML = createLoadingState();
      break;
    case 'network-error':
      container.innerHTML = createNetworkErrorState(context);
      break;
    case 'empty-state':
      container.innerHTML = createEmptyState(context);
      break;
    case 'auth-required':
      container.innerHTML = createAuthRequiredState(context);
      break;
    case 'maintenance':
      container.innerHTML = createMaintenanceState(context);
      break;
    case 'rate-limit':
      container.innerHTML = createRateLimitState(context);
      break;
    case 'expired-session':
      container.innerHTML = createExpiredSessionState(context);
      break;
    case 'no-events':
      container.innerHTML = createNoEventsState(context);
      break;
    case 'location-disabled':
      container.innerHTML = createLocationDisabledState(context);
      break;
    default:
      container.innerHTML = createGenericErrorState(context);
  }
  
  setupErrorStateHandlers(container, type, context);
  return container;
}

function createLoadingState() {
  return `
    <div class="error-content">
      <div class="error-icon">
        <div class="spinner"></div>
      </div>
      <div class="error-title">Loading...</div>
      <div class="error-message">Fetching the latest data</div>
    </div>
  `;
}

function createNetworkErrorState(context) {
  return `
    <div class="error-content">
      <div class="error-icon">📡</div>
      <div class="error-title">Connection Error</div>
      <div class="error-message">
        ${context.message || 'Unable to connect to our servers. Please check your internet connection.'}
      </div>
      <div class="error-actions">
        <button class="btn btn-primary" data-action="retry">Try Again</button>
        <button class="btn btn-ghost" data-action="offline">Use Offline Mode</button>
      </div>
    </div>
  `;
}

function createEmptyState(context) {
  const { 
    title = 'No Data Available',
    message = 'There\'s nothing to show right now.',
    actionText = 'Refresh',
    icon = '📭'
  } = context;
  
  return `
    <div class="error-content">
      <div class="error-icon">${icon}</div>
      <div class="error-title">${title}</div>
      <div class="error-message">${message}</div>
      ${actionText ? `
        <div class="error-actions">
          <button class="btn btn-primary" data-action="refresh">${actionText}</button>
        </div>
      ` : ''}
    </div>
  `;
}

function createAuthRequiredState(context) {
  return `
    <div class="error-content">
      <div class="error-icon">🔐</div>
      <div class="error-title">Sign In Required</div>
      <div class="error-message">
        ${context.message || 'Sign in to unlock full features, sync your data, and connect with other professionals.'}
      </div>
      <div class="error-actions">
        <button class="btn btn-google" data-action="signin-google">
          <svg width="18" height="18" viewBox="0 0 24 24" style="margin-right: 8px;">
            <path fill="var(--alias-4285f4)" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="var(--alias-34a853)" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="var(--alias-fbbc05)" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="var(--alias-ea4335)" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
        <button class="btn btn-linkedin" data-action="signin-linkedin">
          <svg width="18" height="18" viewBox="0 0 24 24" style="margin-right: 8px;">
            <path fill="var(--alias-0077b5)" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          Continue with LinkedIn
        </button>
        <button class="btn btn-ghost" data-action="guest">Continue as Guest</button>
      </div>
      <div class="auth-benefits">
        <div class="benefit-item">✓ Sync data across devices</div>
        <div class="benefit-item">✓ Professional networking</div>
        <div class="benefit-item">✓ Event recommendations</div>
      </div>
    </div>
  `;
}

function createMaintenanceState(context) {
  return `
    <div class="error-content">
      <div class="error-icon">🛠️</div>
      <div class="error-title">Maintenance Mode</div>
      <div class="error-message">
        We're performing scheduled maintenance. Please check back in a few minutes.
      </div>
      <div class="error-actions">
        <button class="btn btn-primary" data-action="retry">Check Again</button>
        <button class="btn btn-ghost" data-action="offline">Work Offline</button>
      </div>
    </div>
  `;
}

function createRateLimitState(context) {
  return `
    <div class="error-content">
      <div class="error-icon">⏳</div>
      <div class="error-title">Too Many Requests</div>
      <div class="error-message">
        You're making requests too quickly. Please wait a moment before trying again.
      </div>
      <div class="error-actions">
        <button class="btn btn-primary" data-action="retry">Try Again</button>
        <button class="btn btn-ghost" data-action="offline">Work Offline</button>
      </div>
    </div>
  `;
}

function createExpiredSessionState(context) {
  return `
    <div class="error-content">
      <div class="error-icon">🔑</div>
      <div class="error-title">Session Expired</div>
      <div class="error-message">
        Your session has expired. Please sign in again to continue.
      </div>
      <div class="error-actions">
        <button class="btn btn-primary" data-action="signin-google">Sign In</button>
        <button class="btn btn-ghost" data-action="guest">Continue as Guest</button>
      </div>
    </div>
  `;
}

function createNoEventsState(context) {
  return `
    <div class="error-content">
      <div class="error-icon">📅</div>
      <div class="error-title">No Events Found</div>
      <div class="error-message">
        There are no events matching your criteria right now. Check back later or adjust your filters.
      </div>
      <div class="error-actions">
        <button class="btn btn-primary" data-action="refresh">Refresh</button>
        <button class="btn btn-ghost" data-action="clear-filters">Clear Filters</button>
      </div>
    </div>
  `;
}

function createLocationDisabledState(context) {
  return `
    <div class="error-content">
      <div class="error-icon">📍</div>
      <div class="error-title">Location Access Denied</div>
      <div class="error-message">
        Location access is required to find nearby events and connect with people around you.
      </div>
      <div class="error-actions">
        <button class="btn btn-primary" data-action="enable-location">Enable Location</button>
        <button class="btn btn-ghost" data-action="skip-location">Continue Without Location</button>
      </div>
    </div>
  `;
}

function createGenericErrorState(context) {
  return `
    <div class="error-content">
      <div class="error-icon">⚠️</div>
      <div class="error-title">Something went wrong</div>
      <div class="error-message">
        ${context.message || 'An unexpected error occurred. Please try again.'}
      </div>
      <div class="error-actions">
        <button class="btn btn-primary" data-action="retry">Try Again</button>
        <button class="btn btn-ghost" data-action="reload">Reload App</button>
      </div>
    </div>
  `;
}

function setupErrorStateHandlers(container, type, context) {
  container.addEventListener('click', async (e) => {
    const action = e.target.dataset.action;
    if (!action) return;
    
    e.preventDefault();
    
    switch (action) {
      case 'retry':
        if (context.retryFn) {
          showLoadingInContainer(container);
          try {
            await context.retryFn();
          } catch (error) {
            console.error('Retry failed:', error);
          }
        } else {
          location.reload();
        }
        break;
        
      case 'refresh':
        if (context.refreshFn) {
          showLoadingInContainer(container);
          await context.refreshFn();
        } else {
          location.reload();
        }
        break;
        
      case 'offline':
        // Switch to offline mode
        if (context.offlineFn) {
          await context.offlineFn();
        } else {
          // Default offline behavior
          const event = new CustomEvent('offline-mode-requested');
          window.dispatchEvent(event);
        }
        break;
        
      case 'signin-google':
        // Trigger Google sign-in
        const { API } = await import('./api.js');
        try {
          await API.login('google');
        } catch (error) {
          console.error('Google sign-in failed:', error);
        }
        break;
      
      case 'signin-linkedin':
        // Trigger LinkedIn sign-in
        const { API: LinkedInAPI } = await import('./api.js');
        try {
          await LinkedInAPI.login('linkedin');
        } catch (error) {
          console.error('LinkedIn sign-in failed:', error);
        }
        break;
        
      case 'guest':
        // Continue without authentication
        if (context.guestFn) {
          await context.guestFn();
        } else {
          container.remove();
        }
        break;
        
      case 'reload':
        location.reload();
        break;
        
      case 'clear-filters':
        // Clear any active filters
        if (context.clearFiltersFn) {
          await context.clearFiltersFn();
        } else {
          // Default behavior - could emit an event or call a global function
          const event = new CustomEvent('clear-filters-requested');
          window.dispatchEvent(event);
        }
        break;
        
      case 'enable-location':
        // Request location permission
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log('Location enabled:', position);
              if (context.locationEnabledFn) {
                context.locationEnabledFn(position);
              } else {
                location.reload();
              }
            },
            (error) => {
              console.error('Location permission denied:', error);
              // Show location disabled state again or alternative
            }
          );
        }
        break;
        
      case 'skip-location':
        // Continue without location
        if (context.skipLocationFn) {
          await context.skipLocationFn();
        } else {
          container.remove();
        }
        break;
    }
  });
}

function showLoadingInContainer(container) {
  container.innerHTML = createLoadingState();
}

// Retry button component for inline errors
export function createRetryButton(retryFn, text = 'Try Again') {
  const button = document.createElement('button');
  button.className = 'btn btn-small btn-ghost retry-btn';
  button.textContent = text;
  
  button.addEventListener('click', async (e) => {
    e.preventDefault();
    button.disabled = true;
    button.textContent = 'Retrying...';
    
    try {
      await retryFn();
    } catch (error) {
      button.textContent = 'Failed - Try Again';
      console.error('Retry failed:', error);
    } finally {
      button.disabled = false;
      if (button.textContent === 'Retrying...') {
        button.textContent = text;
      }
    }
  });
  
  return button;
}

// Network status indicator
export function createNetworkStatus() {
  const indicator = document.createElement('div');
  indicator.className = 'network-status';
  indicator.innerHTML = `
    <div class="network-indicator ${navigator.onLine ? 'online' : 'offline'}">
      <span class="network-icon">${navigator.onLine ? '🟢' : '🔴'}</span>
      <span class="network-text">${navigator.onLine ? 'Online' : 'Offline'}</span>
    </div>
  `;
  
  // Update on network changes
  window.addEventListener('online', () => {
    indicator.querySelector('.network-indicator').className = 'network-indicator online';
    indicator.querySelector('.network-icon').textContent = '🟢';
    indicator.querySelector('.network-text').textContent = 'Online';
  });
  
  window.addEventListener('offline', () => {
    indicator.querySelector('.network-indicator').className = 'network-indicator offline';
    indicator.querySelector('.network-icon').textContent = '🔴';
    indicator.querySelector('.network-text').textContent = 'Offline';
  });
  
  return indicator;
}

// Toast with retry functionality
export function createErrorToast(message, retryFn) {
  const toast = document.createElement('div');
  toast.className = 'toast error-toast';
  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-message">${message}</span>
      ${retryFn ? '<button class="toast-retry">Retry</button>' : ''}
    </div>
  `;
  
  if (retryFn) {
    toast.querySelector('.toast-retry').addEventListener('click', async () => {
      toast.remove();
      try {
        await retryFn();
      } catch (error) {
        console.error('Toast retry failed:', error);
      }
    });
  }
  
  // Auto-remove after 5 seconds
  setTimeout(() => toast.remove(), 5000);
  
  return toast;
}

// Error boundary for catching component errors
export class ErrorBoundary {
  constructor(container, fallbackFn) {
    this.container = container;
    this.fallbackFn = fallbackFn;
    this.originalContent = container.innerHTML;
    
    // Set up error catching
    this.setupErrorCatching();
  }
  
  setupErrorCatching() {
    // Wrap container operations
    const originalAppendChild = this.container.appendChild.bind(this.container);
    this.container.appendChild = (child) => {
      try {
        return originalAppendChild(child);
      } catch (error) {
        this.handleError(error);
        return null;
      }
    };
  }
  
  handleError(error) {
    console.error('ErrorBoundary caught error:', error);
    
    if (this.fallbackFn) {
      try {
        const fallback = this.fallbackFn(error);
        this.container.innerHTML = '';
        this.container.appendChild(fallback);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        this.showGenericError(error);
      }
    } else {
      this.showGenericError(error);
    }
  }
  
  showGenericError(error) {
    const errorState = createErrorState('generic', {
      message: 'This section failed to load properly.',
      retryFn: () => {
        this.container.innerHTML = this.originalContent;
      }
    });
    
    this.container.innerHTML = '';
    this.container.appendChild(errorState);
  }
  
  reset() {
    this.container.innerHTML = this.originalContent;
  }
}

// CSS for error states (inject into head)
const errorStyles = `
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 2rem;
  text-align: center;
}

.error-content {
  max-width: 400px;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text);
}

.error-message {
  color: var(--muted);
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.error-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid var(--surface);
  border-top: 3px solid var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.network-status {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
  opacity: 0.8;
}

.network-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--surface);
  border-radius: 1rem;
  font-size: 0.875rem;
  transition: all 0.3s ease;
}

.network-indicator.offline {
  background: var(--err);
  color: white;
}

.error-toast {
  background: var(--err) !important;
  color: white !important;
}

.toast-retry {
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.3);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  cursor: pointer;
  margin-left: 0.5rem;
}

.retry-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .error-state {
    min-height: 150px;
    padding: 1rem;
  }
  
  .error-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .error-actions button {
    width: 100%;
  }
}
`;

// Inject styles
if (!document.querySelector('#error-states-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'error-states-styles';
  styleElement.textContent = errorStyles;
  document.head.appendChild(styleElement);
}