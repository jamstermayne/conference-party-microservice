// Invite Deep Link Handler
import Events from './foundation/events.js';
import Store from './foundation/store.js';

class InviteDeeplink {
  constructor() {
    this.init();
  }

  init() {
    this.checkForInvite();
    this.bindEvents();
  }

  checkForInvite() {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCode = urlParams.get('invite') || urlParams.get('i');
    const referrer = urlParams.get('ref') || urlParams.get('r');
    
    // Check for invite in path
    const pathInvite = this.extractInviteFromPath();
    
    const finalInvite = inviteCode || pathInvite;
    
    if (finalInvite) {
      this.handleInvite(finalInvite, referrer);
    }
  }

  extractInviteFromPath() {
    const path = window.location.pathname;
    
    // Handle /invite/CODE pattern
    const inviteMatch = path.match(/\/invite\/([a-zA-Z0-9-_]+)/);
    if (inviteMatch) return inviteMatch[1];
    
    // Handle /i/CODE pattern
    const shortMatch = path.match(/\/i\/([a-zA-Z0-9-_]+)/);
    if (shortMatch) return shortMatch[1];
    
    return null;
  }

  async handleInvite(inviteCode, referrer = null) {
    try {
      // Store invite data
      Store.set('invite.pending', {
        code: inviteCode,
        referrer,
        timestamp: Date.now(),
        url: window.location.href
      });

      // Validate invite code
      const inviteData = await this.validateInvite(inviteCode);
      
      if (inviteData.valid) {
        await this.processValidInvite(inviteData, referrer);
      } else {
        this.showInvalidInvite(inviteCode);
      }

    } catch (error) {
      console.error('Invite processing error:', error);
      this.showInviteError(error.message);
    }
  }

  async validateInvite(inviteCode) {
    // Mock validation - replace with actual API call
    try {
      const response = await fetch(`/api/invites/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode })
      });
      
      if (!response.ok) {
        throw new Error(`Validation failed: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      // Fallback validation for demo
      return {
        valid: this.isValidInviteFormat(inviteCode),
        eventId: 'demo-event',
        eventName: 'Tech Leaders Networking Party',
        inviterName: 'John Doe',
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
      };
    }
  }

  isValidInviteFormat(code) {
    // Basic format validation
    return /^[a-zA-Z0-9-_]{6,32}$/.test(code);
  }

  async processValidInvite(inviteData, referrer) {
    const { code, eventId, eventName, inviterName, expiresAt } = inviteData;
    
    // Store validated invite
    Store.set('invite.validated', {
      code,
      eventId,
      eventName,
      inviterName,
      expiresAt,
      referrer,
      validatedAt: Date.now()
    });

    // Show invite welcome
    this.showInviteWelcome(inviteData);
    
    // Navigate to relevant page
    this.navigateToInvite(inviteData);
    
    // Track invite click
    Events.emit('metrics:track', {
      event: 'invite_clicked',
      properties: {
        inviteCode: code,
        eventId,
        referrer,
        hasAuth: !!Store.get('auth.user')
      }
    });

    // Clean up URL
    this.cleanUpUrl();
  }

  showInviteWelcome(inviteData) {
    const { eventName, inviterName } = inviteData;
    
    Events.emit('ui:toast', {
      title: 'You\'re Invited!',
      message: `${inviterName} invited you to ${eventName}`,
      type: 'info',
      duration: 8000,
      actions: [
        {
          label: 'View Event',
          primary: true,
          handler: () => this.navigateToEvent(inviteData.eventId)
        }
      ]
    });
  }

  showInvalidInvite(code) {
    Events.emit('ui:toast', {
      title: 'Invalid Invite',
      message: 'This invite link is invalid or has expired.',
      type: 'warning',
      duration: 6000
    });

    // Track invalid invite
    Events.emit('metrics:track', {
      event: 'invite_invalid',
      properties: { inviteCode: code }
    });
  }

  showInviteError(message) {
    Events.emit('ui:toast', {
      title: 'Invite Error',
      message: `Unable to process invite: ${message}`,
      type: 'error',
      duration: 8000
    });
  }

  navigateToInvite(inviteData) {
    // Navigate to the event or parties page
    setTimeout(() => {
      if (inviteData.eventId) {
        Events.emit('navigate', `parties?event=${inviteData.eventId}`);
      } else {
        Events.emit('navigate', 'parties');
      }
    }, 2000);
  }

  navigateToEvent(eventId) {
    Events.emit('navigate', `parties?event=${eventId}`);
  }

  cleanUpUrl() {
    // Remove invite parameters from URL without page reload
    const url = new URL(window.location);
    url.searchParams.delete('invite');
    url.searchParams.delete('i');
    url.searchParams.delete('ref');
    url.searchParams.delete('r');
    
    // Only update if URL actually changed
    if (url.href !== window.location.href) {
      history.replaceState(null, '', url.href);
    }
  }

  bindEvents() {
    // Handle invite-related actions
    Events.on('action:accept-invite', (data) => this.acceptInvite(data.code));
    Events.on('action:decline-invite', (data) => this.declineInvite(data.code));
    
    // Handle auth completion with pending invite
    Events.on('auth:success', () => this.processPendingInvite());
  }

  async acceptInvite(code) {
    const validatedInvite = Store.get('invite.validated');
    if (!validatedInvite || validatedInvite.code !== code) {
      this.showInviteError('Invite not found');
      return;
    }

    try {
      // Accept the invite
      const response = await fetch('/api/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      if (response.ok) {
        Store.set('invite.accepted', { ...validatedInvite, acceptedAt: Date.now() });
        Store.set('invite.validated', null);
        
        Events.emit('ui:toast', {
          message: 'Invite accepted! Event added to your calendar.',
          type: 'success'
        });
        
        // Track acceptance
        Events.emit('metrics:track', {
          event: 'invite_accepted',
          properties: { inviteCode: code, eventId: validatedInvite.eventId }
        });
      }
    } catch (error) {
      this.showInviteError('Failed to accept invite');
    }
  }

  declineInvite(code) {
    Store.set('invite.validated', null);
    Store.set('invite.pending', null);
    
    Events.emit('ui:toast', {
      message: 'Invite declined',
      type: 'info'
    });

    // Track decline
    Events.emit('metrics:track', {
      event: 'invite_declined',
      properties: { inviteCode: code }
    });
  }

  processPendingInvite() {
    const pending = Store.get('invite.pending');
    if (pending && !Store.get('invite.validated')) {
      // Re-process the invite now that user is authenticated
      this.handleInvite(pending.code, pending.referrer);
    }
  }

  // Public API
  getPendingInvite() {
    return Store.get('invite.pending');
  }

  getValidatedInvite() {
    return Store.get('invite.validated');
  }

  hasInvite() {
    return !!(Store.get('invite.pending') || Store.get('invite.validated'));
  }
}

// Initialize invite deeplink handler
const inviteDeeplink = new InviteDeeplink();

// Expose for external use
window.InviteDeeplink = inviteDeeplink;

export default inviteDeeplink;