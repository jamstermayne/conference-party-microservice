// init-app.js - Initialize the app with wired home panel
import { renderHome } from './panels/home-wired.js';
import { wireGlobalButtons } from './wire-buttons.js';

// Wire buttons once on DOM ready
document.addEventListener('DOMContentLoaded', () => wireGlobalButtons(document));

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  // Render home panel
  renderHome();
  
  // Handle hash changes for deep linking
  window.addEventListener('hashchange', handleRoute);
}

function handleRoute() {
  const hash = location.hash || '#/home';
  
  // For now, just log the route change
  // In a full implementation, this would handle deep linking
  console.log('Route changed to:', hash);
  
  // If going back to home, re-render
  if (hash === '#/home' || hash === '#/' || hash === '') {
    renderHome();
  }
}