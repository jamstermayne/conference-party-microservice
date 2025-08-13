import { initDrawer } from './drawer.js';
import { bindSidebar, route, currentRoute, renderNav } from '/js/sidebar.js';

// Render sidebar links & bind clicks
renderNav();
bindSidebar();

// Initialize drawer behavior
initDrawer();

// Initial route
route(location.hash);

// Keep title updated
import('/js/route-title.js').then(m => m.init?.());

// Optional: expose for debugging
window.__app = { route, currentRoute };