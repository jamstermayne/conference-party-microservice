// router-stack.js - Minimal hash router with Map support
import { mountMapPanel } from './panels/mount-map.js';

(function() {
  // Hide all panels
  function hideAllPanels() {
    document.querySelectorAll('section[data-panel]').forEach(panel => {
      panel.style.display = 'none';
    });
  }
  
  // Show specific panel
  function showPanel(panelName) {
    hideAllPanels();
    const panel = document.querySelector(`section[data-panel="${panelName}"]`);
    if (panel) {
      panel.style.display = 'block';
    }
  }
  
  // Sync day-subnav visibility
  function syncDaySubnav(visible) {
    const subnav = document.querySelector('.day-subnav') || document.querySelector('[data-subnav="day"]');
    if (subnav) {
      subnav.style.display = visible ? 'flex' : 'none';
    }
  }
  
  // Route handler
  async function handleRoute() {
    const hash = window.location.hash || '#/home';
    const [route, ...params] = hash.slice(2).split('/'); // Remove #/ prefix
    
    console.log('[router] Handling route:', route, params);
    
    // Hide day-subnav by default
    syncDaySubnav(false);
    
    switch(route) {
      case 'home':
      case '':
        showPanel('home');
        break;
        
      case 'map':
        // Show day-subnav for map routes
        syncDaySubnav(true);
        
        // Get date parameter if provided (e.g., #/map/2025-08-22)
        const dateISO = params[0] || null;
        
        try {
          await mountMapPanel(dateISO);
        } catch (error) {
          console.error('[router] Failed to mount map:', error);
        }
        break;
        
      default:
        // Try to show panel by name
        showPanel(route);
        break;
    }
  }
  
  // Initialize router
  function initRouter() {
    // Handle initial route
    handleRoute();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleRoute);
    
    // Set default route if none
    if (!window.location.hash) {
      window.location.hash = '#/home';
    }
  }
  
  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRouter);
  } else {
    initRouter();
  }
  
  // Export for other modules
  window.router = {
    navigate: (path) => {
      window.location.hash = path.startsWith('#') ? path : `#/${path}`;
    },
    refresh: handleRoute
  };
})();