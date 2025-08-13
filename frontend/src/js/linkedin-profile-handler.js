/**
 * linkedin-profile-handler.js
 * Handles LinkedIn OAuth callback and profile mapping
 */
import Store from '/js/store.js';
import Events from '/assets/js/events.js';
import { mapLinkedInProfile } from './profile-map.js';

// After LinkedIn OAuth success, we expect a raw payload (guarded in case not configured)
export async function onLinkedInSuccess(raw){
  try {
    Store.patch?.('auth.linkedin', { connected: true, at: Date.now() });
    const mapped = mapLinkedInProfile(raw);
    if (mapped) {
      // Preserve existing admin flag if present
      const existing = Store.get?.('profile') || {};
      const admin = existing.admin === true;
      Store.patch?.('profile', { ...existing, ...mapped, admin });
    }
    Events.emit?.('auth:linkedin:success', raw);
  } catch (e) { console.error('linkedin success handler error', e); }
}

// Handle LinkedIn OAuth callback (if on callback page)
if (window.location.pathname === '/auth/linkedin/callback') {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  
  if (code && state === sessionStorage.getItem('li_oauth_state')) {
    // Would normally exchange code for token via backend
    // For now, simulate success with mock data
    console.log('LinkedIn OAuth callback received', { code, state });
    
    // Mock LinkedIn profile for development
    const mockProfile = {
      firstName: 'John',
      lastName: 'Doe',
      headline: 'Senior Developer at Tech Corp',
      company: 'Tech Corp',
      role: 'Developer',
      email: 'john.doe@example.com'
    };
    
    onLinkedInSuccess(mockProfile);
    
    // Redirect back to app
    window.location.href = '/#/me';
  }
}

export default { onLinkedInSuccess };