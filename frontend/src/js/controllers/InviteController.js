/**
 * INVITE CONTROLLER
 * Manages the exclusive invite system for professional networking
 */

import { BaseController } from './BaseController.js?v=b021';
import { Store } from '../store.js?v=b021';
import { api } from '../services/api.js?v=b021';

export class InviteController extends BaseController {
  constructor(element) {
    super(element, { name: 'invite' });
    
    this.state = {
      myCode: '',
      remaining: 10,
      sent: [],
      received: null,
      pendingInvite: null,
      shareMethod: 'link',
      qrCodeUrl: null
    };
  }

  /**
   * Initialize controller
   */
  async onInit() {
    this.loadInviteData();
    this.checkUrlInvite();
    this.setupInviteHandlers();
  }

  /**
   * Load invite data from store
   */
  loadInviteData() {
    const invites = Store.get('invites') || {};
    
    if (!invites.myCode) {
      invites.myCode = this.generateInviteCode();
      invites.remaining = 10;
      invites.sent = [];
      Store.patch('invites', invites);
    }
    
    this.setState({
      myCode: invites.myCode,
      remaining: invites.remaining,
      sent: invites.sent || [],
      received: invites.received
    });
  }

  /**
   * Check URL for invite code
   */
  checkUrlInvite() {
    const params = new URLSearchParams(window.location.search);
    const inviteCode = params.get('invite');
    
    if (inviteCode && !this.state.received) {
      this.setState({ pendingInvite: inviteCode });
      this.showAcceptInvitePrompt(inviteCode);
    }
  }

  /**
   * Setup invite handlers
   */
  setupInviteHandlers() {
    this.on('invite:send', ({ target }) => {
      this.sendInvite(target);
    });
    
    this.on('invite:accept', ({ code }) => {
      this.acceptInvite(code);
    });
    
    this.on('invite:share', ({ method }) => {
      this.shareInvite(method);
    });
  }

  /**
   * Generate unique invite code
   */
  generateInviteCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      if (i === 4) code += '-';
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Send invite to target
   */
  async sendInvite(target) {
    if (this.state.remaining <= 0) {
      this.notify('No invites remaining', 'warning');
      return;
    }
    
    try {
      const inviteData = {
        code: this.state.myCode,
        target,
        timestamp: Date.now()
      };
      
      // Send via API if email
      if (target.includes('@')) {
        await api.sendInvite({
          code: this.state.myCode,
          email: target
        });
        this.notify('Invite sent via email!', 'success');
      } else {
        // Track manual share
        this.notify('Invite link copied!', 'success');
      }
      
      // Update state
      const sent = [...this.state.sent, inviteData];
      const remaining = this.state.remaining - 1;
      
      Store.patch('invites.sent', sent);
      Store.patch('invites.remaining', remaining);
      
      this.setState({ sent, remaining });
      
    } catch (error) {
      this.handleError(error);
      this.notify('Failed to send invite', 'error');
    }
  }

  /**
   * Accept an invite code
   */
  async acceptInvite(code) {
    try {
      // Validate with API
      const response = await api.validateInvite(code);
      
      if (response.valid) {
        Store.patch('invites.received', code);
        Store.patch('profile.invitedBy', response.inviterId);
        Store.patch('profile.onboarded', true);
        
        this.setState({ received: code, pendingInvite: null });
        
        this.notify('Welcome to Professional Intelligence! 🎉', 'success');
        this.emit('onboarding:complete', { inviteCode: code });
        
        // Navigate to home
        this.emit('navigate', { route: '/home' });
      } else {
        this.notify('Invalid or expired invite code', 'error');
      }
    } catch (error) {
      this.handleError(error);
      this.notify('Failed to validate invite', 'error');
    }
  }

  /**
   * Share invite via different methods
   */
  async shareInvite(method) {
    const inviteUrl = `${window.location.origin}?invite=${this.state.myCode}`;
    
    try {
      switch (method) {
        case 'link':
          await navigator.clipboard.writeText(inviteUrl);
          this.notify('Invite link copied!', 'success');
          break;
          
        case 'share':
          if (navigator.share) {
            await navigator.share({
              title: 'Join Professional Intelligence',
              text: `You're invited! Use code: ${this.state.myCode}`,
              url: inviteUrl
            });
          } else {
            await navigator.clipboard.writeText(inviteUrl);
            this.notify('Invite link copied!', 'success');
          }
          break;
          
        case 'qr':
          this.generateQRCode(inviteUrl);
          break;
          
        case 'email':
          const mailto = `mailto:?subject=You're invited to Professional Intelligence&body=Join the exclusive professional network with my invite code: ${this.state.myCode}%0A%0A${inviteUrl}`;
          window.location.href = mailto;
          break;
      }
      
      this.setState({ shareMethod: method });
      
    } catch (error) {
      this.handleError(error);
      this.notify('Failed to share invite', 'error');
    }
  }

  /**
   * Generate QR code for invite
   */
  generateQRCode(url) {
    // Use QR code API service
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
    this.setState({ qrCodeUrl: qrUrl });
  }

  /**
   * Show accept invite prompt
   */
  showAcceptInvitePrompt(code) {
    Store.actions.openModal({
      type: 'accept-invite',
      data: {
        code,
        onAccept: () => this.acceptInvite(code),
        onDecline: () => this.setState({ pendingInvite: null })
      }
    });
  }

  /**
   * Action handlers
   */
  actionCopyCode() {
    navigator.clipboard.writeText(this.state.myCode);
    this.notify('Code copied!', 'success');
  }

  actionShareLink() {
    this.shareInvite('link');
  }

  actionShareQR() {
    this.shareInvite('qr');
  }

  actionShareEmail() {
    this.shareInvite('email');
  }

  actionSendInvite(e, target) {
    const input = this.$('#invite-target');
    if (input && input.value) {
      this.sendInvite(input.value);
      input.value = '';
    }
  }

  /**
   * Template for rendering
   */
  template(data) {
    const { myCode, remaining, sent, received, qrCodeUrl } = data;
    
    return `
      <div class="invite-controller">
        <div class="invite-header">
          <h2>Exclusive Invites</h2>
          <p class="invite-subtitle">Share access to the professional network</p>
        </div>
        
        ${received ? `
          <div class="invite-received">
            <span class="badge success">Invited by ${received}</span>
          </div>
        ` : ''}
        
        <div class="invite-stats">
          <div class="stat">
            <span class="stat-value">${remaining}</span>
            <span class="stat-label">Invites Left</span>
          </div>
          <div class="stat">
            <span class="stat-value">${sent.length}</span>
            <span class="stat-label">Sent</span>
          </div>
          <div class="stat">
            <span class="stat-value">${10 - remaining}</span>
            <span class="stat-label">Used</span>
          </div>
        </div>
        
        <div class="invite-code-section">
          <label>Your Invite Code</label>
          <div class="code-display">
            <code class="invite-code">${myCode}</code>
            <button data-action="copyCode" class="copy-btn">
              Copy
            </button>
          </div>
        </div>
        
        <div class="invite-share-methods">
          <button data-action="shareLink" class="share-btn">
            🔗 Copy Link
          </button>
          <button data-action="shareQR" class="share-btn">
            📱 QR Code
          </button>
          <button data-action="shareEmail" class="share-btn">
            ✉️ Email
          </button>
          ${navigator.share ? `
            <button data-action="share" class="share-btn">
              📤 Share
            </button>
          ` : ''}
        </div>
        
        ${qrCodeUrl ? `
          <div class="qr-code-display">
            <img src="${qrCodeUrl}" alt="Invite QR Code" />
            <p>Scan to join with your invite</p>
          </div>
        ` : ''}
        
        ${remaining > 0 ? `
          <div class="invite-send-form">
            <h3>Send Direct Invite</h3>
            <div class="input-group">
              <input 
                type="text" 
                id="invite-target"
                placeholder="Email or username"
                class="invite-input"
              />
              <button data-action="sendInvite" class="send-btn">
                Send
              </button>
            </div>
          </div>
        ` : `
          <div class="no-invites">
            <p>You've used all your invites!</p>
            <p class="hint">Quality over quantity - make them count 🎯</p>
          </div>
        `}
        
        ${sent.length > 0 ? `
          <div class="invite-history">
            <h3>Sent Invites</h3>
            <ul class="sent-list">
              ${sent.slice(-5).reverse().map(invite => `
                <li class="sent-item">
                  <span class="sent-target">${invite.target}</span>
                  <span class="sent-time">${this.formatDate(invite.timestamp)}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
        
        <div class="invite-info">
          <h4>About Invites</h4>
          <ul>
            <li>Each member gets 10 exclusive invites</li>
            <li>Invites ensure quality networking</li>
            <li>Your invitees join your professional tree</li>
            <li>Track your network's growth over time</li>
          </ul>
        </div>
      </div>
    `;
  }

  /**
   * Store subscriptions
   */
  setupStoreSubscriptions() {
    this.subscribe('invites', (invites) => {
      if (invites) {
        this.setState({
          myCode: invites.myCode,
          remaining: invites.remaining,
          sent: invites.sent || [],
          received: invites.received
        });
      }
    });
  }
}

export default InviteController;