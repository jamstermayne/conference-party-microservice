/**
 * UI UTILITY MODULE
 * Centralized UI functions for Professional Intelligence Platform
 * Includes toast system, modals, and other UI helpers
 */

/**
 * Enhanced toast system with accessibility and multiple fallback options
 * @param {string} message - Message to display
 * @param {string} type - Toast type: 'success', 'error', 'info', 'warning'
 * @param {number} duration - Duration in milliseconds (default: 4000)
 */
function showToast(message, type = 'info', duration = 4000) {
  // Try existing toast functions in order of preference
  const toastMethods = [
    // Try individual controller toast functions
    () => window.toast && window.toast(message),
    // Try PWA install manager toast
    () => window.pwaInstallManager && window.pwaInstallManager.showToast && window.pwaInstallManager.showToast(message),
    // Try invite manager toast
    () => window.inviteManager && window.inviteManager.showToast && window.inviteManager.showToast(message, type),
    // Use our enhanced toast as fallback
    () => createUniversalToast(message, type, duration)
  ];
  
  // Try each method until one succeeds
  for (const method of toastMethods) {
    try {
      const result = method();
      if (result !== false && result !== undefined) {
        return; // Successfully showed toast
      }
    } catch (error) {
      console.debug('Toast method failed, trying next:', error);
    }
  }
}

/**
 * Create universal toast that works across all contexts
 * @param {string} message - Message to display
 * @param {string} type - Toast type
 * @param {number} duration - Duration in milliseconds
 */
function createUniversalToast(message, type, duration = 4000) {
  // Remove existing universal toasts
  const existing = document.querySelectorAll('.universal-toast');
  existing.forEach(toast => toast.remove());
  
  // Try to use existing toast template first
  const template = document.getElementById('tpl-toast');
  let toast;
  
  if (template) {
    // Use existing template structure
    toast = template.content.firstElementChild.cloneNode(true);
    const msgElement = toast.querySelector('.msg');
    if (msgElement) {
      msgElement.textContent = message;
    }
    toast.classList.add('universal-toast', `toast-${type}`);
  } else {
    // Create from scratch
    toast = createCustomToast(message, type);
  }
  
  // Ensure accessibility attributes
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  
  // Add enhanced styling based on type
  applyToastTypeStyles(toast, type);
  
  document.body.appendChild(toast);
  
  // Auto-remove after duration
  setTimeout(() => {
    if (toast.parentElement) {
      toast.remove();
    }
  }, duration);
  
  // Allow manual dismissal
  toast.addEventListener('click', () => {
    if (toast.parentElement) {
      toast.remove();
    }
  });
  
  // Announce to screen readers
  if (window.announce) {
    window.announce(message);
  }
}

/**
 * Create custom toast from scratch
 * @param {string} message - Message to display
 * @param {string} type - Toast type
 */
function createCustomToast(message, type) {
  const toast = document.createElement('div');
  toast.className = `toast universal-toast toast-${type}`;
  
  // Create structure
  const content = document.createElement('div');
  content.className = 'toast-content';
  
  const icon = document.createElement('span');
  icon.className = 'toast-icon';
  icon.textContent = getToastIcon(type);
  
  const msgSpan = document.createElement('span');
  msgSpan.className = 'msg';
  msgSpan.textContent = message;
  
  content.appendChild(icon);
  content.appendChild(msgSpan);
  toast.appendChild(content);
  
  // Base styling
  Object.assign(toast.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: '10000',
    maxWidth: '400px',
    padding: '12px 16px',
    borderRadius: '8px',
    color: 'var(--white)',
    fontSize: '14px',
    fontWeight: '500',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(8px)'
  });
  
  // Content styling
  Object.assign(content.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  });
  
  return toast;
}

/**
 * Apply type-specific styling to toast
 * @param {HTMLElement} toast - Toast element
 * @param {string} type - Toast type
 */
function applyToastTypeStyles(toast, type) {
  const typeStyles = {
    success: {
      backgroundColor: 'rgba(34, 197, 94, 0.95)',
      borderLeft: '4px solid var(--success)'
    },
    error: {
      backgroundColor: 'rgba(239, 68, 68, 0.95)',
      borderLeft: '4px solid var(--error)'
    },
    warning: {
      backgroundColor: 'rgba(245, 158, 11, 0.95)',
      borderLeft: '4px solid var(--warning)'
    },
    info: {
      backgroundColor: 'rgba(59, 130, 246, 0.95)',
      borderLeft: '4px solid var(--info)'
    }
  };
  
  const styles = typeStyles[type] || typeStyles.info;
  Object.assign(toast.style, styles);
}

/**
 * Get icon for toast type
 * @param {string} type - Toast type
 * @returns {string} Icon character
 */
function getToastIcon(type) {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  return icons[type] || icons.info;
}

/**
 * Show confirmation dialog with accessibility
 * @param {string} message - Message to display
 * @param {string} confirmText - Confirm button text (default: 'Confirm')
 * @param {string} cancelText - Cancel button text (default: 'Cancel')
 * @returns {Promise<boolean>} True if confirmed, false if cancelled
 */
function showConfirm(message, confirmText = 'Confirm', cancelText = 'Cancel') {
  return new Promise((resolve) => {
    // Try native confirm first for simplicity
    if (window.confirm) {
      const result = window.confirm(message);
      resolve(result);
      return;
    }
    
    // Create custom modal
    const modal = createConfirmModal(message, confirmText, cancelText, resolve);
    document.body.appendChild(modal);
  });
}

/**
 * Create custom confirm modal
 * @param {string} message - Message to display
 * @param {string} confirmText - Confirm button text
 * @param {string} cancelText - Cancel button text
 * @param {Function} resolve - Promise resolve function
 */
function createConfirmModal(message, confirmText, cancelText, resolve) {
  const modal = document.createElement('div');
  modal.className = 'confirm-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'confirm-message');
  
  modal.innerHTML = `
    <div class="confirm-overlay"></div>
    <div class="confirm-content">
      <p id="confirm-message">${message}</p>
      <div class="confirm-actions">
        <button class="btn btn-primary confirm-yes">${confirmText}</button>
        <button class="btn btn-secondary confirm-no">${cancelText}</button>
      </div>
    </div>
  `;
  
  // Styling
  Object.assign(modal.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '10001',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  });
  
  const overlay = modal.querySelector('.confirm-overlay');
  Object.assign(overlay.style, {
    position: 'absolute',
    inset: '0',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)'
  });
  
  const content = modal.querySelector('.confirm-content');
  Object.assign(content.style, {
    position: 'relative',
    backgroundColor: 'var(--surface, var(--neutral-100))',
    color: 'var(--text-primary, var(--white))',
    padding: '24px',
    borderRadius: '12px',
    maxWidth: '400px',
    width: '90vw',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
  });
  
  // Event listeners
  const yesBtn = modal.querySelector('.confirm-yes');
  const noBtn = modal.querySelector('.confirm-no');
  
  const cleanup = () => modal.remove();
  
  yesBtn.addEventListener('click', () => {
    cleanup();
    resolve(true);
  });
  
  noBtn.addEventListener('click', () => {
    cleanup();
    resolve(false);
  });
  
  overlay.addEventListener('click', () => {
    cleanup();
    resolve(false);
  });
  
  // Focus management
  setTimeout(() => yesBtn.focus(), 100);
  
  return modal;
}

/**
 * Show loading overlay
 * @param {string} message - Loading message (optional)
 */
function showLoading(message = 'Loading...') {
  const existing = document.getElementById('universal-loading');
  if (existing) existing.remove();
  
  const loader = document.createElement('div');
  loader.id = 'universal-loading';
  loader.className = 'loading-overlay';
  loader.setAttribute('role', 'status');
  loader.setAttribute('aria-live', 'polite');
  
  loader.innerHTML = `
    <div class="loading-content">
      <div class="loading-spinner"></div>
      <p class="loading-message">${message}</p>
    </div>
  `;
  
  // Styling
  Object.assign(loader.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '10002',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(4px)'
  });
  
  const content = loader.querySelector('.loading-content');
  Object.assign(content.style, {
    textAlign: 'center',
    color: 'white',
    padding: '24px',
    borderRadius: '12px',
    backgroundColor: 'rgba(26, 26, 31, 0.9)'
  });
  
  const spinner = loader.querySelector('.loading-spinner');
  Object.assign(spinner.style, {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(255, 255, 255, 0.3)',
    borderTop: '4px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px'
  });
  
  // Add CSS animation if not exists
  if (!document.getElementById('spinner-animation')) {
    const style = document.createElement('style');
    style.id = 'spinner-animation';
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(loader);
  
  if (window.announce) {
    window.announce(message);
  }
}

/**
 * Hide loading overlay
 */
function hideLoading() {
  const loader = document.getElementById('universal-loading');
  if (loader) {
    loader.remove();
  }
}

// Export functions
export {
  showToast,
  showConfirm,
  showLoading,
  hideLoading
};

// Make available globally for backward compatibility
window.showToast = showToast;
window.showConfirm = showConfirm;
window.showLoading = showLoading;
window.hideLoading = hideLoading;

// Create global UI namespace
window.UI = {
  showToast,
  showConfirm,
  showLoading,
  hideLoading
};

console.log('✅ UI utilities module loaded');