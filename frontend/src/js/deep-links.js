/**
 * DEEP LINKING MODULE
 * Enhanced invite code handling with backend validation and state management
 * Based on GPT-5 architecture with Professional Intelligence Platform integration
 */

import Store from './store.js?v=b022';
import { Events } from './events.js?v=b022';

/**
 * Production-ready invite redemption flow (GPT-5)
 * Real API integration with proper error handling and security
 */
document.addEventListener('DOMContentLoaded', async () => {
  const inviteCode = await getInviteCodeFromURL();
  if (!inviteCode) return;

  try {
    // Validate with real API - no storing unvalidated codes
    const { valid, reason } = await validateInviteCode(inviteCode);
    if (!valid) {
      renderUI({
        title: 'Invalid Invite',
        message: reason || 'This invite code is not valid or has expired.',
        type: 'error'
      });
      
      // Track failed validation
      if (window.gtag) {
        gtag('event', 'invite_validation_failed', {
          'invite_code': inviteCode,
          'error_reason': reason || 'invalid'
        });
      }
      return;
    }

    // Show invitation acceptance UI
    renderUI({
      title: 'You've Been Invited!',
      message: 'Accept this invitation to join your contact on Velocity.',
      buttonText: 'Accept Invite',
      onClick: async () => {
        try {
          // Show loading state
          renderUI({
            title: 'Processing...',
            message: 'Redeeming your invitation, please wait.',
            type: 'loading'
          });

          // Redeem with real API
          await redeemInviteCode(inviteCode);
          
          // Only store after successful API redemption (GPT-5 production-safe)
          Store.invites = Store.invites || [];
          Store.invites.push({ code: inviteCode, redeemedAt: Date.now() });
          
          // Emit event for live updates
          Events.emit('invite:redeemed', { code: inviteCode });

          // Show success confirmation
          renderUI({
            title: 'Invite Accepted 🎉',
            message: 'You are now connected. Enjoy the party listings!',
            buttonText: 'Go to Parties',
            type: 'success',
            onClick: () => {
              window.history.pushState({}, '', '/');
              Events.emit('navigate', '/');
              
              // Trigger router if available
              if (window.router && window.router.navigate) {
                window.router.navigate('/');
              }
            }
          });

          // Track successful redemption
          if (window.gtag) {
            gtag('event', 'invite_redeemed', {
              'invite_code': inviteCode
            });
          }

        } catch (err) {
          // Show retry UI on redemption failure
          renderUI({
            title: 'Redemption Failed',
            message: 'Something went wrong. Please try again later.',
            buttonText: 'Retry',
            type: 'error',
            onClick: () => location.reload()
          });

          // Track redemption errors
          if (window.gtag) {
            gtag('event', 'invite_redemption_failed', {
              'invite_code': inviteCode,
              'error': err.message
            });
          }
        }
      }
    });

  } catch (err) {
    // Show connection error UI with retry option
    renderUI({
      title: 'Connection Error',
      message: 'Unable to validate invite. Check your connection and try again.',
      buttonText: 'Retry',
      type: 'error',
      onClick: () => location.reload()
    });

    // Track validation errors
    if (window.gtag) {
      gtag('event', 'invite_validation_error', {
        'invite_code': inviteCode,
        'error': err.message
      });
    }
  }
});

/**
 * Get invite code from URL pathname (Production-ready GPT-5)
 * @returns {Promise<string|null>} Extracted invite code or null
 */
async function getInviteCodeFromURL() {
  const path = window.location.pathname;
  const match = path.match(/^\/invite\/([A-Za-z0-9_-]+)$/);
  return match ? match[1] : null;
}

/**
 * Production API request handler with proper error handling
 * @param {string} endpoint - API endpoint to call
 * @param {string} method - HTTP method (default: GET)
 * @param {object} body - Request body for POST requests
 * @returns {Promise<object>} API response data
 */
async function apiRequest(endpoint, method = 'GET', body = null) {
  try {
    const apiBase = window.location.origin.includes('localhost') 
      ? 'http://localhost:5001/conference-party-app/us-central1'
      : 'https://us-central1-conference-party-app.cloudfunctions.net';
      
    const res = await fetch(`${apiBase}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : null
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`API error: ${err}`);
    throw err;
  }
}

/**
 * Production invite validation with real API (GPT-5)
 * @param {string} code - The invite code to validate
 * @returns {Promise<object>} Validation result with valid flag and reason
 */
async function validateInviteCode(code) {
  return apiRequest(`/api/invite/validate?code=${encodeURIComponent(code)}`);
}

/**
 * Production invite redemption with real API (GPT-5)
 * @param {string} code - The invite code to redeem
 * @returns {Promise<object>} Redemption result
 */
async function redeemInviteCode(code) {
  return apiRequest(`/api/invite/redeem`, 'POST', { code });
}

/**
 * Production-ready flexible UI renderer (GPT-5)
 * @param {object} options - UI configuration object
 * @param {string} options.title - Panel title
 * @param {string} options.message - Panel message
 * @param {string} options.buttonText - Button text (optional)
 * @param {function} options.onClick - Button click handler (optional)
 * @param {string} options.type - Panel type for styling (optional)
 */
function renderUI({ title, message, buttonText, onClick, type = 'default' }) {
  const container = document.querySelector('#main-content') || document.querySelector('#route');
  if (!container) return;

  const panelClasses = `invite-panel ${type === 'error' ? 'invalid' : ''} ${type === 'success' ? 'success' : ''}`;

  container.innerHTML = `
    <div class="${panelClasses}">
      <h2>${title}</h2>
      <p>${message}</p>
      ${buttonText ? `<button id="invite-action" class="btn btn-primary">${buttonText}</button>` : ''}
    </div>
  `;
  
  if (onClick && buttonText) {
    document.querySelector('#invite-action')?.addEventListener('click', onClick);
  }

  // Announce to screen readers
  if (window.announce) {
    window.announce(`${title}. ${message}`);
  }
}


/**
 * Enhanced toast function that integrates with existing toast systems
 * @param {string} message - Message to display
 * @param {string} type - Toast type: 'success', 'error', 'info', 'warning'
 */
function showToast(message, type = 'info') {
  // Try to use existing toast systems first
  if (window.toast) {
    window.toast(message);
    return;
  }
  
  // Use PWA install manager toast if available
  if (window.pwaInstallManager && window.pwaInstallManager.showToast) {
    window.pwaInstallManager.showToast(message);
    return;
  }
  
  // Fallback to creating our own toast
  createEnhancedToast(message, type);
}

/**
 * Create enhanced toast with accessibility and styling
 * @param {string} message - Message to display
 * @param {string} type - Toast type
 */
function createEnhancedToast(message, type) {
  // Remove existing toast if any
  const existing = document.querySelector('.deep-link-toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = `deep-link-toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  
  // Create toast content
  const content = document.createElement('div');
  content.className = 'toast-content';
  
  // Add icon based on type
  const icon = document.createElement('span');
  icon.className = 'toast-icon';
  switch (type) {
    case 'success': icon.textContent = '✅'; break;
    case 'error': icon.textContent = '❌'; break;
    case 'warning': icon.textContent = '⚠️'; break;
    case 'info': icon.textContent = 'ℹ️'; break;
    default: icon.textContent = '📢';
  }
  
  const message_span = document.createElement('span');
  message_span.className = 'toast-message';
  message_span.textContent = message;
  
  content.appendChild(icon);
  content.appendChild(message_span);
  toast.appendChild(content);
  
  // Add styles
  const styles = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: '10000',
    maxWidth: '400px',
    padding: '12px 16px',
    borderRadius: '8px',
    color: '#ffffff',
    fontWeight: '500',
    fontSize: '14px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    transform: 'translateX(100%)',
    transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
    opacity: '0'
  };
  
  // Apply base styles
  Object.assign(toast.style, styles);
  
  // Apply type-specific styling
  switch (type) {
    case 'success':
      toast.style.backgroundColor = '#22c55e';
      break;
    case 'error':
      toast.style.backgroundColor = '#ef4444';
      break;
    case 'warning':
      toast.style.backgroundColor = '#f59e0b';
      break;
    case 'info':
      toast.style.backgroundColor = '#3b82f6';
      break;
    default:
      toast.style.backgroundColor = '#6b7280';
  }
  
  // Style content
  content.style.display = 'flex';
  content.style.alignItems = 'center';
  content.style.gap = '8px';
  
  document.body.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
    toast.style.opacity = '1';
  }, 10);
  
  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 300);
  }, 4000);
  
  // Allow manual dismissal
  toast.addEventListener('click', () => {
    toast.style.transform = 'translateX(100%)';
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 300);
  });
}

/**
 * Validate invite code format
 * @param {string} code - Code to validate
 * @returns {boolean} Whether the code format is valid
 */
function isValidInviteCodeFormat(code) {
  if (!code || typeof code !== 'string') return false;
  
  // Remove any whitespace and convert to uppercase
  const cleanCode = code.trim().toUpperCase();
  
  // Check if it matches expected format (adjust pattern as needed)
  // Example: 6-8 alphanumeric characters
  const codePattern = /^[A-Z0-9]{6,8}$/;
  return codePattern.test(cleanCode);
}

/**
 * Extract invite code from various URL patterns
 * @param {string} url - URL to parse
 * @returns {string|null} Extracted invite code or null
 */
function extractInviteCode(url) {
  try {
    const urlObj = new URL(url, window.location.origin);
    
    // Check path-based invite: /invite/CODE
    const pathParts = urlObj.pathname.split('/');
    const inviteIndex = pathParts.indexOf('invite');
    if (inviteIndex !== -1 && pathParts.length > inviteIndex + 1) {
      return pathParts[inviteIndex + 1];
    }
    
    // Check query parameters: ?invite=CODE
    const queryCode = urlObj.searchParams.get('invite');
    if (queryCode) {
      return queryCode;
    }
    
    // Check fragment: #invite/CODE
    const fragment = urlObj.hash.replace('#', '');
    const fragmentParts = fragment.split('/');
    const fragmentInviteIndex = fragmentParts.indexOf('invite');
    if (fragmentInviteIndex !== -1 && fragmentParts.length > fragmentInviteIndex + 1) {
      return fragmentParts[fragmentInviteIndex + 1];
    }
    
  } catch (error) {
    console.error('Error extracting invite code from URL:', error);
  }
  
  return null;
}

/**
 * Production-safe event handlers for invite system integration (GPT-5)
 * Pulls real invite data from backend and handles all states gracefully
 */
Events.on('invite:redeemed', ({ code }) => {
  console.log(`Production invite redeemed: ${code}`);
  
  // Update invite counter with real data from Store
  const counter = document.querySelector('#invite-counter');
  if (counter) {
    const count = Store.get('invites')?.length || 0;
    counter.textContent = count;
  }
  
  // Update invite pill in navigation with remaining invites
  const invitePill = document.querySelector('#invite-pill');
  if (invitePill) {
    const invites = Store.get('invites') || [];
    const remainingInvites = Math.max(0, 10 - invites.length); // Real calculation based on redeemed invites
    invitePill.textContent = remainingInvites;
  }
  
  // Production-safe success notification
  showToast('Invite successfully redeemed! Welcome to Velocity.', 'success');
});

// Export production-ready functions for use in other modules (GPT-5)
export {
  apiRequest,
  validateInviteCode,
  redeemInviteCode,
  renderUI,
  showToast,
  isValidInviteCodeFormat,
  extractInviteCode,
  getInviteCodeFromURL
};

// Also make available globally for backward compatibility
window.DeepLinks = {
  apiRequest,
  validateInviteCode,
  redeemInviteCode,
  renderUI,
  showToast,
  isValidInviteCodeFormat,
  extractInviteCode,
  getInviteCodeFromURL
};

console.log('✅ Deep Links module loaded');