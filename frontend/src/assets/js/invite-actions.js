/**
 * Enhanced Invite Actions UI
 * Implements copy link, copy code, QR display, renew, and revoke
 */

class InviteActionsManager {
  constructor() {
    this.init();
  }

  init() {
    // Listen for click events on invite action buttons
    document.addEventListener('click', this.handleAction.bind(this));
  }

  async handleAction(e) {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;

    const id = btn.dataset.id;
    const act = btn.dataset.act;

    try {
      switch (act) {
        case 'copy-link':
          await this.copyLink(id);
          break;
        case 'copy-code':
          await this.copyCode(id);
          break;
        case 'show-qr':
          await this.showQR(id);
          break;
        case 'renew':
          await this.renewInvite(id);
          break;
        case 'revoke':
          await this.revokeInvite(id);
          break;
      }
    } catch (error) {
      console.error('[invite-actions] Error:', error);
      this.showToast('Action failed', 'error');
    }
  }

  async getShareInfo(id) {
    const response = await fetch(`/api/invites/${id}/share`, {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get share info: ${response.status}`);
    }
    
    return response.json();
  }

  async copyLink(id) {
    const { link } = await this.getShareInfo(id);
    await this.copyToClipboard(link);
    this.showToast('Invite link copied');
  }

  async copyCode(id) {
    const { code } = await this.getShareInfo(id);
    await this.copyToClipboard(code);
    this.showToast('Invite code copied');
  }

  async showQR(id) {
    const { link } = await this.getShareInfo(id);
    
    // Get QR code data URL
    const qrResponse = await fetch(`/api/qr?text=${encodeURIComponent(link)}`);
    const { dataUrl } = await qrResponse.json();
    
    // Show QR in modal
    this.openQRModal(dataUrl, link);
  }

  async renewInvite(id) {
    const response = await fetch(`/api/invites/${id}/renew`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to renew invite: ${response.status}`);
    }
    
    const { code, link } = await response.json();
    this.showToast('Old link & code disabled. New pair active.');
    
    // Update UI with new code if displayed
    this.updateInviteDisplay(id, { code, link });
  }

  async revokeInvite(id) {
    // Confirm revocation
    if (!confirm('Are you sure? This will immediately disable the invite.')) {
      return;
    }
    
    const response = await fetch(`/api/invites/${id}/revoke`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to revoke invite: ${response.status}`);
    }
    
    this.showToast('Invite disabled immediately');
    
    // Update UI to show revoked state
    this.markInviteRevoked(id);
  }

  async copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }

  showToast(message, type = 'success') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `invite-toast invite-toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: ${type === 'error' ? '#dc3545' : '#28a745'};
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      z-index: 10000;
      animation: slideInUp 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.animation = 'slideOutDown 0.3s ease';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }

  openQRModal(dataUrl, link) {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'invite-qr-modal';
    modal.innerHTML = `
      <div class="invite-qr-modal-backdrop"></div>
      <div class="invite-qr-modal-content">
        <h3>Scan to RSVP</h3>
        <img src="${dataUrl}" alt="QR Code" class="invite-qr-image">
        <p class="invite-qr-link">${link}</p>
        <button class="invite-qr-close">Close</button>
      </div>
    `;
    
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    const backdrop = modal.querySelector('.invite-qr-modal-backdrop');
    backdrop.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
    `;
    
    const content = modal.querySelector('.invite-qr-modal-content');
    content.style.cssText = `
      position: relative;
      background: white;
      padding: 30px;
      border-radius: 8px;
      text-align: center;
      max-width: 400px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    `;
    
    const qrImage = modal.querySelector('.invite-qr-image');
    qrImage.style.cssText = `
      width: 250px;
      height: 250px;
      margin: 20px 0;
    `;
    
    const closeBtn = modal.querySelector('.invite-qr-close');
    closeBtn.style.cssText = `
      background: #007bff;
      color: white;
      border: none;
      padding: 10px 30px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      margin-top: 20px;
    `;
    
    // Add close handlers
    backdrop.addEventListener('click', () => document.body.removeChild(modal));
    closeBtn.addEventListener('click', () => document.body.removeChild(modal));
    
    document.body.appendChild(modal);
  }

  updateInviteDisplay(id, { code, link }) {
    // Update any displayed code or link in the UI
    const inviteElement = document.querySelector(`[data-invite-id="${id}"]`);
    if (inviteElement) {
      const codeElement = inviteElement.querySelector('.invite-code');
      if (codeElement) {
        codeElement.textContent = code;
      }
      
      const linkElement = inviteElement.querySelector('.invite-link');
      if (linkElement) {
        linkElement.href = link;
        linkElement.textContent = link;
      }
    }
  }

  markInviteRevoked(id) {
    const inviteElement = document.querySelector(`[data-invite-id="${id}"]`);
    if (inviteElement) {
      inviteElement.classList.add('invite-revoked');
      inviteElement.style.opacity = '0.5';
      
      // Disable all action buttons
      const buttons = inviteElement.querySelectorAll('[data-act]');
      buttons.forEach(btn => {
        btn.disabled = true;
        btn.style.cursor = 'not-allowed';
      });
      
      // Add revoked badge
      const badge = document.createElement('span');
      badge.className = 'invite-revoked-badge';
      badge.textContent = 'REVOKED';
      badge.style.cssText = `
        background: #dc3545;
        color: white;
        padding: 2px 8px;
        border-radius: 3px;
        font-size: 12px;
        font-weight: bold;
        margin-left: 10px;
      `;
      
      const title = inviteElement.querySelector('.invite-title');
      if (title && !title.querySelector('.invite-revoked-badge')) {
        title.appendChild(badge);
      }
    }
  }

  getAuthToken() {
    // Get auth token from session/localStorage or Firebase Auth
    // This is a placeholder - implement based on your auth system
    const user = window.firebase?.auth()?.currentUser;
    return user?.accessToken || localStorage.getItem('authToken') || '';
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.inviteActionsManager = new InviteActionsManager();
  });
} else {
  window.inviteActionsManager = new InviteActionsManager();
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInUp {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutDown {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    to {
      transform: translateY(100%);
      opacity: 0;
    }
  }
  
  .invite-actions {
    display: flex;
    gap: 8px;
    margin-top: 10px;
  }
  
  .invite-actions .btn {
    padding: 6px 12px;
    border: 1px solid #ddd;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }
  
  .invite-actions .btn:hover {
    background: #f8f9fa;
    border-color: #007bff;
    color: #007bff;
  }
  
  .invite-actions .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
document.head.appendChild(style);