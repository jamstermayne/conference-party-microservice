// Ensures the sidebar is visible on load/reload and when navigating.
// This runs AFTER app-wireup.js to override any hiding

function ensureSidebarOpen() {
  document.body.classList.remove('nav-collapsed');
  const sidenav = document.getElementById('sidenav');
  if (sidenav) sidenav.dataset.state = 'open';
  
  // Force all nav items to be visible
  const navItems = document.querySelectorAll('#side-nav .nav-item');
  navItems.forEach(item => {
    item.style.display = '';
    item.hidden = false;
  });
}

// Run on multiple events to catch any late changes
document.addEventListener('DOMContentLoaded', ensureSidebarOpen);
window.addEventListener('load', ensureSidebarOpen);
document.addEventListener('flags:ready', () => setTimeout(ensureSidebarOpen, 10));

// Optional: if you use a Store,
// import Store from './store.js?v=b011';
// Store.patch('ui.sidebarOpen', true);