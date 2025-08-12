// app-wireup.js
import Events from './events.js';
import { initRouter } from './router.js'; // new API

document.addEventListener('DOMContentLoaded', () => {
  try {
    initRouter();               // boots sidebar clicks + initial route
    console.log('✅ App wire-up complete');
  } catch (e) {
    console.error('❌ App wire-up failed', e);
    Events.emit('ui:toast', { type: 'error', message: 'App failed to start' });
  }
});