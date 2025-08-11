/**
 * INVITES SERVICE
 * Exclusive 10-invite quality control system with deep link handling
 */

export async function generate(){
  // POST /api/invites/generate -> { code }
  try{
    const r = await fetch('/api/invites/generate', { method:'POST', credentials:'include' });
    if(!r.ok) throw 0;
    const { code } = await r.json();
    return code;
  }catch{
    const suffix = Math.random().toString(36).slice(2,7).toUpperCase();
    return `GC2025-${suffix}`;
  }
}

export async function share(code){
  const text = `Join me on ProNet – trusted, invite-only professional network.\nCode: ${code}\nLink: ${location.origin}/#/invite?code=${encodeURIComponent(code)}`;
  try{
    if (navigator.share) { await navigator.share({ title:'ProNet Invite', text }); return true; }
    await navigator.clipboard.writeText(text); alert('Copied invite to clipboard'); return true;
  }catch{ return false; }
}

export async function redeem(code) {
  try {
    const r = await fetch('/api/invites/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code })
    });
    
    if (!r.ok) throw 0;
    
    const result = await r.json();
    
    // Viral growth: New user gets their own 10 invites
    if (result.success) {
      const { Store } = await import('../store.js');
      Store.patch('invites', { 
        left: 10,  // Fresh allocation for viral growth
        myCode: result.newUserCode  // Their personal invite code
      });
    }
    
    return result;
  } catch {
    return { success: false, error: 'Invalid invite code' };
  }
}

export async function redeemWithGoogle(code) {
  try {
    // Step 1: Get Google ID token
    const googleAuth = await signInWithGoogle();
    
    // Step 2: Send code + id_token to backend
    const result = await fetch('/api/invites/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ 
        code: code,
        id_token: googleAuth.credential
      })
    });
    
    if (!result.ok) throw new Error('Invite redemption failed');
    
    const data = await result.json();
    
    // Success: Store user data and grants
    if (data.success) {
      const { Store } = await import('../store.js');
      Store.patch('user', data.user);
      Store.patch('invites', { 
        left: data.grants.invites,  // Backend determines invite allocation
        myCode: await generate()     // Generate new personal code
      });
    }
    
    return data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function signInWithGoogle() {
  return new Promise((resolve, reject) => {
    // Load Google Identity Services if not already loaded
    if (!window.google?.accounts?.id) {
      loadGoogleIdentityServices().then(() => initGoogleAuth(resolve, reject));
    } else {
      initGoogleAuth(resolve, reject);
    }
  });
}

function loadGoogleIdentityServices() {
  return new Promise((resolve) => {
    if (document.getElementById('google-identity-script')) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.id = 'google-identity-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

function initGoogleAuth(resolve, reject) {
  // Initialize Google Identity Services
  google.accounts.id.initialize({
    client_id: getGoogleClientId(),
    callback: (response) => {
      try {
        // Return the raw credential (id_token) for backend verification
        resolve({
          credential: response.credential
        });
      } catch (error) {
        reject(error);
      }
    }
  });

  // Show Google Sign-In prompt
  google.accounts.id.prompt((notification) => {
    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
      // Fallback: Show One Tap dialog
      showGoogleOneTap(resolve, reject);
    }
  });
}

function showGoogleOneTap(resolve, reject) {
  const container = document.createElement('div');
  container.id = 'google-signin-button';
  container.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10000;
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  `;
  
  document.body.appendChild(container);
  
  google.accounts.id.renderButton(container, {
    theme: 'outline',
    size: 'large',
    text: 'continue_with',
    width: 280
  });
  
  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = `
    position: absolute;
    top: 8px;
    right: 8px;
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
  `;
  closeBtn.onclick = () => {
    container.remove();
    reject(new Error('User cancelled Google sign-in'));
  };
  container.appendChild(closeBtn);
  
  // Auto-remove after successful auth
  const originalCallback = google.accounts.id.initialize;
}

function getGoogleClientId() {
  // In production, this should come from environment or config
  return window.__ENV?.GOOGLE_CLIENT_ID || 
         document.querySelector('meta[name="google-client-id"]')?.content ||
         '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com'; // Placeholder
}

function parseJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    throw new Error('Invalid JWT token');
  }
}

export async function validateInviteCode(code) {
  try {
    const r = await fetch('/api/invites/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code })
    });
    return { valid: r.ok, code };
  } catch {
    return { valid: false, code };
  }
}

// Legacy class-based invite service for backward compatibility
class InviteService {
  constructor() {
    this.myCode = null;
    this.usedInvites = [];
    this.remainingInvites = 10;
    this.inviteStats = {
      sent: 0,
      accepted: 0,
      pending: 0,
      declined: 0
    };
    this.initialized = false;
  }

  /**
   * Initialize invite service
   */
  async init() {
    if (this.initialized) return;

    try {
      // Load existing invite data
      await this.loadInviteData();
      
      // Handle invite link in URL
      this.handleInviteLink();
      
      this.initialized = true;
      console.log('✅ Invite service initialized');
    } catch (error) {
      console.error('Invite service initialization failed:', error);
    }
  }

  /**
   * Load invite data from storage and server
   */
  async loadInviteData() {
    try {
      // Load from localStorage first (offline support)
      const cached = localStorage.getItem('invites.data');
      if (cached) {
        const data = JSON.parse(cached);
        this.updateInviteData(data);
      }

      // Sync with server
      const response = await fetch('/api/invites/mine');
      if (response.ok) {
        const serverData = await response.json();
        this.updateInviteData(serverData);
        this.cacheInviteData();
      }
    } catch (error) {
      console.warn('Failed to load invite data:', error);
    }
  }

  /**
   * Update internal invite data
   */
  updateInviteData(data) {
    this.myCode = data.code || this.myCode;
    this.usedInvites = data.usedInvites || [];
    this.remainingInvites = data.remainingInvites || (10 - this.usedInvites.length);
    this.inviteStats = { ...this.inviteStats, ...(data.stats || {}) };
  }

  /**
   * Cache invite data locally
   */
  cacheInviteData() {
    const data = {
      code: this.myCode,
      usedInvites: this.usedInvites,
      remainingInvites: this.remainingInvites,
      stats: this.inviteStats,
      lastUpdate: Date.now()
    };
    localStorage.setItem('invites.data', JSON.stringify(data));
  }

  /**
   * Generate new invite code
   */
  async generateNewCode() {
    try {
      const response = await fetch('/api/invites/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to generate invite code');
      }

      const result = await response.json();
      this.myCode = result.code;
      this.cacheInviteData();
      
      return {
        success: true,
        code: result.code
      };
    } catch (error) {
      console.error('Failed to generate invite code:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send invite to someone
   */
  async sendInvite(recipientData, method = 'link') {
    if (this.remainingInvites <= 0) {
      throw new Error('No remaining invites');
    }

    try {
      const response = await fetch('/api/invites/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: this.myCode,
          recipient: recipientData,
          method: method
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send invite');
      }

      const result = await response.json();
      
      // Update local state
      this.usedInvites.push({
        id: result.inviteId,
        recipient: recipientData,
        sentAt: new Date().toISOString(),
        status: 'pending',
        method: method
      });
      
      this.remainingInvites--;
      this.inviteStats.sent++;
      this.inviteStats.pending++;
      
      this.cacheInviteData();
      
      return {
        success: true,
        inviteId: result.inviteId,
        shareUrl: result.shareUrl
      };
    } catch (error) {
      console.error('Failed to send invite:', error);
      throw error;
    }
  }

  /**
   * Handle invite link in current URL
   */
  handleInviteLink() {
    const params = new URLSearchParams(window.location.search);
    const inviteCode = params.get('invite') || params.get('code');
    
    if (inviteCode) {
      this.processInviteCode(inviteCode);
      
      // Clean URL after processing
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }

  /**
   * Process invite code from URL or input
   */
  async processInviteCode(code) {
    try {
      const response = await fetch('/api/invites/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      const result = await response.json();
      
      if (result.success) {
        // Store invite source for analytics
        localStorage.setItem('invite.source', code);
        localStorage.setItem('invite.acceptedAt', new Date().toISOString());
        
        // Show success message
        this.showInviteSuccess(result);
        
        // Track conversion
        this.trackInviteConversion(code);
        
        return { success: true, data: result };
      } else {
        this.showInviteError(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Failed to process invite:', error);
      this.showInviteError('Failed to process invite');
      return { success: false, error: error.message };
    }
  }

  /**
   * Show invite success message
   */
  showInviteSuccess(data) {
    // Create success notification
    const notification = document.createElement('div');
    notification.className = 'invite-success-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <div class="success-icon">🎉</div>
        <div class="success-text">
          <h3>Welcome to ProNet!</h3>
          <p>You've successfully joined the professional intelligence platform</p>
          ${data.inviter ? `<p class="inviter">Invited by: ${data.inviter}</p>` : ''}
        </div>
        <button class="btn btn-primary" onclick="this.parentElement.parentElement.remove()">
          Get Started
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  }

  /**
   * Show invite error message
   */
  showInviteError(error) {
    console.error('Invite error:', error);
    
    const notification = document.createElement('div');
    notification.className = 'invite-error-notification';
    notification.innerHTML = `
      <div class="notification-content error">
        <div class="error-icon">❌</div>
        <div class="error-text">
          <h3>Invite Error</h3>
          <p>${error}</p>
        </div>
        <button class="btn btn-secondary" onclick="this.parentElement.parentElement.remove()">
          Close
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
  }

  /**
   * Track invite conversion for analytics
   */
  trackInviteConversion(code) {
    try {
      // Anonymous tracking only
      fetch('/api/analytics/invite-conversion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          referrer: document.referrer
        })
      }).catch(() => {}); // Silent fail for analytics
    } catch (error) {
      // Silent fail for analytics
    }
  }

  /**
   * Generate share content for different platforms
   */
  async generateShareContent(inviteCode, platform = 'generic') {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}?invite=${inviteCode}`;
    
    const messages = {
      whatsapp: `🎮 Join me on ProNet - the professional intelligence platform for gaming industry professionals!\n\nConnect, discover opportunities, and network at Gamescom 2025.\n\nJoin here: ${shareUrl}`,
      
      twitter: `🚀 Just joined ProNet - the LinkedIn-killer for gaming professionals! \n\nExclusive invite-only platform for networking at #Gamescom2025\n\n${shareUrl}`,
      
      linkedin: `Excited to share access to ProNet - a revolutionary professional intelligence platform for the gaming industry.\n\nJoin me in building the future of professional networking at Gamescom 2025.`,
      
      email: `I'd like to invite you to join ProNet - an exclusive professional networking platform for the gaming industry.\n\nProNet is designed specifically for professionals attending Gamescom 2025, featuring proximity-based networking, opportunity matching, and intelligent professional connections.\n\nAccept my invitation here: ${shareUrl}\n\nLooking forward to connecting with you on the platform!`,
      
      generic: `Join me on ProNet - the professional intelligence platform for gaming industry professionals! ${shareUrl}`
    };

    return {
      url: shareUrl,
      title: 'ProNet Invitation',
      message: messages[platform] || messages.generic,
      hashtags: ['ProNet', 'Gamescom2025', 'Gaming', 'Networking']
    };
  }

  /**
   * Get my invite data
   */
  getMyInvites() {
    return {
      myCode: this.myCode,
      remainingInvites: this.remainingInvites,
      usedInvites: [...this.usedInvites],
      inviteStats: { ...this.inviteStats }
    };
  }

  /**
   * Get invite status by ID
   */
  async getInviteStatus(inviteId) {
    try {
      const response = await fetch(`/api/invites/${inviteId}/status`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to get invite status:', error);
    }
    return null;
  }

  /**
   * Cancel pending invite
   */
  async cancelInvite(inviteId) {
    try {
      const response = await fetch(`/api/invites/${inviteId}/cancel`, {
        method: 'POST'
      });

      if (response.ok) {
        // Update local state
        const inviteIndex = this.usedInvites.findIndex(inv => inv.id === inviteId);
        if (inviteIndex > -1) {
          this.usedInvites[inviteIndex].status = 'cancelled';
          this.remainingInvites++;
          this.inviteStats.pending--;
          this.cacheInviteData();
        }
        return { success: true };
      }
    } catch (error) {
      console.error('Failed to cancel invite:', error);
    }
    return { success: false };
  }

  /**
   * Resend invite
   */
  async resendInvite(inviteId) {
    try {
      const response = await fetch(`/api/invites/${inviteId}/resend`, {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update local state
        const inviteIndex = this.usedInvites.findIndex(inv => inv.id === inviteId);
        if (inviteIndex > -1) {
          this.usedInvites[inviteIndex].resentAt = new Date().toISOString();
        }
        
        this.cacheInviteData();
        return { success: true, shareUrl: result.shareUrl };
      }
    } catch (error) {
      console.error('Failed to resend invite:', error);
    }
    return { success: false };
  }

  /**
   * Get invite analytics
   */
  getInviteAnalytics() {
    const totalSent = this.inviteStats.sent;
    const accepted = this.inviteStats.accepted;
    const pending = this.inviteStats.pending;
    const declined = this.inviteStats.declined;
    
    return {
      totalSent,
      accepted,
      pending,
      declined,
      acceptanceRate: totalSent > 0 ? (accepted / totalSent) * 100 : 0,
      conversionRate: totalSent > 0 ? (accepted / (accepted + declined)) * 100 : 0,
      remainingInvites: this.remainingInvites
    };
  }

  /**
   * Update invite stats from server
   */
  async syncInviteStats() {
    try {
      const response = await fetch('/api/invites/stats');
      if (response.ok) {
        const stats = await response.json();
        this.inviteStats = { ...this.inviteStats, ...stats };
        this.cacheInviteData();
      }
    } catch (error) {
      console.warn('Failed to sync invite stats:', error);
    }
  }

  /**
   * Check if user has remaining invites
   */
  hasRemainingInvites() {
    return this.remainingInvites > 0;
  }

  /**
   * Get invite leaderboard (if user opts in)
   */
  async getInviteLeaderboard() {
    try {
      const response = await fetch('/api/invites/leaderboard');
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
    }
    return [];
  }

  /**
   * Export invite data
   */
  exportInviteData() {
    return {
      myCode: this.myCode,
      invitesSent: this.usedInvites.map(invite => ({
        sentAt: invite.sentAt,
        status: invite.status,
        method: invite.method
        // Exclude recipient data for privacy
      })),
      stats: this.inviteStats,
      remainingInvites: this.remainingInvites
    };
  }

  /**
   * Clear all invite data
   */
  clearInviteData() {
    this.myCode = null;
    this.usedInvites = [];
    this.remainingInvites = 10;
    this.inviteStats = { sent: 0, accepted: 0, pending: 0, declined: 0 };
    
    localStorage.removeItem('invites.data');
    localStorage.removeItem('invite.source');
    localStorage.removeItem('invite.acceptedAt');
  }

  /**
   * Destroy invite service
   */
  destroy() {
    this.clearInviteData();
    this.initialized = false;
    console.log('🗑️ Invite service destroyed');
  }
}

// Create singleton instance
export const invites = new InviteService();

// Export class for testing
export default InviteService;