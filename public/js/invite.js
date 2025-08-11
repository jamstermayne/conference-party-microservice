/**
 * PRODUCTION INVITE DEEP LINK HANDLER
 * Validates via API, redeems, updates Store/UI, emits events, handles errors
 * Based on GPT-5 architecture for Professional Intelligence Platform
 */

import Store from './store.js';
import { Events } from './events.js';

/**
 * Production API request helper
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method
 * @param {object} payload - Request payload
 * @returns {Promise<object>} API response
 */
async function api(endpoint, method = 'GET', payload) {
  const apiBase = window.location.origin.includes('localhost') 
    ? 'http://localhost:5001/conference-party-app/us-central1'
    : 'https://us-central1-conference-party-app.cloudfunctions.net';
    
  const response = await fetch(`${apiBase}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: payload ? JSON.stringify(payload) : undefined
  });
  
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

/**
 * Validate invite code with backend API
 * @param {string} code - Invite code to validate
 * @returns {Promise<object>} Validation result
 */
async function validateInvite(code) {
  return api(`/api/invites/${encodeURIComponent(code)}/validate`);
}

/**
 * Redeem invite code with backend API
 * @param {string} code - Invite code to redeem
 * @returns {Promise<object>} Redemption result
 */
async function redeemInvite(code) {
  return api(`/api/invites/${encodeURIComponent(code)}/redeem`, 'POST', {});
}

/**
 * Render invitation acceptance UI
 * @param {object} options - UI options
 * @param {string} options.code - Invite code
 * @param {string} options.inviterName - Name of inviter
 */
function renderInviteUI({ code, inviterName }) {
  const mount = document.querySelector('#main-content') || document.querySelector('#route');
  if (!mount) return;

  mount.innerHTML = `
    <section class="invite-panel">
      <h2>You've been invited${inviterName ? ` by ${inviterName}` : ''}!</h2>
      <p>Accept to unlock parties and professional networking.</p>
      <div class="row gap">
        <button id="btn-accept-invite" class="btn btn-primary">Accept Invite</button>
        <button id="btn-cancel-invite" class="btn btn-secondary">Cancel</button>
      </div>
    </section>
  `;

  // Handle accept invite
  document.getElementById('btn-accept-invite').addEventListener('click', async () => {
    try {
      // Show loading state
      Events.emit('ui:toast', { type: 'info', message: 'Redeeming your invitation...' });
      
      const result = await redeemInvite(code);
      
      // Update Store with redeemed invite (production-safe)
      const invites = Store.get('invites') || { remaining: 10, sent: [], redeemed: [] };
      invites.redeemed = invites.redeemed || [];
      invites.redeemed.push({ 
        code, 
        timestamp: Date.now(), 
        inviterId: result.inviterId,
        inviterName: inviterName
      });
      invites.remaining = Math.max(0, invites.remaining - 1);
      Store.set('invites', invites);

      // Emit event for live UI updates
      Events.emit('invite:redeemed', { code, inviterId: result.inviterId });
      
      // Navigate to events (parties) after success
      window.history.pushState({}, '', '/events');
      Events.emit('navigate', '/events');
      
      // Track successful redemption
      if (window.gtag) {
        gtag('event', 'invite_redeemed', {
          'invite_code': code,
          'inviter_id': result.inviterId
        });
      }
      
    } catch (error) {
      console.error('Invite redemption failed:', error);
      Events.emit('ui:toast', { 
        type: 'error', 
        message: 'Invite redemption failed. Please try again.' 
      });
      
      // Track redemption failure
      if (window.gtag) {
        gtag('event', 'invite_redemption_failed', {
          'invite_code': code,
          'error': error.message
        });
      }
    }
  });

  // Handle cancel
  document.getElementById('btn-cancel-invite').addEventListener('click', () => {
    window.history.pushState({}, '', '/');
    Events.emit('navigate', '/');
    
    // Track invite dismissal
    if (window.gtag) {
      gtag('event', 'invite_dismissed', {
        'invite_code': code
      });
    }
  });
}

/**
 * Render invalid invite UI
 * @param {string} reason - Reason why invite is invalid
 */
function renderInvalidInvite(reason) {
  const mount = document.querySelector('#main-content') || document.querySelector('#route');
  if (!mount) return;
  
  mount.innerHTML = `
    <section class="invite-panel invalid">
      <h2>Invalid Invite</h2>
      <p>${reason || 'This invite is invalid or expired.'}</p>
      <button id="btn-home" class="btn btn-primary">Go Home</button>
    </section>
  `;
  
  document.getElementById('btn-home').addEventListener('click', () => {
    window.history.pushState({}, '', '/');
    Events.emit('navigate', '/');
  });
}

/**
 * Handle invite route - validate and show appropriate UI
 * @param {string} code - Invite code from route
 */
async function handleInviteRoute(code) {
  try {
    // Show loading state
    Events.emit('ui:toast', { type: 'info', message: 'Checking invite...' });
    
    const response = await validateInvite(code);
    
    if (!response.valid) {
      renderInvalidInvite(response.reason);
      
      // Track invalid invite
      if (window.gtag) {
        gtag('event', 'invite_validation_failed', {
          'invite_code': code,
          'error_reason': response.reason || 'invalid'
        });
      }
      
      return;
    }
    
    // Store pending invite for potential use during onboarding
    Store.set('pendingInvite', { 
      code, 
      inviterId: response.inviterId, 
      inviterName: response.inviterName,
      timestamp: Date.now()
    });
    
    // Show invitation acceptance UI
    renderInviteUI({ code, inviterName: response.inviterName });
    
  } catch (error) {
    console.error('Network error while checking invite:', error);
    Events.emit('ui:toast', { 
      type: 'error', 
      message: 'Network error while checking invite. Please try again.' 
    });
    
    // Track validation errors
    if (window.gtag) {
      gtag('event', 'invite_validation_error', {
        'invite_code': code,
        'error': error.message
      });
    }
  }
}

/**
 * Add row gap utility class CSS if not present
 */
function addRowGapStyles() {
  if (!document.getElementById('invite-row-styles')) {
    const style = document.createElement('style');
    style.id = 'invite-row-styles';
    style.textContent = `
      .row {
        display: flex;
        align-items: center;
      }
      .row.gap {
        gap: 12px;
      }
      .row.gap > * {
        flex: 1;
      }
    `;
    document.head.appendChild(style);
  }
}

// Wire up route handling
Events.on('route:change', (currentRoute) => {
  if (currentRoute.name === 'invite' && currentRoute.code) {
    handleInviteRoute(currentRoute.code);
  }
});

// Initialize styles
document.addEventListener('DOMContentLoaded', () => {
  addRowGapStyles();
});

// Export functions for testing and external use
export {
  validateInvite,
  redeemInvite,
  renderInviteUI,
  renderInvalidInvite,
  handleInviteRoute
};

// Make available globally for backward compatibility
window.InviteHandler = {
  validateInvite,
  redeemInvite,
  handleInviteRoute
};

console.log('✅ Production Invite Handler loaded');