import { route, currentRoute, bindSidebar } from './router.js?v=b022';
import Events from '/assets/js/events.js?v=b022';

(function boot(){
  console.log('✅ App wire-up complete');
  bindSidebar();
  const r = currentRoute();
  route(r);
  Events.emit?.('app:ready');
})();