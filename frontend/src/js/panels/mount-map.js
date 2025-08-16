// mount-map.js - Mount map panel with events
import { ensureMapsReady } from '../services/maps-loader.js';

export async function mountMapPanel(dateISO) {
  // Ensure container exists
  let container = document.querySelector('section[data-panel="map"]');
  if (!container) {
    container = document.createElement('section');
    container.setAttribute('data-panel', 'map');
    container.style.cssText = 'width: 100%; height: 100vh; display: none;';
    const main = document.getElementById('main') || document.getElementById('app');
    if (main) main.appendChild(container);
  }
  
  // Show the container
  container.style.display = 'block';
  
  // Create map container if needed
  if (!container.querySelector('#map-container')) {
    container.innerHTML = `<div id="map-container" style="width: 100%; height: 100%;"></div>`;
  }
  
  const mapContainer = container.querySelector('#map-container');
  
  try {
    // Ensure Maps API is loaded
    await ensureMapsReady();
    
    // Create map
    const map = new google.maps.Map(mapContainer, {
      center: { lat: 50.9384, lng: 6.9596 }, // Cologne center
      zoom: 12,
      mapId: 'DEMO_MAP_ID',
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false
    });
    
    // Fetch parties data
    const response = await fetch('/api/parties?conference=gamescom2025');
    const data = await response.json();
    
    // Handle both data structures
    const parties = data.data || data.parties || [];
    
    // Normalize and filter parties
    const markers = [];
    const bounds = new google.maps.LatLngBounds();
    
    parties.forEach(party => {
      // Normalize lat/lng fields
      const lat = party.lat || party.latitude;
      const lng = party.lng || party.lon || party.longitude;
      const title = party.title || party.name;
      const date = party.date || party.start_date;
      
      if (!lat || !lng) return;
      
      // Filter by date if provided
      if (dateISO && date) {
        const partyDate = date.slice(0, 10); // Get YYYY-MM-DD part
        if (partyDate !== dateISO) return;
      }
      
      const position = { lat: parseFloat(lat), lng: parseFloat(lng) };
      
      // Create pin element
      const pin = document.createElement('div');
      pin.innerHTML = '📍';
      pin.style.fontSize = '24px';
      pin.title = title || 'Event';
      
      // Create advanced marker
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position,
        content: pin,
        title: title || 'Event'
      });
      
      markers.push(marker);
      bounds.extend(position);
    });
    
    // Fit bounds if we have markers
    if (markers.length > 0) {
      map.fitBounds(bounds);
      // Prevent over-zoom
      const listener = google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom() > 16) map.setZoom(16);
        google.maps.event.removeListener(listener);
      });
    }
    
    console.log(`[mount-map] Created ${markers.length} markers${dateISO ? ' for ' + dateISO : ''}`);
    
  } catch (error) {
    console.error('[mount-map] Failed to mount map:', error);
    mapContainer.innerHTML = `
      <div style="padding: 2rem; text-align: center;">
        <h3>Unable to load map</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
}