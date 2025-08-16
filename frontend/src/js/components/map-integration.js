import { ensureMapsReady } from '../services/maps-loader.js';

export async function mountMapInto(selector) {
  await ensureMapsReady();
  const el = document.querySelector(selector) || document.getElementById('map') || document.querySelector('#map-container');
  if (!el) throw new Error('Map container not found');
  if ((parseFloat(getComputedStyle(el).height) || 0) < 200) el.style.minHeight = '60vh';
  const map = new google.maps.Map(el, { center:{lat:50.9375,lng:6.9603}, zoom:13, mapId:'DEMO_MAP_ID' });
  const pin = document.createElement('div'); pin.textContent = '★'; pin.style.fontSize='22px';
  new google.maps.marker.AdvancedMarkerElement({ map, position:{lat:50.9375,lng:6.9603}, content: pin });
  return map;
}