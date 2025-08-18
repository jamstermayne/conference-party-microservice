/**
 * 🎮 GAMESCOM 2025 - ENHANCED INVITE SHARING UI
 * 
 * Comprehensive sharing interface with multiple platforms
 * PWA-optimized with native sharing support
 */

import { sendInvite, refreshInviteStats } from './invite-enhanced.js';
import { Store, Events } from './state.js';

export class InviteSharingModal {
  constructor() {
    this.modal = null;
    this.isVisible = false;
    this.platforms = [
      { id: 'native', name: 'Share...', icon: '📤', description: 'Use device share menu' },
      { id: 'copy', name: 'Copy Link', icon: '🔗', description: 'Copy to clipboard' },
      { id: 'whatsapp', name: 'WhatsApp', icon: '💬', description: 'Share via WhatsApp' },
      { id: 'twitter', name: 'Twitter', icon: '🐦', description: 'Tweet your invite' },
      { id: 'telegram', name: 'Telegram', icon: '✈️', description: 'Share in Telegram' },
      { id: 'discord', name: 'Discord', icon: '🎮', description: 'Copy for Discord' },
      { id: 'email', name: 'Email', icon: '📧', description: 'Send via email' },
      { id: 'sms', name: 'SMS', icon: '📱', description: 'Send text message' }
    ];
  }

  init() {
    this.createModal();
    this.bindEvents();
  }

  createModal() {
    if (document.getElementById('invite-sharing-modal')) return;

    this.modal = document.createElement('div');
    this.modal.id = 'invite-sharing-modal';
    this.modal.className = 'modal-overlay invite-sharing-modal';
    this.modal.innerHTML = `
      <div class="modal-content invite-sharing-content">
        <!-- Header -->
        <div class="modal-header">
          <div class="modal-title">
            <h2>🎉 Share Your Invite</h2>
            <p>Invite friends to exclusive Gamescom 2025 parties</p>
          </div>
          <button class="modal-close-btn" data-action="close-modal" aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <!-- Invite Stats -->
        <div class="invite-stats-summary">
          <div class="stats-item">
            <span class="stats-number" data-role="remaining-count">--</span>
            <span class="stats-label">Invites Left</span>
          </div>
          <div class="stats-item">
            <span class="stats-number" data-role="sent-count">--</span>
            <span class="stats-label">Sent</span>
          </div>
          <div class="stats-item">
            <span class="stats-number" data-role="redeemed-count">--</span>
            <span class="stats-label">Redeemed</span>
          </div>
        </div>

        <!-- Quick Share Input -->
        <div class="quick-share-section">
          <h3>Quick Share</h3>
          <div class="share-input-group">
            <input 
              type="text" 
              class="share-input" 
              placeholder="Enter email or select platform below"
              data-input="quick-share">
            <button class="share-quick-btn" data-action="quick-share">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z"/>
              </svg>
              Send
            </button>
          </div>
        </div>

        <!-- Platform Grid -->
        <div class="sharing-platforms">
          <h3>Choose Platform</h3>
          <div class="platforms-grid" data-platforms-grid>
            ${this.platforms.map(platform => `
              <button class="platform-btn" data-platform="${platform.id}" data-action="share-platform">
                <div class="platform-icon">${platform.icon}</div>
                <div class="platform-info">
                  <div class="platform-name">${platform.name}</div>
                  <div class="platform-description">${platform.description}</div>
                </div>
                ${platform.id === 'native' && !navigator.share ? '<div class="platform-badge">Not Available</div>' : ''}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Advanced Options -->
        <div class="advanced-options" data-advanced-options style="display: none;">
          <h3>Advanced Settings</h3>
          <div class="option-group">
            <label class="option-label">
              <input type="checkbox" data-option="personal-message" checked>
              Include personal message
            </label>
            <label class="option-label">
              <input type="checkbox" data-option="track-usage" checked>
              Track invite usage
            </label>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="modal-footer">
          <button class="btn-secondary" data-action="toggle-advanced">
            ⚙️ Advanced Options
          </button>
          <button class="btn-secondary" data-action="view-sent-invites">
            📊 View Sent Invites
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);
  }

  bindEvents() {
    if (!this.modal) return;

    // Close modal events
    this.modal.querySelector('[data-action="close-modal"]').addEventListener('click', () => {
      this.hide();
    });

    // Close on backdrop click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });

    // Platform sharing
    this.modal.addEventListener('click', async (e) => {
      const platformBtn = e.target.closest('[data-platform]');
      if (platformBtn) {
        const platform = platformBtn.dataset.platform;
        await this.handlePlatformShare(platform);
      }

      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action) {
        await this.handleAction(action, e);
      }
    });

    // Quick share input
    const quickShareInput = this.modal.querySelector('[data-input="quick-share"]');
    quickShareInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleQuickShare();
      }
    });
  }

  async handleAction(action, event) {
    switch (action) {
      case 'quick-share':
        await this.handleQuickShare();
        break;
      case 'toggle-advanced':
        this.toggleAdvancedOptions();
        break;
      case 'view-sent-invites':
        this.showSentInvites();
        break;
    }
  }

  async handleQuickShare() {
    const input = this.modal.querySelector('[data-input="quick-share"]');
    const target = input.value.trim();
    
    if (!target) {
      Events.emit('ui:toast', { type: 'warning', message: 'Please enter an email or select a platform' });
      return;
    }

    // Auto-detect share method
    let method = 'copy';
    if (target.includes('@')) {
      method = 'email';
    } else if (target.includes('discord')) {
      method = 'discord';
    }

    try {
      await sendInvite(target, method);
      input.value = '';
      this.updateStats();
      Events.emit('ui:toast', { type: 'success', message: '🎉 Invite sent successfully!' });
    } catch (error) {
      Events.emit('ui:toast', { type: 'error', message: error.message });
    }
  }

  async handlePlatformShare(platform) {
    // Check if platform is available
    if (platform === 'native' && !navigator.share) {
      Events.emit('ui:toast', { type: 'warning', message: 'Native sharing not available on this device' });
      return;
    }

    try {
      const stats = Store.get('invites') || {};
      if (stats.remaining <= 0) {
        Events.emit('ui:toast', { type: 'error', message: 'No invites remaining' });
        return;
      }

      await sendInvite('', platform);
      this.updateStats();
      
      // Don't hide modal for copy actions
      if (!['copy', 'discord'].includes(platform)) {
        setTimeout(() => this.hide(), 1000);
      }
    } catch (error) {
      Events.emit('ui:toast', { type: 'error', message: error.message });
    }
  }

  toggleAdvancedOptions() {
    const advanced = this.modal.querySelector('[data-advanced-options]');
    const isVisible = advanced.style.display !== 'none';
    advanced.style.display = isVisible ? 'none' : 'block';
    
    const btn = this.modal.querySelector('[data-action="toggle-advanced"]');
    btn.textContent = isVisible ? '⚙️ Advanced Options' : '🔽 Hide Advanced';
  }

  showSentInvites() {
    const sentInvites = Store.get('sentInvites') || [];
    
    if (sentInvites.length === 0) {
      Events.emit('ui:toast', { type: 'info', message: 'No invites sent yet' });
      return;
    }

    // Create sent invites view
    const invitesList = sentInvites.map(invite => `
      <div class="sent-invite-item">
        <div class="invite-code">${invite.code}</div>
        <div class="invite-details">
          <span class="invite-method">${invite.method}</span>
          <span class="invite-date">${new Date(invite.sentAt).toLocaleDateString()}</span>
          <span class="invite-status ${invite.redeemed ? 'redeemed' : 'pending'}">
            ${invite.redeemed ? '✅ Redeemed' : '⏳ Pending'}
          </span>
        </div>
      </div>
    `).join('');

    // Show in modal
    const content = this.modal.querySelector('.modal-content');
    content.innerHTML = `
      <div class="modal-header">
        <h2>📊 Sent Invites (${sentInvites.length})</h2>
        <button class="modal-close-btn" data-action="back-to-share">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.42-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
      </div>
      <div class="sent-invites-list">
        ${invitesList}
      </div>
    `;

    // Bind back button
    content.querySelector('[data-action="back-to-share"]').addEventListener('click', () => {
      this.createModal();
      this.bindEvents();
      this.updateStats();
    });
  }

  updateStats() {
    if (!this.modal) return;

    const stats = Store.get('invites') || {};
    const sentInvites = Store.get('sentInvites') || [];
    const redeemedCount = sentInvites.filter(i => i.redeemed).length;

    const remaining = this.modal.querySelector('[data-role="remaining-count"]');
    const sent = this.modal.querySelector('[data-role="sent-count"]');
    const redeemed = this.modal.querySelector('[data-role="redeemed-count"]');

    if (remaining) remaining.textContent = stats.remaining || 0;
    if (sent) sent.textContent = sentInvites.length;
    if (redeemed) redeemed.textContent = redeemedCount;
  }

  show() {
    if (!this.modal) this.init();
    
    this.modal.style.display = 'flex';
    this.isVisible = true;
    this.updateStats();
    
    // Focus management
    requestAnimationFrame(() => {
      const firstInput = this.modal.querySelector('input, button');
      if (firstInput) firstInput.focus();
    });

    // Animate in
    requestAnimationFrame(() => {
      this.modal.classList.add('modal-visible');
    });
  }

  hide() {
    if (!this.modal) return;
    
    this.modal.classList.remove('modal-visible');
    this.isVisible = false;
    
    setTimeout(() => {
      this.modal.style.display = 'none';
    }, 300);
  }

  destroy() {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
    this.isVisible = false;
  }
}

// Global instance
export const inviteSharingModal = new InviteSharingModal();

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    inviteSharingModal.init();
  });
} else {
  inviteSharingModal.init();
}

// Listen for invite sharing events
Events.on('invite:share', () => {
  inviteSharingModal.show();
});

export default inviteSharingModal;