/* globals window, document */
(() => {
  if (window.__maps_loader_attached) return;
  window.__maps_loader_attached = true;

  // Promise others can await: window.whenMapsReady.then(maps => { ... })
  let resolveReady;
  window.whenMapsReady = new Promise(r => (resolveReady = r));

  // Already loaded?
  if (window.google?.maps?.marker?.AdvancedMarkerElement) {
    resolveReady(window.google.maps);
    return;
  }

  // Get key from meta tag or window variable
  const metaKey = document.querySelector('meta[name="maps-key"]')?.content;
  const key = window.__MAP_BROWSER_KEY || metaKey || '';
  
  const u = new URL('https://maps.googleapis.com/maps/api/js');
  u.searchParams.set('key', key);
  u.searchParams.set('v', 'weekly');
  u.searchParams.set('libraries', 'marker');
  u.searchParams.set('loading', 'async');

  const s = document.createElement('script');
  s.src = u.toString();
  s.defer = true;
  s.onerror = () => console.error('[maps-loader] failed:', s.src);
  s.onload  = () => window.google?.maps && resolveReady(window.google.maps);
  document.head.appendChild(s);
})();
