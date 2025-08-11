/**
 * Metrics shim - guarantees Metrics methods exist before pwa-install.js loads
 * Does NOT touch existing metrics code, just ensures methods are available
 */

// Ensure window.Metrics exists
if (!window.Metrics) {
  window.Metrics = {};
}

// Add missing methods if they don't exist
if (!window.Metrics.trackInstallPromptShown) {
  window.Metrics.trackInstallPromptShown = function(props = {}) {
    // Delegate to main track method if it exists, otherwise no-op
    if (typeof window.Metrics.track === 'function') {
      window.Metrics.track('install_prompt_shown', props);
    }
  };
}

if (!window.Metrics.trackInstallPromptAccepted) {
  window.Metrics.trackInstallPromptAccepted = function(props = {}) {
    // Delegate to main track method if it exists, otherwise no-op
    if (typeof window.Metrics.track === 'function') {
      window.Metrics.track('install_prompt_accepted', props);
    }
  };
}

if (!window.Metrics.trackRoute) {
  window.Metrics.trackRoute = function(name) {
    // Delegate to main track method if it exists, otherwise no-op
    if (typeof window.Metrics.track === 'function') {
      window.Metrics.track('route_change', { route: name });
    }
  };
}