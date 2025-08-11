// Emergency navigation fix - Ensure sidebar responds to clicks
// This is a failsafe to guarantee navigation works

console.log('🚨 Navigation Fix Loading...');

function emergencyNavigationFix() {
  console.log('🔧 Applying emergency navigation fix');
  
  // Wait for DOM
  const initNav = () => {
    const navItems = document.querySelectorAll('.nav-item[data-route]');
    console.log(`📱 Found ${navItems.length} navigation items`);
    
    navItems.forEach((item, index) => {
      // Remove any existing listeners
      item.replaceWith(item.cloneNode(true));
      const freshItem = document.querySelectorAll('.nav-item[data-route]')[index];
      
      freshItem.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const route = this.dataset.route;
        console.log(`🧭 Navigation clicked: ${route}`);
        
        // Clear all active states
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        
        // Set this as active
        this.classList.add('active');
        
        // Simple route mapping
        const routeMap = {
          'parties': '#/parties',
          'hotspots': '#/hotspots', 
          'opportunities': '#/opportunities',
          'calendar': '#/calendar',
          'invites': '#/invites',
          'me': '#/me'
        };
        
        const hash = routeMap[route] || `#/${route}`;
        window.location.hash = hash;
        
        // Emit custom event for other systems
        window.dispatchEvent(new CustomEvent('navigation-change', {
          detail: { route, hash }
        }));
        
        console.log(`✅ Navigation successful: ${route} -> ${hash}`);
      });
    });
    
    console.log('✅ Emergency navigation fix applied');
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }
}

// Apply fix immediately
emergencyNavigationFix();

export default emergencyNavigationFix;