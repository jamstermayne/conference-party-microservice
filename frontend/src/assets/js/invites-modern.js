/**
 * Modern Invites System
 * Enhanced UI with glass morphism and smooth interactions
 */

import { InvitesClient } from './services/invites-client.js';

class ModernInvitesPanel {
  constructor() {
    this.panel = null;
    this.invites = [];
    this.isLoading = false;
  }

  init() {
    this.createPanel();
    this.bindEvents();
    this.setupHashListener();
  }

  createPanel() {
    if (document.getElementById('panel-invites')) return;

    this.panel = document.createElement('section');
    this.panel.id = 'panel-invites';
    this.panel.className = 'panel panel--overlay';
    this.panel.innerHTML = `
      <div class="invites-header">
        <h1>Invitations</h1>
        <button class="btn-new-invite" data-action="new-invite">
          New Invite
        </button>
      </div>
      <div class="invites-list" id="invites-list">
        <div class="invites-loading">Loading invitations...</div>
      </div>
    `;

    document.body.appendChild(this.panel);
  }

  bindEvents() {
    // Delegate click events
    this.panel.addEventListener('click', async (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;

      const action = target.dataset.action;
      const card = target.closest('.invite-card');
      const inviteId = card?.dataset.id;

      switch (action) {
        case 'new-invite':
          await this.showNewInviteDialog();
          break;
        case 'accept':
          await this.updateStatus(inviteId, 'accepted');
          break;
        case 'maybe':
          await this.updateStatus(inviteId, 'maybe');
          break;
        case 'decline':
          await this.updateStatus(inviteId, 'declined');
          break;
        case 'delete':
          await this.deleteInvite(inviteId);
          break;
      }
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isActive()) {
        this.close();
      }
    });
  }

  setupHashListener() {
    const checkHash = () => {
      const shouldShow = location.hash === '#/invites';
      if (shouldShow && !this.isActive()) {
        this.open();
      } else if (!shouldShow && this.isActive()) {
        this.close();
      }
    };

    window.addEventListener('hashchange', checkHash);
    checkHash();
  }

  async open() {
    this.panel.classList.add('panel--active');
    await this.loadInvites();
  }

  close() {
    this.panel.classList.remove('panel--active');
  }

  isActive() {
    return this.panel.classList.contains('panel--active');
  }

  async loadInvites() {
    if (this.isLoading) return;
    this.isLoading = true;

    const listEl = document.getElementById('invites-list');
    listEl.innerHTML = '<div class="invites-loading">Loading invitations...</div>';

    try {
      const response = await InvitesClient.list();
      this.invites = response.invites || [];
      this.render();
    } catch (error) {
      console.error('Failed to load invites:', error);
      this.invites = this.getMockInvites(); // Use mock data for demo
      this.render();
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    const listEl = document.getElementById('invites-list');
    
    if (this.invites.length === 0) {
      listEl.innerHTML = this.renderEmptyState();
      return;
    }

    listEl.innerHTML = this.invites.map(invite => this.renderInviteCard(invite)).join('');
  }

  renderInviteCard(invite) {
    const initial = (invite.toEmail || 'U')[0].toUpperCase();
    const dateStr = this.formatDate(invite.event?.start);
    const statusEmoji = {
      accepted: '✅',
      declined: '❌',
      maybe: '🤔',
      pending: '⏳'
    }[invite.status] || '⏳';

    return `
      <div class="invite-card" data-id="${invite.id}" data-status="${invite.status}">
        <div class="invite-status" data-status="${invite.status}">
          ${statusEmoji} ${invite.status}
        </div>
        
        <header>
          <h3>${this.escapeHtml(invite.event?.title || 'Untitled Event')}</h3>
          <div class="invite-meta">
            ${dateStr ? `
              <div class="invite-meta-item">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
                </svg>
                <time datetime="${invite.event.start}">${dateStr}</time>
              </div>
            ` : ''}
            ${invite.event?.location ? `
              <div class="invite-meta-item">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                </svg>
                <span class="loc">${this.escapeHtml(invite.event.location)}</span>
              </div>
            ` : ''}
          </div>
        </header>

        <div class="invite-recipient">
          <div class="invite-recipient-avatar">${initial}</div>
          <div class="invite-recipient-info">
            <div class="invite-recipient-label">Invited</div>
            <div class="invite-recipient-email">${this.escapeHtml(invite.toEmail)}</div>
          </div>
        </div>

        <div class="invite-actions">
          <button class="invite-action-btn" data-action="accept" data-status="accepted">
            <span class="invite-action-icon">✅</span>
            Accept
          </button>
          <button class="invite-action-btn" data-action="maybe" data-status="maybe">
            <span class="invite-action-icon">🤔</span>
            Maybe
          </button>
          <button class="invite-action-btn" data-action="decline" data-status="declined">
            <span class="invite-action-icon">❌</span>
            Decline
          </button>
        </div>

        <button class="invite-delete-btn" data-action="delete" title="Delete invite">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>
    `;
  }

  renderEmptyState() {
    return `
      <div class="invites-empty">
        <div class="invites-empty-icon">📮</div>
        <h2 class="invites-empty-title">No Invitations Yet</h2>
        <p class="invites-empty-text">
          Start by creating your first event invitation
        </p>
        <button class="btn-new-invite" data-action="new-invite">
          Create First Invite
        </button>
      </div>
    `;
  }

  async showNewInviteDialog() {
    // Create a modern dialog
    const dialog = document.createElement('div');
    dialog.className = 'invite-dialog';
    dialog.innerHTML = `
      <div class="invite-dialog-content">
        <h2>Create New Invitation</h2>
        <form id="new-invite-form">
          <div class="form-group">
            <label for="invite-email">Recipient Email</label>
            <input type="email" id="invite-email" required placeholder="friend@example.com">
          </div>
          <div class="form-group">
            <label for="invite-title">Event Title</label>
            <input type="text" id="invite-title" required placeholder="Gamescom Party 2025">
          </div>
          <div class="form-group">
            <label for="invite-date">Date & Time</label>
            <input type="datetime-local" id="invite-date">
          </div>
          <div class="form-group">
            <label for="invite-location">Location</label>
            <input type="text" id="invite-location" placeholder="Koelnmesse, Cologne">
          </div>
          <div class="form-group">
            <label for="invite-description">Description</label>
            <textarea id="invite-description" rows="3" placeholder="Join us for an amazing party..."></textarea>
          </div>
          <div class="dialog-actions">
            <button type="button" class="btn-cancel">Cancel</button>
            <button type="submit" class="btn-send">Send Invitation</button>
          </div>
        </form>
      </div>
    `;

    // Add styles for dialog
    const style = document.createElement('style');
    style.textContent = `
      .invite-dialog {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        padding: 20px;
      }
      .invite-dialog-content {
        background: linear-gradient(135deg, rgba(20, 20, 40, 0.98), rgba(30, 20, 50, 0.98));
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 24px;
        max-width: 480px;
        width: 100%;
        backdrop-filter: blur(30px);
      }
      .invite-dialog h2 {
        margin: 0 0 20px;
        color: white;
        font-size: 20px;
      }
      .form-group {
        margin-bottom: 16px;
      }
      .form-group label {
        display: block;
        margin-bottom: 6px;
        color: rgba(255, 255, 255, 0.7);
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .form-group input,
      .form-group textarea {
        width: 100%;
        padding: 12px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: white;
        font-size: 15px;
      }
      .form-group input:focus,
      .form-group textarea:focus {
        outline: none;
        border-color: rgba(139, 92, 246, 0.5);
        background: rgba(255, 255, 255, 0.08);
      }
      .dialog-actions {
        display: flex;
        gap: 12px;
        margin-top: 24px;
      }
      .btn-cancel {
        flex: 1;
        padding: 12px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: rgba(255, 255, 255, 0.8);
        cursor: pointer;
      }
      .btn-send {
        flex: 1;
        padding: 12px;
        background: linear-gradient(135deg, #8b5cf6, #ec4899);
        border: none;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(dialog);

    // Handle form submission
    const form = document.getElementById('new-invite-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const event = {
        title: document.getElementById('invite-title').value,
        start: document.getElementById('invite-date').value || null,
        location: document.getElementById('invite-location').value || null,
        description: document.getElementById('invite-description').value || null
      };

      try {
        await InvitesClient.create({
          toEmail: document.getElementById('invite-email').value,
          event
        });
        await this.loadInvites();
        dialog.remove();
        style.remove();
      } catch (error) {
        console.error('Failed to create invite:', error);
        alert('Failed to create invitation. Please try again.');
      }
    });

    // Handle cancel
    dialog.querySelector('.btn-cancel').addEventListener('click', () => {
      dialog.remove();
      style.remove();
    });

    // Close on backdrop click
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        dialog.remove();
        style.remove();
      }
    });
  }

  async updateStatus(inviteId, status) {
    try {
      await InvitesClient.rsvp(inviteId, status);
      await this.loadInvites();
    } catch (error) {
      console.error('Failed to update status:', error);
      // Update locally for demo
      const invite = this.invites.find(i => i.id === inviteId);
      if (invite) {
        invite.status = status;
        this.render();
      }
    }
  }

  async deleteInvite(inviteId) {
    if (!confirm('Delete this invitation?')) return;

    try {
      await InvitesClient.remove(inviteId);
      await this.loadInvites();
    } catch (error) {
      console.error('Failed to delete invite:', error);
      // Remove locally for demo
      this.invites = this.invites.filter(i => i.id !== inviteId);
      this.render();
    }
  }

  formatDate(iso) {
    if (!iso) return '';
    try {
      const date = new Date(iso);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  getMockInvites() {
    return [
      {
        id: 'mock-1',
        toEmail: 'john@gamedev.com',
        status: 'accepted',
        event: {
          title: 'Xbox @ Gamescom Party',
          start: '2025-08-20T19:00:00',
          location: 'Lanxess Arena, Cologne',
          description: 'Exclusive Xbox showcase and networking'
        }
      },
      {
        id: 'mock-2',
        toEmail: 'sarah@studio.com',
        status: 'pending',
        event: {
          title: 'Indie MEGABOOTH Mixer',
          start: '2025-08-22T20:00:00',
          location: 'Die Halle Tor 2',
          description: 'Celebrate indie gaming with developers'
        }
      },
      {
        id: 'mock-3',
        toEmail: 'mike@publisher.com',
        status: 'maybe',
        event: {
          title: 'PlayStation Showcase',
          start: '2025-08-21T18:00:00',
          location: 'Musical Dome',
          description: 'PlayStation exclusive titles preview'
        }
      }
    ];
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.modernInvites = new ModernInvitesPanel();
    window.modernInvites.init();
  });
} else {
  window.modernInvites = new ModernInvitesPanel();
  window.modernInvites.init();
}

// Export for module usage
export default ModernInvitesPanel;