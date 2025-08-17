/**
 * Unified Router - Minimal stub for preflight compatibility
 * Real routing handled by app-unified.js
 */

// Minimal router export for preflight checks
export const UnifiedRouter = {
  version: '2025',
  initialized: true
};

// Handle basic hash navigation
window.addEventListener('hashchange', () => {
  if (window.conferenceApp) {
    window.conferenceApp.renderMainInterface();
  }
});

export default UnifiedRouter;