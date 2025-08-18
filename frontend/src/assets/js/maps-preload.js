/* maps-preload.js - Ensure Google Maps API loads early */
(() => {
  if (window.__MAPS_PRELOAD__) return;
  window.__MAPS_PRELOAD__ = true;

  const loadMaps = () => {
    // Check if already loading/loaded
    if (document.querySelector('script[src*="maps.googleapis.com"]')) return;
    if (window.google?.maps?.Map) return;

    // Get API key from meta tag
    const metaTag = document.querySelector('meta[name="maps-key"]');
    const apiKey = metaTag?.content || localStorage.getItem('MAPS_BROWSER_KEY');
    
    if (!apiKey || apiKey.includes('__REPLACE')) {
      console.warn('[maps-preload] No valid API key found');
      return;
    }

    // Create and inject script
    const script = document.createElement('script');
    script.id = 'maps-api-loader';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&libraries=marker&loading=async`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    console.log('[maps-preload] Maps API loading...');
  };

  // Load immediately
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadMaps, {once: true});
  } else {
    loadMaps();
  }
})();