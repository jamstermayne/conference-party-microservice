/**
 * ERROR HANDLING MODULE
 * Centralized error handling and empty state management for Professional Intelligence Platform
 * Based on GPT-5 architecture with Slack-style experience preservation
 */

import { showToast } from './ui.js?v=b021';

/**
 * Handle errors with context-specific messaging
 * @param {string} context - Error context (network, invites, events, calendar, etc.)
 * @param {Error|string} err - Error object or message
 * @param {Object} options - Additional options
 */
export function handleError(context, err, options = {}) {
  console.error(`[${context}]`, err);

  // Enhanced message map for Professional Intelligence Platform contexts
  const messageMap = {
    network: 'Network connection failed. Please check your internet.',
    invites: 'Unable to load invites. Please try again later.',
    events: 'Could not fetch events. Try again shortly.',
    calendar: 'Failed to sync with your calendar.',
    parties: 'Unable to load parties. Please try again.',
    opportunities: 'Could not load opportunities. Check back soon.',
    proximity: 'Location services unavailable. Please try again.',
    connections: 'Failed to load professional connections.',
    profile: 'Unable to update profile. Please try again.',
    auth: 'Authentication failed. Please sign in again.',
    upload: 'File upload failed. Please try again.',
    search: 'Search is temporarily unavailable.',
    sync: 'Sync failed. Your data may not be up to date.',
    api: 'Service temporarily unavailable. Please try again.',
    default: 'An unexpected error occurred.'
  };

  const msg = messageMap[context] || messageMap.default;
  
  // Show toast with error message
  showToast(msg, 'error', options.duration || 4000);
  
  // Emit error event for other modules to handle
  if (window.Events) {
    window.Events.emit('error', {
      context,
      error: err,
      message: msg,
      timestamp: Date.now()
    });
  }
  
  // Track error for analytics
  if (window.gtag) {
    gtag('event', 'exception', {
      'description': `${context}: ${err instanceof Error ? err.message : err}`,
      'fatal': false
    });
  }
  
  // Announce to screen readers for accessibility
  if (window.announce) {
    window.announce(`Error in ${context}: ${msg}`);
  }
}

/**
 * Show empty state with consistent styling and messaging
 * @param {string} containerSelector - CSS selector for container element
 * @param {string} message - Empty state message
 * @param {string|null} icon - Icon path or null for no icon
 * @param {Object} options - Additional options
 */
export function showEmptyState(containerSelector, message, icon = null, options = {}) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.warn(`Empty state container not found: ${containerSelector}`);
    return;
  }

  // Create enhanced empty state HTML
  const emptyStateHTML = `
    <div class="empty-state" role="status" aria-live="polite">
      ${icon ? `<img src="${icon}" alt="" class="empty-icon" />` : getDefaultEmptyIcon(options.type)}
      <div class="empty-content">
        <h3 class="empty-title">${options.title || 'Nothing to show'}</h3>
        <p class="empty-message">${message}</p>
        ${options.action ? `
          <button class="btn btn-secondary empty-action" onclick="${options.action.handler}">
            ${options.action.text}
          </button>
        ` : ''}
      </div>
    </div>
  `;

  container.innerHTML = emptyStateHTML;
  
  // Add empty state class to container for styling
  container.classList.add('has-empty-state');
  
  // Emit empty state event
  if (window.Events) {
    window.Events.emit('empty-state', {
      container: containerSelector,
      message,
      type: options.type || 'default'
    });
  }
  
  // Announce to screen readers
  if (window.announce) {
    window.announce(message);
  }
}

/**
 * Get default empty state icon based on type
 * @param {string} type - Empty state type
 * @returns {string} HTML for default icon
 */
function getDefaultEmptyIcon(type) {
  const iconMap = {
    events: '📅',
    parties: '🎉',
    invites: '🎟️',
    opportunities: '🎯',
    connections: '🤝',
    calendar: '📆',
    search: '🔍',
    default: '📋'
  };
  
  const emoji = iconMap[type] || iconMap.default;
  return `<div class="empty-icon-emoji">${emoji}</div>`;
}

/**
 * Show loading state for better UX during API calls
 * @param {string} containerSelector - CSS selector for container element
 * @param {string} message - Loading message
 */
export function showLoadingState(containerSelector, message = 'Loading...') {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  container.innerHTML = `
    <div class="loading-state" role="status" aria-live="polite">
      <div class="loading-spinner"></div>
      <p class="loading-message">${message}</p>
    </div>
  `;
  
  container.classList.add('has-loading-state');
  
  // Announce to screen readers
  if (window.announce) {
    window.announce(message);
  }
}

/**
 * Clear any state (empty, loading, error) from container
 * @param {string} containerSelector - CSS selector for container element
 */
export function clearContainerState(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  container.classList.remove('has-empty-state', 'has-loading-state', 'has-error-state');
}

/**
 * Show error state in container (alternative to just showing toast)
 * @param {string} containerSelector - CSS selector for container element
 * @param {string} context - Error context
 * @param {string} message - Error message
 * @param {Function} retryHandler - Optional retry function
 */
export function showErrorState(containerSelector, context, message, retryHandler = null) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  container.innerHTML = `
    <div class="error-state" role="alert">
      <div class="error-icon">⚠️</div>
      <div class="error-content">
        <h3 class="error-title">Something went wrong</h3>
        <p class="error-message">${message}</p>
        ${retryHandler ? `
          <button class="btn btn-primary error-retry" onclick="(${retryHandler})()">
            Try Again
          </button>
        ` : ''}
      </div>
    </div>
  `;
  
  container.classList.add('has-error-state');
  
  // Emit error state event
  if (window.Events) {
    window.Events.emit('error-state', {
      container: containerSelector,
      context,
      message
    });
  }
}

/**
 * Enhanced error handling for API responses
 * @param {Response} response - Fetch response object
 * @param {string} context - Error context
 * @returns {Promise} Throws error if response not ok
 */
export async function handleApiResponse(response, context) {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      // If response isn't JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }
  
  return response.json();
}

/**
 * Retry mechanism for failed operations
 * @param {Function} operation - Operation to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Delay between retries in milliseconds
 * @param {string} context - Context for error handling
 */
export async function withRetry(operation, maxRetries = 3, delay = 1000, context = 'operation') {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        handleError(context, error);
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
}

// Export enhanced utilities for common patterns
export const ErrorUtils = {
  handleError,
  showEmptyState,
  showLoadingState,
  showErrorState,
  clearContainerState,
  handleApiResponse,
  withRetry
};

// Make available globally for backward compatibility
window.ErrorUtils = ErrorUtils;
window.handleError = handleError;
window.showEmptyState = showEmptyState;

console.log('✅ Error handling module loaded');