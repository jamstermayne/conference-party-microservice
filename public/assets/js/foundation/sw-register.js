// Service Worker registration + update UX (toast-based)
import Events from './events.js';

function toast(message, type='info'){
  try {
    document.dispatchEvent(new CustomEvent('ui:toast', { detail:{ message, type }}));
  } catch(_){ console.log(`[${type}]`, message); }
}

export function registerSW(){
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('/sw.js').then(reg=>{
      // Update flow
      function onUpdateFound(){
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', ()=>{
          if (sw.state === 'installed'){
            if (navigator.serviceWorker.controller){
              toast('Update available. Reload to apply.', 'info');
              Events.emit('sw:update');
              // Optional auto-reload after idle:
              // setTimeout(()=> location.reload(), 3000);
            } else {
              Events.emit('sw:ready');
            }
          }
        });
      }
      reg.addEventListener('updatefound', onUpdateFound);
      // Check periodically
      setInterval(()=> reg.update().catch(()=>{}), 60*1000);
    }).catch(()=>{ /* noop */ });
  });
}
registerSW();
export default { registerSW };