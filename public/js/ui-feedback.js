/**
 * PRODUCTION UI FEEDBACK MODULE
 * Centralized toasts + empty states, event-driven
 * Based on GPT-5 architecture for Professional Intelligence Platform
 */

import Events from './events.js';

/**
 * Show toast notification
 * @param {Object} params - Toast parameters
 * @param {string} params.message - Toast message
 * @param {string} params.type - Toast type (info, success, error, warning)
 * @param {number} params.duration - Display duration in ms (default: 3000)
 */
function showToast({ message, type = 'info', duration = 3000 }) {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  el.setAttribute('role', 'alert');
  el.setAttribute('aria-live', 'assertive');
  
  document.body.appendChild(el);
  
  // Trigger animation
  requestAnimationFrame(() => el.classList.add('visible'));
  
  // Auto remove after duration
  setTimeout(() => {
    el.classList.remove('visible');
    setTimeout(() => {
      if (el.parentNode) el.remove();
    }, 250);
  }, duration);
  
  // Update ARIA live region for screen readers
  const ariaLive = document.getElementById('aria-live-status');
  if (ariaLive) {
    ariaLive.textContent = message;
    setTimeout(() => ariaLive.textContent = '', 1000);
  }
}

/**
 * Show empty state in container
 * @param {string} containerSelector - CSS selector for container
 * @param {Object} options - Empty state options
 * @param {string} options.icon - Emoji icon
 * @param {string} options.title - Title text
 * @param {string} options.message - Description message
 * @param {Object} options.action - Action button config
 */
function emptyState(containerSelector, { icon = '📭', title, message, action }) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  
  container.innerHTML = `
    <div class="empty-state" role="region" aria-labelledby="empty-title">
      <div class="empty-state-icon" role="img" aria-label="${icon}">${icon}</div>
      <h2 id="empty-title" class="empty-state-title">${title}</h2>
      <p class="empty-state-message">${message}</p>
      ${action ? `<button class="btn btn-primary" id="empty-action" aria-describedby="empty-title">${action.label}</button>` : ''}
    </div>
  `;
  
  // Wire up action button if provided
  if (action?.onClick) {
    const actionBtn = document.getElementById('empty-action');
    if (actionBtn) {
      actionBtn.addEventListener('click', action.onClick);
    }
  }
  
  // Announce to screen readers
  const ariaLive = document.getElementById('aria-live-status');
  if (ariaLive) {
    ariaLive.textContent = `${title}. ${message}`;
    setTimeout(() => ariaLive.textContent = '', 2000);
  }
}

/**
 * Show loading state in container
 * @param {string} containerSelector - CSS selector for container
 * @param {string} message - Loading message (optional)
 */
function loadingState(containerSelector, message = 'Loading...') {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  
  container.innerHTML = `
    <div class="loading-state" role="status" aria-label="${message}">
      <div class="loading-spinner" aria-hidden="true"></div>
      <p class="loading-message">${message}</p>
    </div>
  `;
}

/**
 * Show error state in container
 * @param {string} containerSelector - CSS selector for container
 * @param {Object} options - Error state options
 */
function errorState(containerSelector, { title = 'Something went wrong', message = 'Please try again later.', retry }) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  
  container.innerHTML = `
    <div class="error-state" role="alert" aria-labelledby="error-title">
      <div class="error-state-icon" role="img" aria-label="Error">⚠️</div>
      <h2 id="error-title" class="error-state-title">${title}</h2>
      <p class="error-state-message">${message}</p>
      ${retry ? `<button class="btn btn-primary" id="error-retry">Try Again</button>` : ''}
    </div>
  `;
  
  // Wire up retry button if provided
  if (retry) {
    const retryBtn = document.getElementById('error-retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', retry);
    }
  }
}

// Event listeners for centralized UI feedback
Events.on('ui:toast', showToast);
Events.on('ui:empty', (params) => emptyState(params.container, params));
Events.on('ui:loading', (params) => loadingState(params.container, params.message));
Events.on('ui:error', (params) => errorState(params.container, params));

// Add required CSS if not present
function addUIFeedbackStyles() {
  if (document.getElementById('ui-feedback-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'ui-feedback-styles';
  style.textContent = `
    /* Toast styles */
    .toast {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%) translateY(16px);
      background: var(--bg-2, #21252b);
      color: var(--text, #ffffff);
      border: 1px solid var(--b, #383d45);
      padding: 10px 14px;
      border-radius: 8px;
      opacity: 0;
      transition: opacity 0.2s ease-out, transform 0.2s ease-out;
      z-index: 10000;
      max-width: 400px;
      font-size: 14px;
    }
    
    .toast.visible {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    
    .toast-success {
      border-left: 4px solid var(--ok, #22c55e);
    }
    
    .toast-error {
      border-left: 4px solid var(--err, #ef4444);
    }
    
    .toast-info {
      border-left: 4px solid var(--accent, #6b7bff);
    }
    
    .toast-warning {
      border-left: 4px solid var(--warn, #fde047);
    }
    
    /* Empty state styles */
    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: var(--muted, #9ea2aa);
    }
    
    .empty-state-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.8;
    }
    
    .empty-state-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--text, #ffffff);
      margin: 0 0 8px 0;
    }
    
    .empty-state-message {
      font-size: 14px;
      line-height: 1.4;
      margin: 0 0 20px 0;
    }
    
    /* Loading state styles */
    .loading-state {
      text-align: center;
      padding: 48px 24px;
      color: var(--muted, #9ea2aa);
    }
    
    .loading-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid var(--b, #383d45);
      border-top: 3px solid var(--accent, #6b7bff);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    
    .loading-message {
      font-size: 14px;
      margin: 0;
    }
    
    /* Error state styles */
    .error-state {
      text-align: center;
      padding: 48px 24px;
      color: var(--muted, #9ea2aa);
    }
    
    .error-state-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    
    .error-state-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--err, #ef4444);
      margin: 0 0 8px 0;
    }
    
    .error-state-message {
      font-size: 14px;
      line-height: 1.4;
      margin: 0 0 20px 0;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    /* iOS hint styles */
    .install-ios-hint {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--accent, #6b7bff);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 1000;
    }
    
    .install-ios-hint.visible {
      opacity: 1;
    }
  `;
  
  document.head.appendChild(style);
}

// Initialize styles on DOM ready
document.addEventListener('DOMContentLoaded', addUIFeedbackStyles);

// Export functions
export { showToast, emptyState, loadingState, errorState };

// Make available globally for backward compatibility
window.UIFeedback = {
  showToast,
  emptyState,
  loadingState,
  errorState
};

// Legacy compatibility
window.showToast = showToast;

console.log('✅ Production UI Feedback loaded');