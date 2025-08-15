/**
 * Google Maps Loader Service
 * Handles async loading and initialization of Google Maps API
 * Uses dynamic imports for optimal performance
 */

// Maps API configuration
const MAPS_CONFIG = {
  apiKey: window.GOOGLE_MAPS_API_KEY || 'YOUR_PROD_KEY',
  version: 'weekly',
  libraries: ['maps', 'marker', 'places', 'geometry'],
  language: 'en',
  region: 'US'
};

let mapsLoadPromise = null;
let isLoaded = false;

/**
 * Ensure Google Maps API is loaded and ready
 * @returns {Promise<void>}
 */
export async function ensureMapsReady() {
  if (isLoaded && window.google?.maps?.importLibrary) {
    return;
  }

  if (!mapsLoadPromise) {
    mapsLoadPromise = loadMapsScript();
  }

  await mapsLoadPromise;
  isLoaded = true;
}

/**
 * Load Google Maps script dynamically
 * @returns {Promise<void>}
 */
async function loadMapsScript() {
  // Check if already loading or loaded
  if (window.google?.maps?.importLibrary) {
    return;
  }

  // Check if script tag already exists
  const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
  if (existingScript) {
    // Wait for existing script to load
    await waitForMapsAPI();
    return;
  }

  // Create and load script
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_CONFIG.apiKey}&v=${MAPS_CONFIG.version}&loading=async`;
  script.defer = true;
  script.async = true;
  
  const loadPromise = new Promise((resolve, reject) => {
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load Google Maps API'));
  });

  document.head.appendChild(script);
  await loadPromise;
  
  // Wait for API to be fully initialized
  await waitForMapsAPI();
}

/**
 * Wait for Maps API to be fully loaded
 * @returns {Promise<void>}
 */
async function waitForMapsAPI() {
  const timeout = 10000; // 10 seconds
  const startTime = Date.now();
  
  while (!window.google?.maps?.importLibrary) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Google Maps API failed to initialize');
    }
    await new Promise(resolve => setTimeout(resolve, 25));
  }
}

/**
 * Initialize a Google Map on an element
 * @param {HTMLElement} element - DOM element for the map
 * @param {Object} options - Map options
 * @returns {Promise<google.maps.Map>}
 */
export async function initializeMap(element, options = {}) {
  await ensureMapsReady();
  
  const { Map } = await google.maps.importLibrary('maps');
  
  const defaultOptions = {
    center: { lat: 50.9423, lng: 6.9579 }, // Cologne, Germany (Gamescom location)
    zoom: 14,
    mapTypeControl: false,
    fullscreenControl: false,
    streetViewControl: false,
    zoomControl: true,
    styles: getMapStyles()
  };
  
  return new Map(element, { ...defaultOptions, ...options });
}

/**
 * Create an advanced marker on the map
 * @param {google.maps.Map} map - Map instance
 * @param {Object} options - Marker options
 * @returns {Promise<google.maps.marker.AdvancedMarkerElement>}
 */
export async function createMarker(map, options = {}) {
  await ensureMapsReady();
  
  const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary('marker');
  
  // Create custom pin if style options provided
  let content = options.content;
  if (!content && (options.background || options.borderColor || options.glyphColor)) {
    const pin = new PinElement({
      background: options.background || '#FF6B6B',
      borderColor: options.borderColor || '#C92A2A',
      glyphColor: options.glyphColor || '#FFFFFF',
      glyph: options.glyph || '📍'
    });
    content = pin.element;
  }
  
  return new AdvancedMarkerElement({
    map,
    position: options.position,
    content,
    title: options.title
  });
}

/**
 * Open map panel with venue locations
 * @param {Array} venues - Array of venue objects with coordinates
 * @param {HTMLElement} containerElement - Container for the map
 */
export async function openMapPanel(venues, containerElement) {
  try {
    // Show loading state
    containerElement.innerHTML = '<div class="map-loading">Loading map...</div>';
    
    // Initialize map
    const map = await initializeMap(containerElement, {
      center: venues[0]?.coordinates || { lat: 50.9423, lng: 6.9579 },
      zoom: 13
    });
    
    // Add markers for each venue
    const markers = [];
    for (const venue of venues) {
      if (venue.coordinates) {
        const marker = await createMarker(map, {
          position: venue.coordinates,
          title: venue.name,
          background: venue.hot ? '#FF6B6B' : '#6C5CE7',
          glyph: venue.hot ? '🔥' : '📍'
        });
        markers.push(marker);
      }
    }
    
    // Fit bounds to show all markers
    if (markers.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      markers.forEach(marker => {
        bounds.extend(marker.position);
      });
      map.fitBounds(bounds);
    }
    
    return { map, markers };
    
  } catch (error) {
    console.error('Failed to open map panel:', error);
    containerElement.innerHTML = `
      <div class="map-error">
        <p>Unable to load map</p>
        <button onclick="location.reload()">Retry</button>
      </div>
    `;
    throw error;
  }
}

/**
 * Get custom map styles for dark theme
 * @returns {Array} Map styles array
 */
function getMapStyles() {
  return [
    {
      elementType: 'geometry',
      stylers: [{ color: '#242f3e' }]
    },
    {
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#242f3e' }]
    },
    {
      elementType: 'labels.text.fill',
      stylers: [{ color: '#746855' }]
    },
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }]
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }]
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [{ color: '#263c3f' }]
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#6b9a76' }]
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#38414e' }]
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#212a37' }]
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#9ca5b3' }]
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#746855' }]
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#1f2835' }]
    },
    {
      featureType: 'road.highway',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#f3d19c' }]
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#17263c' }]
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#515c6d' }]
    }
  ];
}

// Export for global access if needed
window.MapsLoader = {
  ensureMapsReady,
  initializeMap,
  createMarker,
  openMapPanel
};

export default {
  ensureMapsReady,
  initializeMap,
  createMarker,
  openMapPanel
};