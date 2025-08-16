import { ensureMapsReady } from '../services/maps-loader.js';

export async function mountMap(container, opts = {}) {
  await ensureMapsReady(opts);
  // Ensure container has minimum height
  if ((parseFloat(getComputedStyle(container).height) || 0) < 200) {
    container.style.minHeight = '60vh';
  }
  // Create map with Cologne center (Gamescom location)
  const map = new google.maps.Map(container, { 
    center: { lat: 50.9375, lng: 6.9603 }, 
    zoom: 13, 
    mapId: 'DEMO_MAP_ID' 
  });
  // Add demo marker
  const pin = document.createElement('div');
  pin.textContent = '★';
  pin.style.fontSize = '22px';
  new google.maps.marker.AdvancedMarkerElement({ 
    map, 
    position: { lat: 50.9375, lng: 6.9603 }, 
    content: pin 
  });
  return map;
}

export async function mountMapInto(selector, opts = {}) {
  const el = document.querySelector(selector) || document.getElementById('map') || document.querySelector('#map-container');
  if (!el) throw new Error('Map container not found');
  return mountMap(el, opts);
}