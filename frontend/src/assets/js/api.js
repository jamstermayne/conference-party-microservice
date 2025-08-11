// API layer connecting GPT-5 frontend to operational backend
import { Store, Events, EVENTS } from './state.js';
import { toast } from './ui.js';
import { errorHandler, safeFetch } from './error-handler.js';
import apiClient from '../../config/api-client.js';

// Use environment-aware API client instead of hardcoded URL
const GET = async (path, opts={}) => {
  const finalOpts = { ...opts, cache: 'no-cache' }; // Bypass service worker for debugging
  
  try {
    console.log('🔄 [MAIN API DEBUG] GET request:', {
      path,
      opts: finalOpts
    });
    
    const result = await apiClient.get(path, finalOpts);
    console.log('✅ [MAIN API DEBUG] GET success via apiClient:', result);
    return result;
  } catch (error) {
    console.log('⚠️ [MAIN API DEBUG] apiClient failed, trying fallback:', error.message);
    // Fallback to legacy safeFetch for compatibility
    const baseUrl = apiClient.getEndpointInfo().baseUrl || 'https://us-central1-conference-party-app.cloudfunctions.net/api';
    const fullUrl = `${baseUrl}${path}`;
    
    console.log('🔄 [MAIN API DEBUG] Fallback fetch to:', fullUrl);
    const result = await safeFetch(fullUrl, finalOpts);
    console.log('📥 [MAIN API DEBUG] Fallback result:', result);
    return result;
  }
};

const POST = async (path, body={}, opts={}) => {
  const finalOpts = { ...opts, cache: 'no-cache' }; // Bypass service worker for debugging
  
  try {
    console.log('🔄 [MAIN API DEBUG] POST request:', {
      path,
      body,
      opts: finalOpts
    });
    
    const result = await apiClient.post(path, body, finalOpts);
    console.log('✅ [MAIN API DEBUG] POST success via apiClient:', result);
    return result;
  } catch (error) {
    console.log('⚠️ [MAIN API DEBUG] apiClient POST failed, trying fallback:', error.message);
    // Fallback to legacy safeFetch for compatibility  
    const baseUrl = apiClient.getEndpointInfo().baseUrl || 'https://us-central1-conference-party-app.cloudfunctions.net/api';
    const fullUrl = `${baseUrl}${path}`;
    
    console.log('🔄 [MAIN API DEBUG] Fallback POST to:', fullUrl, 'with body:', body);
    const result = await safeFetch(fullUrl, {
      method: 'POST',
      cache: 'no-cache',
      headers: { 'Content-Type': 'application/json', ...(finalOpts.headers || {}) },
      body: JSON.stringify(body),
      ...finalOpts
    });
    console.log('📥 [MAIN API DEBUG] Fallback POST result:', result);
    return result;
  }
};

export const API = {
  // Parties - Map backend format to GPT-5 expected shape
  async listParties(){
    try {
      console.log('🔄 Fetching parties from backend...');
      const response = await GET('/parties');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch parties');
      }
      
      // Map backend format to GPT-5 format
      const mappedParties = data.data.map(mapBackendPartyToGPT5);
      console.log(`✅ Loaded ${mappedParties.length} parties from backend`);
      
      return mappedParties;
      
    } catch (error) {
      console.warn('❌ Backend parties failed:', error.message);
      toast(`Using offline data: ${error.message}`);
      
      // Fallback to local data
      try {
        const fallbackResponse = await fetch('/data/parties.json');
        const fallbackData = await fallbackResponse.json();
        console.log(`📱 Using ${fallbackData.length} local parties as fallback`);
        return fallbackData;
      } catch (fallbackError) {
        console.error('❌ Fallback data also failed:', fallbackError);
        toast('Could not load party data');
        return [];
      }
    }
  },
  // Save parties selection (optional - not critical for demo)
  async saveParties(ids){
    try {
      const response = await POST('/swipe', { partyIds: ids, action: 'save' });
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Parties saved to backend');
        return data;
      }
    } catch (error) {
      console.warn('❌ Failed to save parties to backend:', error.message);
    }
    return { success: true }; // Always succeed locally
  },

  // Invites - Connected to real backend
  async inviteStatus(){
    try {
      console.log('🔄 Fetching invite status...');
      const response = await GET('/invites/me');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get invite status');
      }
      
      // Map backend format to GPT-5 format
      const mapped = {
        left: data.invitesLeft || 0,
        redeemed: data.redeemed || 0,
        totalGranted: data.totalGiven || 10,
        sent: data.recent || [],
        personalLink: data.personalLink,
        connections: data.connections || 0
      };
      
      console.log('✅ Invite status loaded:', mapped);
      return mapped;
      
    } catch (error) {
      console.warn('❌ Backend invite status failed:', error.message);
      // Return current store values as fallback
      return { 
        left: Store.invites.left, 
        redeemed: Store.invites.redeemed, 
        totalGranted: Store.invites.totalGranted, 
        sent: Store.invites.sent,
        connections: Store.connections?.length || 0
      };
    }
  },
  
  async sendInvite(payload){ // {email, name?}
    try {
      console.log('🔄 Sending invite:', payload);
      const response = await POST('/invites/send', {
        email: payload.email,
        name: payload.name || '',
        message: 'Join me at Gamescom 2025 for exclusive industry networking'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to send invite');
      }
      
      console.log('✅ Invite sent successfully');
      
      // Update local state
      Store.invites.sent.unshift({ 
        ...payload, 
        status: 'Pending', 
        ts: Date.now(),
        id: data.inviteId 
      });
      
      // Update invite count if provided by backend
      if (typeof data.invitesLeft === 'number') {
        Store.invites.left = data.invitesLeft;
      } else {
        Store.invites.left = Math.max(0, Store.invites.left - 1);
      }
      
      Events.emit(EVENTS.INVITES_CHANGED, { invites: Store.invites });
      return data;
      
    } catch (error) {
      console.error('❌ Failed to send invite:', error.message);
      toast(`Failed to send invite: ${error.message}`);
      
      // Don't do optimistic update on failure
      throw error;
    }
  },
  
  async claimBonus(kind){ // 'share'|'install'|'redeemed10'|'connections10'
    try {
      console.log('🔄 Claiming bonus:', kind);
      const response = await POST('/referral/bonus', { 
        type: kind,
        action: 'claim'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to claim bonus');
      }
      
      console.log('✅ Bonus claimed successfully');
      
      // Update local state with backend response
      if (typeof data.invitesLeft === 'number') {
        Store.invites.left = data.invitesLeft;
      } else {
        Store.invites.left += 5; // Default bonus
      }
      
      if (typeof data.totalGiven === 'number') {
        Store.invites.totalGranted = data.totalGiven;
      } else {
        Store.invites.totalGranted += 5;
      }
      
      Events.emit(EVENTS.BONUS_UNLOCKED, { kind, data });
      Events.emit(EVENTS.INVITES_CHANGED, { invites: Store.invites });
      
      return data;
      
    } catch (error) {
      console.warn('❌ Backend bonus failed, applying locally:', error.message);
      
      // Apply bonus locally as fallback
      Store.invites.left += 5;
      Store.invites.totalGranted += 5;
      
      Events.emit(EVENTS.BONUS_UNLOCKED, { kind });
      Events.emit(EVENTS.INVITES_CHANGED, { invites: Store.invites });
      
      return { success: true, local: true };
    }
  },

  // Calendar & OAuth
  async connectGoogle(){
    try {
      console.log('🔄 Initializing Google OAuth...');
      
      // Load Google Identity Services if not already loaded
      if (!window.google?.accounts?.id) {
        await loadGoogleIdentityServices();
      }
      
      return new Promise((resolve, reject) => {
        window.google.accounts.id.initialize({
          client_id: 'YOUR_GOOGLE_CLIENT_ID', // Replace with actual client ID
          callback: async (response) => {
            try {
              // Send token to backend for verification
              const backendResponse = await POST('/referral/auth/google', {
                credential: response.credential
              });
              
              if (backendResponse.ok) {
                const data = await backendResponse.json();
                console.log('✅ Google OAuth successful');
                
                // Update profile if provided
                if (data.profile) {
                  Store.profile = { ...Store.profile, ...data.profile };
                  Events.emit(EVENTS.PROFILE_UPDATED, { profile: Store.profile });
                }
                
                resolve(data);
              } else {
                throw new Error('Backend authentication failed');
              }
            } catch (error) {
              console.error('❌ Google OAuth backend error:', error);
              reject(error);
            }
          }
        });
        
        // Show the popup
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed()) {
            reject(new Error('Google popup blocked or not available'));
          }
        });
      });
      
    } catch (error) {
      console.error('❌ Google OAuth setup failed:', error);
      toast('Google sign-in not available');
      return { success: false, error: error.message };
    }
  },
  
  async generateICS(kind){
    try {
      const response = await GET(`/referral/calendar/${kind}.ics`);
      if (response.ok) {
        return await response.blob();
      }
    } catch (error) {
      console.warn(`❌ ICS generation failed for ${kind}:`, error.message);
    }
    return null;
  },
  
  async connectMTM(credentials){
    try {
      const response = await POST('/referral/calendar/mtm/connect', credentials);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.warn('❌ MTM connection failed:', error.message);
    }
    return { success: true }; // Always succeed for demo
  },

  // Profile/Auth
  async login(provider = 'google'){
    if (provider === 'google') {
      return this.connectGoogle();
    } else if (provider === 'linkedin') {
      return this.connectLinkedIn();
    }
    return { success: false, error: 'Provider not supported' };
  },

  async connectLinkedIn(){
    try {
      console.log('🔄 Initializing LinkedIn OAuth...');
      
      // LinkedIn OAuth configuration
      const linkedInConfig = {
        client_id: 'YOUR_LINKEDIN_CLIENT_ID', // Replace with actual client ID
        redirect_uri: encodeURIComponent(window.location.origin + '/auth/linkedin/callback'),
        state: Math.random().toString(36).substring(7),
        scope: 'r_liteprofile r_emailaddress'
      };
      
      const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${linkedInConfig.client_id}&redirect_uri=${linkedInConfig.redirect_uri}&state=${linkedInConfig.state}&scope=${linkedInConfig.scope}`;
      
      return new Promise((resolve, reject) => {
        // Store state for validation
        sessionStorage.setItem('linkedin_state', linkedInConfig.state);
        
        // Open LinkedIn auth popup
        const popup = window.open(
          authUrl,
          'linkedin-auth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );
        
        // Listen for popup messages
        const messageListener = async (event) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'LINKEDIN_AUTH_SUCCESS') {
            try {
              // Send authorization code to backend
              const backendResponse = await POST('/referral/auth/linkedin', {
                code: event.data.code,
                state: event.data.state
              });
              
              if (backendResponse.ok) {
                const data = await backendResponse.json();
                console.log('✅ LinkedIn OAuth successful');
                
                // Update profile if provided
                if (data.profile) {
                  Store.profile = { ...Store.profile, ...data.profile };
                  Events.emit(EVENTS.PROFILE_UPDATED, { profile: Store.profile });
                }
                
                popup.close();
                window.removeEventListener('message', messageListener);
                resolve(data);
              } else {
                throw new Error('Backend authentication failed');
              }
            } catch (error) {
              console.error('❌ LinkedIn OAuth backend error:', error);
              popup.close();
              window.removeEventListener('message', messageListener);
              reject(error);
            }
          } else if (event.data.type === 'LINKEDIN_AUTH_ERROR') {
            popup.close();
            window.removeEventListener('message', messageListener);
            reject(new Error(event.data.error || 'LinkedIn authentication failed'));
          }
        };
        
        window.addEventListener('message', messageListener);
        
        // Handle popup closed manually
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
            reject(new Error('LinkedIn authentication cancelled'));
          }
        }, 1000);
      });
      
    } catch (error) {
      console.error('❌ LinkedIn OAuth setup failed:', error);
      toast('LinkedIn sign-in not available');
      return { success: false, error: error.message };
    }
  },
  
  async me(){
    try {
      const response = await GET('/invites/me');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.profile) {
          return data.profile;
        }
      }
    } catch (error) {
      console.warn('❌ Profile fetch failed:', error.message);
    }
    return Store.profile;
  },

  // Deep Link & Sharing APIs
  async redeemInvite(inviteCode, referrerId) {
    try {
      console.log('🎟️ Redeeming invite code:', inviteCode);
      const response = await POST('/invites/redeem', {
        code: inviteCode,
        referrerId: referrerId
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Invite redeemed successfully:', data);
        return data;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.warn('❌ Invite redemption failed:', error.message);
      // Return success locally for demo
      return { 
        success: true, 
        bonusGranted: 5,
        message: 'Welcome to Velocity!',
        local: true 
      };
    }
  },
  
  async trackInviteClick(inviteCode) {
    try {
      await POST('/referral/track', { code: inviteCode, action: 'click' });
    } catch (error) {
      console.warn('❌ Failed to track invite click:', error.message);
    }
  },
  
  async trackReferralClick({ referrerId, source, campaign }) {
    try {
      await POST('/referral/track', {
        referrerId,
        source,
        campaign,
        timestamp: Date.now()
      });
    } catch (error) {
      console.warn('❌ Failed to track referral click:', error.message);
    }
  },
  
  async generateInviteCode(recipientEmail) {
    try {
      const response = await POST('/invites/generate', {
        email: recipientEmail,
        referrerId: Store.profile?.id || 'anonymous'
      });
      
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.warn('❌ Failed to generate invite code:', error.message);
    }
    
    // Fallback - generate local code
    return {
      success: true,
      inviteCode: `local_${Date.now()}`,
      inviteLink: `${window.location.origin}/invite/local_${Date.now()}`,
      local: true
    };
  }
};

// Data mapping function: Backend format → GPT-5 format
function mapBackendPartyToGPT5(backendParty) {
  // Backend format: { id, "Event Name", Address, Date, "Start Time", "End Time", Hosts, Category, Focus, etc. }
  // GPT-5 format: { id, title, venue, start, end, persona: {dev, pub, inv, sp}, etc. }
  
  const startDateTime = parseDateTime(backendParty.Date, backendParty["Start Time"]);
  const endDateTime = parseDateTime(backendParty.Date, backendParty["End Time"]);
  
  return {
    id: backendParty.id,
    eventId: backendParty.id,
    title: backendParty["Event Name"] || 'Unnamed Event',
    name: backendParty["Event Name"] || 'Unnamed Event',
    description: generateDescription(backendParty),
    venue: backendParty.Address || 'TBD',
    location: backendParty.Address || 'TBD',
    address: backendParty.Address || 'TBD',
    start: startDateTime,
    startTime: startDateTime,
    end: endDateTime,
    endTime: endDateTime,
    hosts: backendParty.Hosts || 'TBD',
    category: backendParty.Category || 'Event',
    focus: backendParty.Focus || 'All',
    price: backendParty.Price || 'TBD',
    link: backendParty.Link,
    persona: generatePersona(backendParty.Focus, backendParty.Category),
    tags: generateTags(backendParty),
    rsvp: backendParty.Price === 'Invite' ? 'invitation-only' : 'optional',
    source: 'backend'
  };
}

// Helper functions for data mapping
function parseDateTime(date, time) {
  try {
    // Handle formats like "Fri Aug 22" and "09:00"
    if (!date || !time) return new Date().toISOString();
    
    // Extract year (assume 2025)
    const year = 2025;
    
    // Parse date like "Fri Aug 22"
    const dateMatch = date.match(/([A-Za-z]{3})\s+([A-Za-z]{3})\s+(\d{1,2})/);
    if (!dateMatch) return new Date().toISOString();
    
    const monthName = dateMatch[2];
    const day = parseInt(dateMatch[3]);
    const monthMap = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    const month = monthMap[monthName] ?? 7; // Default to August
    
    // Parse time like "09:00" or "09:00 - 18:00"
    const timeMatch = time.match(/(\d{1,2}):(\d{2})/);
    const hours = timeMatch ? parseInt(timeMatch[1]) : 19;
    const minutes = timeMatch ? parseInt(timeMatch[2]) : 0;
    
    const dateObj = new Date(year, month, day, hours, minutes);
    return dateObj.toISOString();
    
  } catch (error) {
    console.warn('Date parsing error:', error);
    return new Date().toISOString();
  }
}

function generateDescription(party) {
  const parts = [];
  
  if (party.Hosts && party.Hosts !== 'You & Friends') {
    parts.push(`Hosted by ${party.Hosts}`);
  }
  
  if (party.Category) {
    parts.push(`${party.Category} event`);
  }
  
  if (party.Focus && party.Focus !== 'All') {
    parts.push(`Focus: ${party.Focus}`);
  }
  
  if (party.Price && party.Price !== 'TBD') {
    parts.push(`${party.Price}`);
  }
  
  return parts.length > 0 ? parts.join(' • ') : 'Gaming industry networking event';
}

function generatePersona(focus, category) {
  // Generate persona breakdown based on focus and category
  const personas = { dev: 25, pub: 25, inv: 25, sp: 25 }; // Default balanced
  
  if (focus) {
    switch (focus.toLowerCase()) {
      case 'indie':
        personas.dev = 60; personas.pub = 20; personas.inv = 15; personas.sp = 5;
        break;
      case 'audio':
        personas.dev = 50; personas.pub = 20; personas.inv = 10; personas.sp = 20;
        break;
      case 'xr':
      case 'ai':
      case 'vr':
        personas.dev = 55; personas.pub = 25; personas.inv = 15; personas.sp = 5;
        break;
      case 'dei':
        personas.dev = 30; personas.pub = 30; personas.inv = 20; personas.sp = 20;
        break;
      case 'multiplayer':
        personas.dev = 70; personas.pub = 15; personas.inv = 10; personas.sp = 5;
        break;
      case 'live service':
        personas.dev = 40; personas.pub = 45; personas.inv = 10; personas.sp = 5;
        break;
    }
  }
  
  if (category) {
    switch (category.toLowerCase()) {
      case 'mixer':
        // Keep current distribution
        break;
      case 'meetings':
        personas.pub = 45; personas.inv = 30; personas.dev = 15; personas.sp = 10;
        break;
      case 'hackathon':
        personas.dev = 80; personas.pub = 10; personas.inv = 5; personas.sp = 5;
        break;
      case 'exec social':
        personas.inv = 40; personas.pub = 35; personas.dev = 15; personas.sp = 10;
        break;
    }
  }
  
  return personas;
}

function generateTags(party) {
  const tags = [];
  
  if (party.Category) tags.push(party.Category.toLowerCase());
  if (party.Focus && party.Focus !== 'All') tags.push(party.Focus.toLowerCase());
  if (party.Price === 'Free') tags.push('free');
  if (party.Price === 'Invite') tags.push('exclusive');
  if (party.Hosts && party.Hosts !== 'You & Friends') tags.push('hosted');
  
  return tags;
}

// Load Google Identity Services dynamically
async function loadGoogleIdentityServices() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve(window.google);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
      if (window.google?.accounts?.id) {
        resolve(window.google);
      } else {
        reject(new Error('Google Identity Services failed to load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
}