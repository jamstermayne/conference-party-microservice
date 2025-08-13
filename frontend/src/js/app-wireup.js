import { route, currentRoute, bindSidebar } from './router.js';
import Events from '/assets/js/events.js';

(function boot(){
  console.log('✅ App wire-up complete');
  bindSidebar();
  const r = currentRoute();
  route(r);
  Events.emit?.('app:ready');
})();