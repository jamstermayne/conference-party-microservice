// frontend/src/js/services/maps-loader.js
const BASE = 'https://maps.googleapis.com/maps/api/js';
let pending = null;

function currentLoaderOnPage() {
  return [...document.scripts].find(s => s.src.startsWith(BASE));
}

export function getMapsKey() {
  // Prefer meta tag, then env, then global
  return (
    document.querySelector('meta[name="google-maps-key"]')?.content ||
    (typeof import !== 'undefined' && import.meta?.env?.VITE_MAPS_KEY) ||
    window.MAPS_KEY ||
    ''
  );
}

export function loadGoogleMaps({ key = getMapsKey(), version = 'weekly', libraries = 'marker' } = {}) {
  if (window.google?.maps?.marker?.AdvancedMarkerElement) return Promise.resolve('ready');
  if (pending) return pending;

  if (!key || /REPLACE_WITH_PROD_KEY/.test(key)) {
    throw new Error('Maps key missing. Provide via <meta name="google-maps-key" content="..."> or VITE_MAPS_KEY.');
  }
  const u = new URL(BASE);
  u.searchParams.set('key', key);
  u.searchParams.set('v', version);
  u.searchParams.set('libraries', libraries);
  u.searchParams.set('loading', 'async');

  // If a loader is already on page, don't double-load
  if (currentLoaderOnPage()) return Promise.resolve('loader-exists');

  const s = document.createElement('script');
  s.src = u.toString();
  s.defer = true;
  pending = new Promise((res, rej) => {
    s.onload = () => res('loaded');
    s.onerror = () => rej(new Error('Maps load failed'));
  });
  document.head.appendChild(s);
  return pending.finally(() => (pending = null));
}

export async function ensureMapsReady(opts) {
  await loadGoogleMaps(opts);
  // microtask to let API register components
  await new Promise(r => setTimeout(r, 0));
  if (!window.google?.maps?.marker?.AdvancedMarkerElement) {
    throw new Error('Maps API present but AdvancedMarker not ready');
  }
  return window.google.maps;
}