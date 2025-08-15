/**
 * Settings page initialization
 * Hooks up the MTM integration when the page loads
 */

import { initMtmIntegration } from './settings-mtm.js';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize MTM integration
  initMtmIntegration();
  
  // Initialize other settings features if needed
  console.log('Settings page initialized');
});