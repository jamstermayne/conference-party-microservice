// Deep Link Handler for Invite/Share Links
import { Store, Events, EVENTS } from './state.js';
import { API } from './api.js';
import { mountRoute } from './router.js';
import { toast } from './ui.js';

class DeepLinkHandler {
  constructor() {
    this.handleInitialLoad();
    this.setupPopstateListener();
  }
  
  handleInitialLoad() {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    
    console.log('🔗 Deep link handler initialized:', { path, params: Object.fromEntries(params) });
    
    // Handle different deep link patterns
    if (path.startsWith('/invite/') || path === '/invite') {
      this.handleInviteLink(path, params);
    } else if (path.startsWith('/share/') || params.has('ref')) {
      this.handleShareLink(path, params);
    } else if (params.has('install')) {
      this.handleInstallPrompt(params);
    } else {
      // Normal app load - go to default route
      this.navigateToApp();
    }
  }
  
  setupPopstateListener() {
    window.addEventListener('popstate', (event) => {
      console.log('🔄 Popstate event:', event.state);
      this.handleInitialLoad();
    });
  }
  
  async handleInviteLink(path, params) {
    console.log('🎟️ Processing invite link:', path);
    
    // Extract and validate invite code from URL
    const inviteCode = this.extractInviteCode(path, params);
    const referrerName = params.get('from');
    const referrerId = params.get('ref');
    
    // Validate invite code format
    const validation = this.validateInviteCode(inviteCode);
    
    if (!validation.isValid) {
      console.warn('⚠️ Invalid invite code:', validation.error);
      toast(`Invalid invite link: ${validation.error}`);
      this.navigateToApp();
      return;
    }
    
    try {
      // Track invite click for analytics first
      if (inviteCode) {
        await API.trackInviteClick(inviteCode);
      }
      
      // Check if invite code is valid with backend
      const inviteStatus = await this.checkInviteValidity(inviteCode);
      
      if (!inviteStatus.valid) {
        console.warn('⚠️ Invite code not valid:', inviteStatus.reason);
        this.showInvalidInvite(inviteCode, inviteStatus.reason);
        return;
      }
      
      // Show invite acceptance UI
      this.showInviteAcceptance({
        code: inviteCode,
        referrerName: referrerName || inviteStatus.referrerName || 'A colleague',
        referrerId: referrerId || inviteStatus.referrerId,
        inviteData: inviteStatus
      });
      
    } catch (error) {
      console.error('❌ Failed to process invite link:', error);
      toast('Welcome to Velocity! (Invite processed offline)');
      this.navigateToApp();
    }
  }
  
  extractInviteCode(path, params) {
    // Try to extract from path first: /invite/CODE123
    if (path.includes('/invite/')) {
      const pathCode = path.split('/invite/')[1];
      if (pathCode && pathCode !== '/') {
        // Remove any trailing path segments
        return pathCode.split('/')[0].split('?')[0];
      }
    }
    
    // Fallback to query parameter: ?code=CODE123
    return params.get('code') || params.get('invite') || null;
  }
  
  validateInviteCode(code) {
    if (!code) {
      return { isValid: false, error: 'No invite code provided' };
    }
    
    // Basic format validation
    if (code.length < 3) {
      return { isValid: false, error: 'Invite code too short' };
    }
    
    if (code.length > 50) {
      return { isValid: false, error: 'Invite code too long' };
    }
    
    // Check for valid characters (alphanumeric, underscore, hyphen)
    if (!/^[a-zA-Z0-9_-]+$/.test(code)) {
      return { isValid: false, error: 'Invalid characters in invite code' };
    }
    
    // Check for suspicious patterns
    if (/^(test|demo|example|null|undefined|admin)$/i.test(code)) {
      console.warn('Suspicious invite code detected:', code);
    }
    
    return { isValid: true };
  }
  
  async checkInviteValidity(inviteCode) {
    try {
      const response = await API.validateInviteCode(inviteCode);
      return response;
    } catch (error) {
      console.warn('Could not validate invite code with backend:', error.message);
      // Return valid for offline/fallback scenario
      return { 
        valid: true, 
        offline: true, 
        reason: 'Backend validation unavailable'
      };
    }
  }
  
  showInvalidInvite(code, reason) {
    const overlay = document.createElement('div');
    overlay.className = 'invite-overlay';
    overlay.innerHTML = `
      <div class="invite-modal invalid-invite">
        <div class="invite-content">
          <div class="invite-icon">⚠️</div>
          <h1 class="invite-title">Invalid Invite</h1>
          <p class="invite-message">
            This invite link is no longer valid.
          </p>
          
          <div class="invalid-details">
            <div class="detail-item">
              <strong>Invite Code:</strong> <code>${code}</code>
            </div>
            <div class="detail-item">
              <strong>Issue:</strong> ${reason || 'Invite has expired or been used'}
            </div>
          </div>
          
          <div class="invite-actions">
            <button id="join-anyway" class="btn btn-primary">
              Join Velocity Anyway
            </button>
            <button id="request-invite" class="btn btn-ghost">
              Request New Invite
            </button>
          </div>
        </div>
      </div>
    `;
    
    this.addInviteStyles();
    document.body.appendChild(overlay);
    
    overlay.querySelector('#join-anyway').addEventListener('click', () => {
      overlay.remove();
      toast('Welcome to Velocity!');
      this.navigateToApp();
    });
    
    overlay.querySelector('#request-invite').addEventListener('click', () => {
      overlay.remove();
      this.navigateToApp();
      // Could open a contact form or redirect to signup
      toast('Contact us for a new invite link');
    });
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
        this.navigateToApp();
      }
    });
  }
  
  async handleShareLink(path, params) {
    console.log('📤 Processing share link:', path);
    
    const referrerId = params.get('ref');
    const utm_source = params.get('utm_source');
    const utm_campaign = params.get('utm_campaign');
    
    try {
      // Track share click
      if (referrerId) {
        await API.trackReferralClick({
          referrerId,
          source: utm_source || 'share',
          campaign: utm_campaign || 'general'
        });
        
        // Store referrer info for potential sign-up attribution
        Store.referral = {
          referrerId,
          source: utm_source,
          timestamp: Date.now()
        };
      }
      
      // Show welcome message for shared links
      toast('🎉 Welcome to Velocity - exclusive gaming industry networking!');
      
    } catch (error) {
      console.warn('⚠️ Failed to track share link:', error);
    }
    
    // Continue to normal app experience
    this.navigateToApp();
  }
  
  handleInstallPrompt(params) {
    console.log('📱 Install prompt requested');
    
    // Set flag to show install prompt after app loads
    Store.flags.showInstallOnLoad = true;
    
    // Continue to app
    this.navigateToApp();
  }
  
  showInviteAcceptance({ code, referrerName, referrerId }) {
    // Create invite acceptance overlay
    const overlay = document.createElement('div');
    overlay.className = 'invite-overlay';
    overlay.innerHTML = `
      <div class="invite-modal">
        <div class="invite-content">
          <div class="invite-icon">🎟️</div>
          <h1 class="invite-title">You're Invited!</h1>
          <p class="invite-message">
            <strong>${referrerName}</strong> invited you to join Velocity,
            the exclusive networking platform for Gamescom 2025.
          </p>
          
          <div class="invite-features">
            <div class="feature-item">
              <span class="feature-icon">🎮</span>
              <span>50+ exclusive gaming industry events</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🤝</span>
              <span>Connect with industry professionals</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📅</span>
              <span>Sync events to your calendar</span>
            </div>
          </div>
          
          <div class="invite-actions">
            <button id="accept-invite" class="btn btn-primary btn-large">
              Accept Invitation
            </button>
            <button id="maybe-later" class="btn btn-ghost">
              Maybe Later
            </button>
          </div>
          
          <p class="invite-footer">
            Free to join • No spam • Professional networking only
          </p>
        </div>
      </div>
    `;
    
    // Add styles
    this.addInviteStyles();
    
    // Add to page
    document.body.appendChild(overlay);
    
    // Handle actions
    overlay.querySelector('#accept-invite').addEventListener('click', async () => {
      try {
        // Redeem invite code
        if (code) {
          const result = await API.redeemInvite(code, referrerId);
          if (result.success) {
            // Update invite status in store
            if (result.bonusGranted) {
              Store.invites.left += result.bonusGranted;
              Store.invites.totalGranted += result.bonusGranted;
              toast(`🎁 Welcome bonus: +${result.bonusGranted} invites!`);
            }
            
            Events.emit(EVENTS.INVITE_REDEEMED, { code, bonus: result.bonusGranted });
          }
        }
        
        overlay.remove();
        toast('🎉 Welcome to Velocity! Start exploring events.');
        this.navigateToApp();
        
      } catch (error) {
        console.error('Failed to redeem invite:', error);
        overlay.remove();
        toast('Welcome to Velocity!');
        this.navigateToApp();
      }
    });
    
    overlay.querySelector('#maybe-later').addEventListener('click', () => {
      overlay.remove();
      this.navigateToApp();
    });
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
        this.navigateToApp();
      }
    });
  }
  
  addInviteStyles() {
    if (document.querySelector('#invite-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'invite-styles';
    style.textContent = `
      .invite-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(10, 14, 19, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(10px);
      }
      
      .invite-modal {
        background: linear-gradient(135deg, var(--neutral-100) 0%, var(--alias-334155) 100%);
        border-radius: 20px;
        padding: 2rem;
        max-width: 420px;
        width: 90%;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
        text-align: center;
      }
      
      .invite-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
        display: block;
      }
      
      .invite-title {
        font-size: 2rem;
        font-weight: 700;
        color: var(--white);
        margin: 0 0 1rem 0;
      }
      
      .invite-message {
        color: var(--alias-cbd5e1);
        font-size: 1.1rem;
        line-height: 1.6;
        margin: 0 0 2rem 0;
      }
      
      .invite-features {
        margin: 2rem 0;
        text-align: left;
      }
      
      .feature-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.75rem 0;
        color: var(--alias-e2e8f0);
        font-size: 0.95rem;
      }
      
      .feature-icon {
        font-size: 1.25rem;
        width: 1.5rem;
        text-align: center;
      }
      
      .invite-actions {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin: 2rem 0 1rem 0;
      }
      
      .btn-large {
        padding: 1rem 2rem;
        font-size: 1.1rem;
        font-weight: 600;
      }
      
      .invite-footer {
        color: var(--alias-64748b);
        font-size: 0.875rem;
        margin: 1rem 0 0 0;
      }
      
      @media (max-width: 480px) {
        .invite-modal {
          padding: 1.5rem;
          margin: 1rem;
        }
        
        .invite-title {
          font-size: 1.75rem;
        }
        
        .invite-message {
          font-size: 1rem;
        }
      }
    `;
    
    document.head.appendChild(style);
  }
  
  navigateToApp() {
    // Clean up URL and navigate to main app
    const cleanUrl = new URL(window.location);
    cleanUrl.pathname = '/';
    cleanUrl.search = '';
    
    // Update URL without reloading page
    window.history.replaceState({}, '', cleanUrl);
    
    // Navigate to parties view (default)
    mountRoute('parties');
  }
  
  // Helper method to generate share links
  static generateShareLink(referrerId, source = 'app', campaign = 'general') {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      ref: referrerId,
      utm_source: source,
      utm_campaign: campaign
    });
    
    return `${baseUrl}?${params.toString()}`;
  }
  
  // Helper method to generate invite links
  static generateInviteLink(inviteCode, referrerName, referrerId) {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      code: inviteCode,
      from: referrerName,
      ref: referrerId
    });
    
    return `${baseUrl}/invite/${inviteCode}?${params.toString()}`;
  }
}

// Export the class and create singleton
const deepLinkHandler = new DeepLinkHandler();

export default deepLinkHandler;
export { DeepLinkHandler };