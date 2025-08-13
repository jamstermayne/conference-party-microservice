/**
 * INVITES API MODULE
 * Enhanced invite management with error handling for Professional Intelligence Platform
 * Based on GPT-5 architecture
 */

import { handleError, showEmptyState, showLoadingState, clearContainerState, handleApiResponse, withRetry } from '../errors.js?v=b023';

/**
 * Send invite to email address
 * @param {string} email - Email address to send invite to
 * @param {Object} options - Send options
 */
export async function sendInvite(email, options = {}) {
  try {
    // Validate email format
    if (!email || !isValidEmail(email)) {
      throw new Error('Please enter a valid email address');
    }
    
    // Check invite quota
    const remaining = await getRemainingInvites();
    if (remaining <= 0) {
      throw new Error('You have no invites remaining');
    }
    
    // Show loading toast
    if (window.showToast) {
      window.showToast('Sending invite...', 'info', 2000);
    }
    
    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}/api/invite/send`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Client-Version': '3.1.0'
      },
      body: JSON.stringify({ 
        email,
        message: options.message || '',
        eventId: options.eventId || null
      })
    });

    const data = await handleApiResponse(res, 'invites');

    if (!data.success) {
      throw new Error(data.error || 'Invite API error');
    }
    
    // Show success toast
    if (window.showToast) {
      window.showToast(`Invite sent to ${email}!`, 'success');
    }
    
    // Update local invite count
    if (window.Store && data.remainingInvites !== undefined) {
      window.Store.patch('invites.left', data.remainingInvites);
    }
    
    // Update invite list if container exists
    const inviteListContainer = document.querySelector('#invite-list, .invite-list');
    if (inviteListContainer) {
      await loadInviteHistory('#invite-list');
    }
    
    // Emit success event
    if (window.Events) {
      window.Events.emit('invite:sent', { email, inviteCode: data.inviteCode, remainingInvites: data.remainingInvites });
    }
    
    // Track for analytics
    if (window.gtag) {
      gtag('event', 'invite_sent', {
        'method': 'email',
        'remaining_invites': data.remainingInvites
      });
    }
    
    return data;
    
  } catch (err) {
    handleError('invites', err);
    throw err;
  }
}

/**
 * Load invite history with error handling and empty states
 * @param {string} container - Container selector
 */
export async function loadInviteHistory(container = '#invite-list') {
  try {
    clearContainerState(container);
    showLoadingState(container, 'Loading your invites...');
    
    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}/api/invite/history`, {
      headers: {
        'X-Client-Version': '3.1.0'
      }
    });
    
    const data = await handleApiResponse(res, 'invites');
    
    clearContainerState(container);
    
    if (!data.invites || data.invites.length === 0) {
      showEmptyState(
        container,
        'No invites sent yet. Send your first invite to grow your network!',
        null,
        {
          type: 'invites',
          title: 'No Invites Yet',
          action: {
            text: 'Send Invite',
            handler: 'showInviteModal()'
          }
        }
      );
      return [];
    }
    
    renderInviteHistory(data.invites, container);
    
    // Emit success event
    if (window.Events) {
      window.Events.emit('invites:loaded', { count: data.invites.length });
    }
    
    return data.invites;
    
  } catch (err) {
    clearContainerState(container);
    handleError('invites', err);
    
    // Show error state in container
    showEmptyState(
      container,
      'Unable to load invite history. Please check your connection.',
      null,
      {
        type: 'invites',
        title: 'Connection Error',
        action: {
          text: 'Retry',
          handler: `loadInviteHistory('${container}')`
        }
      }
    );
    
    return [];
  }
}

/**
 * Get remaining invite count
 * @returns {Promise<number>} Number of remaining invites
 */
export async function getRemainingInvites() {
  try {
    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}/api/invite/remaining`, {
      headers: {
        'X-Client-Version': '3.1.0'
      }
    });
    
    const data = await handleApiResponse(res, 'invites');
    
    // Update store
    if (window.Store && data.remaining !== undefined) {
      window.Store.patch('invites.left', data.remaining);
    }
    
    return data.remaining || 0;
    
  } catch (err) {
    // Fail silently for this call, return stored value
    console.warn('Failed to get remaining invites:', err);
    return window.Store?.get('invites.left') || 0;
  }
}

/**
 * Resend an existing invite
 * @param {string} inviteCode - Invite code to resend
 * @param {string} email - Email address (optional, for validation)
 */
export async function resendInvite(inviteCode, email = null) {
  try {
    if (!inviteCode) {
      throw new Error('Invite code is required');
    }
    
    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}/api/invite/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': '3.1.0'
      },
      body: JSON.stringify({
        inviteCode,
        email
      })
    });
    
    const data = await handleApiResponse(res, 'invites');
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to resend invite');
    }
    
    // Show success toast
    if (window.showToast) {
      window.showToast('Invite resent successfully!', 'success');
    }
    
    // Emit success event
    if (window.Events) {
      window.Events.emit('invite:resent', { inviteCode, email });
    }
    
    return data;
    
  } catch (err) {
    handleError('invites', err);
    throw err;
  }
}

/**
 * Generate a new invite code (without sending)
 * @returns {Promise<Object>} Invite data with code
 */
export async function generateInviteCode() {
  try {
    // Check invite quota first
    const remaining = await getRemainingInvites();
    if (remaining <= 0) {
      throw new Error('You have no invites remaining');
    }
    
    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}/api/invite/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': '3.1.0'
      }
    });
    
    const data = await handleApiResponse(res, 'invites');
    
    if (!data.success || !data.inviteCode) {
      throw new Error(data.error || 'Failed to generate invite code');
    }
    
    // Update remaining count
    if (data.remainingInvites !== undefined && window.Store) {
      window.Store.patch('invites.left', data.remainingInvites);
    }
    
    // Emit generation event
    if (window.Events) {
      window.Events.emit('invite:generated', { 
        inviteCode: data.inviteCode, 
        remainingInvites: data.remainingInvites 
      });
    }
    
    return data;
    
  } catch (err) {
    handleError('invites', err);
    throw err;
  }
}

/**
 * Render invite history to container
 * @param {Array} invites - Array of invite objects
 * @param {string} container - Container selector
 */
function renderInviteHistory(invites, container) {
  const containerElement = document.querySelector(container);
  if (!containerElement) {
    console.error(`Invite history container not found: ${container}`);
    return;
  }
  
  containerElement.innerHTML = invites.map(invite => `
    <div class="invite-item ${invite.status || (invite.usedBy ? 'accepted' : 'pending')}" 
         data-invite-code="${invite.code}" role="listitem">
      <div class="invite-code" title="Invite code: ${invite.code}">
        ${escapeHtml(invite.code)}
      </div>
      
      <div class="invite-details">
        ${invite.email ? `
          <div class="invite-email">${escapeHtml(invite.email)}</div>
        ` : ''}
        
        <div class="invite-status">
          ${getInviteStatusBadge(invite)}
        </div>
        
        <div class="invite-date">
          ${formatInviteDate(invite.createdAt || invite.generatedAt)}
        </div>
      </div>
      
      <div class="invite-actions">
        ${!invite.usedBy && invite.status !== 'accepted' ? `
          <button class="btn-icon resend-btn" 
                  onclick="handleResendInvite('${invite.code}', '${invite.email || ''}')"
                  title="Resend invite"
                  aria-label="Resend invite ${invite.code}">
            📤
          </button>
          <button class="btn-icon copy-btn" 
                  onclick="handleCopyInvite('${invite.code}')"
                  title="Copy invite link"
                  aria-label="Copy invite link for ${invite.code}">
            📋
          </button>
        ` : ''}
      </div>
    </div>
  `).join('');
  
  // Add list role for accessibility
  containerElement.setAttribute('role', 'list');
  containerElement.setAttribute('aria-label', 'Invite history');
  
  // Enhance with accessibility
  enhanceInviteItems(containerElement);
}

/**
 * Get status badge HTML for invite
 * @param {Object} invite - Invite object
 * @returns {string} Status badge HTML
 */
function getInviteStatusBadge(invite) {
  if (invite.usedBy || invite.status === 'accepted') {
    return `<span class="status-badge accepted">✅ Accepted${invite.usedBy ? ` by ${maskEmail(invite.usedBy)}` : ''}</span>`;
  } else if (invite.status === 'expired') {
    return `<span class="status-badge expired">⏰ Expired</span>`;
  } else {
    return `<span class="status-badge pending">⏳ Pending</span>`;
  }
}

/**
 * Handle invite actions
 */
window.handleResendInvite = async function(inviteCode, email) {
  try {
    await resendInvite(inviteCode, email);
  } catch (err) {
    // Error already handled by resendInvite function
  }
};

window.handleCopyInvite = async function(inviteCode) {
  try {
    const inviteUrl = `${window.location.origin}/invite/${inviteCode}`;
    
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(inviteUrl);
      if (window.showToast) {
        window.showToast('Invite link copied to clipboard!', 'success');
      }
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = inviteUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (window.showToast) {
        window.showToast('Invite link copied!', 'success');
      }
    }
    
    // Track copy action
    if (window.gtag) {
      gtag('event', 'invite_link_copied', {
        'invite_code': inviteCode
      });
    }
    
  } catch (err) {
    if (window.showToast) {
      window.showToast('Failed to copy invite link', 'error');
    }
  }
};

/**
 * Enhance invite items with keyboard navigation
 * @param {HTMLElement} container - Container element
 */
function enhanceInviteItems(container) {
  const items = container.querySelectorAll('.invite-item');
  
  items.forEach(item => {
    item.setAttribute('tabindex', '0');
    
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const copyBtn = item.querySelector('.copy-btn');
        if (copyBtn) {
          copyBtn.click();
        }
      }
    });
  });
}

/**
 * Helper functions
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function getApiBase() {
  return window.location.origin.includes('localhost') 
    ? 'http://localhost:5001/conference-party-app/us-central1'
    : 'https://us-central1-conference-party-app.cloudfunctions.net';
}

function formatInviteDate(dateString) {
  if (!dateString) return 'Unknown';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  } catch (err) {
    return dateString;
  }
}

function maskEmail(email) {
  if (!email || !email.includes('@')) return email;
  
  const [local, domain] = email.split('@');
  if (local.length <= 2) return email;
  
  return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Export additional utilities
export {
  loadInviteHistory,
  getRemainingInvites,
  resendInvite,
  generateInviteCode
};

console.log('✅ Invites API module loaded');