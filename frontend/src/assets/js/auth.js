/**
 * PRODUCTION AUTHENTICATION MODULE
 * Google (GIS dynamic loader), LinkedIn (OAuth redirect), callback handling
 * Store.profile update with real backend integration
 * Based on GPT-5 architecture for Professional Intelligence Platform
 */

import Store from './foundation/store.js';
import Events from './foundation/events.js';

/** =========================
 *  GOOGLE (GIS) AUTH
 *  ========================= */
let gisClient = null;

/**
 * Dynamically load Google Identity Services SDK
 * @returns {Promise<boolean>} Success status
 */
async function loadGoogleSDK() {
  if (window.google && window.google.accounts && window.google.accounts.id) return true;
  
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  
  return true;
}

/**
 * Sign in with Google using GIS One Tap / popup
 * @returns {Promise<object>} User profile from backend
 */
export async function signInWithGoogle() {
  Events.emit('auth:start', { provider: 'google' });
  
  try {
    await loadGoogleSDK();

    return new Promise((resolve, reject) => {
      if (!gisClient) {
        gisClient = window.google.accounts.id;
      }
      
      gisClient.initialize({
        client_id: Store.get('config')?.googleClientId,
        callback: async (response) => {
          try {
            // Send ID token to backend for verification & session creation
            const apiBase = window.location.origin.includes('localhost') 
              ? 'http://localhost:5001/conference-party-app/us-central1'
              : 'https://us-central1-conference-party-app.cloudfunctions.net';
            
            const res = await fetch(`${apiBase}/api/auth/google`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id_token: response.credential })
            });
            
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const user = await res.json();

            // Update Store with authenticated user profile
            Store.set('profile', user);
            Events.emit('auth:success', { provider: 'google', profile: user });
            
            // Track successful authentication
            if (window.gtag) {
              gtag('event', 'login', {
                'method': 'google',
                'user_id': user.id
              });
            }
            
            resolve(user);
          } catch (error) {
            console.error('Google auth backend verification failed:', error);
            Events.emit('auth:error', { provider: 'google', error });
            reject(error);
          }
        },
        auto_select: false,
        ux_mode: 'popup'
      });
      
      // Trigger the One Tap / popup flow
      gisClient.prompt();
    });
    
  } catch (error) {
    console.error('Google SDK loading failed:', error);
    Events.emit('auth:error', { provider: 'google', error });
    throw error;
  }
}

/** =========================
 *  LINKEDIN AUTH (REDIRECT)
 *  ========================= */

/**
 * Initiate LinkedIn OAuth redirect flow
 */
export function signInWithLinkedIn() {
  Events.emit('auth:start', { provider: 'linkedin' });

  const config = Store.get('config');
  const clientId = config?.linkedinClientId;
  
  if (!clientId) {
    const error = new Error('LinkedIn client ID not configured');
    Events.emit('auth:error', { provider: 'linkedin', error });
    throw error;
  }

  const redirectUri = `${window.location.origin}/auth/linkedin/callback`;
  const state = crypto.randomUUID();
  const scope = 'r_liteprofile r_emailaddress';

  // Store OAuth state for security verification
  Store.set('linkedin_oauth_state', state);
  
  const authUrl = 
    `https://www.linkedin.com/oauth/v2/authorization` +
    `?response_type=code&client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${encodeURIComponent(state)}` +
    `&scope=${encodeURIComponent(scope)}`;

  // Track LinkedIn auth initiation
  if (window.gtag) {
    gtag('event', 'login_attempt', {
      'method': 'linkedin'
    });
  }

  window.location.href = authUrl;
}

/** =========================
 *  LINKEDIN CALLBACK HANDLER
 *  ========================= */

/**
 * Handle LinkedIn OAuth callback if present in current URL
 * @returns {Promise<void>}
 */
export async function handleLinkedInCallbackIfPresent() {
  if (!/\/auth\/linkedin\/callback/.test(window.location.pathname)) return;

  try {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');
    
    // Handle OAuth errors
    if (error) {
      throw new Error(`LinkedIn OAuth error: ${error}`);
    }
    
    const storedState = Store.get('linkedin_oauth_state');
    
    if (!code || state !== storedState) {
      throw new Error('Invalid LinkedIn OAuth state - possible CSRF attack');
    }

    // Exchange authorization code for user profile
    const apiBase = window.location.origin.includes('localhost') 
      ? 'http://localhost:5001/conference-party-app/us-central1'
      : 'https://us-central1-conference-party-app.cloudfunctions.net';
    
    const res = await fetch(`${apiBase}/api/auth/linkedin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        redirectUri: `${window.location.origin}/auth/linkedin/callback`
      })
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const user = await res.json();

    // Update Store with authenticated user profile
    Store.set('profile', user);
    
    // Clean up OAuth state
    Store.remove('linkedin_oauth_state');
    
    Events.emit('auth:success', { provider: 'linkedin', profile: user });

    // Track successful authentication with Metrics
    if (window.Metrics) {
      window.Metrics.trackLinkedInConnected();
    }
    
    // Track successful authentication
    if (window.gtag) {
      gtag('event', 'login', {
        'method': 'linkedin',
        'user_id': user.id
      });
    }

    // Clean URL and navigate home
    window.history.replaceState({}, '', '/');
    Events.emit('navigate', '/');
    
    // Trigger router if available
    if (window.router && window.router.navigate) {
      window.router.navigate('/');
    }
    
  } catch (error) {
    console.error('LinkedIn callback failed:', error);
    Events.emit('auth:error', { provider: 'linkedin', error });
    
    // Track failed authentication
    if (window.gtag) {
      gtag('event', 'login_failed', {
        'method': 'linkedin',
        'error': error.message
      });
    }
    
    // Clean URL and show error
    window.history.replaceState({}, '', '/');
    
    // Show error toast if available
    if (window.showToast) {
      window.showToast('LinkedIn authentication failed. Please try again.', 'error');
    }
  }
}

/** =========================
 *  SIGN OUT FUNCTIONALITY
 *  ========================= */

/**
 * Sign out user and clear profile
 */
export function signOut() {
  const currentProfile = Store.get('profile');
  
  // Clear user profile from Store
  Store.remove('profile');
  Store.remove('linkedin_oauth_state');
  
  Events.emit('auth:signout', { profile: currentProfile });
  
  // Track signout
  if (window.gtag && currentProfile) {
    gtag('event', 'logout', {
      'user_id': currentProfile.id
    });
  }
  
  // Navigate to home
  Events.emit('navigate', '/');
  
  if (window.router && window.router.navigate) {
    window.router.navigate('/');
  }
}

/** =========================
 *  AUTHENTICATION STATE
 *  ========================= */

/**
 * Check if user is currently authenticated
 * @returns {boolean} Authentication status
 */
export function isAuthenticated() {
  const profile = Store.get('profile');
  return profile && profile.id;
}

/**
 * Get current user profile
 * @returns {object|null} User profile or null if not authenticated
 */
export function getCurrentUser() {
  return Store.get('profile');
}

/** =========================
 *  UI STATE MANAGEMENT
 *  ========================= */

/**
 * Update authentication UI based on current state
 */
function updateAuthUI() {
  const profile = Store.get('profile');
  const authButtons = document.getElementById('auth-buttons');
  const userProfile = document.getElementById('user-profile');
  
  if (profile && profile.id) {
    // Show user profile, hide auth buttons
    if (authButtons) authButtons.style.display = 'none';
    if (userProfile) {
      userProfile.classList.remove('hidden');
      
      // Update user info
      const avatar = document.getElementById('user-avatar');
      const name = document.getElementById('user-name');
      const email = document.getElementById('user-email');
      
      if (avatar && profile.picture) avatar.src = profile.picture;
      if (name) name.textContent = profile.name || 'User';
      if (email) email.textContent = profile.email || '';
    }
  } else {
    // Show auth buttons, hide user profile
    if (authButtons) authButtons.style.display = 'flex';
    if (userProfile) userProfile.classList.add('hidden');
  }
}

/**
 * Set up configuration from environment or defaults
 */
function initializeConfig() {
  const config = Store.get('config') || {};
  
  // Browser-safe runtime config (no bundler). Pulls from window.__ENV.
  const __env = (typeof window !== 'undefined' && window.__ENV) ? window.__ENV : {};
  
  // Set default config if not already set
  if (!config.googleClientId) {
    config.googleClientId = __env.GOOGLE_CLIENT_ID || '';
  }
  
  if (!config.linkedinClientId) {
    config.linkedinClientId = __env.LINKEDIN_CLIENT_ID || '';
  }
  
  // If IDs are missing, disable the provider buttons gracefully (no console errors).
  function disableAuthButtonsIfUnconfigured() {
    try {
      if (!config.googleClientId) {
        document.querySelectorAll('[data-provider="google"], #btn-google').forEach(b => {
          b.setAttribute('disabled', 'true');
          b.title = 'Google sign-in unavailable';
        });
      }
      if (!config.linkedinClientId) {
        document.querySelectorAll('[data-provider="linkedin"], #btn-linkedin').forEach(b => {
          b.setAttribute('disabled', 'true');
          b.title = 'LinkedIn sign-in unavailable';
        });
      }
    } catch (_) {}
  }
  document.addEventListener('DOMContentLoaded', disableAuthButtonsIfUnconfigured);
  
  Store.set('config', config);
}

/** =========================
 *  BUTTON WIRING & INITIALIZATION
 *  ========================= */

/**
 * Initialize authentication system on DOM ready
 */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize configuration
  initializeConfig();
  
  // Wire up authentication buttons
  const btnGoogle = document.getElementById('btn-google');
  const btnLinkedIn = document.getElementById('btn-linkedin');
  const btnSignOut = document.getElementById('btn-signout');

  if (btnGoogle) {
    btnGoogle.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await signInWithGoogle();
        updateAuthUI(); // Update UI after successful login
      } catch (error) {
        console.error('Google sign in failed:', error);
        if (window.showToast) {
          window.showToast('Google sign in failed. Please try again.', 'error');
        }
      }
    });
  }

  if (btnLinkedIn) {
    btnLinkedIn.addEventListener('click', (e) => {
      e.preventDefault();
      try {
        signInWithLinkedIn();
      } catch (error) {
        console.error('LinkedIn sign in failed:', error);
        if (window.showToast) {
          window.showToast('LinkedIn sign in failed. Please try again.', 'error');
        }
      }
    });
  }
  
  if (btnSignOut) {
    btnSignOut.addEventListener('click', (e) => {
      e.preventDefault();
      signOut();
      updateAuthUI(); // Update UI after signout
    });
  }

  // Set up event listeners for auth state changes
  Events.on('auth:success', ({ profile }) => {
    updateAuthUI();
    if (window.showToast) {
      window.showToast(`Welcome back, ${profile.name}!`, 'success');
    }
  });
  
  Events.on('auth:signout', () => {
    updateAuthUI();
    if (window.showToast) {
      window.showToast('Successfully signed out', 'info');
    }
  });
  
  Events.on('auth:error', ({ provider, error }) => {
    console.error(`${provider} auth error:`, error);
    if (window.showToast) {
      window.showToast(`${provider} authentication failed: ${error.message}`, 'error');
    }
  });

  // Handle LinkedIn OAuth callback
  handleLinkedInCallbackIfPresent();
  
  // Initialize UI state
  updateAuthUI();
});

// Export all authentication functions
// Additional exports for module usage
export {
  loadGoogleSDK,
  initializeConfig
};

// Make available globally for backward compatibility
window.Auth = {
  signInWithGoogle,
  signInWithLinkedIn,
  signOut,
  isAuthenticated,
  getCurrentUser,
  handleLinkedInCallbackIfPresent,
  initializeConfig
};

console.log('✅ Production Auth module loaded');