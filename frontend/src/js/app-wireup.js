// App wireup - coordinates initialization
import { startRouter } from './router.js';
import Events from './events.js';

// Boot the app
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialize router
    await startRouter();
    
    // Mobile nav toggle
    const toggle = document.getElementById('nav-toggle');
    const sidenav = document.getElementById('sidenav');
    
    if (toggle && sidenav) {
      toggle.addEventListener('click', () => {
        sidenav.classList.toggle('show');
      });
      
      // Close on route change
      Events.on('navigate', () => {
        sidenav.classList.remove('show');
      });
    }
    
    // Route chip is handled by route-title.js
    
    // Track app loaded
    try {
      window.Metrics?.track?.('app_loaded', { 
        route: location.hash || '#/parties' 
      });
    } catch(e) {}
    
    console.log('✅ App wire-up complete');
  } catch (e) {
    console.error('❌ App wire-up failed', e);
    Events.emit('ui:toast', { type: 'error', message: 'App failed to start' });
  }
});

export default {};