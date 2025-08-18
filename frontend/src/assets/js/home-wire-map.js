// home-wire-map.js - Wire map pills with markers
/* globals google */
import { showOverlay } from './overlay-panel.js';

// Extract coordinates from various formats
function getCoords(item) {
  // Try direct lat/lng
  if (item.lat && item.lng) {
    return { lat: parseFloat(item.lat), lng: parseFloat(item.lng) };
  }
  // Try latitude/longitude
  if (item.latitude && item.longitude) {
    return { lat: parseFloat(item.latitude), lng: parseFloat(item.longitude) };
  }
  // Try nested location
  if (item.location?.lat && item.location?.lng) {
    return { lat: parseFloat(item.location.lat), lng: parseFloat(item.location.lng) };
  }
  // Try nested coords
  if (item.coords?.lat && item.coords?.lng) {
    return { lat: parseFloat(item.coords.lat), lng: parseFloat(item.coords.lng) };
  }
  return null;
}

// Load and display map
async function loadMap(date) {
  const body = showOverlay(`Map — ${date}`);
  
  // Create map container
  const mapDiv = document.createElement('div');
  mapDiv.style.cssText = 'height: 70vh; width: 100%;';
  body.appendChild(mapDiv);
  
  // Wait for Google Maps to be available
  const waitForMaps = () => {
    if (typeof google !== 'undefined' && google.maps && google.maps.Map) {
      initMap();
    } else {
      setTimeout(waitForMaps, 100);
    }
  };
  
  const initMap = async () => {
    try {
      // Initialize map
      const map = new google.maps.Map(mapDiv, {
        zoom: 13,
        center: { lat: 50.9375, lng: 6.9603 }, // Cologne center
        mapId: window.__MAP_ID || 'DEMO_MAP_ID'
      });
      
      // Fetch parties data
      const response = await fetch('/api/parties?conference=gamescom2025');
      const data = await response.json();
      const parties = Array.isArray(data) ? data : (data.data || data.parties || []);
      
      // Filter by date and get items with coordinates
      const filtered = parties.filter(p => {
        const pDate = (p.date || p.start || p.startsAt || '').slice(0, 10);
        return pDate === date && getCoords(p);
      });
      
      if (filtered.length === 0) {
        const msg = document.createElement('div');
        msg.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: var(--text-muted, #999);
          text-align: center;
          background: white;
          padding: var(--s-4);
          border-radius: var(--r-2);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        `;
        msg.textContent = `No mappable items for ${date}.`;
        mapDiv.appendChild(msg);
        return;
      }
      
      // Add markers and fit bounds
      const bounds = new google.maps.LatLngBounds();
      
      filtered.forEach(party => {
        const coords = getCoords(party);
        if (coords) {
          // Create marker element
          const markerEl = document.createElement('div');
          markerEl.style.cssText = `
            width: 24px;
            height: 24px;
            background: var(--bg-interactive, #007bff);
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          `;
          
          // Add advanced marker
          new google.maps.marker.AdvancedMarkerElement({
            map,
            position: coords,
            content: markerEl,
            title: party.title || ''
          });
          
          bounds.extend(coords);
        }
      });
      
      // Fit map to markers with padding
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
      
    } catch (err) {
      body.innerHTML = `<div style="color: var(--text-error, #f00); padding: var(--s-4);">
        Failed to load map. Please try again.
      </div>`;
    }
  };
  
  waitForMaps();
}

// Wire up map pills
document.addEventListener('click', (e) => {
  const pill = e.target.closest('.home-section[data-section="map"] .day-pill');
  if (!pill) return;
  
  e.preventDefault();
  const date = pill.dataset.iso;
  if (date) loadMap(date);
});