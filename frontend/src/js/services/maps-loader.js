let mapsPromise;
export function ensureMapsReady() {
  if (window.google?.maps?.marker?.AdvancedMarkerElement) return Promise.resolve(window.google.maps);
  if (mapsPromise) return mapsPromise;
  // If loader script is already on page, wait for onload; otherwise inject it (no key here).
  mapsPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('maps-loader');
    if (!existing) return reject(new Error('Maps loader <script id="maps-loader"> not found'));
    if (window.google?.maps) return resolve(window.google.maps);
    existing.addEventListener('load', () => resolve(window.google.maps), { once:true });
    existing.addEventListener('error', () => reject(new Error('Maps script failed to load')), { once:true });
  });
  return mapsPromise;
}