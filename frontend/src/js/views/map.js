/**
 * Unified Map View
 * Shows party markers on Google Maps
 */

const API_BASE = window.__ENV?.API_BASE || '/api';
const COLOGNE_CENTER = { lat: 50.9375, lng: 6.9603 }; // Cologne city center

// Store map instance and markers
let mapInstance = null;
let markers = [];
let markersVisible = true;

/**
 * Wait for Google Maps to be loaded
 * Maps script is loaded in index.html with libraries=marker
 */
async function loadGoogleMaps() {
  // Check if already loaded
  if (window.google?.maps?.marker?.AdvancedMarkerElement) {
    return true;
  }

  // Wait for script load event or check if it's already loading
  return new Promise((resolve, reject) => {
    // Find the Maps script tag
    const mapScript = document.querySelector('script[src*="maps.googleapis.com"]');
    
    if (!mapScript) {
      reject(new Error('Google Maps script not found. Please check index.html'));
      return;
    }
    
    // Set up load handler
    const checkLoaded = () => {
      if (window.google?.maps?.marker?.AdvancedMarkerElement) {
        resolve(true);
      } else {
        // Wait a bit more for the library to fully initialize
        setTimeout(() => {
          if (window.google?.maps?.marker?.AdvancedMarkerElement) {
            resolve(true);
          } else {
            reject(new Error('Google Maps loaded but marker library not available'));
          }
        }, 500);
      }
    };
    
    // If script is already loaded, check immediately
    if (mapScript.loaded || window.google?.maps) {
      checkLoaded();
    } else {
      // Wait for script to load
      mapScript.addEventListener('load', checkLoaded);
      mapScript.addEventListener('error', () => {
        reject(new Error('Failed to load Google Maps script'));
      });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Google Maps loading timeout'));
      }, 10000);
    }
  });
}

/**
 * Fetch party data from API
 */
async function fetchParties() {
  try {
    const response = await fetch(`${API_BASE}/parties?conference=gamescom2025`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data?.data || [];
  } catch (error) {
    console.error('Failed to fetch parties:', error);
    return [];
  }
}

/**
 * Geocode venue to coordinates (simple mapping for known venues)
 */
function geocodeVenue(venue) {
  const knownVenues = {
    'Kölnmesse Confex': { lat: 50.9473, lng: 6.9830 },
    'Bootshaus': { lat: 50.9322, lng: 6.9642 },
    'Gamescom City Hub': { lat: 50.9413, lng: 6.9583 },
    'Friesenplatz': { lat: 50.9404, lng: 6.9396 },
    'Lanxess Arena': { lat: 50.9384, lng: 6.9830 },
    'Koln Triangle': { lat: 50.9413, lng: 6.9719 },
    'Hohenzollernring': { lat: 50.9384, lng: 6.9396 },
    'Koelnmesse': { lat: 50.9473, lng: 6.9830 },
    'Cologne Cathedral': { lat: 50.9413, lng: 6.9583 },
    'MediaPark': { lat: 50.9486, lng: 6.9442 }
  };
  
  // Check for exact match or partial match
  for (const [name, coords] of Object.entries(knownVenues)) {
    if (venue && (venue.includes(name) || name.includes(venue))) {
      return coords;
    }
  }
  
  // Generate pseudo-random position near Cologne for unknown venues
  if (venue) {
    const hash = venue.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const offsetLat = (hash % 100 - 50) * 0.001;
    const offsetLng = ((hash >> 8) % 100 - 50) * 0.001;
    return {
      lat: COLOGNE_CENTER.lat + offsetLat,
      lng: COLOGNE_CENTER.lng + offsetLng
    };
  }
  
  return COLOGNE_CENTER;
}

/**
 * Create info window content for marker
 */
function createInfoContent(party) {
  return `
    <div style="font-family: system-ui; max-width: 250px;">
      <h3 style="margin: 0 0 8px; color: #1a1a1a;">${party.title || 'Event'}</h3>
      <p style="margin: 4px 0; color: #666;">
        📍 ${party.venue || 'TBA'}<br>
        📅 ${party.date || ''} ${party.time || ''}<br>
        ${party.price ? `💰 ${party.price}` : ''}
      </p>
      ${party.description ? `<p style="margin: 8px 0 0; color: #666; font-size: 13px;">${party.description}</p>` : ''}
    </div>
  `;
}

/**
 * Initialize map with markers
 */
async function initializeMap(container, parties) {
  // Create map with mapId for AdvancedMarkerElement
  mapInstance = new google.maps.Map(container, {
    center: COLOGNE_CENTER,
    zoom: 13,
    mapId: 'conference_party_map', // Required for AdvancedMarkerElement
    styles: [
      {
        featureType: 'all',
        elementType: 'geometry',
        stylers: [{ color: '#242f3e' }]
      },
      {
        featureType: 'all',
        elementType: 'labels.text.stroke',
        stylers: [{ color: '#242f3e' }]
      },
      {
        featureType: 'all',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#746855' }]
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#17263c' }]
      },
      {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#38414e' }]
      }
    ]
  });
  
  // Prepare data for markers
  const infoWindow = new google.maps.InfoWindow();
  
  parties.forEach(party => {
    const position = geocodeVenue(party.venue);
    
    // Create custom marker content
    const markerContent = document.createElement('div');
    markerContent.style.cssText = `
      width: 24px;
      height: 24px;
      background: #8a6bff;
      border: 2px solid #ffffff;
      border-radius: 50%;
      cursor: pointer;
      transition: transform 0.2s;
    `;
    markerContent.title = party.title;
    
    // Add hover effect
    markerContent.addEventListener('mouseenter', () => {
      markerContent.style.transform = 'scale(1.2)';
    });
    markerContent.addEventListener('mouseleave', () => {
      markerContent.style.transform = 'scale(1)';
    });
    
    // Create AdvancedMarkerElement
    const marker = new google.maps.marker.AdvancedMarkerElement({
      position,
      map: mapInstance,
      content: markerContent,
      title: party.title
    });
    
    // Add click listener for info window
    marker.addListener('click', () => {
      infoWindow.setContent(createInfoContent(party));
      infoWindow.open({
        anchor: marker,
        map: mapInstance
      });
    });
    
    markers.push(marker);
  });
}

/**
 * Toggle markers visibility
 */
function toggleMarkers(visible) {
  markersVisible = visible;
  markers.forEach(marker => {
    // AdvancedMarkerElement uses map property instead of setMap
    marker.map = visible ? mapInstance : null;
  });
}

/**
 * Create map controls
 */
function createControls() {
  const controls = document.createElement('div');
  controls.className = 'map-controls';
  controls.innerHTML = `
    <label class="map-control">
      <input type="checkbox" id="toggle-markers" checked>
      <span>Markers</span>
    </label>
  `;
  
  // Add event listeners
  controls.querySelector('#toggle-markers').addEventListener('change', (e) => {
    toggleMarkers(e.target.checked);
  });
  
  return controls;
}

/**
 * Show error state
 */
function showError(container, message, retryFn) {
  container.innerHTML = `
    <div class="map-error">
      <div class="error-icon">⚠️</div>
      <h3>Unable to load map</h3>
      <p>${message}</p>
      <button class="btn-retry">Retry</button>
    </div>
  `;
  
  container.querySelector('.btn-retry')?.addEventListener('click', () => {
    container.innerHTML = '<div class="map-loading">Loading map...</div>';
    retryFn();
  });
}

/**
 * Main render function
 */
export async function renderMap(mount) {
  if (!mount) return;
  
  // Reset previous instance
  mapInstance = null;
  markers = [];
  markersVisible = true;
  
  // Create container structure
  mount.innerHTML = `
    <div class="map-container">
      <div class="map-loading">Loading map...</div>
    </div>
  `;
  
  // Add styles
  if (!document.querySelector('#map-styles')) {
    const style = document.createElement('style');
    style.id = 'map-styles';
    style.textContent = `
      .map-container {
        position: relative;
        width: 100%;
        height: 100vh;
        background: #0b0f17;
      }
      
      .map-loading {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #9aa7bf;
        font-size: 16px;
      }
      
      .map-error {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        color: #e8ecff;
      }
      
      .map-error .error-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
      
      .map-error h3 {
        margin: 0 0 8px;
        color: #e8ecff;
      }
      
      .map-error p {
        margin: 0 0 16px;
        color: #9aa7bf;
      }
      
      .btn-retry {
        padding: 8px 24px;
        background: linear-gradient(135deg, #6b8cff, #8a6bff);
        border: none;
        border-radius: 8px;
        color: white;
        font-size: 14px;
        cursor: pointer;
        transition: transform 0.2s;
      }
      
      .btn-retry:hover {
        transform: scale(1.05);
      }
      
      .map-controls {
        position: absolute;
        top: 16px;
        right: 16px;
        background: rgba(26, 33, 52, 0.95);
        border: 1px solid rgba(139, 129, 255, 0.3);
        border-radius: 8px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 100;
      }
      
      .map-control {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #e8ecff;
        font-size: 14px;
        cursor: pointer;
      }
      
      .map-control input[type="checkbox"] {
        width: 16px;
        height: 16px;
        cursor: pointer;
      }
      
      .map-control span {
        user-select: none;
      }
    `;
    document.head.appendChild(style);
  }
  
  const container = mount.querySelector('.map-container');
  
  async function loadMap() {
    try {
      // Load Google Maps
      await loadGoogleMaps();
      
      // Fetch party data
      const parties = await fetchParties();
      
      if (!parties.length) {
        showError(container, 'No event data available', loadMap);
        return;
      }
      
      // Clear loading state
      container.innerHTML = '';
      
      // Create map div
      const mapDiv = document.createElement('div');
      mapDiv.style.width = '100%';
      mapDiv.style.height = '100%';
      container.appendChild(mapDiv);
      
      // Initialize map with data
      await initializeMap(mapDiv, parties);
      
      // Add controls
      container.appendChild(createControls());
      
    } catch (error) {
      console.error('Map initialization failed:', error);
      showError(container, error.message || 'Failed to load map', loadMap);
    }
  }
  
  // Start loading
  loadMap();
}

export default { renderMap };