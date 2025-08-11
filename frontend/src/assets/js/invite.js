import { Store, Events, EVENTS } from './state.js';
import { API } from './api.js';
import { toast } from './ui.js';
import { showAuthModal } from './auth-view.js';

// Invite Deep Link Handler
class InviteManager {
  constructor() {
    this.pendingInvite = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for invite events
    Events.on('invite:loaded', (data) => {
      this.showInviteModal(data);
    });

    Events.on('invite:accepted', async (data) => {
      await this.acceptInvite(data);
    });

    Events.on('invite:rejected', () => {
      this.rejectInvite();
    });
  }

  // Get invite code from URL
  getInviteCodeFromURL() {
    const path = window.location.pathname;
    
    // Match patterns like /invite/ABC123 or /invite/code123
    const match = path.match(/^\/invite\/([a-zA-Z0-9_-]+)$/);
    if (match) {
      return match[1];
    }
    
    // Also check query params as fallback
    const params = new URLSearchParams(window.location.search);
    return params.get('invite') || params.get('code') || null;
  }

  // Get referrer info from URL
  getReferrerFromURL() {
    const params = new URLSearchParams(window.location.search);
    return {
      referrerName: params.get('from') || params.get('referrer'),
      referrerId: params.get('ref') || params.get('uid'),
      source: params.get('utm_source'),
      campaign: params.get('utm_campaign')
    };
  }

  // Main handler for invite redemption
  async handleInviteRedemption() {
    const code = this.getInviteCodeFromURL();
    if (!code) {
      console.log('No invite code found in URL');
      return false;
    }

    console.log('📨 Processing invite code:', code);
    
    // Store the pending invite
    this.pendingInvite = {
      code,
      ...this.getReferrerFromURL()
    };
    
    // Show loading toast
    toast('Checking invite...', 'info');
    
    try {
      // Fetch invite details from API
      const inviteData = await this.fetchInviteDetails(code);
      
      if (!inviteData.valid) {
        this.showInvalidInvite(inviteData);
        return false;
      }
      
      // Store full invite data
      this.pendingInvite = {
        ...this.pendingInvite,
        ...inviteData
      };
      
      Store.pendingInvite = this.pendingInvite;
      
      // Emit event for other components
      Events.emit('invite:loaded', this.pendingInvite);
      
      // Show the invite acceptance modal
      this.showInviteModal(this.pendingInvite);
      
      return true;
      
    } catch (err) {
      console.error('❌ Invite redemption failed:', err);
      toast('Error loading invite. Please try again.', 'error');
      
      // Still show a basic invite modal with the code
      this.showInviteModal({
        code,
        referrerName: this.pendingInvite.referrerName || 'Someone',
        offline: true
      });
      
      return false;
    }
  }

  // Fetch invite details from API
  async fetchInviteDetails(code) {
    try {
      // First validate the invite code
      const validation = await API.validateInviteCode(code);
      
      if (validation && validation.valid) {
        return {
          valid: true,
          code,
          referrerName: validation.referrerName,
          referrerId: validation.referrerId,
          uses: validation.uses || 0,
          maxUses: validation.maxUses || 1,
          expiresAt: validation.expiresAt,
          bonusInvites: validation.bonusInvites || 5,
          message: validation.message || 'You have been invited to join Velocity!'
        };
      }
      
      return {
        valid: false,
        reason: validation?.reason || 'Invalid or expired invite code'
      };
      
    } catch (error) {
      console.warn('Failed to fetch invite details:', error);
      
      // Return a basic valid response for offline/demo mode
      return {
        valid: true,
        code,
        offline: true,
        bonusInvites: 5,
        message: 'Welcome to Velocity!'
      };
    }
  }

  // Show invite acceptance modal
  showInviteModal(inviteData) {
    // Remove any existing modal
    const existingModal = document.querySelector('.invite-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.className = 'invite-modal';
    modal.innerHTML = `
      <div class="invite-modal-overlay"></div>
      <div class="invite-modal-content">
        <button class="invite-modal-close" aria-label="Close">×</button>
        
        <div class="invite-icon">🎟️</div>
        
        <h2 class="invite-title">You're Invited!</h2>
        
        <p class="invite-message">
          <strong>${inviteData.referrerName || 'A colleague'}</strong> invited you to join 
          Velocity, the exclusive networking platform for gaming professionals at Gamescom 2025.
        </p>
        
        ${inviteData.message ? `
          <div class="invite-quote">
            "${inviteData.message}"
          </div>
        ` : ''}
        
        <div class="invite-benefits">
          <div class="benefit">
            <span class="benefit-emoji">🎮</span>
            <span>Access 75+ exclusive gaming events</span>
          </div>
          <div class="benefit">
            <span class="benefit-emoji">🤝</span>
            <span>Connect with industry professionals</span>
          </div>
          <div class="benefit">
            <span class="benefit-emoji">📅</span>
            <span>Sync events to your calendar</span>
          </div>
          <div class="benefit">
            <span class="benefit-emoji">🎁</span>
            <span>Get ${inviteData.bonusInvites || 5} invites to share</span>
          </div>
        </div>
        
        <div class="invite-actions">
          <button id="accept-invite" class="btn btn-primary btn-large">
            Accept Invitation
          </button>
          <button id="decline-invite" class="btn btn-ghost">
            Maybe Later
          </button>
        </div>
        
        <p class="invite-footer">
          ${inviteData.offline ? '(Offline mode - will sync when connected)' : 'No spam • Privacy first • Professional networking only'}
        </p>
      </div>
    `;

    document.body.appendChild(modal);

    // Add animation
    requestAnimationFrame(() => {
      modal.classList.add('invite-modal-show');
    });

    // Setup event handlers
    this.setupModalHandlers(modal, inviteData);
  }

  // Show invalid invite modal
  showInvalidInvite(data) {
    const modal = document.createElement('div');
    modal.className = 'invite-modal invite-invalid';
    modal.innerHTML = `
      <div class="invite-modal-overlay"></div>
      <div class="invite-modal-content">
        <button class="invite-modal-close" aria-label="Close">×</button>
        
        <div class="invite-icon">❌</div>
        
        <h2 class="invite-title">Invalid Invite</h2>
        
        <p class="invite-message">
          ${data.reason || 'This invite link is no longer valid.'}
        </p>
        
        <div class="invite-error-details">
          <p>This could happen if:</p>
          <ul>
            <li>The invite has expired</li>
            <li>The invite has already been used</li>
            <li>The invite code is incorrect</li>
          </ul>
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
    `;

    document.body.appendChild(modal);

    // Add animation
    requestAnimationFrame(() => {
      modal.classList.add('invite-modal-show');
    });

    // Setup handlers
    modal.querySelector('#join-anyway').addEventListener('click', () => {
      modal.remove();
      this.navigateToApp();
    });

    modal.querySelector('#request-invite').addEventListener('click', () => {
      modal.remove();
      toast('Contact us for a new invite', 'info');
      this.navigateToApp();
    });

    modal.querySelector('.invite-modal-close').addEventListener('click', () => {
      modal.remove();
      this.navigateToApp();
    });

    modal.querySelector('.invite-modal-overlay').addEventListener('click', () => {
      modal.remove();
      this.navigateToApp();
    });
  }

  // Setup modal event handlers
  setupModalHandlers(modal, inviteData) {
    // Accept invite button
    const acceptBtn = modal.querySelector('#accept-invite');
    if (acceptBtn) {
      acceptBtn.addEventListener('click', async () => {
        await this.acceptInvite(inviteData);
        modal.remove();
      });
    }

    // Decline invite button
    const declineBtn = modal.querySelector('#decline-invite');
    if (declineBtn) {
      declineBtn.addEventListener('click', () => {
        this.rejectInvite();
        modal.remove();
      });
    }

    // Close button
    const closeBtn = modal.querySelector('.invite-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.remove();
        this.navigateToApp();
      });
    }

    // Overlay click
    const overlay = modal.querySelector('.invite-modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => {
        modal.remove();
        this.navigateToApp();
      });
    }
  }

  // Accept the invite
  async acceptInvite(inviteData) {
    console.log('✅ Accepting invite:', inviteData.code);
    
    // Check if user is authenticated
    if (!Store.profile?.authenticated) {
      // Store pending invite for after auth
      Store.pendingInvite = inviteData;
      
      // Show auth modal
      showAuthModal({
        title: 'Sign in to Accept Invite',
        subtitle: `Join ${inviteData.referrerName || 'your colleague'} on Velocity`
      });
      
      // Listen for successful auth to continue
      const authHandler = (event) => {
        if (event.detail?.profile) {
          Events.off('auth:success', authHandler);
          this.completeInviteRedemption(inviteData);
        }
      };
      Events.on('auth:success', authHandler);
      
      return;
    }
    
    // User is authenticated, complete redemption
    await this.completeInviteRedemption(inviteData);
  }

  // Complete the invite redemption
  async completeInviteRedemption(inviteData) {
    try {
      // Call API to redeem invite
      const result = await API.redeemInvite(inviteData.code, inviteData.referrerId);
      
      if (result.success) {
        // Update invites count
        if (result.bonusGranted) {
          Store.invites.left += result.bonusGranted;
          Store.invites.totalGranted += result.bonusGranted;
          toast(`🎁 Welcome! You received ${result.bonusGranted} invites to share!`, 'success');
        } else {
          toast('🎉 Welcome to Velocity!', 'success');
        }
        
        // Clear pending invite
        Store.pendingInvite = null;
        
        // Emit success event
        Events.emit(EVENTS.INVITE_REDEEMED, {
          code: inviteData.code,
          bonus: result.bonusGranted
        });
        
        // Navigate to main app
        this.navigateToApp();
        
      } else {
        toast(result.message || 'Failed to redeem invite', 'error');
      }
      
    } catch (error) {
      console.error('Failed to complete invite redemption:', error);
      
      // Still grant offline bonus
      Store.invites.left += inviteData.bonusInvites || 5;
      Store.invites.totalGranted += inviteData.bonusInvites || 5;
      
      toast('🎉 Welcome to Velocity! (Offline - will sync later)', 'success');
      
      Events.emit(EVENTS.INVITE_REDEEMED, {
        code: inviteData.code,
        bonus: inviteData.bonusInvites || 5,
        offline: true
      });
      
      this.navigateToApp();
    }
  }

  // Reject the invite
  rejectInvite() {
    console.log('❌ Invite rejected');
    Store.pendingInvite = null;
    this.navigateToApp();
  }

  // Navigate to main app and clear invite URL
  navigateToApp() {
    // Clean up URL
    const cleanUrl = new URL(window.location);
    cleanUrl.pathname = '/';
    cleanUrl.search = '';
    
    // Update URL without reload
    window.history.replaceState({}, '', cleanUrl);
    
    // Emit navigation event
    Events.emit('navigate', { route: 'parties' });
  }
}

// Create singleton instance
const inviteManager = new InviteManager();

// Check for invite on page load
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure all systems are initialized
  setTimeout(() => {
    inviteManager.handleInviteRedemption();
  }, 100);
});

// Export for use in other modules
export default inviteManager;
export { InviteManager };

// Add invite modal styles
const inviteStyles = `
.invite-modal {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.invite-modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(10, 14, 19, 0.95);
  backdrop-filter: blur(10px);
}

.invite-modal-content {
  position: relative;
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 2.5rem;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.3s ease;
  text-align: center;
}

.invite-modal-show {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.invite-modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  font-size: 1.5rem;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.invite-modal-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.invite-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.invite-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  color: #fff;
}

.invite-message {
  color: #cbd5e1;
  font-size: 1.1rem;
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
}

.invite-quote {
  background: rgba(255, 255, 255, 0.05);
  border-left: 3px solid var(--accent);
  padding: 1rem;
  margin: 1.5rem 0;
  font-style: italic;
  color: #e2e8f0;
  border-radius: 8px;
}

.invite-benefits {
  text-align: left;
  margin: 2rem 0;
}

.benefit {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0;
  color: #e2e8f0;
}

.benefit-emoji {
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
  color: #64748b;
  font-size: 0.875rem;
  margin: 1rem 0 0 0;
}

.invite-invalid .invite-icon {
  color: #ef4444;
}

.invite-error-details {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  padding: 1rem;
  margin: 1.5rem 0;
  text-align: left;
  color: #fca5a5;
}

.invite-error-details ul {
  margin: 0.5rem 0 0 1.5rem;
  padding: 0;
}

@media (max-width: 480px) {
  .invite-modal-content {
    padding: 1.5rem;
    margin: 1rem;
  }
  
  .invite-title {
    font-size: 1.5rem;
  }
  
  .invite-message {
    font-size: 1rem;
  }
}
`;

// Inject styles if not already present
if (!document.querySelector('#invite-modal-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'invite-modal-styles';
  styleElement.textContent = inviteStyles;
  document.head.appendChild(styleElement);
}