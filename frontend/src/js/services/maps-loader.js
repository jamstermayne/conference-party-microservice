let mapsPromise;

export function ensureMapsReady() {
  // Return immediately if already loaded
  if (window.google?.maps?.marker?.AdvancedMarkerElement) {
    return Promise.resolve(window.google.maps);
  }
  
  // Return existing promise if loading
  if (mapsPromise) return mapsPromise;
  
  mapsPromise = new Promise((resolve, reject) => {
    // Check if script already exists
    const existing = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existing) {
      // Wait for existing script to load
      if (window.google?.maps?.marker?.AdvancedMarkerElement) {
        return resolve(window.google.maps);
      }
      
      // Set up load listener
      const checkLoaded = () => {
        if (window.google?.maps?.marker?.AdvancedMarkerElement) {
          resolve(window.google.maps);
        }
      };
      
      existing.addEventListener('load', checkLoaded, { once: true });
      existing.addEventListener('error', () => reject(new Error('Maps script failed to load')), { once: true });
      
      // Check again in case it loaded while we were setting up
      checkLoaded();
      return;
    }
    
    // Get API key from localStorage or meta tag
    let apiKey = localStorage.getItem('MAPS_BROWSER_KEY');
    
    if (!apiKey) {
      const metaTag = document.querySelector('meta[name="maps-key"]');
      apiKey = metaTag?.content;
    }
    
    if (!apiKey) {
      return reject(new Error('Maps API key not found. Please set MAPS_BROWSER_KEY in localStorage or add <meta name="maps-key"> tag.'));
    }
    
    // Create and inject script
    const script = document.createElement('script');
    script.id = 'maps-loader';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&libraries=marker&loading=async`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      // Wait for AdvancedMarkerElement to be ready
      const checkReady = () => {
        if (window.google?.maps?.marker?.AdvancedMarkerElement) {
          resolve(window.google.maps);
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load Google Maps script'));
    };
    
    document.head.appendChild(script);
  });
  
  return mapsPromise;
}