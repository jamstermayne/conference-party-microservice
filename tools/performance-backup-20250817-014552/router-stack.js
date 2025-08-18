// router-stack.js - Minimal hash router with Map support
import { mountMapPanel } from './panels/mount-map.js';
import { bootHome } from './init-app.js';
import { mountPartiesDay } from './panels/parties-day.js';
import { mountMapDay } from './panels/map-day.js';

export function navigateTo(hash) {
  if (!hash || !hash.startsWith('#/')) hash = '#/home';
  history.pushState(null, '', hash);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

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
        await bootHome();
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
    navigate: navigateTo,
    refresh: handleRoute
  };
})();

// Add simplified hashchange listener from patch
window.addEventListener('hashchange', async () => {
  const h = location.hash || '#/home';
  if (h === '#/home') return bootHome();
  const mParties = /^#\/parties\/(\d{4}-\d{2}-\d{2})$/.exec(h);
  if (mParties) return mountPartiesDay(mParties[1]);
  const mMap = /^#\/map\/(\d{4}-\d{2}-\d{2})$/.exec(h);
  if (mMap) return mountMapDay(mMap[1]);
  // Fallback: go home if unknown
  return bootHome();
});