import { route, currentRoute, bindSidebar } from './router.js?v=b023';
import Events from '/assets/js/events.js?v=b023';

(function boot(){
  console.log('✅ App wire-up complete');
  bindSidebar();
  const r = currentRoute();
  route(r);
  Events.emit?.('app:ready');
})();