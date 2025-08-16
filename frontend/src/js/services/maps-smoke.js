// frontend/src/js/services/maps-smoke.js
import { ensureMapsReady } from './maps-loader.js';

export async function mapsSmoke(selector = '#_map_live') {
  await ensureMapsReady();
  const el = document.querySelector(selector) || Object.assign(document.body.appendChild(document.createElement('div')), {
    id: selector.replace(/^#/, ''), style: 'position:fixed;right:16px;bottom:16px;width:420px;height:280px;z-index:99999;border-radius:12px;overflow:hidden;background:#0b0f14'
  });
  const center = { lat: 50.9375, lng: 6.9603 };
  const map = new google.maps.Map(el, { mapId: 'DEMO_MAP_ID', center, zoom: 12 });
  new google.maps.marker.AdvancedMarkerElement({ map, position: center, title: 'Cologne' });
  return { ok: true, version: google.maps.version };
}

// Make available in console for testing
if (typeof window !== 'undefined') {
  window.mapsSmoke = mapsSmoke;
}