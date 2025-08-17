/**
 * Party Discovery System Demo
 * ===========================
 * Example integration of the complete party search, calendar, and map system
 */

import { PartyDiscoverySystem } from './party-discovery.js';

// Initialize the party discovery system when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('party-discovery-container');
  
  if (!container) {
    console.warn('Party discovery container not found. Please add an element with id="party-discovery-container" to your HTML.');
    return;
  }

  // Show loading state
  container.innerHTML = `
    <div class="discovery-loading">
      <div class="loading-spinner"></div>
      <div class="loading-text">Loading party discovery system...</div>
    </div>
  `;

  try {
    // Initialize the discovery system
    const discoverySystem = new PartyDiscoverySystem();
    const initialized = await discoverySystem.initialize(container);
    
    if (!initialized) {
      throw new Error('Failed to initialize party discovery system');
    }

    // Set up any additional event listeners or customizations
    setupCustomEventHandlers(discoverySystem);
    
    console.log('Party Discovery System initialized successfully');
    
  } catch (error) {
    console.error('Failed to initialize Party Discovery System:', error);
    showErrorState(container, error.message);
  }
});

/**
 * Set up custom event handlers for the discovery system
 */
function setupCustomEventHandlers(discoverySystem) {
  // Listen for when user saves/unsaves events
  document.addEventListener('party-saved', (event) => {
    console.log('Event saved:', event.detail);
    // You could send this to analytics, update other UI components, etc.
  });

  document.addEventListener('party-unsaved', (event) => {
    console.log('Event removed from schedule:', event.detail);
  });

  // Listen for calendar additions
  document.addEventListener('calendar-added', (event) => {
    console.log('Event added to calendar:', event.detail);
    // Track conversion metrics, show success notifications, etc.
  });

  // Listen for venue selections from map
  document.addEventListener('venue-selected', (event) => {
    console.log('Venue selected:', event.detail.venue);
    // You could update other parts of your app, track engagement, etc.
  });

  // Set up keyboard shortcuts
  document.addEventListener('keydown', (event) => {
    // Ctrl/Cmd + K to focus search
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      const searchInput = document.querySelector('.search-input');
      if (searchInput) {
        searchInput.focus();
      }
    }

    // Escape key to clear search
    if (event.key === 'Escape') {
      const searchInput = document.querySelector('.search-input');
      if (searchInput && searchInput.value) {
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input'));
      }
    }
  });
}

/**
 * Show error state when initialization fails
 */
function showErrorState(container, errorMessage) {
  container.innerHTML = `
    <div class="discovery-error">
      <div class="error-icon">⚠️</div>
      <div class="error-title">Failed to Load Party Discovery</div>
      <div class="error-message">${errorMessage}</div>
      <button class="error-retry" onclick="location.reload()">
        Try Again
      </button>
    </div>
  `;
}

/**
 * Example of how to programmatically interact with the discovery system
 */
window.PartyDiscoveryAPI = {
  // Search for specific events
  search: async (query) => {
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
      searchInput.value = query;
      searchInput.dispatchEvent(new Event('input'));
    }
  },

  // Navigate to specific view
  switchView: (viewName) => {
    const navTab = document.querySelector(`[data-view="${viewName}"]`);
    if (navTab) {
      navTab.click();
    }
  },

  // Get currently saved events
  getSavedEvents: () => {
    try {
      return JSON.parse(localStorage.getItem('party-saved-events') || '[]');
    } catch {
      return [];
    }
  },

  // Export schedule programmatically
  exportSchedule: () => {
    const exportButton = document.querySelector('[data-action="export-schedule"]');
    if (exportButton) {
      exportButton.click();
    }
  },

  // Clear all saved events
  clearSchedule: () => {
    const clearButton = document.querySelector('[data-action="clear-schedule"]');
    if (clearButton) {
      clearButton.click();
    }
  }
};

// Make API available globally for debugging/testing
if (typeof window !== 'undefined') {
  window.PartyDiscoveryAPI = window.PartyDiscoveryAPI;
}

// CSS for loading and error states
const styles = `
  .discovery-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 400px;
    color: var(--color-text-dim, #9aa4b2);
  }

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--color-border, rgba(255,255,255,0.08));
    border-top-color: var(--color-accent, #6b7bff);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  .loading-text {
    font-size: 0.9375rem;
    font-weight: 500;
  }

  .discovery-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 400px;
    padding: 2rem;
    text-align: center;
    color: var(--color-text-dim, #9aa4b2);
  }

  .error-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .error-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text, #e8ecf1);
    margin-bottom: 0.5rem;
  }

  .error-message {
    font-size: 0.9375rem;
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }

  .error-retry {
    padding: 0.75rem 1.5rem;
    background: var(--color-accent, #6b7bff);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .error-retry:hover {
    background: var(--color-accent-strong, #6366f1);
    transform: translateY(-1px);
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

// Inject styles
const styleElement = document.createElement('style');
styleElement.textContent = styles;
document.head.appendChild(styleElement);

export { PartyDiscoverySystem };