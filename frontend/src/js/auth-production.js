// Production Auth: Google (GIS), LinkedIn (OAuth), callbacks, Store.profile
import Store from './store.js';
import Events from './events.js';

let gisClient = null;

async function loadGoogleSDK() {
  if (window.google?.accounts?.id) return;
  await new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true; 
    s.defer = true;
    s.onload = res; 
    s.onerror = rej;
    document.head.appendChild(s);
  });
}

export async function signInWithGoogle() {
  Events.emit('auth:start', { provider: 'google' });
  await loadGoogleSDK();
  if (!gisClient) gisClient = window.google.accounts.id;

  gisClient.initialize({
    client_id: Store.get('config.googleClientId') || '1234567890.apps.googleusercontent.com', // Update with real client ID
    callback: async ({ credential }) => {
      try {
        // For now, decode JWT locally since we don't have the backend endpoint yet
        const base64Url = credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
          '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join(''));
        
        const payload = JSON.parse(jsonPayload);
        const user = {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
          provider: 'google',
          onboarded: Store.get('user.onboarded') || false
        };
        
        Store.set('profile', user);
        Store.set('user', user);
        Events.emit('auth:success', { provider: 'google', profile: user });
        
        // Navigate to events or onboarding based on status
        if (user.onboarded) {
          Events.emit('navigate', '/events');
        } else {
          Events.emit('navigate', '/onboarding');
        }
      } catch (e) {
        console.error('Google auth error:', e);
        Events.emit('auth:error', { provider: 'google', error: e });
        Events.emit('ui:toast', { type: 'error', message: 'Google login failed' });
      }
    },
    auto_select: false, 
    ux_mode: 'popup'
  });

  gisClient.prompt();
}

export function signInWithLinkedIn() {
  Events.emit('auth:start', { provider: 'linkedin' });
  
  // LinkedIn OAuth configuration
  const clientId = Store.get('config.linkedinClientId') || '77chexyx9j5j8p'; // Update with real client ID
  const redirectUri = `${window.location.origin}/auth/linkedin/callback`;
  const state = crypto.randomUUID();
  const scope = 'r_liteprofile r_emailaddress';
  
  Store.set('linkedin_oauth_state', state);
  
  const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(scope)}`;
  
  window.location.href = url;
}

export async function handleLinkedInCallbackIfPresent() {
  if (!/\/auth\/linkedin\/callback/.test(location.pathname)) return;
  
  try {
    const p = new URLSearchParams(location.search);
    const code = p.get('code'); 
    const state = p.get('state');
    
    if (!code || state !== Store.get('linkedin_oauth_state')) {
      throw new Error('Invalid state');
    }

    // For now, mock the user since we don't have the backend endpoint
    const user = {
      id: 'linkedin_' + Date.now(),
      email: 'user@linkedin.com',
      name: 'LinkedIn User',
      picture: '/icons/icon-192.png',
      provider: 'linkedin',
      onboarded: Store.get('user.onboarded') || false
    };
    
    Store.set('profile', user);
    Store.set('user', user);
    Store.remove('linkedin_oauth_state');
    
    Events.emit('auth:success', { provider: 'linkedin', profile: user });
    history.replaceState({}, '', '/');
    
    // Navigate to events or onboarding based on status
    if (user.onboarded) {
      Events.emit('navigate', '/events');
    } else {
      Events.emit('navigate', '/onboarding');
    }
  } catch (e) {
    console.error('LinkedIn auth error:', e);
    Events.emit('auth:error', { provider: 'linkedin', error: e });
    Events.emit('ui:toast', { type: 'error', message: 'LinkedIn login failed' });
    history.replaceState({}, '', '/');
  }
}

// Demo/Development mode sign in
export function signInAsDemo() {
  const demoUser = {
    id: 'demo_' + Date.now(),
    email: 'demo@conference-party.app',
    name: 'Demo User',
    picture: '/icons/icon-192.png',
    provider: 'demo',
    onboarded: false
  };
  
  Store.set('profile', demoUser);
  Store.set('user', demoUser);
  
  Events.emit('auth:success', { provider: 'demo', profile: demoUser });
  Events.emit('navigate', '/onboarding');
}

// Sign out function
export function signOut() {
  Store.reset();
  Events.emit('auth:signout');
  Events.emit('navigate', '/');
}

// Check if user is authenticated
export function isAuthenticated() {
  return Boolean(Store.get('user'));
}

// Get current user
export function getCurrentUser() {
  return Store.get('user');
}

// Initialize auth state
export function initAuth() {
  // Check if user is already logged in
  const user = Store.get('user');
  if (user) {
    Events.emit('auth:restored', { profile: user });
  }
  
  // Handle LinkedIn callback if present
  handleLinkedInCallbackIfPresent();
}

// Wire up event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Initialize auth
  initAuth();
  
  // Wire up auth buttons
  document.getElementById('btn-google')?.addEventListener('click', signInWithGoogle);
  document.getElementById('btn-linkedin')?.addEventListener('click', signInWithLinkedIn);
  document.getElementById('btn-demo')?.addEventListener('click', signInAsDemo);
  document.getElementById('btn-signout')?.addEventListener('click', signOut);
  
  // Listen for auth events
  Events.on('auth:required', () => {
    if (!isAuthenticated()) {
      Events.emit('navigate', '/');
    }
  });
});

// Export for use in other modules
export default {
  signInWithGoogle,
  signInWithLinkedIn,
  signInAsDemo,
  signOut,
  isAuthenticated,
  getCurrentUser,
  initAuth
};