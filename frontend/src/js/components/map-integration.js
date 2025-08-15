/**
 * Map Integration Component
 * Handles map UI interactions and venue display
 */

import { ensureMapsReady, initializeMap, createMarker } from '../services/maps-loader.js';

/**
 * Initialize map component in hotspots or venue views
 * @param {string} containerId - Container element ID
 * @param {Array} venues - Venue data array
 */
export async function initMapComponent(containerId, venues = []) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Map container not found: ${containerId}`);
    return;
  }

  try {
    // Add loading state
    container.innerHTML = `
      <div class="map-loading">
        <div class="spinner"></div>
        <p>Loading venue map...</p>
      </div>
    `;

    // Ensure Maps API is loaded
    await ensureMapsReady();

    // Create map container
    const mapElement = document.createElement('div');
    mapElement.className = 'venue-map';
    mapElement.style.width = '100%';
    mapElement.style.height = '400px';
    container.innerHTML = '';
    container.appendChild(mapElement);

    // Initialize map centered on Cologne/Gamescom
    const map = await initializeMap(mapElement, {
      center: { lat: 50.9423, lng: 6.9579 },
      zoom: 13
    });

    // Add venue markers
    const markers = [];
    const bounds = new google.maps.LatLngBounds();

    for (const venue of venues) {
      if (venue.lat && venue.lng) {
        const position = { lat: venue.lat, lng: venue.lng };
        
        // Create custom marker content
        const markerContent = document.createElement('div');
        markerContent.className = 'custom-marker';
        markerContent.innerHTML = `
          <div class="marker-icon ${venue.crowdLevel > 70 ? 'hot' : ''}">
            ${venue.crowdLevel > 70 ? '🔥' : '📍'}
          </div>
          <div class="marker-label">${venue.name}</div>
        `;

        const marker = await createMarker(map, {
          position,
          content: markerContent,
          title: venue.name
        });

        // Add click handler
        marker.addListener('click', () => {
          showVenueInfo(venue, map, marker);
        });

        markers.push(marker);
        bounds.extend(position);
      }
    }

    // Fit map to show all markers
    if (markers.length > 0) {
      map.fitBounds(bounds);
    }

    // Add venue list below map
    addVenueList(container, venues, markers, map);

    return { map, markers };

  } catch (error) {
    console.error('Failed to initialize map:', error);
    container.innerHTML = `
      <div class="map-error">
        <p>Unable to load venue map</p>
        <button onclick="location.reload()">Retry</button>
      </div>
    `;
  }
}

/**
 * Show venue info window on marker click
 * @param {Object} venue - Venue data
 * @param {google.maps.Map} map - Map instance
 * @param {google.maps.marker.AdvancedMarkerElement} marker - Marker instance
 */
function showVenueInfo(venue, map, marker) {
  // Close any existing info windows
  if (window.currentInfoWindow) {
    window.currentInfoWindow.close();
  }

  const infoWindow = new google.maps.InfoWindow({
    content: `
      <div class="venue-info">
        <h3>${venue.name}</h3>
        <p class="crowd-level">
          ${venue.crowdLevel > 70 ? '🔥' : '👥'} 
          Crowd: ${venue.crowdLevel}%
        </p>
        <p class="address">${venue.address || 'Cologne, Germany'}</p>
        <div class="actions">
          <button onclick="getDirections(${venue.lat}, ${venue.lng})">
            Get Directions
          </button>
        </div>
      </div>
    `,
    maxWidth: 300
  });

  infoWindow.open(map, marker);
  window.currentInfoWindow = infoWindow;
}

/**
 * Add venue list with map interaction
 * @param {HTMLElement} container - Container element
 * @param {Array} venues - Venue data
 * @param {Array} markers - Map markers
 * @param {google.maps.Map} map - Map instance
 */
function addVenueList(container, venues, markers, map) {
  const listContainer = document.createElement('div');
  listContainer.className = 'venue-list';
  listContainer.innerHTML = `
    <h3>Venue Activity</h3>
    <div class="venue-items">
      ${venues.map((venue, index) => `
        <div class="venue-item ${venue.crowdLevel > 70 ? 'hot' : ''}" 
             data-venue-index="${index}">
          <div class="venue-icon">
            ${venue.crowdLevel > 70 ? '🔥' : '📍'}
          </div>
          <div class="venue-details">
            <h4>${venue.name}</h4>
            <p class="crowd">Crowd: ${venue.crowdLevel}%</p>
          </div>
          <div class="venue-actions">
            <button class="btn-icon" onclick="focusVenue(${index})" title="Show on map">
              🗺️
            </button>
            <button class="btn-icon" onclick="getDirections(${venue.lat}, ${venue.lng})" title="Get directions">
              🧭
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  container.appendChild(listContainer);

  // Make venue focus function available globally
  window.focusVenue = (index) => {
    const marker = markers[index];
    const venue = venues[index];
    if (marker && venue) {
      map.setCenter(marker.position);
      map.setZoom(16);
      showVenueInfo(venue, map, marker);
    }
  };
}

/**
 * Get directions to venue using Google Maps
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 */
window.getDirections = function(lat, lng) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  window.open(url, '_blank', 'noopener');
};

/**
 * Update venue heat on map
 * @param {Array} venues - Updated venue data
 * @param {Array} markers - Existing markers
 */
export async function updateVenueHeat(venues, markers) {
  for (let i = 0; i < venues.length && i < markers.length; i++) {
    const venue = venues[i];
    const marker = markers[i];
    
    // Update marker appearance based on crowd level
    if (marker.content) {
      const isHot = venue.crowdLevel > 70;
      marker.content.className = `custom-marker ${isHot ? 'hot' : ''}`;
      marker.content.querySelector('.marker-icon').innerHTML = isHot ? '🔥' : '📍';
    }
  }
}

// Add CSS for map components
const style = document.createElement('style');
style.textContent = `
  .map-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    color: var(--text-secondary);
  }

  .map-loading .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border-primary);
    border-top-color: var(--accent-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .venue-map {
    border-radius: var(--r-lg);
    overflow: hidden;
    box-shadow: var(--shadow-card);
  }

  .custom-marker {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .marker-icon {
    font-size: 24px;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
  }

  .marker-icon.hot {
    animation: pulse 2s infinite;
  }

  .marker-label {
    margin-top: 4px;
    padding: 2px 6px;
    background: var(--bg-elev-2);
    border-radius: var(--r-sm);
    font-size: 12px;
    white-space: nowrap;
    box-shadow: var(--shadow-sm);
  }

  .venue-info {
    padding: var(--s-3);
  }

  .venue-info h3 {
    margin: 0 0 var(--s-2);
    color: var(--text-primary);
  }

  .venue-info .crowd-level {
    font-weight: 600;
    color: var(--text-secondary);
  }

  .venue-info .actions {
    margin-top: var(--s-3);
  }

  .venue-info button {
    padding: var(--s-2) var(--s-3);
    background: var(--accent-primary);
    color: white;
    border: none;
    border-radius: var(--r-md);
    cursor: pointer;
  }

  .venue-list {
    margin-top: var(--s-5);
  }

  .venue-list h3 {
    margin-bottom: var(--s-3);
    color: var(--text-primary);
  }

  .venue-items {
    display: flex;
    flex-direction: column;
    gap: var(--s-3);
  }

  .venue-item {
    display: flex;
    align-items: center;
    padding: var(--s-3);
    background: var(--bg-card);
    border-radius: var(--r-lg);
    border: 1px solid var(--border-primary);
    transition: all 0.2s;
  }

  .venue-item:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-hover);
  }

  .venue-item.hot {
    border-color: var(--danger);
    background: var(--bg-danger-subtle);
  }

  .venue-icon {
    font-size: 24px;
    margin-right: var(--s-3);
  }

  .venue-details {
    flex: 1;
  }

  .venue-details h4 {
    margin: 0 0 var(--s-1);
    color: var(--text-primary);
  }

  .venue-details .crowd {
    margin: 0;
    color: var(--text-secondary);
    font-size: 14px;
  }

  .venue-actions {
    display: flex;
    gap: var(--s-2);
  }

  .btn-icon {
    padding: var(--s-2);
    background: transparent;
    border: 1px solid var(--border-primary);
    border-radius: var(--r-md);
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-icon:hover {
    background: var(--bg-elev-1);
    transform: scale(1.1);
  }

  .map-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    text-align: center;
  }

  .map-error p {
    color: var(--text-secondary);
    margin-bottom: var(--s-4);
  }

  .map-error button {
    padding: var(--s-3) var(--s-4);
    background: var(--accent-primary);
    color: white;
    border: none;
    border-radius: var(--r-md);
    cursor: pointer;
  }
`;
document.head.appendChild(style);

// Export functions
export default {
  initMapComponent,
  updateVenueHeat
};