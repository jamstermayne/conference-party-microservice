// Enhanced Production Auth: Google (GIS), LinkedIn (OAuth), callbacks, Store.profile
import { Store, Events } from './state.js';

let gisClient = null;

async function loadGoogleSDK() {
  if (window.google?.accounts?.id) return;
  await new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true; s.defer = true;
    s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

export async function signInWithGoogle() {
  Events.emit('auth:start', { provider: 'google' });
  await loadGoogleSDK();
  if (!gisClient) gisClient = window.google.accounts.id;

  gisClient.initialize({
    client_id: Store.get('config.googleClientId') || '1234567890.apps.googleusercontent.com',
    callback: async ({ credential }) => {
      try {
        // Decode JWT locally since we don't have backend endpoint
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
          onboarded: Store.get('user.onboarded') || false,
          authenticated: true
        };
        
        Store.set('profile', user);
        Store.set('user', user);
        Events.emit('auth:success', { provider: 'google', profile: user });
        
        // Navigate based on onboarding status
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
    auto_select: false, ux_mode: 'popup'
  });

  gisClient.prompt();
}

export function signInWithLinkedIn() {
  Events.emit('auth:start', { provider: 'linkedin' });
  const clientId = Store.get('config.linkedinClientId') || '77chexyx9j5j8p';
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
    const code = p.get('code'); const state = p.get('state');
    if (!code || state !== Store.get('linkedin_oauth_state')) throw new Error('Invalid state');

    // Mock user for now since we don't have backend endpoint
    const user = {
      id: 'linkedin_' + Date.now(),
      email: 'user@linkedin.com',
      name: 'LinkedIn User',
      picture: '/assets/icons/icon-192.png',
      provider: 'linkedin',
      onboarded: Store.get('user.onboarded') || false,
      authenticated: true
    };
    
    Store.set('profile', user);
    Store.set('user', user);
    Store.remove('linkedin_oauth_state');
    Events.emit('auth:success', { provider: 'linkedin', profile: user });
    history.replaceState({}, '', '/');
    
    if (user.onboarded) {
      Events.emit('navigate', '/events');
    } else {
      Events.emit('navigate', '/onboarding');
    }
  } catch (e) {
    Events.emit('auth:error', { provider: 'linkedin', error: e });
    Events.emit('ui:toast', { type: 'error', message: 'LinkedIn login failed' });
  }
}

export function signInAsDemo() {
  const demoUser = {
    id: 'demo_' + Date.now(),
    email: 'demo@conference-party.app',
    name: 'Demo User',
    picture: '/assets/icons/icon-192.png',
    provider: 'demo',
    onboarded: false,
    authenticated: true
  };
  
  Store.set('profile', demoUser);
  Store.set('user', demoUser);
  Events.emit('auth:success', { provider: 'demo', profile: demoUser });
  Events.emit('navigate', '/onboarding');
}

export function signOut() {
  Store.reset();
  Events.emit('auth:signout');
  Events.emit('navigate', '/');
}

export function isAuthenticated() {
  return Boolean(Store.get('user.authenticated'));
}

export function getCurrentUser() {
  return Store.get('user');
}

export function initAuth() {
  const user = Store.get('user');
  if (user && user.authenticated) {
    Events.emit('auth:restored', { profile: user });
  }
  handleLinkedInCallbackIfPresent();
}

// Wire up event listeners
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  
  // Wire up buttons
  document.getElementById('btn-google')?.addEventListener('click', signInWithGoogle);
  document.getElementById('btn-linkedin')?.addEventListener('click', signInWithLinkedIn);
  document.getElementById('btn-demo')?.addEventListener('click', signInAsDemo);
  
  // Handle auth required
  Events.on('auth:required', () => {
    if (!isAuthenticated()) {
      Events.emit('navigate', '/');
    }
  });
});

export default {
  signInWithGoogle,
  signInWithLinkedIn,
  signInAsDemo,
  signOut,
  isAuthenticated,
  getCurrentUser,
  initAuth
};